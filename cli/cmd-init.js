// cmd-init.js - atlas init command
// Scaffolds a target repo with the Atlas Method payload.
//
// Usage:
//   atlas init [--profile github|local] [--dir TARGET] [--force]
//
// Payload source: always templates/ and generated adapters. NEVER the
// repo-root AGENTS.md (which is the gearbox development constitution).
// This invariant is enforced by both this code and the CI gate check.
//
// Ref: Draft 3 sections 6 (M1), 14 (distribution), 16 migration step 4.
//
// THREE-HASH MODEL (installed manifest schema):
//   files[rel]        = sha256 of the raw template file in the package (unchanged
//                       from payload/MANIFEST.json). Used by update to detect
//                       upstream changes between versions: if the package now
//                       carries a different hash than what was recorded at install,
//                       the template changed upstream.
//   writtenHashes[rel]= sha256 of what was ACTUALLY WRITTEN to the target.
//                       For non-personalized files this equals files[rel].
//                       For personalized files (AGENTS.md, gazetteer.repos) the
//                       substitution changes the content so writtenHashes != files.
//                       update uses writtenHashes to detect local edits:
//                       if target hash != writtenHash, the user edited the file.
//
// The file list installed is derived from payload/MANIFEST.json (single source).
// Every file in the manifest is installed so the manifest and init can never drift.

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const thisDir = dirname(fileURLToPath(import.meta.url));
// Repo root is one level up from cli/
const REPO_ROOT = resolve(thisDir, '..');

const TEMPLATES_DIR = join(REPO_ROOT, 'templates');
const ADAPTERS_DIR = join(REPO_ROOT, 'adapters');
const PAYLOAD_MANIFEST = join(REPO_ROOT, 'payload', 'MANIFEST.json');

// Gearbox ceremony markers that must never appear in the template AGENTS.md.
// If these are present, init refuses (M1 violation).
const GEARBOX_MARKERS = [
  'On starting a shift',
  'L1 strict tier',
  'gearbox-update',
  'npx gearbox-agents',
];

const HELP = `
atlas init [--profile github|local] [--dir TARGET] [--force]

Scaffolds a target repo with the Atlas Method payload.

Options:
  --profile github   (default) Documents gh prerequisites, wires GitHub profile.
  --profile local    Purely-local mode: skips GitHub-specific bits.
  --dir TARGET       Target directory. Defaults to the current working directory.
  --force            Overwrite existing files instead of skipping them.

What gets scaffolded:
  AGENTS.md                    Method constitution (personalized with project name)
  CLAUDE.md                    One-line shell: @AGENTS.md
  GEMINI.md                    One-line shell: @AGENTS.md
  .gemini/settings.json        Points Gemini CLI at AGENTS.md
  .atlas/hooks/datetime.sh     Datetime injection hook
  .atlas/hooks/session-start.sh  Session-start hook
  .atlas/hooks/README.md       Hook wiring instructions
  .atlas/method-manifest.json  Version stamp + file hashes (for atlas update)
  .claude/agents/              Generated runner overlays (Claude)
  .grok/agents/                Generated runner overlays (Grok)
  .codex/agents/               Generated runner overlays (Codex)
  .gemini/adapters.md          Generated runner overlays (Gemini)
  gazetteer.repos              Gazetteer manifest (edit paths for your setup)
  baton-stub.md                Baton template (used by session-start hook)
  WORKTREES.md                 Worktree registry template
  sessions/current/            Empty baton directory
`.trim();

function sha256(content) {
  // content may be string or Buffer
  return createHash('sha256').update(content).digest('hex');
}

// Map a manifest key (e.g. "templates/hooks/datetime.sh") to its target-relative path.
// Returns null for files that are not directly installed (e.g. adapters/jobs.json).
function templateRelToTargetRel(templateRel) {
  if (templateRel === 'adapters/jobs.json') return null;
  if (templateRel.startsWith('templates/hooks/')) {
    return '.atlas/hooks/' + templateRel.slice('templates/hooks/'.length);
  }
  if (templateRel.startsWith('templates/')) {
    return templateRel.slice('templates/'.length);
  }
  return null;
}

