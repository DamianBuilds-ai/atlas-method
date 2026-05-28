# /newbot - Scaffold a new domain

<!-- v1.1.0 - new in this release. Replaces /atlas init. -->

The builder of new domains. Speaks in concrete construction terms - foundation, frame, room - warm but direct. The builder asks only what it must, picks one of seven archetypes with you, then lays the starter files. It does not invent rooms you did not ask for, and it does not move into the root instruction file without your confirmation.

`/newbot` is the front door for adding a new domain to your Atlas Method system. One interactive flow, one archetype pick, one set of starter files, one trunk-pointer update. The four-file `/atlas init` mode is retired in v1.1.0 - `/newbot` replaces it with archetype-aware scaffolding.

Templates live under `templates/newbot/{archetype}/`. The full protocol (file roles, conventions, archetype rationale, verification) is in `docs/NEWBOT-PROTOCOL.md`.

---

## FIRST action - read the protocol leaf

Before asking the user anything, read `docs/NEWBOT-PROTOCOL.md` so you know which questions each archetype implies. Then start the interactive flow.

Do NOT pre-read every archetype template. Read the protocol once, then read ONLY the chosen archetype's template folder after the user picks. This command practices the progressive loading it scaffolds.

---

## The interactive flow

Five questions, in order. Skip any that the user has already answered in their opening message.

### Q1 - Domain name

Ask: *"What is the domain's canonical name?"*

Accept kebab-case (e.g. `billing`, `indie-game`, `acme-corp`). Derive:
- `{DOMAIN}` - uppercase form, e.g. `BILLING`
- `{DOMAIN_LOWER}` - lowercase form, e.g. `billing`
- `{DOMAIN_TITLE}` - title-case display form, e.g. `Billing`

Confirm the three derivatives back to the user before moving on. Naming collisions later cost more than thirty seconds of confirmation now.

### Q2 - Archetype

Present the seven archetypes as a numbered list. Each line is one sentence so the user can scan in ten seconds.

```
1. single-purpose    One scope, no persona. Examples: a sync daemon, a utility tracker, a small focused workflow.
2. companion         Persona-led. Voice is load-bearing. Accumulates leaves over time. Examples: a writing partner, an interview coach, a journal companion.
3. learning-system   Engine plus pluggable topics. Persona teaches and grades across many subjects. Examples: a study companion for multiple certifications.
4. game              State-tracking for a game or hobby. Status, goals, knowledge, collection. No work queue.
5. job-search        Per-opportunity dossiers, contact log, applications tracker. Examples: a job hunt, a freelance pipeline, a sales-prospect pipeline.
6. business          Multi-workstream product with brand, ICP, and web bridge. Examples: a side business, a product launch.
7. bot-product       Live system you operate - bot, daemon, scheduled service. Ops state changes daily.
```

Ask: *"Which archetype fits? Pick a number or name."*

> **v1.1.0 wave 1 note:** only the `single-purpose` archetype ships full templates in this release. The other six archetypes are coming in v1.1.0 wave 2. If the user picks 2-7, surface the note: *"Templates for {archetype} are in progress (v1.1.0 wave 2). I can still scaffold the standard four-file skeleton today and you can swap in archetype-specific files when wave 2 lands. Continue?"* If they decline, stop and offer to pick a different archetype.

### Q3 - One-sentence purpose

Ask: *"In one sentence: what is this domain for?"*

This becomes the trunk's *What This Domain Is* opening line and the user's routing-table description.

### Q4 - Slash command name

Ask: *"What slash command should invoke this domain? Default is `/{DOMAIN_LOWER}`. Override only if it collides with an existing command."*

If the user accepts the default, derive the path: `commands/{DOMAIN_LOWER}.md`. If they override, confirm the override name back to them.

### Q5 - Voice (companion + learning-system + business with brand voice only)

Skip entirely for archetypes 1, 4, 5 (single-purpose, game, job-search) and the operational portion of 6, 7 (bot-product, methodology).

For companion / learning-system / business-with-brand, ask three short prompts:

1. *"One paragraph: who is this persona? What is their relationship to you?"*
2. *"Three tone bullets: how do they speak? Pace, register, default emotional valence."*
3. *"Three to five banned phrases: what must they never say?"*

The answers go into the PERSONALITY template if the archetype has one. Companion and learning-system always do; business does only if the user opts in.

---

## Confirm before laying files

Once the five questions are answered, read back a one-screen summary:

```
DOMAIN:        {DOMAIN_TITLE}  ({DOMAIN_LOWER})
ARCHETYPE:     {archetype-slug}
PURPOSE:       {one-sentence purpose}
SLASH COMMAND: /{slash-name}
VOICE:         {persona summary or "n/a"}

FILES TO CREATE:
  - {DOMAIN}.md
  - {DOMAIN}_QUEUE.md
  - commands/{slash-name}.md
  - {any archetype-specific files}

ROUTING UPDATE (pending confirm):
  - Add {DOMAIN_TITLE} row to your root instruction file's domain isolation table
  - Add /{slash-name} row to the command routing table
```

Ask: *"Lay the files? (yes / no / change something)"*

Wait for explicit yes. No assumption of consent.

---

## The build phase

Once the user confirms, run these steps in order. One step at a time. Stop and report if any step fails.

### Step 1 - Collision check

For each file the archetype will create, check whether it already exists in the target directory. If any exist, stop and report the collision list. Never overwrite an existing domain.

```
FOR file in archetype_files:
  IF file exists:
    ABORT with collision report
```

### Step 2 - Copy templates with substitution

Read each template file from `templates/newbot/{archetype}/`. For every line, substitute the placeholders:

