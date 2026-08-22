# Skeleton - Atlas Method template payload

This directory ships the files that `atlas-init` copies into a new personal OS repo.
It is the template payload boundary: everything here may ship to adopters.
Nothing from the build tooling (internal ADR docs, shift ceremony, tier-boundary markers) is here.

## Files

| File | Destination | Purpose |
|------|-------------|---------|
| `AGENTS.md.template` | `AGENTS.md` | The v2 constitution (the one brain) |
| `CLAUDE.md.template` | `CLAUDE.md` | One-line Claude Code shell: `@AGENTS.md` |
| `GEMINI.md.template` | `GEMINI.md` | One-line Gemini shell: `@AGENTS.md` |
| `gazetteer.repos.template` | `gazetteer.repos` or `~/.atlas/gazetteer.repos` | Manifest of repos to index |
| `baton-stub.md.template` | `sessions/current/{date}_{domain}.md` | Session baton stub |
| `DOMAIN.md.template` | `{DOMAIN}.md` | Domain trunk starter |
| `DOMAIN_QUEUE.md.template` | `{DOMAIN}_QUEUE.md` | Domain queue starter |
| `DOMAIN_HANDOFF.md.template` | `{DOMAIN}_HANDOFF.md` | Domain handoff starter |
| `DOMAIN_IDEAS.md.template` | `{DOMAIN}_IDEAS.md` | Domain ideas parking lot |

## First-time setup (after atlas-init runs)

1. Open `AGENTS.md` and replace `{{PROJECT_NAME}}`, `{{DOMAIN}}`, and `{{AM_VERSION}}`.
2. Rename the `DOMAIN.*` files to your first real domain name.
3. Edit `gazetteer.repos` - replace `REPLACE_WITH_ABSOLUTE_PATH_TO_atlas-method` with
   the absolute path to the atlas-method repo on your machine.
4. Run `/atlas-method-grok:newbot` to scaffold additional domains.
5. Wire the session-start hook (see `bin/session-start.sh` in the plugin root).
