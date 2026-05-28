# {DOMAIN} - Reference Doc (Trunk)

> Trunk for the {DOMAIN_LOWER} learning domain. Holds the durable facts about what is being learned, why, and how progress is tracked. The active study sessions live in `{DOMAIN}_QUEUE.md`, the curriculum and reading list live in `{DOMAIN}_TOPIC.md`, structured lessons live in `{DOMAIN}_COURSEWORK.md`, and the running log of what has been covered lives in `{DOMAIN}_PROGRESS.md`. Keep this trunk under ~500 lines; when it outgrows that, extract sections into leaves and link them from the Leaf Index below.

**Last updated:** {DATE}
**Status:** Setting up

## What This Domain Is

{DOMAIN_DESCRIPTION}

The learning-system archetype is built for a long-running study effort: a certification, a textbook, a framework, a course series, a self-directed deep dive. The shape is topic-progression: there is a body of material, you work through it in order or by theme, you track what you have understood and what you have not. Single subject; one tracker; many sessions.

## Goal

State the outcome that ends this domain or marks the milestone. Examples: pass the certification exam by {DATE}. Finish the textbook with worked solutions to every exercise. Build the capstone project the course requires. Without a goal, a learning domain drifts into infinite reading.

- **Goal:** {What success looks like}
- **Target date:** {When, or "no hard deadline"}
- **Definition of done:** {The concrete signal that this domain wraps}

## Curriculum Source

Where the material comes from. One primary source is best; extras supplement.

- **Primary:** {Book / course / spec / exam blueprint - title, author/publisher, edition}
- **Secondary:** {Companion resources - videos, forums, reference docs}
- **Practice:** {Where exercises, problem sets, or labs live}

The curriculum itself is enumerated in `{DOMAIN}_TOPIC.md`. The reading list lives there. This trunk just points to the source of truth.

## Method

How learning happens in this domain. Style of study, cadence, tools.

- **Cadence:** {Daily, weekly, project-based - whatever rhythm has been chosen}
- **Session shape:** {Read then summarise; watch then practice; build then write up; etc.}
- **Notes target:** {Where comprehension is captured - PROGRESS log, separate notebook, flashcards}
- **Tools:** {Editor, REPL, lab environment, reference site}

Conventions get locked in here so they are not re-litigated each session.

## Progress Snapshot

A one-line headline. The detail lives in `{DOMAIN}_PROGRESS.md`. This snapshot updates when the headline meaningfully changes.

- **Currently on:** {Chapter / module / topic}
- **Covered:** {Rough percentage or count - "3 of 12 modules", "chapter 7 of 18"}
- **Last session:** {DATE} - {one-line summary}

## Key References

The durable facts. Accounts, identifiers, conventions, paths, links. Things you look up but do not change often.

- {Course portal URL / login if relevant}
- {Exam registration link if certification}
- {Reference docs that get hit repeatedly}

## Conventions

Decisions already made so they are not re-litigated each session.

- **Naming:** How code, notes, and projects are named (e.g. `module-03-exercise-2.py`).
- **Storage:** Where project work lives (e.g. `coursework-projects/{DOMAIN_LOWER}/`).
- **Review cadence:** When prior material gets revisited (e.g. "review covered topics every 4 sessions").
- **Stuck protocol:** What to do when blocked (re-read, ask, skip-and-mark, etc.).

## Related Domains

Other domains this learning effort touches. Pointer-only.

- {Related domain - or "None - standalone"}

## Leaf Index

When this trunk grows past ~500 lines or when a sub-topic deserves its own deep doc, split into leaves and list them here.

| Leaf | Covers | Load when |
|------|--------|-----------|
| {DOMAIN}-{TOPIC}.md | {what it holds} | {what triggers reading it} |

> No leaves yet? Delete the table row above and add real entries as the domain grows. Common learning-system leaves: a single hard topic getting its own deep dive, a glossary, a cheat-sheet, a project log.

## Notes

Scratch space for context that has not earned a section yet. When a note recurs across three sessions, give it a real home.

- {First note}
