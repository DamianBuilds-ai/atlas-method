#!/bin/bash
# agent-rules-inject.sh - Prepends universal agent rules to every Task tool dispatch.
# Registered as a PreToolUse hook on matcher "Task" in settings.json.
#
# This is "Pattern D": spawned agents do NOT inherit your project's CLAUDE.md or
# memory. Rather than re-paste the house rules into every spawn prompt by hand,
# this hook injects them automatically at dispatch time. Two blocks ship by
# default: a universal-rules block (output contract, sequential processing,
# scope discipline) and an always-on safety block (hard prohibitions that no
# spawn prompt can override). Both are read from plain-text files in the
# agent-prelude directory, so you can edit the rules without touching this hook.
#
# Extending: drop a new {topic}.txt file in the agent-prelude directory and add
# a keyword branch in the "Topic addons" section below. Keep addon files free of
# secrets - anything in agent-prelude is injected verbatim into agent prompts.

set -euo pipefail

INPUT=$(cat)

# Extract the original prompt
ORIGINAL_PROMPT=$(echo "$INPUT" | jq -r '.tool_input.prompt // ""')

# If somehow there's no prompt, allow through unchanged
if [ -z "$ORIGINAL_PROMPT" ]; then
  echo "$INPUT" | jq '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow"
    }
  }'
  exit 0
fi

# Idempotency guard - if the prompt already carries the universal-rules marker,
# do not double-inject. Protects against any upstream re-dispatch where the
# prompt has already been mutated by a prior pass through this hook.
if echo "$ORIGINAL_PROMPT" | grep -qF "UNIVERSAL AGENT RULES (injected by"; then
  echo "$INPUT" | jq '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow"
    }
  }'
  exit 0
fi

# --- Resolve the prelude directory ---------------------------------------
# Prelude text files live next to this hook in an agent-prelude/ subfolder.
# Resolve relative to the hook's own location so the repo is portable - no
# hardcoded absolute paths. Override with ATLAS_PRELUDE_DIR if your layout
# differs (e.g. preludes installed under $HOME/.atlas-method/hooks).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PRELUDE_DIR="${ATLAS_PRELUDE_DIR:-$SCRIPT_DIR/agent-prelude}"

# --- Universal block -----------------------------------------------------
# If the file-based universal addon exists, prefer it (single source of truth).
# Fall back to an inline block to keep the hook resilient if the prelude dir
# is missing.

if [ -f "$PRELUDE_DIR/universal.txt" ]; then
  RULES=$(cat "$PRELUDE_DIR/universal.txt")
else
  echo "agent-rules-inject.sh: WARN universal.txt missing, falling back to inline rules" >&2
  RULES="UNIVERSAL AGENT RULES (injected by agent-rules-inject.sh):

1. NO EM DASHES. Use ' - ' (space-hyphen-space) instead. NEVER use --- or em dashes anywhere in your output.
2. SEQUENTIAL PROCESSING. If you have multiple items to process, do them ONE AT A TIME, fully completing each before moving to the next. No batch-reading 5+ items at once.
3. DOMAIN ISOLATION. Read ONLY the files explicitly named in your task. Never explore 'just in case'. If you need a file outside your scope, return scope-exceeded and let the main session escalate.
4. INCREMENTAL OUTPUT. After each item or major step, write progress to your output file. Do not buffer all output until the end.
5. BLUF format for Analyst/Engineer/Architect outputs: TL;DR or recommendation in the first 5-10 lines, then findings, then evidence/sources at the bottom.
6. SCHEMA VERSION. Output frontmatter must include schemaVersion: 1, tier name, status, and tool_budget_used.
7. SCOPE-EXCEEDED. If you hit something outside your tier's scope, return a structured scope-exceeded signal with recovery_hint. Do not drift outside scope to handle it.
"
fi

# --- Topic addons (keyword-triggered) -------------------------------------
# Lowercase the prompt once, then probe for trigger keywords. Each matching
# addon is appended to a single ADDONS string. Missing addon files log to
# stderr and are skipped - the hook never fails the dispatch over a missing
# addon.
#
# The default ship includes only the universal + safety blocks. Topic addons
# are an extension point: write a {topic}.txt prelude (free of secrets) and add
# a keyword branch here. The example branch below is commented out as a pattern.

PROMPT_LOWER=$(echo "$ORIGINAL_PROMPT" | tr '[:upper:]' '[:lower:]')

ADDONS=""

inject_addon() {
  local file="$1"
  local label="$2"
  if [ -f "$file" ]; then
    ADDONS="${ADDONS}"$'\n\n'"$(cat "$file")"
  else
    echo "agent-rules-inject.sh: WARN addon $label missing at $file - skipping" >&2
  fi
}

# Always-on: safety addon (no keyword gate, applies to every dispatch).
# These are hard prohibitions that protect against an agent doing something
# destructive in service of a well-meaning brief. The brief never overrides them.
inject_addon "$PRELUDE_DIR/safety.txt" "safety"

# Example topic-addon pattern (commented out). To enable a topic addon, drop a
# secret-free {topic}.txt in the prelude dir and uncomment a branch like this:
#
# if echo "$PROMPT_LOWER" | grep -qE 'your-keyword|another-keyword'; then
#   inject_addon "$PRELUDE_DIR/your-topic.txt" "your-topic"
# fi

# --- Assemble + return ---------------------------------------------------

if [ -n "$ADDONS" ]; then
  INJECTED_PROMPT="${RULES}"$'\n=== TOPIC ADDONS ===\n'"${ADDONS}"$'\n\n=== END ADDONS ===\n\nORIGINAL TASK BRIEF FOLLOWS:\n\n'"${ORIGINAL_PROMPT}"
else
  INJECTED_PROMPT="${RULES}"$'\nORIGINAL TASK BRIEF FOLLOWS:\n\n'"${ORIGINAL_PROMPT}"
fi

# Return updated tool input
jq -n --arg prompt "$INJECTED_PROMPT" '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "updatedInput": {
      "prompt": $prompt
    }
  }
}'
