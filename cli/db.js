// db.js - shared SQLite helpers (node:sqlite, FTS5)
// The DatabaseSync import triggers the ExperimentalWarning; suppress in prod
// by setting NODE_NO_WARNINGS=1 or running with --no-warnings.

import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

/** Default index path: ~/.atlas/index.db */
export function defaultDbPath() {
  return join(homedir(), '.atlas', 'index.db');
}

/** Open (or create) the index database. Returns a DatabaseSync instance. */
export function openDb(dbPath = defaultDbPath()) {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const db = new DatabaseSync(dbPath);

  // Schema: one FTS5 virtual table for document chunks.
  // Columns:
  //   source  - file path (with :line-start:line-end suffix) or "issue:N"
  //   domain  - domain slug or empty string
  //   kind    - "map" | "leaf" | "adr" | "baton" | "jsonl"
  //   title   - document title or record title
  //   body    - searchable text content
  db.exec(`
    CREATE TABLE IF NOT EXISTS _meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS docs USING fts5(
      source UNINDEXED,
      domain,
      kind,
      title,
      body,
      tokenize="unicode61 remove_diacritics 2"
    );
  `);

  return db;
}

/** Escape a user query for FTS5: quote phrases, remove shell-special chars. */
export function sanitizeFtsQuery(raw) {
  // Wrap in double quotes if the query contains spaces and no existing quotes.
  const trimmed = raw.trim();
  if (!trimmed) return '""';
  // If the user already used FTS5 operators, pass through (advanced mode).
  if (/[:"*^()|]/.test(trimmed) || /\b(AND|OR|NOT)\b/.test(trimmed)) return trimmed;
  // Otherwise treat as a phrase match - safer for naive queries.
  return `"${trimmed.replace(/"/g, '""')}"`;
}
