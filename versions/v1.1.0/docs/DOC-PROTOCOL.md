# DOC-PROTOCOL.md  -  Leaf Management Protocol

> **In this set:** [Methodology](ATLAS_METHOD.md) · [Agent patterns](AGENT-PATTERNS.md) · **Doc protocol** · [Hooks](HOOKS.md) · [↩ Repo root](../../../README.md)

**Applies to:** All sub-docs (leaves) across all domains.
**Trigger:** When any leaf approaches ~280 lines.

---

## Why 280, Not 300

Don't wait until you're already over. At 280 you still have room to think. At 300 you're already in the red and every edit makes it worse. Catching it early is always the easier fix.

---

## The Protocol

### Step 1  -  Prune (always try this first)

Before creating any new files, try to get the leaf back under 300 through pruning alone.

Pruning is not just deletion. It means:

- **Remove** stale or outdated approaches  -  if something was tried and didn't work, one line in "Decided Against" is enough. The full story doesn't need to live in the leaf.
- **Consolidate** duplicate or overlapping content  -  if the same concept appears in two places, merge it into one clear source of truth and cut the other.
- **Compress** verbose explanations into tighter summaries  -  if a paragraph can be a sentence without losing meaning, make it a sentence.
- **Archive** confirmed-stable content that's no longer actively referenced  -  if a section existed to solve a problem that's now solved and nobody reads it anymore, it did its job. Move it to the domain LOG if it belongs anywhere, or remove it entirely.

**Goal:** Get back under 300 without touching the file structure.

---

### Step 2  -  Split (only if pruning wasn't enough)

If the leaf is still over 300 after a genuine prune pass, split it.

**How to decide where to cut:**

1. **Topic boundary first**  -  look for natural seams in the content. If two sections cover clearly different subjects, that's your split line.
2. **Frequency of use as tiebreaker**  -  if topic weight is roughly equal, keep the frequently-read sections in the original leaf. Move the deep-reference or rarely-needed content to the new one. The original leaf stays the fast path; the new leaf is the deep dive.

**Naming the new leaf:**
`{DOMAIN}-{TOPIC}.md`  -  e.g. `DEV-DATABASE.md`, `DEV-TOOLS-REFERENCE.md`
Keep it specific. The name should tell you exactly what's inside.

---

### Step 3  -  Update after splitting

After any split, update three things:

1. **The branch** (domain doc)  -  add the new leaf to the sub-doc reference table with a "Read when" note.
2. **CLAUDE.md System Files**  -  add the new leaf to the domain's leaf list so the root knows it exists.
3. **The original leaf**  -  add a one-line cross-reference at the top of any section that was split: `-> See {NEW-LEAF}.md for {topic}.`

> [!IMPORTANT]
> Don't skip step 2. If the root doesn't know about a leaf, the next session won't either.

---

## Quick Reference

| Situation | Action |
|-----------|--------|
| Leaf hits ~280 lines | Start a prune pass |
| Still over 300 after pruning | Split by topic, frequency as tiebreaker |
| Split complete | Update branch + CLAUDE.md + cross-reference |
| Unsure what to prune | Ask  -  don't guess at what's still useful |

---

## Cross-Domain Leaves

A cross-domain leaf documents a coordination surface between two domains. Examples: a Finance domain's data shown on a Web domain's dashboard, or two psychological-companion domains sharing joint context.

### When to create a cross-domain leaf

Any of these triggers extraction:
- Two writers - both domains regularly write to the same surface
- Repeated boundary rule - the same coordination pattern recurs in 3+ sessions
- Architect ratification - a formal handshake spec emerges (a documented pipeline contract between two domains)

### Naming patterns

| Pattern | Use when | Example |
|---------|----------|---------|
| `{REQUESTER}-{HOST}.md` | Co-owned contract, asymmetric ownership | `FINANCE-WEB.md` |
| `{A}_{B}_SHARED.md` | Symmetric ownership, joint surface | `COMPANION_REFLECTION_SHARED.md` |
| `{A}-{B}-PIPELINE.md` | Architect-ratified pipeline spec | `WEB-STUDIO-PIPELINE.md` |

### Creation rule

