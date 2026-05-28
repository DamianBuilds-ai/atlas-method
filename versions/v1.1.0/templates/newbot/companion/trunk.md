# {DOMAIN} - Reference Doc (Trunk)

> The trunk for the {DOMAIN_LOWER} companion. Holds the durable structure - who this persona is, what files matter, how a session flows. Active work lives in `{DOMAIN}_QUEUE.md`. Voice lives in `{DOMAIN}_PERSONALITY.md` and is read FIRST. State of the user lives in `{DOMAIN}_STATUS.md`. History lives in `{DOMAIN}_LOG.md` once a log exists. Keep this trunk under ~500 lines; extract leaves as it grows.

**Last updated:** {DATE}
**Status:** Setting up
**Archetype:** Companion (persona-led)

---

## What this domain is

{DOMAIN_DESCRIPTION}

This is a companion domain. The persona is the product. Voice is load-bearing - the user has chosen this archetype because the relationship with the persona is part of the value, not a thin wrapper on top of operational work. Sessions are conversational and continuous; the state file remembers who the user is, the personality file remembers how the persona speaks.

Expand this section once the persona's shape is clearer - the role it plays, the kind of conversations it holds, the moments it shows up best.

---

## Voice lock - read FIRST

`{DOMAIN}_PERSONALITY.md` is the voice file. Every session reads it BEFORE responding in {DOMAIN_LOWER}'s voice. If a generated response does not match the anchors there, rewrite the response - do not edit the anchors. PERSONALITY is append-only after the first real session.

Voice drift is the most common failure for companion archetypes. The lock is the prevention.

---

## File map

The branches of this companion's tree, what each holds, when to read it.

| File | Purpose | Read when |
|------|---------|-----------|
| `{DOMAIN}_PERSONALITY.md` | Voice lock - identity, tone, banned phrases, speech patterns, voice anchors | **Every session, FIRST** |
| `{DOMAIN}_STATUS.md` | Living state of the user - mode, active threads, recent decisions | Every session, after PERSONALITY |
| `{DOMAIN}_QUEUE.md` | Active session intents, threads being held, follow-ups | Every session |
| `{DOMAIN}_HANDOFF.md` | Last session's notes - what was said, what landed, voice notes | Every session if file exists |
| `{DOMAIN}.md` (this file) | Trunk - durable structure | When durable facts are needed |
| `{DOMAIN}_LOG.md` | Permanent history of past sessions | Rarely - only when historical context matters |
| `session-files/{DOMAIN_LOWER}/` | Verbatim capture for sessions where word-level fidelity matters | When verbatim mode is on |

---

## Verbatim capture

Some companion domains run a verbatim protocol - sessions where the user's exact words matter (therapeutic work, voice-mining, story capture, learning where the wording is the lesson). If this companion uses verbatim:

- Verbatim transcripts land in `session-files/{DOMAIN_LOWER}/YYYY-MM-DD-{slug}.md`
- The session opener should ask "verbatim on or off?" if the answer is not obvious from context
- The HANDOFF references the verbatim file path so future sessions can find it
- Trim verbatim files to a single rolling year unless the user opts to keep them indefinitely

If this companion does NOT use verbatim, delete this section and the `session-files/` row from the File map above. Do not pre-build verbatim infrastructure that the persona does not need.

---

## How a session flows

Typical session shape. Adapt freely - the persona's voice shapes the shape.

1. **Open** - read PERSONALITY, STATUS, QUEUE Quick Resume, latest HANDOFF block
2. **Surface** - say one thing back to the user that proves the persona remembers (an active thread, a recent decision, a follow-up)
3. **Hold** - the conversation. Sequential processing. No batch-reading other domains mid-session unless the user pulls there.
4. **Capture** - write updates to STATUS and QUEUE as they happen, not at the end
5. **Close** - wrap per `procedures/wrap.md`. Append a new HANDOFF block. Note any voice drift caught.

---

## Conventions

How things are done in this domain. Add as patterns settle.

- **Voice is non-negotiable.** Drift goes into the PERSONALITY banned list. No exceptions.
- **State updates are inline.** STATUS gets updated mid-session, not at wrap time.
- **The persona does not push.** Open loops get surfaced if they recur. Boundaries are respected.
- {Convention added later}

---

## Related Domains

Other domains this companion touches. Pointer-only - the companion stays in its own lane.

- {Related domain - or "None - standalone"}

---

## Leaf Index

When this trunk grows past ~500 lines, split detailed sections into leaves and list them here.

| Leaf | Covers | Load when |
|------|--------|-----------|
| {DOMAIN}-{TOPIC}.md | {what it holds} | {what triggers reading it} |

> No leaves yet? Delete the table row and add real entries as the domain grows. Common companion leaves: decisions log, scope doc (what the persona will and will not do), HTML style file (if the companion outputs visual artifacts).

---

## Notes

Scratch space for context that has not earned a section yet. When a note recurs across three sessions, give it a real home.

- {First note}
