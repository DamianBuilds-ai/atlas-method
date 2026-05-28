# {DOMAIN} - Reference Doc (Trunk)

> This is the trunk for the {DOMAIN_LOWER} business. It holds the durable facts: brand definition, ideal customer profile pointer, offer surface, channels, conventions. Active work lives in `{DOMAIN}_QUEUE.md`. Workstream detail (marketing, sales, ops, product, etc.) lives in per-workstream leaves. Keep this trunk under ~500 lines; when a section starts swelling, extract it to a leaf and link it from the Leaf Index below.

**Last updated:** {DATE}
**Status:** Setting up

## What This Business Is

{DOMAIN_DESCRIPTION}

Expand into one or two paragraphs once the shape is clearer. State the edges: what counts as `{DOMAIN_LOWER}` work and what does not. A business archetype usually has clear edges around offer, audience, and channels - name them here so future sessions do not re-litigate.

## Brand At A Glance

The one-liner version. The thing a stranger should hear in twenty seconds.

- **Name:** {DOMAIN_TITLE}
- **One-liner:** {What you do, for whom, with what outcome}
- **Why it exists:** {The point - the reason this business is worth running}
- **Voice:** {Two or three adjectives - tone, register, energy}

Longer brand work (positioning, story, manifesto) lives in a leaf like `{DOMAIN}-BRAND.md` when it earns the space. Do not pre-create it.

## Ideal Customer Profile

The single most-loaded reference doc in a business domain. Lives in its own file: `{DOMAIN}_ICP.md`. Read that file when targeting, qualifying, writing copy, or making product decisions. The trunk only carries the pointer.

- **ICP doc:** `{DOMAIN}_ICP.md`
- **Primary segment:** {The one customer type that matters most}
- **Disqualifiers:** {What makes someone not a fit}

## Offer Surface

What the business actually sells. Keep this list short and current - retired offers move out, experimental offers stay flagged.

| Offer | Type | Price band | Status |
|-------|------|------------|--------|
| {Offer one} | {product / service / subscription} | {price or "TBD"} | {live / experimental / retired} |

When this table outgrows ten rows, move it to `{DOMAIN}-OFFERS.md`.

## Channels

Where the business shows up. Each channel has an owner inside the business and a cadence.

- **{Channel one}:** {URL or handle} - {cadence, e.g. weekly post, daily story}
- **{Channel two}:** {URL or handle} - {cadence}

Channel-specific playbooks belong in workstream leaves (see Leaf Index).

## Conventions

How things are done here. Naming patterns, recurring decisions, things already settled so a session does not relitigate them.

- {Convention one - e.g. all proposals use template X}
- {Convention two - e.g. discovery calls are 30 min, free, capped at two per week}

## Related Domains

Other domains this business touches. Pointer-only - do not duplicate the other domain's content here.

- {Related domain - or "None - standalone"}

## Leaf Index

When the trunk grows past ~500 lines, split detailed sections into leaves and list them here. The index is how future sessions discover leaves; a leaf does not exist until its trunk pointer exists.

| Leaf | Covers | Load when |
|------|--------|-----------|
| `{DOMAIN}_ICP.md` | Ideal customer profile - segments, pain points, qualifiers, disqualifiers | Targeting, qualifying, copywriting, product decisions |
| `{DOMAIN}-{WORKSTREAM}.md` | Detailed workstream playbook (e.g. marketing, sales, ops, product, finance) | Working that specific workstream end-to-end |

> Start with one workstream leaf for the workstream currently consuming most session time. Add more only when the trunk shows actual swelling in that area.

## Notes

Scratch space for context that has not earned a section yet. When a note recurs across three sessions, give it a real home in Conventions, Channels, or a leaf.

- {First note}
