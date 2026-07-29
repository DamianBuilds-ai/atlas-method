# Installing Atlas Method as a Claude Code Plugin

The plugin ships two commands (`/atlas`, `/newbot`), four lifecycle hooks, and an init skill. Installation is one command.

## Install

```bash
claude plugin install /path/to/atlas-method
```

Replace `/path/to/atlas-method` with the absolute path to this directory (your local clone), or point at the GitHub repo directly:

```bash
claude plugin install github:DamianBuilds-ai/atlas-method
```

## Test locally without installing

```bash
claude --plugin-dir /path/to/atlas-method
```

This opens a Claude Code session with the plugin active but not permanently installed.

## Validate the manifest

```bash
claude plugin validate /path/to/atlas-method --strict
```

## Scaffold a new project

Once the plugin is installed, bootstrap an Atlas Method instance in your project:

```
/atlas-method:atlas-init
```

This copies the CLAUDE.md soil template and the four-document domain skeleton into your project directory. It never overwrites files that already exist.

## What the plugin installs

| Component | What it does |
|-----------|--------------|
| `/atlas-method:atlas` | Self-audit: surfaces stale queue items, checks doc health, prompts a quick-resume block |
| `/atlas-method:newbot` | Interactive domain scaffolder: picks an archetype and generates the right set of files |
| `no-em-dash` hook | PostToolUse: replaces em-dashes in any file Claude writes, keeping style consistent |
| `scratchpad-update-nudge` hook | UserPromptSubmit: every few turns, reminds Claude to refresh its working scratchpad |
| `task-output-verify` hook | PostToolUse(Task): verifies agent-claimed output files actually exist |
| `wrap-push-reminder` hook | Stop: warns if the repo is dirty when a session-end (wrap) intent is detected |
| `atlas-init` skill | Scaffold-copy entry point (see above) |

## What the plugin does NOT touch

- Your existing `CLAUDE.md`, domain files, commands, or hooks.
- Any files already present in your project (init skill skips, never overwrites).
- Your `~/.claude/settings.json` hook wiring - that is still manual, per `versions/v1.1.0/hooks/README.md`.

Note: `agent-rules-inject.sh` and `pre-read-hook.sh` ship in the plugin repository as CANONICAL files but are not wired as lifecycle hooks automatically. They require user-specific configuration. See `versions/v1.1.0/hooks/README.md` for wiring instructions.

## Updating

```bash
claude plugin update atlas-method
```

CANONICAL files (commands, hooks, docs, procedures) update cleanly from upstream. SCAFFOLD files (templates, skeleton) are never touched after the first `atlas-init` copy - your filled-in versions are safe.

## Uninstalling

```bash
claude plugin uninstall atlas-method
```

Your project files (CLAUDE.md, domain docs) are untouched.

## Version note

Plugin packaging version (`0.x`) tracks separately from the methodology version (`1.x`). The methodology version in use is in `VERSION` and in `versions/`. Git tags currently reach `v1.1.4` but the newest complete snapshot in `versions/` is `v1.1.0`. The plugin ships from the `v1.1.0` snapshot. See CHANGELOG.md for what changed in v1.1.1 through v1.1.4.
