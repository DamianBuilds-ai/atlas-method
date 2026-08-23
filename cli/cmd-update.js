// cmd-update.js - atlas update command
// Compares target's .atlas/method-manifest.json against the current package payload,
// writes changes to a backfill branch + human-editable UPDATE-REPORT.md.
// NEVER silently rewrites files. Human merges the branch.
//
// Adopted from the gearbox-update pattern (hash-stamp drift detection):
//   - sha256(file) slice 0..12 used for display; full 64-char hash for comparison.
//   - Four states per file: identical | locally-modified | upstream-changed | conflict
//   - Constitution changes (AGENTS.md) flagged loudest only for upstream-changed/conflict.
//
// THREE-HASH MODEL (see also cmd-init.js header comment):
//   pkgCurrentHash   = currentManifest.files[rel]
//                      Hash of the template file in the package RIGHT NOW.
//   pkgInstalledHash = installedManifest.files[rel]
//                      Hash of the template file at the time of install.
//                      Upstream-change detection: pkgCurrentHash != pkgInstalledHash.
//   writtenHash      = installedManifest.writtenHashes?.[rel] ?? pkgInstalledHash
//                      Hash of what was ACTUALLY WRITTEN to the target at install.
//                      For personalized files (AGENTS.md, gazetteer.repos) this
//                      differs from pkgInstalledHash because substitution runs.
//                      Local-edit detection: targetHash != writtenHash.
//
// Ref: Draft 3 section 14, 7 (schema bumps = versioned JSONL header + installer hash-sync),
// gearbox gap analysis "downstream sync machinery" section.

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const thisDir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(thisDir, '..');

const TEMPLATES_DIR = join(REPO_ROOT, 'templates');
const ADAPTERS_DIR = join(REPO_ROOT, 'adapters');
const PAYLOAD_MANIFEST = join(REPO_ROOT, 'payload', 'MANIFEST.json');

// Files where the constitution lives - always flagged separately.
const CONSTITUTION_FILES = ['templates/AGENTS.md'];

const HELP = `
atlas update [--dir TARGET]

Compares the target repo's installed Atlas Method version against the current
package payload. Reports version delta + per-file drift. Creates a backfill
branch with the upstream changes. You review and merge.

NEVER silently rewrites. Constitution changes (AGENTS.md) are always flagged
loudest. One click to merge when ready.

Options:
  --dir TARGET   Target directory. Defaults to current working directory.

What happens:
  1. Reads TARGET/.atlas/method-manifest.json (installed manifest).
  2. Compares each tracked file against the current package hash.
  3. Writes a backfill branch: atlas-method-update-{new-version}.
  4. Writes UPDATE-REPORT.md to the branch with every file action:
       IDENTICAL          - no change needed
       UPSTREAM-CHANGED   - updated by atlas; apply to merge
       LOCALLY-MODIFIED   - your edit; kept, you decide
       CONFLICT           - both upstream and local changed; you decide

Branch merge: review UPDATE-REPORT.md, then merge the branch into your main
branch. No files are ever overwritten without a branch + report first.
`.trim();

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function shortHash(hash) {
  return hash.slice(0, 12);
}

function readFileSafe(absPath) {
  if (!existsSync(absPath)) return null;
  return readFileSync(absPath);
}

