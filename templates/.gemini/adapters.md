<!-- generated from adapters/jobs.json - do not hand-edit -->
<!-- Gemini adapter stub. Format TBD - verify against Gemini CLI docs. -->

# Gemini adapter mapping

Gemini CLI configuration lives in .gemini/settings.json. The constitution
pointer is already set there (context.fileName = AGENTS.md). This file
documents the per-job worker mapping for reference.

## TODO: Gemini CLI schema

- [ ] Confirm Gemini CLI agent/persona configuration format
- [ ] Confirm whether per-job worker files are needed or settings.json is sufficient
- [ ] Confirm model configuration approach (omit model on children per spec s.13/19)

## Job mapping

| Job | Isolation | Worker / config | Note |
|---|---|---|---|
| retrieve | shared | custom/read-only | TBD - Gemini adapter config format not yet specified. |
| apply | worktree | custom | TBD - Gemini adapter config format not yet specified. |
| implement | worktree | custom | TBD - Gemini adapter config format not yet specified. |
| review | shared | custom | TBD - Gemini adapter config format not yet specified. |
| research | shared | custom | TBD - Gemini adapter config format not yet specified. |
| write | shared | custom | TBD - Gemini adapter config format not yet specified. |

## Rules

- Parent orchestrates. Children do not spawn.
- Model omitted on child jobs (inherit parent per spec s.13/19).
- Writer jobs (apply, implement) run in worktrees.
