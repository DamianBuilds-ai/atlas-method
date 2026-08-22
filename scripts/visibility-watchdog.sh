#!/bin/sh
# visibility-watchdog.sh - Atlas Method scoped privacy watchdog
#
# Reads the manifest (templates/gazetteer.repos or privacy.guarded) and checks
# that every private-tagged remote reports private on GitHub. Fails LOUD with a
# named-repo message on any violation.
#
# Safety defaults (all fail toward private):
#   - Entries without a visibility tag are treated as private.
#   - A remote that cannot be parsed (non-GitHub URL) is skipped with a notice.
#   - A gh API error is a warning, not a silent pass.
#
# GitHub Projects: when gh auth shows project scope, each private repo's Projects
# are also checked for public exposure. When scope is absent, a single notice is
# printed and Projects checks are skipped for the run.
#
# Usage:
#   sh scripts/visibility-watchdog.sh [--manifest PATH] [--dry-run]
#
#   --manifest PATH   manifest to read (default: auto-detect from repo root)
#   --dry-run         skip scope detection noise; caller injects a mock gh via PATH
#
# Exit codes:
#   0 - all checks passed
#   1 - one or more private repos reported non-private (FAIL)
#   2 - manifest not found or unusable

set -eu

# ---- argument parsing ----
MANIFEST=""
DRY_RUN=0
while [ $# -gt 0 ]; do
    case "$1" in
        --manifest) MANIFEST="$2"; shift 2 ;;
        --dry-run)  DRY_RUN=1; shift ;;
        -*)         printf 'Unknown argument: %s\n' "$1" >&2; exit 2 ;;
        *)          break ;;
    esac
done

# ---- locate manifest ----
if [ -z "$MANIFEST" ]; then
    REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
    if [ -f "$REPO_ROOT/privacy.guarded" ]; then
        MANIFEST="$REPO_ROOT/privacy.guarded"
    elif [ -f "$REPO_ROOT/templates/gazetteer.repos" ]; then
        MANIFEST="$REPO_ROOT/templates/gazetteer.repos"
    else
        printf 'ERROR: no manifest found (tried privacy.guarded, templates/gazetteer.repos)\n' >&2
        exit 2
    fi
fi

if [ ! -f "$MANIFEST" ]; then
    printf 'ERROR: manifest not found: %s\n' "$MANIFEST" >&2
    exit 2
fi

printf 'Watchdog: manifest %s\n' "$MANIFEST"

# ---- check gh availability and project scope ----
HAS_GH=0
HAS_PROJECT_SCOPE=0
if command -v gh >/dev/null 2>&1; then
    HAS_GH=1
    if [ "$DRY_RUN" = "0" ]; then
        # gh auth status output includes "project" when the scope is present
        if gh auth status 2>&1 | grep -qi "project"; then
            HAS_PROJECT_SCOPE=1
        fi
    fi
fi

if [ "$HAS_PROJECT_SCOPE" = "0" ] && [ "$DRY_RUN" = "0" ]; then
    printf '  NOTICE: no project scope in gh auth - GitHub Projects checks skipped.\n'
    printf '          Run "gh auth login --scopes project" to enable Projects visibility check.\n'
fi

# ---- process manifest ----
FAIL=0
CHECKED=0

while IFS= read -r line; do
    # skip comments and blank lines
    case "$line" in
        '#'*|'') continue ;;
    esac
    # skip the schema header ({"schema":"gazetteer",...})
    case "$line" in
        *'"schema"'*) continue ;;
    esac

    # extract fields using POSIX sed (no jq dependency)
    remote=$(printf '%s' "$line" | sed -n 's/.*"remote"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
    visibility=$(printf '%s' "$line" | sed -n 's/.*"visibility"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
    path_val=$(printf '%s' "$line" | sed -n 's/.*"path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
    label="${remote:-$path_val}"

    # safety default: untagged entries are private (fail toward safety)
    if [ -z "$visibility" ]; then
        visibility="private"
        printf '  DEFAULT private (no tag): %s\n' "$label"
    fi

    # public-tagged: skip with a visible OK line, no API call
    if [ "$visibility" = "public" ]; then
        printf '  OK (public, skip check): %s\n' "$label"
        continue
    fi

    # private-tagged: check GitHub visibility
    if [ -z "$remote" ]; then
        printf '  SKIP (no remote): %s\n' "$path_val"
        continue
    fi

    # extract owner/repo from GitHub remote URL
    # handles https://github.com/owner/repo and https://github.com/owner/repo.git
    owner_repo=$(printf '%s' "$remote" | sed -n 's|.*github\.com[/:]||p' | sed 's|\.git$||')
    if [ -z "$owner_repo" ]; then
        printf '  SKIP (non-GitHub remote, cannot check visibility): %s\n' "$remote"
        continue
    fi

    if [ "$HAS_GH" = "0" ]; then
        printf '  SKIP (gh CLI not available): %s\n' "$owner_repo"
        continue
    fi

    CHECKED=$((CHECKED + 1))
    printf '  Checking: %s ... ' "$owner_repo"

    actual=$(gh api "repos/$owner_repo" --jq '.visibility' 2>/dev/null || printf 'api-error')

    case "$actual" in
        private)
            printf 'private OK\n'
            ;;
        api-error)
            printf '\n  WARNING: could not query %s (API error or access denied)\n' "$owner_repo" >&2
            ;;
        *)
            printf '\n'
            printf 'FAIL: %s is tagged private but GitHub reports visibility=%s\n' "$owner_repo" "$actual" >&2
            FAIL=1
            ;;
    esac

    # GitHub Projects visibility check (only when project scope is present)
    if [ "$HAS_PROJECT_SCOPE" = "1" ] && [ "$actual" = "private" ]; then
        gh_owner=$(printf '%s' "$owner_repo" | cut -d/ -f1)
        gh_repo=$(printf '%s' "$owner_repo" | cut -d/ -f2)
        public_projects=$(gh api graphql \
            -f query="{repository(owner:\"$gh_owner\",name:\"$gh_repo\"){projectsV2(first:10){nodes{title public}}}}" \
            --jq '.data.repository.projectsV2.nodes[]|select(.public==true)|.title' 2>/dev/null || printf '')
        if [ -n "$public_projects" ]; then
            printf 'FAIL: %s has public Projects on a private repo: %s\n' "$owner_repo" "$public_projects" >&2
            FAIL=1
        fi
    fi

done < "$MANIFEST"

printf '\n'
if [ "$FAIL" = "1" ]; then
    printf 'Watchdog FAILED: private repo(s) with leaked visibility - see named repos above.\n' >&2
    exit 1
fi

printf 'Watchdog PASSED: %d remote(s) checked, all confirmed private.\n' "$CHECKED"
exit 0
