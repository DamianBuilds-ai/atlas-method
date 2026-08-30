# Atlas Method v2 - Constitution Template

> This file is the method constitution. Every runner that supports an `AGENTS.md`
> convention reads it natively. Runner-specific rules live in overlay files
> (`.grok/`, `.claude/`, `.codex/`, `.cursor/`), never here.
>
> Installer replaces `{{DOMAIN}}` tokens and the project name below.

**Project:** {{PROJECT_NAME}}
**Active domain:** {{DOMAIN}}
**Profile:** issues+local (default) | purely-local | issues+projects (opt-in)
**Atlas Method version:** {{AM_VERSION}}

---

## 1. What done means

Work in this repo is organized into **domains**. Each domain has a map,
a local JSONL read cache, a baton for the active session, and GitHub Issues
as the durable state store. Done means the local JSONL matches Issues (or
purely-local has no remote), the baton is absorbed or written, and the
generated orientation view is current.

---

## 2. Jobs

Dispatch by job name, not by file name. Each job has one contract and one
isolation level. Parent orchestrates. Children do not spawn.

| Job | Contract | Isolation |
|---|---|---|
| retrieve | Read-only. Verbatim excerpts with source citations. Cheap. | Shared workspace |
| apply | One deterministic edit. No inference allowed. | Worktree |
| implement | Judgment + verify. Larger scope edit with a rationale. | Worktree |
| review | Read-only critique. Returns findings, does not edit. | Shared workspace |
| research | Multi-source synthesis. Returns ranked findings with citations. | Shared workspace |
| write | Prose to a brief. Voice-stable output. | Shared workspace |

**Writers** (apply, implement) run in an isolated worktree. Readers
(retrieve, review, research, write) share the parent workspace. Never flag
a reader job as write-isolated.

Runner-specific job mappings (Claude adapters, Grok personas, Codex worker
names) are generated overlay output, not this file's vocabulary.

---

## 3. Retrieval

The method ships a `retrieve()` program, not a harness primitive.

```
retrieve(query, domain?, top_k=8, filters)
  -> ranked chunks: source (file:line-range | issue#) + excerpt
```

Three transport doors - same binary underneath:
- CLI: `atlas search "query" --domain {{DOMAIN}}`
- MCP: MCP server wrapping the CLI (all runners speak MCP)
- Skill: `/atlas-search` wrapping the CLI

Index: SQLite FTS5 over maps, leaves, ADRs, archived batons, local JSONL.
Rebuilt nightly and incrementally on push.

**Live state:** use `gh issue list --label domain:{{DOMAIN}}` (Issues LIST).
Never use GitHub Search for live state - Search is delayed, rate-limited,
and returns stale results on recent changes.

---

## 4. Session shape

A session opens in this order:

