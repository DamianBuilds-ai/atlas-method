#!/bin/sh
# session-start.sh - SessionStart hook for Atlas Method setups.
#
# WHY THIS EXISTS
# AI runners do not write a baton stub or generate the orientation view
# because the spec asked them to. That is a hook. This script is the hook.
# Draft 3 s. 9 M7: "Same script, two hook files (Grok events + Claude events)."
#
# WHAT THIS DOES (in order)
#   1. Resolves the active domain from $ATLAS_DOMAIN or .atlas/domain file.
#      Falls back to "unknown" with a visible notice - never silences.
#   2. Attempts atlas refresh if gh is authenticated.
#      Emits a visible notice on skip or failure. Never blocks (exit 0 always).
#   3. Runs atlas orientation --domain X --out sessions/current/orientation-{domain}.md
#      Orientation is generated BEFORE the baton stub so that latestBatonLine()
#      finds the PRIOR session's baton, not the empty stub this session just created.
#   4. Writes a baton STUB to sessions/current/YYYY-MM-DD_HHMM_{domain}.md.
#      40-line cap. Skipped if a baton for this session already exists.
#      Written after orientation so the stub does not shadow the prior baton pointer.
#   5. CLAUDE ONLY: emits additionalContext JSON carrying the orientation content.
#      This bonus injection works in Claude Code but is IGNORED by Grok Build
#      on SessionStart (Grok's hook stdout is ignored for this event).
#      Do NOT copy this pattern as the Grok injection mechanism.
#
# REGISTRATION
#   Claude Code: register in .claude/settings.json under "SessionStart"
#     with type "command". See hooks/README.md for the exact block.
#   Grok Build: register in .grok/hooks/ as a hook script. Stdout from
#     SessionStart is ignored by Grok. The orientation file is what the
#     AGENTS.md constitution instructs the session to read at start.
#
# FAIL OPEN
#   Every step is guarded. Any individual failure emits a visible notice
#   and continues. The script exits 0 always so the session is never blocked.
#
# POSIX COMPATIBLE - runs under /bin/sh; no bash-only features; no jq.
#   JSON is assembled with printf so there is no missing-dependency path.
#
# ATLAS_DOMAIN
#   Set ATLAS_DOMAIN to the domain slug. If unset, reads .atlas/domain in cwd.
#   Example: export ATLAS_DOMAIN=treasury
#
# ATLAS_STATE_DIR
#   Override the state directory passed to atlas orientation and atlas refresh.
#   Defaults to ~/.atlas/state/ (the standard location).
#   Set this only for testing or non-standard layouts.
#   Example: export ATLAS_STATE_DIR=.atlas/state

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

notice() {
    # Print a visible notice to stderr so it appears in hook logs.
    printf '[session-start] %s\n' "$1" >&2
}

resolve_domain() {
    if [ -n "${ATLAS_DOMAIN:-}" ]; then
        printf '%s' "$ATLAS_DOMAIN"
        return
    fi
    if [ -f ".atlas/domain" ]; then
        domain_val=$(cat ".atlas/domain" 2>/dev/null | tr -d '[:space:]')
        if [ -n "$domain_val" ]; then
            printf '%s' "$domain_val"
            return
        fi
    fi
    notice "ATLAS_DOMAIN not set and .atlas/domain not found - using 'unknown'"
    printf 'unknown'
}

atlas_cmd() {
    # Resolve the atlas launcher: prefer atlas-launch.sh in cwd/cli, then atlas on PATH.
    if [ -f "cli/atlas-launch.sh" ]; then
        printf '%s' "sh cli/atlas-launch.sh"
    elif command -v atlas >/dev/null 2>&1; then
        printf '%s' "atlas"
    else
        printf ''
    fi
}

timestamp_now() {
    date '+%Y-%m-%d_%H%M' 2>/dev/null || printf '0000-00-00_0000'
}

# --------------------------------------------------------------------------
# Step 1: Resolve domain
# --------------------------------------------------------------------------

domain=$(resolve_domain)

# --------------------------------------------------------------------------
# Step 2: Attempt atlas refresh
# --------------------------------------------------------------------------

refresh_step() {
    atlas=$(atlas_cmd)
    if [ -z "$atlas" ]; then
        notice "atlas not found - skipping refresh (install atlas or add cli/ to PATH)"
        return
    fi
    if ! command -v gh >/dev/null 2>&1; then
        notice "gh not found - skipping refresh"
        return
    fi
    if ! gh auth status --hostname github.com >/dev/null 2>&1; then
        notice "gh unauthenticated - skipping refresh (run: gh auth login)"
        return
    fi
    notice "running atlas refresh --domain ${domain} ..."
    state_flag=""
    if [ -n "${ATLAS_STATE_DIR:-}" ]; then
        # atlas refresh uses --state to point at a specific file, not a dir.
        # Derive the default state file from the dir.
        state_flag="--state ${ATLAS_STATE_DIR}/local.jsonl"
    fi
    # shellcheck disable=SC2086
    $atlas refresh --domain "$domain" $state_flag >/dev/null 2>&1 || \
        notice "atlas refresh failed - continuing with existing local state"
}

( refresh_step ) || notice "refresh step encountered an error - continuing"

