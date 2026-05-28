# Atlas Method v1.1.0 Migration Guide

(For Claude: this is a migration brief. Read every section first, then walk the user through the Update steps section in order. After each step, confirm with the user that it worked before moving to the next. Do not batch the steps. If the user has the legacy `claude-code-method` repo, also walk them through the Stan-only section near the end. Otherwise skip it.)

## Quick context

v1.1.0 is the first real extension release on top of v1.0.0. The headline shift is that `/atlas` becomes audit-only, and a new `/newbot` command takes over domain scaffolding with 7 archetypes. Wrap discipline, first-run UX, and four mechanical hooks are also new. Everything is additive - existing v1.0.0 setups keep working, and the update is a pull plus a settings.json edit.

Update if you want cleaner domain scaffolding, a documented wrap protocol, the em-dash chat rule, or the new hooks.

## Update steps (walk user through these)

Run these in order. Confirm each one before moving on.

### 1. Pull v1.1.0

```bash
cd ~/atlas-method
git pull origin master
```

Confirm the user sees v1.1.0 files (look for `versions/v1.1.0/` with `QUICKSTART.md`, `procedures/wrap.md`, `commands/newbot.md`).

### 2. Diff what's new

```bash
git log --oneline v1.0.0..v1.1.0
ls versions/v1.1.0/
```

Read the changelog entry for 1.1.0 in `CHANGELOG.md`. Skim `versions/v1.1.0/QUICKSTART.md` and `versions/v1.1.0/procedures/wrap.md` so you know what's new.

### 3. Wire the new hooks in settings.json

Four new hooks ship in `versions/v1.1.0/hooks/`. Each one has a settings.json snippet in `hooks/README.md` under its section. Walk the user through opening `~/.claude/settings.json` (or `.claude/settings.json` in the project) and pasting in:

- `no-em-dash.sh` - PostToolUse on Write/Edit/MultiEdit
- `scratchpad-update-nudge.sh` - UserPromptSubmit, every 3rd turn
- `wrap-push-reminder.sh` - Stop, fires on wrap intent
- `task-output-verify.sh` - PostToolUse on Task

Set `ATLAS_HOME` in the user's shell rc (`~/.zshrc` or `~/.bashrc`) to their atlas-method instance root, so the hooks find their paths:

```bash
export ATLAS_HOME="$HOME/atlas-method"
```

Confirm with `chmod +x versions/v1.1.0/hooks/*.sh` if the scripts are not yet executable.

### 4. Try /newbot to scaffold a test domain

In a Claude Code session, run:

```
/newbot
```

It will ask 4 questions: name, archetype (pick `single-purpose` for the first test), description, confirm. Then it generates the trunk doc, queue, slash command, and a routing-row text snippet for the user to paste into their CLAUDE.md. Verify the new files exist under the user's domain location.

If the test domain looks good, delete it and run `/newbot` again for a real one.

### 5. Read QUICKSTART.md

```bash
open versions/v1.1.0/QUICKSTART.md
```

This is the first-time-user walkthrough. Even for existing users it's worth skimming, because it shows the v1.1.0 flow (`/newbot` first, not `/atlas init`).

### 6. Read procedures/wrap.md and align the user's wrap habit

```bash
open versions/v1.1.0/procedures/wrap.md
```

This is the 8-step wrap protocol with cookie definitions. The cookies are:

- `wrap` = full 8 steps
- `checkpoint` = steps 1, 2, 6 (QUEUE + HANDOFF + push)
- `sync` = step 6 only (just push)

If the user already wraps loosely, walk them through what each step looks like in their own domains.

## What's new (full list)

### 1. /atlas is now audit-only

`/atlas init` is gone. In v1.0.0 it scaffolded new domains alongside its audit and fix modes. The original methodology spec only had audit and fix, so `init` was extra surface area that overlapped with what `/newbot` does better.

If the user types `/atlas init {domain}` it now returns a one-line pointer to `/newbot {domain}`. Files created with the v1.0.0 `init` are still valid. Nothing to migrate, only the surface command changes.

