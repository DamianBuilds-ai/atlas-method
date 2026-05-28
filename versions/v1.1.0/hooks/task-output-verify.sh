#!/usr/bin/env bash
#
# Hook: task-output-verify
# Event: PostToolUse on Task
# Purpose: When an agent claims it wrote a file, verify the file actually exists
#          and has more than trivial content. If not, surface a warning via
#          additionalContext so the main session knows not to trust the claim.
#          Does NOT block - it advises.
#
# Behaviour:
#   - Skips backgrounded Task calls (run_in_background:true) - those return a
#     launch-ack and the agent writes its file later, so verifying at launch
#     time would always false-MISSING.
#   - Parses the agent response text for claimed output paths under
#     $ATLAS_OUTPUT_DIRS (default: "agent-outputs claude-outputs"), relative to
#     $ATLAS_HOME or absolute.
#   - For each claimed path: verify exists + size >= MIN_BYTES (default 100).
#   - On any failures: inject an additionalContext warning listing the misses.
#
# Configuration via env:
#   ATLAS_HOME - root of your instance (defaults to $PWD)
#   ATLAS_OUTPUT_DIRS - space-separated subdir names to scan for (default
#       "agent-outputs claude-outputs")
#   ATLAS_OUTPUT_MIN_BYTES - minimum bytes to consider non-suspicious (default 100)

set -euo pipefail

INPUT=$(cat)

# Background dispatches return a launch-ack immediately while the agent keeps
# running. Verifying claimed files at launch time produces false MISSING warnings.
IS_BACKGROUND=$(echo "$INPUT" | jq -r '.tool_input.run_in_background // false' 2>/dev/null || echo "false")
if [ "$IS_BACKGROUND" = "true" ]; then
  exit 0
fi

# Extract the agent's response text
RESPONSE=$(echo "$INPUT" | jq -r '.tool_response.content // .tool_response // empty' 2>/dev/null || echo "")
[ -z "$RESPONSE" ] && exit 0

ATLAS_HOME="${ATLAS_HOME:-$PWD}"
OUTPUT_DIRS="${ATLAS_OUTPUT_DIRS:-agent-outputs claude-outputs}"
MIN_BYTES="${ATLAS_OUTPUT_MIN_BYTES:-100}"

# Build a regex alternation from the configured output dirs
DIRS_ALT=$(echo "$OUTPUT_DIRS" | tr ' ' '|')

# Find all claimed paths in the response. We accept three prefix forms:
#   ~/... (tilde-relative to $HOME)
#   $ATLAS_HOME/... (absolute via env)
#   relative ./{dir}/...  (relative to $ATLAS_HOME)
# Extensions covered: md|html|json|txt
PATTERN_TILDE="~/(${DIRS_ALT})/[a-zA-Z0-9._/-]+\\.(md|html|json|txt)"
PATTERN_ABS="${ATLAS_HOME}/(${DIRS_ALT})/[a-zA-Z0-9._/-]+\\.(md|html|json|txt)"
PATTERN_REL="(${DIRS_ALT})/[a-zA-Z0-9._/-]+\\.(md|html|json|txt)"

CLAIMED_PATHS=$(echo "$RESPONSE" | grep -oE "${PATTERN_TILDE}|${PATTERN_ABS}|${PATTERN_REL}" | sort -u || true)

[ -z "$CLAIMED_PATHS" ] && exit 0

WARNINGS=""
while IFS= read -r RAW; do
  [ -z "$RAW" ] && continue
  # Normalize: ~ -> $HOME; otherwise if not absolute, prepend $ATLAS_HOME
  case "$RAW" in
    \~/*) EXPANDED="${RAW/#\~/$HOME}" ;;
    /*)   EXPANDED="$RAW" ;;
    *)    EXPANDED="$ATLAS_HOME/$RAW" ;;
  esac

  if [ ! -f "$EXPANDED" ]; then
    WARNINGS+="MISSING: ${RAW} (agent claimed write but file not found)\n"
    continue
  fi

  SIZE=$(stat -f%z "$EXPANDED" 2>/dev/null || stat -c%s "$EXPANDED" 2>/dev/null || echo 0)
  if [ "$SIZE" -lt "$MIN_BYTES" ]; then
    WARNINGS+="SUSPICIOUS: ${RAW} exists but only ${SIZE} bytes (likely partial write)\n"
    continue
  fi
  # File OK - silent pass
done <<< "$CLAIMED_PATHS"

[ -z "$WARNINGS" ] && exit 0

MSG="AGENT OUTPUT VERIFICATION FAILED:
${WARNINGS}
Main session: do NOT trust agent's claimed deliverables. Re-dispatch or fall back to direct work."

jq -n --arg msg "$MSG" '{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": $msg
  }
}'

exit 0
