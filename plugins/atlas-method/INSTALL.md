# Installing Atlas Method

The plugin ships three skills, four hook scripts across three lifecycle events, and five scaffold templates. The plugin path is the recommended route. A manual fallback for Windows users and plugin-averse setups is at the end.

## Install from GitHub (recommended)

```bash
claude plugin marketplace add DamianBuilds-ai/atlas-method
claude plugin install atlas-method@damianbuilds
```

The first command registers the marketplace catalog from the GitHub repo. The second installs the plugin from it.

This repo carries versioned snapshots and build tooling you do not need. Sparse checkout is recommended:

```bash
claude plugin marketplace add DamianBuilds-ai/atlas-method --sparse .claude-plugin plugins
claude plugin install atlas-method@damianbuilds
```

## Install from a local clone

If you have cloned the repository already:

```bash
claude plugin marketplace add /path/to/atlas-method
claude plugin install atlas-method@damianbuilds
```

The marketplace catalog at the repo root points at `plugins/atlas-method/` automatically.

## Try without installing

```bash
claude --plugin-dir /path/to/atlas-method/plugins/atlas-method
```

Opens a session with the plugin active but not permanently installed. Useful for evaluating before committing.

## Verify the install

```bash
claude plugin details atlas-method
```

Confirm the component inventory reports `Skills (3)`, listing `atlas`, `atlas-init`, and `newbot`. All three are invoked as slash commands (`/atlas-method:atlas`, `/atlas-method:newbot`, `/atlas-method:atlas-init`), but the inventory groups them under Skills rather than Commands, so do not go looking for a Commands section. If Skills is empty or shows fewer than three, the plugin is not delivering correctly.

One trap worth naming: running `claude plugin validate .` from the repo root validates the marketplace catalog, not the plugin, and returns a passing check even when the plugin delivers zero commands. It does print which manifest it is reading, so check that first line. To validate the plugin manifest specifically:

```bash
claude plugin validate /path/to/atlas-method/plugins/atlas-method/.claude-plugin/plugin.json --strict
```

Both manifests validate clean with `--strict` as of 2026-07-30.

## Scaffold a new project

From your project directory, after installing the plugin:

```
/atlas-method:atlas-init
```

This copies the `CLAUDE.md` soil template and the four-document domain skeleton into your project. It never overwrites files that already exist. Canonical components do not assume scaffold files exist, so `/atlas-method:atlas` and `/atlas-method:newbot` work in any project whether or not you have run init.

## What the plugin provides

| Component | What it does |
|-----------|--------------|
| `/atlas-method:atlas` | Self-audit: surfaces stale queue items, checks doc health, prompts a quick-resume block |
| `/atlas-method:newbot` | Interactive domain scaffolder: picks an archetype and generates the right set of files |
| `/atlas-method:atlas-init` | Init skill: copies starter files into your project once |
| `no-em-dash.sh` | PostToolUse (Write, Edit, MultiEdit): replaces em dashes in files Claude writes |
| `scratchpad-update-nudge.sh` | UserPromptSubmit: every few turns, reminds Claude to refresh its working scratchpad |
| `task-output-verify.sh` | PostToolUse (Task): verifies agent-claimed output files actually exist |
| `wrap-push-reminder.sh` | Stop: warns if the repo is dirty when a session-end intent is detected |

## Hooks: wired automatically vs wired manually

The four hooks in the table above are live the moment the plugin is enabled. The manifest declares them; no manual settings edit is needed.

Two additional hooks ship in the repository but are not wired automatically. They are not standard Claude Code lifecycle events and cannot be declared in a plugin manifest:

- `agent-rules-inject.sh` - injects agent dispatch discipline into every spawned sub-agent
- `pre-read-hook.sh` - gates large file reads through a scout tier before they enter main context

Both live at `versions/v1.1.0/hooks/`. Wiring instructions are in `versions/v1.1.0/hooks/README.md`.

