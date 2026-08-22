<!-- generated from adapters/jobs.json - do not hand-edit -->
<!-- Codex CLI adapter stub. Format TBD - verify against codex CLI docs. -->

# Codex adapter - write job

**Job:** write
**Contract:** Prose to a brief. Voice-stable output.
**Isolation:** shared
**Worker name:** custom-scribe

TBD - Codex CLI worker config format not yet specified.

## Rules

- Parent orchestrates. Do not spawn children.
- Sequential processing. One item at a time.
- Job contract: Prose to a brief. Voice-stable output.

## TODO: Codex CLI schema

- [ ] Confirm .codex/agents/ directory and file format
- [ ] Confirm worker name field and accepted values
- [ ] Confirm isolation configuration for writer jobs