export async function cmdInit(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    return;
  }

  // Parse args
  let profile = 'github';
  let targetDir = process.cwd();
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--profile' && args[i + 1]) {
      profile = args[++i];
    } else if (args[i] === '--dir' && args[i + 1]) {
      targetDir = resolve(args[++i]);
    } else if (args[i] === '--force') {
      force = true;
    }
  }

  if (!['github', 'local'].includes(profile)) {
    console.error(`atlas init: unknown profile "${profile}". Use github or local.`);
    process.exit(1);
  }

  console.log(`atlas init: scaffolding Atlas Method in ${targetDir}`);
  console.log(`  profile: ${profile}`);
  if (force) console.log('  --force: existing files will be overwritten');

  // Guard: verify the template AGENTS.md is the method constitution, not the
  // gearbox development AGENTS.md. (M1 invariant - CI also checks this.)
  const templateAgentsPath = join(TEMPLATES_DIR, 'AGENTS.md');
  if (!existsSync(templateAgentsPath)) {
    console.error('atlas init: FATAL - templates/AGENTS.md not found. Is this a complete Atlas Method install?');
    process.exit(1);
  }
  const templateAgentsContent = readFileSync(templateAgentsPath, 'utf8');
  for (const marker of GEARBOX_MARKERS) {
    if (templateAgentsContent.includes(marker)) {
      console.error(
        `atlas init: FATAL - templates/AGENTS.md contains gearbox ceremony marker: "${marker}"\n` +
        `This is an M1 violation. The template must be the method constitution, not the gearbox AGENTS.md.`
      );
      process.exit(1);
    }
  }

  // Derive project name from target directory basename
  const projectName = resolve(targetDir).split('/').pop() || 'my-project';

  // Load manifest
  let manifest = null;
  if (existsSync(PAYLOAD_MANIFEST)) {
    try {
      manifest = JSON.parse(readFileSync(PAYLOAD_MANIFEST, 'utf8'));
    } catch (e) {
      console.warn(`WARN: could not parse payload/MANIFEST.json: ${e.message} - continuing without it`);
    }
  } else {
    console.warn('WARN: payload/MANIFEST.json not found. Run npm run build-manifest before distributing. Continuing without version stamp.');
  }

  const methodVersion = manifest ? manifest.methodVersion : 'unknown';

  // Track what we skip (existing files) and what we write.
  // writtenHashes maps manifest key -> sha256 of what was actually written.
  const skipped = [];
  const written = [];
  const writtenHashes = {}; // key = manifest templateRel, value = sha256 of written content

  // writeFile: write content to target, return the content actually written (or null if skipped).
  function writeFile(relPath, content) {
    const absPath = join(targetDir, relPath);
    const parentDir = dirname(absPath);
    mkdirSync(parentDir, { recursive: true });

    if (existsSync(absPath) && !force) {
      skipped.push(relPath);
      return null;
    }
    if (typeof content === 'string') {
      writeFileSync(absPath, content, 'utf8');
    } else {
      writeFileSync(absPath, content);
    }
    written.push(relPath);
    return content;
  }

  // -- Install all template files from MANIFEST.json (single source of truth) --
  // This ensures every manifested file is installed and the two lists cannot drift.
  if (manifest && manifest.files) {
    for (const [templateRel, pkgHash] of Object.entries(manifest.files)) {
      const targetRel = templateRelToTargetRel(templateRel);
      if (targetRel === null) {
        // Not directly installed (adapters/jobs.json is used for generation below)
        continue;
      }

      // Determine source path within templates/
      const srcPath = templateRel.startsWith('templates/')
        ? join(TEMPLATES_DIR, templateRel.slice('templates/'.length))
        : null;

      if (!srcPath || !existsSync(srcPath)) {
        console.warn(`WARN: template file missing: ${templateRel} - skipping`);
        continue;
      }

      let content = readFileSync(srcPath, 'utf8');

      // Apply per-file personalizations.
      if (templateRel === 'templates/AGENTS.md') {
        content = content
          .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
          .replace(/\{\{DOMAIN\}\}/g, projectName)
          .replace(/\{\{AM_VERSION\}\}/g, methodVersion);
      } else if (templateRel === 'templates/gazetteer.repos') {
        content = content.replace('REPLACE_WITH_ABSOLUTE_PATH_TO_atlas-method', targetDir);
      }

      const written_content = writeFile(targetRel, content);
      // Record the hash of what was WRITTEN (post-substitution), not the template hash.
      // For non-personalized files these are identical; for personalized files they differ.
      // cmd-update.js uses writtenHashes for local-edit detection.
      if (written_content !== null) {
        writtenHashes[templateRel] = sha256(
          typeof written_content === 'string' ? Buffer.from(written_content, 'utf8') : written_content
        );
      } else {
        // File was skipped (already exists). Record the template hash so update can
        // still detect local edits relative to what the template would have written.
        // This is a best-effort approximation for --force-skipped files only.
        writtenHashes[templateRel] = pkgHash;
      }
    }
  } else {
    // No manifest - fall back to explicit file list (graceful degradation)
    console.warn('WARN: no manifest, using fallback file list - some files may be skipped');

    // AGENTS.md (personalized)
    {
      let content = templateAgentsContent
        .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
        .replace(/\{\{DOMAIN\}\}/g, projectName)
        .replace(/\{\{AM_VERSION\}\}/g, methodVersion);
      writeFile('AGENTS.md', content);
    }

    // Remaining non-personalized templates
    for (const [tmplRel, tgtRel] of [
      ['CLAUDE.md', 'CLAUDE.md'],
      ['GEMINI.md', 'GEMINI.md'],
      ['.gemini/settings.json', '.gemini/settings.json'],
      ['hooks/datetime.sh', '.atlas/hooks/datetime.sh'],
      ['hooks/session-start.sh', '.atlas/hooks/session-start.sh'],
      ['hooks/README.md', '.atlas/hooks/README.md'],
      ['baton-stub.md', 'baton-stub.md'],
      ['WORKTREES.md', 'WORKTREES.md'],
    ]) {
      const src = join(TEMPLATES_DIR, tmplRel);
      if (existsSync(src)) writeFile(tgtRel, readFileSync(src, 'utf8'));
    }

    // gazetteer.repos (personalized)
    {
      const src = join(TEMPLATES_DIR, 'gazetteer.repos');
      if (existsSync(src)) {
        const content = readFileSync(src, 'utf8')
          .replace('REPLACE_WITH_ABSOLUTE_PATH_TO_atlas-method', targetDir);
        writeFile('gazetteer.repos', content);
      }
    }
  }

  // Make hooks executable (best-effort)
  try {
    const hooksDir = join(targetDir, '.atlas', 'hooks');
    for (const h of ['datetime.sh', 'session-start.sh']) {
      const p = join(hooksDir, h);
      if (existsSync(p)) {
        execSync(`chmod +x "${p}"`);
      }
    }
  } catch (e) {
    console.warn(`WARN: could not chmod hooks: ${e.message}`);
  }

  // -- sessions/current/ skeleton --
  {
    const sessionsDir = join(targetDir, 'sessions', 'current');
    if (!existsSync(sessionsDir)) {
      mkdirSync(sessionsDir, { recursive: true });
      writeFileSync(join(sessionsDir, '.gitkeep'), '');
      written.push('sessions/current/.gitkeep');
    }
  }

  // -- Generated adapters --
  // Import and invoke the adapter generator against the target directory.
  try {
    const { cmdAdapters } = await import('./cmd-adapters.js');
    const { mkdtempSync, rmSync, readdirSync, statSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const genTmp = mkdtempSync(join(tmpdir(), 'atlas-init-adapters-'));
    const genRoot = join(genTmp, 'root');
    mkdirSync(join(genRoot, 'adapters'), { recursive: true });
    mkdirSync(join(genRoot, 'templates', '.gemini'), { recursive: true });
    const jobsSrc = join(ADAPTERS_DIR, 'jobs.json');
    if (existsSync(jobsSrc)) {
      writeFileSync(join(genRoot, 'adapters', 'jobs.json'), readFileSync(jobsSrc));
    }

    const origLog = console.log;
    console.log = () => {};
    try {
      await cmdAdapters(['generate', '--runner', 'all', '--root', genRoot]);
    } finally {
      console.log = origLog;
    }

    function copyDir(src, destPrefix, relBase) {
      if (!existsSync(src)) return;
      const entries = readdirSync(src);
      for (const entry of entries) {
        const srcFull = join(src, entry);
        const stat = statSync(srcFull);
        if (stat.isDirectory()) {
          copyDir(srcFull, destPrefix, join(relBase, entry));
        } else {
          const relPath = join(relBase, entry);
          const content = readFileSync(srcFull, 'utf8');
          writeFile(relPath, content);
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
    console.warn(`WARN: adapter generation failed: ${e.message} - you can run "atlas adapters generate" manually`);
  }

  // -- .atlas/method-manifest.json (version stamp + three-hash data) --
  if (manifest) {
    const targetManifest = {
      ...manifest,
      installedAt: new Date().toISOString(),
      targetDir,
      profile,
      // writtenHashes: sha256 of what was ACTUALLY WRITTEN to disk (post-personalization).
      // cmd-update uses these for local-edit detection (target hash vs written hash).
      // files[] retains the package template hashes for upstream-change detection.
      // See THREE-HASH MODEL comment at top of file.
      writtenHashes,
    };
    const manifestStr = JSON.stringify(targetManifest, null, 2) + '\n';
    const manifestPath = join(targetDir, '.atlas', 'method-manifest.json');
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, manifestStr, 'utf8');
    written.push('.atlas/method-manifest.json');
  }

  // -- Report --
  console.log('');
  if (written.length > 0) {
    console.log(`Written (${written.length}):`);
    written.forEach((f) => console.log(`  + ${f}`));
  }
  if (skipped.length > 0) {
    console.log(`\nSkipped - already exist (${skipped.length}): use --force to overwrite`);
    skipped.forEach((f) => console.log(`  ~ ${f}`));
  }

  console.log(`\natlas init: done. Atlas Method ${methodVersion} scaffolded in ${targetDir}`);

  if (profile === 'github') {
    console.log(`
GitHub profile prerequisites:
  gh auth login --scopes repo,issues
  (add "project" scope if you want auto-graduation of baton items to GitHub Projects)
  After installing Claude Code: run /hooks-trust in your project root once.
  After installing Grok: the --trust flag on plugin install grants hook trust.
`);
  }

  if (skipped.length > 0) {
    console.log(`NOTE: ${skipped.length} file(s) were not written because they already exist.`);
    console.log('Run atlas init --force to overwrite, or handle the listed files manually.');
  }
}