- **Requester creates the leaf.** The domain that needs the coordination owns the initial draft.
- **Host reviews scope.** The domain providing the support confirms what's in scope.
- **Both trunks list the leaf** in their routing tables. If only requester lists it, host drifts silently.
- **Exception:** Neutral infrastructure contracts (shared data-contract docs) are owned by the architect role.

### Update ownership

Whoever changes the surface updates the leaf in the same change. No "owned by domain X" - cross-domain leaves are joint.

---

## Step 4 - Naming the file

Three patterns at root, plus subdirectory option. Choose by structural intent.

### Pattern 1 - Cross-domain leaf (`{REQUESTER}-{HOST}.md`)

When one domain asks another to build, host, or run something, the requesting domain creates a cross-domain leaf at root. Both tokens are ALL-CAPS and BOTH are real domains in CLAUDE.md's isolation table.

- Example: `FINANCE-WEB.md` - a Finance domain asks a Web domain to host its site/widget.
- Both trunks list the leaf in their routing table (the both-trunks-list-it invariant).

### Pattern 2 - Content leaf (`{DOMAIN}-{TOPIC}.md`)

When a domain's reference doc grows past 300 lines and a coherent section needs its own file. Both tokens ALL-CAPS. Second token is NOT a domain - it's a topic, tool, or area within the domain.

- Example: `DEV-DATABASE.md`, `DEV-RULES.md`, `FINANCE-TAX.md`
- Disambiguation from Pattern 1: check the second token against CLAUDE.md's domain isolation table. If absent, it's a content leaf.

### Pattern 3 - Structural sub-track flat (`{DOMAIN}_{COMPONENT}_{VARIANT}.md`)

When a domain has 1-3 small flat sub-tracks - script variants, profile flips, single-file branches. Underscore-only, no hyphens. Reads as a structural component, not a content leaf.

- Example: `OUTREACH_SCRIPT_VARIANT_A.md`, `OUTREACH_SCRIPT_VARIANT_B.md`
- Threshold: max 3 such files per parent component before considering subdirectory.

### Pattern 4 - Sub-track subdirectory (`{domain-lowercase}/{bucket}/{slug-lowercase}.md`)

When a sub-track has 4+ entries OR each sub-track has multiple files OR the sub-track is its own slash command with scout fleets and personality.

- Example: `learning/topics/some-course.md`, `learning/progress/some-course.md`
- Buckets are bucket-types, not topics: `topics/`, `progress/`, `misses/`, `banks/`, `handoffs/`.
- File slugs are lowercase-hyphenated.

### Reserved usage

Hyphen at root between ALL-CAPS tokens is RESERVED for Patterns 1 and 2. Sub-tracks at root use underscore-only (Pattern 3). Larger sub-track sets go in subdirectories (Pattern 4). This prevents a sub-track filename from colliding with the Pattern 1 cross-domain shape.

### Slash command vs $ARGUMENT

Sub-tracks can surface via a separate slash command or as an argument to the parent. Choose deliberately.

**Use a separate slash command (`/parent-subtrack` style) when the sub-track:**
- Has its own scout fleet or session-start dispatch
- Needs different personality / voice
- Loads a wholly different reference set (topic config, miss log, progress doc)
- Has its own tool budget or model tier
- Needs distinct context isolation from the parent

**Use $ARGUMENT (`/parent subtrack` style) when the sub-track:**
- Shares the parent's full context and personality
- Switches only a profile / dataset / script / variant within the same loaded context
- Is one of 2-5 small variants where the parent file is the central one
- Doesn't need different scout dispatch

**Decision tree:**
```text
Does the sub-track need a different scout fleet / personality / context isolation?
|-- YES: separate slash command (/parent-subtrack)
|-- NO: shared scouts, same personality, just a profile flip?
        |-- YES: $ARGUMENT (/parent subtrack)
        |-- Mixed: separate slash command (default to clean split)
```

---

## What This Doesn't Cover

- **Branch size**  -  branches (domain docs like `DEV.md`) can be longer than 300 lines. They're the connective tissue. No hard cap, but if a branch becomes unwieldy, apply the same logic: prune first, then consider whether the branch itself needs sub-branches.
- **Queue and Log files**  -  these are living documents with different rules. This protocol applies to reference docs (leaves), not queues or logs.
- **The root**  -  CLAUDE.md is the root and has no size limit enforced here. Keep it lean anyway  -  every session reads it in full.
