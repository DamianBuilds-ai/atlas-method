# {DOMAIN} - Queue (Active Work)

> The branch read every single session. It holds what is active right now - nothing else. The Quick Resume at the top is the first thing a new session reads: it should let you pick up cold in under a minute. Completed items rotate down to Recently Completed, then out to `{DOMAIN}_LOG.md` once Recently Completed grows past ~5 items. Keep the whole file under ~80 lines.

**Last updated:** {DATE}

## Quick Resume

The thirty-second orientation. Where things stand, what is the single most important next action, any one thing a fresh session must know before touching this domain.

- **State:** Setting up. {DOMAIN_TITLE} scaffold just landed.
- **Next:** Fill in the first concrete task in the Queue section below.
- **Watch:** Nothing yet - this is a fresh domain.

## This Session

Tasks planned for the current session. Write them here BEFORE doing them. Check them off as you complete them.

- [ ] {First concrete task - replace this placeholder}

## Active

Work in progress that spans more than one session. Each item carries enough context to resume without reading the LOG.

- {Active item - what it is, where it stands, what blocks it from completing}

## Queue

Tasks queued for future sessions, ordered roughly by priority. The next session pulls from the top.

- [ ] {Queued task}

## Recently Completed

The last few finished items, newest first. When this passes ~5 items, rotate the oldest into `{DOMAIN}_LOG.md`.

- {Completed item} ({DATE})
