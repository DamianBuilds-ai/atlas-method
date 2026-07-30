# Changelog

All notable changes to Atlas Method are documented here.

This project uses two-track versioning. The **public** version (this repo) and the **internal methodology** version keep separate clocks. The public track starts at v1.0.0 - a clean front door for people who have never seen the internal evolution - while the methodology itself has been refined privately across many iterations. Each public entry records the methodology version it maps to.

The format follows the spirit of Keep a Changelog, and the public track adheres to Semantic Versioning.

## [Unreleased]

### Added
- **Claude Code plugin** at `plugins/atlas-method/` (plugin version `0.1.0`), installable via the marketplace catalog at the repository root. Ships three skills (`/atlas-method:atlas`, `/atlas-method:newbot`, `/atlas-method:atlas-init`), four manifest-wired lifecycle hooks, and five scaffold templates. Projected always-on context cost is about 165 tokens. Install is `claude plugin marketplace add DamianBuilds-ai/atlas-method` followed by `claude plugin install atlas-method@damianbuilds`. Verified end to end by a full install round trip, not by validation alone.
- **`docs/FIELD-NOTES.md`**: a postmortem on six rules that were ratified, documented, and not in force, all surfaced in one week. They share a single root cause, a gap between a stated rule and an enforced one, and the document argues for enforcement that cannot silently disagree with its own documentation.
- Migration guidance for users who installed by hand before the plugin existed, an uninstall section stating what does and does not get removed, and an updating section. Updating is two steps because the catalog and the installed plugin refresh separately.
- The three example files that `examples/example-domain` had always referenced and never shipped: `READING_LOG.md`, `READING-SHELF.md`, `READING-NOTES.md`.

### Changed
- **The plugin lives in a subdirectory, deliberately.** `plugins/atlas-method/` contains no reference outside itself, so the versioned snapshots and internal build tooling in this repository provably cannot ship to an adopter.
- `README.md` now leads with the plugin rather than `git clone`, and links to `INSTALL.md` instead of duplicating it. The two INSTALL copies had drifted precisely because the same instructions lived in two places.
- Marketplace named `damianbuilds`, so install reads `atlas-method@damianbuilds`. Settled before first publication because the `@marketplace` suffix is required and renaming it afterwards is a breaking change for anyone who has already added it.

### Fixed
- **Both INSTALL documents described a command that does not exist**: `claude plugin install <filesystem-path>`. Installation resolves only through a registered catalog. Every command in the install documentation has now been verified against the tool's own help output.
- The README "Detailed changes" link pointed at a snapshot changelog whose newest entry was 1.0.0, so it did not even cover the snapshot containing it.
- Restored three things a previous INSTALL revision had silently dropped: the CANONICAL versus SCAFFOLD distinction, the version note, and the warning that two hooks cannot be declared in a plugin manifest and require manual wiring. The second of those matters most, because one of the two carries the whole agent dispatch discipline and its absence raises no error.

### Known
- `VERSION` says `1.1.4` and the git tags agree, but the newest complete snapshot in `versions/` is `v1.1.0`, so the manual install path installs v1.1.0. Documented rather than papered over; no snapshot was backfilled and no version number was hand-patched.
- `assets/repo-layout.svg` predates the plugin and does not show it.

## [1.1.4] - 2026-06-05

### Added
- **Persistent scratchpad primitive** (`{DOMAIN}_SCRATCHPAD.md`): an opt-in content leaf for complex or stateful domains. Holds distilled cross-session state, decisions-with-rationale, and open design loops - the things that have nowhere else to live. Distinct from `{DOMAIN}_HANDOFF.md` (session baton) and `{DOMAIN}_PROGRESS.md` (emergency context save). The two are subtractive: as durable state migrates to the scratchpad, the HANDOFF shrinks. Includes: 150-line scout threshold, 200-line over-cap prune to archive, write-at-wrap discipline, 30-line-delta distill guardrail.
- **Cross-domain shared-doc primitive** (`{A}_{B}_SHARED.md`): a grammar leaf that neither domain hosts alone. Both partner domains list it under their on-demand leaves and load it when the shared topic is in play. Holds shared vocabulary, signal tables, lane ownership, and handshake protocol. Content leaf: 200-300 lines. Create only when a second writer arrives - do not pre-create for hypothetical sharing.
- **Context-rich Stage 1 mode**: a third Stage 1 dispatch mode (above orientation and question-aware). Fires when the opening prompt is 80+ words, names 2+ topics/files/decisions, or contains forwarded context. Dispatches up to 2 extra targeted scouts before generating any reply. Position-locked to session turn 1, hard cap of 2 extra scouts, typed fallback on a scout miss. Purpose: rich openers deserve scout-grounded answers - a long prompt is a signal to fetch more context, not a reason to skip Stage 1.
- **Template: DOMAIN_SCRATCHPAD.md.template** in `templates/`: ready-to-copy scaffold for the persistent scratchpad with all four sections and discipline comments. Fixes the "scratchpad template not found" gap reported by Windows downloaders.
- **Template: A_B_SHARED.md.template** in `templates/`: ready-to-copy scaffold for the cross-domain shared doc with anchor, vocabulary table, lane ownership, handshake protocol, and change log.
- **Windows setup doc** (`docs/WINDOWS-SETUP.md`): dedicated prerequisites guide addressing the four root causes of "it does not work on Windows" - wrong surface (claude.ai vs Claude Code CLI), symlink failures (copy files directly), missing bash shell (Git for Windows), and jq not on PATH. Includes a verification checklist.

### Why this matters
The scratchpad and shared-doc primitives close a long-standing gap: complex domains had no structured place for cross-session state that was neither a task (QUEUE), a baton (HANDOFF), nor a history entry (LOG). Without these primitives, that state silently accumulated in HANDOFF, bloating it past the 3-block prune trigger and forcing repeated re-explanation. The context-rich Stage 1 mode makes the system smarter about information-dense openers. The Windows doc collapses weeks of troubleshooting into one checklist.

### Notes
- All changes are additions to the v1.1.0 working tree (in-place patch pattern). v1.0.0 + v1.1.0 base trees unchanged.
- The "scratchpad template not found" issue was the primary bug this patch fixes - the template now ships with the repo.

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
