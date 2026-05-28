# {DOMAIN} - Applications (Active Pipeline)

> The live pipeline view. One table per stage, newest activity at the top within each stage. Each row points to the per-opportunity leaf doc once one exists. This file is the operational dashboard of the hunt - read every session, updated every session.

**Last updated:** {DATE}

## Funnel Summary

- **Leads:** {n}
- **Applied:** {n}
- **Screening:** {n}
- **Interviewing:** {n}
- **Offers:** {n}
- **Closed (last 30 days):** {n won / n lost / n withdrawn}

---

## Leads

Postings or companies worth pursuing but not yet applied to. Promote up the table when you apply. Cull when stale (~14 days untouched).

| Company | Role | Source | Date added | Notes | Leaf |
|---------|------|--------|------------|-------|------|
| {Company} | {Role title} | {Where found} | {YYYY-MM-DD} | {One-line context} | - |

> No leads yet? Delete the placeholder row. The first lead replaces it.

---

## Applied

Application sent, no response yet. Move up when contacted, move out when explicitly rejected or after stale threshold (~21 days no contact).

| Company | Role | Applied date | Resume sent | Channel | Last touch | Leaf |
|---------|------|--------------|-------------|---------|------------|------|
| {Company} | {Role title} | {YYYY-MM-DD} | {Resume variant} | {Channel, e.g. board name / referral / direct} | {YYYY-MM-DD or "-"} | - |

---

## Screening

Recruiter or hiring-team contact made, qualification calls happening. Create the per-opportunity leaf at this stage if not already.

| Company | Role | Stage detail | Next step | Next date | Leaf |
|---------|------|--------------|-----------|-----------|------|
| {Company} | {Role title} | {e.g. "Recruiter intro done, awaiting HM intro"} | {Next concrete action} | {YYYY-MM-DD} | `{DOMAIN}-{COMPANY}-OPPORTUNITY.md` |

---

## Interviewing

Active interview loops. Each opportunity here MUST have a per-opportunity leaf with full prep, the interview log, and the contact roster.

| Company | Role | Round | Next step | Next date | Leaf |
|---------|------|-------|-----------|-----------|------|
| {Company} | {Role title} | {Round number / name, e.g. "Round 2 - technical"} | {Prep / interview / debrief / follow-up} | {YYYY-MM-DD} | `{DOMAIN}-{COMPANY}-OPPORTUNITY.md` |

---

## Offers

Offers extended. Track the comp, the deadline, the negotiation state.

| Company | Role | Offer date | Decision deadline | Status | Leaf |
|---------|------|------------|-------------------|--------|------|
| {Company} | {Role title} | {YYYY-MM-DD} | {YYYY-MM-DD} | {received / negotiating / accepted / declined} | `{DOMAIN}-{COMPANY}-OPPORTUNITY.md` |

---

## Closed (last 30 days)

The rolling window of recent closes - won, lost, or withdrawn. Older closes archive out to `{DOMAIN}_LOG.md` or stay only in the leaf.

| Company | Role | Outcome | Closed date | Reason / one-line lesson | Leaf |
|---------|------|---------|-------------|--------------------------|------|
| {Company} | {Role title} | {won / lost / withdrawn} | {YYYY-MM-DD} | {One-line takeaway} | `{DOMAIN}-{COMPANY}-OPPORTUNITY.md` |

---

## How to use this file

- **Update on every session.** Pipeline state lives here, not in the QUEUE.
- **One row per opportunity.** When an opportunity advances, move its row down the file (Leads -> Applied -> Screening -> Interviewing -> Offers -> Closed). Do not duplicate rows across sections.
- **Create the leaf at Screening.** Earlier is fine if the opportunity warrants it. Later than that and you will lose context.
- **Cull aggressively.** A lead with no movement in two weeks is not a lead anymore. A applied row with no contact in three weeks is not active anymore. The funnel only tells the truth if dead rows leave.
