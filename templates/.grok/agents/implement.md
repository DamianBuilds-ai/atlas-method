---
# generated from adapters/jobs.json - do not hand-edit
name: implement
description: >-
  Judgment + verify. Larger scope edit with a rationale.
mcpInheritance: all
---

**Job:** implement
**Contract:** Judgment + verify. Larger scope edit with a rationale.
**Isolation:** Worktree (writer job)

## Spawn parameters (confirmed - 16-subagents.md)

- `subagent_type: implement` (matches `name` above)
- `capability_mode: read-write` (confirmed: coarse tool filter; values: read-only | read-write | execute | all)
- `isolation: worktree` (isolated git worktree; parent applies or discards at wrap)
- **model: OMITTED** (confirmed: subagents inherit parent model; per-type overrides via config.toml [subagents.models])

<!-- TODO(effort): reasoning_effort is a persona TOML field, not agent frontmatter.
     Recommended effort for this job: medium or high (choose per task scope).
     To enforce it: config.toml [subagents.personas.implement] reasoning_effort = "medium" -->

## Rules

- **No child spawning.** Grok depth is 1; subagents cannot spawn further children.
- **Sequential processing.** One item at a time. Complete each before moving on.
- **Job contract:** Judgment + verify. Larger scope edit with a rationale.
- **Worktree only.** All edits happen inside the isolated worktree branch.
  Never write to the parent workspace directly. The parent applies or discards the worktree at wrap.
