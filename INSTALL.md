# Installing Atlas Method

Install instructions live with the plugin, at
[`plugins/atlas-method/INSTALL.md`](plugins/atlas-method/INSTALL.md).

The short version:

```bash
claude plugin marketplace add DamianBuilds-ai/atlas-method
claude plugin install atlas-method@damianbuilds
```

That document also covers installing from a local clone, trying the plugin
without installing it, migrating from a hand-installed setup, which hooks need
manual wiring, updating, uninstalling, and a manual fallback for Windows users
who hit symlink failures.

## Why the plugin lives in a subdirectory

The plugin is at `plugins/atlas-method/` rather than the repository root. That is
a structural guarantee rather than a preference: this repository also carries
versioned snapshots and internal build tooling, and none of it sits inside that
subtree, so none of it can ship to you. The marketplace catalog at the repository
root points at the subdirectory, which is why the install command above needs no
path.

---

## Fresh-machine install matrix (M10)

Three doors into Atlas Method from a blank machine. Pick the one that fits
your tooling. All three ship the same core (constitution template, hooks,
adapters) - they differ only in how they deliver it.

**Important:** your agents read local installed method files at runtime.
They never reach back to this public repo. Install once, then the method is
yours locally.

| Door | Prerequisites | Quick start |
|------|--------------|-------------|
| **Claude plugin** | Claude Code (`claude` CLI), then `gh` auth with `repo` + `issues` scopes | `claude plugin marketplace add DamianBuilds-ai/atlas-method` then `claude plugin install atlas-method@damianbuilds` then `/hooks-trust` in the project |
| **Grok plugin** | Grok Build (curl installer + `grok login`), then `gh` auth | `grok plugin marketplace add DamianBuilds-ai/atlas-method` then `grok plugin install atlas-method-grok --trust` |
| **npx** | Node >= 22, git | `npx atlas-method init` (planned universal door - coming with the installer workstream; not yet shipped) |
| **GitHub profile only** | `gh` auth with `repo` + `issues` scopes; add `project` scope only if auto-graduation is on | Clone this repo, copy `templates/` into your personal OS repo, wire hooks manually |
| **Purely local** | git + a shell harness of your choice. No `gh` required | Clone, copy `templates/`, wire hooks without any remote integration |

### Prerequisites detail

**Claude plugin door**
- Install Claude Code: see [claude.ai/code](https://claude.ai/code)
- `gh auth login` with at minimum `repo` and `issues` scopes
- Add `project` scope (`gh auth refresh --scopes project`) only if you want
  auto-graduation of baton items to GitHub Projects (off by default)
- After install, run `/hooks-trust` in your project root once to allow project hooks

**Grok plugin door**
- Install Grok Build: `curl -fsSL https://x.ai/cli/install.sh | bash` (or
  the native PowerShell installer on Windows - see Windows note below)
- `grok login` to authenticate
- `gh auth login` for the watchdog and refresh commands that call the GitHub API
- After install: the `--trust` flag on `grok plugin install` grants hook trust
  in one step; no separate `/hooks-trust` command is needed

**npx door** (planned - not yet shipped)
- `npx atlas-method init` is the planned universal door, coming with the installer workstream.
- The working doors today are the plugin dirs (Claude plugin, Grok plugin) and manual clone.
- Do not rely on npx for a current installation.

**GitHub profile door**
- `gh auth login` (repo + issues scopes are the minimum)
- Add `project` scope if auto-graduation is on: `gh auth refresh --scopes project`
- The watchdog checks your auth scope on every run and skips Projects checks
  when the scope is absent (prints a visible notice)

**Purely-local door**
- No `gh` or GitHub integration required
- The gazetteer, state JSONL, and orientation all work entirely from local files
- The watchdog and refresh commands skip all GitHub API calls gracefully

### Windows note

Grok Build has a native PowerShell installer. The bash hook scripts
(`session-start.sh`, `datetime.sh`, `visibility-watchdog.sh`) require a
POSIX-compatible shell. On Windows, install Git Bash (ships with Git for
Windows) and run hooks via `sh` from Git Bash.

See [`WINDOWS-SETUP.md`](WINDOWS-SETUP.md) for a step-by-step guide covering
Git Bash setup, hook path configuration, and known Windows-specific workarounds.
