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
// Grok Build agent files live in .grok/agents/ as Markdown files with YAML
// frontmatter. Schema confirmed from ~/.grok/docs/user-guide/16-subagents.md:
//
//   Confirmed frontmatter fields: name, description, mcpInheritance
//   Confirmed spawn_subagent parameters: subagent_type, capability_mode,
//     isolation (none | worktree), background, prompt, description, cwd
//   Model omission: confirmed - subagents inherit parent model by default;
//     per-type overrides go in config.toml [subagents.models]
//   No child spawning: confirmed - depth limit is 1 (Depth Limits section)
//   Worktree isolation: confirmed via isolation: worktree spawn parameter
//
// Narrow remaining ambiguities (keep TODO only for these):
//   - reasoning_effort: confirmed as PERSONA TOML field, not agent frontmatter.
//     Set in config.toml [subagents.personas.{name}] if effort control needed.
//   - tools: field confirmed in agent frontmatter but full tool name list not
//     enumerated in 16-subagents.md; omitted here to allow full toolset.

function grokAdapterBody(jobName, job) {
  const grok = job.grok;
  const isWorktree = job.isolation === 'worktree';
  const effortNote = grok.effort_alt
    ? `${grok.effort} or ${grok.effort_alt} (choose per task scope)`
    : grok.effort;

  return [
    `---`,
    `# generated from adapters/jobs.json - do not hand-edit`,
    `name: ${jobName}`,
    `description: >-`,
    `  ${job.contract}`,
    `mcpInheritance: all`,
    `---`,
    ``,
    `**Job:** ${jobName}`,
    `**Contract:** ${job.contract}`,
    `**Isolation:** ${isWorktree ? 'Worktree (writer job)' : 'Shared workspace (reader job)'}`,
    ``,
    `## Spawn parameters (confirmed - 16-subagents.md)`,
    ``,
    `- \`subagent_type: ${jobName}\` (matches \`name\` above)`,
    `- \`capability_mode: ${grok.mode}\` (confirmed: coarse tool filter; values: read-only | read-write | execute | all)`,
    `- \`isolation: ${isWorktree ? 'worktree' : 'none'}\` (${isWorktree ? 'isolated git worktree; parent applies or discards at wrap' : 'shared workspace - reader job, no worktree needed'})`,
    `- **model: OMITTED** (confirmed: subagents inherit parent model; per-type overrides via config.toml [subagents.models])`,
    ``,
    `<!-- TODO(effort): reasoning_effort is a persona TOML field, not agent frontmatter.`,
    `     Recommended effort for this job: ${effortNote}.`,
    `     To enforce it: config.toml [subagents.personas.${jobName}] reasoning_effort = "${grok.effort}" -->`,
    ``,
    `## Rules`,
    ``,
    `- **No child spawning.** Grok depth is 1; subagents cannot spawn further children.`,
    `- **Sequential processing.** One item at a time. Complete each before moving on.`,
    `- **Job contract:** ${job.contract}`,
    ...(isWorktree ? [
      `- **Worktree only.** All edits happen inside the isolated worktree branch.`,
      `  Never write to the parent workspace directly. The parent applies or discards the worktree at wrap.`,
    ] : [
      `- **Read-only or prose only.** This job does not write to the repo.`,
      `  Return findings, excerpts, or drafted prose as output.`,
    ]),
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

// ---- Operator command generators (/forward and siblings) ----
// Source: adapters/commands.json (single source of truth for operator slash commands).
// Commands are distinct from agent jobs: they are operator-invoked method actions,
// not child agent dispatches. Generated as flat .md files in commands/ directories.

function loadCommands(rootDir = repoRoot) {
  const commandsPath = join(rootDir, 'adapters', 'commands.json');
  if (!existsSync(commandsPath)) {
    return null; // commands.json is optional; graceful skip if absent
  }
  const raw = readFileSync(commandsPath, 'utf8');
  return JSON.parse(raw);
}

// Claude command adapter: flat .md file in .claude/commands/
// Filename stem = command name (Claude Code custom command convention).
function claudeCommandBody(cmdName, cmd) {
  const stepsBlock = cmd.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return [
    `<!-- generated from adapters/commands.json - do not hand-edit -->`,
    `---`,
    `description: ${cmd.description}`,
    `---`,
    ``,
    `# /${cmdName}`,
    ``,
    `${cmd.description}`,
    ``,
    `**Scope boundary:** ${cmd.scope_boundary}`,
    ``,
    `**Context economics:** ${cmd.context_economics}`,
    ``,
    `## Steps`,
    ``,
    stepsBlock,
    ``,
    `## Compact-aware session start`,
    ``,
    `When the next session is opened with a compact produced by /${cmdName}:`,
    ``,
    `- **Load:** ${cmd.compact_aware_start.load.join(', ')}`,
    `- **Skip:** ${cmd.compact_aware_start.skip.join(', ')}`,
    `- **Not skipped:** ${cmd.compact_aware_start.not_skip}`,
    ``,
    `${cmd.compact_aware_start.note}`,
    ``,
  ].join('\n');
}

function generateClaudeCommands(commands, outBase) {
  const generated = [];
  for (const [cmdName, cmd] of Object.entries(commands)) {
    const filePath = join(outBase, `${cmdName}.md`);
    const content = claudeCommandBody(cmdName, cmd);
    writeGenerated(filePath, content);
    generated.push({ runner: 'claude', cmdName, filePath });
  }
  return generated;
}

// Grok command adapter: flat .md file in .grok/commands/
// Confirmed: flat *.md files under a commands/ directory become user-invocable
// slash commands; filename stem = command name (skills doc, command discovery section).
// Frontmatter: description field confirmed from skills doc SKILL.md format.
// TODO(grok-commands-schema): Confirm whether mcpInheritance and user-invocable
//   fields apply to flat commands/ format. Not enumerated in docs/user-guide/08-skills.md
//   for the commands/ variant. Omitting both; Grok infers slash command from filename.
function grokCommandBody(cmdName, cmd) {
  const stepsBlock = cmd.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return [
    `---`,
    `# generated from adapters/commands.json - do not hand-edit`,
    `description: >-`,
    `  ${cmd.description}`,
    `---`,
    ``,
    `# /${cmdName}`,
    ``,
    `${cmd.description}`,
    ``,
    `**Scope boundary:** ${cmd.scope_boundary}`,
    ``,
    `**Context economics:** ${cmd.context_economics}`,
    ``,
    `## Steps`,
    ``,
    stepsBlock,
    ``,
    `## Compact-aware session start`,
    ``,
    `When the next session is opened with a compact produced by /${cmdName}:`,
    ``,
    `- **Load:** ${cmd.compact_aware_start.load.join(', ')}`,
    `- **Skip:** ${cmd.compact_aware_start.skip.join(', ')}`,
    `- **Not skipped:** ${cmd.compact_aware_start.not_skip}`,
    ``,
    `${cmd.compact_aware_start.note}`,
    ``,
    `<!-- TODO(grok-commands-schema): confirm mcpInheritance + user-invocable applicability`,
    `     for flat commands/ format vs agents/ format (08-skills.md does not enumerate these`,
    `     for the commands/ variant). ${cmd.grok.TODO} -->`,
    ``,
  ].join('\n');
}

function generateGrokCommands(commands, outBase) {
  const generated = [];
  for (const [cmdName, cmd] of Object.entries(commands)) {
    const filePath = join(outBase, `${cmdName}.md`);
    const content = grokCommandBody(cmdName, cmd);
    writeGenerated(filePath, content);
    generated.push({ runner: 'grok', cmdName, filePath });
  }
  return generated;
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
  const commandsDef = loadCommands(effectiveRoot);

  const templatesDir = join(effectiveRoot, 'templates');
  const allGenerated = [];

  if (runner === 'claude' || runner === 'all') {
    const agentsOut = join(templatesDir, '.claude', 'agents');
    const files = generateClaude(jobs, agentsOut);
    allGenerated.push(...files);
    console.log(`Claude: generated ${files.length} adapter file(s) in templates/.claude/agents/`);
    for (const f of files) {
      console.log(`  ${f.jobName} -> ${f.tier}.md`);
    }
    if (commandsDef) {
      const cmdsOut = join(templatesDir, '.claude', 'commands');
      const cmdFiles = generateClaudeCommands(commandsDef.commands, cmdsOut);
      allGenerated.push(...cmdFiles);
      console.log(`Claude: generated ${cmdFiles.length} command file(s) in templates/.claude/commands/`);
      for (const f of cmdFiles) {
        console.log(`  /${f.cmdName} -> ${f.cmdName}.md`);
      }
    }
  }

  if (runner === 'grok' || runner === 'all') {
    const agentsOut = join(templatesDir, '.grok', 'agents');
    const files = generateGrok(jobs, agentsOut);
    allGenerated.push(...files);
    console.log(`Grok: generated ${files.length} file(s) in templates/.grok/agents/ (real schema from 16-subagents.md)`);
    for (const f of files) {
      console.log(`  ${f.jobName} -> ${f.jobName}.md (persona: ${f.persona})`);
    }
    if (commandsDef) {
      const cmdsOut = join(templatesDir, '.grok', 'commands');
      const cmdFiles = generateGrokCommands(commandsDef.commands, cmdsOut);
      allGenerated.push(...cmdFiles);
      console.log(`Grok: generated ${cmdFiles.length} command file(s) in templates/.grok/commands/`);
      for (const f of cmdFiles) {
        console.log(`  /${f.cmdName} -> ${f.cmdName}.md`);
      }
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

  console.log(`\nTotal: ${allGenerated.length} file(s) generated from adapters/jobs.json + adapters/commands.json.`);
  console.log(`Generated files carry "do not hand-edit" header. Re-run this command to regenerate.`);
}
