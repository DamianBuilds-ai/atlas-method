// smoke.js - Atlas CLI smoke test (plain node, no framework)
// Run: node --experimental-sqlite test/smoke.js
// Builds a tiny fixture tree, indexes it, and asserts a search returns the right path.

import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const thisDir = dirname(fileURLToPath(import.meta.url));
const cliDir = join(thisDir, '..', 'cli');

// Dynamically import CLI modules (they use node:sqlite which is experimental).
const { openDb, sanitizeFtsQuery } = await import(join(cliDir, 'db.js'));
const { cmdIndex } = await import(join(cliDir, 'cmd-index.js'));
const { cmdSearch } = await import(join(cliDir, 'cmd-search.js'));

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

// ---- Summary ----
console.log(`\nSmoke test: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

// ---- Cleanup ----
rmSync(tmp, { recursive: true, force: true });
console.log('Fixture cleaned up.');
