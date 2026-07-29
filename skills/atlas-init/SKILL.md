---
name: atlas-init
description: Copy Atlas Method starter files into the current project directory without overwriting anything the user already owns.
---

# atlas-init skill

Copy Atlas Method starter files into the current project directory without overwriting anything the user already owns.

## When to invoke

Run this once on a new project to bootstrap the methodology. It is safe to re-run on an existing project - files that already exist are skipped, never replaced.

## What this skill does

1. Copies the soil template (`CLAUDE.md`) into the project root.
2. Copies the four-document domain skeleton (`DOMAIN.md`, `DOMAIN_QUEUE.md`, `DOMAIN_HANDOFF.md`, `DOMAIN_IDEAS.md`) so the user has a first domain to rename and fill in.
3. Reports each file as either `create` (new) or `skip` (already present).

## Execution steps

Run the following Bash command. `CLAUDE_PLUGIN_ROOT` is set by the plugin system at runtime - if it is not available in the environment, ask the user where the atlas-method repo is cloned and substitute that path.

```bash
sh "${CLAUDE_PLUGIN_ROOT}/versions/v1.1.0/bin/atlas-init" "$(pwd)"
```

If the command succeeds, show the user the create/skip summary and then print these next steps verbatim:

1. Open the project in Claude Code.
2. Edit `CLAUDE.md` - replace the placeholders with your name and your first two or three domains.
3. Rename the `DOMAIN.*` files to your first real domain (e.g. `READING.md`, `READING_QUEUE.md`) and fill in the placeholders.
4. Copy `versions/v1.1.0/commands/atlas.md` into your Claude Code commands directory if you want the `/atlas` self-audit command. The atlas-method plugin does this automatically if installed via the plugin system.

## What is NOT copied

Templates (`versions/v1.1.0/templates/`) and examples (`versions/v1.1.0/examples/`) are available as reference inside the plugin directory but are not copied into the user's project. Use `/newbot` to scaffold a specific archetype from the templates when you are ready to add more domains.

## Fallback if CLAUDE_PLUGIN_ROOT is unavailable

Ask the user to run:

```bash
sh /path/to/atlas-method/versions/v1.1.0/bin/atlas-init "$(pwd)"
```

Replacing `/path/to/atlas-method` with their local clone path.
