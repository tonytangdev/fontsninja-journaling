---
name: capture-idea
description: Capture a free-form idea into the fontsninja-journaling vault (`Ideas/YYYY-MM-DD-HHmm.md`), then decide together whether it deserves a Linear ticket and — if it does — print a ready-to-run `linear issue create` command targeting the Triage state. Use this whenever the user says "/idea", "/capture-idea", "new idea: ...", "save this idea", "capture this idea", "log this idea", or pastes a thought inside `fontsninja-journaling/` that sounds like a note-to-self or a feature/bug suggestion. **Never execute the `linear` command** — the user runs it themselves; this skill only writes the vault note and prints the command.
---

# Capture Idea

Two-step workflow:

1. **Always**: write the idea to `Ideas/YYYY-MM-DD-HHmm.md` in the fontsninja-journaling vault.
2. **Maybe**: decide together whether it warrants a Linear Triage ticket, and if so, print (do **not** run) a `linear issue create` command.

The user has explicitly said the Linear command should be **printed for them to copy**, not executed. Respect that — write the vault note, prepare the tempfile with the description, and surface the command in a fenced bash block.

## Inputs

The idea text comes from one of:

- The slash-command argument (`/idea <text>`, `/capture-idea <text>`).
- The user's free-form message after a trigger phrase (`new idea: ...`, `save this idea: ...`, `capture this: ...`).
- A multi-paragraph message the user is asking you to capture verbatim.

If the input is empty or you can't tell what the idea is, ask one short clarifying question before doing anything. Don't fabricate content.

## Step 1 — Write the vault note

Compute the path and write the file:

```bash
cd /Users/tony/Workspace/fontsninja-journaling
STAMP=$(date +%Y-%m-%d-%H%M)
TARGET="Ideas/${STAMP}.md"
```

If `$TARGET` already exists (you captured an idea in the same minute), append `-2`, `-3`, etc. until unique. Don't overwrite.

Write it with this exact frontmatter shape, matching the existing convention in `Ideas/`:

```markdown
---
captured: 2026-05-13 17:30        # YYYY-MM-DD HH:mm in local time
status: raw
needs: ticket? message? nothing?  # see Step 3 — you'll update this after deciding
---
<the idea text, verbatim or lightly cleaned up — preserve user voice>
```

**Don't paraphrase aggressively.** The user wrote it tersely on purpose. Fix obvious typos, leave the rest alone. Don't add headings, bullets, or rationale the user didn't write — this is a capture, not an analysis.

## Step 2 — Decide if it warrants a Triage ticket

Read the idea and form a quick opinion. You're answering: *"If this sat in the vault for a month, would the user wish there were a tracked ticket for it?"*

### Ticket-worthy signals (lean YES)

- Concrete action verb: "automate", "add", "fix", "refactor", "build", "support", "migrate", "deprecate".
- Names a specific surface area of the product, codebase, or infrastructure ("the deploy script", "the password reset email", "the staging cluster").
- Identifies a problem with at least a hinted-at solution.
- Describes a workflow friction that would benefit from a tracked fix.
- Mentions metrics, customers, deadlines, or external commitments.

### NOT ticket-worthy (lean NO)

- Personal note-to-self, reference material, or learning goal ("cheatsheet for X", "read about Y", "explore Z").
- Open-ended speculation without an actionable outcome ("what if we...", "could we maybe...").
- Meta-notes about the user's own habits or process.
- Pure observation/journal entry with no proposed change.
- Already covered by an existing ticket the user has mentioned in this conversation.

### Calibration examples (from this vault)

- *"Automate creating PR for deployment in production every week"* → **ticket**. Concrete automation, names a workflow, clear surface area.
- *"Cheatsheet for kube"* → **no ticket**. Personal reference material, no proposed product change.

### How to present the recommendation

Say something short like:

> Captured to `Ideas/2026-05-13-1730.md`. This reads ticket-worthy to me — it's a concrete automation request with a clear surface area (deploy workflow). Want me to prep the Linear Triage command?

