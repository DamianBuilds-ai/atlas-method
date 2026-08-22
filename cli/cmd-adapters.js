// cmd-adapters.js - adapter generator for atlas CLI
// Generates runner-specific overlay files from adapters/jobs.json.
// Usage: atlas adapters generate [--runner claude|grok|codex|gemini|all]
//
// Output paths (all under templates/):
//   Claude:  templates/.claude/agents/{tier}.md
//   Grok:    templates/.grok/agents/{persona}.md  (format stubs - see TODOs)
//   Codex:   templates/.codex/agents/{worker}.md  (stubs)
//   Gemini:  templates/.gemini/adapters.md         (stub)
//
// Design principle (draft3 s.14): adapters GENERATE from one core definition.
// Nothing runner-specific is hand-maintained in four places.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(thisDir, '..');

// ---- helpers ----

// rootDir defaults to repoRoot (the actual repo root when run normally).
// Pass an explicit rootDir in tests or when --root is given on the CLI.
function loadJobs(rootDir = repoRoot) {
  const jobsPath = join(rootDir, 'adapters', 'jobs.json');
  if (!existsSync(jobsPath)) {
    throw new Error(`adapters/jobs.json not found at ${jobsPath}`);
  }
  const raw = readFileSync(jobsPath, 'utf8');
  return JSON.parse(raw);
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function writeGenerated(filePath, content) {
  const dir = dirname(filePath);
  ensureDir(dir);
  writeFileSync(filePath, content, 'utf8');
  return filePath;
}

// ---- Claude adapter generator ----
// One .md file per tier name. Frontmatter: name, description, model.
// Body: job contract, isolation rule, sequencing rule, no-child-spawn rule,
// output discipline. Header comment marks file as generated.

function claudeAdapterBody(tierName, jobName, job) {
  const isWorktree = job.isolation === 'worktree';
  const isolationLine = isWorktree
    ? 'Worktree isolation - edits happen in a separate checkout, not the parent workspace.'
    : 'Shared workspace - no worktree copy needed.';

  return [
    `<!-- generated from adapters/jobs.json - do not hand-edit -->`,
    `---`,
    `name: ${tierName}`,
    `description: Atlas Method ${jobName} job - Claude adapter`,
    `model: ${job.claude.model}`,
    `---`,
    ``,
    `# ${tierName}`,
    ``,
    `**Job:** ${jobName}`,
    `**Contract:** ${job.contract}`,
    `**Isolation:** ${isolationLine}`,
    `**Model:** ${job.claude.model}`,
    ``,
    `## Rules`,
    ``,
    `- **Parent orchestrates.** Do not spawn children. Depth is bounded at the parent.`,
    `- **Sequential processing.** One item at a time. Complete each before moving on.`,
    `- **Job contract is binding.** ${job.contract}`,
    `- **Output discipline.** Return structured output with source citations where applicable.`,
    ...(isWorktree ? [
      `- **Worktree only.** All edits happen inside the isolated worktree branch.`,
      `  Never write to the parent workspace files directly.`,
      `  The parent applies or discards the worktree at wrap.`,
    ] : [
      `- **Read-only or prose only.** This job does not write to the repo.`,
      `  Return findings, excerpts, or drafted prose as output.`,
    ]),
    ``,
  ].join('\n');
}

function generateClaude(jobs, outBase) {
  const generated = [];
  for (const [jobName, job] of Object.entries(jobs)) {
    for (const tier of job.claude.tiers) {
      const filePath = join(outBase, `${tier}.md`);
      const content = claudeAdapterBody(tier, jobName, job);
      writeGenerated(filePath, content);
      generated.push({ runner: 'claude', tier, jobName, filePath });
    }
  }
  return generated;
}

// ---- Grok adapter generator ----
// Grok Build uses .grok/agents/ for persona definitions. The exact file
// format (YAML, TOML, JSON, or Markdown with frontmatter) is NOT verified
// from Grok Build's public documentation as of 2026-08-22. These stubs
// carry all known content plus explicit TODO markers for each unverified
// field or schema question.
//
// Known-confirmed content per spec section 13 + 19:
//   - model field is OMITTED (inherit from parent - spec s.13/19)
//   - effort field is the primary tuning lever (low/medium/high/xhigh)
//   - persona names: explore, general-purpose, read-only, researcher, write
//   - writer jobs (apply, implement) get isolation: worktree
//   - No child spawning (Grok depth is 1)

function grokAdapterBody(jobName, job) {
  const grok = job.grok;
  const isWorktree = job.isolation === 'worktree';
  const effortLine = grok.effort_alt
    ? `${grok.effort} or ${grok.effort_alt} (choose per task scope)`
    : grok.effort;

  return [
    `<!-- generated from adapters/jobs.json - do not hand-edit -->`,
    `<!-- TODO: verify .grok/agents/ file schema before deploying -->`,
    `<!-- This stub uses Markdown + comment blocks. Actual Grok Build persona -->`,
    `<!-- files may use YAML, TOML, or JSON frontmatter. Verify the format   -->`,
    `<!-- against ~/.grok/docs/ or grok build --help agents before wiring.  -->`,
    ``,
    `# Grok adapter - ${jobName} job`,
    ``,
    `## Job mapping`,
    ``,
    `**Job:** ${jobName}`,
    `**Contract:** ${job.contract}`,
    `**Isolation:** ${isWorktree ? 'worktree (writer job - flag isolation: worktree in spawn)' : 'shared workspace (reader job)'}`,
    ``,
    `## Persona fields`,
    ``,
    `<!-- TODO: verify field names below against Grok Build docs -->`,
    ``,
    `- **persona / name:** ${grok.persona}`,
    `  - TODO: confirm the field key is "persona" or "name" in the Grok config format`,
    `- **effort:** ${effortLine}`,
    `  - TODO: confirm accepted effort values (low / medium / high / xhigh)`,
    `- **mode:** ${grok.mode}`,
    `  - TODO: confirm read-only vs read-write is enforced via a "mode" field or equivalent`,
    `- **model:** OMITTED - inherit from parent`,
    `  - Spec section 13/19 lock: omit model on children, vary effort only.`,
    `  - Skill frontmatter model/effort on Grok is accepted and ignored (s.19).`,
    `  - Pins live on roles/personas/spawn, not here.`,
    ...(isWorktree ? [
      `- **isolation:** worktree`,
      `  - TODO: confirm Grok Build spawn flag for worktree isolation`,
      `  - Spec s.13: writers (apply, implement) run in worktrees.`,
    ] : []),
    ``,
    `## Rules (encode in persona prompt or spawn brief)`,
    ``,
    `- **No child spawning.** Grok depth is 1. This job runs as a direct child; it does not spawn further children.`,
    `- **Sequential processing.** One item at a time.`,
    `- **Job contract:** ${job.contract}`,
    ``,
    `## TODO: schema verification checklist`,
    ``,
    `Before deploying this stub as a real Grok persona file:`,
    `- [ ] Confirm .grok/agents/ is the correct directory for persona definitions`,
    `- [ ] Confirm the file format: YAML frontmatter / TOML / JSON / Markdown`,
    `- [ ] Confirm persona field key name`,
    `- [ ] Confirm effort field key name and value set`,
    `- [ ] Confirm model omission is correct (should inherit parent by default)`,
    `- [ ] Confirm worktree isolation flag if applicable`,
    `- [ ] Run: grok build --help agents (or equivalent) to verify`,
    ``,
  ].join('\n');
}

function generateGrok(jobs, outBase) {
  const generated = [];
  const seen = new Set();
  for (const [jobName, job] of Object.entries(jobs)) {
    const persona = job.grok.persona;
    // One file per unique persona name (multiple jobs may share a persona like general-purpose)
    const fileName = `${jobName}.md`;
    const filePath = join(outBase, fileName);
    const content = grokAdapterBody(jobName, job);
    writeGenerated(filePath, content);
    generated.push({ runner: 'grok', persona, jobName, filePath });
  }
  return generated;
}

// ---- Codex adapter generator (stubs) ----

function codexAdapterBody(jobName, job) {
  return [
    `<!-- generated from adapters/jobs.json - do not hand-edit -->`,
    `<!-- Codex CLI adapter stub. Format TBD - verify against codex CLI docs. -->`,
    ``,
    `# Codex adapter - ${jobName} job`,
    ``,
    `**Job:** ${jobName}`,
    `**Contract:** ${job.contract}`,
    `**Isolation:** ${job.isolation}`,
    `**Worker name:** ${job.codex.worker}`,
    ``,
    `${job.codex.note}`,
    ``,
    `## Rules`,
    ``,
    `- Parent orchestrates. Do not spawn children.`,
    `- Sequential processing. One item at a time.`,
    `- Job contract: ${job.contract}`,
    ``,
    `## TODO: Codex CLI schema`,
    ``,
    `- [ ] Confirm .codex/agents/ directory and file format`,
    `- [ ] Confirm worker name field and accepted values`,
    `- [ ] Confirm isolation configuration for writer jobs`,
    ``,
  ].join('\n');
}

function generateCodex(jobs, outBase) {
  const generated = [];
  for (const [jobName, job] of Object.entries(jobs)) {
    const filePath = join(outBase, `${jobName}.md`);
    const content = codexAdapterBody(jobName, job);
    writeGenerated(filePath, content);
    generated.push({ runner: 'codex', worker: job.codex.worker, jobName, filePath });
  }
  return generated;
}

// ---- Gemini adapter generator (stub) ----

function generateGemini(jobs, outBase) {
  const lines = [
    `<!-- generated from adapters/jobs.json - do not hand-edit -->`,
    `<!-- Gemini adapter stub. Format TBD - verify against Gemini CLI docs. -->`,
    ``,
    `# Gemini adapter mapping`,
    ``,
    `Gemini CLI configuration lives in .gemini/settings.json. The constitution`,
    `pointer is already set there (context.fileName = AGENTS.md). This file`,
    `documents the per-job worker mapping for reference.`,
    ``,
    `## TODO: Gemini CLI schema`,
    ``,
    `- [ ] Confirm Gemini CLI agent/persona configuration format`,
    `- [ ] Confirm whether per-job worker files are needed or settings.json is sufficient`,
    `- [ ] Confirm model configuration approach (omit model on children per spec s.13/19)`,
    ``,
    `## Job mapping`,
    ``,
    `| Job | Isolation | Worker / config | Note |`,
    `|---|---|---|---|`,
  ];

  for (const [jobName, job] of Object.entries(jobs)) {
    lines.push(
      `| ${jobName} | ${job.isolation} | ${job.gemini.worker} | ${job.gemini.note} |`
    );
  }

  lines.push(``, `## Rules`, ``);
  lines.push(`- Parent orchestrates. Children do not spawn.`);
  lines.push(`- Model omitted on child jobs (inherit parent per spec s.13/19).`);
  lines.push(`- Writer jobs (apply, implement) run in worktrees.`);
  lines.push(``);

  const filePath = join(outBase, 'adapters.md');
  writeGenerated(filePath, lines.join('\n'));
  return [{ runner: 'gemini', filePath }];
}

// ---- main command ----

export async function cmdAdapters(args) {
  const subCmd = args[0];
  if (subCmd !== 'generate') {
    console.error(`atlas adapters: unknown subcommand "${subCmd || ''}". Usage: atlas adapters generate [--runner claude|grok|codex|gemini|all] [--root DIR]`);
    process.exit(1);
  }

  const runnerIdx = args.indexOf('--runner');
  const runner = runnerIdx !== -1 ? args[runnerIdx + 1] : 'all';
  const validRunners = new Set(['claude', 'grok', 'codex', 'gemini', 'all']);
  if (!validRunners.has(runner)) {
    console.error(`atlas adapters generate: unknown --runner "${runner}". Valid: claude, grok, codex, gemini, all`);
    process.exit(1);
  }

  // --root DIR overrides the default repoRoot (useful in tests and CI).
  const rootIdx = args.indexOf('--root');
  const effectiveRoot = rootIdx !== -1 ? resolve(args[rootIdx + 1]) : repoRoot;

  let { jobs } = loadJobs(effectiveRoot);

  const templatesDir = join(effectiveRoot, 'templates');
  const allGenerated = [];

  if (runner === 'claude' || runner === 'all') {
    const out = join(templatesDir, '.claude', 'agents');
    const files = generateClaude(jobs, out);
    allGenerated.push(...files);
    console.log(`Claude: generated ${files.length} adapter file(s) in templates/.claude/agents/`);
    for (const f of files) {
      console.log(`  ${f.jobName} -> ${f.tier}.md`);
    }
  }

  if (runner === 'grok' || runner === 'all') {
    const out = join(templatesDir, '.grok', 'agents');
    const files = generateGrok(jobs, out);
    allGenerated.push(...files);
    console.log(`Grok: generated ${files.length} stub file(s) in templates/.grok/agents/ (format TODOs marked)`);
    for (const f of files) {
      console.log(`  ${f.jobName} -> ${f.jobName}.md (persona: ${f.persona})`);
    }
  }

  if (runner === 'codex' || runner === 'all') {
    const out = join(templatesDir, '.codex', 'agents');
    const files = generateCodex(jobs, out);
    allGenerated.push(...files);
    console.log(`Codex: generated ${files.length} stub file(s) in templates/.codex/agents/`);
    for (const f of files) {
      console.log(`  ${f.jobName} -> ${f.jobName}.md (worker: ${f.worker})`);
    }
  }

  if (runner === 'gemini' || runner === 'all') {
    const out = join(templatesDir, '.gemini');
    const files = generateGemini(jobs, out);
    allGenerated.push(...files);
    console.log(`Gemini: generated ${files.length} stub file(s) in templates/.gemini/`);
  }

  console.log(`\nTotal: ${allGenerated.length} file(s) generated from adapters/jobs.json.`);
  console.log(`Generated files carry "do not hand-edit" header. Re-run this command to regenerate.`);
}
