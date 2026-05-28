# {DOMAIN} - Handoff

> Session-to-session continuity for the {DOMAIN_LOWER} bot-product. Written at the end of every session. Read at the start of the next one (after the QUEUE). Short, factual, deliberately not exhaustive - the QUEUE carries the work, this file carries the why behind in-flight decisions and any partial state a next session needs to resume cleanly.

**Last updated:** {DATE}
**Last session goal:** {one line - what the previous session set out to do}
**Last session outcome:** {one line - what actually happened}

## What Just Shipped

The changes that landed in the last session. Be specific: file paths, commit hashes, config keys.

- {What changed}

## What Is In Flight

Work started but not finished. Each item: where the work stopped, what the next step is, any context the next session would otherwise lose.

- {In-flight item} - **next step:** {what to do} - **context:** {what would be hard to reconstruct}

## What Is Blocked

Work that cannot progress without an external input - waiting on an API key, a third-party fix, a user decision, a billing approval.

- {Blocker} - **needs:** {what unblocks it}

## Ops State Notes

Anything about deploy state, monitoring, or external services that the next session should know before touching the product. Include only what is non-obvious - the default state belongs in `{DOMAIN}_OPS.md`.

- {Note about current ops state}

## Decisions Made

Decisions taken this session that affect future work. Decision, the alternatives considered, the trade-off accepted.

- {Decision} - **alt:** {what was considered} - **trade-off:** {what was given up}

## Pointer

Active work: `{DOMAIN}_QUEUE.md`. Product spec: `{DOMAIN}_PRODUCT_SPEC.md`. Ops state: `{DOMAIN}_OPS.md`. Trunk: `{DOMAIN}.md`.
