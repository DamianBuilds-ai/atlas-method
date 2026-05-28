# {DOMAIN} - Queue (Active Work)

> The branch read every single session. It holds what is active right now - nothing else. The Quick Resume at the top is the first thing a new session reads: it should let you pick up cold in under a minute. Completed items rotate down to Recently Completed, then out to `{DOMAIN}_LOG.md` once Recently Completed grows past ~5 items. Keep the whole file under ~80 lines.

> Bot-product specific note: ops state changes between sessions even when you do not touch the product. The Quick Resume should always reflect current deploy state, current incidents, and the single next action - whether that action is a code change or an ops check.

**Last updated:** {DATE}

## Quick Resume

The thirty-second orientation. Where the product stands right now, the single most important next action, any one thing a fresh session must know before touching {DOMAIN_TITLE}.

- **Deploy state:** {running, degraded, down, not yet deployed}
- **Last change:** {what shipped and when}
- **Next:** {single highest-priority action - code, deploy, or ops}
- **Watch:** {any open incident, deferred decision, or external risk}

## This Session

Tasks planned for the current session. Write them here BEFORE doing them. Check them off as you complete them.

- [ ] {First concrete task - replace this placeholder}

## Active

Work in progress that spans more than one session. Each item carries enough context to resume without reading the LOG. For a bot-product, this is usually: in-flight features, in-flight migrations, or unresolved incidents.

- {Active item - what it is, where it stands, what blocks it from completing}

## Queue

Tasks queued for future sessions, ordered roughly by priority. The next session pulls from the top. Bot-product queues commonly mix code changes, infra changes, and operational reviews.

- [ ] {Queued task}

## Incidents

Open or recent operational issues. Each entry: what happened, current state, next action. Resolved incidents rotate into `{DOMAIN}_LOG.md` or a dedicated `{DOMAIN}-INCIDENTS.md` leaf once they accumulate.

- {Incident - or "None open"}

## Recently Completed

The last few finished items, newest first. When this passes ~5 items, rotate the oldest into `{DOMAIN}_LOG.md`.

- {Completed item} ({DATE})
