#!/usr/bin/env bash
#
# Hook: pre-read-hook
# Event: PreToolUse on Read
# Purpose: Suggest a Scout call when Claude is about to Read a file that exceeds
#          any single threshold (lines, bytes, or estimated tokens).
#          Line-count alone is insufficient - a short-but-dense file (few lines,
#          many bytes) burns just as much context as a long sprawling one.
#
# This is the scout-trigger mechanism: instead of reading a large file inline
# (and spending its full token cost in the main context window), the hook
# nudges you to dispatch a Scout agent that returns only the slice you need.
#
# Bypass mechanisms:
#   CLAUDE_BYPASS_PRE_READ=1  - set this env var to suppress all advisory output
#                               for the duration of a mid-task stretch where Scout
#                               friction is unwanted. Unset when task completes.
#   SILENT_FIRST_N (default 3) - the first N reads per session always pass through
#                               silently, so warm-startup reads (QUEUE/HANDOFF/STATE)
#                               are never spammed. Counter file keyed to
#                               CLAUDE_SESSION_ID at /tmp/claude-pre-read-counter-*.txt

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

[ "$TOOL_NAME" != "Read" ] && exit 0
[ -z "$FILE_PATH" ] && exit 0
[ ! -f "$FILE_PATH" ] && exit 0

# Binary-file guard: these types never benefit from scout suggestion
# (they are not line-based prose/code, or are handled by dedicated tools)
FILE_EXT="${FILE_PATH##*.}"
case "$FILE_EXT" in
  jsonl|png|jpg|jpeg|pdf)
    exit 0
    ;;
esac

# Mid-task bypass: if CLAUDE_BYPASS_PRE_READ=1, exit silently immediately.
if [ "${CLAUDE_BYPASS_PRE_READ:-}" = "1" ]; then
  exit 0
fi

# First-N-reads silent pass-through per session.
# The first SILENT_FIRST_N reads never trigger an advisory, so warm-startup
# reads of QUEUE/HANDOFF/STATE files are never noisily flagged.
SILENT_FIRST_N=3
COUNTER_FILE="/tmp/claude-pre-read-counter-${CLAUDE_SESSION_ID:-default}.txt"
_COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo 0)
_COUNT=$(( _COUNT + 1 ))
printf '%s\n' "$_COUNT" > "$COUNTER_FILE"
if [ "$_COUNT" -le "$SILENT_FIRST_N" ]; then
  exit 0
fi

# Triple-threshold scout trigger - any single threshold trips the suggestion.
# Using three independent measures so dense files (few lines, many bytes)
# are caught the same as sprawling files (many lines, few bytes).

# Line threshold: coarse structural size.
# 300 matches the leaf-size guideline (a leaf should stay under ~300 lines).
LINE_MAX=300

# Byte threshold: catches dense files (minified JSON, long-paragraph prose, etc).
# A file can be short on lines but heavy on bytes - line count alone misses it.
BYTE_MAX=30000

# Token estimate: bytes / 4 is a reasonable upper bound for token count.
# Flags files that will consume significant context when read in full.
TOKEN_MAX=7500

# Measure the file
LINES=$(wc -l < "$FILE_PATH" 2>/dev/null || echo 0)
BYTES=$(wc -c < "$FILE_PATH" 2>/dev/null || echo 0)

# Derive token estimate from byte count (bytes / 4, integer division)
EST_TOKENS=$(( BYTES / 4 ))

# Stage 1 warm-startup files are allowed direct read without suggestion.
# These are startup-critical and must be loaded verbatim every session.
STAGE1_PATTERNS="_QUEUE.md _HANDOFF.md _PROGRESS.md _STATUS.md NEXT_ACTIONS.md"
for PATTERN in $STAGE1_PATTERNS; do
  if echo "$FILE_PATH" | grep -q "$PATTERN"; then
    exit 0
  fi
done

# Check each threshold independently - first trip wins
TRIPPED=""
TRIPPED_VALUE=""

if [ "$LINES" -ge "$LINE_MAX" ]; then
  TRIPPED="lines"
  TRIPPED_VALUE="${LINES} lines (threshold: ${LINE_MAX})"
elif [ "$BYTES" -ge "$BYTE_MAX" ]; then
  TRIPPED="bytes"
  TRIPPED_VALUE="${BYTES} bytes (threshold: ${BYTE_MAX})"
elif [ "$EST_TOKENS" -ge "$TOKEN_MAX" ]; then
  TRIPPED="tokens"
  TRIPPED_VALUE="~${EST_TOKENS} estimated tokens (threshold: ${TOKEN_MAX})"
fi

# No threshold tripped - allow silently
if [ -z "$TRIPPED" ]; then
  exit 0
fi

# Suggest Scout call (advisory, does not block)
cat << EOF
PRE-READ SUGGESTION: $FILE_PATH exceeded the $TRIPPED threshold ($TRIPPED_VALUE).
Size: $LINES lines, $BYTES bytes, ~$EST_TOKENS estimated tokens.
Consider firing a Scout to return only the section you need.
Scout template: "Read $FILE_PATH lines X-Y, return verbatim"

Override this suggestion if you need the full file or it's a Stage 1 warm-startup file.
Post-Edit carve-out: if you just ran Edit on this file, direct Read is allowed (single-turn).
EOF

exit 0
