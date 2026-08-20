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
#   Any error (bad TZ, date command failure) produces empty output and
#   exits 0. Claude Code continues normally; the hook is silent rather
#   than blocking. This follows the M7 rule: "Hooks fail open. Degraded
#   path must be visible." No jq dependency: JSON is assembled with printf
#   so there is no silent missing-dependency path.
#
# POSIX COMPATIBLE - runs under /bin/sh; no bash-only features; no jq.
#
# JSON ENCODING NOTE
#   Date output and the static banner text contain no backslash or
#   double-quote characters. The banner uses literal \n sequences (two
#   characters: backslash + n) embedded in double-quoted shell strings.
#   POSIX sh does not interpret \n in double quotes, so these are passed
#   through to printf as-is and appear in the JSON as the valid newline
#   escape \n, which Claude decodes correctly.

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

    # Banner is a single shell string; \n sequences are literal two-char
    # backslash-n (not actual newlines). printf %s passes them through
    # verbatim into the JSON string, where \n is the valid newline escape.
    banner="==================== DATE ANCHOR ====================\nTODAY IS: ${now}\nFilename date: ${iso}\nReminder: always derive dated content from the live date command,\nnot from memory. Sessions stay open for days; the model drifts.\n====================================================="

    emit_json "SessionStart" "$banner"
}

emit_prompt() {
    now=$(date '+%A, %B %d %Y - %I:%M %p %Z') || return 0
    emit_json "UserPromptSubmit" "Current datetime: ${now}"
}

emit_json() {
    event="$1"
    msg="$2"

    # Pure POSIX JSON assembly - no jq dependency.
    # Date strings contain only letters, digits, spaces, colons, commas,
    # hyphens, and the literal \n sequences added by emit_banner. None of
    # these require further escaping in a JSON string value.
    printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":"%s"}}\n' \
        "$event" "$msg"
}

# Outer subshell + || true: any unhandled error exits 0 (fail open).
# The inner functions already guard their own error paths; this is the
# final safety net for anything not yet anticipated.
( main "$@" ) || true
