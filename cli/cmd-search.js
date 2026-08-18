// cmd-search.js - atlas search "<query>" [--domain X] [--top N]

import { openDb, defaultDbPath, sanitizeFtsQuery } from './db.js';

export async function cmdSearch(args) {
  let query = '';
  let domain = '';
  let top = 8;
  let dbPath = defaultDbPath();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && args[i + 1]) { domain = args[++i]; }
    else if (args[i] === '--top' && args[i + 1]) { top = parseInt(args[++i], 10) || 8; }
    else if (args[i] === '--db' && args[i + 1]) { dbPath = args[++i]; } // internal flag for tests
    else if (!args[i].startsWith('--')) { query = args[i]; }
  }

  if (!query) {
    console.error('atlas search: query required. Usage: atlas search "query" [--domain X] [--top N]');
    process.exit(1);
  }

  const db = openDb(dbPath);
  const ftsQuery = sanitizeFtsQuery(query);

  let sql, params;
  if (domain) {
    sql = `
      SELECT source, kind, title, snippet(docs, 4, '[', ']', '...', 20) AS excerpt,
             rank
      FROM docs
      WHERE docs MATCH ? AND domain = ?
      ORDER BY rank
      LIMIT ?
    `;
    params = [ftsQuery, domain, top];
  } else {
    sql = `
      SELECT source, kind, domain, title, snippet(docs, 4, '[', ']', '...', 20) AS excerpt,
             rank
      FROM docs
      WHERE docs MATCH ?
      ORDER BY rank
      LIMIT ?
    `;
    params = [ftsQuery, top];
  }

  let rows;
  try {
    rows = db.prepare(sql).all(...params);
  } catch (err) {
    // FTS5 syntax error - fall back to a plain unquoted search.
    if (err.message && err.message.includes('fts5')) {
      const plainSql = domain
        ? sql.replace(ftsQuery, '"' + query.replace(/"/g, '""') + '"')
        : sql;
      try {
        rows = db.prepare(domain ? sql : sql).all(...params);
      } catch (_) {
        console.error(`atlas search: query error: ${err.message}`);
        process.exit(1);
      }
    } else {
      console.error(`atlas search: ${err.message}`);
      process.exit(1);
    }
  }

  if (!rows || rows.length === 0) {
    console.log('No results.');
    return;
  }

  for (const row of rows) {
    const domainTag = row.domain ? ` [${row.domain}]` : '';
    const kindTag = row.kind ? ` (${row.kind})` : '';
    console.log(`\n${row.source}${domainTag}${kindTag}`);
    console.log(`  ${row.title}`);
    if (row.excerpt) console.log(`  ${row.excerpt.replace(/\n/g, ' ').trim()}`);
  }
  console.log(`\n${rows.length} result(s) for: ${query}`);
}
