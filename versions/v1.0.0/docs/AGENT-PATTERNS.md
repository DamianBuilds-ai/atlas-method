# AGENT-PATTERNS.md

> **In this set:** [Methodology](ATLAS_METHOD.md) · **Agent patterns** · [Doc protocol](DOC-PROTOCOL.md) · [Hooks](HOOKS.md) · [↩ Repo root](../../../README.md)

**Purpose:** Canonical reference for the Atlas Method's 7-tier agent delegation system. Every domain command that spawns an agent follows this spec. Your root instruction file (e.g. `CLAUDE.md`) points here. Agent prompts are copy-pasteable from this file.

**Schema version:** 1

## Contents

- [The 7 tiers](#the-7-tiers)
- [Shared rules for all tiers](#shared-rules-for-all-tiers)
- [The six discipline rules](#the-six-discipline-rules)
- [Critical prohibitions (every tier)](#critical-prohibitions-every-tier)
- [Universal output envelope](#universal-output-envelope)
- [BLUF Output Structure](#bluf-output-structure-mandatory-for-analyst-engineer-researcher-architect-outputs)
- [Tier - Scout](#tier---scout)
- [Tier - Analyst](#tier---analyst)
- [Tier - Builder](#tier---builder)
- [Tier - Scribe](#tier---scribe)
- [Tier - Engineer](#tier---engineer)
- [Tier - Researcher](#tier---researcher)
- [Tier - Architect](#tier---architect)
- [Specialist Tier Roles](#specialist-tier-roles)
- [When NOT to delegate at all](#when-not-to-delegate-at-all)
- [Agents spawning agents](#agents-spawning-agents)
- [Warm startup pattern](#warm-startup-pattern)
- [Throughout pattern](#throughout-pattern)
- [Inline vs File Reference - When to Use Which](#inline-vs-file-reference---when-to-use-which)
- [Pre-Deploy Speculative Pattern](#pre-deploy-speculative-pattern)
- [File output convention](#file-output-convention)
- [Reading check for main session (once per 10 turns)](#reading-check-for-main-session-once-per-10-turns)
- [Hook-injected prelude system (Pattern D)](#hook-injected-prelude-system-pattern-d)
- [Agent prompt patterns (A, B, C)](#agent-prompt-patterns-a-b-c)
- [Cross-machine file transfer](#cross-machine-file-transfer)

---

## The 7 tiers

Tier numbers exist ONLY in this canonical table. All prose (command bodies, slash command files, agent prompts, doc text) references tiers BY NAME. This is the names-not-numbers permanent policy. When a future tier is inserted, zero migration is required - nothing downstream depends on a position number.

| Position | Tier | Model | Role cluster | Output contract |
|----------|------|-------|--------------|-----------------|
| 1 | Scout | Haiku | Retrieval, quick factual research, state lookups | Verbatim excerpts or structured facts with citations |
| 2 | Analyst | Sonnet | Research, pattern finding, multi-source comparisons | Structured findings with evidence, confidence, caveats |
| 3 | Builder | Sonnet | Mechanical execution with verification | Changes, test output, pass/fail, rollback |
| 4 | Scribe | Sonnet | Compose polished prose to a brief - leaf docs, decision-record drafts, summaries, procedure files, structured writeups | Prose artifact + decision log (voice/structure choices) + voice-fit notes |
| 5 | Engineer | Sonnet | Execution with local judgment calls | Builder contract plus Decisions Made log |
| 6 | Researcher | Sonnet | Multi-source synthesis, cross-doc coherence, deep external research with best-of-N picks | Synthesis artifact + source map + confidence per finding |
| 7 | Architect | Sonnet | Design, deep research, decision-record-level work | Artifact plus decision log (options considered and rejected) |

**Set MODEL only, not effort.** Agent files carry a `model:` field. Effort is the model's default. Per-agent effort overrides are unenforced at dispatch and their effect is untested - do not rely on them.

**Reserve your most expensive model for the highest-leverage roles.** In testing, the strongest model showed no detectable edge over the mid-tier model for Engineer / Researcher / Architect at typical document-system scales (saturation, not "the expensive model is worse"). Default those tiers to the mid-tier model and reach for the top model only via a per-dispatch override when scale genuinely demands it.

**Source of truth (binding):** the runtime tier-to-model resolver is the agent-definition file's frontmatter `model:` field. This doc is the human spec and rationale. If the two ever disagree, the agent-file frontmatter wins - reconcile this doc to it.

**Dispatch description convention:** prefix every dispatch description with the tier name (e.g. "Builder - <task>", "Scout - <task>") so the agent role is visible in the dispatch UI, which displays the description plus model.

The cheapest model is never the main chat model. It only runs as a Scout agent.

> [!NOTE]
> **Roadmap:** Two additional tiers - **Explorer** (wide-grep discovery across unknown territory) and **Setter** (exact deterministic apply, cheap apply tier) - are in evaluation as of v1.0.0 and may land in a future public version. See CHANGELOG for the two-track version mapping.

---

## Shared rules for all tiers

Every agent output is markdown, not JSON. Every agent output lives in `agent-outputs/YYYY-MM-DD-{tier}-{purpose}.md` under your working directory. Every agent processes files sequentially, no batch reads. Every agent quotes exactly, does not paraphrase source material. Every agent includes domain isolation rules in its prompt if cross-domain work is involved (agents do not inherit your root instruction file). Every agent includes `schemaVersion: 1` in its output frontmatter.

---

## The six discipline rules

These apply to EVERY agent call regardless of tier. The main session applies rule 4 before firing. Agent prompts enforce 1, 2, 3, 5, 6.

### Rule 01 - Exact path
Specify the exact file path or narrowest possible directory. Never "search the docs" or "look across the system."

### Rule 02 - Exact pattern
Specify the exact heading, line range, or grep pattern. Instruct the agent: "Try only this pattern, then stop and report." Never "try X or anything similar."

### Rule 03 - Dual tool budget
Every prompt includes HARD_MAX (safety rail, stops execution) and SOFT_BUDGET (prompted threshold, agent self-modulates). The remaining count is injected at tool-use boundaries so agents know where they are.

### Rule 04 - Pre-fire checklist (main session)
Before firing ANY agent: do I know the exact file? Is scope under 5 files? Is the answer under 50 lines? If yes to any, just read directly. Agent overhead is not worth it for trivial lookups.

### Rule 05 - Schema versioning
Every agent output includes `schemaVersion: 1`. The main session validates on receipt. On validation failure, ONE repair attempt is allowed ("your output did not validate, here is what is missing, retry with exact schema"). Then escalate.

### Rule 06 - Scope-exceeded signal
Agents return a structured `scope-exceeded` signal when they hit something outside their tier, instead of drifting. Format: `status: scope-exceeded` with a `recovery_hint` pointing at the correct tier. The main session escalates or clarifies.

---

## Critical prohibitions (every tier)

These are hard prohibitions that apply to EVERY agent regardless of tier. Violation results in silent infrastructure damage. They exist because an agent will, in good faith, do something destructive in service of the brief unless told not to.

### Prohibition 01 - Never mutate admin or service credentials

NEVER mutate an admin user password or any service authentication credential.
- Do NOT call an account-update API to change passwords.
- Do NOT shell into a service container to change passwords.
- Do NOT run a framework `changepassword` command from agent code.
- Do NOT set passwords via a database shell or a direct UPDATE on a credentials table.

If a task requires privileged operations and the required credential is unavailable, signal `scope-exceeded` with `recovery_hint: "privileged operation - escalate to main session, awaits service-account credential"` and stop.

> [!WARNING]
> **Why this exists:** the canonical failure is an agent that sets an admin password to a temporary value to obtain a token, then attempts to "restore" the original hash byte-for-byte. The restore does not produce a working hash, the operator is locked out, and token-dependent automation breaks silently. The brief asked for fresh credentials, the agent complied, the restore step did not validate. Stopping early is correct - the operator recovers in seconds. Improvising destructively costs hours.

This rule is best enforced at the spawn-prompt layer via a keyword-triggered prelude addon (see "Hook-injected prelude system" below). When an agent prompt mentions a credential-bearing service, the prohibition block is injected at the top of the prelude so agents see it before any examples.

---

## Universal output envelope

Every agent output starts with:

```yaml
---
schemaVersion: 1
tier: scout | analyst | builder | scribe | engineer | researcher | architect
status: complete | partial | failed | scope-exceeded
tool_budget_used: N
recovery_hint: (required if status != complete)
---
```

Followed by the tier-specific body sections.

### Two-Tier Output Contract

Every agent return is split between an envelope (chat-visible) and a body (file-resident).

**Envelope (returned to main session):**
- Hard cap: 20 lines, ~300-400 tokens
- Contents: schemaVersion frontmatter + status + one-paragraph TL;DR + path to full body file + tier + tool_budget_used
- Goal: the main session can decide based on the envelope alone whether to load the body

**Body (written to file):**
- No cap
- Path: `agent-outputs/YYYY-MM-DD-{tier}-{purpose}.md`
- Format: full BLUF structure (see below)

The main session reads the body file ONLY when the body's content is needed for synthesis or follow-up.

---

## BLUF Output Structure (mandatory for Analyst, Engineer, Researcher, Architect outputs)

Bottom Line Up Front. Three zones in every Analyst-and-above markdown body.

### Zone 1 - SCAN (always at the top)
- TL;DR table or 5-line summary with the recommendation/finding visible
- The operator or main session can decide to act based on this zone alone
- Maximum 15 lines

### Zone 2 - READ
- One H2 per finding/section
- Tables before prose (tables are scannable, prose is sequential)
- Cite file:line for any claim sourced from a file

### Zone 3 - REFERENCE
- Sources (URLs, file paths)
- Raw excerpts if needed for verification
- Methodology notes
- This zone is "load only if interrogating a finding"

No preamble. No "I'll start by..." paragraphs. The first 10 lines must contain the answer.

Why mandatory: operators skim-read research outputs, the main session synthesises from the SCAN zone, and bodies stay in files. BLUF reduces context-burn AND speeds review.

Scout outputs are exempt - their compactness is enforced by the 80-line cap.

---

## Tier - Scout

**Model:** Haiku (cheapest)
**Cost profile:** Cheapest. Use aggressively.
**Session length:** Short-lived. No drift guard needed.

### Cluster
Verbatim retrieval. Quick factual research. File existence checks. State lookups. Small data fetches.

### Use for
- "Read {DOMAIN}_QUEUE.md, return the current open-item count plus the last 3 entries."
- "Scan {INDEX}.md line 40-90, return rows matching a given tag."
- "Read {file}.md line 108, return the named section verbatim."
- "Does file X exist? Return yes or no and the line count."

### Do not use for
Pattern analysis. Comparisons. Recommendations. Judgment calls.

### Output body
```markdown
## Verbatim Excerpts
{path}:{line_start}-{line_end}
{exact text block}

## Search Trail (if NOT FOUND)
- Searched: {paths}
- Patterns: {patterns}
```

### Prompt template
```text
You are a Scout.

EXACT FILE: {path}
EXACT QUERY: {pattern or heading}
HARD_MAX: {N} tool calls
SOFT_BUDGET: {M} tool calls

Return verbatim excerpts with line numbers. Do not paraphrase. Do not summarize. Do not infer. If NOT FOUND, stop and report what you searched. If scope exceeded, return scope-exceeded signal with recovery_hint.

Output markdown to: {output_path}
Include frontmatter with schemaVersion: 1, tier: scout, status, tool_budget_used.
```

---

## Tier - Analyst

**Model:** Sonnet
**Cost profile:** Moderate. Primary research tier.
**Session length:** Medium. No drift guard needed.

### Cluster
Research. Pattern finding. Multi-source comparisons. Light audits. Technology evaluations. Gap analysis.

### Scope range
- **Light:** 1-3 files, clear target, bounded question. Single pattern. Fast return.
- **Deep:** 5-15 files, multi-source survey, pattern plus trade-off reasoning. Structured finding.

### Use for
- "Scan 3 config files, return a table of which model each uses." (light)
- "Compare 4 commands: find delegation hot spots." (deep)
- "Survey all components for a given fit, classify STRONG/WEAK/NONE." (deep)

### Do not use for
Making decisions. Proposing commands. Writing decision records. Anything requiring final judgment.

### Output body
```markdown
## Findings
{main result}

## Evidence
{citations}

## Confidence
HIGH | MEDIUM | LOW per finding

## Caveats
{UNCLEAR items, limitations, assumptions}
```

### Prompt template
```text
You are an Analyst.

EXACT FILES: {paths}
EXACT GOAL: {pattern to find}
HARD_MAX: {N}
SOFT_BUDGET: {M}

Sequential reads, no batching. Return Findings, Evidence, Confidence, Caveats. UNCLEAR is valid. Do not prescribe solutions. Do not make architectural recommendations.

Output markdown to: {output_path}
Include frontmatter with schemaVersion: 1, tier: analyst, status, tool_budget_used.
```

---

## Tier - Builder

**Model:** Sonnet
**Cost profile:** Moderate.
**Session length:** Medium. Drift guard on multi-step Builder work.

### Cluster
Mechanical edits with verification. Precise-spec refactors. Test runs. Small code changes. File restructuring with known shape.

### Simple vs judgment-touched
- **Simple:** unambiguous spec. "Replace X with Y in file Z. Run test. Report."
- **Judgment-touched:** clear outcome, a few judgment calls. "Refactor this step to use a Scout instead of a direct read, preserve the opener format."

### Use for
- "Replace paragraph X with paragraph Y in {file}. Verify no other matches." (simple)
- "Add a new row to {INDEX}.md under a given section. Match existing row format." (simple)
- "Apply a reference one-liner to all commands of a given class. Remove duplicated content." (judgment-touched)
- "Refactor a command's Step 1 to use a Scout instead of N direct reads." (judgment-touched)

### Do not use for
Changes requiring judgment about WHAT the change should be. Design decisions. Anything ambiguous.

### Output body
```markdown
## Changes Made
{diff summary with file:line}

## Test Output
{verification result}

## Pass/Fail
PASS | FAIL

## Rollback Command
{exact command to undo}

## Caveats
{anything flagged during execution}
```

### Prompt template
```text
You are a Builder.

EXACT FILE: {path}
EXACT CHANGE: {spec}
EXACT TEST: {verification command}
HARD_MAX: {N}
SOFT_BUDGET: {M}
{Multi-step Builder work: drift guard every 4 tool calls, re-inject scope constraints}

If your change affects a shared data flow, update the relevant data-contract doc in the same Builder dispatch.

Execute, verify, report. Self-eval before returning: did I address the exact goal, stay in scope, produce schema-valid output? Return status + recovery_hint on failure.

Output markdown to: {output_path}
Include frontmatter with schemaVersion: 1, tier: builder, status, tool_budget_used.
```

---

## Tier - Scribe

**Model:** Sonnet (voice ceiling - the cheapest model caps below voice-critical quality, so voice-critical prose never routes to it)
**Cost profile:** Moderate. Voice-stable prose composition.
**Session length:** Medium. No drift guard needed.
**HARD_MAX:** 12
**SOFT_BUDGET:** 8

### Cluster
Compose polished prose artifacts from a brief. Leaf doc drafts. Decision-record drafts. Brand summaries. Procedure files. Structured writeups. Voice-stable writing.

### Use for
- "Draft `procedures/leaf-creation.md` from this 4-bullet brief - include trigger phrases, examples, anti-patterns."
- "Write a cross-domain leaf from the naming-protocol spec, include all verification markers."
- "Compose a ratification decision-record from the master spec - section per decision, options-considered table per choice."
- "Draft the public-repo README, with the chosen license framing."

### Do not use for
Retrieval (Scout). Synthesis across many sources (Researcher). File execution / saving changes (Builder). Design decisions (Architect). Mechanical refactors (Builder).

### Distinction from neighboring tiers
**Scribe vs Builder:** Scribe composes (returns prose for the main session to ship). Builder executes (writes files, runs verification). If work is "produce text," Scribe. If "produce text AND save AND verify save," Scribe writes and Builder saves. If "edit text in an existing file with mechanical precision," Builder.

**Scribe vs Engineer:** Scribe writes prose to a brief. Engineer makes judgment calls during execution. Scribe does not interpret outcomes or pick between approaches - the main session decides, Scribe drafts.

**Scribe vs Architect:** Scribe composes from a brief that already exists. Architect creates the brief by designing. If the artifact requires figuring out the structure first, Architect drafts the structure and Scribe fleshes out the prose.

### Output body
```markdown
## Artifact
{the prose}

## Decision Log
{voice/structure choices, one line per choice}

## Voice-Fit Notes
{reference docs that informed phrasing - voice guides, brand guides, prior leaf examples}

## Caveats
{ambiguities in the brief, gaps to fill in the main session}
```

### Prompt template
```text
You are a Scribe.

DELIVER: {artifact description}
BRIEF: {inline or file path to the spec}
VOICE REFERENCES: {paths to voice docs, prior examples, brand guides}
CONSTRAINTS: {length, sections, tone}
HARD_MAX: 12
SOFT_BUDGET: 8

Compose prose to the brief. Capture voice/structure choices in Decision Log. Name the voice references that informed phrasing in Voice-Fit Notes. Self-eval before returning: does the prose match the brief, does the voice match references, are caveats flagged?

Output markdown to: {output_path}
Include frontmatter with schemaVersion: 1, tier: scribe, status, tool_budget_used.
```

---

## Tier - Engineer

**Model:** Sonnet (the top model showed no detectable edge for Engineer at typical scales - saturation, not "the top model is worse"). Reserve the top model for large-scale consolidation via a per-dispatch override.
**Cost profile:** Sonnet. Judgment execution at the structural tier.
**Session length:** Medium-long. Drift guard required.
**HARD_MAX:** 16
**SOFT_BUDGET:** 10

### Cluster
Execution with local judgment calls. Multi-file refactors with non-obvious trade-offs. Root-cause debug investigations. Integration work with ambiguous contracts. Non-trivial code generation. Validation requiring interpretation (not just test-running).

### Use for
- "Investigate why writes are silently failing. Determine the root cause. Fix if the fix is clear, otherwise report."
- "Refactor a command's bridge-file logic to handle a new pattern. Multiple valid approaches, pick the best."
- "Integrate a new schema across a feature's writes. Contracts are partially specified."
- "Generate a deploy script. Multiple patterns exist, pick one that fits the existing deploy scripts."

### Do not use for
Design decisions. Architecture-level decisions. Cross-domain pattern design. Deep research. Those go to Architect.

### Escalation signals
**Builder to Engineer:** Builder returns scope-exceeded. Root cause unknown. Multiple valid approaches with downstream consequences. Spans over 3 files with cross-file contracts. Verification requires interpretation, not just pass/fail.

**Engineer to Architect:** Design authority required. System-level architecture choice. Cross-domain impact. Decision-record-level decision. Deep research needed before execution can begin.

### Output body
```markdown
## Changes Made
{diff summary}

## Decisions Made
{each judgment call during execution, one line per decision, reasoning compressed}

## Test Output
{verification result}

## Pass/Fail
PASS | FAIL

## Rollback Command
{exact command}

## Caveats
{anything flagged}
```

The Decisions Made log is the load-bearing addition. Without it, judgment calls during execution are invisible and non-reviewable.

### Prompt template
```text
You are an Engineer.

GOAL: {outcome description}
FILES: {paths in scope}
CONSTRAINTS: {what must be preserved}
HARD_MAX: 16
SOFT_BUDGET: 10

Drift guard: every 4 tool calls, re-inject scope constraints and recheck GOAL alignment.

Execute with judgment. Record every judgment call in the Decisions Made log. One line per decision, compressed reasoning. Self-eval before returning.

Return: Changes Made, Decisions Made, Test Output, Pass/Fail, Rollback, Caveats. Status + recovery_hint on failure.

Output markdown to: {output_path}
Include frontmatter with schemaVersion: 1, tier: engineer, status, tool_budget_used.
```

---

## Tier - Researcher

**Model:** Sonnet (the top model showed no detectable edge for Researcher breadth at typical scales - saturation, not "the top model is worse"). Reserve the top model for large-scale consolidation via a per-dispatch override.
**Cost profile:** Sonnet. Use when multi-source synthesis matters.
**Session length:** Medium-long. Drift guard every 4 tool calls.
**HARD_MAX:** 16
**SOFT_BUDGET:** 10

### Cluster
Multi-source synthesis. Cross-doc coherence. Deep external research with best-of-N picks. Vendor / framework / pricing comparisons that require interpretation. Best-of-N selection where the picking matters as much as the gathering.

### Use for
- "Research current API pricing across all models plus competitor SDKs, surface the best fit for the workload mix, recommend one."
- "Survey 7 vendor docs on cron syntax plus retry semantics, find the one whose semantics match the existing scheduler conventions, justify the pick."
- "Read prior decision records on agent dispatch plus the current AGENT-PATTERNS.md, find tension between the evidence and the canonical tier table, synthesize the gap."
- "Compare 4 evaluation rubrics, pick the dimensions worth keeping, justify omissions."

### Do not use for
Single-source extraction (Scout). Single-pattern analysis (Analyst). File execution (Builder / Engineer). Design authority / decision-record authoring (Architect). Voice-stable prose (Scribe).

### Distinction from neighboring tiers
**Researcher vs Analyst:** Analyst is single-pattern, bounded question, structured finding. Researcher is multi-source synthesis where the *picking* across sources is the value. If the question is "find the answer in these files," Analyst. If "weigh these N sources and tell me which one fits," Researcher.

**Researcher vs Architect:** Researcher finds plus synthesizes plus picks. Architect designs new structure or makes decision-record-level decisions. Researcher's output informs Architect's decision. They often pair: Researcher returns synthesis, Architect ratifies into a decision record.

**Researcher vs Engineer:** Engineer executes with judgment during execution. Researcher synthesizes without execution. If the work changes files, Engineer (with Researcher input as needed).

### Output body
```markdown
## Synthesis
{main result - the cross-source picture}

## Source Map
{each source with one-line takeaway + confidence}

## Best-of-N Pick (if applicable)
{the chosen option with reasoning, alternatives rejected with why}

## Confidence
HIGH | MEDIUM | LOW per finding, with the dimension driving uncertainty

## Caveats
{gaps, unverified assumptions, sources that disagreed}
```

### Prompt template
```text
You are a Researcher.

GOAL: {synthesis question or best-of-N decision}
SOURCES: {paths + URLs + named docs in scope}
CRITERIA: {what makes one source/option better than another}
HARD_MAX: 16
SOFT_BUDGET: 10

Drift guard: every 4 tool calls, re-inject GOAL alignment and confirm sources still in scope.

Synthesize across sources. Pick best-of-N when criteria support it. Confidence per finding is mandatory. The Source Map enables verification. Self-eval before returning: did I synthesize (not just list)? did I pick (not just enumerate)? are confidences honest?

Output markdown to: {output_path}
Include frontmatter with schemaVersion: 1, tier: researcher, status, tool_budget_used.
```

---

## Tier - Architect

**Model:** Sonnet (the top model showed no detectable edge for Architect / decision-record work at typical scales - saturation, not "the top model is worse"). Reserve the top model for large-scale consolidation via a per-dispatch override.
**Cost profile:** Sonnet. Use the structural tier for design plus decision-record-level work.
**Session length:** Long. Drift guard every 4 tool calls.

### Architect scope (design plus decision records)
- Complex execution with judgment: write a leaf from scratch, design a cross-file pattern, implement a decision record.
- Hard-reasoning escalation: deep research plus design authority on system-level choices.

### Cluster
Complex execution with real judgment. Design. Deep research. Decision-record writing. Cross-file patterns. Risk analysis. System-level architectural decisions.

### Use for
- "Write a protocol doc from scratch. Cross-reference the companion commands. Include session-type adaptations."
- "Implement three new hooks with block semantics. Test with dummy sessions."
- "Write a decision record for per-command tiers. Justify every assignment across all commands. Flag surprises."
- "Analyze the full command system for circular delegation risks after a new pattern lands. Output a risk matrix."
- "Design v2 of a routing protocol. Handle the tier system and domain isolation."

### Do not use for
Work that fits Builder or Engineer. The cost has to earn its way in.

### Output body
```markdown
## Artifact
{the delivered work}

## Decision Log
{each non-obvious choice with rationale and alternatives rejected}

## Reasoning (for high-stakes / deep work)
{deeper exploration of options, why others failed, trade-offs surfaced}

## Caveats
{limitations, assumptions, gaps}
```

### Prompt template
```text
You are an Architect.

DELIVER: {artifact description}
CONSTRAINTS: {list}
CROSS-REFERENCES: {files to ground in}
HARD_MAX: {N - typically 20+ for Architect}
SOFT_BUDGET: {M}

Drift guard: every 4 tool calls, re-inject scope constraints.

Execute with full judgment. Return the artifact plus a decision log covering non-obvious choices, options considered, and why others were rejected. For high-stakes / deep work, also include a reasoning log with trade-offs surfaced. Self-eval before returning.

Output markdown to: {output_path}
Include frontmatter with schemaVersion: 1, tier: architect, status, tool_budget_used.
```

---

## Specialist Tier Roles

These roles supplement the canonical 7 tiers. They are role specialisations, not new model tiers - each maps onto an existing tier's model but loads a specific brief by default.

### Janitor (Sonnet, recurring)
- **Role:** wrap-up rotation. QUEUE/LOG file rotation, Recently Completed pruning, stale-item flagging.
- **Trigger:** session wrap-up; daily-cron-eligible; explicit "rotate the QUEUE files" command.
- **Returns:** rotation log (which items moved, which got flagged), updated file paths.
- **Frequency:** daily / per-wrap.

### Verifier (Sonnet, post-action)
- **Role:** "did it actually happen?" plus "are these claims true?"
- **Trigger:** wrap-up verification, application-grade outputs, financial/legal claims, deploy confirmations.
- **Returns:** boolean per claim plus evidence pointer (sent message ID, data row, deploy URL, etc).
- **Frequency:** several times per heavy session.

### Pruner (Sonnet, pre-session)
- **Role:** decide what NOT to read before the main session loads anything.
- **Trigger:** cross-domain requests, ambiguous scope, session starting near 50%+ context.
- **Returns:** "Read these N files. Skip these M. Reasoning per file."
- **Frequency:** session opener for cross-domain or unclear sessions.

### Router (Haiku, on ambiguity)
- **Role:** classify ambiguous requests to the correct domain.
- **Trigger:** prompt without a slash command plus topic does not map to a single domain.
- **Returns:** domain classification plus confidence plus suggested slash command.
- **Frequency:** opportunistic.

### Drafter (Sonnet, voice-stable)
- **Role:** voice-stable writing of letters, outreach messages, follow-up emails, replies. A Scribe specialisation.
- **Trigger:** outreach windows, scheduled correspondence, back-and-forth threads.
- **Returns:** drafts that match the operator's voice guides plus the relevant role-specific spec.
- **Frequency:** varies with outreach load.

---

### Companion-Class Keep-Direct Exception

Companion-class commands (a conversational persona that talks WITH the operator rather than executing tasks) operate under voice-before-facts sequencing - their persona must load BEFORE any context arrives, otherwise context is read through the wrong lens. They override the standard 150-line scout threshold for specific files designated Keep-Direct.

Direct-read the small structural files (STATUS, HANDOFF) by the persona, not scouted, even though they would normally exceed the inline threshold via the `>150 lines = scout` rule. Reason: Stage 1 scout summaries lose the exact quotes and session-internal observations a companion persona uses to open with precision.

**General principle:** for Companion-class personas, scout-first is harmful. The persona forms its own orientation through reading; pre-formed summaries undercut that. This exception applies ONLY to designated Keep-Direct files in Companion commands.

---

## When NOT to delegate at all

Keep in the main session:
- Active conversation with the operator
- Final synthesis and recommendations
- Psychological / companion work
- Voice-critical content
- Decisions that need the operator's input mid-stream
- Decision-record authoring where the decision is itself being made
- Any output the operator reads immediately for their own use

Rule of thumb: if the work IS the conversation, keep it in the main session. If the work is gathering or executing something the conversation needs, delegate.

---

## Agents spawning agents

**Subagents cannot spawn sub-subagents.** This is a hard platform constraint, not a design choice. The hub-and-spoke architecture is enforced by the runtime - the main session is the only orchestrator that can dispatch task agents. Subagents that need additional work CAN use Read, Edit, Write, Bash, and other primitive tools, but they CANNOT dispatch another agent.

**If a subagent needs work outside its scope:** return a `scope-exceeded` signal pointing at the correct tier. The main session decides whether to dispatch a follow-up agent.

**Approaching this constraint better:**
- Plan ahead: dispatch parallel agents from the main session rather than sequential agents-of-agents
- Pre-deploy pattern: at session start, fire all anticipated agents at once (each writes a markdown), the main session consumes outputs as needed
- Use Pattern B (instruction-file): a complex multi-stage agent can read a pre-written brief that anticipates branches, rather than dispatching helpers mid-task

Tier names are role contracts, not exclusive boxes. An Architect running a complex job is dispatched by the main session alongside any Scouts or Analysts needed - the main session coordinates all of them, not the Architect. Each agent receives its scoped brief directly from the main session, returns its output, and the main session synthesizes.

If an agent hits a blocker, it returns `scope-exceeded` with a `recovery_hint`. The main session escalates or clarifies.

---

## Warm startup pattern

Every Companion and Heavy domain command opens with a Stage 1 Scout call BEFORE the opener is generated.

### Stage 1 (minimal prefetch)
The Scout returns:
- QUEUE Quick Resume line
- Last 3 LOG entries
- Current PROGRESS state
- Any open cross-domain findings for this domain

Domain-scoped. 1-2k tokens. Not the full reference doc.

### Stage 2 (topic-triggered)
After the operator declares a topic, one or more Scouts fetch only the slice of reference docs covering that topic. Multiple Scouts can fire in parallel.

Per-domain tuning is allowed. Heavy-load domains may skip more of Stage 1. Light domains may barely need Stage 1.

> [!IMPORTANT]
> **Stage 1 is unconditional.** Stage 1 fires regardless of user prompt content. The richer the user's opening prompt, the MORE important Stage 1 becomes - context-rich prompts deserve scout-grounded answers, not cold replies. Long openers do NOT exempt the chat from Stage 1; they amplify the need. The model tendency to respond conversationally to long prompts without first executing session-start fleets is a KNOWN failure mode. Reinforce it with a root-instruction core rule and a UserPromptSubmit hook that fires when the prompt is long and starts with a slash command.

---

## Throughout pattern

Every time the main session is about to read a file over 150 lines, the default behavior is firing a Scout for the relevant section. A direct read is the exception.

Exceptions:
- Files in the domain's Stage 1 warm startup set (they are lean by design)
- Explicit override by the operator ("read full X")

A hook can enforce this: a pre-read hook fires before a large-file read and suggests a Scout call.

---

## Inline vs File Reference - When to Use Which

Spawn-prompt sizing thresholds. Degradation begins around 2-3K tokens, so keep inline briefs below that.

| Brief size | Pattern | What the main session does |
|-----------|---------|------------------------|
| Under 150 lines | Pattern A (inline) | Paste the full brief in the agent prompt |
| 150-300 lines | Hybrid | Inline summary + file pointer |
| Over 300 lines | Pattern B (strict) | Write to a file, the agent reads it |
| Builders specifically | 100-line cutoff | Builders need multi-step recall, stricter threshold |

When uncertain, default to Pattern B - file-resident briefs are cheaper to maintain and re-use than inline blobs.

---

## Pre-Deploy Speculative Pattern

Industry name: speculative prefetch (a fan-out at session start).

### When to use
The opening message is a directive ("let's plan X", "wrap up everything", "do the audit"). Multiple agent dispatches are clearly anticipated.

### When NOT to use
The opening message is a question ("what should we work on?"). The topic is ambiguous and would waste pre-deployed effort.

### Folder
`agent-prefetch/` (separate from `agent-outputs/` because these are speculative).

### Pattern
1. At session start (after the Stage 1 fleet returns), the main session identifies the cluster of likely agents needed.
2. Dispatch all of them in parallel, each writing to `agent-prefetch/`.
3. The main session does its own work (decisions, synthesis, conversation).
4. The main session reads from `agent-prefetch/` markdowns ONLY when it needs them.
5. Unused prefetch outputs are not deleted - they stay as session artefacts.

### Failure mode
Wasted dispatch when the topic shifts. Mitigation: prefetch outputs are markdown files. The cost is just inference, not context.

---

## File output convention

Filename: `agent-outputs/YYYY-MM-DD-{tier}-{purpose}.md`

Examples:
- `2026-01-18-scout-queue-state.md`
- `2026-01-18-analyst-pricing-gap-research.md`
- `2026-01-18-builder-index-cross-domain-fix.md`
- `2026-01-19-scribe-procedure-leaf-creation-draft.md`
- `2026-01-18-engineer-cold-start-refactor.md`
- `2026-01-19-researcher-api-pricing-bestpick.md`
- `2026-01-18-architect-routing-protocol-leaf.md`

---

## Reading check for main session (once per 10 turns)

The main session periodically re-reads this file to stay anchored in the protocol. Every 10 exchanges, recheck:
- Am I firing agents when I should, or reading directly?
- Am I pre-fire-checklisting before Scout calls?
- Is every agent call using an exact path and exact pattern?
- Am I respecting scope-exceeded signals?

Drift in the main session is real. This file exists to correct it.

---

## Hook-injected prelude system (Pattern D)

A `PreToolUse` hook on the agent-dispatch tool prepends content to the prompt of every dispatch. Patterns A/B/C describe how authors deliver the BRIEF; Pattern D describes how the system delivers shared context that no author has to remember to inline.

### What the hook injects

- **Universal block (always)**: the universal rules (no em dashes, sequential processing, domain isolation, incremental output, BLUF, schema, scope-exceeded), the universal output envelope, the output filename convention, and the chat envelope cap. Store this in a file the hook reads, e.g. `hooks/agent-prelude/universal.txt`.
- **Topic addons (keyword-triggered)**: appended after the universal block when the prompt mentions a trigger keyword. Each addon is its own file, e.g. `hooks/agent-prelude/{topic}.txt`. An addon carries the specifics an agent needs for that topic (API shapes, schema notes, hard prohibitions) so authors never inline that boilerplate.
- **Hard separator**: when addons fire, the assembled prompt reads `[universal] === TOPIC ADDONS === [addons] === END ADDONS === ORIGINAL TASK BRIEF FOLLOWS: [brief]`.

### How to add a new addon

1. Create `hooks/agent-prelude/{topic}.txt` with the agent-facing content (preserve specifics).
2. Add a keyword check (e.g. a `grep -qE` match) plus an inject call in the hook script near the existing addon blocks.
3. Smoke test the hook with a dummy dispatch that contains the trigger keyword.
4. Update this section's bullet list above.

Missing addon files should degrade silently to a warning on stderr - the hook never fails a dispatch over an absent addon.

### Author guidance

Spawn-prompt authors do NOT need to point at addons or paste boilerplate. Keyword detection handles it. Authors should still:

- State the tier explicitly (`You are a Scout / Builder / ...`)
- Set HARD_MAX and SOFT_BUDGET (these are tier-specific, not in the universal block)
- Name files explicitly (the DOMAIN ISOLATION rule still applies)
- Inline the actual brief content (Pattern A) or point at a spec file (Pattern B)

If the addon system covers a specific that you would otherwise inline, trust the hook and omit the boilerplate from the brief.

Pattern D does NOT replace Patterns A/B/C - it operates orthogonally. Authors still pick A/B/C for brief delivery; the hook layers the universal plus topic context underneath. Authors who do not know about Pattern D still benefit because the hook fires on every dispatch unconditionally.

---

## Agent prompt patterns (A, B, C)

Three explicit patterns for how to deliver context to a spawned agent. Choose based on brief size and durability needs.

### Pattern A - Inline prompt (default for simple work)

Everything the agent needs goes in the `prompt` field of the dispatch call.

**Use when:**
- The brief is under ~2000 characters
- One-shot task, no need to persist the spec
- No need for other sessions or agents to see the same spec

**Token cost:** you pay the spec tokens on the dispatch side AND inside the agent's context. No persistence, no reuse.

### Pattern B - Instruction file plus pointer prompt (for complex / durable specs)

Write a markdown file with the full spec, then dispatch the agent with a short prompt that says "read file X and execute what it says."

**Use when:**
- The brief is over ~2000 characters
- The spec may need to be revisited, versioned, or shared with a future agent
- Multiple agents will execute against the same spec
- The operator wants to read the spec before committing

**Token cost:** the agent still reads the file into its context, but the main chat only pays the short pointer prompt. The spec file is reusable forever.

### Pattern C - Scratchpad reference (for session-continuation work)

The agent reads clean, structured sections of the current session's working doc to inherit context without the main chat re-briefing. The working doc's "Decisions" / "Context" / "Direction" sections carry the state.

**Use when:**
- The agent needs context from the ongoing session (decisions made mid-flow, not in any persistent doc yet)
- You want the agent to pick up where the main chat left off without a long inline prompt
- The session has been running for a while and state is non-trivial
- You are doing bulk scratchpad / wrap work near session end

**Requirements for Pattern C to work:**
- The working doc must have CLEAN structured sections (not a stream-of-consciousness log) that the agent reads
- The main chat writes high-signal decisions to `## Decisions` and `## Context` sections as they happen
- The agent prompt points at the working doc file path plus names which sections to read plus what to do

**Token cost:** depends on the working doc size. If the working doc is kept tight, very cheap. If it has become an unstructured log, expensive.

### Choosing between A, B, C

| If... | Use |
|---|---|
| Brief under 2K chars, one-shot | A |
| Brief over 2K chars, or needs to persist, or the operator wants to read it | B |
| Agent is continuing mid-session state plus the working doc is clean | C |
| Session wrap-up / bulk scratchpad work | C |
| Cross-domain agent where the target domain has its own docs | A or B (point at the target domain docs) |

**Anti-patterns:**
- Pattern A with a 10K-character prompt (burns tokens, no reuse)
- Pattern B with a file that is now stale (the agent executes an outdated spec)
- Pattern C with a working doc that has never been updated (the agent reads nothing)

### Scratchpad optimization rule

The main chat writes high-signal decisions inline to the working doc as they happen (a few tokens each). At session wrap, dispatch ONE Builder to compile the full HANDOFF + QUEUE + LOG + reconciliation from the working doc state (Pattern C).

Do NOT dispatch a Builder for every small scratchpad update - dispatch overhead exceeds the saved tokens. The bulk wrap at the end is the win.

---

## Cross-machine file transfer

When an agent needs a file present on one machine but the file was written on another, use a direct copy (e.g. `scp user@server:/path/to/destination`) rather than waiting on a background sync.

- A bidirectional sync tool is not a transfer mechanism. Sync timing is non-deterministic (a rescan interval plus file-watcher batching can take tens of seconds before propagation starts).
- Agents that set up a "monitor" or "poll-for-file" pattern on a sync tool are over-engineering a one-shot transfer.
- The right pattern: one direct copy command. Deterministic, no waiting.
- A sync tool is the right choice for the *steady-state* sync between machines, not for *handoff* of a specific artifact.
