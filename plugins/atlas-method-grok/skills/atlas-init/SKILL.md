---
name: atlas-init
description: Copy Atlas Method starter files into the current project directory without overwriting anything the user already owns.
---

# atlas-init skill

Copy Atlas Method starter files into the current project directory without overwriting
anything the user already owns.

## When to invoke

Run this once on a new project to bootstrap the methodology. It is safe to re-run on an
existing project - files that already exist are skipped, never replaced.

## What this skill does

1. Copies the constitution template (`AGENTS.md`) into the project root.
2. Copies the one-line `CLAUDE.md` shell (`@AGENTS.md`) so Claude Code delegates to the constitution.
3. Copies the one-line `GEMINI.md` shell (`@AGENTS.md`) for Gemini compatibility.
4. Copies the four-document domain skeleton (`DOMAIN.md`, `DOMAIN_QUEUE.md`,
   `DOMAIN_HANDOFF.md`, `DOMAIN_IDEAS.md`) so the user has a first domain to rename and fill in.
5. Copies the `gazetteer.repos` manifest template.
6. Reports each file as either `create` (new) or `skip` (already present).

## Execution steps

`GROK_PLUGIN_ROOT` (or its alias `CLAUDE_PLUGIN_ROOT`) is set by the plugin system at runtime.
Run:

```bash
sh "${GROK_PLUGIN_ROOT}/bin/atlas-init" "$(pwd)"
```

If the command succeeds, show the user the create/skip summary and then print these next steps
verbatim:

1. Open the project in Grok Build.
2. Edit `AGENTS.md` - replace the placeholder domains and maintainer handle with your own.
3. Rename the `DOMAIN.*` files to your first real domain (e.g. `READING.md`, `READING_QUEUE.md`)
   and fill in the placeholders.
4. Edit `gazetteer.repos` - replace `REPLACE_WITH_ABSOLUTE_PATH_TO_atlas-method` with the
   absolute path to this repo on your machine, and add entries for any other repos you want
   the gazetteer to index.
5. Run `/atlas-method-grok:newbot` to scaffold additional domains when you are ready.

## What is NOT copied

Templates and examples from the full atlas-method repository are not copied into the user's
project. Use `/atlas-method-grok:newbot` to scaffold a specific archetype from the templates.

## Fallback if GROK_PLUGIN_ROOT is unavailable

Ask the user to run:

```bash
sh /path/to/plugins/atlas-method-grok/bin/atlas-init "$(pwd)"
```

Replacing `/path/to/plugins/atlas-method-grok` with their local path to the plugin subdirectory.
