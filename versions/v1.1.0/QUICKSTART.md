# QUICKSTART - Atlas Method v1.1.0

Get from clone to first wrap in under twenty minutes. Every step here is concrete - copy, run, edit, save. No theory. The methodology docs in `docs/` explain the why; this file is the do.

---

## Step 1 - Clone and pick a target directory

The repo holds the methodology. Your actual Atlas Method instance (CLAUDE.md, your domain files) lives somewhere else - typically `~/my-atlas` or any directory you open in Claude Code.

```sh
git clone https://github.com/DamianBuilds-ai/atlas-method.git
cd atlas-method
ls versions/
```

You should see `v1.0.0` and `v1.1.0`. Use the highest version. Everything in this guide assumes v1.1.0.

---

## Step 2 - Bootstrap your instance

The `atlas-init` script copies the soil (`CLAUDE.md`) and the four-document skeleton for one starter domain into a target directory.

```sh
mkdir -p ~/my-atlas
sh versions/v1.1.0/bin/atlas-init ~/my-atlas
```

You will see:

```
Scaffolding Atlas Method instance in: /Users/you/my-atlas
Soil:
  create /Users/you/my-atlas/CLAUDE.md
First domain (rename DOMAIN -> your first real domain):
  create /Users/you/my-atlas/DOMAIN.md
  create /Users/you/my-atlas/DOMAIN_QUEUE.md
  create /Users/you/my-atlas/DOMAIN_HANDOFF.md
  create /Users/you/my-atlas/DOMAIN_IDEAS.md
```

Five files. That is your starting system.

---

## Step 3 - Wire the slash commands

Atlas Method ships two starter commands: `/atlas` (audit your doc system) and `/newbot` (scaffold a new domain). Copy them into your Claude Code commands directory.

```sh
mkdir -p ~/.claude/commands
cp versions/v1.1.0/commands/atlas.md   ~/.claude/commands/
cp versions/v1.1.0/commands/newbot.md  ~/.claude/commands/
```

Open `~/my-atlas` in Claude Code (or your editor with Claude Code attached). Type `/` in the prompt - you should see `/atlas` and `/newbot` in the suggestion list.

---

## Step 4 - Pick your first domain

A domain is any coherent area of your life or work that accumulates its own state. Good first picks are single-purpose and low-stakes - somewhere you will not panic if you get the shape wrong on day one.

Strong candidates:

- **reading** - books in progress, articles backlog, notes
- **finances** - accounts, recurring expenses, tax notes
- **a side project** - one specific project, not your whole portfolio
- **a hobby that accumulates state** - a game, a craft, a study track

Avoid for your first domain: anything that spans multiple sub-areas (whole "work", whole "health"). Those split into multiple domains later. Start narrow.

For this walkthrough, we will use **reading** as the example.

---

## Step 5 - Rename the starter files

The bootstrap created generic `DOMAIN.*` files. Rename them to your chosen domain.

```sh
cd ~/my-atlas
mv DOMAIN.md         READING.md
mv DOMAIN_QUEUE.md   READING_QUEUE.md
mv DOMAIN_HANDOFF.md READING_HANDOFF.md
mv DOMAIN_IDEAS.md   READING_IDEAS.md
```

Open each file. Replace `{DOMAIN}` placeholders with `READING`. Fill in the first few real values - what this domain covers, what is active right now, the one next action.

Reference: `versions/v1.1.0/examples/example-domain/` shows a fully filled-in reading domain.

---

## Step 6 - Wire the domain into CLAUDE.md

CLAUDE.md is the soil. It loads first every session. It tells Claude which files to read for which domain, so a reading session reads `READING_QUEUE.md` and nothing else.

Open `~/my-atlas/CLAUDE.md`. Find the Domain Isolation table (early in the file). Replace the placeholder row with your real domain:

```markdown
| If working on... | READ these files ONLY | DO NOT read |
|------------------|----------------------|-------------|
| reading | READING_QUEUE.md, READING.md | Everything else |
```

Also replace `{YOUR_NAME}` in the title with your actual name. Delete any placeholder rows you have not used yet - the table grows as your system grows.

---

## Step 7 - First session - work on your domain

Open `~/my-atlas` in Claude Code. Start a fresh chat. Tell Claude what you want to do:

```
Working on reading today. I want to triage the article backlog and pick what to read this weekend.
```

Claude should now read only `READING_QUEUE.md` (and `READING.md` if needed) - not every file in the directory. That is domain isolation working.

Do the work. Edit your queue as you go. Add items under `## This Session`, check them off as you finish, jot completed items into `## Recently Completed`.

---

## Step 8 - First wrap

When you are done for the session, run the wrap protocol. Type:

```
wrap up
```

Claude follows the eight-step wrap procedure in `procedures/wrap.md`:

1. Update the QUEUE (Quick Resume, check off items, move finished work to Recently Completed)
2. Update the HANDOFF (what was done, what is in progress, what is blocked)
3. LOG rotation (if Recently Completed has grown past five items, move oldest to a LOG file)
4. Update NEXT_ACTIONS if you keep a global priority stack
5. Capture any content moments worth keeping
6. Git commit and push (if you version-control your instance)
7. Clean up any temp working files
8. Cross-domain memory write (only if the session produced findings other domains need)

Cookies: `wrap` = all eight. `checkpoint` = steps 1 plus 2 plus 6 (save state without full closeout). `sync` = step 6 only (just push).

---

## Step 9 - Add your second domain with /newbot

You now have one working domain. To add another, use `/newbot`. It interviews you for a domain name, picks an archetype (single-purpose, companion, learning-system, game, job-search, business, bot-product), and scaffolds the right starter files.

```
/newbot
```

Pick `single-purpose` for your second domain too - it is the cleanest archetype to learn on. The richer archetypes are for systems you already understand.

---

## What you have now

A working Atlas Method instance with:

- A CLAUDE.md soil file that loads behavioural rules every session
- One real domain with QUEUE, trunk, HANDOFF, and IDEAS files
- Two slash commands wired into Claude Code (`/atlas`, `/newbot`)
- A documented wrap protocol you ran once

That is the floor. From here you grow the system by adding domains, splitting trunks into leaves when they exceed roughly 500 lines, and running `/atlas` periodically to audit drift.

---

## Common first-week questions

**Q: How many domains should I have?**
Start with one. Add a second when you notice yourself wishing for one. Three to five domains is plenty for most systems. Twenty is too many; collapse related ones.

**Q: When do I split a trunk into leaves?**
When the trunk crosses roughly 500 lines, or when one section keeps getting referenced independently. See `procedures/leaf-creation.md`.

**Q: My QUEUE is getting long. What do I do?**
Aim for under 80 lines. Move completed items into a LOG file (create `DOMAIN_LOG.md` if it does not exist). Active reference content belongs in the trunk, not the queue.

**Q: How do I know if I am doing it right?**
Run `/atlas`. It audits your system against the size thresholds and surfaces drift neutrally. Run it weekly for the first month.

**Q: What if I want to undo and start over?**
Delete the files in `~/my-atlas`, re-run `sh versions/v1.1.0/bin/atlas-init ~/my-atlas`. Nothing in the public repo gets modified - your instance is fully separate.

---

## Next reading

- `docs/ATLAS_METHOD.md` - the full methodology specification
- `docs/AGENT-PATTERNS.md` - the nine-tier agent delegation system
- `docs/DOC-PROTOCOL.md` - how docs are structured, when to split, when to rotate
- `procedures/wrap.md` - the full wrap protocol with all eight steps explained
- `examples/example-domain/` - one fully filled-in reading domain to copy patterns from
