// cmd-index.js - atlas index [--repo path] [--gazetteer path] [--db path]
// Full rebuild of the FTS5 index. Walks paths in gazetteer.repos manifest,
// then unconditionally indexes ~/.atlas/state/*.jsonl (local JSONL state).
// Draft 3 s. 8: retrieve() always hits local FTS5 + local JSONL.

import { openDb, defaultDbPath } from './db.js';
import { readGazetteer, defaultGazetteerPath } from './gazetteer.js';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';
import { homedir } from 'node:os';

// Max chars to store per doc chunk. Keeps index lean.
const CHUNK_MAX = 4000;

/** Default state directory: ~/.atlas/state/ */
function defaultStateDir() {
  return join(homedir(), '.atlas', 'state');
}

export async function cmdIndex(args) {
  let dbPath = defaultDbPath();
  let gazetteerPath = defaultGazetteerPath();
  let singleRepo = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--db' && args[i + 1]) dbPath = args[++i];
    else if (args[i] === '--gazetteer' && args[i + 1]) gazetteerPath = args[++i];
    else if (args[i] === '--repo' && args[i + 1]) singleRepo = args[++i];
  }

  // Safety: --repo without --db would wipe the entire production index and only
  // re-index one path. Refuse to prevent data loss.
  if (singleRepo && dbPath === defaultDbPath()) {
    console.error('atlas index: --repo requires --db <path> to avoid wiping the production index.');
    console.error('  Use --db to point at a temporary database, or omit --repo for a full rebuild.');
    process.exit(1);
  }

  const db = openDb(dbPath);

  // Full rebuild: drop all existing rows then re-insert.
  db.exec(`DELETE FROM docs`);

  const repos = singleRepo
    ? [{ path: singleRepo, visibility: 'private' }]
    : readGazetteer(gazetteerPath);

  let total = 0;
  for (const repo of repos) {
    const count = indexRepo(db, repo.path);
    console.log(`  indexed ${count} chunks from ${repo.path}`);
    total += count;
  }

  // Always also index ~/.atlas/state/*.jsonl regardless of gazetteer contents.
  // Draft 3 s. 8: local JSONL is always part of the index so retrieve() hits it.
  // This runs even when --repo is given (scoped test mode), so refresh + index
  // round-trips work in a temp DB.
  const stateCount = indexStateFiles(db);
  if (stateCount > 0) {
    console.log(`  indexed ${stateCount} chunks from state files`);
    total += stateCount;
  }

  // Record index timestamp.
  db.prepare(`INSERT OR REPLACE INTO _meta(key, value) VALUES ('indexed_at', ?)`).run(new Date().toISOString());
  db.prepare(`INSERT OR REPLACE INTO _meta(key, value) VALUES ('total_chunks', ?)`).run(String(total));

  console.log(`atlas index: done. ${total} chunks indexed.`);
}

/**
 * Index all *.jsonl files found in ~/.atlas/state/.
 * Returns chunk count. Skips gracefully if the dir does not exist.
 */
function indexStateFiles(db) {
  const stateDir = defaultStateDir();
  if (!existsSync(stateDir)) return 0;

  let entries;
  try { entries = readdirSync(stateDir); } catch { return 0; }

  let count = 0;
  const insert = db.prepare(`INSERT INTO docs(source, domain, kind, title, body) VALUES (?,?,?,?,?)`);

  for (const entry of entries) {
    if (!entry.endsWith('.jsonl')) continue;
    const filePath = join(stateDir, entry);
    const chunks = fileToChunks(filePath, stateDir);
    for (const c of chunks) {
      insert.run(c.source, c.domain, c.kind, c.title, c.body);
      count++;
    }
  }
  return count;
}

/** Walk a repo directory and index eligible files. Returns chunk count. */
function indexRepo(db, repoPath) {
  if (!existsSync(repoPath)) {
    console.warn(`atlas index: path not found, skipping: ${repoPath}`);
    return 0;
  }
  const files = walkDir(repoPath, ['.md', '.jsonl']);
  let count = 0;
  const insert = db.prepare(`INSERT INTO docs(source, domain, kind, title, body) VALUES (?,?,?,?,?)`);
  for (const filePath of files) {
    const chunks = fileToChunks(filePath, repoPath);
    for (const c of chunks) {
      insert.run(c.source, c.domain, c.kind, c.title, c.body);
      count++;
    }
  }
  return count;
}

