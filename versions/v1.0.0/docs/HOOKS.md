# HOOKS.md - Claude Code Hooks Reference & Design

**Purpose:** One place where everything about your Claude Code hooks lives - what events exist, what hooks are active, what patterns work, what antipatterns to avoid, and how the unified session-start hook dispatcher is designed.
**Companion:** `ATLAS_METHOD.md` (the methodology), `DOC-PROTOCOL.md` (leaf management).

---

## The 26 Claude Code hook events

Most people know 5-6. There are 26.

### Useful for the method (the ones you'll actually use)

| Event | When it fires | Can inject context? | Can spawn scout? |
|-------|---------------|---------------------|------------------|
| `SessionStart` | Before Claude's opener | Yes via `additionalContext` JSON | NO - fires before Claude exists. Can inject a reminder that Claude fires a scout as its first action. |
| `UserPromptSubmit` | When user hits enter | Yes | Indirectly - can inject "fire a scout now" reminder |
| `PreToolUse` | Before any tool call | Limited | Can enforce guards, redirects |
| `PostToolUse` | After tool call completes | Yes | Can auto-summarise tool output |
| `SubagentStart` | Before an agent spawns | Yes | Can inject shared rules (CLAUDE.md patterns, no-em-dash, etc.) into subagent context |
| `PreCompact` | Before auto-compression kicks in | Yes | Can save state before loss |
| `Stop` | End of a Claude turn | No | Cleanup, auto-wrap detection, `/wrap` trigger |

### Less useful but good to know

`PostToolUseFailure`, `SessionEnd`, plus more specialized events. See Anthropic's hooks docs for the full list.

---

## Your active hook inventory

A worked example of how a mature hook inventory looks once the method is running. Yours will differ - this shows the shape and the status discipline.

### Clean and working

| Hook | Event | Purpose | Status |
|------|-------|---------|--------|
| `prompt-hook.sh` | UserPromptSubmit | Datetime injection + session ID | Clean |
| `low-context-suggest-hook.sh` | UserPromptSubmit | Nudge when context is low | Clean |
| `unconditional-stage1-reminder.sh` | UserPromptSubmit | Injects a reminder when the user opens with a slash command + a long prompt. Forces Stage 1 dispatch before answering. | Clean |
| `scratchpad-content-guard.sh` | PreToolUse (Write/Edit) | Enforce scratchpad rules | Clean (blocks with exit 2) |
| `pre-read-guard.sh` | PreToolUse (Read) | Read-discipline enforcement | Clean |
| `agent-rules-inject.sh` | PreToolUse (Task) | Prepends universal agent rules + keyword-triggered topic addons to every Task dispatch. Mutates `tool_input.prompt` via `hookSpecificOutput.updatedInput`. | Clean |
| `no-em-dash.sh` | PreToolUse | Block em dashes | Clean (exit 2) |
| `asset-reminder.sh` | Various | Remind about related assets | Clean |
| `framing-check.sh` | Various | Catch output-judgement patterns | Clean |
| `verbatim-scope.sh` | Various | Verbatim protocol enforcement | Clean |

### Agent prelude addon directory

`hooks/agent-prelude/` holds text files read by `agent-rules-inject.sh`:

- `universal.txt` - always injected. The core agent rules + universal output envelope + filename convention + chat envelope cap.
- Topic addons (one file per topic) - injected only when the prompt mentions that topic's keywords. Each carries the API base URL, auth pattern, common call shapes, and tool-specific gotchas for that integration.

To add a new addon: create the file + add a `grep -qE` keyword check + an `inject_addon` call in the hook. Keep secrets (tokens, private hostnames) OUT of any addon that ships with a public repo - inject those from a local-only, gitignored file.

### Missing (referenced in settings.json but files don't exist)

If a hook is registered in `settings.json` but its file is absent, either locate the script or remove the registration. Orphan registrations are usually backup hooks that were intended for the PreCompact event but never got deployed.

### Monitoring (have fallback behavior worth verifying)

- Any hook that depends on a remote call (e.g. an SSH timeout fallback) - verify the fallback path actually fires when the remote is unreachable.

---

## The correct injection format

SessionStart and UserPromptSubmit hooks that want to inject context into Claude's session must output a specific JSON shape to stdout:

```bash
echo '{"additionalContext": "Your reminder text here."}'
```

**NOT** plain stdout:
```bash
echo "Hey, here's your reminder."   # May be a silent no-op
```

