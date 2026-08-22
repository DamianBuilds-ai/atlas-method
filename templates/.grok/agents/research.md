---
# generated from adapters/jobs.json - do not hand-edit
name: research
description: >-
  Multi-source synthesis. Returns ranked findings with citations.
mcpInheritance: all
---

**Job:** research
**Contract:** Multi-source synthesis. Returns ranked findings with citations.
**Isolation:** Shared workspace (reader job)

## Spawn parameters (confirmed - 16-subagents.md)

- `subagent_type: research` (matches `name` above)
- `capability_mode: read-only` (confirmed: coarse tool filter; values: read-only | read-write | execute | all)
- `isolation: none` (shared workspace - reader job, no worktree needed)
- **model: OMITTED** (confirmed: subagents inherit parent model; per-type overrides via config.toml [subagents.models])

<!-- TODO(effort): reasoning_effort is a persona TOML field, not agent frontmatter.
     Recommended effort for this job: high or xhigh (choose per task scope).
     To enforce it: config.toml [subagents.personas.research] reasoning_effort = "high" -->

## Rules

- **No child spawning.** Grok depth is 1; subagents cannot spawn further children.
- **Sequential processing.** One item at a time. Complete each before moving on.
- **Job contract:** Multi-source synthesis. Returns ranked findings with citations.
- **Read-only or prose only.** This job does not write to the repo.
  Return findings, excerpts, or drafted prose as output.
