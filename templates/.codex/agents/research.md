<!-- generated from adapters/jobs.json - do not hand-edit -->
<!-- Codex CLI adapter stub. Format TBD - verify against codex CLI docs. -->

# Codex adapter - research job

**Job:** research
**Contract:** Multi-source synthesis. Returns ranked findings with citations.
**Isolation:** shared
**Worker name:** custom-researcher

TBD - Codex CLI worker config format not yet specified.

## Rules

- Parent orchestrates. Do not spawn children.
- Sequential processing. One item at a time.
- Job contract: Multi-source synthesis. Returns ranked findings with citations.

## TODO: Codex CLI schema

- [ ] Confirm .codex/agents/ directory and file format
- [ ] Confirm worker name field and accepted values
- [ ] Confirm isolation configuration for writer jobs
