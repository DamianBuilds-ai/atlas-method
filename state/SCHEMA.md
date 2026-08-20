# Atlas State - JSONL Record Schema

Version: 1
Format: JSONL (one record per line, newline-delimited)

---

## File Layout

Each `.jsonl` file MUST begin with a header record on line 1:

```json
{"schema": "atlas-state", "version": 1}
```

Every subsequent line is a state record. Blank lines and lines starting with
`#` are ignored by readers (comments are not spec-conformant JSON; loaders
strip them before parsing).

---

## Record Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Stable unique ID. Format: `{kind}-{8-hex}` e.g. `task-a3f09b2c`. Never reuse. |
| `kind` | string | yes | One of: `task`, `decision`, `finding`, `suggestion`, `idea`, `carried` |
| `domain` | string | yes | Short domain slug matching the domain map filename stem. e.g. `treasury`, `synqr`. |
| `title` | string | yes | One-line human title. No em dashes. Max 120 chars. |
| `body` | string | no | Free-form detail. Markdown OK. Indexed by FTS5. |
| `status` | string | yes | One of: `open`, `done`, `declined`, `parked`, `promoted` |
| `labels` | array of string | no | Freeform tags. Convention: `domain:X`, `kind:Y`, `priority:high`. |
| `issue` | integer or null | yes | GitHub issue number if synced, else `null`. |
| `created` | string | yes | ISO-8601 datetime, UTC. e.g. `2026-08-19T03:00:00Z` |
| `updated` | string | yes | ISO-8601 datetime, UTC. Set on every write. |
| `source` | string | yes | One of: `session`, `baton`, `issue-sync` |

---

## Kind Semantics

| Kind | Meaning |
|---|---|
| `task` | Actionable work item. Replaces QUEUE entries. |
| `decision` | An ADR or locked choice. Often links to a GitHub Issue. |
| `finding` | Observation or diagnosis - not immediately actionable. |
| `suggestion` | Proposed change from an agent or external source. Needs triage. |
| `idea` | Exploratory / speculative. May be promoted to task. |
| `carried` | A row carried forward from a prior session's baton. Same ID, updated timestamp. |

---

## Status Transitions

```
open -> done | declined | parked | promoted
parked -> open | declined
promoted -> (terminal - item now lives as a GitHub Issue or ADR)
```

`declined` is terminal. Use `parked` for "not now but not never."

---

## Minimal Valid Record

```json
{"id":"task-a3f09b2c","kind":"task","domain":"synqr","title":"Fix webhook retry logic","body":"","status":"open","labels":[],"issue":null,"created":"2026-08-19T03:00:00Z","updated":"2026-08-19T03:00:00Z","source":"session"}
```

---

## Schema Versioning

- The header line carries `"version": 1`.
- Readers MUST reject files whose header version is higher than they understand.
- Adding an optional field is a minor bump (version stays at 1, document the new field here).
- Renaming or removing a field requires bumping to version 2 with a migration note.
- The installer computes a hash of this file and embeds it; the CLI checks the embedded hash on startup to detect schema drift (`atlas index` will refuse to run against a file built from a different schema version).

---

## Multi-Domain Files

A single `.jsonl` file may hold records from multiple domains. The `domain`
field identifies each record's owner. The gazetteer indexes across all of them.

Default file locations:
- `~/.atlas/state/local.jsonl` - machine-local state, all domains
- `~/.atlas/state/{domain}.jsonl` - per-domain split (optional, preferred for large corpora)

---

## Issue Sync Contract

When `source` is `issue-sync`:
- `issue` MUST be set to the GitHub issue number.
- `title` mirrors the issue title.
- `body` mirrors the issue body (truncated at 4000 chars if longer).
- `status` maps from GitHub state: open -> `open`, closed -> `done` or `declined` (use `done` unless the issue has a `declined` label).
- `labels` mirrors all issue labels.

Local-only rows (`source: session` or `baton`) with `issue: null` are never
touched by the sync pass.
