#!/usr/bin/env bash
#
# Hook: scratchpad-update-nudge
# Event: UserPromptSubmit
# Purpose: Every Nth user turn (default 3), nudge Claude to update its working
#          scratchpad (State + Active-thread + Decisions-made + Open-loops).
#          NON-BLOCKING: injects additionalContext only, never blocks a prompt.
#
# Mechanism:
#   counter file: /tmp/claude-scratchpad-turns-${CLAUDE_SESSION_ID}.txt
#   on each UserPromptSubmit:
#     n = read+increment counter (init 0)
#     if n % EVERY_N != 0  -> exit 0 (silent)
#     if n % EVERY_N == 0  -> mtime carve-out, then inject the nudge
#
# Carve-out (skip if just updated): if the working scratchpad's mtime is newer
# than the last nudge tick, the session already updated it - skip to avoid
# nag-spam. Tick timestamp stored alongside the counter.
#
# Concurrency: this fires on EVERY session's prompts. The counter is keyed on
# CLAUDE_SESSION_ID so each session has its own count.
#
# Bypass: CLAUDE_BYPASS_SCRATCHPAD_NUDGE=1 suppresses all output.
#
# Configuration via env:
#   ATLAS_HOME - root of your instance (defaults to $PWD)
#   SCRATCHPAD_EVERY_N - nudge cadence in turns (default 3)
#   SCRATCHPAD_WINDOW_MIN - "recent working scratchpad" window in minutes (default 480)
#   SCRATCHPAD_TEMPLATE_PATH - path shown in the nudge message (default
#       $ATLAS_HOME/templates/scratchpad-working.md)

set -euo pipefail

# Consume stdin (UserPromptSubmit JSON).
INPUT=$(cat 2>/dev/null || true)
: "${INPUT:=}"

# Mid-task bypass: exit silently immediately if escape hatch set.
if [ "${CLAUDE_BYPASS_SCRATCHPAD_NUDGE:-}" = "1" ]; then
  exit 0
fi

ATLAS_HOME="${ATLAS_HOME:-$PWD}"
EVERY_N="${SCRATCHPAD_EVERY_N:-3}"
WINDOW_MIN="${SCRATCHPAD_WINDOW_MIN:-480}"
TEMPLATE_PATH="${SCRATCHPAD_TEMPLATE_PATH:-$ATLAS_HOME/templates/scratchpad-working.md}"
SESSION_ID="${CLAUDE_SESSION_ID:-default}"
COUNTER_FILE="/tmp/claude-scratchpad-turns-${SESSION_ID}.txt"
TICK_FILE="/tmp/claude-scratchpad-lasttick-${SESSION_ID}.txt"

# Read + increment the per-session turn counter (init 0).
_COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo 0)
case "$_COUNT" in
  ''|*[!0-9]*) _COUNT=0 ;;
esac
_COUNT=$(( _COUNT + 1 ))
printf '%s\n' "$_COUNT" > "$COUNTER_FILE"

# Not a nudge turn = stay silent.
if [ $(( _COUNT % EVERY_N )) -ne 0 ]; then
  exit 0
fi

# --- This is a nudge turn. Apply the mtime carve-out before injecting. ---

# Find the most-recent working scratchpad modified in the session window.
# (Working scratchpads are named {date}-working-{uuid8}.md per convention.)
WORKING_DIR="$ATLAS_HOME/session-files"

LATEST_WORKING=""
if [ -d "$WORKING_DIR" ]; then
  LATEST_WORKING=$(find "$WORKING_DIR" -maxdepth 2 -name "*working*.md" -mmin -"${WINDOW_MIN}" -type f 2>/dev/null \
    | tr '\n' '\0' | xargs -0 ls -t 2>/dev/null | head -1 || true)
fi

# Read the timestamp of the previous nudge tick (epoch seconds; init 0).
LAST_TICK=$(cat "$TICK_FILE" 2>/dev/null || echo 0)
case "$LAST_TICK" in
  ''|*[!0-9]*) LAST_TICK=0 ;;
esac

# Record THIS tick's timestamp for the next comparison.
NOW=$(date +%s)
printf '%s\n' "$NOW" > "$TICK_FILE"

# Carve-out: if a working scratchpad exists AND it was modified more recently
# than the previous tick, the session already updated it - skip the nudge.
if [ -n "$LATEST_WORKING" ] && [ "$LAST_TICK" -gt 0 ]; then
  SP_MTIME=$(stat -f%m "$LATEST_WORKING" 2>/dev/null || stat -c%Y "$LATEST_WORKING" 2>/dev/null || echo 0)
  case "$SP_MTIME" in
    ''|*[!0-9]*) SP_MTIME=0 ;;
  esac
  if [ "$SP_MTIME" -gt "$LAST_TICK" ]; then
    exit 0
  fi
fi

# --- Inject the nudge (under ~300 chars per the directive-budget rule). ---
NUDGE="${EVERY_N} turns since last scratchpad check. Update your working scratchpad now: refresh State + Active-thread, add any Decisions-made (newest top), update Open-loops. If over ~6K chars, roll up the oldest Decisions into one summary line. If you have not opened a working scratchpad yet this session, open one now (template: ${TEMPLATE_PATH})."

jq -n --arg msg "$NUDGE" '{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": $msg
  }
}'

exit 0
