// cmd-orientation.js - atlas orientation --domain X [--out FILE] [--state PATH]
//
// Generates the 80-line orientation view LIVE from local JSONL state.
// Draft 3 s. 9: "A generated orientation view loads, 80 lines, from local JSONL."
// Draft 3 s. 12: Hard cap 80 lines - generated to cap, truncate with a visible
//   "+N more via atlas search" line.
//
// Sections (in order):
//   1. Open items for the domain by priority (status: open, kind: task/finding/suggestion/idea)
//   2. Blocked items with waiting-on (labels containing "blocked:" or "waiting:")
//   3. Latest baton pointer (newest sessions/current/*_{domain}.md)
//   4. Carried items summary (records kind: carried)
//
// Fail open: missing/empty state emits a minimal view with a visible notice line.
// Exit 0 always.

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { homedir } from 'node:os';

const DEFAULT_STATE_DIR = join(homedir(), '.atlas', 'state');
const LINE_CAP = 80;
// Lines reserved for sections 2-4 (blocked, baton, carried) + overflow notice.
// Open items are capped at LINE_CAP - SECTION_RESERVE to prevent them from
// consuming the whole budget and starving the "what to do" payload sections.
// Budget breakdown: baton(3) + carried-min(4) + blocked-min(3) + overflow(1) + buffer(1) = 12
const SECTION_RESERVE = 12;

// Priority order for sorting open items.
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, '': 3 };

export async function cmdOrientation(args) {
  let domain = '';
  let outFile = '';
  let stateDir = DEFAULT_STATE_DIR;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && args[i + 1]) domain = args[++i];
    else if (args[i] === '--out' && args[i + 1]) outFile = args[++i];
    else if (args[i] === '--state' && args[i + 1]) stateDir = args[++i];
    else if ((args[i] === '--help' || args[i] === '-h')) {
      console.log(HELP);
      return;
    }
  }

  const lines = generateOrientation(domain, stateDir);

  const output = lines.join('\n') + '\n';

  if (outFile) {
    const dir = dirname(outFile);
    if (dir && dir !== '.') {
      try { mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
    }
    writeFileSync(outFile, output, 'utf8');
    // Also emit to stdout so callers and tests can see the result.
    process.stdout.write(output);
  } else {
    process.stdout.write(output);
  }
}

const HELP = `
atlas orientation --domain <name> [--out <file>] [--state <dir>]

Generate an 80-line orientation view from local JSONL state.
  --domain X   Domain slug to filter (required for useful output)
  --out FILE   Also write output to FILE (stdout always receives it)
  --state DIR  Custom state dir (default: ~/.atlas/state/)
`.trim();

/**
 * Core generation logic. Returns an array of lines (no trailing newline per line).
 * Always returns at most LINE_CAP lines.
 */
function generateOrientation(domain, stateDir) {
  const records = loadAllRecords(stateDir, domain);

  const header = domain
    ? `# Orientation: ${domain}  (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)`
    : `# Orientation  (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)`;

  if (records.length === 0) {
    return [
      header,
      `orientation: no local state found - run atlas refresh`,
    ];
  }

  // Bucket records.
  const open = records
    .filter(r => r.status === 'open' &&
      !hasBlockedLabel(r) &&
      (r.kind === 'task' || r.kind === 'finding' || r.kind === 'suggestion' || r.kind === 'idea'))
    .sort((a, b) => priorityOf(a) - priorityOf(b));

  const blocked = records.filter(r =>
    r.status === 'open' && hasBlockedLabel(r)
  );

  const carried = records.filter(r => r.kind === 'carried');

  // Baton pointer from sessions/current/ directory.
  const batonLine = latestBatonLine(domain);

  // Assemble sections.
  const lines = [header, ''];
  let overflow = 0;

  // Section 1: Open items.
  if (open.length > 0) {
    lines.push('## Open items');
    let openPushed = 0;
    for (const r of open) {
      // Stop filling open items when the remaining budget (LINE_CAP - SECTION_RESERVE)
      // is exhausted. SECTION_RESERVE holds space for sections 2-4 so they are never
      // starved even when the open list is very long (e.g. 90+ items).
      if (lines.length + 2 >= LINE_CAP - SECTION_RESERVE) { overflow = open.length - openPushed; break; }
      const priority = priorityLabel(r);
      const issueRef = r.issue ? ` (#${r.issue})` : '';
      lines.push(`- [${r.kind}${priority}] ${r.title}${issueRef}`);
      openPushed++;
    }
    lines.push('');
  }

  // Section 2: Blocked items.
  if (blocked.length > 0 && lines.length + 2 < LINE_CAP) {
    lines.push('## Blocked / waiting');
    for (const r of blocked) {
      if (lines.length + 2 >= LINE_CAP) break;
      const waitLabel = waitingOnLabel(r);
      const issueRef = r.issue ? ` (#${r.issue})` : '';
      lines.push(`- ${r.title}${issueRef}${waitLabel}`);
    }
    lines.push('');
  }

  // Section 3: Latest baton pointer.
  if (batonLine && lines.length + 3 < LINE_CAP) {
    lines.push('## Latest baton');
    lines.push(batonLine);
    lines.push('');
  }

  // Section 4: Carried items summary.
  if (carried.length > 0 && lines.length + 3 < LINE_CAP) {
    lines.push('## Carried items');
    lines.push(`${carried.length} item(s) carried forward from prior sessions.`);
    for (const r of carried) {
      if (lines.length + 2 >= LINE_CAP) break;
      const src = r['source-baton'] ? ` (from ${r['source-baton']})` : '';
      lines.push(`  - ${r.title}${src}`);
    }
    lines.push('');
  }

  // Append overflow notice if any items were truncated.
  if (overflow > 0 && lines.length < LINE_CAP) {
    lines.push(`+${overflow} more open items via atlas search --domain ${domain || '<domain>'}`);
  }

  // Hard cap: never exceed LINE_CAP.
  return lines.slice(0, LINE_CAP);
}

