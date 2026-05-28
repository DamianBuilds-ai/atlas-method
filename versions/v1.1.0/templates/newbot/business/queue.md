# {DOMAIN} - Queue (Active Work)

> The branch read every single session. It holds what is active across the business right now: campaigns running, deals in flight, ops work in progress, product changes pending. The Quick Resume at the top is the first thing a new session reads - it should let you pick up cold in under a minute. Completed items rotate down to Recently Completed, then out to `{DOMAIN}_LOG.md` once Recently Completed grows past ~5 items. Keep the whole file under ~80 lines.

**Last updated:** {DATE}

## Quick Resume

The thirty-second orientation. Where the business stands, the single most important next action, anything a fresh session must know before touching this domain.

- **State:** Setting up. {DOMAIN_TITLE} scaffold just landed.
- **Next:** Fill in the first concrete task in This Session below.
- **Watch:** Nothing yet - this is a fresh business domain.

## This Session

Tasks planned for the current session. Write them here BEFORE doing them. Check them off as you complete them.

- [ ] {First concrete task - replace this placeholder}

## Pipeline

Deals, leads, or opportunities in motion. Each row carries enough context to resume without reading any other file. When a row closes (won or lost), move it to Recently Completed.

| Name | Stage | Next action | Owner / blocked-by |
|------|-------|-------------|---------------------|
| {Lead one} | {discovery / proposal / negotiation / close} | {what moves it forward} | {who, or what is in the way} |

## Active Campaigns

Marketing, content, or outbound work currently running. One row per campaign. Workstream-specific detail (playbooks, copy, briefs) lives in the workstream leaf, not here.

| Campaign | Channel | Started | Status | Next checkpoint |
|----------|---------|---------|--------|------------------|
| {Campaign one} | {channel} | {date} | {running / paused / wrapping} | {what + when} |

## Active

Non-pipeline, non-campaign work in progress. Ops items, product changes, partnerships, hiring conversations. Each item carries enough context to resume without reading the LOG.

- {Active item - what it is, where it stands, what blocks it from completing}

## Queue

Tasks queued for future sessions, ordered roughly by priority. The next session pulls from the top.

- [ ] {Queued task}

## Recently Completed

The last few finished items, newest first. When this passes ~5 items, rotate the oldest into `{DOMAIN}_LOG.md`.

- {Completed item} ({DATE})