The gap that matters most: `agent-rules-inject.sh` carries the entire agent dispatch rule set. If it is not wired, sub-agents run without dispatch discipline and no error is raised. A gap that fails loudly is acceptable; one that fails silently is not. Wire it before you start delegating work to agents.

## Migrating from a hand-installed setup

If you installed Atlas Method before the plugin existed, check your project's `commands/` directory. A pre-plugin install has `atlas.md` and `newbot.md` sitting directly there. The plugin delivers namespaced versions (`/atlas-method:atlas`, `/atlas-method:newbot`), so after install you have two sources for the same command.

Steps before installing:

1. Move your hand-placed `commands/atlas.md` and `commands/newbot.md` aside. Do not delete them - they may contain edits you want to keep.
2. Note any hook entries in `~/.claude/settings.json` that point at your hand-placed copies. After the plugin is installed and its hooks confirmed live, remove the duplicate manual entries.
3. Install the plugin as described above.
4. Run `claude plugin details atlas-method` and confirm all three namespaced commands appear.

Files already in your project through `atlas-init` or hand-placement - CLAUDE.md, domain docs, QUEUE files, LOG files - are untouched by the plugin on install or update.

## CANONICAL vs SCAFFOLD files

Atlas Method files fall into two categories.

**CANONICAL** - commands, hooks, docs, procedures. Owned by the plugin and update cleanly from upstream. If you edit a canonical file in place, your edits will be overwritten on the next plugin update. Move edits into a domain-specific leaf instead.

**SCAFFOLD** - templates and skeleton files. `atlas-init` copies these once and never touches them again. Your filled-in versions are safe across any plugin update.

## Updating

Updating is two steps, because the marketplace catalog and the plugin are refreshed separately. Refreshing the catalog alone does not upgrade an installed plugin.

```bash
claude plugin marketplace update damianbuilds
claude plugin update atlas-method
```

Restart Claude Code afterwards for the update to take effect.

This replaces CANONICAL files and leaves SCAFFOLD files alone, per the section above. If you wired `agent-rules-inject.sh` or `pre-read-hook.sh` manually, check whether their source files changed in the new snapshot, because your manual wiring points at paths the update does not manage.

## Uninstall

```bash
claude plugin uninstall atlas-method
```

This removes the plugin's commands, skill, and the four manifest-wired hooks. It does not remove:

- Files `atlas-init` copied into your project (CLAUDE.md template, domain skeleton files). Those are yours; keep or delete them at your discretion. They are typically: `CLAUDE.md`, `DOMAIN.md`, `DOMAIN_QUEUE.md`, `DOMAIN_HANDOFF.md`, `DOMAIN_IDEAS.md` (with your domain name substituted).
- Manual hook entries you added to `~/.claude/settings.json` for `agent-rules-inject.sh` or `pre-read-hook.sh`. Remove those yourself for a complete uninstall.

To preserve the plugin's persistent data directory (`~/.claude/plugins/data/atlas-method/`):

```bash
claude plugin uninstall atlas-method --keep-data
```

To switch the plugin off temporarily without removing it:

```bash
claude plugin disable atlas-method
```

Re-enable with:

```bash
claude plugin enable atlas-method
```

## Manual install (fallback)

For Windows users who encounter symlink failures with the plugin path, or for setups that prefer not to use the plugin system: clone the repository and run the init script directly from your target project directory.

```bash
sh /path/to/atlas-method/versions/v1.1.0/bin/atlas-init "$(pwd)"
```

The `v1.1.0` snapshot includes commands, hooks, templates, examples, procedures, docs, and a `QUICKSTART.md`. Copy the remaining components into your project structure manually and follow the wiring instructions in `versions/v1.1.0/hooks/README.md`.

## Version note

Plugin packaging version (`0.x`) tracks separately from the methodology version (`1.x`). `VERSION` says `1.1.4` and git tags reach `v1.1.4`, but the newest complete snapshot in `versions/` is `v1.1.0`. The plugin ships from that snapshot. See CHANGELOG.md for what changed in v1.1.1 through v1.1.4. This is a known inconsistency being resolved separately, not an error.
