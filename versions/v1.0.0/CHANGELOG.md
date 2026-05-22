# Changelog

All notable changes to Atlas Method are documented here.

This project uses two-track versioning. The **public** version (this repo) and the **internal methodology** version keep separate clocks. The public track starts at v1.0.0 - a clean front door for people who have never seen the internal evolution - while the methodology itself has been refined privately across many iterations. Each public entry records the methodology version it maps to.

The format follows the spirit of Keep a Changelog, and the public track adheres to Semantic Versioning.

## [1.0.0] - 2026-05-23

**Maps to:** internal methodology v7.5.6.

First public release. The lean-by-design documentation methodology for running a personal operating system on Claude Code.

### Added

- **Methodology documentation** (`docs/`) - the written specification covering context management, the agent delegation tiers, and the documentation protocol governing how trees grow and split.
- **The `/atlas` self-audit command** (`commands/`) - inspects a live system against the methodology's own rules and surfaces drift as neutral prompts.
- **The four-document skeleton** (`skeleton/`) - `DOMAIN.md` (trunk), `DOMAIN_QUEUE.md` (active work), `DOMAIN_HANDOFF.md` (session handoff), and `DOMAIN_IDEAS.md` (parking lot), plus the `CLAUDE.md.template` soil.
- **The agent-prelude hook system** (`hooks/`) - injects the universal agent rules and safety prohibitions into every spawned agent so agents never start unguided.
- **Procedures** (`procedures/`) - short loadable playbooks for recurring situations.
- **A worked example** (`examples/`) - one fully populated domain illustrating the templates in use.
- **The `atlas-init` bootstrap script** (`bin/`) - scaffolds a fresh instance from the skeleton.

### Deferred to v1.1

- Interactive `/atlas init` build-guidance mode (the architect-mentor personality).
- Auto-research domain mapping from existing files.
- GitHub-backed `/atlas pull` self-update with local cache and checksum invalidation.

### Versioning note

The mapping locks as follows: public v1.0.x tracks methodology v7.5.x; the next major public addition becomes v1.1.0; a public v2.0.0 will map to internal v8.0. Future public entries cross-reference their methodology version in the entry header.
