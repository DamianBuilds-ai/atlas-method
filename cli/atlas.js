#!/usr/bin/env node
// atlas CLI - M8 + M3 + M4 + installer implementation
// Node >=22.5.0 required: uses node:sqlite (builtin FTS5, experimental on 22.x).
// Invoke via atlas-launch.sh (the bin entry) which sets --experimental-sqlite.
// Direct invocation: node --experimental-sqlite cli/atlas.js <command> [args]

import { cmdSearch } from './cmd-search.js';
import { cmdIndex } from './cmd-index.js';
import { cmdRefresh } from './cmd-refresh.js';
import { cmdOrientation } from './cmd-orientation.js';
import { cmdAdapters } from './cmd-adapters.js';
import { cmdInit } from './cmd-init.js';
import { cmdUpdate } from './cmd-update.js';

const [,, cmd, ...rest] = process.argv;

const HELP = `
atlas - Atlas Method local search + state CLI

Commands:
  init [--profile github|local] [--dir TARGET] [--force]
      Scaffold a target repo with the Atlas Method payload:
      AGENTS.md (personalized), CLAUDE.md + GEMINI.md shells, .gemini/settings.json,
      hooks (datetime + session-start), generated adapters, gazetteer.repos,
      sessions/ skeleton. Writes .atlas/method-manifest.json (version stamp).
      Refuses to clobber existing files unless --force is set.

  update [--dir TARGET]
      Compare target's installed Atlas Method against the current package.
      Reports version delta + per-file drift. Writes changes to a backfill
      branch (atlas-method-update-{version}) + UPDATE-REPORT.md. Never
      silently rewrites. Constitution changes always flagged loudest.

  search "<query>" [--domain X] [--top N]
      FTS5 full-text search over indexed maps, leaves, ADRs, batons, JSONL state.

  index [--repo path]
      (Re)build the FTS5 index. Walks paths listed in gazetteer.repos manifest.

  refresh [--domain X]
      Pull all GitHub Issues (open and closed) via gh issue list --state all and reconcile into local JSONL.

  orientation --domain X [--out FILE]
      Generate the 80-line orientation view from local JSONL state.
      Writes to stdout and optionally to FILE. Fail-open: emits a visible
      notice if no local state is found, never silences.

  adapters generate [--runner claude|grok|codex|gemini|all]
      Generate runner-specific adapter overlays from adapters/jobs.json.
      Claude: templates/.claude/agents/{tier}.md (with frontmatter + body).
      Grok:   templates/.grok/agents/{job}.md  (stubs - schema TODOs marked).
      Codex:  templates/.codex/agents/{job}.md (stubs).
      Gemini: templates/.gemini/adapters.md    (stub).
      Generated files carry a "do not hand-edit" header comment.
      Re-run to regenerate. Idempotent.

Options for all commands:
  --help    Show this message

Node floor: >=22.5.0 (node:sqlite builtin with FTS5, experimental on 22.x).
Node 24+: no flag needed; ExperimentalWarning suppressed by atlas-launch.sh.
Binding: node:sqlite (builtin) - no native addon, no npm install needed.
`.trim();

switch (cmd) {
  case 'init':   await cmdInit(rest); break;
  case 'update': await cmdUpdate(rest); break;
  case 'search': await cmdSearch(rest); break;
  case 'index':  await cmdIndex(rest);  break;
  case 'refresh': await cmdRefresh(rest); break;
  case 'orientation': await cmdOrientation(rest); break;
  case 'adapters': await cmdAdapters(rest); break;
  case '--help':
  case '-h':
  case undefined:
    console.log(HELP);
    break;
  default:
    console.error(`atlas: unknown command "${cmd}". Run atlas --help.`);
    process.exit(1);
}
