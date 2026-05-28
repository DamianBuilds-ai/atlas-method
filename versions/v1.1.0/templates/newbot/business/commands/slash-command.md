# /{SLASH_NAME} - {DOMAIN_TITLE} business

<!-- Scaffolded by /newbot on {DATE}. Edit freely - this is your domain now. -->

{DOMAIN_DESCRIPTION}

This command loads the {DOMAIN_TITLE} business domain context. It is a business archetype: brand, ICP, pipeline, campaigns, and workstream playbooks.

---

## Read on session start

Read ONLY these files. Do not search the broader system - Atlas Method's domain isolation rule keeps the session lean.

1. `{DOMAIN}_QUEUE.md` - active work, pipeline, campaigns. Always.
2. `{DOMAIN}_HANDOFF.md` - last session's notes. Always, if the file exists.
3. `{DOMAIN}.md` - trunk reference. Only if a question needs durable facts the QUEUE does not carry.
4. `{DOMAIN}_ICP.md` - ideal customer profile. Load on targeting, qualifying, copy, pricing, or product decisions.
5. `{DOMAIN}-{WORKSTREAM}.md` - workstream leaf (marketing, sales, ops, product, etc.). Load only the leaf for the workstream this session is working.

**Sequential processing.** Read fully, act fully, write the result, then move to the next item. No batch-reading every workstream leaf in case one might be relevant.

---

## Session opener

Open by reading the QUEUE's Quick Resume + the HANDOFF's Latest block. Surface the single highest-priority next action - usually the top Pipeline row, the active campaign needing attention, or the top Queue item. Then ask: *"Pick up that thread, or work on something else?"*

If the user takes the surfaced action, proceed. If they pivot, ask one clarifying question (often: "which workstream?"), load the matching leaf if applicable, then proceed.

Do not deliver a long preamble. The Quick Resume is the orientation. The user wrote it for themselves.

---

## Mode-based leaf loading

Business work splits cleanly along workstreams. Pick the mode from the user's first message; load only that workstream's leaf.

<!--
Edit the workstream list below to match YOUR business. The five rows here are STARTER EXAMPLES, not a fixed taxonomy. Common workstreams include: marketing, sales, ops, product, finance, customer-success, partnerships, hiring, content, fulfillment, R&D. Add a row per workstream you actually run; delete rows you do not. The trigger phrases column is what the slash command will pattern-match against the user's first message to pick a mode.
-->

| Mode | Trigger phrases | Load |
|------|------------------|------|
| marketing | "campaign", "content", "post", "ad", "audience" | `{DOMAIN}-MARKETING.md` |
| sales | "lead", "deal", "proposal", "pipeline", "discovery call" | `{DOMAIN}-SALES.md` |
| ops | "process", "ops", "delivery", "fulfillment", "tooling" | `{DOMAIN}-OPS.md` |
| product | "offer", "product", "service", "pricing", "package" | `{DOMAIN}-PRODUCT.md` |
| finance | "invoice", "cashflow", "PnL", "expenses", "tax" | `{DOMAIN}-FINANCE.md` |
| default | (none of the above) | trunk + QUEUE only |

> The workstream leaves do not have to exist on day one. Start with the workstream consuming most session time, create that leaf from the workstream template, and add others as they earn the space.

---

## What lives here, what does NOT

**Lives here:**
- Active pipeline, campaigns, and workstream tasks for {DOMAIN_LOWER}.
- Brand, ICP, offer surface, channels, conventions.
- Workstream playbooks (one leaf per workstream).

**Does NOT live here:**
- Other businesses or domains - those have their own slash commands.
- Personal life, finances, or learning - separate domains.
- Customer-specific deliverables under active engagement - those usually belong in a per-client folder or a separate `meister`-style domain, not in the business trunk.

---

## Wrap

End a session with the standard wrap protocol from `procedures/wrap.md`. Update the QUEUE (Quick Resume + Pipeline + Active Campaigns + check off This Session), write the HANDOFF Latest block, rotate completed items if Recently Completed has grown past five.

---

## Pointer

Full reference: `{DOMAIN}.md`. Active work: `{DOMAIN}_QUEUE.md`. ICP: `{DOMAIN}_ICP.md`. Workstream leaves: `{DOMAIN}-{WORKSTREAM}.md`. Methodology: `docs/ATLAS_METHOD.md`. Archetype rationale: `docs/NEWBOT-PROTOCOL.md` (Business section).
