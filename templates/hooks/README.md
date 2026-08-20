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

Any error - invalid timezone, unexpected `date` command failure - results in
empty output and exit code 0. The hook is silent; the session continues
normally. The date anchor simply does not appear rather than blocking the
session. This follows the M7 rule in Draft 3 section 9: "Hooks fail open.
Degraded path must be visible."

No external dependencies beyond `date`. JSON is assembled with `printf`,
which is a shell built-in. The earlier version required `jq`; that
dependency has been removed.

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

Grok Build hook facts (sourced from `~/.grok/docs/user-guide/10-hooks.md`,
2026-08-20 proof seat):

- **Event names:** Grok uses the same names - `SessionStart` and
  `UserPromptSubmit` - matching Claude Code.
- **Stdout is ignored on both events.** `UserPromptSubmit` is observe-only
  (exit code and stdout are ignored). `SessionStart` is a passive event:
  "stdout is ignored. Just exit 0 on success." The `hookSpecificOutput` /
  `additionalContext` pattern used by this hook works in Claude Code but
  **does not inject anything in Grok Build today.**
- **Registration** follows `.grok/hooks/` (project) or a user-level
  equivalent, and Grok also loads `~/.claude/settings.json` hooks by default
  unless `[compat.claude] hooks = false` is set. Registration here is
  documented for parity and for when Grok adds stdout support on these events.

**Practical consequence:** wiring this hook in Grok Build will not cause
errors (fail-open, exit 0), but the date will not be injected into context.
Grok M7 orientation requires a different injection mechanism (file drop or a
future native event) - not this JSON pattern. That mechanism is deferred to
M7 and must not copy the `additionalContext` approach documented above.
