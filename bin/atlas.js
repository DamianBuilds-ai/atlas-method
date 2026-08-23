#!/usr/bin/env node
// Atlas Method CLI entry point for npm/npx installs.
// CJS (root package has no type:module) so __dirname resolves correctly
// regardless of whether this is invoked via symlink. Spawns atlas-launch.sh
// from its known location (cli/ adjacent to this file's parent).
//
// Decision: shell-script bin entries use dirname "$0" which resolves to the
// .bin/ symlink dir when installed via npm, not to cli/. CJS wrapper with
// __dirname is symlink-safe and avoids that trap.

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const shellScript = path.join(__dirname, '..', 'cli', 'atlas-launch.sh');
const result = spawnSync('sh', [shellScript, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status !== null ? result.status : 1);
