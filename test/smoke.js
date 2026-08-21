// smoke.js - Atlas CLI smoke test (plain node, no framework)
// Run: node --experimental-sqlite test/smoke.js
// Builds a tiny fixture tree, indexes it, asserts search + refresh behaviour.

import { mkdirSync, writeFileSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
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

// ---- Summary ----
console.log(`\nSmoke test: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

// ---- Cleanup ----
rmSync(tmp, { recursive: true, force: true });
console.log('Fixture cleaned up.');
