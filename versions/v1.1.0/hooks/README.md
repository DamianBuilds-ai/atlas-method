# Atlas Method - Hooks

Claude Code hooks are shell scripts that fire on lifecycle events (PreToolUse, PostToolUse, UserPromptSubmit, Stop). The harness pipes a JSON event payload to the script on stdin; the script can exit silently, or write a JSON object to stdout to inject context, block the tool, or warn.

This directory ships the canonical hooks for the Atlas Method. Wire them in your `~/.claude/settings.json` (or per-project `.claude/settings.json`) to get them firing.

## Conventions

- Every hook expects `jq` on `$PATH`. macOS and most Linux distros ship it.
- Hooks read configuration from environment variables, never from hardcoded paths. Set `ATLAS_HOME` to your instance root (defaults to current working directory when unset).
- Times are local (`date` with no `TZ=` override) so the hook respects whatever timezone the shell is in.
- Hooks are silent on the happy path and chatty only when something is off.
- Each hook script is `set -euo pipefail` and passes `bash -n` cleanly.

## Hooks shipped in v1.1.0

### `no-em-dash.sh`

**Event:** `PostToolUse`
**Matcher:** `Write|Edit|MultiEdit`
**What it does:** Scans every file write/edit for the em-dash character (U+2014) and replaces it in place with ` - ` (space-hyphen-space). En-dashes (U+2013) are left alone because they remain valid inside number ranges (e.g. `2020-2025`). Each fix is appended to `$ATLAS_HOME/reports/mdash-autofix.log` for audit.

**Why:** Models trained on stylebook prose love em-dashes. Most personal-system text reads better without them, and stripping at write time costs zero context. The CORE RULE in the soil template enforces the chat side; this hook handles the file side.

**Env:**
- `ATLAS_HOME` (default `$PWD`) - root of your instance, used to place the autofix log.

**Settings snippet:**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$ATLAS_HOME/hooks/no-em-dash.sh"
          }
        ]
      }
    ]
  }
}
```

### `scratchpad-update-nudge.sh`

**Event:** `UserPromptSubmit`
**Matcher:** none (fires on every prompt)
**What it does:** Counts your turns per session (counter file keyed to `CLAUDE_SESSION_ID`). Every Nth turn (default 3) it injects an `additionalContext` reminder telling Claude to refresh its working scratchpad (State, Active-thread, Decisions-made, Open-loops). If a working scratchpad in `$ATLAS_HOME/session-files/` was modified more recently than the last nudge tick, the hook stays silent that turn to avoid nagging.

**Why:** Long sessions drift. A 6KB scratchpad refreshed every few turns gives the model a recency-favoured re-anchor point that costs less than re-reading every domain doc.

**Env:**
- `ATLAS_HOME` (default `$PWD`)
- `SCRATCHPAD_EVERY_N` (default `3`) - nudge cadence in turns
- `SCRATCHPAD_WINDOW_MIN` (default `480`) - how far back to look for a "recent" scratchpad
- `SCRATCHPAD_TEMPLATE_PATH` (default `$ATLAS_HOME/templates/scratchpad-working.md`) - shown in the nudge text
- `CLAUDE_BYPASS_SCRATCHPAD_NUDGE=1` - escape hatch for a mid-task stretch where you do not want the nudge

**Settings snippet:**

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$ATLAS_HOME/hooks/scratchpad-update-nudge.sh"
          }
        ]
      }
    ]
  }
}
```

### `wrap-push-reminder.sh`

**Event:** `Stop`
**Matcher:** none (fires when the model stops)
**What it does:** Scans the last ~200 transcript lines for wrap intent (`wrap up`, `wrapping up`, `session end`, `/wrap`, etc., tuned to skip false positives like "wrap this in a div"). If wrap intent is detected, it `cd`s into `$REPO_ROOT`, runs `git status --porcelain` and `git log @{u}..HEAD`, and if either reports work, it fires a macOS desktop notification + a stderr line.

**Why:** The most common Atlas Method failure mode is closing a session with uncommitted changes. This hook catches "the user said wrap but the repo is dirty" and surfaces it before the terminal closes.

**Note:** Because this uses `git`, ensure the hook runs from inside the repo. Most Atlas instances set `REPO_ROOT` to the instance root; if your hook runs from elsewhere, set it explicitly.

**Env:**
- `REPO_ROOT` (default `$PWD`) - absolute path to the git repo to inspect
- `WRAP_DEFAULT_BRANCH` (default `main`) - fallback upstream branch if `@{u}` is unset
- `CLAUDE_TRANSCRIPT_PATH` - normally set by the harness; manual override is supported

**Settings snippet:**

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd $REPO_ROOT && $ATLAS_HOME/hooks/wrap-push-reminder.sh"
          }
        ]
      }
    ]
  }
}
```

### `task-output-verify.sh`

**Event:** `PostToolUse`
**Matcher:** `Task`
**What it does:** When a spawned agent returns, scans the response text for claimed output paths (under `agent-outputs/` and `claude-outputs/` by default). For each claimed path it verifies the file exists and is at least 100 bytes. On any miss, it injects an `additionalContext` warning so the main session knows not to trust the agent's claim. Backgrounded dispatches (`run_in_background:true`) are skipped because their files are written later, after this hook would fire.

**Why:** Agents sometimes report a deliverable that was never written (silent partial failure, scope-exceeded mid-write, etc.). Catching the mismatch at handoff time prevents the main session from acting on phantom output.

**Env:**
- `ATLAS_HOME` (default `$PWD`)
- `ATLAS_OUTPUT_DIRS` (default `"agent-outputs claude-outputs"`) - space-separated subdir names to verify
- `ATLAS_OUTPUT_MIN_BYTES` (default `100`) - threshold below which a file is flagged as suspiciously small

**Settings snippet:**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "$ATLAS_HOME/hooks/task-output-verify.sh"
          }
        ]
      }
    ]
  }
}
```

## Installing all four at once

The four hooks fire on three different events, so you can drop them into one `hooks` block. Example consolidated `settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "$ATLAS_HOME/hooks/scratchpad-update-nudge.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          { "type": "command", "command": "$ATLAS_HOME/hooks/no-em-dash.sh" }
        ]
      },
      {
        "matcher": "Task",
        "hooks": [
          { "type": "command", "command": "$ATLAS_HOME/hooks/task-output-verify.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "cd $REPO_ROOT && $ATLAS_HOME/hooks/wrap-push-reminder.sh" }
        ]
      }
    ]
  }
}
```

Make sure `ATLAS_HOME` (and `REPO_ROOT` if different) are exported in your shell profile so the hook commands resolve correctly.

## Disabling a hook

Remove its entry from `settings.json`, or set the documented bypass env var (e.g. `CLAUDE_BYPASS_SCRATCHPAD_NUDGE=1`) for a temporary mute.

## Authoring your own

Hooks shipped here follow these rules:

1. `#!/usr/bin/env bash` + `set -euo pipefail`
2. Read JSON from stdin via `jq`
3. Exit `0` silently on the happy path
4. Use env vars for all paths (never hardcode `~/your-instance/...`)
5. Use `date` without forcing a timezone
6. Stay under ~300 chars when injecting `additionalContext`
7. Pass `bash -n`

Drop new hooks into this directory and add a section to this README.
