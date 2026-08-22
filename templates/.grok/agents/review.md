---
# generated from adapters/jobs.json - do not hand-edit
name: review
description: >-
  Read-only critique. Returns findings, does not edit.
mcpInheritance: all
---

**Job:** review
**Contract:** Read-only critique. Returns findings, does not edit.
**Isolation:** Shared workspace (reader job)

## Spawn parameters (confirmed - 16-subagents.md)

- `subagent_type: review` (matches `name` above)
- `capability_mode: read-only` (confirmed: coarse tool filter; values: read-only | read-write | execute | all)
- `isolation: none` (shared workspace - reader job, no worktree needed)
- **model: OMITTED** (confirmed: subagents inherit parent model; per-type overrides via config.toml [subagents.models])

<!-- TODO(effort): reasoning_effort is a persona TOML field, not agent frontmatter.
     Recommended effort for this job: medium.
     To enforce it: config.toml [subagents.personas.review] reasoning_effort = "medium" -->

## Rules

- **No child spawning.** Grok depth is 1; subagents cannot spawn further children.
- **Sequential processing.** One item at a time. Complete each before moving on.
- **Job contract:** Read-only critique. Returns findings, does not edit.
- **Read-only or prose only.** This job does not write to the repo.
  Return findings, excerpts, or drafted prose as output.