1. This file loads (plus the runner's thin shell if needed).
2. The domain map loads (150-200 lines, read whole).
3. **Read `sessions/current/orientation-{{DOMAIN}}.md`** - the generated
   80-line orientation view. The SessionStart hook writes this file before
   the session opens. Absorb it at start, every session, for this domain.
   If the file is missing: emit a visible notice, continue without it.
4. **Absorb the newest baton** for domain `{{DOMAIN}}` from
   `sessions/current/` (40-line cap). Domain match is the trigger - always.
   Classify each item: PROMOTED, DROPPED, or CARRIED.
5. Everything else via `retrieve()` each turn as needed.

Nobody hand-maintains the orientation view. The SessionStart hook generates
it live from local JSONL (`atlas orientation --domain {{DOMAIN}}`). A
crashed or failed hook leaves no orientation file - the session continues
with map + empty baton stub, never silences.

**File-first:** the orientation file is the primary delivery mechanism for
all runners including Grok. Claude Code also receives the orientation via
`additionalContext` injection, but that is a bonus - always read the file.

### Compact-aware start

When a session is opened with a named compact (produced by `/forward`),
replace the normal flow with:

1. This file loads (same as always).
2. The domain map loads (same as always).
3. **Read the compact** (`sessions/current/{{DOMAIN}}-compact.md` or the
   named path in the opener). The compact tells where the work is.
4. **Read the working scratchpad** named in the compact.
5. Skip the orientation file re-read and the apply opener. Do not re-fire
   Stage 1 scouts - the compact is the orientation.
6. **Load any file the work needs,** including files the compact's Key-files
   list names. Compact-aware start is not file-blind. The compact tells
   WHERE the work is, not what to ignore.

Compact-aware start ends when the operator has reviewed the compact and
confirmed the ship order. Then proceed as normal for that session.

---

## 5. Baton lifecycle

A baton is the session handoff document. It is transit-only; durable state
lives in Issues and local JSONL.

- **Stub at start.** The SessionStart hook writes the stub. A crashed session
  still leaves a trail.
- **Completed at wrap.** Wrap writes the baton, does not also write a stub.
- **Absorption on domain match.** Always. Cheap (40-line cap).
- **Terminal states:** PROMOTED (item became an Issue), DROPPED (deliberate,
  reason noted), CARRIED (into the new baton with source-baton tag).
  CARRIED is the only non-terminal exit.
- **Max 2 unabsorbed batons per domain.** A third triggers escalation-merge
  of the oldest into the domain's standing "carried items" Issue.
- **TTL 7 days.** Lint Action promotes unchecked items to the carried-items
  Issue and archives the baton.
- **Archive.** Gazetteer-indexed. Never deleted.
- **Proof.** Every item in an archived baton has a named terminal state.
  Lint-measurable. Not "wrap ran."

Location: `sessions/current/YYYY-MM-DD_HHMM_{{DOMAIN}}.md`

---

## 6. Worktrees

A worktree is a second checkout of the same repo in a different folder,
usually on its own branch. Child edits do not touch the parent's files
until apply.

Rules:
- Readers (retrieve, review, research, write): shared workspace, no copy.
- Writers (apply, implement): `isolation: worktree` or runner equivalent.
- At wrap / SessionEnd: apply wanted worktrees, then run
  `sh scripts/worktree-gc.sh` to remove session-created and merged trees.
  The runner does not gc for us (see WORKTREES.md).
- Parent orchestrates worktree creation and apply. Never delegate that to a
  child job.

**Merge rule for this repo (personal-OS repos):** squash-merge. One clean
commit per task on the main branch. Raw agent noise stays in the worktree
branch history.

---

## 7. Wash cycle

The wash cycle is continuous and proves its work. It does not replace wrap.

| When | What |
|---|---|
| Nightly (whole system) | One staleness Issue (over-cap docs, orphaned refs, unabsorbed batons, drifted hashes, local-vs-GitHub mismatch) |
| Per push (what changed) | Guards: cap lint, baton lint, broken refs, packaging boundary |
| Session end (wrap) | Promote durable items, write baton, apply/gc worktrees, push |

Caps are enforced by generation, not discipline:
- Orientation view generated to 80-line cap.
- Batons written to 40-line cap.
- Maps linted at 200-line hard cap (150 advisory).

Wrap duties: promote + baton + worktree apply/gc + push. Wrap does not
audit or re-index. The nightly Action does that.

---

## 8. Line caps

| Document | Cap | Enforcement |
|---|---|---|
| AGENTS.md (this file) | 250 lines | CI blocking |
| CLAUDE.md / GEMINI.md shells | 1 line | CI blocking |
| Domain map | 150 target / 200 hard | CI advisory 150, blocking 200 |
| Generated orientation view | 80 lines | Generated to cap |
| Session baton | 40 lines | Wrap writes to cap |
| Leaf | 200 lines | CI advisory + staleness flag |
| Docs-mode / JSONL view | 80 lines | Lint + wash |

---

## 9. Privacy watchdog

The manifest (`gazetteer.repos` or `privacy.guarded`) lists each remote
with a visibility tag: `private` or `public`. New remotes default to
`private` until explicitly tagged `public`.

The watchdog fails CI if a repo tagged `private` reports any other
visibility. A public Project on a private repo is a separate check (repo
visibility bit does not cover it).

Damian's personal-OS repo is private by default. The public `atlas-method`
method repo is tagged `public` in the installed manifest. No other repo is
tagged public without an explicit decision.

---

## 10. Gate command

The gate command is defined per-project. Run it at the start of every
session to confirm the baseline is green. Fix red before starting work.

```
# Replace with the project's actual gate command
node scripts/check-atlas-method.js   # example only
```

CI must run the identical command. Gate == CI contract.

---

*End of Atlas Method v2 constitution template.*
*Generated by: `npx atlas-method init`. Do not edit the generator; edit this file.*
