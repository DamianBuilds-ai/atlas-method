# /{SLASH_NAME} - {DOMAIN_TITLE} learning domain

<!-- Scaffolded by /newbot on {DATE}. Edit freely - this is your domain now. -->

{DOMAIN_DESCRIPTION}

This command loads the {DOMAIN_TITLE} learning domain. It is a learning-system archetype: one topic of study, tracked by progression through a curriculum, with per-lesson coursework and a running session log.

---

## Read on session start

Read ONLY these files. Do not search the broader system - Atlas Method's domain isolation rule keeps the session lean.

1. `{DOMAIN}_QUEUE.md` - active sessions. Always.
2. `{DOMAIN}_PROGRESS.md` - the running log of what's been covered and what's next. Always - this is how the session knows where to pick up.
3. `{DOMAIN}_TOPIC.md` - curriculum and reading list. Only if a question needs the topic map (which module covers X, what is the reading source).
4. `{DOMAIN}_COURSEWORK.md` - per-lesson record. Only if revisiting or reviewing a specific past lesson.
5. `{DOMAIN}.md` - trunk reference. Only for durable facts the queue and progress do not carry (goal, method, conventions).

**Sequential processing.** Read fully, act fully, write the result, then move to the next item. Do not batch-read all five files at once.

---

## Session opener

Open by reading `{DOMAIN}_QUEUE.md` Quick Resume and `{DOMAIN}_PROGRESS.md` "What Is Next". Surface the single highest-priority next study action. Then ask: *"Pick up that thread, or work on something else?"*

If the user takes the surfaced action, proceed - load whichever specific module or chapter is next from `{DOMAIN}_TOPIC.md`. If they pivot, ask one clarifying question, then proceed.

Do not deliver a long preamble. The Quick Resume and What Is Next together are the orientation.

---

## During a study session

A learning-system session has a typical shape. Follow it loosely - it is a scaffold, not a script.

1. **Set the scope.** State what is being covered this session (one topic, one lesson, one problem set).
2. **Engage the material.** Read, watch, work through. Ask clarifying questions, explain back, attempt exercises.
3. **Capture as you go.** Notes, code, partial solutions write to the right place - `{DOMAIN}_COURSEWORK.md` for per-lesson detail, working code to whatever path Conventions specifies.
4. **Mark status honestly.** `[x]` for covered, `[~]` for in-progress, `[!]` for shaky-needs-review. Honest markers beat optimistic ones.
5. **Set the next action.** Before the session ends, decide what comes next. Write it into `{DOMAIN}_QUEUE.md` This Session or Queue.

---

## What lives here, what does NOT

**Lives here:**
- Active study work for {DOMAIN_LOWER}.
- The curriculum and topic map.
- Per-lesson coursework records.
- The running progress log.
- Conventions specific to this learning effort.

**Does NOT live here:**
- Other learning domains - each subject gets its own slash command.
- The full source material - link to it, do not copy it.
- General study technique - that belongs in a separate methodology doc if you keep one.

---

## Wrap

End a session with the standard wrap protocol from `procedures/wrap.md`. For a learning domain specifically:

1. Update `{DOMAIN}_PROGRESS.md` with the session entry (covered, got it, didn't, next).
2. Update `{DOMAIN}_COURSEWORK.md` if any granular per-lesson entries were generated.
3. Update `{DOMAIN}_QUEUE.md` - check off This Session items, set the next action.
4. If the topic map status changed (a `[ ]` became `[x]`), update `{DOMAIN}_TOPIC.md` accordingly.

---

## Pointer

Full reference: `{DOMAIN}.md`. Active sessions: `{DOMAIN}_QUEUE.md`. Curriculum: `{DOMAIN}_TOPIC.md`. Coursework: `{DOMAIN}_COURSEWORK.md`. Progress log: `{DOMAIN}_PROGRESS.md`. Methodology: `docs/ATLAS_METHOD.md`. Archetype rationale: `docs/NEWBOT-PROTOCOL.md` (Learning-system section).
