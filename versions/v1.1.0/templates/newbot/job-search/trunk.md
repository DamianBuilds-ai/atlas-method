# {DOMAIN} - Reference Doc (Trunk)

> This is the trunk for the {DOMAIN_LOWER} job-search domain. It holds the durable facts of an active job hunt - the strategy, the target market, the search system, the pipeline shape. Day-to-day pipeline state lives in `{DOMAIN}-APPLICATIONS.md`. Positioning and voice live in `{DOMAIN}-CAREER.md`. Active session work lives in `{DOMAIN}_QUEUE.md`. Per-opportunity dossiers live in `{DOMAIN}-{COMPANY}-OPPORTUNITY.md` leaves. Keep this trunk under ~500 lines.

**Last updated:** {DATE}
**Status:** Setting up

## What This Domain Is

{DOMAIN_DESCRIPTION}

Job-search is an active-hunt archetype: you are running many applications across many companies in parallel, each with its own state, its own people, its own clock. The trunk holds the system; the branches hold the pipeline; the leaves hold the per-company depth.

## Target Market

The shape of the hunt. Roles, industries, geographies, comp band, work modality. This is the filter you apply when a new posting lands.

- **Roles:** {Primary role title, plus acceptable adjacencies}
- **Industries:** {Target industries, plus any hard exclusions}
- **Geography:** {Locations, remote tolerance, relocation appetite}
- **Comp band:** {Floor, target, ceiling - currency explicit}
- **Modality:** {Remote / hybrid / on-site preferences}
- **Hard nos:** {Anything that auto-rejects a posting}

## Search Sources

Where new postings come from. Each source has its own cadence and signal quality.

- **{Job board one}:** {How you search it, search-string convention, cadence}
- **{Job board two}:** {Same}
- **Direct company watchlist:** {Companies you check directly even without a posted role}
- **Network:** {People who forward roles, recruiters in regular contact - point to {DOMAIN}-CAREER.md for the relationship side}

## Application Voice

How you write. The voice is documented in `{DOMAIN}-CAREER.md` - this section is just a pointer plus the one-line summary.

- **One-line voice:** {e.g. "Direct, builder's-pride, evidence over claim"}
- **Full spec:** `{DOMAIN}-CAREER.md`

## Pipeline Conventions

How an opportunity moves through the system. The states + the transitions + what gets written where.

- **States:** lead -> applied -> screening -> interviewing -> offer -> closed (won / lost / withdrawn)
- **Where state lives:** `{DOMAIN}-APPLICATIONS.md` pipeline table. The leaf doc for any opportunity past `screening` carries the depth.
- **When to create a leaf:** When an opportunity reaches `screening` (or sooner if it deserves a real research pass). Leaf path: `{DOMAIN}-{COMPANY}-OPPORTUNITY.md`. Copy from `{DOMAIN}-{COMPANY}-OPPORTUNITY-template.md`.
- **When to retire a leaf:** When the opportunity closes. Move the leaf to an archive folder or prepend `_archived-` to the filename. Do not delete - the contacts and the prep work compound across future hunts.

## Cadence

The rhythm of the hunt. The system breaks if the cadence breaks.

- **Daily:** Check active screening / interview state. Respond to any thread that needs a reply same-day.
- **Weekly:** Triage new postings from all sources. Promote the worth-pursuing ones to `lead`. Cull the dead leads.
- **Monthly:** Review the funnel. Where are applications dropping out? Is the targeting wrong, the voice wrong, the volume wrong?

## Key References

Durable facts you look up repeatedly.

- **Resume versions:** {List the active resume variants - e.g. "v1.0 Generalist, v1.1 Specialist"}
- **Portfolio link:** {URL}
- **LinkedIn:** {URL}
- **Reference roster:** {Who you ask for references, when, in what order}
- **Salary research:** {Where you check market rates}

## Related Domains

Other domains this one touches.

- {Related domain - e.g. "{PROFILE_DOMAIN} for personal facts that go on application forms" - or "None - standalone"}

## Leaf Index

The per-opportunity leaves. One row per active opportunity. Closed opportunities drop off the table; their leaf files stay on disk (archived).

| Leaf | Company | Role | Stage | Load when |
|------|---------|------|-------|-----------|
| `{DOMAIN}-{COMPANY}-OPPORTUNITY.md` | {Company} | {Role title} | {lead / applied / screening / interviewing / offer} | Working that opportunity |

> No active leaves yet? Delete the placeholder row. Add a row each time you create a leaf from the template.

## Notes

Scratch space for hunt-level context that has not earned a section yet. Patterns you see across opportunities. Things to watch in the market. When a note recurs across three sessions, give it a real home.

- {First note}
