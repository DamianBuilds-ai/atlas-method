# Leaf Creation Procedure

**Trigger phrases:** "should this be a leaf", "extract to leaf", "this keeps coming up", "this is getting too long", "where should this live", "we keep loading this slice".

**Also fires automatically at:** wrap protocol Step 1b (the leaf check between QUEUE update and HANDOFF update). Step 1b asks three questions; any "yes" routes here.

**Use when:** content has accumulated that future sessions need referenceable, but is currently buried in a QUEUE, scattered across session memory, or repeating across multiple domain docs. The procedure decides IF a leaf is warranted and HOW to create it cleanly.

A leaf is a specialized sub-doc that hangs off a domain trunk. Leaves win when they let future sessions load only the slice they need. Leaves rot when they exist but no trunk points to them.

---

## Four trigger types - any one is enough to extract

The methodology historically only covered Trigger 1 (size threshold). Triggers 2-4 are the silent failure modes that produced multi-hundred-line QUEUEs.

- **1. Size threshold.** Trunk over 250 lines, QUEUE over 200 lines, or any single section over 80 lines. The file's mass is the signal.
- **2. Reference accumulation.** A QUEUE section contains content future sessions will need to LOOK UP, not act on - completed architecture notes, spec context, repeated Quick Resume blocks, historical fixes still relevant. The QUEUE was meant to be the active worklist; reference content silently piling up there is the gap.
- **3. Topic recurrence.** The same subject appears in 3+ sessions without a dedicated file. Each session re-explains the topic from scratch or scout-fetches the same scattered context. That repetition is the signal that a leaf would carry the load.
- **4. Cross-domain reference.** Domain A repeatedly needs context from domain B (scouts hitting the same slice 2+ sessions in a row). The cross-domain leaf protocol covers this case - see the cross-domain section below.

If any single trigger fires clearly, extract. Do not wait for two or three to compound.

---

## Decision tree - when to extract

1. Is the candidate content under ~30 lines? -> Probably keep inline; add a section header in the host file instead.
2. Is the candidate content reference (look-up) or active (act-on)? -> Active stays in QUEUE. Reference moves to leaf.
3. Will another session need this exact slice without the surrounding QUEUE chatter? -> Yes means leaf.
4. Does it span two domains' work surfaces? -> See cross-domain rules. Leaf is named per requester-first or shared-state convention.
5. Is this the third time the topic has come up? -> Extract. Future sessions will thank you.
6. Is the extraction creating a leaf that will only ever be read by a slash subcommand? -> The slash subcommand body might be the right home; consider that before creating a new file.

If two or more of (2 reference, 3 yes, 5 yes) apply, do not deliberate further. Extract.

---

## Extraction steps

1. **Identify the source location.** Which QUEUE, trunk, or session file is currently carrying this content? The source location dictates which trunk gets a pointer (see Step 5).

2. **Decide leaf type.** Three categories:
   - **Domain-internal leaf.** Lives under one domain. Name format: `{DOMAIN}-{TOPIC}.md` (e.g. `READING-SHELF.md`) or `{DOMAIN}_{SUBSECTION}.md` if it's structural rather than topical.
   - **Cross-domain leaf.** Two domains share. Three naming patterns - requester-first contract `{REQUESTER}-{HOST}.md`, symmetric shared state `{A}_{B}_SHARED.md`, or relationship spec `{A}-{B}-PIPELINE.md`. See the cross-domain section.
   - **Sub-track leaf.** Under a trunk that already has a heavy-leaf taxonomy. Name per that trunk's existing convention.

3. **Pick the name** per the naming convention:
   - **Underscore (`_`)** = structural relation (parent-child within a domain): `READING_QUEUE.md`, `READING_HANDOFF.md`, `FITNESS_PERSONALITY.md`.
   - **Hyphen (`-`)** = topical leaf or cross-domain contract: `READING-SHELF.md`, `FITNESS-NUTRITION.md`, `READING-FITNESS-SHARED.md`.
   - When in doubt: hyphen for topics, underscore for trunk-adjacent structural files.

4. **Create the leaf file.** Move the content out of its current home. Add a one-line frontmatter or top header that names the parent trunk and one-sentence purpose. Keep the leaf focused: one topic, under 300 lines if possible.

5. **Update the trunk pointer.** This is the critical step - if the trunk does not list the leaf, future sessions will not find it. The leaf is effectively orphaned even though the file exists. Add a row to the trunk's routing table or a one-line pointer in the relevant section.

6. **Update the CLAUDE.md domain isolation table** if the leaf changes what files a domain reads at startup. Most leaves do NOT need this (they load on demand via the trunk). Cross-domain leaves and broadcast leaves DO need it.

7. **Verify** by closing context and re-opening the relevant slash command. Does the leaf get found via the trunk? If not, the pointer is wrong. Fix the pointer before declaring the extraction done.

---

## Cross-domain creation rule

When the leaf spans two domains:

- **Requester creates the leaf.** The domain that needs to pull context from another domain repeatedly is the consumer/requester - that domain owns the file. Example: a Reading domain that needs Fitness habit data in every session creates and owns `READING-FITNESS.md`.
- **Host reviews scope.** The producer domain (Fitness in the example) reviews that the leaf accurately represents the host's surface. Host does not block creation; host can flag a misread.
- **BOTH trunks list it.** This is the invariant that prevents silent drift. If only the requester's trunk lists the leaf, the host's sessions will not load it when doing work that affects the shared surface, and the leaf rots. Update both trunks (or both CLAUDE.md Domain Isolation rows) in the same change.
- **Exception: neutral infrastructure contracts.** When the leaf governs write surfaces shared by 3+ domains (e.g. a shared data-contract doc), an architecture owner holds it. Section ownership inside the doc is split per the contract doc's own header. The Architect signs off on invariant changes only.

Three creation criteria for cross-domain leaves (ALL three required):
1. Two writers in the same surface (writers, not readers).
2. The boundary rule is being repeated across both domains' docs.
3. Scout dispatches are happening 2+ sessions in a row to fetch the same slice.

Do NOT pre-create cross-domain leaves for hypothetical sharing.

---

## Common pitfalls

- **Forgetting to update the trunk pointer.** The leaf exists, the content is moved, the file is on disk, but no trunk lists it. Future sessions never find it. This is the #1 leaf failure mode. Step 5 is non-negotiable.
- **Wrong separator.** Underscore vs hyphen matters because grep patterns and discovery rely on the convention. Underscore for structural relation, hyphen for topical or cross-domain.
- **Listing only on requester's trunk for cross-domain leaves.** Host trunk needs the pointer too. Without it, host sessions drift.
- **Extracting too early.** A 60-line section is not a leaf; it is a section header. Wait for the trigger conditions to actually fire.
- **Extracting too late.** A multi-hundred-line QUEUE is the symptom of multiple missed extractions over time. Step 1b in the wrap protocol catches this if you actually run it.
- **Naming on host preference instead of requester-first.** "The Fitness domain has Reading work" is a true statement but the file name should answer "which domain initiated this dependency?" The requester is the answer.
- **Creating a new top-level file when a section in an existing protocol doc or index would do.** The forest is large already; extend an existing tree before planting a new one.