### 2. /newbot - 7 archetypes for new domains

The biggest addition. `/newbot` is an interactive command that scaffolds a new domain in 2 minutes. It asks 4 questions, copies the right archetype template folder, substitutes placeholders, and gives the user a routing snippet to paste into their CLAUDE.md.

7 archetypes ship:

1. **single-purpose** - one scope, no persona, no engine (Hermes / Utilities / Drake shape)
2. **companion** - persona-led, verbatim-protocol, status + handoff + personality
3. **learning-system** - topic + coursework + progress (Feynman shape)
4. **game** - status + goals + collection + knowledge (Warframe / EVE / OSRS shape)
5. **job-search** - applications + career + per-opportunity leaves (Treasury-jobs shape)
6. **business** - ICP + workstream leaves (Synqr / DamianBuilds shape)
7. **bot-product** - product spec + ops (Talon / Solmere shape)

Each archetype template lives at `versions/v1.1.0/templates/newbot/{archetype}/`.

The protocol doc is at `versions/v1.1.0/docs/NEWBOT-PROTOCOL.md`. Read that before customising templates.

### 3. NEWBOT-PROTOCOL.md

~400 line doc that explains how `/newbot` works, what each archetype is for, the placeholder convention (`{DOMAIN}`, `{DOMAIN_LOWER}`, `{DOMAIN_TITLE}`, `{DOMAIN_DESCRIPTION}`, `{SLASH_NAME}`, `{DATE}`), how to add a new archetype, and how the orchestrator copies templates.

Path: `versions/v1.1.0/docs/NEWBOT-PROTOCOL.md`

### 4. procedures/wrap.md

The 8-step generic wrap protocol with cookie definitions. Generic, not coupled to any one user's domain setup. Covers:

1. Update QUEUE
2. Update HANDOFF
3. LOG rotation (if Recently Completed has 5+ items)
4. Update NEXT_ACTIONS
5. Content moments (if relevant)
6. Git push
7. Temp file cleanup
8. Cross-domain memory write (if applicable)

Path: `versions/v1.1.0/procedures/wrap.md`. ~145 lines.

### 5. QUICKSTART.md

First-time user walkthrough. Install through first wrap. 199 lines. Lives at `versions/v1.1.0/QUICKSTART.md`.

The v1.0.0 README was a manifest of what shipped, not a walkthrough. QUICKSTART fills that gap.

### 6. em-dash CORE RULE in soil

Added a one-line rule to `versions/v1.1.0/skeleton/CLAUDE.md.template` under CORE RULES:

> NO EM DASHES OR EN DASHES IN ANY OUTPUT. Use ' - ' (space-hyphen-space) for parenthetical breaks. Use ',' or ';' for clause joins. Use '(...)' for asides. The hook catches file writes but not chat - this rule is the chat-side enforcement.

Why: em-dashes read as AI-generated tells. The `no-em-dash.sh` hook handles file writes, but until v1.1.0 there was no chat-side enforcement. Now there is.

### 7. 4 Phase 1 hooks

All pure mechanics, no domain coupling. Each has a wiring spec in `versions/v1.1.0/hooks/README.md`.

- **no-em-dash.sh** - PostToolUse autofix on Write/Edit/MultiEdit. Replaces U+2014 with ` - `. Logs to `$ATLAS_HOME/reports/mdash-autofix.log`.
- **scratchpad-update-nudge.sh** - UserPromptSubmit. Every 3rd turn, nudges the user to update the working scratchpad.
- **wrap-push-reminder.sh** - Stop hook. Fires on wrap intent ("wrap up", "wrapping", "session end"). Checks git state and notifies if there are uncommitted changes or unpushed commits. Renamed from `wrap-git-push-reminder.sh` in v1.0.0 internal.
- **task-output-verify.sh** - PostToolUse on Task. Verifies agent-claimed output paths exist and are > 100 bytes. Catches silent agent failure.