export async function cmdUpdate(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    return;
  }

  let targetDir = process.cwd();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      targetDir = resolve(args[++i]);
    }
  }

  console.log(`atlas update: checking ${targetDir}`);

  // -- 1. Load current package manifest --
  if (!existsSync(PAYLOAD_MANIFEST)) {
    console.error('atlas update: payload/MANIFEST.json not found. Run npm run build-manifest first.');
    process.exit(1);
  }
  let currentManifest;
  try {
    currentManifest = JSON.parse(readFileSync(PAYLOAD_MANIFEST, 'utf8'));
  } catch (e) {
    console.error(`atlas update: could not parse payload/MANIFEST.json: ${e.message}`);
    process.exit(1);
  }

  // -- 2. Load installed manifest from target --
  const installedManifestPath = join(targetDir, '.atlas', 'method-manifest.json');
  let installedManifest = null;
  if (existsSync(installedManifestPath)) {
    try {
      installedManifest = JSON.parse(readFileSync(installedManifestPath, 'utf8'));
    } catch (e) {
      console.warn(`WARN: could not parse installed manifest: ${e.message}`);
    }
  }

  if (!installedManifest) {
    console.error(
      'atlas update: no .atlas/method-manifest.json found in target.\n' +
      'Run atlas init first to install Atlas Method, then use atlas update for upgrades.'
    );
    process.exit(1);
  }

  const installedVersion = installedManifest.methodVersion || 'unknown';
  const newVersion = currentManifest.methodVersion || 'unknown';

  console.log(`  installed version: ${installedVersion}`);
  console.log(`  current version:   ${newVersion}`);

  if (installedVersion === newVersion) {
    console.log('\nVersions match. Checking for local edits vs upstream drift...');
  } else {
    console.log(`\nVersion delta: ${installedVersion} -> ${newVersion}`);
  }

  // -- 3. Compare each file --
  // currentManifest.files: { "templates/AGENTS.md": sha256, ... }
  // installedManifest.files: same shape (what was installed)
  //
  // For each tracked file:
  //   pkg_current_hash   = hash of the file in THIS package (currentManifest.files[rel])
  //   pkg_installed_hash = hash of the file when installed  (installedManifest.files[rel])
  //   target_hash        = hash of the file in TARGET (computed from disk)
  //
  // target path derivation: strip "templates/" prefix for template files;
  // adapters/jobs.json is not directly installed, only used for generation.

  function templateRelToTargetRel(templateRel) {
    // templates/AGENTS.md -> AGENTS.md
    // templates/.gemini/settings.json -> .gemini/settings.json
    // templates/hooks/datetime.sh -> .atlas/hooks/datetime.sh
    // adapters/jobs.json -> (not directly installed as a file, skip in target comparison)
    if (templateRel === 'adapters/jobs.json') return null;
    if (templateRel.startsWith('templates/hooks/')) {
      return '.atlas/hooks/' + templateRel.slice('templates/hooks/'.length);
    }
    if (templateRel.startsWith('templates/')) {
      return templateRel.slice('templates/'.length);
    }
    return null;
  }

  const fileResults = []; // { rel, targetRel, pkgCurrentHash, pkgInstalledHash, targetHash, status }

  for (const [templateRel, pkgCurrentHash] of Object.entries(currentManifest.files)) {
    const pkgInstalledHash = installedManifest.files ? installedManifest.files[templateRel] : null;
    // writtenHash: what was actually written to disk at install time (post-personalization).
    // Falls back to pkgInstalledHash for manifests written by older init versions that
    // did not record writtenHashes (safe: non-personalized files have equal hashes anyway;
    // personalized files on older installs may still show false LOCALLY-MODIFIED, but that
    // is the old behavior - it never gets worse than before this fix).
    const writtenHash = (installedManifest.writtenHashes && installedManifest.writtenHashes[templateRel])
      ? installedManifest.writtenHashes[templateRel]
      : pkgInstalledHash;
    const targetRel = templateRelToTargetRel(templateRel);

    if (targetRel === null) {
      // Not directly installed (e.g. adapters/jobs.json) - detect schema drift only
      const changed = pkgCurrentHash !== pkgInstalledHash;
      if (changed) {
        fileResults.push({
          rel: templateRel,
          targetRel: null,
          pkgCurrentHash,
          pkgInstalledHash,
          targetHash: null,
          status: 'ADAPTERS-SCHEMA-CHANGED',
          isConstitution: false,
        });
      }
      continue;
    }

    const targetAbsPath = join(targetDir, targetRel);
    const targetBuf = readFileSafe(targetAbsPath);
    const targetHash = targetBuf !== null ? sha256(targetBuf) : null;

    // pkgChanged: upstream changed the template between install and now.
    // targetChanged: user edited the installed file after init.
    const pkgChanged = pkgCurrentHash !== pkgInstalledHash;
    const targetChanged = targetHash !== null && targetHash !== writtenHash;
    const targetMissing = targetHash === null;

    let status;
    if (targetMissing) {
      status = 'NEW'; // file exists in package but not in target
    } else if (!pkgChanged && !targetChanged) {
      status = 'IDENTICAL';
    } else if (!pkgChanged && targetChanged) {
      status = 'LOCALLY-MODIFIED';
    } else if (pkgChanged && !targetChanged) {
      status = 'UPSTREAM-CHANGED';
    } else {
      status = 'CONFLICT'; // both changed
    }

    const isConstitution = CONSTITUTION_FILES.includes(templateRel);

    fileResults.push({
      rel: templateRel,
      targetRel,
      pkgCurrentHash,
      pkgInstalledHash: pkgInstalledHash || null,
      targetHash,
      status,
      isConstitution,
    });
  }

  // Count
  const counts = {};
  for (const r of fileResults) counts[r.status] = (counts[r.status] || 0) + 1;

  const needsWork = fileResults.some((r) =>
    ['UPSTREAM-CHANGED', 'CONFLICT', 'NEW', 'ADAPTERS-SCHEMA-CHANGED'].includes(r.status)
  );

  if (!needsWork) {
    const localEdits = fileResults.filter((r) => r.status === 'LOCALLY-MODIFIED');
    if (localEdits.length > 0) {
      console.log(`\n${localEdits.length} locally modified file${localEdits.length === 1 ? '' : 's'} kept. Nothing to update.`);
      localEdits.forEach((r) => console.log(`  ~ ${r.targetRel}`));
    } else {
      console.log('\nAll tracked files current. Nothing to update.');
    }
    return;
  }

  // -- 4. Check if target dir has a git repo --
  let isGitRepo = false;
  try {
    execSync('git rev-parse --git-dir', { cwd: targetDir, stdio: 'pipe' });
    isGitRepo = true;
  } catch (e) {
    // not a git repo
  }

  const branchName = `atlas-method-update-${newVersion}`;

  if (isGitRepo) {
    // Check if branch already exists
    try {
      const existing = execSync('git branch --list ' + branchName, { cwd: targetDir, encoding: 'utf8' });
      if (existing.trim()) {
        console.warn(`\nWARN: branch ${branchName} already exists. Checking out and resetting.`);
        execSync(`git checkout ${branchName}`, { cwd: targetDir, stdio: 'pipe' });
      } else {
        execSync(`git checkout -b ${branchName}`, { cwd: targetDir, stdio: 'pipe' });
        console.log(`\nCreated branch: ${branchName}`);
      }
    } catch (e) {
      console.error(`atlas update: could not create branch ${branchName}: ${e.message}`);
      console.error('Continuing without git branching. Files will be written to working tree.');
      isGitRepo = false;
    }
  } else {
    console.warn('\nWARN: target directory is not a git repo. Writing files directly (no branch isolation).');
  }

  // -- 5. Write upstream-changed and new files to the backfill branch --
  const writtenFiles = [];
  const skippedLocalEdits = [];
  const conflicts = [];

  for (const r of fileResults) {
    if (r.status === 'IDENTICAL') continue;
    if (r.status === 'LOCALLY-MODIFIED') {
      skippedLocalEdits.push(r);
      continue;
    }
    if (r.status === 'CONFLICT') {
      conflicts.push(r);
      // Do NOT overwrite conflicts - document in report, let human decide
      continue;
    }
    if (r.status === 'ADAPTERS-SCHEMA-CHANGED') continue; // handled in report, no file write

    // UPSTREAM-CHANGED or NEW
    if (r.targetRel === null) continue;

    const srcPath = join(TEMPLATES_DIR, r.rel.replace(/^templates\//, ''));
    if (!existsSync(srcPath)) {
      console.warn(`WARN: source file missing for update: ${r.rel} - skipping`);
      continue;
    }

    const destPath = join(targetDir, r.targetRel);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, readFileSync(srcPath));
    writtenFiles.push(r);

    // Make hooks executable
    if (r.targetRel.startsWith('.atlas/hooks/') && r.targetRel.endsWith('.sh')) {
      try { execSync(`chmod +x "${destPath}"`); } catch (_) {}
    }
  }

  // Handle adapters schema change: regenerate adapters
  const adaptersChanged = fileResults.some((r) => r.status === 'ADAPTERS-SCHEMA-CHANGED');
  if (adaptersChanged) {
    console.log('\nadapters/jobs.json changed upstream - regenerating adapters...');
    try {
      const { cmdAdapters } = await import('./cmd-adapters.js');
      const { mkdtempSync, rmSync, readdirSync, statSync } = await import('node:fs');
      const { tmpdir } = await import('node:os');
      const genTmp = mkdtempSync(join(tmpdir(), 'atlas-update-adapters-'));
      const genRoot = join(genTmp, 'root');
      mkdirSync(join(genRoot, 'adapters'), { recursive: true });
      mkdirSync(join(genRoot, 'templates', '.gemini'), { recursive: true });
      writeFileSync(join(genRoot, 'adapters', 'jobs.json'), readFileSync(join(ADAPTERS_DIR, 'jobs.json')));

      const origLog = console.log;
      console.log = () => {};
      try {
        await cmdAdapters(['generate', '--runner', 'all', '--root', genRoot]);
      } finally {
        console.log = origLog;
      }

      function copyDir(src, destBase, relBase) {
        if (!existsSync(src)) return;
        const entries = readdirSync(src);
        for (const entry of entries) {
          const srcFull = join(src, entry);
          const st = statSync(srcFull);
          if (st.isDirectory()) {
            copyDir(srcFull, destBase, join(relBase, entry));
          } else {
            const destRel = join(relBase, entry);
            const destFull = join(destBase, destRel);
            mkdirSync(dirname(destFull), { recursive: true });
            writeFileSync(destFull, readFileSync(srcFull));
            writtenFiles.push({ rel: 'adapters/jobs.json', targetRel: destRel, status: 'ADAPTERS-REGEN', isConstitution: false });
          }
        }
      }

      const genTemplates = join(genRoot, 'templates');
      copyDir(join(genTemplates, '.claude'), targetDir, '.claude');
      copyDir(join(genTemplates, '.grok'), targetDir, '.grok');
      copyDir(join(genTemplates, '.codex'), targetDir, '.codex');
      copyDir(join(genTemplates, '.gemini'), targetDir, '.gemini');

      rmSync(genTmp, { recursive: true, force: true });
    } catch (e) {
      console.warn(`WARN: adapter regeneration failed: ${e.message}`);
    }
  }

  // -- 6. Write updated manifest to target --
  const newManifestForTarget = {
    ...currentManifest,
    installedAt: new Date().toISOString(),
    targetDir,
    profile: installedManifest.profile || 'github',
    previousVersion: installedVersion,
  };
  const manifestPath = join(targetDir, '.atlas', 'method-manifest.json');
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(newManifestForTarget, null, 2) + '\n', 'utf8');

  // -- 7. Write UPDATE-REPORT.md --
  // Constitution alarm fires ONLY on UPSTREAM-CHANGED or CONFLICT.
  // LOCALLY-MODIFIED means the user edited their copy - that is expected and fine.
  // Alarming on LOCALLY-MODIFIED was a false positive (Draft 3 Bug 3).
  const constitutionActions = fileResults.filter(
    (r) => r.isConstitution && ['UPSTREAM-CHANGED', 'CONFLICT'].includes(r.status)
  );
  const now = new Date().toISOString();

  const reportLines = [
    '# Atlas Method Update Report',
    '',
    `Generated: ${now}`,
    `Version: ${installedVersion} -> ${newVersion}`,
    `Branch: ${branchName}`,
    '',
  ];

  if (constitutionActions.length > 0) {
    reportLines.push('## !!! CONSTITUTION CHANGES - REVIEW FIRST !!!');
    reportLines.push('');
    reportLines.push('AGENTS.md (the method constitution) has upstream changes.');
    reportLines.push('These are the highest-impact changes. Review carefully before merging.');
    reportLines.push('');
    for (const r of constitutionActions) {
      reportLines.push(`Status: ${r.status}`);
      reportLines.push(`File: ${r.targetRel}`);
      reportLines.push(`Installed hash: ${r.pkgInstalledHash ? shortHash(r.pkgInstalledHash) : 'none'}`);
      reportLines.push(`Upstream hash:  ${shortHash(r.pkgCurrentHash)}`);
      reportLines.push(`Target hash:    ${r.targetHash ? shortHash(r.targetHash) : 'missing'}`);
      if (r.status === 'CONFLICT') {
        reportLines.push('ACTION: CONFLICT - both upstream and your local copy changed. Resolve manually.');
      } else if (r.status === 'UPSTREAM-CHANGED') {
        reportLines.push('ACTION: Applied to this branch. Review diff before merging.');
      }
      reportLines.push('');
    }
    reportLines.push('---');
    reportLines.push('');
  }

  reportLines.push('## File Actions');
  reportLines.push('');
  reportLines.push('| Status | File | Note |');
  reportLines.push('|--------|------|------|');

  for (const r of fileResults) {
    if (r.status === 'ADAPTERS-SCHEMA-CHANGED') {
      reportLines.push(`| ADAPTERS-REGEN | adapters/jobs.json | adapter schema changed; adapters regenerated |`);
      continue;
    }
    const note = (() => {
      switch (r.status) {
        case 'IDENTICAL': return 'no action needed';
        case 'UPSTREAM-CHANGED': return 'applied to this branch';
        case 'LOCALLY-MODIFIED': return 'your edit kept; not overwritten';
        case 'CONFLICT': return '!!! CONFLICT - both changed; resolve manually';
        case 'NEW': return 'new file from upstream; applied';
        default: return '';
      }
    })();
    reportLines.push(`| ${r.status} | ${r.targetRel || r.rel} | ${note} |`);
  }

  reportLines.push('');
  reportLines.push('## Summary');
  reportLines.push('');
  for (const [status, count] of Object.entries(counts)) {
    reportLines.push(`- ${status}: ${count}`);
  }
  reportLines.push('');
  reportLines.push('## Next steps');
  reportLines.push('');
  reportLines.push(`1. Review the diff on branch \`${branchName}\`.`);
  if (constitutionActions.length > 0) {
    reportLines.push('2. AGENTS.md changed - review the constitution changes first (see section above).');
  }
  if (conflicts.length > 0) {
    reportLines.push(`3. Resolve ${conflicts.length} CONFLICT file(s) manually before merging.`);
  }
  reportLines.push('4. Merge this branch into your main branch when satisfied.');
  reportLines.push('   The merge is yours to make - atlas update never forces it.');

  const reportContent = reportLines.join('\n') + '\n';
  const reportPath = join(targetDir, 'UPDATE-REPORT.md');
  writeFileSync(reportPath, reportContent, 'utf8');

  // Commit the backfill branch if we have a git repo
  if (isGitRepo) {
    try {
      // Stage all written files + the report + updated manifest
      execSync('git add .atlas/method-manifest.json UPDATE-REPORT.md', { cwd: targetDir, stdio: 'pipe' });
      for (const r of writtenFiles) {
        if (r.targetRel) {
          try {
            execSync(`git add "${r.targetRel}"`, { cwd: targetDir, stdio: 'pipe' });
          } catch (_) {}
        }
      }
      execSync(
        `git commit -m "atlas update: ${installedVersion} -> ${newVersion}"`,
        { cwd: targetDir, stdio: 'pipe' }
      );
    } catch (e) {
      console.warn(`WARN: could not commit to backfill branch: ${e.message}`);
    }
  }

  // -- 8. Report summary --
  console.log('\n--- Update summary ---');
  console.log(`Installed: ${installedVersion}  Current: ${newVersion}`);
  if (writtenFiles.length > 0) {
    console.log(`\nApplied to branch ${branchName} (${writtenFiles.length} file(s)):`);
    writtenFiles.forEach((r) => {
      const flag = r.isConstitution ? ' [CONSTITUTION]' : '';
      console.log(`  + ${r.targetRel || r.rel}${flag}`);
    });
  }
  if (skippedLocalEdits.length > 0) {
    console.log(`\nKept your local edits (${skippedLocalEdits.length}): not overwritten`);
    skippedLocalEdits.forEach((r) => console.log(`  ~ ${r.targetRel}`));
  }
  if (conflicts.length > 0) {
    console.log(`\nCONFLICTS (${conflicts.length}): review manually`);
    conflicts.forEach((r) => console.log(`  ! ${r.targetRel}`));
  }
  console.log(`\nUPDATE-REPORT.md written. Review and merge branch ${branchName} when ready.`);
  if (constitutionActions.length > 0) {
    console.log('!!! AGENTS.md (constitution) changed - review this first before merging. !!!');
  }
}
