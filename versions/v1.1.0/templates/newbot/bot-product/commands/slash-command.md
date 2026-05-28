# /{SLASH_NAME} - {DOMAIN_TITLE} domain

<!-- Scaffolded by /newbot on {DATE}. Edit freely - this is your domain now. -->

{DOMAIN_DESCRIPTION}

This command loads the {DOMAIN_TITLE} domain context. {DOMAIN_TITLE} is a bot-product archetype: a live operational system. Sessions here mix code work, ops work, and roadmap thinking - the read list reflects that split.

---

## Read on session start

Read ONLY these files. Do not search the broader system - Atlas Method's domain isolation rule keeps the session lean.

1. `{DOMAIN}_QUEUE.md` - active work, current deploy state, open incidents. Always read.
2. `{DOMAIN}_HANDOFF.md` - last session's in-flight notes and decisions. Read if the file exists.
3. `{DOMAIN}.md` - trunk reference. Read on demand when a question needs durable facts the QUEUE does not carry.
4. `{DOMAIN}_PRODUCT_SPEC.md` - read on demand when the session is about features, roadmap, or user-facing behaviour.
5. `{DOMAIN}_OPS.md` - read on demand when the session is about deploy, runtime, secrets, monitoring, or incidents.

**Sequential processing.** Read fully, act fully, write the result, then move on. No batch-reading every doc at once.

**Mode-aware reads:** the QUEUE and HANDOFF always load. PRODUCT_SPEC and OPS load on demand based on the session's actual direction. If the user opens with "feature ideas" the spec loads; if they open with "the bot is acting weird" the ops doc loads. Do not pre-load both.

---

## Session opener

Open by reading the QUEUE's Quick Resume. Surface three things in one short paragraph:

1. **Deploy state** - is the product running and healthy right now?
2. **Open incidents** - any unresolved operational issue?
3. **Single highest-priority next action** - code change, ops task, or roadmap decision.

Then ask: *"Pick up the surfaced action, or take this somewhere else?"*

If the user surfaces an incident, treat that as the priority over any planned feature work - operational health beats feature velocity.

---

## What lives here, what does NOT

**Lives here:**
- Active work on {DOMAIN_TITLE} - code, deploys, ops.
- Feature ideas and roadmap items for {DOMAIN_TITLE}.
- Incidents and postmortems for {DOMAIN_TITLE}.
- Runtime config, secrets convention (not the values), deploy ritual.

**Does NOT live here:**
- Other products or domains - those have their own slash commands.
- Brand or marketing positioning - that belongs in a business-archetype domain if you run one.
- Long-form history older than the last few sessions - that belongs in `{DOMAIN}_LOG.md`.
- The literal secret values - those live in the secret store referenced by `{DOMAIN}_OPS.md`.

---

## Wrap

End a session with the standard wrap protocol from `procedures/wrap.md`. For a bot-product domain, the wrap pays special attention to two things:

- **Did anything ops-relevant change?** New env var, new external dependency, new runtime behaviour. Update `{DOMAIN}_OPS.md` before the wrap completes.
- **Did anything feature-relevant ship?** Move the item from PRODUCT_SPEC Roadmap to Current Feature Set, and out of the QUEUE.

Both updates are part of the wrap, not a "do it later" item.

---

## Pointer

Active work: `{DOMAIN}_QUEUE.md`. Handoff: `{DOMAIN}_HANDOFF.md`. Product spec: `{DOMAIN}_PRODUCT_SPEC.md`. Ops state: `{DOMAIN}_OPS.md`. Trunk: `{DOMAIN}.md`. Methodology: `docs/ATLAS_METHOD.md`. Archetype rationale: `docs/NEWBOT-PROTOCOL.md` (Bot-product section).
