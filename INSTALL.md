# Installing Atlas Method

Install instructions live with the plugin, at
[`plugins/atlas-method/INSTALL.md`](plugins/atlas-method/INSTALL.md).

The short version:

```bash
claude plugin marketplace add DamianBuilds-ai/atlas-method
claude plugin install atlas-method@atlas-method-marketplace
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
