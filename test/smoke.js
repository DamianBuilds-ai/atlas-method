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

// ---- Summary ----
console.log(`\nSmoke test: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

// ---- Cleanup ----
rmSync(tmp, { recursive: true, force: true });
console.log('Fixture cleaned up.');