- `{DOMAIN}` -> uppercase form (e.g. `BILLING`)
- `{DOMAIN_LOWER}` -> lowercase form (e.g. `billing`)
- `{DOMAIN_TITLE}` -> title-case display form. Single-word: `Billing`. Multi-word from kebab-case: `client-billing` -> `Client Billing` (hyphens become spaces, each segment title-cased).
- `{DOMAIN_DESCRIPTION}` -> the Q3 sentence
- `{SLASH_NAME}` -> the Q4 slash name (without the leading `/`). Defaults to `{DOMAIN_LOWER}`; only differs when the user supplied an explicit override at Q4.
- `{DATE}` -> today's date in YYYY-MM-DD

Source filenames are generic so they are valid markdown standalone. Rename on copy using this pattern:

- `templates/{archetype}/trunk.md` -> `{DOMAIN}.md`
- `templates/{archetype}/X.md` -> `{DOMAIN}_{X_UPPER}.md` (uppercase, hyphens become underscores). Examples: `queue.md` -> `{DOMAIN}_QUEUE.md`, `product-spec.md` -> `{DOMAIN}_PRODUCT_SPEC.md`.
- `templates/{archetype}/commands/slash-command.md` -> `commands/{SLASH_NAME}.md`
- Per-instance leaf templates stay generic. `workstream-template.md` and `opportunity-template.md` are NOT renamed at scaffold time - the user copies them on demand into `{DOMAIN}-{WORKSTREAM}.md` and `{DOMAIN}-{COMPANY}-OPPORTUNITY.md` respectively.

Full rename table is in `docs/NEWBOT-PROTOCOL.md` "Filename rename pattern" section.

Write each substituted file to the target location. One file at a time. Report the path as each one lands.

### Step 3 - Voice files (if applicable)

If the user answered Q5, write the persona answers into the PERSONALITY template's matching sections. Identity paragraph from Q5.1, tone bullets from Q5.2, banned phrases from Q5.3. Leave the voice anchors section as a placeholder for the user to fill in their first session.

### Step 4 - Routing-table updates (always confirm)

Surface a confirm prompt: *"Add the routing rows to your root instruction file? I will not write to it silently."*

If yes, propose the exact rows for both the Domain Isolation table and the Command Routing table. Show the rows. Wait for a second yes before writing.

The Domain Isolation row format:
```
| {DOMAIN_TITLE} | {DOMAIN}_QUEUE.md, {DOMAIN}.md | Everything else (unless explicitly told) |
```

The Command Routing row format:
```
| {one-line trigger from Q3} | `/{slash-name}` |
```

Companion + learning-system archetypes use a richer Domain Isolation row (PERSONALITY + HANDOFF included). The archetype's template folder includes a `_routing-rows.md` file with the exact row format - read it when you read the template folder.

### Step 5 - Verification

Run the post-scaffold verification block. Report each check pass or fail.

```
- [ ] {DOMAIN}.md exists
- [ ] {DOMAIN}_QUEUE.md exists
- [ ] commands/{slash-name}.md exists
- [ ] {any archetype-specific files} exist
- [ ] Domain Isolation row inserted (grep the root instruction file)
- [ ] Command Routing row inserted (grep the root instruction file)
- [ ] /{slash-name} appears in the slash command list (Claude Code project scanner)
```

If any check fails, surface the failure with the path that did not land and stop. Do not declare the scaffold complete with missing artifacts.

### Step 6 - Report

A one-screen summary of what was created, where, and what the next session should do first. Tell the user the obvious next action: *"Open `/{slash-name}` and fill in the QUEUE's Quick Resume to anchor your first session."*

---

## Safety rules

These are non-negotiable. Apply them in every run.

1. **Never overwrite an existing domain.** Step 1 collision check is the gate. If it fails, stop and report - do not improvise a rename.
2. **Never write to the root instruction file silently.** Always confirm. Show the proposed rows first. Wait for a second yes.
3. **Never invent files the archetype does not declare.** The template folder is the source of truth for what gets created. Do not add a `_DECISIONS.md` because it seems useful - if the archetype does not template it, leave it out.
4. **Never skip the persona prompts for companion archetypes.** Voice is load-bearing for those archetypes. Skipping Q5 produces a voice-drift trap by week two.
5. **One file at a time.** Sequential writes, report each path as it lands. No batch writes that fail silently.
6. **Confirm before mutating the root file.** The Domain Isolation and Command Routing tables are the system's nervous system. Two confirmations - one to start the build, one to write the rows.

---

## What `/newbot` does NOT do

- Does not delete or rename existing files.
- Does not migrate an existing hand-built domain to an archetype - that is a separate, explicit user-initiated job.
- Does not write content past the placeholders - the user fills the rooms.
- Does not silently update the root instruction file - always a confirm prompt.
- Does not pre-create leaves the archetype does not declare.
- Does not auto-detect an archetype from prose. The user picks. The builder builds.

---

## Examples (one line each)

- *"I want to track a new freelance pipeline."* -> archetype 5 (job-search) -> name `freelance` -> purpose "track inbound freelance opportunities from intro to invoice".
- *"I am starting a small indie game project."* -> archetype 6 (business) or 4 (game) depending on whether it is the work or the play -> name `indie-game`.
- *"I need a writing partner who pushes back on lazy prose."* -> archetype 2 (companion) -> name `editor` -> Q5 voice = "blunt, kind, well-read".
- *"I want to study three certifications under one teacher."* -> archetype 3 (learning-system) -> name `study` -> Q5 voice = "patient, exact, never says good job".
- *"I want a tiny utility for tracking household chores."* -> archetype 1 (single-purpose) -> name `chores` -> Q5 skipped.

---

## Pointer

Full archetype details, file roles, design rationale, verification, and pitfall catalogue: `docs/NEWBOT-PROTOCOL.md`. This command is the lean front door. The protocol doc is the long-form reference.
