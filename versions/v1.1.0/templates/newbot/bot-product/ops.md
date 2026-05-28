# {DOMAIN} - Ops

> How the product runs in production. Deploy target, runtime state, secrets convention, monitoring, recovery playbooks. This is the HOW side: everything you would need at 2am when something is broken. The WHAT (features, roadmap) lives in `{DOMAIN}_PRODUCT_SPEC.md`. Active session work lives in `{DOMAIN}_QUEUE.md`. Resolved incidents either rotate to `{DOMAIN}_LOG.md` or graduate to a `{DOMAIN}-INCIDENTS.md` leaf once you have more than a handful.

**Last updated:** {DATE}

## Deploy Target

Where the product runs, in enough detail that you could rebuild from scratch.

- **Host / platform:** {server, cloud platform, container runtime}
- **Container / process name:** {what the runtime sees it as}
- **Service manager:** {systemd unit, supervisor, docker compose, k8s}
- **Start command:** {literal command or compose service name}
- **Stop / restart:** {literal commands}
- **Logs location:** {file path, journalctl unit, log aggregator}

## Runtime Configuration

The deploy-time knobs. Environment variables, mounted config files, command-line flags. Match the keys to whatever holds the values - never paste the values themselves into this file.

| Key | Purpose | Where the value lives | Required |
|-----|---------|----------------------|----------|
| {KEY_NAME} | {what it controls at runtime} | {.env path, secret manager entry, vault key} | yes / no |

> Secrets convention: values live in `{path or service}`, not in this repo. This file documents which keys exist and where to find their values, never the values themselves.

## External Dependencies

Services this product needs to function. If one of these is down, the product is down.

| Service | Purpose | Failure symptom | Recovery |
|---------|---------|-----------------|----------|
| {service name} | {what it provides} | {what users see when it is broken} | {what to do} |

## Monitoring and Alerts

How you know the product is healthy.

- **Liveness check:** {how to know the process is running}
- **Health check:** {how to know it is doing its job, not just running}
- **Alert channels:** {where alerts land - email, chat, dashboard}
- **Routine glance:** {what to look at on a normal day, and how often}

## Common Operational Tasks

The things you do more than once. Each task: trigger, command, verification.

### {Task name - e.g. "Redeploy after a code change"}

- **Trigger:** {when to do this}
- **Steps:**
  1. {Step}
  2. {Step}
- **Verify:** {how you know it worked}

### {Task name - e.g. "Restart after a crash"}

- **Trigger:** {when to do this}
- **Steps:**
  1. {Step}
- **Verify:** {how you know it worked}

### {Task name - e.g. "Rotate credentials"}

- **Trigger:** {scheduled, on suspicion, on staff change}
- **Steps:**
  1. {Step}
- **Verify:** {how you know it worked}

## Backup and Recovery

How state is preserved and how you restore it. Skip this section only if the product is purely stateless.

- **What gets backed up:** {database, config, file store}
- **Backup cadence:** {how often, where backups land}
- **Retention:** {how long backups are kept}
- **Restore procedure:** {high-level steps, link to a leaf for the full playbook}
- **Last restore test:** {date - if you have not tested recovery, the backup is theoretical}

## Cost Notes

Anything ongoing that costs money. Useful for the "is this still worth running?" question.

- **Hosting:** {monthly figure or "free tier"}
- **External APIs:** {paid APIs, billing model, current monthly}
- **Storage / bandwidth:** {if non-trivial}

## Postmortems

Brief notes on incidents that taught something. Each entry: date, symptom, root cause, fix, lesson. Detailed writeups graduate to `{DOMAIN}-INCIDENTS.md` once you have more than three.

- {Date} - {symptom} - {root cause} - {fix} - {lesson}

## Pointer

Product features: `{DOMAIN}_PRODUCT_SPEC.md`. Active session work: `{DOMAIN}_QUEUE.md`. Trunk: `{DOMAIN}.md`.
