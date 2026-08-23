#!/usr/bin/env node
'use strict';

/**
 * build-manifest.js
 *
 * Generates payload/MANIFEST.json with:
 *   - method version (read from VERSION file at repo root - single source of truth)
 *   - sha256 (first 64 hex chars) per shipped template file
 *
 * Run: node scripts/build-manifest.js
 * Called by: npm run build-manifest (root package.json scripts)
 *
 * Version source decision: VERSION file at repo root is the single source of
 * truth for the method version number. The gate script (check-atlas-method.js)
 * already asserts this file and validates all version surfaces against it.
 * GitHub Releases are tagged v{VERSION} and serve as the public version-of-record.
 * Using git tags at build time is fragile (tag may not exist yet mid-release PR),
 * so we read VERSION directly. build-manifest must be re-run before cutting a
 * release (the release process: bump VERSION, run build-manifest, commit, tag, push).
 *
 * Shipped payload - static template files (non-generated):
 *   templates/AGENTS.md
 *   templates/CLAUDE.md
 *   templates/GEMINI.md
 *   templates/.gemini/settings.json
 *   templates/hooks/datetime.sh
 *   templates/hooks/session-start.sh
 *   templates/gazetteer.repos
 *   templates/baton-stub.md
 *   templates/WORKTREES.md
 *   templates/scripts/worktree-gc.sh
 *   adapters/jobs.json   (source for adapter generation - hashed so update detects schema drift)
 *
 * Generated adapters (.claude/agents/, .grok/agents/, etc.) are NOT in the
 * manifest; they are produced fresh from adapters/jobs.json at init time.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..');

const MANIFEST_PAYLOAD = [
  'templates/AGENTS.md',
  'templates/CLAUDE.md',
  'templates/GEMINI.md',
  'templates/.gemini/settings.json',
  'templates/hooks/datetime.sh',
  'templates/hooks/session-start.sh',
  'templates/gazetteer.repos',
  'templates/baton-stub.md',
  'templates/WORKTREES.md',
  'templates/scripts/worktree-gc.sh',
  'adapters/jobs.json',
];

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Read version
const versionPath = path.join(REPO_ROOT, 'VERSION');
if (!fs.existsSync(versionPath)) {
  console.error('FAIL: VERSION file not found at repo root');
  process.exit(1);
}
const version = fs.readFileSync(versionPath, 'utf8').trim();
if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`FAIL: VERSION file contains invalid semver: "${version}"`);
  process.exit(1);
}

// Hash each payload file
const files = {};
let anyMissing = false;

for (const relPath of MANIFEST_PAYLOAD) {
  const absPath = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    console.error(`FAIL: payload file missing: ${relPath}`);
    anyMissing = true;
    continue;
  }
  const content = fs.readFileSync(absPath);
  files[relPath] = sha256(content);
  console.log(`OK:   hashed ${relPath}`);
}

if (anyMissing) {
  console.error('\nbuild-manifest: FAILED (missing payload files)');
  process.exit(1);
}

// Write manifest
const manifest = {
  schemaVersion: 1,
  methodVersion: version,
  builtAt: new Date().toISOString(),
  files,
};

const payloadDir = path.join(REPO_ROOT, 'payload');
if (!fs.existsSync(payloadDir)) {
  fs.mkdirSync(payloadDir, { recursive: true });
}

const manifestPath = path.join(payloadDir, 'MANIFEST.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nOK:   payload/MANIFEST.json written (version ${version}, ${Object.keys(files).length} files)`);

// Stamp plugin.json version surfaces from VERSION (single source of truth).
// These files live outside the npm package (plugins/ directory) and are not
// hashed in the manifest, but their version field must always match VERSION.
// The gate (check-atlas-method.js) enforces this invariant; this step repairs them.
const pluginJsonPaths = [
  path.join(REPO_ROOT, 'plugins', 'atlas-method', '.claude-plugin', 'plugin.json'),
  path.join(REPO_ROOT, 'plugins', 'atlas-method-grok', 'plugin.json'),
];

for (const pluginPath of pluginJsonPaths) {
  if (!fs.existsSync(pluginPath)) {
    console.warn(`WARN: plugin.json not found - skipping version stamp: ${pluginPath}`);
    continue;
  }
  let pluginJson;
  try {
    pluginJson = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
  } catch (e) {
    console.error(`FAIL: could not parse ${pluginPath}: ${e.message}`);
    continue;
  }
  if (pluginJson.version !== version) {
    pluginJson.version = version;
    fs.writeFileSync(pluginPath, JSON.stringify(pluginJson, null, 2) + '\n');
    console.log(`OK:   stamped version ${version} into ${path.relative(REPO_ROOT, pluginPath)}`);
  } else {
    console.log(`OK:   ${path.relative(REPO_ROOT, pluginPath)} already at ${version}`);
  }
}
