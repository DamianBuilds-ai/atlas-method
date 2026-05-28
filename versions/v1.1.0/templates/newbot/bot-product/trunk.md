# {DOMAIN} - Reference Doc (Trunk)

> Trunk for the {DOMAIN_LOWER} bot-product domain. {DOMAIN_TITLE} is a live operational system - a bot, daemon, scheduled service, or similar product you run. This file holds the durable facts that do not change session to session: what the product is, its architecture at a glance, its interfaces, and where the active surfaces live. Day-to-day product work lives in `{DOMAIN}_PRODUCT_SPEC.md`. Day-to-day ops work lives in `{DOMAIN}_OPS.md`. Active session work lives in `{DOMAIN}_QUEUE.md`. Keep this trunk under ~500 lines; when it outgrows that, extract sections into leaves and link them from the Leaf Index below.

**Last updated:** {DATE}
**Status:** Setting up

## What This Product Is

{DOMAIN_DESCRIPTION}

Expand to one or two paragraphs once the product shape is clearer. Cover: what it does for users, who runs it (you), where it runs (host or platform), and the single sentence you would put in a README.

## Architecture at a Glance

The shortest possible answer to "how does this work?" One paragraph or a small list. Detail belongs in `{DOMAIN}_PRODUCT_SPEC.md` and `{DOMAIN}_OPS.md`.

- **Surface:** {how users interact - chat, web, CLI, API, scheduled job}
- **Core:** {the runtime - language, framework, key libraries}
- **State:** {databases, queues, caches, file stores}
- **Integrations:** {external APIs, webhooks, third-party services}

## Key References

The durable facts. Repository, deploy target, accounts, identifiers, the canonical URL. Things you look up but do not change often.

- **Repo:** {git URL or path}
- **Deploy target:** {host, platform, container name}
- **Primary surface URL:** {public URL or "n/a"}
- **Owner identity:** {service account, API key holder}
- **{Other reference - replace}**

## Operating Cadence

How this product gets touched. Some products are deploy-once-and-watch; others get changes every week. State the rhythm.

- **Deploy frequency:** {weekly, on-change, monthly}
- **Monitoring cadence:** {daily glance, weekly review, on-alert only}
- **Backup cadence:** {if state is durable - daily, weekly}

## Conventions

How things are done in this product. Naming patterns, branching model, deploy ritual, decisions already made so they are not re-litigated each session.

- {Convention one - replace with the first real convention}
- {Convention two}

## Related Domains

Other domains this product touches. Pointer-only - do not duplicate the other domain's content here.

- {Related domain - or "None - standalone"}

## Leaf Index

When this trunk grows past ~500 lines, split detailed sections into leaf docs and list them here. The index is how future sessions discover the leaves - a leaf does not exist until its trunk pointer exists.

| Leaf | Covers | Load when |
|------|--------|-----------|
| {DOMAIN}-{TOPIC}.md | {what it holds} | {what triggers reading it} |

> Common leaves for a bot-product domain as it matures: `{DOMAIN}-INTEGRATIONS.md` (third-party API quirks), `{DOMAIN}-INCIDENTS.md` (postmortems), `{DOMAIN}-COSTS.md` (running cost breakdown).

## Notes

Scratch space for context that has not earned a section yet. When a note recurs across three sessions, give it a real home in Conventions, Architecture, or a leaf.

- {First note}
