# Atlas Method v1.0.0

This is the first public release of Atlas Method - the lean-by-design documentation methodology for running a personal operating system on Claude Code.

v1.0.0 is the clean front door. It ships the minimum that lets a stranger clone the repo, scaffold their own instance, and have a working, disciplined system in a few minutes.

## What Ships in v1.0.0

- **The methodology docs** (`docs/`) - the full written specification: the context-management rules, the agent delegation pattern, and the documentation protocol that governs how trees grow and split.
- **The `/atlas` command** (`commands/`) - the self-audit. Turns the methodology back on your own system to surface drift.
- **The four-document skeleton** (`skeleton/`) - the templates every domain inherits: a trunk, a queue, a handoff, and an ideas parking lot, plus the CLAUDE.md soil template.
- **The hooks** (`hooks/`) - the agent-prelude system that injects the universal rules and safety prohibitions into every spawned agent automatically.
- **The procedures** (`procedures/`) - short, loadable playbooks for recurring situations.
- **A worked example** (`examples/`) - one fully filled-in domain so the templates have a concrete reference.
- **The bootstrap script** (`bin/atlas-init`) - copies the skeleton into a fresh instance.

## What Is Deferred to v1.1

These are designed but intentionally not in the first release. v1.0.0 favours a small, solid core over a large, half-wired one.

- **The architect-mentor build-guidance personality** - an interactive `/atlas init` mode that interviews you and helps shape your first domains, rather than handing you raw templates.
- **The auto-research domain map** - automatic discovery and mapping of your domains from existing files.
- **GitHub self-update** - a `/atlas pull` mode that fetches methodology updates from this repo directly, with a local cache and checksum-based invalidation.

## Version Mapping

Public v1.0.0 corresponds to internal methodology version v7.5.6. See `CHANGELOG.md` for the two-track versioning explanation - the public repo and the internal methodology keep separate clocks, cross-referenced in the changelog.
