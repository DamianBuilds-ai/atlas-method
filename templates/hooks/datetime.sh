#!/bin/sh
# datetime.sh - Time-awareness hook for Atlas Method setups.
#
# WHY THIS EXISTS
# Models anchor on the date that was current when the session started.
# In a chat open for hours or days, every message is generated from that
# stale anchor. This hook fixes the anchor: SessionStart gets a prominent
# banner, and every subsequent prompt gets a one-line injection so the
# model always has the real time in its immediate context window.
#
# MODES
#   --banner   For SessionStart: outputs a prominent date anchor block.
#   (default)  For UserPromptSubmit: outputs a single-line datetime line.
#
# TIMEZONE
#   Set ATLAS_TZ to any IANA zone name to override the system default.
#   If ATLAS_TZ is not set, the system timezone is used as-is.
#   Example: export ATLAS_TZ=America/New_York
#
# FAIL OPEN
#   Any error (bad TZ, missing jq, date command failure) produces empty
#   output and exits 0. Claude Code continues normally; the hook is silent
#   rather than blocking. This is the M7 contract: "Hooks fail open.
#   Degraded path must be visible" - the visibility here is that the date
#   anchor simply does not appear, rather than the session crashing.
#
# POSIX COMPATIBLE - runs under /bin/sh; no bash-only features.

main() {
    # Apply timezone override if set.
    if [ -n "${ATLAS_TZ:-}" ]; then
        TZ="$ATLAS_TZ"
        export TZ
    fi

    mode="${1:-}"

    if [ "$mode" = "--banner" ]; then
        emit_banner
    else
        emit_prompt
    fi
}

emit_banner() {
    now=$(date '+%A, %B %d %Y - %I:%M %p %Z') || return 0
    iso=$(date '+%Y-%m-%d') || return 0

    banner="==================== DATE ANCHOR ====================
TODAY IS: ${now}
Filename date: ${iso}
Reminder: always derive dated content from the live date command,
not from memory. Sessions stay open for days; the model drifts.
====================================================="

    emit_json "SessionStart" "$banner"
}

emit_prompt() {
    now=$(date '+%A, %B %d %Y - %I:%M %p %Z') || return 0
    emit_json "UserPromptSubmit" "Current datetime: ${now}"
}

emit_json() {
    event="$1"
    msg="$2"

    # jq is required for correct JSON encoding of the output payload.
    # If jq is absent the hook exits silently (fail open - no output).
    if ! command -v jq >/dev/null 2>&1; then
        return 0
    fi

    jq -n --arg event "$event" --arg msg "$msg" \
        '{"hookSpecificOutput":{"hookEventName":$event,"additionalContext":$msg}}'
}

# Outer subshell + || true: any unhandled error exits 0 (fail open).
# The inner functions already guard their own error paths; this is the
# final safety net for anything not yet anticipated.
( main "$@" ) || true