Blocking hooks work differently - they use `exit 2` to block the triggering action and stdout for the block message. The `additionalContext` JSON rule applies only to context-injection hooks.

**A common failure mode (two bugs at once):**
- The operator plain-cat'd file contents to stdout (wrong format, but probably parsed as context anyway because of Claude Code's friendly fallback).
- They didn't parse the `prompt` field to check which slash command was invoked.
- Result: their `/dev` command unconditionally injected tens of thousands of tokens at every session start.

The fix is both: emit the `additionalContext` JSON shape, AND scope the injection to the active slash command so it only fires for the domain it serves.

---

## The unified hook dispatcher

One dispatcher script per event type. The dispatcher:
1. Reads stdin JSON (includes the `prompt` field)
2. Parses the active slash command from the prompt
3. Classifies the domain into one of four classes
4. Routes to a class-level handler

Classes:

| Class | Domains | Behavior |
|-------|---------|----------|
| `lean` | Small domains that don't benefit from injection | Inject nothing |
| `standard` | Most domains | Inject a 1-line reminder to load QUEUE + HANDOFF |
| `companion` | Companion-class domains (personal companion, reflection partner, daily-ops driver) | Stage 1 Scout reminder (warm-startup pattern - read STATUS + HANDOFF + PERSONALITY via scout, not directly) |
| `heavy` | Dev, architecture, anything with big QUEUEs | Scout fleet reminder - spawn scouts for all core files, not direct reads |

Dispatcher skeleton:

```bash
#!/usr/bin/env bash
# session-start-dispatcher.sh
# Registered for SessionStart event in ~/.claude/settings.json

set -euo pipefail
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)

DOMAIN=$(parse_domain_from_prompt "$PROMPT")
CLASS=$(classify_domain "$DOMAIN")

# Resolve the reminders directory relative to this script, so the hook
# is portable across machines (no hardcoded absolute paths).
REMINDER_DIR="$(dirname "$0")/reminders"

case "$CLASS" in
  lean)
    exit 0
    ;;
  standard)
    emit_context "Load ${DOMAIN}_QUEUE.md + ${DOMAIN}_HANDOFF.md to orient."
    ;;
  companion)
    emit_context "$(cat "$REMINDER_DIR/companion-stage1.txt")"
    ;;
  heavy)
    emit_context "$(cat "$REMINDER_DIR/heavy-scout-fleet.txt")"
    ;;
esac

# Helper: emit JSON with additionalContext field
emit_context() {
  jq -cn --arg msg "$1" '{additionalContext: $msg}'
}
```

Per-domain overrides live in `hooks/reminders/` as text files that the dispatcher can source. A domain that needs special treatment (a companion domain with its own index scout, for instance) gets its own reminder file that the companion class sources by domain name.

---

## Patterns

### Good patterns

- **Blocking guards** (diary-guard, no-em-dash, scratchpad-guard): exit 2 + stdout message. Claude sees the message, can't proceed. Clean.
- **Silent injection** (warm-startup): correct JSON, small content, domain-scoped. Stable.
- **Datetime injection** (prompt-hook): tiny content, always useful, cheap.

### Antipatterns (never do these)

- **Unconditional cat**: hook reads a file and dumps full content at every session. Massive token waste. This is the single most common way a hook silently bloats every session.
- **No domain scoping**: firing globally when the hook's purpose is domain-specific.
- **Plain stdout for injection**: may work by accident via fallback, but not guaranteed. Always use `additionalContext` JSON.
- **Agent spawning from SessionStart**: hook fires before Claude exists. Only inject reminders that Claude can ACT on in its first response.
- **File reads in hooks without size awareness**: at minimum, `wc -l` any file the hook cats before cat-ing. Warn if over 50 lines.
- **Secrets in shippable hook files**: never hardcode tokens, private hostnames, or absolute machine paths in a hook that lives in a public repo. Inject those from a local-only, gitignored file.

---

## Open questions

- **Hook injection format fallback:** if a hook outputs plain stdout instead of JSON, does Claude Code silently drop it or fall back to treating it as context?
- **PreCompact handling:** whether to build context-backup / post-compact hooks or remove their registrations.
- **Auto-wrap detection:** can a Stop hook detect "conversation seems done" heuristically (idle time, natural conclusion phrases) and suggest `/wrap`? Chats often think they're done when they're not.
