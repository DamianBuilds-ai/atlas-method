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

## Grok Build note

Grok Build does not gc worktrees at session end. The wrap step must explicitly run:

```
git worktree remove --force <worktree-path>
```

for every worktree created in the session, after applying wanted ones.

Register this as part of the wrap hook or run it manually. A session that ends
without cleanup leaves orphaned directories. Run `git worktree list` to audit.

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
