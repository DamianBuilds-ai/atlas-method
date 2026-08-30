---
# generated from adapters/commands.json - do not hand-edit
description: >-
  Pre-compact handoff. Distills for the next chat - catches scratchpad up, writes compact, prints paste-ready successor prompt. Does NOT seal (wrap seals: baton + worktree gc + push).
---

# /forward

Pre-compact handoff. Distills for the next chat - catches scratchpad up, writes compact, prints paste-ready successor prompt. Does NOT seal (wrap seals: baton + worktree gc + push).

**Scope boundary:** forward distills, wrap seals. Forward writes the compact. Wrap writes the baton. Neither does the other's job.

**Context economics:** Aim near 200k tokens. Tokens double past that. Auto-compact often fires at 400k+. /forward is how the operator hops before the expensive zone.

## Steps

1. Resolve domain: infer from newest session file today, or accept {domain} arg
2. Catch scratchpad up: compare to conversation; append any missing decisions, results, next steps
3. Load just enough spine: read personality and trunk paths from the domain command; direct-read those two files only; no Stage 1 scouts
4. Write compact: successor-orientation doc at sessions/current/{DOMAIN}-compact.md with sections: Mode, Live-do-not-undo, Ship-order-locked, Hard-no, Key-files, Host-notes
5. Update domain QUEUE: Quick Resume + NEXT CHAT pointer to compact; check off finished work
6. Print paste-ready successor prompt and stop

## Compact-aware session start

When the next session is opened with a compact produced by /forward:

- **Load:** personality, trunk (map), compact, scratchpad
- **Skip:** orientation apply opener, Stage 1 scout re-fire
- **Not skipped:** Any file the work needs, including files the compact Key-files list names. Compact-aware is not file-blind.

Successor may load needed files - the compact tells WHERE the work is, not what to ignore.

<!-- TODO(grok-commands-schema): confirm mcpInheritance + user-invocable applicability
     for flat commands/ format vs agents/ format (08-skills.md does not enumerate these
     for the commands/ variant). Confirm whether mcpInheritance and user-invocable fields apply to flat commands/ format vs agents/ format. Not enumerated in docs/user-guide/08-skills.md for the commands/ variant. Omitting both; Grok infers from filename. -->
