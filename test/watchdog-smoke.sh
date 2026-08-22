#!/bin/sh
# watchdog-smoke.sh - Fixture smoke test for scripts/visibility-watchdog.sh
#
# No network. Injects a mock gh via PATH that returns controlled visibility values.
# Three assertions (per spec):
#   1. untagged entry defaults to private (treated as private, checked via gh)
#   2. public-tagged entry is skipped (no gh call, visible OK line)
#   3. private-tagged entry that mock-gh reports "public" FAILS loud (exit 1, named message)
#
# Run: sh test/watchdog-smoke.sh
# Exit: 0 if all three assertions pass, 1 if any fail.

set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")/.." && pwd)
WATCHDOG="$SCRIPT_DIR/scripts/visibility-watchdog.sh"
TMPDIR_LOCAL=$(mktemp -d /tmp/watchdog-smoke-XXXXXX)

cleanup() { rm -rf "$TMPDIR_LOCAL"; }
trap cleanup EXIT

PASS=0
FAIL=0

check() {
    label="$1"; expected_exit="$2"; match_str="$3"; manifest="$4"; mock_visibility="$5"

    # Build a mock gh that returns the fixture visibility
    MOCK_BIN="$TMPDIR_LOCAL/mock-bin-$$"
    mkdir -p "$MOCK_BIN"
    printf '#!/bin/sh\n# mock gh: returns fixture visibility\nprintf '"'"'%s'"'"'\n' "$mock_visibility" \
        > "$MOCK_BIN/gh"
    chmod +x "$MOCK_BIN/gh"

    # Run watchdog with mock gh on PATH
    actual_output=$(PATH="$MOCK_BIN:$PATH" sh "$WATCHDOG" --manifest "$manifest" --dry-run 2>&1 || true)
    actual_exit=0
    PATH="$MOCK_BIN:$PATH" sh "$WATCHDOG" --manifest "$manifest" --dry-run >/dev/null 2>&1 || actual_exit=$?

    # Check exit code
    exit_ok=1
    [ "$actual_exit" = "$expected_exit" ] || exit_ok=0

    # Check output contains expected string
    output_ok=1
    printf '%s' "$actual_output" | grep -q "$match_str" || output_ok=0

    if [ "$exit_ok" = "1" ] && [ "$output_ok" = "1" ]; then
        printf 'PASS: %s\n' "$label"
        PASS=$((PASS + 1))
    else
        printf 'FAIL: %s\n' "$label" >&2
        printf '  expected exit=%s got exit=%s\n' "$expected_exit" "$actual_exit" >&2
        printf '  expected output to contain: %s\n' "$match_str" >&2
        printf '  actual output:\n%s\n' "$actual_output" >&2
        FAIL=$((FAIL + 1))
    fi
}

# ---- build fixture manifests ----

# Manifest A: one entry tagged public -> should be skipped, exit 0
MANIFEST_PUBLIC="$TMPDIR_LOCAL/public.repos"
cat > "$MANIFEST_PUBLIC" << 'MANIFEST'
{"schema":"gazetteer","version":1}
{"path":"/home/user/pub-repo","visibility":"public","remote":"https://github.com/test-owner/pub-repo"}
MANIFEST

# Manifest B: one entry tagged private where mock-gh returns "public" -> FAIL loud, exit 1
MANIFEST_PRIVATE_LEAKED="$TMPDIR_LOCAL/private-leaked.repos"
cat > "$MANIFEST_PRIVATE_LEAKED" << 'MANIFEST'
{"schema":"gazetteer","version":1}
{"path":"/home/user/priv-repo","visibility":"private","remote":"https://github.com/test-owner/priv-repo"}
MANIFEST

# Manifest C: one entry with NO tag (untagged) where mock-gh returns "public" -> defaults private, FAIL loud, exit 1
MANIFEST_UNTAGGED="$TMPDIR_LOCAL/untagged.repos"
cat > "$MANIFEST_UNTAGGED" << 'MANIFEST'
{"schema":"gazetteer","version":1}
{"path":"/home/user/untagged-repo","remote":"https://github.com/test-owner/untagged-repo"}
MANIFEST

# Manifest D: one entry tagged private where mock-gh returns "private" -> PASS, exit 0
MANIFEST_PRIVATE_OK="$TMPDIR_LOCAL/private-ok.repos"
cat > "$MANIFEST_PRIVATE_OK" << 'MANIFEST'
{"schema":"gazetteer","version":1}
{"path":"/home/user/ok-repo","visibility":"private","remote":"https://github.com/test-owner/ok-repo"}
MANIFEST

printf '\n=== Watchdog smoke suite ===\n\n'

# Assertion 1: public-tagged entry is skipped with OK line, no gh call needed
# (mock-gh returns "public" but the watchdog should NOT call it for public-tagged entries)
check \
    "public-tagged skipped (no check, visible OK line)" \
    0 \
    "OK (public, skip check)" \
    "$MANIFEST_PUBLIC" \
    "public"

# Assertion 2: private-tagged entry + mock-gh reports "public" -> FAIL loud, named repo in output
check \
    "private-tagged non-private FAILS loud (named repo)" \
    1 \
    "test-owner/priv-repo" \
    "$MANIFEST_PRIVATE_LEAKED" \
    "public"

# Assertion 3: untagged entry defaults to private + mock-gh reports "public" -> FAIL loud
check \
    "untagged defaults private, non-private FAILS loud" \
    1 \
    "test-owner/untagged-repo" \
    "$MANIFEST_UNTAGGED" \
    "public"

# Bonus: private-tagged entry + mock-gh reports "private" -> PASS
check \
    "private-tagged confirmed private -> PASS" \
    0 \
    "private OK" \
    "$MANIFEST_PRIVATE_OK" \
    "private"

printf '\n=== Results: %d passed, %d failed ===\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
