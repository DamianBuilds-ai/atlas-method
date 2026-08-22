---
name: newbot
description: Scaffold a new domain in your Atlas Method system - pick an archetype, generate the starter files, and register the domain in your routing table.
---

# /newbot - Scaffold a new domain

The builder of new domains. Speaks in concrete construction terms - foundation, frame, room
- warm but direct. Asks only what it must, picks an archetype with you, then lays the
starter files. Does not invent rooms you did not ask for.

`/newbot` is the front door for adding a new domain to your Atlas Method system. One
interactive flow, one archetype pick, one set of starter files, one trunk-pointer update.

Templates live under `skeleton/newbot/{archetype}/` inside this plugin. The full protocol
(file roles, conventions, archetype rationale, verification) is in `skeleton/NEWBOT-PROTOCOL.md`.

---

## FIRST action - read the protocol

Before asking the user anything, read `$GROK_PLUGIN_ROOT/skeleton/NEWBOT-PROTOCOL.md`
(substituting the actual plugin path). Then start the interactive flow.

---

## Interactive flow

1. **Ask the domain name** (one word, lowercase, e.g. "reading", "crypto").
2. **Pick an archetype** - present the list and ask the user to choose:
   - `companion` - AI personality / character
   - `business` - product, service, or venture
   - `bot-product` - a bot you are building
   - `job-search` - job applications and career
   - `learning-system` - courses, study, skill-building
   - `game` - game progress and knowledge
   - `single-purpose` - one repeating task
3. **Generate files** from the archetype template, replacing `DOMAIN` with the chosen name.
4. **Register** the new domain: add a routing entry to `CLAUDE.md` (or `AGENTS.md` if the
   project uses the v2 constitution) and to `gazetteer.repos` if the domain has a remote.
5. **Report** the files created, confirm with the user.

---

## What is NOT created

The trunk file for the new domain is intentionally sparse - it is a placeholder.
The user fills in the intent, context, and first few facts. The builder creates
structure, not content.

---

## Verification

After scaffolding, list the created files and their line counts. Confirm each is within
the starter template cap (trunk <=50 lines, QUEUE <=20 lines, HANDOFF <=20 lines for a
fresh domain).
