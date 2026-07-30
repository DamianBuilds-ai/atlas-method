#!/usr/bin/env node
'use strict';

/**
 * check-atlas-method.js
 *
 * Zero-dependency structural gate for the atlas-method public repo.
 * This is the Gate command referenced in AGENTS.md and .github/workflows/ci.yml -
 * the two must stay byte-identical (CI == Gate contract, gearbox ADR-0020/0010).
 *
 * Checks, in order:
 *   1. Required core files exist.
 *   2. VERSION file at repo root is the single source of truth. Every version
 *      surface (currently README.md; MAPPING.md too if one is ever added) must
 *      contain that exact string. FAIL on mismatch.
 *   3. VERSION vs the latest `v*` git tag. WARN only, never fail - the normal
 *      bump-then-tag flow means VERSION legitimately leads the tag while a
 *      release PR is in flight.
 *   4. Every relative internal markdown link/image resolves to a real file.
 *      FAIL on any broken link.
 *   5. No em dashes (U+2014) or en dashes (U+2013) in any .md file.
 *
 *   Checks 4 and 5 both skip docs/gearbox-adr/ - those are upstream Gearbox
 *   protocol ADRs, copied verbatim and hash-stamped by the gearbox tooling
 *   (ADR-0021). AGENTS.md says "don't hand-edit them"; editing them would
 *   both violate that and desync the hash stamp. That is this repo's one
 *   carve-out for "quoted third-party content" - everything else in the repo
 *   is Damian's own writing and must follow the repo's own conventions
 *   (working, real links; no em/en dashes).
 *
 * Exit code 0 = all checks passed (warnings allowed). Exit code 1 = at least
 * one FAIL-class check failed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
let failed = false;
const warnings = [];

function fail(msg) {
  failed = true;
  console.error(`FAIL: ${msg}`);
}

function warn(msg) {
  warnings.push(msg);
  console.warn(`WARN: ${msg}`);
}

function ok(msg) {
  console.log(`OK:   ${msg}`);
}

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

// Walk the working tree for *.md files, not `git ls-files`. The gate is meant
// to be run BEFORE staging/committing (it is the "all-green before shift-end"
// check), so a file that exists on disk but is not yet `git add`-ed must still
// be checked - otherwise a brand-new file with a violation would pass locally
// and only get caught later in CI, once it happens to be tracked.
const WALK_SKIP_DIRS = new Set(['.git', 'node_modules']);

function findMarkdownFiles() {
  const results = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (WALK_SKIP_DIRS.has(entry.name)) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(path.relative(REPO_ROOT, abs));
      }
    }
  })(REPO_ROOT);
  return results;
}

// ---------------------------------------------------------------------------
// 1. Required core files
// ---------------------------------------------------------------------------

const REQUIRED_CORE_FILES = [
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'VERSION',
  'AGENTS.md',
  'CLAUDE.md',
  'CONTEXT.md',
];

for (const relPath of REQUIRED_CORE_FILES) {
  if (fs.existsSync(path.join(REPO_ROOT, relPath))) {
    ok(`required core file present: ${relPath}`);
  } else {
    fail(`required core file missing: ${relPath}`);
  }
}

// ---------------------------------------------------------------------------
// 2. VERSION is the single source of truth - version surfaces must match it
// ---------------------------------------------------------------------------

let version = null;
if (fs.existsSync(path.join(REPO_ROOT, 'VERSION'))) {
  version = readRepoFile('VERSION').trim();
  ok(`VERSION file reads "${version}"`);
} else {
  fail('VERSION file missing at repo root - cannot check version surfaces');
}

if (version) {
  const versionSurfaces = ['README.md'];
  if (fs.existsSync(path.join(REPO_ROOT, 'MAPPING.md'))) {
    versionSurfaces.push('MAPPING.md');
  }

  for (const surface of versionSurfaces) {
    const surfacePath = path.join(REPO_ROOT, surface);
    if (!fs.existsSync(surfacePath)) {
      fail(`version surface ${surface} does not exist`);
      continue;
    }
    const content = fs.readFileSync(surfacePath, 'utf8');
    if (content.includes(version)) {
      ok(`${surface} contains exact VERSION string "${version}"`);
    } else {
      fail(`${surface} does not contain the exact VERSION string "${version}" - update it or fix VERSION`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. VERSION vs latest v* git tag - warn only
// ---------------------------------------------------------------------------

if (version) {
  try {
    const tagsRaw = execSync('git tag --list "v*"', { cwd: REPO_ROOT, encoding: 'utf8' });
    const tags = tagsRaw.split('\n').map((t) => t.trim()).filter(Boolean);
    if (tags.length === 0) {
      warn('no v* git tags found - skipping VERSION-vs-tag comparison');
    } else {
      const parse = (t) => t.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
      const latestTag = tags.slice().sort((a, b) => {
        const [pa, pb] = [parse(a), parse(b)];
        for (let i = 0; i < 3; i++) {
          if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
        }
        return 0;
      }).pop();
      const latestTagVersion = latestTag.replace(/^v/, '');
      if (latestTagVersion === version) {
        ok(`VERSION "${version}" matches latest git tag ${latestTag}`);
      } else {
        warn(`VERSION "${version}" does not match latest git tag ${latestTag} (latest tag version "${latestTagVersion}") - fine mid-release, tag it before shift-end`);
      }
    }
  } catch (e) {
    warn(`could not read git tags: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// 4. Relative internal markdown links resolve
// ---------------------------------------------------------------------------

function extractLinkTargets(content) {
  // Matches both [text](target) and ![alt](target); captures the target.
  const linkRegex = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const targets = [];
  let m;
  while ((m = linkRegex.exec(content)) !== null) {
    let target = m[1].trim();
    // Strip an optional trailing "title" in quotes: (path "title")
    const spaceQuoteIdx = target.search(/\s+["']/);
    if (spaceQuoteIdx !== -1) {
      target = target.slice(0, spaceQuoteIdx).trim();
    }
    targets.push(target);
  }
  return targets;
}

function isExternalOrSkippable(target) {
  if (target === '') return true;
  if (target.startsWith('#')) return true; // in-page anchor only
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) return true; // http(s):// etc
  if (target.startsWith('mailto:')) return true;
  if (target.startsWith('data:')) return true;
  return false;
}

// docs/gearbox-adr/ is upstream Gearbox protocol content, copied verbatim and
// hash-stamped by the gearbox tooling (ADR-0021) - AGENTS.md says "don't
// hand-edit them". It is this repo's one carve-out for "quoted third-party
// content": we do not enforce our own link or em-dash conventions on prose we
// did not author and are not meant to touch. (Example real hit: ADR-0021 line
// 27 uses "[gearbox ADR-0014](...)" with a literal ellipsis as an
// illustrative placeholder target, not a real navigable link.)
const THIRD_PARTY_PREFIXES = ['docs/gearbox-adr/'];

const allMarkdownFiles = findMarkdownFiles();
let brokenLinks = 0;
let linksChecked = 0;

for (const relFile of allMarkdownFiles) {
  if (THIRD_PARTY_PREFIXES.some((p) => relFile.startsWith(p))) continue;
  const absFile = path.join(REPO_ROOT, relFile);
  if (!fs.existsSync(absFile)) continue; // deleted-but-staged edge case
  const content = fs.readFileSync(absFile, 'utf8');
  const targets = extractLinkTargets(content);
  const fileDir = path.dirname(absFile);

  for (let target of targets) {
    if (isExternalOrSkippable(target)) continue;
    // Strip an in-file anchor fragment before resolving to a file on disk.
    const hashIdx = target.indexOf('#');
    if (hashIdx !== -1) target = target.slice(0, hashIdx);
    if (target === '') continue; // was purely a same-file anchor
    linksChecked++;
    const resolved = path.resolve(fileDir, target);
    if (!fs.existsSync(resolved)) {
      brokenLinks++;
      fail(`broken relative link in ${relFile} -> "${target}" (resolved: ${path.relative(REPO_ROOT, resolved)})`);
    }
  }
}

if (brokenLinks === 0) {
  ok(`all ${linksChecked} relative internal markdown links resolve`);
}

// ---------------------------------------------------------------------------
// 5. No em dashes / en dashes in tracked .md files (except docs/gearbox-adr/)
// ---------------------------------------------------------------------------

const EM_DASH = '—';
const EN_DASH = '–';

let dashOffenders = 0;

for (const relFile of allMarkdownFiles) {
  if (THIRD_PARTY_PREFIXES.some((p) => relFile.startsWith(p))) continue;
  const absFile = path.join(REPO_ROOT, relFile);
  if (!fs.existsSync(absFile)) continue;
  const content = fs.readFileSync(absFile, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes(EM_DASH) || line.includes(EN_DASH)) {
      dashOffenders++;
      fail(`em/en dash in ${relFile}:${idx + 1} -> "${line.trim()}"`);
    }
  });
}

if (dashOffenders === 0) {
  ok('no em dashes or en dashes found outside docs/gearbox-adr/');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('');
if (warnings.length > 0) {
  console.log(`${warnings.length} warning(s) - see WARN lines above.`);
}

if (failed) {
  console.error('\ncheck-atlas-method: FAILED');
  process.exit(1);
} else {
  console.log('\ncheck-atlas-method: all checks passed.');
  process.exit(0);
}
