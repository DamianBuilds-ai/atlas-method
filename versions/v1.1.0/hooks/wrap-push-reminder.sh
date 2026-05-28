#!/usr/bin/env bash
#
# Hook: wrap-push-reminder
# Event: Stop
# Purpose: When wrap intent is detected in the recent transcript, verify that the
#          repo has no uncommitted changes and no unpushed commits. If something
#          is left behind, surface a desktop notification + stderr warning so the
#          user does not close the session with work uncommitted.
#
# Behaviour:
#   - Reads the Stop event JSON for the transcript path
#   - Scans the last 200 transcript lines for wrap intent (case-insensitive regex
#     tuned to avoid false positives like "wrap this in a div")
#   - If wrap intent detected: cd into the repo (env REPO_ROOT or current dir),
#     run `git status --porcelain` for uncommitted changes, and
#     `git log @{u}..HEAD` (fallback `origin/$(default branch)..HEAD`) for unpushed.
#   - On mismatch: macOS osascript notification (best-effort, no-op on Linux) +
#     stderr log line for any tail-based monitor.
#
# Configuration via env:
#   REPO_ROOT - absolute path to the git repo to inspect (defaults to $PWD)
#   WRAP_DEFAULT_BRANCH - upstream branch for fallback (default "main")

set -euo pipefail

INPUT=$(cat)

# Extract transcript path from Stop event input (supports both keys)
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // .transcript // empty' 2>/dev/null || echo "")
# Fall back to env if not in input
[ -z "$TRANSCRIPT" ] && TRANSCRIPT="${CLAUDE_TRANSCRIPT_PATH:-}"
[ -z "$TRANSCRIPT" ] && exit 0
[ ! -f "$TRANSCRIPT" ] && exit 0

# Look only at the last ~200 lines for wrap intent
RECENT=$(tail -200 "$TRANSCRIPT" 2>/dev/null || echo "")
[ -z "$RECENT" ] && exit 0

# Wrap intent detection (case-insensitive). Requires "wrap" adjacent to verb /
# imperative words to avoid false positives like "wrap this in a div".
# Matches: "wrap up", "wrapping up", "session end", "wrap it up", "let's wrap",
# "wrap this session", "/wrap".
if ! echo "$RECENT" | grep -qiE '(wrap[[:space:]]*up|wrapping[[:space:]]*up|session[[:space:]]*end|wrap[[:space:]]*it[[:space:]]*up|let.?s[[:space:]]*wrap|wrap[[:space:]]*(this[[:space:]]*)?session|/wrap)'; then
  exit 0  # No wrap intent - silent exit
fi

REPO_ROOT="${REPO_ROOT:-$PWD}"
DEFAULT_BRANCH="${WRAP_DEFAULT_BRANCH:-main}"

cd "$REPO_ROOT" 2>/dev/null || exit 0

# Skip if not a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Uncommitted changes
DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# Unpushed commits relative to upstream (prefer @{u}, fall back to origin/$DEFAULT_BRANCH)
UNPUSHED=$(git log @{u}..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ' || echo 0)
if [ -z "$UNPUSHED" ] || [ "$UNPUSHED" = "0" ]; then
  UNPUSHED=$(git log "origin/${DEFAULT_BRANCH}..HEAD" --oneline 2>/dev/null | wc -l | tr -d ' ' || echo 0)
fi

NEEDS_PUSH=0
REASONS=""
if [ "${DIRTY:-0}" -gt 0 ]; then
  NEEDS_PUSH=1
  REASONS="${REASONS}${DIRTY} uncommitted files. "
fi
if [ "${UNPUSHED:-0}" -gt 0 ]; then
  NEEDS_PUSH=1
  REASONS="${REASONS}${UNPUSHED} unpushed commits. "
fi

if [ "$NEEDS_PUSH" -eq 1 ]; then
  MSG="WRAP REMINDER: git push step not done. ${REASONS}Run: cd ${REPO_ROOT} && git add -A && git commit -m '...' && git push"
  # macOS desktop notification (no-op on Linux)
  if command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"${MSG}\" with title \"Claude: Wrap incomplete\"" 2>/dev/null || true
  fi
  # Always emit to stderr for tail-based monitoring
  echo "wrap-push-reminder: $MSG" >&2
fi

exit 0