# --------------------------------------------------------------------------
# Step 3: Generate orientation view (before writing the baton stub)
#
# Orientation is generated FIRST so that latestBatonLine() in cmd-orientation.js
# finds the prior session's baton file, not the empty stub this session is about
# to create. Writing the stub first caused the orientation to point at the new
# empty stub, making the prior baton invisible. s.9 step 4: "Latest baton loads
# if one exists - domain match - opening domain X absorbs X's newest PRIOR baton."
# --------------------------------------------------------------------------

orientation_step() {
    atlas=$(atlas_cmd)
    if [ -z "$atlas" ]; then
        notice "atlas not found - skipping orientation generation"
        return
    fi
    orient_dir="sessions/current"
    orient_path="${orient_dir}/orientation-${domain}.md"
    mkdir -p "$orient_dir" 2>/dev/null || true
    state_flag=""
    if [ -n "${ATLAS_STATE_DIR:-}" ]; then
        state_flag="--state ${ATLAS_STATE_DIR}"
    fi
    # shellcheck disable=SC2086
    if $atlas orientation --domain "$domain" --out "$orient_path" $state_flag >/dev/null 2>&1; then
        notice "orientation written: ${orient_path}"
    else
        notice "atlas orientation failed - orientation file may be missing or stale"
    fi
}

( orientation_step ) || notice "orientation step encountered an error - continuing"

# --------------------------------------------------------------------------
# Step 4: Write baton stub (skip if this session already has one)
# --------------------------------------------------------------------------

baton_step() {
    ts=$(timestamp_now)
    baton_dir="sessions/current"
    baton_path="${baton_dir}/${ts}_${domain}.md"

    # Create directory if needed.
    mkdir -p "$baton_dir" 2>/dev/null || {
        notice "cannot create ${baton_dir} - skipping baton stub"
        return
    }

    # Check if any baton for this domain already exists from this session.
    # Same timestamp prefix (YYYY-MM-DD_HHMM) within a 1-minute window counts.
    date_prefix=$(printf '%s' "$ts" | cut -c1-13)
    existing=$(ls "${baton_dir}/${date_prefix}"*"_${domain}.md" 2>/dev/null | head -1)
    if [ -n "$existing" ]; then
        notice "baton stub already exists: ${existing} - skipping"
        return
    fi

    # Write the stub from the template. Use the baton-stub.md template if present,
    # otherwise write a minimal inline stub.
    stub_template="templates/baton-stub.md"
    if [ -f "$stub_template" ]; then
        # Replace {{DOMAIN}} and {{TIMESTAMP}} tokens from the template.
        sed "s/{{DOMAIN}}/${domain}/g; s/{{TIMESTAMP}}/${ts}/g" \
            "$stub_template" > "$baton_path" 2>/dev/null || {
            notice "could not write baton stub from template - writing minimal stub"
            write_minimal_stub "$baton_path" "$domain" "$ts"
        }
    else
        write_minimal_stub "$baton_path" "$domain" "$ts"
    fi
    notice "baton stub written: ${baton_path}"
}

write_minimal_stub() {
    path="$1" ; dom="$2" ; ts="$3"
    printf '# Baton stub - %s - %s\n\n' "$dom" "$ts" > "$path"
    printf 'source-baton: (none - session start)\n\n' >> "$path"
    printf '## Items this session\n\n' >> "$path"
    printf '- [ ] (fill in as the session progresses)\n\n' >> "$path"
    printf '## Terminal states\n\n' >> "$path"
    printf '- [ ] PROMOTED: \n' >> "$path"
    printf '- [ ] DROPPED: \n' >> "$path"
    printf '- [ ] CARRIED: \n' >> "$path"
}

( baton_step ) || notice "baton step encountered an error - continuing"

# --------------------------------------------------------------------------
# Step 5: Claude additionalContext injection (Claude Code only)
#
# Grok Build: stdout from SessionStart is IGNORED. This block runs but
# produces output that Grok discards. The orientation FILE is the real
# delivery mechanism for Grok. Do not copy this JSON pattern for Grok M7.
# --------------------------------------------------------------------------

claude_injection() {
    orient_path="sessions/current/orientation-${domain}.md"
    if [ ! -f "$orient_path" ]; then
        notice "orientation file missing - Claude injection skipped"
        return
    fi

    # Read orientation file content. Escape backslashes and double-quotes for JSON.
    # The orientation file contains only printable ASCII and newlines; no other
    # characters that require JSON escaping are expected. We convert actual newlines
    # to \n sequences using tr + sed (POSIX safe).
    content=$(cat "$orient_path" 2>/dev/null) || return

    # Escape: backslash first, then double-quote, then convert newlines to \n.
    escaped=$(printf '%s' "$content" \
        | sed 's/\\/\\\\/g' \
        | sed 's/"/\\"/g' \
        | tr '\n' '\\' \
        | sed 's/\\/\\n/g')

    banner="=== ATLAS ORIENTATION: ${domain} ===\\n${escaped}\\n=== END ORIENTATION ==="

    printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' \
        "$banner"
}

( claude_injection ) || true

# Always exit 0 - the session must not be blocked by hook errors.
exit 0
