#!/usr/bin/env bash
#
# Hook: no-em-dash
# Event: PostToolUse on Write|Edit|MultiEdit
# Purpose: Auto-fix any file write containing em dashes (pure shell, zero context cost).
#
# Claude Code hooks receive tool metadata on stdin as JSON. This hook extracts the
# tool_name and the file_path, then auto-replaces em-dash characters in place.
#
# Behaviour:
#   - When the written file contains em-dash (U+2014), run a UTF-8-safe in-place
#     perl substitution swapping U+2014 to " - " (space-hyphen-space), collapsing
#     any flanking whitespace so a pre-spaced em-dash does not become a triple-space
#     artifact. Then exit 0 (no block). The main chat never pays a correction turn.
#   - Only U+2014 (em-dash) is touched. U+2013 (en-dash) is LEFT ALONE - it is
#     legitimate in number ranges (e.g. 2020-2025).
#   - Each fix is appended to $ATLAS_HOME/reports/mdash-autofix.log (ISO timestamp +
#     file path + replacement count) for an audit trail. Set ATLAS_HOME in your
#     environment (defaults to the current working directory).
#
# Known limitation: the replace is blind - it does NOT skip em-dashes inside fenced
# code blocks. If you have a legitimate code-fence case, gate the file or add a
# fence-skip guard.
#
# Dependencies: jq, perl 5.10+ (both standard on macOS and most Linux distros).

set -euo pipefail

# Read JSON from stdin
INPUT=$(cat)

# Extract tool name and file path
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only check Write/Edit/MultiEdit tools
case "$TOOL_NAME" in
  Write|Edit|MultiEdit) ;;
  *) exit 0 ;;
esac

# Skip if no file path or file does not exist
[ -z "$FILE_PATH" ] && exit 0
[ ! -f "$FILE_PATH" ] && exit 0

# Count em-dashes (Unicode U+2014) before fixing.
# `|| true` neutralizes grep's exit-1-on-no-match so a clean file does not trip
# `set -e` at this assignment (without it, em-dash-free writes abort here non-zero).
COUNT=$(grep -c $'\xe2\x80\x94' "$FILE_PATH" 2>/dev/null | head -1 | tr -d '[:space:]' || true)
COUNT=${COUNT:-0}

if [ "$COUNT" -gt 0 ]; then
  # Auto-fix in place: swap U+2014 -> " - ", collapsing flanking whitespace so an
  # already-spaced em-dash does not yield a triple-space. En-dash (U+2013) untouched.
  perl -CSD -i -pe 's/\s*\x{2014}\s*/ - /g' "$FILE_PATH"

  # Audit trail: ISO timestamp + file path + replacement count.
  ATLAS_HOME="${ATLAS_HOME:-$PWD}"
  LOG_FILE="$ATLAS_HOME/reports/mdash-autofix.log"
  mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
  printf '%s\t%s\tcount=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$FILE_PATH" "$COUNT" >> "$LOG_FILE" 2>/dev/null || true
fi

exit 0