All four set `ATLAS_HOME` from env (falls back to `$PWD`). No hardcoded paths.

## /newbot quickref

Inside Claude Code, type `/newbot`. It will ask:

1. **Domain name** - e.g. `kraken`, `mosaic`, `pilot`
2. **Archetype** - pick one of the 7 (defaults to `single-purpose` if you skip)
3. **One-line description** - what is this domain for
4. **Confirm** - shows you the file plan, you say yes

Then it:

1. Copies the archetype template folder to your domain location
2. Substitutes `{DOMAIN}`, `{DOMAIN_LOWER}`, `{DOMAIN_TITLE}`, `{DOMAIN_DESCRIPTION}`, `{SLASH_NAME}`, `{DATE}` everywhere
3. Prints a routing-row text snippet for you to paste into your CLAUDE.md domain isolation table
4. Tells you the slash command path to wire into `~/.claude/commands/` or the project's `.claude/commands/`

It does NOT auto-edit your CLAUDE.md. Safety on unknown installs. You paste the routing row yourself.

To run from shell (CI, non-Claude-Code): `bash versions/v1.1.0/bin/newbot.sh {name} {archetype}`. Coming in v1.2.0.

## STRIPPED: /atlas init is gone

The init mode is removed from `versions/v1.1.0/commands/atlas.md`. `/atlas` is now audit and fix only, which matches the original methodology spec (oxide's internal `/atlas` v6.1 has always been audit-only).

Running `/atlas init {domain}` now returns a one-line pointer to `/newbot {domain}`. Files created in v1.0.0 with `init` are untouched and still valid - only the surface command changes.

## Stan-only section (skip if you don't have legacy claude-code-method)

This section applies only if the user has the legacy `claude-code-method` repo alongside `atlas-method`. Confirm with the user before walking through it.

`claude-code-method` was the pre-rename name for what became `atlas-method`. The two repos overlap heavily and are confusing to maintain in parallel. v1.1.0 doesn't ship a hard migrator, but here's the consolidation path:

1. Make sure `atlas-method` is on v1.1.0 (steps 1-6 above)
2. Diff your `claude-code-method` working tree against `atlas-method/versions/v1.1.0/` - anything unique in `claude-code-method` (custom hooks, custom commands, custom skeleton edits) should be copied across
3. Archive the `claude-code-method` git remote locally (don't delete - keep as `~/code/_archived/claude-code-method/`)
4. Update any shell aliases, settings.json paths, or symlinks that pointed at `claude-code-method` to point at `atlas-method`

If you customised `claude-code-method` heavily and don't want to consolidate yet, that's fine - v1.1.0 of `atlas-method` doesn't require you to. The consolidation is a quality-of-life cleanup, not a forced migration.

## v1.2.0 preview

Internal validation is in progress. Landing once tested:

- **Verbatim + scratchpad protocols** - full companion-class infrastructure (scope hook, day-cross self-heal, scratchpad guards). Queued behind /newbot persona-led archetype hardening from v1.1.0 feedback.
- **Main chat as pure orchestrator** - new CORE RULE plus warn-only Read/Write guards. Main chat dispatches, agents do the work.
- **Cross-domain slash worker dispatch** - invoke `/atrium` inside another chat for a one-off task without switching domains.
- **Scratchpad-as-prompt-carrier** - TASK-{id} blocks in the session scratchpad reduce dispatch verbosity by 50%+. Shipped internally 2026-05-28, validated on the v1.1.0 build itself.
- **Date discipline (3-layer datetime suite)** - SessionStart banner + agent dispatch date injection + CORE RULE for date derivation from `$(date)`.

No timeline commitment. These ship when they hold up under real load.

## Feedback

Issues, gaps, or weird behaviour: `github.com/DamianBuilds-ai/atlas-method/issues`

If a step in this migration didn't work, file an issue with what you ran and what you saw. v1.1.0 is the first real extension release and the migration UX needs the feedback to get better.
