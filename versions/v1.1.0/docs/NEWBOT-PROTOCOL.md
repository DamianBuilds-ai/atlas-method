# NEWBOT-PROTOCOL.md

**The full protocol behind `/newbot`.** Loaded on demand by the slash command. Written for an agent or user to read once and follow.

Last updated: 2026-05-28

---

## Section 1 - Purpose

This doc backs `/newbot`. The slash command is a lean front door - five questions, one archetype pick, one set of starter files. This doc holds the long-form reference: archetype roles, file conventions, design rationale, verification, pitfalls.

### The split

`/newbot` itself stays under ~250 lines so its invocation does not bloat session context. When `/newbot` runs, it:

1. Asks five interactive questions (archetype, name, purpose, slash, voice if needed).
2. Reads ONLY the chosen archetype's template folder.
3. Substitutes placeholders, lays files one at a time.
4. Confirms before mutating the root instruction file.
5. Runs verification.

The user does not read this doc during scaffolding. The agent does, or the user reads it once to understand the system. The slash command does the work.

### Why a separate protocol doc

Pulling all seven archetype scaffolds, the routing-table conventions, the memory-entry templates, the verification grep patterns into the slash command itself would push it past 1,000 lines. Every invocation would load all of that, even when scaffolding the simplest single-purpose domain. Splitting keeps the command lean and loads scaffolds only when relevant - the same progressive-loading discipline Atlas Method enforces on user domains.

### Scope

Seven archetypes, defined in Section 2. The single-purpose archetype's full scaffold in Section 3. The other six archetypes ship full scaffolds in v1.1.0 wave 2 - their slots are placeholders in this release. Cross-cutting conventions (root-file updates, verification, pitfalls) in Sections 4-7. Migration in Section 8.

---

## Section 2 - The seven archetypes

Before scaffolding, the user picks an archetype. Each archetype represents one common shape a domain takes. The seven cover the inventory observed across many real Atlas Method instances. If a user's domain does not fit cleanly into one of the seven, default to **single-purpose** and let the domain grow into its real shape over time.

### The seven

| # | Slug | When it fits | Distinguishing trait |
|---|------|--------------|----------------------|
| 1 | `single-purpose` | One scope, no persona, no engine | Smallest archetype, fewest files |
| 2 | `companion` | Persona is core to the experience, voice is load-bearing | PERSONALITY doc, verbatim discipline |
| 3 | `learning-system` | Persona teaches across multiple sub-topics that share an engine | Engine doc + per-topic config + miss log + progress tracker |
| 4 | `game` | State-tracking for a game or hobby | STATUS / GOALS / KNOWLEDGE / COLLECTION instead of QUEUE / LOG |
| 5 | `job-search` | Per-opportunity dossiers, contact log, applications tracker | Recurring application demographics, per-company assets folder |
| 6 | `business` | Multi-workstream product with brand and ICP | Workstream leaves, ICP doc, web-bridge for any deployed surface |
| 7 | `bot-product` | Live system being operated - bot, daemon, scheduled service | Ops state changes daily, product-spec and ops leaves |

### Pick by the strongest signal

Ask the questions in order. Stop at the first clear YES.

**Q1: Is there a persona that teaches across multiple sub-topics?**

