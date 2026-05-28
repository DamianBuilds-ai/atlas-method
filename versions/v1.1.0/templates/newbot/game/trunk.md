# {DOMAIN} - Reference Doc (Trunk)

> This is the trunk: the stable reference material for the {DOMAIN_LOWER} game-tracker domain. Active state lives in `{DOMAIN}_STATUS.md`. Long-term targets in `{DOMAIN}_GOALS.md`. Items and achievements in `{DOMAIN}_COLLECTION.md`. Mechanics and strategy in `{DOMAIN}_KNOWLEDGE.md`. Session-to-session continuity in `{DOMAIN}_HANDOFF.md`. Keep this trunk under ~500 lines; extract leaves when sections outgrow that.

**Last updated:** {DATE}
**Status:** Setting up

## What This Domain Is

{DOMAIN_DESCRIPTION}

A game-tracker domain. The thing being tracked is a long-running game where progress compounds across sessions - character builds, account state, collection grind, mechanical mastery. Sessions are play sessions or planning sessions. The system holds the bookkeeping so play time stays play time.

Expand this section once the shape of the work is clearer. Name the game, the platform, the account or character identity. State the edges - what counts as in-scope when you say `{DOMAIN_LOWER}` (one character? one account? a guild?), and what stays out.

## Branch Files

The game archetype has five sibling docs and this trunk. Each owns a specific question:

| File | Owns | Read when |
|------|------|-----------|
| `{DOMAIN}_STATUS.md` | Current character/account state - level, gear, resources, location, active mission | Every session start |
| `{DOMAIN}_GOALS.md` | Long-term targets and short-term sub-goals | Planning a session, reviewing direction |
| `{DOMAIN}_COLLECTION.md` | Items, achievements, mounts, recipes, kill logs - anything tracked over time | Logging a drop, checking what is still missing |
| `{DOMAIN}_KNOWLEDGE.md` | Mechanics, strategy, build references, encounter notes - the reference the game itself does not give you in one place | Looking up how something works, planning a build |
| `{DOMAIN}_HANDOFF.md` | Last session's notes, in-progress threads, blocked items | Resuming a session |
| `{DOMAIN}.md` (this file) | Stable facts about the domain itself, leaf index, cross-references | Onboarding a fresh session to the domain shape |

## Key References

The durable facts. Account names, character names, game version, in-game links, external tools.

- {Account / character identifier - replace with the first real reference}
- {Game version or patch}
- {External tools - wiki, calculator, build planner, market tracker}

## Conventions

How things are done in this domain. Logging patterns, naming for builds, recurring decisions.

- {Convention one - e.g. "log every rare drop with date and source"}
- {Convention two - e.g. "screenshot before any irreversible decision"}

## Related Domains

Other domains this one touches. Pointer-only.

- {Related domain - or "None - standalone game tracker"}

## Leaf Index

When this trunk or any branch grows past its size limit, split detailed sections into leaf docs and list them here.

| Leaf | Covers | Load when |
|------|--------|-----------|
| {DOMAIN}-{TOPIC}.md | {what it holds, e.g. detailed build for one class} | {what triggers reading it} |

> No leaves yet? Delete the table row above and add real entries as the domain grows. Do not pre-create leaves you do not need. Common leaf candidates for a game tracker: per-build pages, raid or PvP guides, market or economy notes, faction reputation trackers.

## Notes

Scratch space for context that has not earned a section yet.

- {First note}
