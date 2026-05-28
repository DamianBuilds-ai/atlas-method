# {DOMAIN} - Status (Current State)

> The snapshot. What the character or account looks like RIGHT NOW. Read first every session - the rest of the work needs this as ground truth. Update at the end of every play session, or any time a notable change happens (level up, big drop, milestone unlock). Keep under ~150 lines; if it grows past that, extract historical state into `{DOMAIN}_LOG.md` and keep this file purely current.

**Last updated:** {DATE}

## Snapshot

The thirty-second orientation. If a fresh session can read only this section, what must it know?

- **Character / Account:** {Name, server / region, faction or class if relevant}
- **Level / Tier:** {Current level, prestige, rank, or equivalent}
- **Location:** {Where the character is parked - zone, instance, hub}
- **Active mission:** {What you are mid-way through - a questline, a grind, an unlock}
- **Currency:** {Primary currencies and amounts - gold, ISK, plat, credits}

## Character / Account Detail

Expanded view of the character or account state. Class, spec, build choices, key stats.

- **Class / Profession:** {e.g. Warrior - Arms spec}
- **Build / Loadout:** {Talent tree, ability rotation, gear set name}
- **Primary stats:** {The numbers that matter for your build}

## Gear / Loadout

What is equipped right now. Slot by slot, or the summary if slot-by-slot is too much.

| Slot | Item | Tier / iLvl | Source | Replace target |
|------|------|-------------|--------|----------------|
| {Slot} | {Item name} | {Level} | {Where it came from} | {What you are aiming to swap to, if anything} |

## Resources

Currencies, materials, consumables. The stuff you spend or save.

- **{Currency name}:** {Amount} - {what you are saving for, if anything}
- **{Material name}:** {Amount} - {what it is used for}

## Active Threads

Anything in-progress that spans more than one session. Each thread carries enough context to resume without reading the handoff.

- **{Thread name}:** {What it is, where it stands, what blocks it, the next concrete step}

## Recent Milestones

Last few notable events. Keep it short - rotate older entries to `{DOMAIN}_LOG.md` when this grows past ~5.

- {Milestone} ({DATE})

## Watch

Anything to keep an eye on. Patch landing soon, event ending, a finite window.

- {Watch item - or "Nothing right now"}