If yes: **learning-system** (#3).

**Q2: Is there a persona whose voice is load-bearing?**

If yes: **companion** (#2).

**Q3: Is this a live operational system you run?**

If yes: **bot-product** (#7).

**Q4: Does the domain center on opportunities you pursue (jobs, freelance, sales)?**

If yes: **job-search** (#5).

**Q5: Is this a product or business with multiple workstreams and a brand?**

If yes: **business** (#6).

**Q6: Is this state-tracking for a game or hobby with no work queue?**

If yes: **game** (#4).

**Q7: Otherwise.**

Default: **single-purpose** (#1). The smallest archetype. Easiest to grow into something else if the domain reveals a richer shape.

### Disambiguation cases

**Case A - persona plus a single topic.** A teacher persona for one specific subject. Default: start as **companion**. If the user later wants to add a second topic, promote to learning-system at that point. Do not pre-build engine scaffolding for a one-topic case.

**Case B - mild voice, operational scope.** A bot with a consistent but not load-bearing tone. This is **bot-product**, not companion. Voice is flavor, not the product.

**Case C - game with active grinding work.** A game where you track active goals and weekly progress, not just state lookup. Still **game** - the GOALS file carries the active work. QUEUE is unusual for game archetypes.

**Case D - learning-system with no persona.** Does not exist. Learning systems need a persona to teach and grade. If the user wants topic-tracking without a teacher, that is single-purpose (or a spreadsheet).

---

## Section 3 - Single-purpose archetype scaffold

Use when Q7 fired. The smallest archetype. Three template files ship in v1.1.0; an optional HANDOFF and LOG are created later as the domain grows.

### Files to create

| # | Path | Purpose | Template |
|---|------|---------|----------|
| 1 | `{DOMAIN}.md` | Trunk reference - durable facts, conventions, leaf index | `templates/newbot/single-purpose/trunk.md` |
| 2 | `{DOMAIN}_QUEUE.md` | Active work - Quick Resume, This Session, Active, Queue, Recently Completed | `templates/newbot/single-purpose/queue.md` |
| 3 | `commands/{SLASH_NAME}.md` | Slash command - what to read, session opener, wrap pointer | `templates/newbot/single-purpose/slash-command.md` |
| 4 (optional) | `{DOMAIN}_HANDOFF.md` | Session-to-session continuity | `skeleton/DOMAIN_HANDOFF.md.template` |
| 5 (optional) | `{DOMAIN}_LOG.md` | Rotated history | Created on first rotation, not at scaffold time |
| 6 (optional) | `{DOMAIN}_IDEAS.md` | Parking lot for deferred work | `skeleton/DOMAIN_IDEAS.md.template` |

The three core files (trunk, queue, slash command) cover most single-purpose domains for the first month. Add HANDOFF when sessions start carrying state across days. Add LOG when Recently Completed first overflows. Add IDEAS when the user starts deferring things they do not want to forget.

### Placeholders to substitute

Every template file uses these placeholders. Replace each one when the template is copied into the target location.

| Placeholder | Example | Source |
|-------------|---------|--------|
| `{DOMAIN}` | `BILLING` | Q1 uppercase form |
| `{DOMAIN_LOWER}` | `billing` | Q1 lowercase form |
| `{DOMAIN_TITLE}` | `Billing` (single-word) or `Client Billing` (multi-word from `client-billing`) | Q1 title-cased display form. For kebab-case names, replace hyphens with spaces and title-case each segment. |
| `{DOMAIN_DESCRIPTION}` | `Track invoices and payments for client work.` | Q3 one-sentence purpose |
| `{SLASH_NAME}` | `billing` (default = `{DOMAIN_LOWER}`) or an explicit override like `bill` when the default collides | Q4 slash command name without the leading slash. Typically the same as `{DOMAIN_LOWER}`; differs only when the user supplied an override at Q4. |
| `{DATE}` | `2026-05-28` | Today's date in YYYY-MM-DD |

### Filename rename pattern (source -> instance)

Template source files use generic names so they are valid markdown without substitution and can be inspected upstream. `/newbot` renames them on copy into the user's instance using a consistent pattern:

| Source filename (in `templates/newbot/{archetype}/`) | Instance filename (in the user's instance) |
|------------------------------------------------------|--------------------------------------------|
| `trunk.md` | `{DOMAIN}.md` |
| `queue.md` | `{DOMAIN}_QUEUE.md` |
| `handoff.md` | `{DOMAIN}_HANDOFF.md` |
| `status.md` | `{DOMAIN}_STATUS.md` |
| `goals.md` | `{DOMAIN}_GOALS.md` |
| `knowledge.md` | `{DOMAIN}_KNOWLEDGE.md` |
| `collection.md` | `{DOMAIN}_COLLECTION.md` |
| `personality.md` | `{DOMAIN}_PERSONALITY.md` |
| `topic.md` | `{DOMAIN}_TOPIC.md` |
| `coursework.md` | `{DOMAIN}_COURSEWORK.md` |
| `progress.md` | `{DOMAIN}_PROGRESS.md` |
| `applications.md` | `{DOMAIN}_APPLICATIONS.md` |
| `career.md` | `{DOMAIN}_CAREER.md` |
| `icp.md` | `{DOMAIN}_ICP.md` |
| `product-spec.md` | `{DOMAIN}_PRODUCT_SPEC.md` |
| `ops.md` | `{DOMAIN}_OPS.md` |
| `log.md` | `{DOMAIN}_LOG.md` |
| `commands/slash-command.md` | `commands/{SLASH_NAME}.md` |
| `workstream-template.md` | (left as `workstream-template.md` - user copies once per workstream to `{DOMAIN}-{WORKSTREAM}.md`) |
| `opportunity-template.md` | (left as `opportunity-template.md` - user copies once per opportunity to `{DOMAIN}-{COMPANY}-OPPORTUNITY.md`) |

**Rule.** `trunk.md` -> `{DOMAIN}.md`. All other source filenames `X.md` -> `{DOMAIN}_{X_UPPER}.md` (uppercase, hyphens become underscores). Slash command source `commands/slash-command.md` -> `commands/{SLASH_NAME}.md`. Per-instance leaf templates (`workstream-template.md`, `opportunity-template.md`) are kept generic so the user can copy them on demand.

### Root-file updates

Single-purpose adds two rows to the user's root instruction file (typically `CLAUDE.md`). Always confirm before writing.

**Domain Isolation table row:**

```
| {DOMAIN_TITLE} | {DOMAIN}_QUEUE.md, {DOMAIN}.md | Everything else (unless explicitly told) |
```

**Command Routing table row:**

```
| {one-line trigger from Q3} | `/{SLASH_NAME}` |
```

The exact wording of the trigger is the user's call - the agent proposes a derivation from Q3 and the user can rewrite. Routing rows are short - one phrase that captures "when would I want to use this?"

### Verification checklist

Run after scaffolding. Each check pass or fail gets reported.

```
- [ ] {DOMAIN}.md exists
- [ ] {DOMAIN}_QUEUE.md exists
- [ ] commands/{SLASH_NAME}.md exists
- [ ] Domain Isolation row inserted in the root instruction file (grep check)
- [ ] Command Routing row inserted in the root instruction file (grep check)
- [ ] /{SLASH_NAME} appears in the slash command list (Claude Code project scanner)
```

If any check fails, stop and surface the failure. Do not declare the scaffold complete with missing artifacts.

### When to promote out of single-purpose

If, weeks after scaffolding, the domain starts growing a persona that speaks, multiple sub-topics, or a per-opportunity tracking pattern - that is a signal it might want a richer archetype. Migration is manual and user-initiated; `/newbot` does not auto-migrate. See Section 8.

---

## Section 4 - The other six archetypes (coming in v1.1.0 wave 2)

Templates for the remaining archetypes ship in wave 2 of the v1.1.0 release. This section sketches the shape each will take so users can plan ahead, and so the slash command can surface a useful "coming soon" message rather than a blank one.

### Archetype 2 - companion

Persona-led. Voice is load-bearing. Files include a PERSONALITY doc (locked once written), a richer trunk that points at the personality, QUEUE, HANDOFF, LOG, and a session-files directory for verbatim capture. Memory entries (or their equivalent in your stack) lock the voice and HTML style.

### Archetype 3 - learning-system

Persona teaches across multiple topics that share an engine. Files include the persona's trunk and PERSONALITY, an engine doc (topic-agnostic loop, variants, scheduling, grading), a topics directory with a `_TEMPLATE` and one filled-in topic, parallel misses and progress directories, and two slash commands - one for admin and extension, one per active topic.

### Archetype 4 - game

State-tracking for a game or hobby. Files include a knowledge trunk, STATUS for current state, GOALS for active objectives, HANDOFF for session-to-session continuity, COLLECTION for an inventory of items / achievements / characters. No QUEUE - the GOALS file carries the active work.

### Archetype 5 - job-search

Per-opportunity dossiers. Files include QUEUE, HANDOFF, an APPLICATIONS doc for the open pipeline, a CAREER doc for resume and positioning context, an INTERVIEWS doc for prep notes, and a per-opportunity assets folder for cover letters, screenshots, and reference material that does not fit cleanly in markdown.

### Archetype 6 - business

Multi-workstream product. Files include trunk, QUEUE, HANDOFF, an ICP doc (ideal customer profile and positioning), and workstream leaves added on demand (commercial, build, content, web). A web-bridge stub for any deployed surface, optional PERSONALITY if there is a load-bearing brand voice.

### Archetype 7 - bot-product

Live operational system. Files include trunk, QUEUE, HANDOFF, a PRODUCT_SPEC for the system being operated, and an OPS doc for deploy / logs / env state. LOG rotates often because ops state changes daily.

Each archetype's full scaffold lands in `templates/newbot/{archetype}/` during wave 2.

---

## Section 5 - Root instruction file updates

Every new domain touches two tables in the user's root instruction file (typically `CLAUDE.md`, but the user's file might be named differently). The slash command always proposes the rows and waits for explicit confirmation before writing.

### Domain Isolation table

This table tells future sessions which files to read for which domain. Without a row here, sessions will not know the domain exists.

Row shape:

```
| {Domain display name} | {READ-only files, comma-separated} | {DO-NOT-read guidance} |
```

The third column is the discipline anchor - it stops sessions from reading the broader system when only one domain's context is needed.

### Command Routing table

This table tells the root file's command-routing logic which slash command to suggest when the user opens a new chat without one. One line that captures "when would I want this?"

Row shape:

```
| {one-line trigger phrase} | `/{slash-name}` |
```

### Anchor comments (optional but recommended)

If the user is willing, add HTML comments to their root instruction file at the end of each table:

```
<!-- atlas-method:domain-isolation-table:end -->
<!-- atlas-method:command-routing-table:end -->
```

Future `/newbot` runs can insert new rows immediately before these anchors instead of grep-and-pray. The anchors are optional - the scaffold works without them, but with them the build is more robust.

### Never write to the root file silently

This rule is non-negotiable. The root instruction file is the system's nervous system. A silent write that introduces a typo or a wrong row can break every session until it is found. Always show the rows, always wait for a second yes.

---

## Section 6 - Voice files and persona scaffolding

Companion, learning-system, and (optionally) business archetypes include a PERSONALITY file. The five-question flow's Q5 collects the persona's identity, tone, and banned phrases. Those answers populate the PERSONALITY template's matching sections.

### What goes in a PERSONALITY doc

Five sections, in this order:

1. **Identity** - one paragraph. Who is this persona, what is their relationship to the user.
2. **Tone** - three bullets. Pace, register, default emotional valence.
3. **Banned phrases** - things the persona must never say. Three to five entries minimum.
4. **Speech patterns** - one to three verbal tics or sentence shapes that anchor the voice.
5. **Voice anchors** - five verbatim question-and-answer pairs in the persona's canonical voice. These are the gold standard - if a future response does not match an anchor, rewrite.

### Voice anchors are the lock

The agent does not generate voice anchors during scaffolding. The user writes them in their first real session with the persona. The PERSONALITY template ships with placeholder anchors and a note explaining the user's job is to fill them.

### Once written, PERSONALITY is locked

Treat PERSONALITY as append-only after the first session. Edits require deliberate user intent - not casual session edits. Voice drift is the most common failure mode for companion archetypes, and the lock is the prevention.

---

## Section 7 - Pitfalls

The most common ways scaffolding goes wrong, and how to avoid each.

1. **Files written, root-file row missing.** The agent creates the templates and forgets the Domain Isolation row. Future sessions cannot find the domain. The verification checklist catches this - never skip verification.

2. **Wrong slash command path.** The slash command must land at `commands/{SLASH_NAME}.md` (or wherever the user's Claude Code instance scans for commands). A typo in the slash name produces a command that does not appear in the slash list. Verify by checking the slash command list after scaffolding.

3. **Forgetting the optional HANDOFF for domains that need it.** Single-purpose archetypes default to no HANDOFF. If the domain ends up with state that crosses sessions, the missing HANDOFF causes "what was I doing?" friction. Add it when the need surfaces - do not pre-build for hypothetical state.

4. **Voice file in a transient location.** During companion scaffolding, the persona is sometimes drafted into a scratch directory. That directory may be ephemeral. The PERSONALITY file must land at its canonical path in the user's instance before scaffolding completes - otherwise the voice gets lost on the next cleanup.

5. **Learning-system: missing extension protocol.** Without an extension protocol doc, adding a new topic later requires reverse-engineering the engine. Bake the extension protocol in at scaffold time, not later.

6. **Pre-building optional leaves.** Empty leaves are noise. Persona-led domains have many optional leaves (decisions log, scope doc, rules doc) - do not create them at scaffold time. They get added as the persona accumulates real content.

7. **Skipping the persona prompts for companion archetypes.** Voice is load-bearing. Skipping Q5 produces a voice-drift trap by week two. The slash command must not silently skip Q5 - if the user does not want to fill it in, that is a signal they should pick single-purpose instead.

8. **Batch writes that fail silently.** Always write one file at a time and report the path as each lands. A batch write that fails halfway through can leave the scaffold in a partial state that is hard to recover from.

9. **Overwriting an existing domain.** The collision check is the gate. If any of the planned files already exist, stop and report. Never improvise a rename - the user picks how to resolve the collision.

10. **Substituting placeholders incorrectly.** `{DOMAIN}` and `{DOMAIN_LOWER}` are different. Test substitution on one file and visually scan the output before processing the rest. A wrong substitution at scaffold time produces broken filenames that are hard to find later.

---

## Section 8 - Migration

**Default policy: do not migrate existing domains to a new archetype.**

### Why conservative

Existing single-purpose domains usually work fine. Forcing them through an archetype gate later adds little. Existing persona-led companions were often hand-crafted; their leaves do not always map cleanly to a template. Refactoring risks breaking voice-locked artifacts.

### When migration makes sense

Migrate ONLY if:

- The user explicitly asks ("rebuild my journal companion on the new template").
- The existing domain is breaking (voice drift, missing leaves causing repeated context misses).
- A second instance of an archetype is being scaffolded and consistency would help.

### What never migrates

Voice anchors, locked memory entries, decisions logs. These are append-only artifacts. Migration touches structure, not content. The user's writing is the writing; only the file organization changes.

### Manual, user-initiated

`/newbot` does not detect existing domains that look like they could be promoted. Migration is always a user-initiated, manual process. The slash command is for new domains.

---

## Section 9 - Verification (cross-archetype)

Every scaffold ends with verification. This section lists the universal checks that apply to all seven archetypes, plus archetype-specific additions.

### Universal checks

```
- [ ] Trunk doc exists
- [ ] QUEUE (or STATUS for game archetype) exists
- [ ] Slash command exists at commands/{SLASH_NAME}.md
- [ ] Slash command appears in the Claude Code slash list
- [ ] Domain Isolation row inserted (grep check)
- [ ] Command Routing row inserted (grep check)
- [ ] Verification report shown to the user, pass or fail per item
```

### Companion adds

```
- [ ] PERSONALITY doc exists at canonical path
- [ ] PERSONALITY contains at least three of the five sections filled
- [ ] Trunk references PERSONALITY
- [ ] Voice-lock memory entry written (if the user's stack supports memory entries)
```

### Learning-system adds

```
- [ ] Engine doc exists and contains the loop, variants, scheduling, grading
- [ ] Topics directory exists with a _TEMPLATE and at least one filled-in topic
- [ ] Misses directory exists with matching _TEMPLATE and topic file
- [ ] Progress directory exists with matching _TEMPLATE and topic file
- [ ] Both slash commands exist: /{persona} and /{persona}-{topic}
- [ ] Extension protocol doc exists and is referenced from the trunk
```

### Game adds

```
- [ ] STATUS, GOALS, KNOWLEDGE, COLLECTION files exist (no QUEUE)
- [ ] HANDOFF exists
```

### Job-search adds

```
- [ ] APPLICATIONS, CAREER, INTERVIEWS files exist
- [ ] Per-opportunity assets folder exists at the canonical path
```

### Business adds

```
- [ ] ICP doc exists
- [ ] Web-bridge stub exists if the domain has a deployed surface
```

### Bot-product adds

```
- [ ] PRODUCT_SPEC and OPS files exist
```

### Failure protocol

If any check fails:

1. Identify the missing artifact.
2. Write it or fix the broken reference.
3. Re-run that check.
4. Do not declare the scaffold complete until all checks pass.

If a check fails because the requirement does not apply (e.g. HANDOFF deliberately skipped for a one-shot lookup domain), document the deliberate skip in the report so the user sees it was intentional.

---

End of NEWBOT-PROTOCOL.md.
