# The Atlas Method

> **In this set:** **Methodology** · [Agent patterns](AGENT-PATTERNS.md) · [Doc protocol](DOC-PROTOCOL.md) · [Hooks](HOOKS.md) · [↩ Repo root](../../../README.md)

> A lean-by-design methodology for personal operating systems built on Claude Code.

**Version:** v1.0.0

## Contents

- [One-line summary](#one-line-summary)
- [Principle Zero - Progressive loading](#principle-zero---progressive-loading)
- [The problem this solves](#the-problem-this-solves)
- [Five pillars](#five-pillars)
- [Hard rules](#hard-rules)
- [`/atlas` UX](#atlas-ux)
- [Decisions locked](#decisions-locked)
- [Still open](#still-open)
- [Migration for existing users](#migration-for-existing-users)
- [What this costs](#what-this-costs)
- [Broadcast vs Fetch RAG - The Two-Pattern Frame](#broadcast-vs-fetch-rag---the-two-pattern-frame)
- [Model-pairing agent formations](#model-pairing-agent-formations)
- [Companion docs](#companion-docs)

---

## One-line summary

Keep every Claude Code session init under 400 lines of payload, forever, by typing domains and rotating their files on their natural rhythm - and by loading only what the current conversation actually needs.

---

## Principle Zero - Progressive loading

**Session start loads a small core. Everything else loads only when its topic appears in conversation.** This is the invariant that makes every other rule pay off. Without it, leaf splits and family files do nothing because everything still loads at session start anyway.

### What loads at session start

| File | Why |
|------|-----|
| `CLAUDE.md` (trunk only) | Core routing rules |
| Active domain's `{DOMAIN}.md` (trunk) | Routing table + domain context |
| Active domain's `{DOMAIN}_QUEUE.md` | Current active work |
| Active domain's `{DOMAIN}_HANDOFF.md` | Point-in-time state from last session |
| `{DOMAIN}-INDEX.md` if it exists | Compact leaf index (structural) |

That's the whole session-start payload. Under 400 lines per-domain by design.

### What does NOT load at session start

**Explicitly excluded:**

| File type | Why not loaded |
|-----------|----------------|
| `{DOMAIN}_LOG.md`, `{DOMAIN}_LOG_*.md` | Completed-work archive. Only read on explicit user request ("show me the log", "what did we do last week"). Never auto-loaded. `/atlas` does NOT read LOG contents during audit - line count only. |
| `archive/`, `_ARCHIVED/`, `*.bak` | Frozen snapshots. Never loaded. `/atlas` skips these directories entirely. |
| Other-domain files | One domain does NOT auto-load another domain's files. Cross-domain queries happen via explicit scout call, never via auto-include. |
| `{DOMAIN}_DECISIONS.md`, `SYSTEM_MAP.md`, reference leaves | On-demand only, never at session start. Loaded when topic matches per the routing table. |
| Role-split leaves (scope, rules, wrap-protocol, and similar) | On-demand. Loaded when the specific work calls for them. |

> [!NOTE]
> **Why this matters:** every file NOT in the "session start" table is a token you don't pay at init. If you see a file loading automatically and it's not in the session-start table, that's a bug to fix - most likely in a slash command that reads too much, or a hook that cats a file in.

### What loads during the session, on topic match

| File pattern | Trigger |
|--------------|---------|
| `{DOMAIN}-{TOPIC}.md` (content leaves) | User mentions the topic; routing table in trunk matches it |
| `CLAUDE_PROTOCOLS.md` | Session wrap, writing to QUEUE/HANDOFF |
| `CLAUDE_INFRASTRUCTURE.md` | Server, deploy, credentials work |
| `CLAUDE_BUILDING.md` | Creating a new domain or workflow |
| Other domains | Only via explicit cross-domain call |

### What loads only on explicit request

- `{DOMAIN}_LOG*.md` - never at start, only when user asks for history
- Archived files in `archive/`
- Any file the user hasn't referenced

### What the naming convention actually means

The hyphen-vs-underscore rule isn't cosmetic - it's **loading instructions**:

- **Underscore `_`** = structural, always loaded with the domain (`DEV_QUEUE.md`, `DEV_HANDOFF.md`)
- **Hyphen `-`** = content leaf, loaded on-demand only (`DEV-DATABASE.md`, `DEV-AUTH.md`)

Claude reads the naming and respects it. A well-named file set is a self-documenting load plan.

### Worked example

The operator runs `/dev`. Session start loads: `CLAUDE.md + DEV.md + DEV_QUEUE.md + DEV_HANDOFF.md` = ~350 lines.

They say "help me with auth token refresh." The routing table in `DEV.md` matches "auth" -> Claude loads `DEV-AUTH.md` now. If the conversation stays in auth, `DEV-DATABASE.md` never loads. If later they pivot to a schema question, `DEV-DATABASE.md` loads then, not before.

A different domain? Not loaded. A separate concern entirely, never touched unless explicitly cross-called.

---

## The problem this solves

Claude Code personal OS systems grow silently. After 3-6 months, session init payloads cross 20-30% of the context window before a message is typed. Users don't notice until the system feels slow, and they don't know what to rotate because the original template has no rotation guidance beyond "move to LOG when Recently Completed hits 5 items."

The Atlas Method adds:
1. Domain types so rotation rhythm matches the work
2. Trim triggers so QUEUE bloat has clear limits
3. Trunk-and-leaf so reference docs never balloon
4. A self-audit command (`/atlas`) so health is visible
5. A single-prompt migration so existing users can re-align

---

## Five pillars

### Pillar I - Domain types
Every domain declares a type. The type drives rotation rhythm, LOG naming, and expected sizes.

| Type | Rhythm | Rotation unit | Examples |
|------|--------|---------------|----------|
| `dev` | Project sprints, days to months | Per project | Codebases, client work, side projects |
| `ops` | Monthly or quarterly cycle | Per period | Tax, finances, health, invoicing |
| `journaling` | Daily or weekly, continuous | Per calendar month | Diary, reflection, psychology |
| `reference` | Low churn, updated rarely | Leaf split at 250 lines | Knowledge base, wiki, API docs |
| `ephemeral` | One-off cluster, terminal | Archive whole domain on close | Research sprint, single event |

Declaration: one line at the top of `{DOMAIN}.md`:
```markdown
> **Domain type:** dev
```

### Pillar II - Three trim triggers
Universal QUEUE rules, fire regardless of type:
1. `Recently Completed` has 5+ items -> rotate oldest to LOG now
2. Total QUEUE exceeds 80 lines -> mandatory audit (human decides what's dead)
3. HANDOFF has more than 3 session blocks -> prune oldest

> [!IMPORTANT]
> **No mandatory staleness rule.** Calendar-based "this is stale" auto-tagging causes more false positives than it catches real bloat, and it grades tasks on pace - which violates neutral reporting. Legitimacy is a human call, not a timer. The 80-line cap is the actual backstop: when it fires, you audit everything, and stale items get surfaced as a neutral prompt ("3 items haven't moved in 30+ days - want to review?"). You decide. Never auto-marked.

### Pillar III - Rotation by rhythm
- **dev:** `{DOMAIN}_LOG_{project-slug}.md`, one per project. Archive to `archive/` on project close (all tasks done OR 30 days inactive).
- **ops:** `{DOMAIN}_LOG_YYYY-QN.md` or `YYYY-MM.md`. New file at period boundary. Completed recurring tasks reset to unchecked for next period.
- **journaling:** `{DOMAIN}_LOG_YYYY-MM.md`. QUEUE stays under 20 lines always. HANDOFF overwrites (not appends).
- **reference:** Leaves instead of LOG rotation.
- **ephemeral:** Archive the entire domain folder on completion.

### Pillar IV - Trunk-and-leaf
The reference doc is a trunk. Dense topic clusters become leaves. The trunk has a **context routing table** near the top.

Trunk template section:
```markdown
## Context routing

| When the user asks about...    | Load this leaf         |
|--------------------------------|-------------------------|
| Database schema, migrations    | DEV-DATABASE.md        |
| Auth flow, token handling      | DEV-AUTH.md            |
| Deployment, CI/CD, infra       | DEV-INFRA.md           |
| Everything else                | (stay in trunk)        |

<!-- Extract a leaf when: a section exceeds ~80 lines OR trunk exceeds 250 lines. -->
```

Leaf naming: `{DOMAIN}-{TOPIC}.md` for content leaves on-demand (hyphen). Use underscore `{DOMAIN}_{COMPONENT}.md` only for structural files always-loaded with the domain (QUEUE, HANDOFF, LOG). See DOC-PROTOCOL.md Step 4 for the full naming taxonomy including cross-domain leaves and sub-tracks.
Leaf split trigger: **~250 lines** in the trunk OR a coherent section over ~80 lines.

### Pillar V - `/atlas` self-audit
A slash command users run monthly (or when sessions feel heavy). Scans files, estimates init cost, flags violations, suggests leaves, and issues a verdict.

See `commands/atlas.md` for implementation. Pure main-session (no agent delegation in v1).

---

## Hard rules

The flat 80-line QUEUE cap is builder-hostile. Architects, developers, and anyone shipping concurrent workstreams legitimately need more active tracking. The method replaces the flat QUEUE cap with a **QUEUE-as-trunk** pattern: the active QUEUE stays small (pointer list + current work), and overflow extracts into on-demand QUEUE leaves.

### Per-doc caps (ENFORCED)

| File | Cap | Action when breached |
|------|-----|----------------------|
| `CLAUDE.md` | 250 lines | Split into `CLAUDE_*` family (PROTOCOLS/INFRASTRUCTURE/BUILDING), loaded on-demand |
| `{DOMAIN}.md` trunk | 3-stage ladder: warn 250 / prune 280 / split 300 | Prune first; extract leaf only if pruning can't get under 280 |
| `{DOMAIN}_QUEUE.md` trunk | **200 lines** - active work + pointer table to QUEUE leaves | Extract a QUEUE leaf (see below) |
| `{DOMAIN}_QUEUE-BACKLOG.md`, `-ONHOLD.md`, `-{PROJECT}.md` leaves | Up to 300 lines each, loaded on-demand | Prune or split further if bigger |
| `{DOMAIN}_HANDOFF.md` | 200 lines (3 session blocks) | Prune oldest blocks |
| `{DOMAIN}-{TOPIC}.md` content leaf | 200 lines | Prune first, then split |

### QUEUE-as-trunk pattern

The active QUEUE is a control surface, not a dump. Structure:

```text
{DOMAIN}_QUEUE.md (200 lines max)
├── Quick Resume (5-10 lines - what's the next action)
├── Active work (this-session tasks, ~100 lines)
├── QUEUE leaves pointer table
│     | Leaf | What lives there | Load when... |
│     |------|------------------|--------------|
│     | {DOMAIN}_QUEUE-BACKLOG.md  | P1 backlog | Planning work |
│     | {DOMAIN}_QUEUE-ONHOLD.md   | Parked items | Reviewing parked work |
│     | {DOMAIN}_QUEUE-P0.md       | P0 initiatives | Deep work |
│     | {DOMAIN}_QUEUE-{PROJECT}.md | Project-scoped | On that project |
└── Recently Completed (last 5, rotates to LOG at 5+)
```

### When to extract a QUEUE leaf

Triggers:
1. Active QUEUE trunk exceeds 200 lines with a coherent nameable section (e.g. "P1 backlog")
2. Any single project has 30+ lines in the trunk - extract to `{DOMAIN}_QUEUE-{project-slug}.md`
3. Parked items accumulate beyond ~50 lines - extract to `-ONHOLD.md`

Leaves follow Principle Zero: they only load when the user is actually working on that bucket. Active QUEUE loads every session; backlog only loads when user says "what's on the backlog?"

### Naming: underscore-then-hyphen

`{DOMAIN}_QUEUE-{QUALIFIER}.md` is the canonical pattern:
- `{DOMAIN}_` (underscore) - structural prefix, signals "this is part of the domain's structural file set"
- `-{QUALIFIER}` (hyphen) - content qualifier, signals "load on demand"

### Companion modifier

Companion-type domains (a personal companion persona, a daily-ops driver, a reflection partner) load 3 structural files at startup (STATUS, HANDOFF, PERSONALITY). Budget: **600 lines combined** across all session-start files. STATUS can run up to 250, PERSONALITY up to 200, HANDOFF up to 150. This accommodates the multi-file startup without forcing truncation of legitimate content.

### Auto-rotation - two paths

Log rotation discipline has two paths based on whether the user has agent budget:

**Path 1 - Power users (agents available):** Agent auto-rotates DONE items from QUEUE to LOG. A reader agent identifies DONE sections, a builder agent moves them. No double-handling. Triggered at session wrap or when QUEUE trunk exceeds 200.

**Path 2 - Methodology users (model-cost-sensitive):** Domain's session-open nudge says "your QUEUE is past 200 - run `/atlas` to rotate." `/atlas fix` handles it interactively. Cost lives in one deliberate session per month, not every session.

### Mandatory LOG rotation triggers

1. `Recently Completed` in QUEUE hits 5+ items -> rotate oldest to LOG
2. QUEUE trunk exceeds 200 lines -> extract leaf OR archive DONE items to LOG
3. Any DONE/RESOLVED section sitting in QUEUE for a full session -> LOG it

### Session-start payload at ceiling

- CLAUDE.md (250) + trunk (300) + QUEUE trunk (200) + HANDOFF (200) = **~950 lines** at worst case
- Typical healthy: ~500 lines
- Scales to any workload via QUEUE leaves

### Other mandatory rules

- **Type declared on every domain.** No untyped domains.
- **Semantic naming:** underscore structural (always-loaded), hyphen content-leaf (on-demand)
- **Principle Zero (progressive loading)** governs loading order - see the section at the top

---

## `/atlas` UX

**Primary command: `/atlas`** (no arguments needed).

- `/atlas` runs the audit. At the end, shows a 2-line pro-tip, then asks interactively: *"Found N violations. Walk through fixes? (yes / no / just top 3)"*
- `/atlas fix` - power-user shortcut. Skips the audit-then-confirm step and goes straight into interactive fixing.
- `/atlas fix top-3` - power-user shortcut. Targets the 3 biggest savings only.

### The pro-tip pattern (always visible)

Every audit output ends with TWO lines before the interactive prompt:

```text
[audit report body]

Tip: next time, `/atlas fix` skips straight to interactive fixing.
     `/atlas fix top-3` hits just the 3 biggest savings.

Found 8 violations. Walk through fixes? (yes / no / just top 3)
```

Newbies see the tip but don't need to act - they just answer the prompt. Intermediate users notice the tip after 2-3 runs and start typing `/atlas fix` naturally. Power users ignore it and shortcut from day one. No stateful tracking - one quiet always-visible line that teaches by repetition.

README teaches: **"Just type `/atlas`. It'll ask what to do next - and it'll show you shortcuts as you learn."**

## Decisions locked

1. **Agents: deferred in v1.** Out of scope for the base methodology. Revisit once your own agent patterns have matured, or when the methodology becomes a productized offering.
2. **`/atlas` modes.** Two-mode command: `/atlas` or `/atlas audit` = read-only report; `/atlas fix` = interactive (proposes, asks, writes one change at a time).
3. **No hard staleness rule.** Dropped. Calendar-based auto-tagging causes false positives and grades pace. Replaced with a neutral audit prompt surfaced only when the 80-line cap fires or `/atlas` runs: "N items haven't moved in 30+ days - want to review?" Human decides.
4. **Cross-domain session protocol.** Session owner = the domain whose DATA is being touched, not the domain whose command was used. Example: a daily-ops session where you apply to jobs -> the job-application entries go to the Finance domain's LOG (it owns the data). Daily-tasks / long-term-goals -> the daily-ops domain's LOG. The other domain gets a one-line cross-reference pointer, not a full duplicate entry.
5. **CLAUDE.md family.** CLAUDE.md stays under 250 lines. When it grows past, content splits into `CLAUDE_PROTOCOLS.md`, `CLAUDE_INFRASTRUCTURE.md`, `CLAUDE_BUILDING.md` - loaded on-demand, not at session start. Trunk-and-leaf applied to CLAUDE.md itself.
6. **Domain self-prompt on session open (soft nudge, not a size check).** Domain sessions stay **silent by default**. When the domain is genuinely past its limits (multiple rules breached, not just approaching), one line appears pointing the user at `/atlas`. No specific numbers, no task lists, no grading. Example: *"Your Finance files are past their limits - worth running `/atlas` when you have a moment."* Stress-free by design. The detailed report lives inside `/atlas`, not at every session open.
   - Trigger: breach 2+ of (QUEUE >80 lines, HANDOFF >3 blocks, trunk >300 lines, per-domain init >400 lines)
   - Frequency: once per session, max. Never repeats mid-session.
   - Phrasing: points at the tool, never at the user.

## Still open

1. **Domain type changes over time.** A dev project that ships and becomes reference material needs a documented re-type procedure. Not blocking v1.

---

## Migration for existing users

Two paths:

**Path A - Paste-and-run prompt.** User pastes a short prompt + the repo link into their Claude. Claude reads the repo's current state of the Atlas Method, audits the user's system, and proposes a migration plan. Designed to be re-run every few months so users stay aligned as the methodology evolves.

**Path B - Step-by-step (manual steps).** For users who want full control. Listed in the README.

Path A is the primary path. Path B is fallback.

---

## What this costs

| Cost | Impact | Mitigation |
|------|--------|-----------|
| More files per domain | 4-project dev domain has 4 archived logs | Main LOG acts as index |
| Wrap-up decisions | "Project closed? Leaf-extract?" at session end | Small decision beats migration every 3 months |
| Type mislabeling | Wrong type, wrong rotation rules | Three universal trim triggers work regardless |
| Leaf discipline | Must notice trunk growth and extract | `/atlas` suggests automatically |

---

## Broadcast vs Fetch RAG - The Two-Pattern Frame

The method runs two distinct RAG (Retrieval-Augmented Generation) patterns. Both are legitimate RAG - the distinction is when retrieval happens and who drives it.

### Broadcast RAG (companion-class)

Used by: companion-class domains (a personal companion, a reflection partner, a health advisor).

Static pre-retrieval via SessionStart hooks and small per-chat leaves. The hook fires before the session opens and injects a fixed set of stable context (QUEUE Quick Resume, last 3 LOG entries, current PROGRESS, open shared findings). This is analogous to Contextual Retrieval with prompt caching: the payload is computed once, cached, and reused across turns. Works well when context is small, stable, and always relevant.

Pattern: SessionStart hook fires -> injects 2-4 small leaves -> model session opens with context already warm.

### Fetch RAG (heavy-class)

Used by: heavy-class domains (architecture, finance, daily-ops, bot frameworks).

Dynamic tool-augmented retrieval via Scout fleet. Stage 1 Scouts fire AFTER the session opens and AFTER the operator declares direction. The main session issues targeted sub-queries; Scouts fetch only the slices relevant to the declared topic. This is analogous to Agentic RAG. Works well when context is large, conditional, or topic-dependent.

Pattern: Session opens with minimal core -> operator declares direction -> Stage 2 Scouts fetch relevant leaves -> domain content loads on-demand.

### Core clash risk

Token duplication if the SessionStart dispatcher AND a Scout both load the same file in the same session. The file gets injected twice - once at hook time, once via Scout. Mitigation: Scouts skip files already injected by the dispatcher hook (check the injected manifest before fetching).

### Hybrid opportunity

Not all domains are pure Broadcast or pure Fetch. The right split:
- Small, stable context (personality, Quick Resume, open blockers) - Broadcast it via hook
- Large, conditional context (domain leaves, external API state, LOG history) - Fetch it via Scout on demand

A heavy-class domain could Broadcast a 30-line Quick Resume stub while still running Stage 2 Scouts for reference leaves and system map slices.

### Stage 1 dispatch modes - orientation vs question-aware

Stage 1 has TWO modes. Both fire scouts before any forward motion. The unconditional-fire rule remains intact. The mode determines what the scouts target.

**Orientation mode (default):** Triggered when the opening user prompt is generic ("hey", "let's work", a bare slash command with no args). Scouts target QUEUE + HANDOFF + state. Combined return ~80 lines: Quick Resume + top 3 active items + last-session state + open blockers. The session opens with a grounded "here is where you left off" summary.

**Question-aware mode:** Triggered when the opening prompt names a specific task, file, decision, or topic. Scouts pivot: Scout A returns a 5-line QUEUE Quick Resume stub (NOT full orientation). Scout B targets the specific file or topic area named (the relevant section, the named leaf, the config area). Scout C remains the state row. The opener skips orientation and goes directly to the task. The domain may ask ONE clarifying question before dispatching IF scope is genuinely ambiguous. If scope is clear, skip the question and fire scouts.

**What "specific" means in practice:** the prompt names a file, a function/component, a feature ("the email abstraction layer"), or a domain leaf. Generic verbs alone ("plan", "review") without an object stay in orientation mode.

**Multi-pass Scout discipline:** most Scouts are 1-pass-and-done. The "two-pass-then-bail" rule is a budget cap, not a "do many passes" pattern. If a Scout's first attempt is incomplete (e.g. file not found at exact path), it may attempt one broader pattern (e.g. grep across directory) before declaring NOT FOUND. Three or more passes signals an Analyst-shaped task - escalate, do not continue scouting.

**Scratchpad-driven coordination:** when 5+ research agents dispatch in parallel, main session creates a research-findings scratchpad with section anchors (`<!-- SECTION: section-N -->`). Each agent writes to its assigned section. Main session reads the scratchpad, not many individual chat returns.

---

## Model-pairing agent formations

Two formations for picking which model plays which role when output quality matters.

### Pattern A - Reason/Voice split

Pair a high-reasoning orchestrator model (plans, reasons, decides structure) with a writer model (produces the final voice-critical output). The orchestrator carries the structural reasoning; the writer lands the prose in a warmer default register, faster and cheaper.

> [!IMPORTANT]
> **Important nuance:** this is NOT a capability cap on the writer model. The orchestrator model actually holds the HIGHER creative ceiling - the split is about default register, cost, and speed, not "the writer model writes better." For peak prose, run orchestrator-steered (the orchestrator writes the final pass) or "orchestrator drafts -> writer revises." Reach for the plain Reason/Voice split when the writer's default warmth is good enough and you want the cost/speed win.

### Pattern B - Ideation formation (orchestrator plans -> dispatches analysts -> best output)

For creative / ideation / "give me the best possible output" tasks: the orchestrator decomposes the task and drafts a structure, dispatches Analyst agents to gather or generate the strongest raw material in parallel, then synthesizes. Optional final voice pass.

Use when the goal is the strongest possible output, not the fastest answer. Differs from Pattern A in that the orchestrator is not just steering one writer - it is fanning out parallel idea-generation, then picking and merging the best.

---

## Companion docs

- `DOC-PROTOCOL.md` - leaf management protocol (prune, split, naming taxonomy)
- `HOOKS.md` - Claude Code hooks reference and the unified session-start dispatcher design
- `commands/atlas.md` - the `/atlas` self-audit command implementation
