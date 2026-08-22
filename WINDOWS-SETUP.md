# Windows setup for Atlas Method

Atlas Method's shell hooks require a POSIX-compatible shell. On Windows,
the supported path is **Git Bash** (ships with Git for Windows).

## Step 1: Install Git for Windows

Download from [gitforwindows.org](https://gitforwindows.org/) and install
with default options. This provides `bash`, `sh`, `git`, and standard POSIX
utilities in `C:\Program Files\Git\bin\`.

## Step 2: Install Grok Build (Windows native)

Grok Build ships a native PowerShell installer. Open PowerShell and run:

```powershell
irm https://x.ai/cli/install.ps1 | iex
```

Then authenticate: `grok login`

## Step 3: Install the plugin

Open a Git Bash terminal (not PowerShell) for hook-related steps:

```bash
grok plugin marketplace add DamianBuilds-ai/atlas-method
grok plugin install atlas-method-grok --trust
```

## Step 4: Hook paths

The hook scripts use `sh` as the interpreter. In Git Bash, `sh` resolves to
the Git-bundled shell. When wiring hooks manually, use the Git Bash path to
the script:

```bash
# Example path (adjust to your install location):
sh /c/Users/you/my-os-repo/templates/hooks/session-start.sh
```

In Claude Code's `settings.json`, use the Windows-style path with forward slashes:

```json
{
  "SessionStart": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "sh C:/Users/you/my-os-repo/templates/hooks/session-start.sh --banner"
        }
      ]
    }
  ]
}
```

## Known workarounds

- **Symlinks**: Git for Windows may require Developer Mode or admin rights to
  create symlinks. If `claude plugin install` fails on symlink creation, run the
  terminal as Administrator, or use `mklink /D` from an elevated Command Prompt.
- **Line endings**: the hook scripts use Unix line endings (LF). Git for Windows
  may convert them to CRLF on checkout, which breaks `sh` parsing. Set
  `core.autocrlf = false` in your global git config, or add a `.gitattributes`
  rule: `templates/hooks/*.sh text eol=lf`.
- **PATH**: to run `atlas` or `gh` from Git Bash, ensure both are on the `PATH`
  that Git Bash inherits. Add them to your system PATH via Windows Settings, or
  source them in `~/.bashrc` inside Git Bash.
