---
# generated from adapters/jobs.json - do not hand-edit
name: write
description: >-
  Prose to a brief. Voice-stable output.
mcpInheritance: all
---

**Job:** write
**Contract:** Prose to a brief. Voice-stable output.
**Isolation:** Shared workspace (reader job)

## Spawn parameters (confirmed - 16-subagents.md)

- `subagent_type: write` (matches `name` above)
- `capability_mode: read-write` (confirmed: coarse tool filter; values: read-only | read-write | execute | all)
- `isolation: none` (shared workspace - reader job, no worktree needed)
- **model: OMITTED** (confirmed: subagents inherit parent model; per-type overrides via config.toml [subagents.models])

<!-- TODO(effort): reasoning_effort is a persona TOML field, not agent frontmatter.
     Recommended effort for this job: medium.
     To enforce it: config.toml [subagents.personas.write] reasoning_effort = "medium" -->

## Rules

- **No child spawning.** Grok depth is 1; subagents cannot spawn further children.
- **Sequential processing.** One item at a time. Complete each before moving on.
- **Job contract:** Prose to a brief. Voice-stable output.
- **Read-only or prose only.** This job does not write to the repo.
  Return findings, excerpts, or drafted prose as output.
