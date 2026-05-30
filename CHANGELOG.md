# Changelog

All notable changes to Atlas Method are documented here.

This project uses two-track versioning. The **public** version (this repo) and the **internal methodology** version keep separate clocks. The public track starts at v1.0.0 - a clean front door for people who have never seen the internal evolution - while the methodology itself has been refined privately across many iterations. Each public entry records the methodology version it maps to.

The format follows the spirit of Keep a Changelog, and the public track adheres to Semantic Versioning.

## [1.1.3] - 2026-05-30

### Changed
- Forest metaphor expanded: skill (slash command) is now the TREE (the entry point that calls the domain into being). Domain remains the TRUNK. Branches (supporting docs) and leaves (sub-docs) unchanged. Reframes the methodology around the actual entry surface.
- README "What is Atlas Method?" + tagline updated to feature skills as the primary surface.
- Version references audited - hardcoded mentions replaced with dynamic CHANGELOG.md references where applicable.

### Notes
- This is a doc-only patch. No code or template changes. v1.1.x base unchanged.
- Future work queued for v1.1.4: Windows jq shell-restart note, Stop hook stronger guard, full skill-framing rewrite across QUICKSTART + NEWBOT-PROTOCOL + internal CLAUDE.md (deferred per Damian's "minimal scope" call 2026-05-30).

## [1.1.2] - 2026-05-29

### Added
- Prerequisites section in QUICKSTART.md, MIGRATION_v1.0.0_TO_v1.1.0.md, and hooks/README.md documenting jq as a required dependency (install commands per OS: brew install jq, sudo apt-get install jq, winget install jqlang.jq)
- Windows-specific notes section in QUICKSTART.md covering path conventions, persistent env var setup via setx, and shell requirements (Git Bash or WSL)

### Fixed
- wrap-push-reminder.sh: added REPO_ROOT validity guard. Previously cd $REPO_ROOT could fail silently on Windows path semantics or when REPO_ROOT was unset, causing non-blocking error noise. Now exits cleanly when REPO_ROOT is missing or invalid.

### Notes
- Thanks to Casey for the Windows install feedback that surfaced these 3 gaps.
- v1.0.0 + v1.1.0 + v1.1.1 trees unchanged. Only the v1.1.0 working tree (QUICKSTART, MIGRATION, hooks/) was modified in-place per the v1.1.x patch pattern.

## [1.1.1] - 2026-05-28

### Added
- Root VERSION file (1.1.0 methodology version, not tag-level patch number)
- GitHub Release object backfilled for v1.1.0 with full release notes
- GitHub Release object created for v1.1.1
- FOUNDRY-PERMANENT RULE captured in deploy artifacts: every Foundry push that cuts a tag must include release notes via gh release create --notes-file, AND verify the Release object renders post-push

### Fixed
- manifest.json .version field: corrected 1.0.0 to 1.1.0 (drift from v1.0.0 clone)

### Notes
- v1.0.0 + v1.1.0 trees unchanged. Only top-level files (VERSION, manifest.json metadata) modified.
- Polish-only patch surfaced by post-deploy verification of v1.1.0.

## [1.1.0] - 2026-05-28

### Added
- /newbot command with 7 archetypes (single-purpose, companion, learning-system, game, job-search, business, bot-product)
- NEWBOT-PROTOCOL.md (420 lines)
- procedures/wrap.md (8-step generic wrap protocol)
- QUICKSTART.md (first-time user walkthrough)
- MIGRATION_v1.0.0_TO_v1.1.0.md (downloader migration guide)
- 4 Phase 1 hooks: no-em-dash, scratchpad-update-nudge, wrap-push-reminder, task-output-verify
- hooks/README.md (settings.json wiring)
- em-dash CORE RULE in soil template
- Modern README with mermaid diagrams plus 9-tier agent table

### Changed
- /atlas command: stripped init mode (now audit and fix only)
- Repo bio updated for clarity

### Notes
- Average archetype audit: 4.5 / 5
- manifest.json: 79 entries (was 27)

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
