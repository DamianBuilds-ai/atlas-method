# Windows Setup - Atlas Method

> **In this set:** [Methodology](ATLAS_METHOD.md) - [Agent patterns](AGENT-PATTERNS.md) - [Doc protocol](DOC-PROTOCOL.md) - [Hooks](HOOKS.md) - Windows Setup - [Back to repo root](../../../README.md)

This doc exists because Windows is the #1 source of "it does not work for me" reports. Every issue traced back to one of four root causes. Fix all four and Atlas Method runs on Windows the same as on Mac or Linux.

---

## Root cause 1 - Wrong surface

**Atlas Method requires the Claude Code CLI.** It does NOT work on:
- `claude.ai` (the web chat interface)
- `claude.ai/code` (the web-based coding surface, which is NOT Claude Code)

Custom slash commands and Skills only exist in **Claude Code**, which is a terminal tool (and IDE extension). If you are on the web and your slash commands do nothing, this is why.

**Install Claude Code:**

```
npm install -g @anthropic-ai/claude-code
```

Or use the official IDE extension (VS Code / JetBrains) or the Claude desktop app with Claude Code enabled. The terminal install is the most reliable on Windows.

Once installed, open a terminal (not the web browser) and type `claude`. If it opens a chat session, you are in the right place.

---

## Root cause 2 - Symlinks

**Do NOT rely on symlinks for command or skill files on Windows.**

The Atlas Method init script copies files into place. On Mac and Linux, you can symlink these files and the system resolves them. On Windows, NTFS symlinks require either Administrator privileges or Developer Mode enabled - and even then, some tools ignore them.

**The fix:** copy command and skill files directly into place instead of symlinking. The init script (`bin/atlas-init`) handles this. If you are setting up manually:

1. Copy `versions/v1.1.0/commands/` to `~/.claude/commands/` directly.
2. Copy `versions/v1.1.0/skeleton/` files to your Atlas Method directory directly.
3. Do not run `ln -s` or `mklink` for these files.

---

## Root cause 3 - Bash shell for hooks

**Hooks are bash scripts. Windows does not ship with bash.**

Install [Git for Windows](https://git-scm.com/download/win). It bundles Git Bash, which gives you a bash shell that the hooks expect.

After install, verify:

```bash
bash --version
```

Run it from the Git Bash terminal (not PowerShell or cmd.exe). If you run hooks from PowerShell, they may fail silently with no useful error.

---

## Root cause 4 - jq not on PATH

Several hooks call `jq` (a JSON parser) to read settings files and log outputs. If `jq` is not on PATH, hooks fail silently - the hook exits without error, but also without doing anything.

**Install jq on Windows:**

```
winget install jqlang.jq
```

After install, close and reopen your terminal so PATH updates take effect. Verify:

```
jq --version
```

If that returns a version string, you are done. If it returns "command not found", add the jq install directory to your system PATH:

1. Open System Properties > Environment Variables.
2. Under System Variables, find `Path` and click Edit.
3. Add the directory where `jq.exe` lives (typically `C:\Users\{you}\AppData\Local\Microsoft\WinGet\Packages\...`).
4. Click OK and reopen your terminal.

---

## Slash commands and Skills - no migration needed

Custom slash commands and Skills are the same underlying mechanism in current Claude Code. Both work on Windows without modification. You do NOT need to migrate your `commands/` directory to a `skills/` directory for Windows compatibility. If you see advice saying "convert commands to skills for Windows", that advice is out of date.

---

## Confirming everything works

After setup, open a Claude Code session in your Atlas Method directory and run:

```
/atlas
```

If the audit runs and returns a report, all four root causes are resolved. If it does nothing, check the surface (root cause 1) first - that is still the most common issue.

---

## Quick checklist

- [ ] Running Claude Code CLI (not claude.ai web)
- [ ] Git for Windows installed (provides bash)
- [ ] jq installed and on PATH (`jq --version` works in a new terminal)
- [ ] Command/skill files copied directly (no symlinks)
- [ ] `/atlas` runs successfully in Claude Code
