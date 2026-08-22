<!-- generated from adapters/jobs.json - do not hand-edit -->
<!-- Codex CLI adapter stub. Format TBD - verify against codex CLI docs. -->

# Codex adapter - apply job

**Job:** apply
**Contract:** One deterministic edit. No inference allowed.
**Isolation:** worktree
**Worker name:** worker-narrow

TBD - Codex CLI worker config format not yet specified.

## Rules

- Parent orchestrates. Do not spawn children.
- Sequential processing. One item at a time.
- Job contract: One deterministic edit. No inference allowed.

## TODO: Codex CLI schema

- [ ] Confirm .codex/agents/ directory and file format
- [ ] Confirm worker name field and accepted values
- [ ] Confirm isolation configuration for writer jobs
