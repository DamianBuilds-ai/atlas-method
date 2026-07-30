# Field Notes: What Broke and Why

These are postmortem notes on the Atlas Method as it has actually run, not as it was designed to run.
The system had been operating for several months when a single week produced six separate failures,
all involving rules that were real, ratified, and written down, and not in force.

The failures looked different from each other on the surface. Underneath they were the same bug.

**A rule that depends on attention is not a control.**

---

## The Model Pin That Never Bound

The system routes work to different AI model tiers for cost reasons. One tier was formally pinned to a
specific lower-cost model through configuration frontmatter. The pin was real, correct, and ratified.

The same document that carried the pin also instructed dispatchers to pass a model name explicitly in
each call. Passing a name explicitly overrides frontmatter configuration. The pin was being bypassed
by another instruction elsewhere in the same file.

The two lines contradicted each other. The looser one won, silently, because nothing in the system
could detect the contradiction.

45.3 percent of dispatches in that tier ran at roughly double the intended cost for nine days. The
discrepancy was found incidentally while reviewing something else.

The fix was a hook that fails loudly when it sees the dispatch shape that causes the problem. The pin
is now in force because the wrong behaviour is impossible, not because the instructions say not to do it.

**What it taught:** A ratified decision is not an implemented decision. A document cannot verify its
own consistency, and a pin buried in configuration that can be overridden from prose is not a pin.

---

## The Guard With the Unmatchable List

A hook was in place to prevent sensitive domains from being routed to certain external model lanes.
It maintained a hand-written list of domain names to protect. Two entries in the list were strings
that matched nothing in the actual system. They had never matched anything, on any run.

The guard reported success the whole time. A list that matches nothing raises no error.

30 of 94 domains were unguarded as a result, including every financial and job-search domain. The
gap had been present since the hook was written.

The structural problem is that a hook built on a hand-maintained name list decays as the system
grows. New domains are added. The list does not update automatically. The enforcement gets staler
with every addition, and no signal marks the divergence.

**What it taught:** Enforcement built on a hand-maintained name list decays silently as the system
grows. The failure mode produces no symptom: the guard runs, reports success, and protects nothing.

---

## Two Size Caps, Neither Enforced

Document size limits were stated in two places in the system's reference documentation. The two
numbers were different.

With two competing authorities, the looser number won by default. Neither cap was meaningfully
enforced. 155 of 819 files were over cap when the inconsistency was investigated.

There is an honest detail here worth stating plainly: when the caps were reconciled, the stricter
number had to be raised, because applying it would have put 71 percent of existing files in permanent
violation. A limit that everything violates is not a limit. It is a number in a document. Enforcement
has to be calibrated against what is actually achievable, not against what was originally hoped for.

**What it taught:** Two sources of truth is the same as none. Reconciliation sometimes means raising
the bar to meet reality rather than forcing reality to meet the bar.

---

## The Hook With No Scope

A hook rewrote a punctuation convention in files as they were written. It had no file-type guard
and no path scope. It ran against everything.

This included source code files where the rewrite produced syntax errors, and a collaborator's
repository that used the opposite punctuation convention deliberately, as a design choice for that
project. The hook converted that convention silently, on three separate occasions, before the root
cause was identified and the hook was given a path scope.

The fix was straightforward: the hook now runs only against markdown files inside the project's own
directories. That scope should have been specified before the hook shipped.

**What it taught:** House style is not universal. Any rule that rewrites content needs an explicit
scope before it ships, not as a patch applied after it corrupts something. A collaborator's repository
follows that collaborator's conventions, not ours.

---

## The Validation That Checked the Wrong Object

While preparing the method for public distribution, the plugin component was tested using a
validation command run from the repository root. The command returned a passing result.

The plugin was broken and delivering zero commands to users.

The validation command had resolved to the catalog manifest rather than the plugin manifest, because
that was what the given path resolved to from the repo root. The catalog was valid. The plugin was not
checked. A green result on the wrong object ended the investigation before it reached the actual problem.

A passing check is only useful if it is checking the thing you believe it is checking.

**What it taught:** Verify the thing you think you are verifying. When a validator passes, confirm it
by testing the behaviour you actually care about, not just the exit code. A green check that runs
against the wrong object is worse than a red one, because it ends the investigation.

---

## The Install Instructions for a Command That Did Not Exist

The installation documentation instructed users to install the plugin by passing a filesystem path
to the install command. That form of the command has never existed. Installation resolves only
through a registered catalog name.

The instruction had been sitting in the documentation unnoticed because it had never been followed
literally. Anyone who already knew how to install the plugin would not have needed to read it, and
nobody who did not know had tried.

It was found by checking every command in the documentation against the tool's actual help output
before the documentation was published publicly. That check took under ten minutes.

**What it taught:** Documentation is a claim about behaviour. An unexecuted claim is a guess. If a
document contains commands, those commands need to be run by someone following the document literally
before the document ships. The author's familiarity with the subject is not a substitute for that.

---

## The Pattern

All six failures share the same root cause: a gap between a stated rule and an enforced one. In
every case the written rule was correct. The enforcement was absent, wrong, or pointed at the wrong
object.

This class of bug is durable because it has no symptom. A broken feature announces itself. A rule
that is not running looks exactly like a rule that is. The documentation is complete, the ratification
is on record, and the system behaves no differently because of any of it.

The design response is not "write better rules." It is to prefer enforcement that cannot disagree
with its own documentation: scope hooks by path rather than by a hand-maintained name list, derive
checks from a single declared source rather than restating limits in two places, make gaps fail
loudly rather than pass silently, and run every command in your own documentation before publishing it.

One caveat worth being honest about. This is one system, run by one person, over a few months. These
are observations, not research. Someone else's failures will differ, and the specific fixes here may
not transfer directly. What might transfer is the diagnostic question: for each rule that matters,
what is the mechanism that makes it true? If the answer is "it is written down and we try to follow
it," that rule is not in force in any meaningful sense.

If you cannot point at the code, hook, or check that enforces a rule, you do not have that rule.
You have a note about it.
