# {DOMAIN} - Product Spec

> What the product does, in enough detail that a fresh contributor (or a fresh session) can answer "what features ship today?" and "what is on the roadmap?" without digging into code. This is the product side of the split: the WHAT and the WHY. The ops side (HOW it runs in production) lives in `{DOMAIN}_OPS.md`. The active session work lives in `{DOMAIN}_QUEUE.md`.

**Last updated:** {DATE}

## Product Summary

One paragraph. What the product is, who it serves, the single problem it solves. If you cannot write this in one paragraph, the product scope is too large or not yet decided.

{DOMAIN_DESCRIPTION}

## Users and Surfaces

Who interacts with the product and how. A bot has chat surfaces; an API has clients; a scheduled service has consumers of its output.

| User type | Surface | Notes |
|-----------|---------|-------|
| {who} | {chat, web, API, file output} | {anything non-obvious} |

## Current Feature Set

Features that ship today. Each one: what it does, how it is invoked, the most common failure mode.

### Feature: {name}

- **Does:** {what it does for the user}
- **Invoked by:** {command, event, schedule, webhook}
- **Depends on:** {external services, config keys, other features}
- **Common failure:** {what tends to go wrong, and the symptom}

### Feature: {name}

- **Does:** ...
- **Invoked by:** ...
- **Depends on:** ...
- **Common failure:** ...

> Add a section per feature. Keep each one tight - if a feature needs more than half a page, it has earned its own leaf.

## Configuration Surface

The knobs users (or you) can turn without code changes. Environment variables, config files, runtime flags. Ops-side secrets and credential paths live in `{DOMAIN}_OPS.md`; this section covers user-facing or behaviour-shaping config.

| Key | Purpose | Default | Range |
|-----|---------|---------|-------|
| {KEY_NAME} | {what it controls} | {default value} | {valid values} |

## Data Model

The shapes the product reads and writes. One paragraph or a small table per shape. Detail belongs in a leaf once a shape grows past a handful of fields.

- **{Entity name}:** {what it represents, where it is stored, key fields}

## Roadmap

What is next, ordered by priority. Items move from Roadmap to `{DOMAIN}_QUEUE.md` when they become this-week or this-session work. Once shipped, they fold into the Current Feature Set above and rotate out of the Roadmap.

### Near term (next few weeks)

- [ ] {Feature or change} - {one line of context}

### Mid term (next few months)

- [ ] {Feature or change}

### Aspirational (no committed date)

- {Idea} - {why it would matter, what would unblock starting it}

## Non-Goals

The things this product will deliberately not do. Naming non-goals out loud stops them from quietly re-surfacing in every roadmap discussion.

- {Non-goal} - {why it is out of scope}

## Pointer

Ops state: `{DOMAIN}_OPS.md`. Active session work: `{DOMAIN}_QUEUE.md`. Trunk: `{DOMAIN}.md`.
