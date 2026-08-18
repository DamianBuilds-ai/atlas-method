#!/usr/bin/env node
// atlas CLI - M8 + M3 + M4 implementation
// Node 22+ required: uses node:sqlite (builtin FTS5, experimental as of 22.5.0)
// Run as: node --experimental-sqlite cli/atlas.js <command> [args]
// When invoked via npx/bin the shebang line handles flag passthrough via
// the NODE_OPTIONS env variable pattern documented in the PR body.

import { cmdSearch } from './cmd-search.js';
import { cmdIndex } from './cmd-index.js';
import { cmdRefresh } from './cmd-refresh.js';

const [,, cmd, ...rest] = process.argv;

const HELP = `
atlas - Atlas Method local search + state CLI

Commands:
  search "<query>" [--domain X] [--top N]
      FTS5 full-text search over indexed maps, leaves, ADRs, batons, JSONL state.

  index [--repo path]
      (Re)build the FTS5 index. Walks paths listed in gazetteer.repos manifest.

  refresh [--domain X]
      Pull open GitHub Issues via gh issue list and reconcile into local JSONL.

Options for all commands:
  --help    Show this message

Node floor: >=22.5.0 (node:sqlite builtin with FTS5)
Binding: node:sqlite (builtin) - no native addon, no npm install needed.
`.trim();

switch (cmd) {
  case 'search': await cmdSearch(rest); break;
  case 'index':  await cmdIndex(rest);  break;
  case 'refresh': await cmdRefresh(rest); break;
  case '--help':
  case '-h':
  case undefined:
    console.log(HELP);
    break;
  default:
    console.error(`atlas: unknown command "${cmd}". Run atlas --help.`);
    process.exit(1);
}
