#!/bin/sh
# worktree-gc.sh - Wrap-time worktree cleanup for Atlas Method sessions
#
# Naming convention for session-created trees (documented in templates/WORKTREES.md):
#   A worktree is considered session-created if it contains a marker file:
#     <worktree-path>/.atlas-session-worktree
#   Parent agents write this marker at worktree creation time.
#   IMPORTANT: the marker must remain UNTRACKED (listed in .gitignore).
#   A committed marker propagates through merges and causes gc to remove
#   unrelated worktrees on the next branch that starts from a merged HEAD.
#
# Removal rules (applied in order):
#   1. SKIP if the worktree has uncommitted changes (safety; prints a notice).
#   2. REMOVE if the worktree's branch is fully merged into the current branch.
#   3. REMOVE if the worktree contains the .atlas-session-worktree marker file.
#   4. LEAVE all other worktrees untouched (foreign/manual trees are not touched).
#
# Usage: sh scripts/worktree-gc.sh [--dry-run]
#   --dry-run  Print what would be removed without actually removing anything.
#
# Exit codes: 0 = ok (removed or nothing to do), 1 = error reading worktree list.

set -e

DRY_RUN=0
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=1
fi

# Resolve the repo root (works from any directory inside the repo).
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  printf '%s\n' "worktree-gc: not inside a git repo" >&2
  exit 1
}

CURRENT_BRANCH=$(git -C "$REPO_ROOT" symbolic-ref --short HEAD 2>/dev/null || printf '(detached)')

removed=0
skipped=0
left=0

# git worktree list --porcelain emits records separated by blank lines.
# Each record has: worktree <path>, HEAD <sha>, branch refs/heads/<name> (or bare).
# We parse it line by line, accumulating fields per record.
worktree_path=''
worktree_branch=''

process_worktree() {
  path="$1"
  branch="$2"

  # Skip the main worktree (no branch or same as repo root).
  if [ "$path" = "$REPO_ROOT" ]; then
    return
  fi

  # Skip bare worktrees (no branch).
  if [ -z "$branch" ]; then
    left=$((left + 1))
    printf 'worktree-gc: LEAVE  %s (bare/no branch)\n' "$path"
    return
  fi

  # Safety: skip if there are uncommitted tracked changes in the worktree.
  # Uses git diff-index so untracked files (including the .atlas-session-worktree
  # marker) do not trigger a false skip. Staged and modified tracked files do.
  if ! git -C "$path" diff-index --quiet HEAD -- 2>/dev/null; then
    skipped=$((skipped + 1))
    printf 'worktree-gc: SKIP   %s - uncommitted changes; not removed\n' "$path"
    return
  fi

  # Check removal conditions.
  is_merged=0
  has_marker=0

  # Condition 1: branch is fully merged into the current HEAD.
  if git -C "$REPO_ROOT" branch --merged HEAD 2>/dev/null | grep -qF " $branch"; then
    is_merged=1
  fi

  # Condition 2: session marker file present.
  if [ -f "$path/.atlas-session-worktree" ]; then
    has_marker=1
  fi

  if [ "$is_merged" = "1" ] || [ "$has_marker" = "1" ]; then
    reason=''
    [ "$is_merged" = "1" ] && reason='branch merged'
    [ "$has_marker" = "1" ] && reason="${reason:+$reason, }marker file present"
    if [ "$DRY_RUN" = "1" ]; then
      printf 'worktree-gc: DRY-RUN remove %s (%s)\n' "$path" "$reason"
    else
      git -C "$REPO_ROOT" worktree remove --force "$path" 2>/dev/null && \
        printf 'worktree-gc: REMOVED %s (%s)\n' "$path" "$reason" || \
        printf 'worktree-gc: WARN    could not remove %s\n' "$path" >&2
    fi
    removed=$((removed + 1))
  else
    left=$((left + 1))
    printf 'worktree-gc: LEAVE  %s (not session-created, not merged)\n' "$path"
  fi
}

# Parse git worktree list --porcelain output.
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    worktree\ *)
      # New record starts; flush the previous one.
      if [ -n "$worktree_path" ]; then
        process_worktree "$worktree_path" "$worktree_branch"
      fi
      worktree_path="${line#worktree }"
      worktree_branch=''
      ;;
    branch\ refs/heads/*)
      worktree_branch="${line#branch refs/heads/}"
      ;;
    '')
      # Blank line = end of record; flush.
      if [ -n "$worktree_path" ]; then
        process_worktree "$worktree_path" "$worktree_branch"
        worktree_path=''
        worktree_branch=''
      fi
      ;;
  esac
done << EOF
$(git -C "$REPO_ROOT" worktree list --porcelain)
EOF

# Flush final record if no trailing blank line.
if [ -n "$worktree_path" ]; then
  process_worktree "$worktree_path" "$worktree_branch"
fi

printf '\nworktree-gc: done. removed=%d skipped=%d left=%d\n' "$removed" "$skipped" "$left"