Or:

> Captured to `Ideas/2026-05-13-1730.md`. I'd skip the ticket — feels more like a personal reference note than something to track. Disagree?

State your reasoning in one sentence so the user can override quickly. Then **wait for confirmation** before doing Step 3. If they say no (or you recommended no and they didn't push back), update the frontmatter and finish.

## Step 3 — Prepare the Linear command (only if confirmed)

Two artifacts: a description tempfile + a fenced command.

### Description tempfile

Write the description to a tempfile so the markdown survives the shell intact (the linear-cli skill explicitly recommends `--description-file` for any multi-line content):

```bash
SLUG=<short-kebab-from-title>  # e.g. "automate-prod-pr-weekly"
DESC=/tmp/idea-${SLUG}.md
```

The description should be the idea text expanded with a tiny bit of context — keep it tight, the user wrote terse on purpose. A reasonable shape:

```markdown
<one-line restatement of the idea>

## Context
<one or two sentences if the conversation has obvious context, otherwise omit this whole section>
```

No "next steps", no "acceptance criteria", no padding — Triage means this hasn't been groomed yet. The point is to capture enough that the user (or whoever triages) can rehydrate the thought later.

### The command

Print a fenced bash block, exactly this shape:

````markdown
```bash
linear issue create \
  --team DEV \
  --title "Automate weekly prod deploy PR" \
  --description-file /tmp/idea-automate-prod-pr-weekly.md \
  -s triage
```
````

Notes:

- `--team DEV` is always included. DEV is the Fonts Ninja engineering team key — every ticket in this vault uses it (see `Tickets/DEV-*.md`). Even if a default team is configured, being explicit avoids surprises.
- `-s triage` puts the issue in the Triage workflow state. This is the user's explicit requirement.
- Don't pass `--assignee`, `--priority`, `--label`, or `--project`. Triage is intentionally ungroomed.
- Title: short, sentence-cased, ~50 chars max, action-shaped. Strip any leading "Idea:" or "TODO:" the user may have typed.

After printing the command, tell the user one short sentence: *"Run that whenever — I won't run it for you. Update the vault note's `linear_url` field once you do."* (Or similar — don't be robotic.)

## Step 4 — Update the vault frontmatter

Whatever you decided (ticket or not), tighten the `needs:` field so the vault note isn't left in the template state:

- **Ticket**: change `needs: ticket? message? nothing?` → `needs: ticket`. Add a blank `linear_url:` line under it so the user has a slot to paste the URL after they run the command.
- **No ticket**: change `needs: ticket? message? nothing?` → `needs: nothing` (or `needs: message` if the idea is really a thing-to-tell-someone, e.g. "I should DM Dongwoo about X").

Final frontmatter for a ticket-worthy idea looks like:

```markdown
---
captured: 2026-05-13 17:30
status: raw
needs: ticket
linear_url:
---
```

## What "done" looks like

A successful turn produces:

1. A new file in `Ideas/` with proper frontmatter and the idea body.
2. A clear recommendation about whether to file a Triage ticket, with one-sentence rationale.
3. (If confirmed) a description tempfile in `/tmp/` and a printed `linear issue create -s triage --description-file …` command.
4. The vault note's `needs:` field set to a real value, not the placeholder.

No automatic Linear API calls. No `linear` command execution. The user runs it.

## Edge cases

- **`linear` not installed**: still write the vault note. When generating the command, mention that `linear` resolves to `npx @schpet/linear-cli` if not globally installed.
- **User pastes a long thought with multiple ideas**: write one file containing all of it, and ask whether they want it split into multiple notes before deciding on tickets. Don't silently split — that's a paraphrase decision.
- **User invokes the skill but the idea is just a question for you ("can we do X?")**: capture it as a raw idea anyway, but in your recommendation, point out it's question-shaped and might want a quick answer first before becoming a ticket.
- **Idea references an existing ticket**: skip the new-ticket suggestion; recommend adding a comment to the existing ticket instead (`linear issue comment add DEV-####`).
