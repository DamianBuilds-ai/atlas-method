# /{SLASH_NAME} - {DOMAIN_TITLE} domain

<!-- Scaffolded by /newbot on {DATE}. Edit freely - this is your domain now. -->

{DOMAIN_DESCRIPTION}

This command loads the {DOMAIN_TITLE} job-search domain. Job-search is an active-hunt archetype: many applications across many companies, each with its own clock. The slash command loads the hunt-level docs at session start; per-opportunity leaves load on demand when you name a company.

---

## Read on session start

Read ONLY these files. Domain isolation keeps the session lean.

1. `{DOMAIN}_QUEUE.md` - active hunt-level work. Always.
2. `{DOMAIN}-APPLICATIONS.md` - the live pipeline. Always. This is the operational dashboard.
3. `{DOMAIN}_HANDOFF.md` - last session's notes. Always, if it exists.
4. `{DOMAIN}.md` - trunk reference. Only when a question needs the hunt strategy or conventions.
5. `{DOMAIN}-CAREER.md` - positioning and voice. Load on demand when writing a cover letter, tuning resume bullets, drafting a recruiter reply, prepping interview talking points.

**Per-opportunity leaves load on demand.** When the user names a specific company in the session, load `{DOMAIN}-{COMPANY}-OPPORTUNITY.md` for that company - not before. Do not pre-load every leaf at session start.

**Sequential processing.** Read fully, act fully, write the result, then move to the next item.

---

## Session opener

1. Read the QUEUE's Quick Resume.
2. Read the Funnel Summary at the top of `{DOMAIN}-APPLICATIONS.md`.
3. Surface in one short paragraph: the funnel snapshot, the highest-priority next action from the QUEUE, and any in-flight item from the HANDOFF that has a date pressure today.
4. Ask: *"Pick up the highest-priority thread, work a specific opportunity, or triage new leads?"*

If the user names a company, load that opportunity's leaf and proceed. If the user picks "triage", read the Leads section of `{DOMAIN}-APPLICATIONS.md` and walk through them one at a time.

Do not deliver a long preamble. The Funnel Summary plus Quick Resume is the orientation.

---

## Common session modes

This archetype runs in a few recognisable shapes. The opener adapts based on what the user picks.

- **Triage:** Walk Leads one at a time. For each: promote to Applied (with action steps) or cull. End by reporting how many promoted, how many culled.
- **Application:** User wants to apply to a specific role. Load the leaf if it exists, create one from `{DOMAIN}-{COMPANY}-OPPORTUNITY-template.md` if not. Tune the resume variant choice. Draft the cover letter pulling voice from `{DOMAIN}-CAREER.md`. Log the send in the leaf's Application Trail and update the pipeline row.
- **Interview prep:** User names a company with an upcoming interview. Load the leaf. Read the Interview Log for prior rounds. Build the prep block for the upcoming round - talking points, questions for them, risks to address.
- **Interview debrief:** User just finished an interview. Open the leaf, fill the Debrief block for that round, update the pipeline row's Next Step.
- **Follow-up batch:** User wants to check the funnel for stale items. Walk Applied + Screening looking for rows past their cadence threshold. For each: send a follow-up or move to Closed.
- **Weekly review:** Walk every section of `{DOMAIN}-APPLICATIONS.md`. Cull dead rows. Surface any pattern - sources that are not producing, stages where applications keep dying, voice that may need a tune.

---

## What lives here, what does NOT

**Lives here:**
- Active {DOMAIN_LOWER} hunt - pipeline, per-opportunity work, positioning, voice.
- Recurring application facts (citizenship, work authorization, etc).
- Network roster for the hunt.

**Does NOT live here:**
- General career identity beyond the hunt - if you have a broader personal-profile domain, that owns the year-scale identity.
- Compensation history / tax detail - separate domain if you keep one.
- Closed opportunities older than the rolling window - archive the leaf (`_archived-` prefix) and let the row fall out of `{DOMAIN}-APPLICATIONS.md`.

---

## Wrap

End a session with the standard wrap from `procedures/wrap.md`. Specific to job-search:

- Update the pipeline rows in `{DOMAIN}-APPLICATIONS.md` for every opportunity touched this session.
- Update the Application Trail in every leaf touched.
- Refresh the Funnel Summary numbers at the top of `{DOMAIN}-APPLICATIONS.md`.
- Refresh the HANDOFF's Pipeline Snapshot.
- If any opportunity closed: log the Outcome block in its leaf, move its row to Closed, decide whether to archive the leaf.

---

## Pointer

Hunt strategy + conventions: `{DOMAIN}.md`. Live pipeline: `{DOMAIN}-APPLICATIONS.md`. Voice + positioning: `{DOMAIN}-CAREER.md`. Per-opportunity dossier: `{DOMAIN}-{COMPANY}-OPPORTUNITY.md`. Per-opportunity template: `{DOMAIN}-{COMPANY}-OPPORTUNITY-template.md`. Methodology: `docs/ATLAS_METHOD.md`. Archetype rationale: `docs/NEWBOT-PROTOCOL.md` (Job-search section).
