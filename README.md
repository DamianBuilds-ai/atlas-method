# Atlas Method

*Lean-by-design methodology for running your life through Claude Code.*

![Version](https://img.shields.io/github/v/release/DamianBuilds-ai/atlas-method)
![License](https://img.shields.io/badge/license-MIT-green)
![Templates](https://img.shields.io/badge/templates-7%20archetypes-orange)
![Agents](https://img.shields.io/badge/agents-9%20tiers-purple)
![Status](https://img.shields.io/badge/status-stable-brightgreen)

A forest of small, self-contained domain docs governed by one set of behavioural rules, kept lean so context - the scarcest resource in any AI session - is never wasted.

Clone, run one script, and you have a working personal operating system on Claude Code in under 20 minutes.

```mermaid
graph TD
    Soil["CLAUDE.md<br/>(soil - always loaded)<br/>behavioural rules"]
    Soil --> T1[Domain A]
    Soil --> T2[Domain B]
    Soil --> T3[Domain C]
    T1 --> Tr1["DOMAIN.md<br/>(trunk)"]
    Tr1 --> Q1["QUEUE<br/>(active)"]
    Tr1 --> H1["HANDOFF<br/>(continuity)"]
    Tr1 --> L1["leaf<br/>(specialised)"]
    Tr1 --> L2["leaf<br/>(specialised)"]
    classDef soil fill:#3a2e26,stroke:#8b6f4e,color:#f5e6d3
    classDef tree fill:#1f3a2e,stroke:#5e8b6f,color:#e6f5ea
    classDef trunk fill:#2e3a4e,stroke:#5e6f8b,color:#e6eaf5
    classDef branch fill:#3a2e4e,stroke:#6f5e8b,color:#eae6f5
    classDef leaf fill:#4e3a2e,stroke:#8b6f5e,color:#f5eae6
    class Soil soil
    class T1,T2,T3 tree
    class Tr1 trunk
    class Q1,H1 branch
    class L1,L2 leaf
```

---

## Install

```sh
git clone https://github.com/DamianBuilds-ai/atlas-method.git
cd atlas-method
sh versions/v1.1.0/bin/atlas-init ~/my-atlas
```

Open `~/my-atlas` in Claude Code. Full walkthrough: [QUICKSTART.md](versions/v1.1.0/QUICKSTART.md).

---

## What is Atlas Method?

Most people who try to run their life through an AI assistant hit the same wall: the context window. Pour everything into one giant file and the assistant reads slower, reasons worse, and eventually cannot hold it all. Split everything into a thousand files and it cannot find anything. Atlas Method resolves this with a forest of small trees.

**Soil.** `CLAUDE.md` is the soil. Always loaded. Holds the behavioural rules - domain isolation, scout-first dispatch, wrap protocol, agent delegation - that every session inherits. Rules, not content. The soil never changes shape.

**Trunk.** Each domain has one trunk doc (`DOMAIN.md`). The stable facts. The map of the territory. Kept under 500 lines so a session can read it whole without burning context.

**Branches.** `DOMAIN_QUEUE.md` (what's active), `DOMAIN_HANDOFF.md` (continuity to the next session), `DOMAIN_LOG.md` (history). These are the load-bearing branches of every tree.

**Leaves.** Specialised sub-docs (`DOMAIN-TOPIC.md`). Loaded only when needed. Capped at ~300 lines. When a leaf outgrows its cap, it splits. Growth is sideways, never upward.

A new domain is a new tree. A new sub-topic is a new leaf. The forest grows around the soil.

---

## Agents do the work

Main session orchestrates. Tiered agents do the work. Output flows back through `agent-outputs/` so context stays lean.

| Tier | Model | Role |
|------|-------|------|
| Explorer | Haiku | Wide discovery in unknown territory |
| Scout | Haiku | Targeted retrieval, quick lookups |
| Setter | Haiku | Deterministic apply (insert row, set value) |
| Analyst | Sonnet | Research, pattern finding, comparison |
| Builder | Sonnet | Mechanical execution with verification |
| Scribe | Sonnet | Documentation, transcription |
| Engineer | Sonnet | Execution with local judgment calls |
| Researcher | Sonnet | Deep multi-source investigation |
| Architect | Sonnet | Design, ADR-level decisions |

```mermaid
graph LR
    Main["Main Session<br/>(orchestrates + decides)"]
    Main -->|"cheap retrieval"| Scout["Scout / Explorer<br/>(Haiku)"]
    Main -->|"deterministic apply"| Setter["Setter<br/>(Haiku)"]
    Main -->|"execution + judgment"| Builder["Builder / Engineer<br/>(Sonnet)"]
    Main -->|"deep work"| Analyst["Analyst / Architect<br/>(Sonnet)"]
    Scout --> Out["agent-outputs/<br/>YYYY-MM-DD-{tier}-{purpose}.md"]
    Setter --> Out
    Builder --> Out
    Analyst --> Out
    Out --> Main
    classDef main fill:#3a2e26,stroke:#8b6f4e,color:#f5e6d3
    classDef cheap fill:#1f3a2e,stroke:#5e8b6f,color:#e6f5ea
    classDef heavy fill:#2e3a4e,stroke:#5e6f8b,color:#e6eaf5
    classDef out fill:#4e3a2e,stroke:#8b6f5e,color:#f5eae6
    class Main main
    class Scout,Setter cheap
    class Builder,Analyst heavy
    class Out out
```

---

## Scaffold a domain

`/newbot` asks 4 questions and scaffolds a new domain in 2 minutes.

```mermaid
graph TD
    Start(["/newbot"])
    Q1["Q1: domain name?"]
    Q2["Q2: which archetype?<br/>(7 options)"]
    Q3["Q3: one-line description?"]
    Q4["Q4: confirm scaffold?"]
    Gen["Generate from template:<br/>- DOMAIN.md (trunk)<br/>- QUEUE / HANDOFF / IDEAS<br/>- /{domain} slash command"]
    Route["Output routing snippet<br/>for CLAUDE.md paste"]
    Done(["Domain ready<br/>~2 min total"])
    Start --> Q1 --> Q2 --> Q3 --> Q4 --> Gen --> Route --> Done
    classDef start fill:#3a2e26,stroke:#8b6f4e,color:#f5e6d3
    classDef q fill:#2e3a4e,stroke:#5e6f8b,color:#e6eaf5
    classDef gen fill:#1f3a2e,stroke:#5e8b6f,color:#e6f5ea
    classDef done fill:#4e3a2e,stroke:#8b6f5e,color:#f5eae6
    class Start start
    class Q1,Q2,Q3,Q4 q
    class Gen,Route gen
    class Done done
```

**Seven archetypes** ship with v1.1.0:

- `single-purpose` - one scope, no persona (Hermes / Drake shape)
- `companion` - persona-led, verbatim protocol, status + handoff + personality
- `learning-system` - topic + coursework + progress (Feynman shape)
- `business` - product or commercial domains
- `bot-product` - Telegram bots with Meridian framework hooks
- `game` - game-state tracking (Warframe / EVE / OSRS shape)
- `job-search` - opportunity dossiers + applications

Pick the shape that fits, answer four questions, get a working domain with the right four-document skeleton and a wired slash command.

---

## What's new in v1.1.0

- **`/newbot`** - interactive scaffolder, 7 archetypes, 2 minutes per new domain
- **Wrap protocol** - 8 steps with `wrap` / `checkpoint` / `sync` cookies
- **4 hooks** - em-dash guard, scratchpad nudge, wrap-push reminder, task-output verify
- **Audit-only `/atlas`** - methodology turned back on itself (no auto-fixes, only neutral prompts)
- **Tier-named agents** - Explorer / Scout / Setter / Analyst / Builder / Scribe / Engineer / Researcher / Architect

Full migration guide: [MIGRATION_v1.0.0_TO_v1.1.0.md](versions/v1.1.0/MIGRATION_v1.0.0_TO_v1.1.0.md).
Detailed changes: [CHANGELOG.md](versions/v1.1.0/CHANGELOG.md).

---

## Repo layout

```
atlas-method/
├── README.md              ← you are here
├── LICENSE                ← MIT
└── versions/
    ├── v1.0.0/            ← first public release
    └── v1.1.0/            ← current
        ├── QUICKSTART.md  ← 20-minute walkthrough
        ├── MIGRATION_v1.0.0_TO_v1.1.0.md
        ├── CHANGELOG.md
        ├── bin/           ← atlas-init bootstrap script
        ├── commands/      ← /atlas, /newbot
        ├── docs/          ← methodology specification
        ├── hooks/         ← 4 hook scripts + README
        ├── procedures/    ← wrap.md and others
        ├── skeleton/      ← four-document templates
        ├── templates/     ← 7 archetype templates for /newbot
        └── examples/      ← one worked domain
```

---

## Philosophy

**Small trees.** Context is finite. A 2,000-line document is a liability; the assistant reads it slowly and reasons over it poorly. A 200-line document is an asset. Every tree is kept small on purpose. Leaves cap at ~300 lines, trunks at ~500. When something outgrows its cap, it splits. Growth is sideways, into more small trees, never upward into one big one.

**Context discipline.** The most expensive mistake an AI session can make is reading a file it did not need. Every irrelevant token spent is a relevant token it cannot spend later. Domain isolation is the law: read only what this domain needs, ask before crossing domains, and never explore to "understand the system" - the map already exists.

**Scout-first.** The main conversation is the scarcest real estate in the system. Protect it. Delegate retrieval to cheap scout agents, mechanical work to builders, design to architects. Keep the main session for what only it can do: talk to you, synthesise, and decide.

---

## Contributing + feedback

Atlas Method evolves through real use. If a rule earns its place by preventing a real failure, it belongs. If it is decoration, it does not.

Open an issue to propose a methodology change, or a pull request against the skeleton, the docs, the templates, or the slash commands. Keep the lean-by-design spirit - every addition should pay for the context it costs.

---

## License + version

MIT licensed. Public version v1.1.0 maps to internal methodology v7.5.x. Maintainer: [DamianBuilds-ai](https://github.com/DamianBuilds-ai).

> **Note:** Atlas Method is the methodology, published on its own. It is intentionally separate from any individual's personal operating system or portfolio. This repo contains clean, generic templates - no personal data, no private domains. Fill it with your own.

*Built for Claude Code.*
