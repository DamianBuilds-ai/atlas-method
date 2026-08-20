#!/bin/sh
# atlas CLI launcher - Node 22.x compatibility wrapper.
# node:sqlite is experimental on Node 22.x; Node 24+ runs it without this flag.
# This wrapper ensures --experimental-sqlite is set regardless of how atlas is invoked.
exec node --experimental-sqlite --no-warnings "$(dirname "$0")/atlas.js" "$@"
