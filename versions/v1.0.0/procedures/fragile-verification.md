# Fragile Multi-Agent Verification Procedure

**Trigger phrases:** "this is fragile", "need to be 100% sure before changes", "verify before any changes occur", "make sure before touching this", "need to be careful here", "don't break this".

**Use when:** the change is hard to reverse, touches multiple interconnected systems, or has been described as fragile by the user. Also fires when the surface area is broad (3+ files of unknown coupling) or when prior failures on this surface are remembered. If in doubt, run the procedure - the cost is one extra Stage 1 round; the cost of skipping is a silent break that compounds.

This is a three-stage workflow: parallel verification, synthesis, controlled execution. Each stage gates the next. Do not collapse stages.

---

## Stage 1 - Parallel Verification Fleet (5 Scouts)

Fire all five scouts in a single tool block. Sequential dispatch defeats the point. Each scout returns a markdown summary, no JSON, under its tier's HARD_MAX/SOFT_BUDGET.

1. **File state scout.** Reads the current contents of every file the change will touch. Returns: file paths, line counts, key sections, any TODO/FIXME flags, last-modified hints from git if cheap. No interpretation, just state.

2. **Dependency map scout.** Greps for every reference to the file(s) under change - imports, requires, includes, slash command bodies, hook scripts, methodology pointers, routing tables. Returns the call graph one step out. The goal is to surface what else breaks if this changes.

3. **Change history scout.** Reads recent git log entries that touched these files (last 10-20 commits or last 60 days, whichever is smaller). Returns: who changed what, when, with what stated reason. Surface any reverts, churn, or back-and-forth that suggests instability.

4. **Config surface scout.** Identifies every config file, environment variable, secret, hook script, or external service touched by the change. Returns: where the config lives, who reads it, what the canonical value is right now. Catches the "I forgot the .env was also wired to this" failure mode.

5. **Known failure modes scout.** Reads the relevant QUEUE/HANDOFF/DECISIONS history for prior incidents on this surface. Returns: incidents, root causes, fixes applied. The goal is to make sure we don't re-trigger a regression that the system already knows about.

**Stage 1 gate:** all five scouts must return before forward motion. If any scout returns NOT FOUND or scope-exceeded, treat that gap as a finding - do not paper over it. Show the user the combined Stage 1 output before moving on. They may add a clarification or veto a planned change based on what surfaced.

---

## Stage 2 - Researcher OR Architect Synthesis

Choose ONE based on the nature of the question Stage 1 surfaced:

- **Researcher (mid-tier model)** - if the work is reconciliation. Multiple sources of truth need to be cross-checked, the change is mechanical once state is clear, and no design decision is embedded. Researcher's output: a coherent picture of current state plus the precise change list.

- **Architect (mid-tier model)** - if the work has design consequences. Stage 1 surfaced an ambiguity about how the system SHOULD behave (not just how it currently does), the change touches an invariant, or there's a decision-record-level decision in the question. Architect's output: a written plan plus a justification shaped like a decision record.

If you cannot decide between Researcher and Architect, default to Architect. The cost of over-tiering once is tiny; the cost of under-tiering a structural change is a half-built system.

Synthesis runs against the FULL Stage 1 fleet output. Do not let the synthesis tier re-do scout work - that is a tier mismatch.

**Stage 2 gate:** synthesis output goes to the user before Stage 3 begins. They confirm the plan, flag surprises, or reject. Stage 3 does not start without their explicit go-ahead. This is the human-in-the-loop checkpoint that makes "fragile" tractable.

---

## Stage 3 - Controlled Execution

Pick the executor tier based on the plan:

- **Builder (mid-tier model)** - if every step is mechanical with verification baked in (apply edit X, run check Y, confirm Z). No judgment calls.

- **Engineer (higher-tier model, low effort)** - if the executor will hit local judgment calls (edge cases the plan didn't fully specify, ambiguity in a single file, naming choices). Engineer logs Decisions Made.

Use the **checkpoint pattern**: the executor pauses after each non-trivial step, surfaces what was done, and waits for the next instruction. For long execution chains, batch checkpoints at logical seams (after each file, after each system boundary). Do not run a 20-edit Builder loose without checkpoints on a fragile surface.

If a step uncovers something Stage 1 missed, halt. Drop back to Stage 2 (synthesis with the new finding) before continuing. Forward-only execution on a fragile surface is exactly the failure mode this procedure exists to prevent.

---

## Quality gates

- **Don't skip Stage 1.** The temptation is to fire 1-2 scouts and "feel things out". On a fragile surface that's the move that breaks systems. Five scouts in parallel cost minutes; a regression costs hours plus trust.
- **Don't begin Stage 3 before the user sees Stage 2.** The synthesis output is also a sanity check on the model's understanding. If the user flags a misread, Stage 3 was about to fail.
- **Pause on surprising findings.** If Stage 1 returns something the model did not expect (a config file with a value nobody documented, a dependency on a deprecated module, a prior incident with a half-applied fix), do NOT smooth over it. Surface the surprise to the user and re-plan.
- **Reversibility check before any destructive step.** Before running anything that cannot be undone (delete, force-push, schema migration, credential rotation), confirm the rollback path exists and is documented. If no rollback path, escalate to Architect for a real plan.
- **One procedure run per change set.** If the work fans out and a second fragile surface gets touched, run the procedure again on that surface. Do not assume the first verification covers the second.