/** Recursively walk dir, collecting files with given extensions. */
function walkDir(dir, exts, results = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return results; }
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walkDir(full, exts, results);
    else if (exts.includes(extname(entry))) results.push(full);
  }
  return results;
}

/** Classify a markdown file by naming convention. */
function classifyMd(relPath) {
  const name = basename(relPath, '.md').toLowerCase();
  if (name.endsWith('_adr') || relPath.includes('/adrs/') || relPath.includes('/decisions/')) return 'adr';
  if (name.includes('baton') || relPath.includes('/batons/') || relPath.includes('/sessions/')) return 'baton';
  if (name.endsWith('_map') || name.endsWith('-map') || name === 'map') return 'map';
  // Leaves: anything in a docs/ or leaves/ dir, or small domain sub-docs.
  if (relPath.includes('/docs/') || relPath.includes('/leaves/')) return 'leaf';
  // Top-level domain docs are maps.
  if (relPath.split('/').length <= 2) return 'map';
  return 'leaf';
}

/**
 * Extract domain slug from path heuristic.
 * First directory component is used for nested files.
 * For top-level files, the naming convention {domain}-map.md or {domain}_map.md
 * is recognised (e.g. treasury-map.md -> 'treasury').
 */
function inferDomain(relPath) {
  const parts = relPath.split('/');
  if (parts.length > 1) return parts[0].toLowerCase();
  // Top-level file: try to extract domain from {domain}-map.md or {domain}_map.md.
  const stem = basename(relPath, '.md').toLowerCase();
  const mapMatch = stem.match(/^([a-z][a-z0-9-]*)[-_]map$/);
  if (mapMatch) return mapMatch[1];
  return '';
}

/** Convert a file to one or more index chunks. */
function fileToChunks(filePath, repoRoot) {
  const rel = relative(repoRoot, filePath);
  const ext = extname(filePath);
  const chunks = [];

  if (ext === '.jsonl') {
    // Parse each record line individually.
    let raw;
    try { raw = readFileSync(filePath, 'utf8'); } catch { return chunks; }
    const lines = raw.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      let rec;
      try { rec = JSON.parse(line); } catch { continue; }
      // Skip the header line.
      if (rec.schema === 'atlas-state') continue;
      const body = [rec.title || '', rec.body || ''].join(' ').slice(0, CHUNK_MAX);
      chunks.push({
        source: `${rel}:${i + 1}`,
        domain: rec.domain || '',
        kind: rec.kind || 'jsonl',
        title: rec.title || `(${rec.kind || 'record'} ${rec.id || ''})`,
        body,
      });
    }
    return chunks;
  }

  // Markdown: chunk by H2 sections for better excerpt granularity.
  let raw;
  try { raw = readFileSync(filePath, 'utf8'); } catch { return chunks; }

  const kind = classifyMd(rel);
  const domain = inferDomain(rel);
  const lines = raw.split('\n');
  let sectionTitle = basename(filePath, '.md');
  let sectionStart = 1;
  let sectionLines = [];

  const flush = (endLine) => {
    if (sectionLines.length === 0) return;
    const body = sectionLines.join('\n').slice(0, CHUNK_MAX);
    chunks.push({
      source: `${rel}:${sectionStart}:${endLine}`,
      domain,
      kind,
      title: sectionTitle,
      body,
    });
    sectionLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      flush(i);
      sectionTitle = line.replace(/^## /, '').trim();
      sectionStart = i + 1;
    } else {
      sectionLines.push(line);
    }
  }
  flush(lines.length);

  // If no H2 sections found (short doc), emit as a single chunk.
  if (chunks.length === 0) {
    chunks.push({
      source: `${rel}:1:${lines.length}`,
      domain,
      kind,
      title: basename(filePath, '.md'),
      body: raw.slice(0, CHUNK_MAX),
    });
  }

  return chunks;
}
