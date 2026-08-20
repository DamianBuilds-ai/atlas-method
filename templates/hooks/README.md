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

---

## session-start.sh - SessionStart hook (M7)

### Why it exists

AI runners do not write a baton stub or generate the orientation view because
the spec asked them to. That is a hook. Draft 3 s. 9 M7 states this directly:
"Grok / Claude will not write a baton stub or generate the view because the
spec asked. That is a hook."

This hook runs at every SessionStart and performs four steps:

1. Resolves the active domain from `$ATLAS_DOMAIN` or `.atlas/domain`.
2. Attempts `atlas refresh --domain X` if `gh` is authenticated.
3. Writes a baton stub to `sessions/current/YYYY-MM-DD_HHMM_{domain}.md`.
4. Runs `atlas orientation --domain X --out sessions/current/orientation-{domain}.md`.
5. **Claude Code only:** emits `additionalContext` JSON carrying the orientation
   content so the model sees it immediately without a file read.

Every step is fail-open. A failure emits a visible notice to stderr and
continues. Exit 0 always - the session is never blocked.

### File-first design (critical for Grok)

Grok Build ignores hook stdout on `SessionStart` (see Grok Build section
below). The orientation file is the primary delivery mechanism for Grok and
for any other runner that does not support `additionalContext` injection.
The `AGENTS.md` constitution instructs the session to read
`sessions/current/orientation-{domain}.md` at start - that is the contract.
Claude's `additionalContext` JSON is a bonus enhancement, never the primary.

### Domain resolution

Set `ATLAS_DOMAIN` to the domain slug before the hook runs:

```bash
export ATLAS_DOMAIN=treasury
```

Or create `.atlas/domain` in the project root containing only the domain slug.
If neither is set the hook falls back to "unknown" with a visible notice.

### Prerequisites

- `atlas` CLI on PATH or `cli/atlas-launch.sh` in the project root.
- `gh` CLI authenticated (`gh auth login`) for refresh to run.
- `templates/baton-stub.md` in the project root for the full stub template.
  A minimal inline stub is written as a fallback if the template is missing.

### Installer step 1: folder trust

Project hooks require the project folder to be trusted before they run.

**Claude Code:**

```bash
# In the project directory:
/hooks-trust
# or:
claude --trust
```

**Grok Build:**

```bash
grok plugin install --trust
# or in an existing session:
/hooks-trust
```

Folder trust is required for Claude Code to execute project-level hooks.
Without it the hook registration is ignored. Run this once after cloning.

---

### Wiring: Claude Code (session-start.sh)

Add to `.claude/settings.json` in the project root (project-level) or to
`~/.claude/settings.json` (user-level, applies to all projects). Run
folder trust first (see Installer step 1 above).

Replace `/path/to/session-start.sh` with the actual path where you have
placed the script (e.g. copy it from `templates/hooks/session-start.sh`).

```json
"SessionStart": [
  {
    "matcher": "startup|resume",
    "hooks": [
      {
        "type": "command",
        "command": "sh /path/to/session-start.sh"
      }
    ]
  }
]
```

The hook emits `additionalContext` JSON containing the orientation view.
Claude Code injects this into the session context before the first model
response. The model sees the orientation without needing to read the file.

---

### Wiring: Grok Build (session-start.sh)

**Grok Build hook facts** (sourced from `~/.grok/docs/user-guide/10-hooks.md`,
2026-08-20 proof seat):

- **Event names:** `SessionStart` and `UserPromptSubmit` (same as Claude Code).
- **Stdout is ignored on SessionStart.** "stdout is ignored. Just exit 0 on
  success." The `hookSpecificOutput` / `additionalContext` JSON pattern this
  hook emits works in Claude Code but **does not inject anything in Grok Build.**
- **Registration:** `.grok/hooks/` project directory or the user-level
  equivalent. Grok also loads `~/.claude/settings.json` hooks by default
  unless `[compat.claude] hooks = false`.

**Practical consequence for M7:** the hook still runs and still writes the
orientation file and baton stub. The files are the delivery. The Grok session
reads `sessions/current/orientation-{domain}.md` per the `AGENTS.md`
constitution - that instruction is what closes the loop, not stdout injection.

Registering in `.grok/hooks/session-start.json`:

```json
{
  "event": "SessionStart",
  "command": "sh /path/to/session-start.sh"
}
```

Do not paste the Claude `additionalContext` JSON block into a Grok snippet
claiming it injects. It does not. The file is the contract.

### Verification

After wiring, confirm the hook runs and produces files:

```bash
# Dry run in a fixture directory:
export ATLAS_DOMAIN=myproject
sh templates/hooks/session-start.sh
# Expect:
#   sessions/current/YYYY-MM-DD_HHMM_myproject.md  (baton stub, ~29 lines)
#   sessions/current/orientation-myproject.md       (<=80 lines)
# stderr notices visible (atlas/gh not found if uninstalled - that is correct)

# Check line counts:
wc -l sessions/current/orientation-myproject.md    # should be <=80
wc -l sessions/current/YYYY-MM-DD_HHMM_myproject.md  # should be <=40
```

And confirm fail-open (no crash on missing atlas):

```bash
# Temporarily rename atlas or run in a PATH that excludes it:
PATH=/usr/bin sh templates/hooks/session-start.sh
# Expect: visible notices on stderr, exit 0, no crash.
```
