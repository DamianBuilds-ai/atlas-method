<!-- generated from adapters/jobs.json - do not hand-edit -->
<!-- TODO: verify .grok/agents/ file schema before deploying -->
<!-- This stub uses Markdown + comment blocks. Actual Grok Build persona -->
<!-- files may use YAML, TOML, or JSON frontmatter. Verify the format   -->
<!-- against ~/.grok/docs/ or grok build --help agents before wiring.  -->

# Grok adapter - write job

## Job mapping

**Job:** write
**Contract:** Prose to a brief. Voice-stable output.
**Isolation:** shared workspace (reader job)

## Persona fields

<!-- TODO: verify field names below against Grok Build docs -->

- **persona / name:** write
  - TODO: confirm the field key is "persona" or "name" in the Grok config format
- **effort:** medium
  - TODO: confirm accepted effort values (low / medium / high / xhigh)
- **mode:** read-write
  - TODO: confirm read-only vs read-write is enforced via a "mode" field or equivalent
- **model:** OMITTED - inherit from parent
  - Spec section 13/19 lock: omit model on children, vary effort only.
  - Skill frontmatter model/effort on Grok is accepted and ignored (s.19).
  - Pins live on roles/personas/spawn, not here.

## Rules (encode in persona prompt or spawn brief)

- **No child spawning.** Grok depth is 1. This job runs as a direct child; it does not spawn further children.
- **Sequential processing.** One item at a time.
- **Job contract:** Prose to a brief. Voice-stable output.

## TODO: schema verification checklist

Before deploying this stub as a real Grok persona file:
- [ ] Confirm .grok/agents/ is the correct directory for persona definitions
- [ ] Confirm the file format: YAML frontmatter / TOML / JSON / Markdown
- [ ] Confirm persona field key name
- [ ] Confirm effort field key name and value set
- [ ] Confirm model omission is correct (should inherit parent by default)
- [ ] Confirm worktree isolation flag if applicable
- [ ] Run: grok build --help agents (or equivalent) to verify
