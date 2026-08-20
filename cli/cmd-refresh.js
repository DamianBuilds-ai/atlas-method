// cmd-refresh.js - atlas refresh [--domain X] [--state path]
// Pulls GitHub Issues via `gh issue list --json --state all` (LIST endpoint only,
// never the Search API) and reconciles into the local JSONL state file.
// Local-only rows (issue: null) are NEVER modified - they are sacrosanct.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';

const DEFAULT_STATE_PATH = join(homedir(), '.atlas', 'state', 'local.jsonl');
const HEADER = JSON.stringify({ schema: 'atlas-state', version: 1 });

// Six valid record kinds per Draft 3 s. 7 schema.
const VALID_KINDS = new Set(['task', 'decision', 'finding', 'suggestion', 'idea', 'carried']);

export async function cmdRefresh(args) {
  let domain = '';
  let statePath = DEFAULT_STATE_PATH;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && args[i + 1]) domain = args[++i];
    else if (args[i] === '--state' && args[i + 1]) statePath = args[++i];
  }

  // Verify gh is available. Fail open with a visible notice if not authenticated -
  // M7 SessionStart will call refresh; a hook must not block the session.
  try { execSync('gh auth status --hostname github.com', { stdio: 'pipe' }); }
  catch {
    console.log('atlas refresh: skipped (gh unauthenticated - run: gh auth login)');
    return;
  }

  // Pull ALL issues (open + closed) via LIST endpoint.
  // --state all ensures closed issues are reconciled to done/declined in local state.
  // --limit 1000 reduces truncation risk; warn if the page is full (may need pagination).
  // NEVER uses --search / --app github-search or the Search API.
  // gh issue list uses the Issues list REST endpoint (rate limit 5000/hr, not 30/min).
  const labelFlag = domain ? `--label "domain:${domain}"` : '';
  const LIMIT = 1000;
  const ghCmd = `gh issue list ${labelFlag} --state all --limit ${LIMIT} --json number,title,body,labels,state,createdAt,updatedAt`;

  let rawIssues;
  try {
    const out = execSync(ghCmd, { stdio: 'pipe', encoding: 'utf8' });
    rawIssues = JSON.parse(out);
  } catch (err) {
    const msg = err.stderr || err.message || String(err);
    // If no issues exist at all, gh returns an empty list, not an error.
    if (msg.includes('no issues') || msg.includes('Could not resolve')) {
      console.log('atlas refresh: no issues found (empty repo or auth scope missing).');
      rawIssues = [];
    } else {
      console.error(`atlas refresh: gh issue list failed: ${msg.slice(0, 300)}`);
      process.exit(1);
    }
  }

  if (rawIssues.length >= LIMIT) {
    console.warn(`atlas refresh: WARNING - result count hit the --limit ${LIMIT} ceiling. Some issues may be missing. Consider reducing --domain scope or paginating manually.`);
  }

  // Load existing JSONL state.
  const existing = loadState(statePath);

  // Build a map of issue# -> record for rows that came from GitHub sync.
  // INVARIANT: rows with issue === null are local-only and MUST NOT be modified.
  const byIssue = new Map();
  for (const rec of existing) {
    if (rec.issue !== null && rec.issue !== undefined) {
      byIssue.set(rec.issue, rec);
    }
  }

  const now = new Date().toISOString();
  let created = 0;
  let updated = 0;

  for (const issue of rawIssues) {
    const issueNum = issue.number;
    const labels = (issue.labels || []).map(l => l.name);
    const issueDomain = domain || inferDomainFromLabels(labels);
    const status = issue.state === 'CLOSED' ? (labels.includes('declined') ? 'declined' : 'done') : 'open';

    if (byIssue.has(issueNum)) {
      // Update existing record. Local-only rows (issue: null) never reach this path.
      const rec = byIssue.get(issueNum);
      rec.title = issue.title;
      rec.body = (issue.body || '').slice(0, 4000);
      rec.status = status;
      rec.labels = labels;
      rec.domain = issueDomain || rec.domain;
      rec.updated = now;
      rec.source = 'issue-sync';
      updated++;
    } else {
      // Create new record from GitHub issue.
      const kind = kindFromLabels(labels);
      const id = `${kind}-${randomBytes(4).toString('hex')}`;
      existing.push({
        id,
        kind,
        domain: issueDomain,
        title: issue.title,
        body: (issue.body || '').slice(0, 4000),
        status,
        labels,
        issue: issueNum,
        created: issue.createdAt || now,
        updated: now,
        source: 'issue-sync',
      });
      created++;
    }
  }

  saveState(statePath, existing);
  const localOnly = existing.filter(r => r.issue === null || r.issue === undefined).length;
  const total = existing.length;
  console.log(`atlas refresh: ${created} created, ${updated} updated. Total records: ${total} (${localOnly} local-only).`);
}

/** Load all records from a JSONL state file. Skips header and comment lines. */
function loadState(statePath) {
  if (!existsSync(statePath)) return [];
  const raw = readFileSync(statePath, 'utf8');
  const records = [];
  for (const line of raw.split('\n')) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith('#')) continue;
    let rec;
    try { rec = JSON.parse(stripped); } catch { continue; }
    if (rec.schema === 'atlas-state') continue; // header
    records.push(rec);
  }
  return records;
}

/** Write all records back to JSONL with a fresh header. */
function saveState(statePath, records) {
  const dir = dirname(statePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const lines = [HEADER, ...records.map(r => JSON.stringify(r))];
  writeFileSync(statePath, lines.join('\n') + '\n', 'utf8');
}

/**
 * Infer kind from GitHub issue labels. Validates against the six schema kinds.
 * Unknown kinds default to 'task'; the raw label is preserved in the labels array.
 */
function kindFromLabels(labels) {
  for (const l of labels) {
    if (l.startsWith('kind:')) {
      const candidate = l.slice(5);
      return VALID_KINDS.has(candidate) ? candidate : 'task';
    }
  }
  return 'task';
}

/** Infer domain from GitHub issue labels. Returns empty string if not found. */
function inferDomainFromLabels(labels) {
  for (const l of labels) {
    if (l.startsWith('domain:')) return l.slice(7);
  }
  return '';
}