/** Load all records from all *.jsonl files in stateDir, optionally filtered by domain. */
function loadAllRecords(stateDir, domain) {
  if (!existsSync(stateDir)) return [];

  let entries;
  try { entries = readdirSync(stateDir); } catch { return []; }

  const records = [];
  for (const entry of entries) {
    if (!entry.endsWith('.jsonl')) continue;
    const filePath = join(stateDir, entry);
    let raw;
    try { raw = readFileSync(filePath, 'utf8'); } catch { continue; }
    for (const line of raw.split('\n')) {
      const stripped = line.trim();
      if (!stripped || stripped.startsWith('#')) continue;
      let rec;
      try { rec = JSON.parse(stripped); } catch { continue; }
      if (rec.schema === 'atlas-state') continue; // header
      if (!domain || rec.domain === domain) records.push(rec);
    }
  }
  return records;
}

/** Return numeric priority for sorting (lower = higher priority). */
function priorityOf(rec) {
  for (const label of (rec.labels || [])) {
    if (label.startsWith('priority:')) {
      const p = label.slice(9).toLowerCase();
      return PRIORITY_ORDER[p] ?? PRIORITY_ORDER[''];
    }
  }
  return PRIORITY_ORDER[''];
}

/** Return " [high]" / " [medium]" / " [low]" suffix or "" for unlabeled. */
function priorityLabel(rec) {
  for (const label of (rec.labels || [])) {
    if (label.startsWith('priority:')) return ` [${label.slice(9)}]`;
  }
  return '';
}

/** Return true if the record has a blocked: or waiting: label. */
function hasBlockedLabel(rec) {
  return (rec.labels || []).some(l => l.startsWith('blocked:') || l.startsWith('waiting:'));
}

/** Return " - waiting on: X" text from the first blocked/waiting label. */
function waitingOnLabel(rec) {
  for (const l of (rec.labels || [])) {
    if (l.startsWith('blocked:')) return ` - blocked: ${l.slice(8)}`;
    if (l.startsWith('waiting:')) return ` - waiting on: ${l.slice(8)}`;
  }
  return '';
}

/**
 * Return a single line pointing to the latest baton for the given domain.
 * Looks in sessions/current/ relative to cwd, then returns null if none found.
 * Does NOT read the baton content - orientation only carries the pointer.
 *
 * Excludes orientation-*.md files from the glob regardless of step ordering.
 * Baton files are named YYYY-MM-DD_HHMM_{domain}.md; orientation files are
 * named orientation-{domain}.md. The domain-pattern (_${domain}.md) already
 * excludes orientation files, but this explicit filter makes the exclusion
 * ordering-independent and visible to future readers.
 */
function latestBatonLine(domain) {
  const batonDir = join(process.cwd(), 'sessions', 'current');
  if (!existsSync(batonDir)) return null;

  let entries;
  try { entries = readdirSync(batonDir); } catch { return null; }

  const pattern = domain
    ? new RegExp(`_${domain}\\.md$`, 'i')
    : /\.md$/;

  // Filter and sort by filename descending (YYYY-MM-DD_HHMM prefix sorts lexicographically).
  // orientation-*.md is explicitly excluded: it is not a baton, never a pointer target.
  const matching = entries
    .filter(e => !e.startsWith('orientation-'))
    .filter(e => pattern.test(e))
    .sort()
    .reverse();

  if (matching.length === 0) return null;
  return `sessions/current/${matching[0]}`;
}
