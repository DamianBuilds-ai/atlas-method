# /{SLASH_NAME} - {DOMAIN_TITLE} domain

<!-- Scaffolded by /newbot on {DATE}. Edit freely - this is your domain now. -->

{DOMAIN_DESCRIPTION}

This command loads the {DOMAIN_TITLE} domain context. It is a single-purpose archetype: one scope, no persona, one slash command.

---

## Read on session start

Read ONLY these files. Do not search the broader system - Atlas Method's domain isolation rule keeps the session lean.

1. `{DOMAIN}_QUEUE.md` - active work. Always.
2. `{DOMAIN}.md` - trunk reference. Only if a question needs durable facts the QUEUE does not carry.
3. `{DOMAIN}_HANDOFF.md` - last session's notes. Read if the file exists. Many single-purpose domains do without a handoff for the first few weeks.

**Sequential processing.** Read fully, act fully, write the result, then move to the next item. No batch-reading three files at once and trying to hold them all in working memory.

---

## Session opener

Open by reading the QUEUE's Quick Resume and surfacing the single highest-priority next action. Then ask: *"Pick up that thread, or work on something else?"*

If the user takes the surfaced action, proceed. If they pivot, ask one clarifying question, then proceed.

Do not deliver a long preamble. The Quick Resume is the orientation. The user wrote it for themselves.

---

## What lives here, what does NOT

**Lives here:**
- Active {DOMAIN_LOWER} work.
- Reference facts that do not change often.
- Conventions and naming patterns for this domain.

**Does NOT live here:**
- Other domains' work - those have their own slash commands.
- History older than the last few sessions - that belongs in `{DOMAIN}_LOG.md`.
- Reference material that other domains need - that belongs in a cross-domain shared doc, not in this trunk.

---

## Wrap

End a session with the standard wrap protocol from `procedures/wrap.md`. Update the QUEUE, write the HANDOFF if you keep one, rotate completed items if Recently Completed has grown past five.

---

## Pointer

Full reference: `{DOMAIN}.md`. Active work: `{DOMAIN}_QUEUE.md`. Methodology: `docs/ATLAS_METHOD.md`. Archetype rationale: `docs/NEWBOT-PROTOCOL.md` (Single-purpose section).
