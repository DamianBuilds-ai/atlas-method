# Session Wrap Procedure

**Trigger phrases:** "wrap up", "wrap", "done for tonight", "let's close out", "end session", "checkpoint", "sync", "push".

**Cookies:**
- **wrap** = full 8 steps below.
- **checkpoint** = steps 1 + 2 + 6 only (QUEUE + HANDOFF + git push).
- **sync** = step 6 only (git push).

Sessions end. State does not survive context window resets. Wrap is how a session hands itself to the next session cleanly. Skipping it is how work gets lost.

This is a public-grade protocol. Run all eight steps in order. Do not collapse them, do not parallelise them, do not declare "wrapped" until step 8 finishes. Each step is small. The discipline is in always doing them.

---

## Step 1 - Update the QUEUE

Open `{DOMAIN}_QUEUE.md`. Three updates:

1. **Quick Resume** at the top. One paragraph describing where this session left off, what is loaded in the active mental model, what the next session should pick up first. Rewrite it. Do not append.
2. **Active items.** Check off anything completed this session. Move newly surfaced work into the right priority bucket.
3. **Recently Completed.** Add this session's completed items with the date. If the list grows past five items, that is your signal for step 3 (LOG rotation).

The QUEUE is the single most important file. If you only have time for one step, do this one. Every other step assumes the QUEUE is current.

### Step 1b - Leaf accumulation check

Before closing the QUEUE, ask: did this session accumulate reference content that future sessions will need to look up? If yes, extract it to a leaf now, while the context is hot. Triggers:

- The same subject got explained three or more times in this session.
- The QUEUE has reference content that does not belong there (procedures, specs, schemas).
- A scout was dispatched to the same file across two or more sessions.
- A coordination surface exists between two domains.

Extracting late costs more than extracting now. See `procedures/leaf-creation.md`.

---

## Step 2 - Update the HANDOFF

Open `{DOMAIN}_HANDOFF.md`. This is the "what the next session needs to know" file. Three sections:

1. **What was done.** Bullet list of completed work, with dates. Be specific. "Fixed the bug" is not enough. "Fixed off-by-one in `parse_window()` causing the last item to drop" is.
2. **What is in progress.** Anything started but not finished. Include the file path, the line you stopped at, the decision pending, the test that is still red. The goal is "next session can resume in 30 seconds."
3. **What is blocked.** External waits, decisions pending from another person, services down, deps unreleased. Mark each with the blocker name and what would unblock it.

HANDOFF is short. If it is longer than 40 lines, you are duplicating QUEUE content. Tighten it.

---

## Step 3 - LOG rotation (conditional)

If the QUEUE's Recently Completed list has five or more items, rotate the oldest items into `{DOMAIN}_LOG.md`. Format:

```
### YYYY-MM-DD - One-line title

Bullet detail of what shipped.
```

Newest entries go at the top of the LOG. Trim QUEUE's Recently Completed back to the most recent three or four. The LOG is your historical record - never delete from it, only append. The QUEUE is your active state - keep it light.

If Recently Completed has fewer than five items, skip this step.

---

## Step 4 - Update the priority stack (optional but recommended)

If you keep a central `NEXT_ACTIONS.md` (or equivalent priority file across domains), update it now. Re-prioritise based on what this session changed:

- Remove items that completed.
- Add items that surfaced.
- Reorder if priority shifted (something blocking now unblocks, something low now urgent).
- Cap at ten items. Anything past ten is not actually next; it is "later", and it belongs in a domain QUEUE or IDEAS file.

This is the file you read first when you sit down without knowing what to work on. Keep it honest.

---

## Step 5 - Content moments (optional)

If this session surfaced something worth keeping for content, learning, or personal reference (a turn of phrase, a hard-won insight, a small story, a metaphor that landed), append it to your moments file (`PERSONAL_MOMENTS.md`, `CONTENT_MOMENTS.md`, or whatever you call it). One paragraph. Date it.

You will forget these. Capture or lose.

Skip this step if nothing landed.

---

## Step 6 - Git commit and push

Stage, commit, push. Commit message format:

```
{domain}: short imperative summary

Optional longer detail.
```

Examples:
- `finances: add Q3 review, rotate LOG`
- `health: log new baseline weight + week 4 metrics`
- `coding: ship parser fix, update HANDOFF`

Do not bypass commit hooks. Do not force-push. If the push fails, read the error, fix the underlying cause, and re-push. A failed push that gets buried is how work disappears for weeks.

If your repo lives on a remote, this is the moment another machine catches up. Always push at wrap.

---

## Step 7 - Cleanup

Sweep the working directory for ephemeral files that no longer need to live:

- Scratch outputs older than the configured retention window.
- Draft files that got committed properly elsewhere.
- Temp HTMLs that have been replaced by newer ones.

This is housekeeping, not deletion of anything important. If unsure whether a file is needed, leave it. Better to have a slightly cluttered working dir than to delete a file the next session needs.

---

## Step 8 - Cross-domain memory (optional)

If this session produced a finding that other domains need to know about (a model price change, an infrastructure decision, a credential rotation, a methodology update), write it to your cross-domain memory layer (a shared database table, a `CROSS_DOMAIN_FINDINGS.md`, or whatever pattern your setup uses).

The pattern is: domain sessions produce findings, the cross-domain layer surfaces them to other domain sessions at startup. Without this step, every domain re-learns the same thing.

Skip if no cross-domain findings surfaced.

---

## When you are done

Tell the user: "Wrapped. Steps 1 through 8 complete. {Domain} is ready to close." That sentence is the receipt. Until you have said it, you have not wrapped.

If you ran a checkpoint or a sync instead of a full wrap, say which one and which steps you did. Do not let the user assume you did the full 8 when you did 3.

---

## Why this exists

Wrap is mechanical. It is also load-bearing. A session that does great work and then forgets to update its QUEUE and HANDOFF is a session that effectively never happened, because the next session has no idea where to start. The work is in the files, not in the conversation.

Run the full 8 steps. Every time. Builder's pride lives in the wrap, not in the heroics.
