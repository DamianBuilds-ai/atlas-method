# READING.md - Reading Domain (Trunk)

> **This is an example domain.** It shows how the Atlas Method four-doc pattern looks once populated. The content is fictional - a reading-tracker for a person who reads books and articles and wants to remember what they learned. Use it as a shape to copy, not as real data.

**Domain purpose:** Track what I'm reading, capture notes worth keeping, decide what to read next. Books, long articles, papers. The aim is retention, not a vanity count.

**Files in this domain (the four-doc pattern):**

| File | Role | When read |
|------|------|-----------|
| `READING.md` (this file) | Trunk - stable reference, the index of everything | Read when you need the lay of the land |
| `READING_QUEUE.md` | Branch - the active worklist for this session | Read EVERY session, first |
| `READING_HANDOFF.md` | Branch - what the last session did, what's in progress | Read at session start after QUEUE |
| `READING_IDEAS.md` | Branch - the parking lot for future reading + tooling ideas | Read on demand, never at startup |

Leaves (specialized sub-docs) hang off this trunk and load on demand only:

| Leaf | Holds | Load when |
|------|-------|-----------|
| `READING-SHELF.md` | The full catalog of finished books with one-line verdicts | You need a past book's verdict or rating |
| `READING-NOTES.md` | Long-form notes extracted from current reads | You're writing up or revisiting notes |

If a leaf is not listed here, future sessions will not find it. Adding a leaf means adding a row to this table in the same change (see the leaf-creation procedure).

---

## Current focus

Reading two books in parallel plus a backlog of saved articles. The non-fiction book is the priority - it's for a specific goal (understanding how habits form). The novel is the wind-down read. Articles get cleared in batches on weekends.

**Active reads:**
- *Atomic Habits* style non-fiction (priority, ~40% through)
- A literary novel (wind-down, no deadline)

---

## How this domain works

**Capture, don't hoard.** A book only earns a notes entry if there's something worth re-reading later. Most books get a one-line verdict on the shelf and nothing more. The notes leaf is for the rare book that changes how you think.

**One book gets priority.** Parallel reading is fine, but exactly one read is the "make progress this week" book. The rest are optional. This prevents the pile of half-finished books.

**Articles are batch-cleared.** Saved articles accumulate during the week and get read (or culled) in one weekend pass. An article that survives three weekend passes without being read gets deleted - if it mattered, it would have been read.

**The shelf is the long memory.** `READING-SHELF.md` is the durable record. The QUEUE is ephemeral (this week's worklist); the shelf is forever (every book, with a verdict).

---

## Conventions

- **Ratings:** simple 1-5. A 5 is "would re-read or recommend unprompted". Most books are 3s.
- **Verdict line format:** `Title - Author (rating) - one sentence on what it was actually about and whether it delivered.`
- **Notes only for 4s and 5s.** A book under 4 stars does not get a notes entry. This keeps the notes leaf signal-dense.
- **Article triage:** keep / read-now / cull. No "maybe later" - that's how backlogs metastasize.
