# Hook templates

This directory ships hooks that are generally useful across Atlas Method
setups. Each hook is a standalone script you copy or symlink into your own
hooks directory and wire into your AI tool's settings.

**Scope note:** this directory ships hooks that are useful to most Atlas
Method adopters. Hooks that reflect personal workflow preferences belong in
your own setup, not here.

---

## datetime.sh - Time-awareness hook

### Why it exists

A model anchors on the date that was current when the session started. In a
chat open for hours or days, every message is answered from that stale
anchor. The model does not know the real date unless it is in context.

This hook fixes the anchor at two points:

- **SessionStart** (`--banner` mode): injects a prominent date block the
  moment the session opens. The model sees it before it types a single word.
- **UserPromptSubmit** (default mode): injects a one-line datetime string
  before every user message. The model's immediate context always contains
  the real time, even in a chat that has been open for days.

Neither injection is visible to the user. Both are invisible context
additions that keep the model's time-sense accurate.

### Usage

```
datetime.sh [--banner]
```

`--banner` - outputs the full SessionStart anchor block (use for
`SessionStart`). Default (no arguments) - outputs a single-line per-prompt
injection (use for `UserPromptSubmit`).

### Timezone

Set `ATLAS_TZ` to any IANA zone name before the hook runs. If not set, the
system timezone is used.

```bash
export ATLAS_TZ=America/New_York   # or Europe/London, Asia/Tokyo, etc.
```

You can set this in your shell profile so every session inherits it, or
inline it in the hook command registered in your settings file.

### Fail-open contract

Any error - invalid timezone, missing `jq`, unexpected date format - results
in empty output and exit code 0. The hook is silent; the session continues
normally. The date anchor simply does not appear rather than blocking the
session. This follows the M7 rule in Draft 3 section 9: "Hooks fail open.
Degraded path must be visible."

`jq` must be installed for the hook to produce output. If `jq` is absent the
hook exits silently. Install with your package manager (`brew install jq`,
`apt install jq`, etc.).

### Verification

After wiring, confirm both modes produce valid JSON:

```bash
sh datetime.sh --banner   # should print JSON with hookEventName SessionStart
sh datetime.sh            # should print JSON with hookEventName UserPromptSubmit
```

And confirm fail-open:

```bash
ATLAS_TZ=Bad/Zone sh datetime.sh --banner   # should produce output (date falls back to UTC on most systems)
# To test jq absence: temporarily rename jq or run with a PATH that excludes it
```

---

## Wiring: Claude Code

Add both blocks to `~/.claude/settings.json` (user-level, applies to all
projects) or to your project's `.claude/settings.json` (project-level).
Replace `/path/to/datetime.sh` with the actual path where you have placed
the script.

### SessionStart (banner)

```json
"SessionStart": [
  {
    "matcher": "startup|resume",
    "hooks": [
      {
        "type": "command",
        "command": "sh /path/to/datetime.sh --banner"
      }
    ]
  }
]
```

### UserPromptSubmit (per-prompt injection)

```json
"UserPromptSubmit": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "sh /path/to/datetime.sh"
      }
    ]
  }
]
```

Both blocks can coexist with other hooks in the same section. Each entry
in the hooks array runs independently; ordering within the array determines
execution order.

---

## Wiring: Grok Build

TODO - verify before wiring.

Grok Build loads `~/.claude/settings.json` hooks by default (shared registry
with Claude Code). If your setup uses `[compat.claude] hooks = false` in your
Grok config (which disables shared-registry loading), you need to wire hooks
natively in Grok's own config format.

Native Grok hook registration uses `.grok/hooks/` in the project directory
or a user-level equivalent. The event names that correspond to SessionStart
and UserPromptSubmit in Grok Build are not confirmed from docs at the time
this file was written.

Verify before wiring:
1. Check the current Grok Build hook documentation for the equivalent
   lifecycle event names.
2. Check whether `.grok/hooks/` is the correct registration path or whether
   a settings file block is needed.
3. Confirm the JSON output schema (`hookSpecificOutput.additionalContext`)
   is the same in both tools - if Grok uses a different schema, the emit_json
   function in datetime.sh needs a second output path.

Once confirmed, the registration snippet belongs here.
