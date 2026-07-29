# Installing Atlas Method as a Claude Code Plugin

The plugin ships two commands (`/atlas`, `/newbot`), four lifecycle hooks, and an init skill. Installation is one command.

## Install from the full repository

If you have cloned the full atlas-method repository, point at the plugin subdirectory:

```bash
claude plugin install /path/to/atlas-method/plugins/atlas-method
```

Replace `/path/to/atlas-method` with the absolute path to your local clone.

## Install from the repository marketplace

If you have the full repository, you can also install via the marketplace catalog at the repo root. The catalog entry automatically points at this plugin subdirectory:

```bash
claude plugin install /path/to/atlas-method
```

## Install directly from GitHub

```bash
claude plugin install github:DamianBuilds-ai/atlas-method
```

## Test locally without installing

```bash
claude --plugin-dir /path/to/atlas-method/plugins/atlas-method
```

This opens a Claude Code session with the plugin active but not permanently installed.

## Validate the manifest

```bash
claude plugin validate /path/to/atlas-method/plugins/atlas-method --strict
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
- Your `~/.claude/settings.json` hook wiring - that is still manual.

## Updating

```bash
claude plugin update atlas-method
```

## Uninstalling

```bash
claude plugin uninstall atlas-method
```

Your project files (CLAUDE.md, domain docs) are untouched.
