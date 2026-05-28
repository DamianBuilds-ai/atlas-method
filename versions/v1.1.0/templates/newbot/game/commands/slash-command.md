# /{SLASH_NAME} - {DOMAIN_TITLE} game tracker

<!-- Scaffolded by /newbot on {DATE}. Edit freely - this is your domain now. -->

{DOMAIN_DESCRIPTION}

This command loads the {DOMAIN_TITLE} game-tracker domain. It is the game archetype: a long-running game where progress compounds across sessions, with state, goals, collection, knowledge, and handoff branches.

---

## Read on session start

Read ONLY these files. Do not search the broader system - Atlas Method's domain isolation rule keeps the session lean.

1. `{DOMAIN}_STATUS.md` - current character / account state. Always read first.
2. `{DOMAIN}_HANDOFF.md` - last session's notes. Always read if the file exists.
3. `{DOMAIN}_QUEUE.md` - if you keep an active-work queue alongside the goals doc. Optional for game domains; some users prefer the goals doc to carry session intent directly.

Load on demand, only when the conversation needs them:

- `{DOMAIN}_GOALS.md` - when planning, reviewing direction, or deciding what to do this session.
- `{DOMAIN}_COLLECTION.md` - when logging a drop, checking what is still missing, or planning a hunt.
- `{DOMAIN}_KNOWLEDGE.md` - when looking up mechanics, builds, or encounter strategy.
- `{DOMAIN}.md` - when onboarding fresh context about the domain shape, or when the question needs durable facts none of the branches carry.
- Leaves (per the trunk's Leaf Index) - on the trigger the leaf documents.

**Sequential processing.** Read fully, act fully, write the result, then move to the next file. No batch-reading three files at once and trying to hold them all in working memory.

---

## Session opener

Open by reading the STATUS Snapshot and the HANDOFF Next-session-focus line. Surface the single highest-leverage move:

> "{Character/account} is {state summary}. Last session's handoff points at {focus}. Pick up that thread, or pivot?"

If the user takes the surfaced thread, proceed. If they pivot, ask one clarifying question - "planning, playing, or logging?" - then proceed.

Do not deliver a long preamble. The STATUS Snapshot and HANDOFF are the orientation. The user wrote them for themselves.

---

## Common session shapes

Game-tracker domains tend toward a few recurring shapes. Recognise them and lean into the right files.

- **Play session debrief.** User just finished a play session. Update `{DOMAIN}_STATUS.md` (gear, level, location, threads), log notable drops into `{DOMAIN}_COLLECTION.md`, capture any new mechanics or build insights into `{DOMAIN}_KNOWLEDGE.md`, write `{DOMAIN}_HANDOFF.md` for next time.
- **Planning session.** User is deciding what to do next. Read `{DOMAIN}_GOALS.md` and `{DOMAIN}_STATUS.md`. Help them pick a thread, write the session intent into `{DOMAIN}_GOALS.md` This Session.
- **Lookup.** User wants to check something - "what was that mount source again?", "what is my optimal stat priority?". Read the relevant branch (`{DOMAIN}_COLLECTION.md` or `{DOMAIN}_KNOWLEDGE.md`), answer crisply, do not over-explore.
- **Build / strategy theorycraft.** User is thinking through a build pivot or strategy change. Read `{DOMAIN}_KNOWLEDGE.md` and `{DOMAIN}_GOALS.md`. Discuss, then capture the conclusion into `{DOMAIN}_KNOWLEDGE.md` and any goal change into `{DOMAIN}_GOALS.md`.

---

## What lives here, what does NOT

**Lives here:**
- Game state for this character or account.
- Long-term and short-term goals within this game.
- Items, achievements, kill logs, collection tracking for this game.
- Mechanics, builds, encounter notes specific to this game.

**Does NOT live here:**
- Other games - each game gets its own domain.
- Game-wide reference that everyone already has - link to the wiki, do not mirror it. Capture only the bits you keep looking up.
- Real-life scheduling around play time - that is a daily-ops concern, not a game concern.

---

## Wrap

End every play or planning session with the standard wrap protocol from `procedures/wrap.md`. The game-tracker variant emphasises:

1. Update `{DOMAIN}_STATUS.md` Snapshot and any changed sections.
2. Log notable drops or unlocks into `{DOMAIN}_COLLECTION.md`.
3. Capture mechanics or build insights into `{DOMAIN}_KNOWLEDGE.md` (or extract to a leaf if a section is growing crowded).
4. Update `{DOMAIN}_GOALS.md` if any goal progressed, completed, or shifted priority.
5. Write `{DOMAIN}_HANDOFF.md` for next session - Where Things Stand, In Progress, Next-session focus.

Even a thirty-second wrap is worth the time. The next session starts faster.

---

## Pointer

State: `{DOMAIN}_STATUS.md`. Goals: `{DOMAIN}_GOALS.md`. Collection: `{DOMAIN}_COLLECTION.md`. Knowledge: `{DOMAIN}_KNOWLEDGE.md`. Handoff: `{DOMAIN}_HANDOFF.md`. Trunk: `{DOMAIN}.md`. Methodology: `docs/ATLAS_METHOD.md`. Archetype rationale: `docs/NEWBOT-PROTOCOL.md` (Game section).
