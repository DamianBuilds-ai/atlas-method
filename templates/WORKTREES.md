# Atlas Method - Worktree Rules

A worktree is a second checkout of the same repo in a different folder, usually
on its own branch. Child edits stay in the worktree until the parent applies them.

---

## Job isolation matrix

| Job | Isolation | Rationale |
|---|---|---|
| retrieve | Shared workspace | Read-only. No checkout needed. |
| apply | Worktree | Writer job. One deterministic edit on an isolated branch. |
| implement | Worktree | Writer job. Larger scope; parent reviews before applying. |
| review | Shared workspace | Read-only critique. No checkout needed. |
| research | Shared workspace | Read-only synthesis. No checkout needed. |
| write | Shared workspace | Prose output only. No repo writes. |

Writers (apply, implement) always run in worktrees.
Readers (retrieve, review, research, write) always share the parent workspace.

---

## Lifecycle rules

1. **Parent creates the worktree.** Never delegate worktree creation to a child job.
2. **Child edits only inside its worktree.** Never write to the parent workspace directly.
3. **At wrap / SessionEnd:**
   - Apply wanted worktrees (merge or squash-merge the branch into the parent).
   - Delete every worktree this session created, wanted or not.
   - The runner does not gc worktrees automatically. Without this step, disk fills.
4. **Merge rule on personal-OS repos:** squash-merge. One clean commit per task.
   Raw agent noise stays in the worktree branch history.

---

## Wrap-time worktree gc

The wrap step must run `scripts/worktree-gc.sh` after applying wanted worktrees.
The script handles the cleanup automatically:

- **Session-created trees** are identified by a marker file `.atlas-session-worktree`
  in the worktree root. Parent agents write this marker at creation time.
  The marker must stay untracked (add `.atlas-session-worktree` to `.gitignore`);
  committing it causes it to propagate through merges and triggers false removals.
- **Merged trees** (branch fully merged into HEAD) are also removed.
- **Dirty trees** (uncommitted changes) are skipped with a printed notice so you
  can review before removing manually.
- **Foreign/manual trees** (no marker, not merged) are left untouched.

```
sh scripts/worktree-gc.sh          # live run
sh scripts/worktree-gc.sh --dry-run  # preview what would be removed
```

Grok does not gc worktrees automatically. Without this step, disk fills with
orphaned directories. Run `git worktree list` to audit any leftovers.

---

## Claude Code note

Claude Code worktree isolation is a dispatch-time concern, not an agent frontmatter
field. When the parent spawns a child agent, it passes `isolation: "worktree"` as
a parameter to the Agent tool call (or the harness's worktree option). The agent
definition file (`.claude/agents/{tier}.md`) does not carry an `isolation:` field;
that field is tooling-side at spawn time. The child receives a worktree path in its
context and edits only within it. The parent applies or discards the worktree at wrap.

---

## Spec reference

Draft 3 section 13 (Worktrees, LOCKED) and section 6 (runner overlay directories).
Generated adapter files encode isolation per job; this file is the human reference.
