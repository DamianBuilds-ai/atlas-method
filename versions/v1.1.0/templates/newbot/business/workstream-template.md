# {DOMAIN} - {WORKSTREAM} (Leaf)

> Per-workstream leaf for the {DOMAIN_LOWER} business. One workstream per leaf - marketing, sales, ops, product, finance, partnerships, hiring, etc. The trunk (`{DOMAIN}.md`) carries the business-wide facts; this leaf carries the playbook for the {WORKSTREAM} workstream specifically. Load this file only when the session is working on {WORKSTREAM}. Keep under ~300 lines; when a section swells, split it into a sub-leaf (e.g. `{DOMAIN}-{WORKSTREAM}-{SUB}.md`) and link from the Sub-leaf Index below.

**Last updated:** {DATE}
**Workstream:** {WORKSTREAM}
**Status:** Setting up

## Purpose

What this workstream is responsible for inside the business. One or two sentences. State the edges - what the workstream owns end-to-end and where the handoff to another workstream happens.

> Example shape - replace with your own:
> *Marketing owns audience-building and demand generation: content, channels, brand expression, top-of-funnel measurement. It hands off to Sales when a lead raises a hand.*

## Operating Cadence

The rhythm. What happens daily, weekly, monthly, quarterly inside this workstream. A cadence written down outlasts a cadence carried in the head.

- **Daily:** {what runs every day - or "none"}
- **Weekly:** {weekly ritual - planning, review, content drop}
- **Monthly:** {monthly review or report}
- **Quarterly:** {strategy review, OKR set, segment revisit}

## Playbooks

Step-by-step recipes for the recurring work. Each playbook is a named, repeatable process - copy it, adapt it, run it. New playbooks earn their place once a process runs three times.

### Playbook: {NAME}

**Use when:** {trigger - the moment this playbook applies}
**Owner:** {who runs it - or "self"}
**Steps:**
1. {Step one}
2. {Step two}
3. {Step three}

**Verify:** {how you know the playbook ran clean}

> Add more playbook blocks as the workstream matures. When the count passes ~6, extract each to its own sub-leaf and link from the Sub-leaf Index.

## Assets & Templates

Reusable artifacts this workstream depends on. Copy decks, email templates, brief templates, proposal templates, contract templates, dashboard URLs. Pointer-only - the asset lives in its real home.

| Asset | Location | Last updated |
|-------|----------|--------------|
| {Asset name} | {path or URL} | {DATE} |

## Metrics

How this workstream is measured. Two or three metrics, not twelve. The metrics you actually check, not the metrics you wish you checked.

- **{Metric one}:** {definition} - current: {value} ({DATE})
- **{Metric two}:** {definition} - current: {value} ({DATE})

## Constraints & Decisions

Things already settled inside this workstream so they are not re-litigated each session. Pricing rules, channel choices, voice rules, tool stack picks.

- {Decision one - what was decided, when, why}
- {Decision two}

## Open Questions

Live questions specific to this workstream. Different from the QUEUE (which holds tasks) - these are unresolved decisions or hypotheses to test.

- {Open question one}

## Related Workstreams

Other workstreams this one hands off to or depends on. Pointer-only.

- **{Other workstream}:** {what the handoff looks like}

## Sub-leaf Index

When this leaf grows past ~300 lines, split sections into sub-leaves and list them here.

| Sub-leaf | Covers | Load when |
|----------|--------|-----------|
| `{DOMAIN}-{WORKSTREAM}-{SUB}.md` | {what it holds} | {what triggers reading it} |

> Delete the table row above and add real entries as the workstream grows. Do not pre-create sub-leaves.

## Notes

Scratch space for workstream context that has not earned a section yet. When a note recurs across three sessions, give it a real home in a Playbook, in Constraints & Decisions, or in a sub-leaf.

- {First note}
