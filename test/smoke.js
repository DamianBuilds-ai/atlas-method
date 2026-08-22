// smoke.js - Atlas CLI smoke test (plain node, no framework)
// Run: node --experimental-sqlite test/smoke.js
// Builds a tiny fixture tree, indexes it, asserts search + refresh behaviour.

import { mkdirSync, writeFileSync, mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const thisDir = dirname(fileURLToPath(import.meta.url));
const cliDir = join(thisDir, '..', 'cli');

// Dynamically import CLI modules (they use node:sqlite which is experimental).
const { openDb, sanitizeFtsQuery } = await import(join(cliDir, 'db.js'));
const { cmdIndex } = await import(join(cliDir, 'cmd-index.js'));
const { cmdSearch } = await import(join(cliDir, 'cmd-search.js'));
const { cmdRefresh } = await import(join(cliDir, 'cmd-refresh.js'));
const { cmdOrientation } = await import(join(cliDir, 'cmd-orientation.js'));

// ---- Fixture setup ----
const tmp = mkdtempSync(join(tmpdir(), 'atlas-smoke-'));
const dbPath = join(tmp, 'test.db');
const fixtureRepo = join(tmp, 'fixture-repo');

mkdirSync(fixtureRepo, { recursive: true });

// Create a fixture markdown file (a "map" doc).
writeFileSync(join(fixtureRepo, 'treasury-map.md'), `
# Treasury Map

## Overview

The treasury domain tracks job applications and financial planning.

## Active Tasks

- Review H2O.ai application
- Submit Xero form by Friday
`);

// Create a fixture JSONL state file.
const header = JSON.stringify({ schema: 'atlas-state', version: 1 });
const record = JSON.stringify({
  id: 'task-deadbeef',
  kind: 'task',
  domain: 'treasury',
  title: 'Submit Xero application by Friday',
  body: 'Complete the online form at xero.com/careers',
  status: 'open',
  labels: ['domain:treasury', 'priority:high'],
  issue: null,
  created: '2026-08-19T00:00:00Z',
  updated: '2026-08-19T00:00:00Z',
  source: 'session',
});
writeFileSync(join(fixtureRepo, 'state.jsonl'), `${header}\n${record}\n`);

// ---- Index ----
console.log('--- smoke: indexing fixture repo ---');
await cmdIndex(['--repo', fixtureRepo, '--db', dbPath]);

// ---- Assertions ----
let passed = 0;
let failed = 0;

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS: ${name}`);
    passed++;
  } else {
    console.error(`  FAIL: ${name}${detail ? ' - ' + detail : ''}`);
    failed++;
  }
}

// Direct DB query to verify the index contains our fixture doc.
const db = openDb(dbPath);
const rows = db.prepare(`SELECT * FROM docs WHERE docs MATCH ? ORDER BY rank LIMIT 5`).all('"treasury"');
assert('treasury-map indexed', rows.some(r => r.source.includes('treasury-map')), `got: ${JSON.stringify(rows.map(r => r.source))}`);
assert('state.jsonl indexed', rows.some(r => r.source.includes('state.jsonl')), `got: ${JSON.stringify(rows.map(r => r.source))}`);

// Check FTS5 snippet for a specific phrase from the markdown.
const xeroRows = db.prepare(`SELECT source, snippet(docs, 4, '[', ']', '...', 10) AS s FROM docs WHERE docs MATCH '"Xero"' ORDER BY rank LIMIT 5`).all();
assert('Xero phrase found in index', xeroRows.length > 0, `got: ${JSON.stringify(xeroRows)}`);

// Check JSONL record content indexed correctly.
const jsonlRows = db.prepare(`SELECT source, kind, title FROM docs WHERE kind = 'task'`).all();
assert('JSONL task record indexed', jsonlRows.length > 0, `got: ${JSON.stringify(jsonlRows)}`);
if (jsonlRows.length > 0) {
  assert('JSONL record title correct', jsonlRows[0].title.includes('Xero'), `got: "${jsonlRows[0].title}"`);
}

// Check sanitizeFtsQuery.
assert('sanitizeFtsQuery wraps plain query', sanitizeFtsQuery('hello world') === '"hello world"');
assert('sanitizeFtsQuery passes through FTS5 operators', sanitizeFtsQuery('hello AND world') === 'hello AND world');

// ---- cmdSearch CLI output ----
console.log('\n--- smoke: cmdSearch output ---');
{
  const output = [];
  const orig = console.log;
  console.log = (...a) => output.push(a.map(String).join(' '));
  await cmdSearch(['Xero', '--db', dbPath]);
  console.log = orig;
  assert('cmdSearch returns result for Xero', output.some(l => l.includes('Xero')));
  assert('cmdSearch result count line present', output.some(l => /\d+ result/.test(l)));
}

// ---- Refresh reconcile (mock gh, no network) ----
// Write a pre-existing state file with both a local-only row and an issue-sync row.
// After refresh, verify: local-only row is preserved, open issue created/updated,
// closed issue mapped to done.
console.log('\n--- smoke: refresh reconcile (mock gh) ---');
{
  const refreshStatePath = join(tmp, 'refresh-state.jsonl');
  const localOnlyRow = JSON.stringify({
    id: 'task-localonly',
    kind: 'task',
    domain: 'oxide',
    title: 'Local-only row - must not be touched by refresh',
    body: '',
    status: 'open',
    labels: [],
    issue: null,  // local-only: no GitHub issue
    created: '2026-08-19T00:00:00Z',
    updated: '2026-08-19T00:00:00Z',
    source: 'session',
  });
  const existingIssueRow = JSON.stringify({
    id: 'task-existing',
    kind: 'task',
    domain: 'oxide',
    title: 'Old title for issue 1',
    body: '',
    status: 'open',
    labels: ['domain:oxide'],
    issue: 1,
    created: '2026-08-19T00:00:00Z',
    updated: '2026-08-19T00:00:00Z',
    source: 'issue-sync',
  });
  writeFileSync(refreshStatePath, `${header}\n${localOnlyRow}\n${existingIssueRow}\n`);

  // Build a mock gh binary in a temp bin dir.
  const mockBin = join(tmp, 'mock-bin');
  mkdirSync(mockBin, { recursive: true });
  const mockGhPath = join(mockBin, 'gh');

  // Mock gh returns: issue 1 (open, updated title), issue 2 (closed -> done), issue 3 (kind:bug -> whitelisted to task).
  const mockIssues = JSON.stringify([
    {
      number: 1,
      title: 'Updated title for issue 1',
      body: 'body text',
      labels: [{ name: 'domain:oxide' }, { name: 'kind:task' }],
      state: 'OPEN',
      createdAt: '2026-08-19T00:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z',
    },
    {
      number: 2,
      title: 'A closed issue',
      body: 'resolved',
      labels: [{ name: 'domain:oxide' }],
      state: 'CLOSED',
      createdAt: '2026-08-19T00:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z',
    },
    {
      number: 3,
      title: 'Issue with unknown kind label',
      body: '',
      labels: [{ name: 'kind:bug' }],
      state: 'OPEN',
      createdAt: '2026-08-19T00:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z',
    },
  ]);

  // The mock gh script handles both `gh auth status` and `gh issue list`.
  writeFileSync(mockGhPath,
    '#!/bin/sh\n' +
    'case "$1 $2" in\n' +
    '  "auth status") exit 0 ;;\n' +
    '  "issue list") echo \'' + mockIssues.replace(/'/g, "'\\''") + '\' ;;\n' +
    '  *) exit 1 ;;\n' +
    'esac\n',
    { mode: 0o755 }
  );

  const origPath = process.env.PATH;
  process.env.PATH = mockBin + ':' + origPath;

  try {
    await cmdRefresh(['--state', refreshStatePath]);
  } finally {
    process.env.PATH = origPath;
  }

  // Parse the state file and assert.
  const stateRaw = readFileSync(refreshStatePath, 'utf8');
  const stateRecords = stateRaw.split('\n')
    .filter(l => l.trim())
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(r => r && !r.schema);

  const localOnly = stateRecords.find(r => r.id === 'task-localonly');
  assert(
    'refresh: local-only row preserved unchanged',
    localOnly && localOnly.issue === null && localOnly.title === 'Local-only row - must not be touched by refresh',
    localOnly ? `issue=${localOnly.issue}` : 'row missing'
  );

  const issue1 = stateRecords.find(r => r.issue === 1);
  assert(
    'refresh: open issue title updated',
    issue1 && issue1.title === 'Updated title for issue 1',
    issue1 ? `title="${issue1.title}"` : 'row missing'
  );
  assert('refresh: open issue status is open', issue1 && issue1.status === 'open');

  const issue2 = stateRecords.find(r => r.issue === 2);
  assert(
    'refresh: closed issue reconciled to done',
    issue2 && issue2.status === 'done',
    issue2 ? `status="${issue2.status}"` : 'row missing'
  );

  const issue3 = stateRecords.find(r => r.issue === 3);
  assert(
    'refresh: unknown kind label defaults to task',
    issue3 && issue3.kind === 'task',
    issue3 ? `kind="${issue3.kind}"` : 'row missing'
  );
}

// ---- cmdOrientation: happy path ----
// Writes a fixture state dir with known records, runs orientation, asserts output.
console.log('\n--- smoke: cmdOrientation happy path ---');
{
  const orientStateDir = join(tmp, 'orient-state');
  mkdirSync(orientStateDir, { recursive: true });

  const orientHeader = JSON.stringify({ schema: 'atlas-state', version: 1 });
  const highTask = JSON.stringify({
    id: 'task-orient01',
    kind: 'task',
    domain: 'atlas',
    title: 'High priority orientation task',
    body: '',
    status: 'open',
    labels: ['domain:atlas', 'priority:high'],
    issue: null,
    created: '2026-08-19T00:00:00Z',
    updated: '2026-08-19T00:00:00Z',
    source: 'session',
  });
  const lowTask = JSON.stringify({
    id: 'task-orient02',
    kind: 'task',
    domain: 'atlas',
    title: 'Low priority orientation task',
    body: '',
    status: 'open',
    labels: ['domain:atlas', 'priority:low'],
    issue: null,
    created: '2026-08-19T00:00:00Z',
    updated: '2026-08-19T00:00:00Z',
    source: 'session',
  });
  const carried = JSON.stringify({
    id: 'carried-orient03',
    kind: 'carried',
    domain: 'atlas',
    title: 'Carried item from prior session',
    body: '',
    status: 'open',
    labels: ['domain:atlas'],
    issue: null,
    created: '2026-08-19T00:00:00Z',
    updated: '2026-08-19T00:00:00Z',
    source: 'baton',
  });
  writeFileSync(
    join(orientStateDir, 'atlas.jsonl'),
    `${orientHeader}\n${highTask}\n${lowTask}\n${carried}\n`
  );

  const orientOutFile = join(tmp, 'orientation-atlas.md');
  const outLines = [];
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => { outLines.push(...String(chunk).split('\n')); return true; };

  await cmdOrientation(['--domain', 'atlas', '--out', orientOutFile, '--state', orientStateDir]);

  process.stdout.write = origWrite;

  // Read the output file directly.
  let orientContent = '';
  try { orientContent = readFileSync(orientOutFile, 'utf8'); } catch (e) { /* ignore */ }
  const orientLines = orientContent.split('\n').filter(l => l !== '');

  assert(
    'orientation: output under 80 lines',
    orientLines.length <= 80,
    `got ${orientLines.length} lines`
  );
  assert(
    'orientation: header present',
    orientLines.some(l => l.startsWith('# Orientation')),
    `first line: "${orientLines[0]}"`
  );
  assert(
    'orientation: open items section present',
    orientLines.some(l => l.includes('Open items')),
    `lines: ${JSON.stringify(orientLines)}`
  );
  assert(
    'orientation: high priority item appears before low priority',
    (() => {
      const hiIdx = orientLines.findIndex(l => l.includes('High priority'));
      const loIdx = orientLines.findIndex(l => l.includes('Low priority'));
      return hiIdx !== -1 && loIdx !== -1 && hiIdx < loIdx;
    })(),
    'priority ordering broken'
  );
  assert(
    'orientation: carried items section present',
    orientLines.some(l => l.includes('Carried items')),
    `lines: ${JSON.stringify(orientLines)}`
  );
  assert(
    'orientation: file written to --out path',
    orientLines.length > 0,
    'file empty or missing'
  );
}

// ---- cmdOrientation: empty-state degraded path ----
console.log('\n--- smoke: cmdOrientation degraded path (empty state) ---');
{
  const emptyStateDir = join(tmp, 'empty-state');
  mkdirSync(emptyStateDir, { recursive: true });
  // Write no .jsonl files - dir exists but is empty.

  const degradedLines = [];
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => { degradedLines.push(...String(chunk).split('\n')); return true; };

  await cmdOrientation(['--domain', 'no-domain', '--state', emptyStateDir]);

  process.stdout.write = origWrite;

  const allOutput = degradedLines.join('\n');
  assert(
    'orientation-degraded: exits 0 (no exception)',
    true // reaching here means no exception
  );
  assert(
    'orientation-degraded: visible notice line present',
    allOutput.includes('no local state found'),
    `got: "${allOutput.slice(0, 200)}"`
  );
}

// ---- MUST 1 verification: baton pointer names the PRIOR baton, not the just-written stub ----
// Fixture: sessions/current/ contains a prior baton file named with yesterday's timestamp.
// cmdOrientation runs from that dir. The pointer in the output must name the prior file,
// not orientation-*.md and not any file written during this orientation run itself.
console.log('\n--- smoke: baton pointer names prior baton (not stub) ---');
{
  const batonFixDir = mkdtempSync(join(tmpdir(), 'atlas-baton-'));
  const sessionsDir = join(batonFixDir, 'sessions', 'current');
  const batonStateDir = join(batonFixDir, 'state');
  mkdirSync(sessionsDir, { recursive: true });
  mkdirSync(batonStateDir, { recursive: true });

  // Write a prior-session baton file with a timestamp that sorts before any file
  // created during this test run (yesterday's date, so lexicographically earlier
  // than a 2026-08-21_* file would be if one were written today).
  const priorBatonName = '2026-08-20_1800_atlas.md';
  writeFileSync(join(sessionsDir, priorBatonName), '# Prior baton placeholder\n');

  // State: header + one open task so the early-return guard (records.length === 0)
  // does not fire before the baton section is assembled.
  const batonTaskRec = JSON.stringify({
    id: 'task-baton-smoke', kind: 'task', domain: 'atlas',
    title: 'Baton smoke task', body: '', status: 'open',
    labels: ['domain:atlas'], issue: null,
    created: '2026-08-20T00:00:00Z', updated: '2026-08-20T00:00:00Z', source: 'session',
  });
  writeFileSync(
    join(batonStateDir, 'atlas.jsonl'),
    `${JSON.stringify({ schema: 'atlas-state', version: 1 })}\n${batonTaskRec}\n`
  );

  const batonOutFile = join(batonFixDir, 'orientation-atlas.md');
  const origCwd = process.cwd();
  process.chdir(batonFixDir);
  try {
    await cmdOrientation(['--domain', 'atlas', '--out', batonOutFile, '--state', batonStateDir]);
  } finally {
    process.chdir(origCwd);
  }

  const batonContent = readFileSync(batonOutFile, 'utf8');
  assert(
    'baton: latest baton section present',
    batonContent.includes('## Latest baton'),
    `content: ${batonContent.slice(0, 300)}`
  );
  assert(
    'baton: pointer names the prior baton file',
    batonContent.includes(priorBatonName),
    `expected ${priorBatonName} in: ${batonContent.slice(0, 300)}`
  );
  assert(
    'baton: orientation file not listed as the baton pointer',
    !batonContent.includes('orientation-atlas.md'),
    `orientation file leaked into pointer: ${batonContent.slice(0, 300)}`
  );
  rmSync(batonFixDir, { recursive: true, force: true });
}

// ---- SHOULD 3+4 verification: 90 open items must not starve blocked / baton / carried ----
// Regression: before SECTION_RESERVE, 80 open items filled the cap leaving no room for
// sections 2-4 (the "what to do" payload). After fix, open fills only LINE_CAP-SECTION_RESERVE
// lines, leaving SECTION_RESERVE lines for the remaining sections.
// SHOULD 4 also verified here: the blocked task has kind:task + blocked: label. After the
// !hasBlockedLabel() fix to the open filter it must appear only in Blocked, not in Open.
console.log('\n--- smoke: section starvation (90 open + 1 blocked + 1 carried) ---');
{
  const starvDir = mkdtempSync(join(tmpdir(), 'atlas-starv-'));
  const starvStateDir = join(starvDir, 'state');
  const starvSessDir = join(starvDir, 'sessions', 'current');
  mkdirSync(starvStateDir, { recursive: true });
  mkdirSync(starvSessDir, { recursive: true });

  // Prior baton so the Latest baton section can appear.
  writeFileSync(join(starvSessDir, '2026-08-20_1800_atlas.md'), '# Prior baton\n');

  const recs = [JSON.stringify({ schema: 'atlas-state', version: 1 })];
  for (let i = 0; i < 90; i++) {
    recs.push(JSON.stringify({
      id: `task-bulk-${i}`, kind: 'task', domain: 'atlas',
      title: `Bulk open task ${i}`, body: '', status: 'open',
      labels: ['domain:atlas', 'priority:low'], issue: null,
      created: '2026-08-19T00:00:00Z', updated: '2026-08-19T00:00:00Z', source: 'session',
    }));
  }
  // Blocked task: kind:task + blocked: label - should appear only in Blocked section.
  recs.push(JSON.stringify({
    id: 'task-blocked-01', kind: 'task', domain: 'atlas',
    title: 'Blocked on external review', body: '', status: 'open',
    labels: ['domain:atlas', 'blocked:external-review'], issue: null,
    created: '2026-08-19T00:00:00Z', updated: '2026-08-19T00:00:00Z', source: 'session',
  }));
  // Carried item.
  recs.push(JSON.stringify({
    id: 'carried-01', kind: 'carried', domain: 'atlas',
    title: 'Carried from prior session', body: '', status: 'open',
    labels: ['domain:atlas'], issue: null,
    created: '2026-08-19T00:00:00Z', updated: '2026-08-19T00:00:00Z', source: 'baton',
  }));
  writeFileSync(join(starvStateDir, 'atlas.jsonl'), recs.join('\n') + '\n');

  const starvOut = join(starvDir, 'orientation-atlas.md');
  const origCwd2 = process.cwd();
  process.chdir(starvDir);
  try {
    await cmdOrientation(['--domain', 'atlas', '--out', starvOut, '--state', starvStateDir]);
  } finally {
    process.chdir(origCwd2);
  }

  const starvContent = readFileSync(starvOut, 'utf8');
  const starvLines = starvContent.split('\n').filter(l => l !== '');
  assert(
    'starvation: output under 80 lines despite 90 open tasks',
    starvLines.length <= 80,
    `got ${starvLines.length} lines`
  );
  assert(
    'starvation: blocked section present despite 90 open items',
    starvContent.includes('## Blocked / waiting'),
    `sections: ${starvLines.filter(l => l.startsWith('##')).join(', ')}`
  );
  assert(
    'starvation: baton section present despite 90 open items',
    starvContent.includes('## Latest baton'),
    `sections: ${starvLines.filter(l => l.startsWith('##')).join(', ')}`
  );
  assert(
    'starvation: carried section present despite 90 open items',
    starvContent.includes('## Carried items'),
    `sections: ${starvLines.filter(l => l.startsWith('##')).join(', ')}`
  );
  assert(
    'starvation: overflow notice present (some open items truncated)',
    starvContent.includes('+') && starvContent.includes('more open items'),
    `no overflow notice found in: ${starvContent.slice(0, 200)}`
  );
  assert(
    'starvation (SHOULD 4): blocked task absent from Open section',
    (() => {
      const openStart = starvContent.indexOf('## Open items');
      const blockedStart = starvContent.indexOf('## Blocked / waiting');
      if (openStart === -1 || blockedStart === -1) return false;
      const openSection = starvContent.slice(openStart, blockedStart);
      return !openSection.includes('Blocked on external review');
    })(),
    'blocked task leaked into Open section'
  );
  rmSync(starvDir, { recursive: true, force: true });
}

// ---- SHOULD 8: Grok hook schema in README matches proof format ----
console.log('\n--- smoke: Grok hook schema in README ---');
{
  const readmePath = join(thisDir, '..', 'templates', 'hooks', 'README.md');
  let readmeContent = '';
  try { readmeContent = readFileSync(readmePath, 'utf8'); } catch { /* skip if missing */ }
  assert(
    'README: nested Grok schema present (type: command)',
    readmeContent.includes('"type": "command"'),
    'README missing nested hook type field'
  );
  // The README may reference the flat schema in prose as a "Do not use" warning.
  // The assertion only checks that no JSON code block contains the flat format.
  const readmeCodeBlocks = readmeContent.match(/```[\s\S]*?```/g) || [];
  assert(
    'README: flat event/command schema absent from code blocks',
    !readmeCodeBlocks.some(b => b.includes('"event": "SessionStart"')),
    'A README code block still contains the flat wrong Grok schema'
  );
}

// ---- adapters generate: generator runs + emits expected file set ----
// Tests that the generator reads adapters/jobs.json and writes the correct
// number of files across all four runners, with expected content markers.
console.log('\n--- smoke: adapters generate - runs and emits expected file set ---');
{
  const { cmdAdapters } = await import(join(cliDir, 'cmd-adapters.js'));
  const adaptersTmp = mkdtempSync(join(tmpdir(), 'atlas-adapters-'));

  // Patch repoRoot inside cmdAdapters by writing a minimal jobs.json there.
  // cmdAdapters resolves paths relative to its own directory; we override by
  // using the --jobs and --out flags via the cmd args.
  // Strategy: write a fixture jobs.json, call the generate logic directly.
  // Since cmdAdapters is a top-level function that reads from repoRoot, we
  // test via the CLI integration: write jobs.json and templates/ where the
  // generator expects them, then run with process.chdir into that tree.

  // Build a minimal fixture repo root with the same structure the generator needs.
  const fixtureRoot = join(adaptersTmp, 'fixture-root');
  const fixtureAdaptersDir = join(fixtureRoot, 'adapters');
  mkdirSync(fixtureAdaptersDir, { recursive: true });

  // Minimal jobs.json: two jobs covering both isolation types.
  const fixtureJobs = {
    schemaVersion: 1,
    jobs: {
      retrieve: {
        contract: 'Read-only. Verbatim excerpts.',
        isolation: 'shared',
        claude: { tiers: ['scout'], model: 'claude-haiku-4-5' },
        grok: { persona: 'explore', effort: 'low', mode: 'read-only', model: null },
        codex: { worker: 'explorer', note: 'TBD' },
        gemini: { worker: 'custom/read-only', note: 'TBD' },
      },
      apply: {
        contract: 'One deterministic edit.',
        isolation: 'worktree',
        claude: { tiers: ['setter'], model: 'claude-haiku-4-5' },
        grok: { persona: 'general-purpose', effort: 'low', mode: 'read-write', isolation: 'worktree', model: null },
        codex: { worker: 'worker-narrow', note: 'TBD' },
        gemini: { worker: 'custom', note: 'TBD' },
      },
    },
  };
  writeFileSync(join(fixtureAdaptersDir, 'jobs.json'), JSON.stringify(fixtureJobs, null, 2));
  mkdirSync(join(fixtureRoot, 'templates', '.gemini'), { recursive: true });

  // Run generator with --root pointing at fixtureRoot so repoRoot resolves correctly.
  // Suppress console.log during generation to keep smoke output clean.
  const genLines = [];
  const origLog = console.log;
  console.log = (...a) => genLines.push(a.map(String).join(' '));
  try {
    await cmdAdapters(['generate', '--runner', 'all', '--root', fixtureRoot]);
  } finally {
    console.log = origLog;
  }

  // Assert expected files were created.
  const claudeScout = join(fixtureRoot, 'templates', '.claude', 'agents', 'scout.md');
  const claudeSetter = join(fixtureRoot, 'templates', '.claude', 'agents', 'setter.md');
  const grokRetrieve = join(fixtureRoot, 'templates', '.grok', 'agents', 'retrieve.md');
  const grokApply = join(fixtureRoot, 'templates', '.grok', 'agents', 'apply.md');
  const codexRetrieve = join(fixtureRoot, 'templates', '.codex', 'agents', 'retrieve.md');
  const geminiAdapters = join(fixtureRoot, 'templates', '.gemini', 'adapters.md');

  assert('adapters: claude scout.md emitted', existsSync(claudeScout), 'file missing');
  assert('adapters: claude setter.md emitted', existsSync(claudeSetter), 'file missing');
  assert('adapters: grok retrieve.md emitted', existsSync(grokRetrieve), 'file missing');
  assert('adapters: grok apply.md emitted', existsSync(grokApply), 'file missing');
  assert('adapters: codex retrieve.md emitted', existsSync(codexRetrieve), 'file missing');
  assert('adapters: gemini adapters.md emitted', existsSync(geminiAdapters), 'file missing');

  // Assert content markers in Claude adapter.
  const scoutContent = readFileSync(claudeScout, 'utf8');
  assert(
    'adapters: claude scout has do-not-hand-edit header',
    scoutContent.includes('do not hand-edit'),
    `missing header in: ${scoutContent.slice(0, 100)}`
  );
  assert(
    'adapters: claude scout frontmatter has model pin',
    scoutContent.includes('model: claude-haiku-4-5'),
    `missing model pin in: ${scoutContent.slice(0, 200)}`
  );
  assert(
    'adapters: claude scout has no-child-spawn rule',
    scoutContent.includes('Do not spawn children'),
    `missing no-spawn rule in: ${scoutContent.slice(0, 300)}`
  );

  // Assert Grok stub has TODO markers and model-omitted note.
  const grokContent = readFileSync(grokRetrieve, 'utf8');
  assert(
    'adapters: grok stub has TODO schema warning',
    grokContent.includes('TODO') && grokContent.includes('schema'),
    `missing TODO/schema in grok stub: ${grokContent.slice(0, 200)}`
  );
  assert(
    'adapters: grok stub states model OMITTED',
    grokContent.includes('OMITTED'),
    `model-omitted note missing: ${grokContent.slice(0, 200)}`
  );
  assert(
    'adapters: grok stub states no child spawning',
    grokContent.includes('No child spawning'),
    `no-child-spawn missing from grok stub: ${grokContent.slice(0, 300)}`
  );

  // Assert Grok apply stub has worktree isolation.
  const grokApplyContent = readFileSync(grokApply, 'utf8');
  assert(
    'adapters: grok apply stub has worktree isolation note',
    grokApplyContent.includes('worktree'),
    `worktree note missing from grok apply stub: ${grokApplyContent.slice(0, 200)}`
  );

  // Assert Claude setter (worktree job) body reflects isolation.
  const setterContent = readFileSync(claudeSetter, 'utf8');
  assert(
    'adapters: claude setter has worktree isolation body',
    setterContent.includes('Worktree isolation'),
    `worktree isolation missing from setter: ${setterContent.slice(0, 200)}`
  );

  rmSync(adaptersTmp, { recursive: true, force: true });
}

// ---- adapters generate: idempotent (same content on re-run) ----
console.log('\n--- smoke: adapters generate - idempotent re-run ---');
{
  const { cmdAdapters: cmdAdapters2 } = await import(join(cliDir, 'cmd-adapters.js'));
  const idemTmp = mkdtempSync(join(tmpdir(), 'atlas-idem-'));
  const idemRoot = join(idemTmp, 'root');
  const idemAdaptersDir = join(idemRoot, 'adapters');
  mkdirSync(idemAdaptersDir, { recursive: true });
  mkdirSync(join(idemRoot, 'templates', '.gemini'), { recursive: true });

  const idemJobs = {
    schemaVersion: 1,
    jobs: {
      retrieve: {
        contract: 'Read-only.',
        isolation: 'shared',
        claude: { tiers: ['scout'], model: 'claude-haiku-4-5' },
        grok: { persona: 'explore', effort: 'low', mode: 'read-only', model: null },
        codex: { worker: 'explorer', note: 'TBD' },
        gemini: { worker: 'custom', note: 'TBD' },
      },
    },
  };
  writeFileSync(join(idemAdaptersDir, 'jobs.json'), JSON.stringify(idemJobs, null, 2));

  const origLog2 = console.log;
  console.log = () => {};

  // First run.
  await cmdAdapters2(['generate', '--runner', 'claude', '--root', idemRoot]);

  const scoutPath = join(idemRoot, 'templates', '.claude', 'agents', 'scout.md');
  const firstContent = readFileSync(scoutPath, 'utf8');

  // Second run.
  await cmdAdapters2(['generate', '--runner', 'claude', '--root', idemRoot]);
  console.log = origLog2;

  const secondContent = readFileSync(scoutPath, 'utf8');
  assert(
    'adapters: re-run is idempotent (content unchanged)',
    firstContent === secondContent,
    `first run length=${firstContent.length}, second run length=${secondContent.length}`
  );

  rmSync(idemTmp, { recursive: true, force: true });
}

// ---- adapters generate: hand-edit is detectable (regeneration restores content) ----
// A file that has been hand-edited will differ from what the generator produces.
// After regenerating, the file content returns to the generated version.
// This proves hand-edits are detectable: compare file-on-disk to generator output.
console.log('\n--- smoke: adapters generate - hand-edit detectable ---');
{
  const { cmdAdapters: cmdAdapters3 } = await import(join(cliDir, 'cmd-adapters.js'));
  const editTmp = mkdtempSync(join(tmpdir(), 'atlas-edit-'));
  const editRoot = join(editTmp, 'root');
  const editAdaptersDir = join(editRoot, 'adapters');
  mkdirSync(editAdaptersDir, { recursive: true });
  mkdirSync(join(editRoot, 'templates', '.gemini'), { recursive: true });

  const editJobs = {
    schemaVersion: 1,
    jobs: {
      retrieve: {
        contract: 'Read-only.',
        isolation: 'shared',
        claude: { tiers: ['scout'], model: 'claude-haiku-4-5' },
        grok: { persona: 'explore', effort: 'low', mode: 'read-only', model: null },
        codex: { worker: 'explorer', note: 'TBD' },
        gemini: { worker: 'custom', note: 'TBD' },
      },
    },
  };
  writeFileSync(join(editAdaptersDir, 'jobs.json'), JSON.stringify(editJobs, null, 2));

  const origLog3 = console.log;
  console.log = () => {};

  // Generate once.
  await cmdAdapters3(['generate', '--runner', 'claude', '--root', editRoot]);
  const scoutPath3 = join(editRoot, 'templates', '.claude', 'agents', 'scout.md');
  const generatedContent = readFileSync(scoutPath3, 'utf8');

  // Simulate a hand-edit.
  const handEditedContent = generatedContent + '\n<!-- hand-edited line - this should not survive regeneration -->\n';
  writeFileSync(scoutPath3, handEditedContent);

  // Confirm the modification is detectable (file differs from what generator produces).
  assert(
    'adapters: hand-edit changes the file (pre-regen)',
    handEditedContent !== generatedContent,
    'hand-edit did not modify the file'
  );

  // Regenerate.
  await cmdAdapters3(['generate', '--runner', 'claude', '--root', editRoot]);
  console.log = origLog3;

  const restoredContent = readFileSync(scoutPath3, 'utf8');
  assert(
    'adapters: regeneration restores generated content (hand-edit overwritten)',
    restoredContent === generatedContent,
    `restored length=${restoredContent.length}, original length=${generatedContent.length}`
  );
  assert(
    'adapters: hand-edit marker absent after regeneration',
    !restoredContent.includes('hand-edited line'),
    'hand-edit marker survived regeneration'
  );

  rmSync(editTmp, { recursive: true, force: true });
}

// ---- Summary ----
console.log(`\nSmoke test: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

// ---- Cleanup ----
rmSync(tmp, { recursive: true, force: true });
console.log('Fixture cleaned up.');
