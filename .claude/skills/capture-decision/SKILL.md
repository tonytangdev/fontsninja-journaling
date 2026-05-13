---
name: capture-decision
description: Capture a decision into the fontsninja-journaling vault as `Decisions/YYYY-MM-DD-<slug>.md`, following the existing `Templates/decision.md` shape (Decision / Options considered / Choice / Why / Known risks). Use this whenever the user says "/decision", "/capture-decision", "/log-decision", "log a decision", "capture this decision", "save this decision", "record this decision", "we decided to X", or "I'm going with X because Y" inside the `fontsninja-journaling/` vault. The skill walks through each section and only writes what the user confirms — it never invents options, rationale, or risks.
---

# Capture Decision

Write a decision note into the vault at `Decisions/YYYY-MM-DD-<slug>.md` using the project's existing template. The point is to capture the *thinking* — what was considered, what was picked, why, and what could go wrong — not just the outcome.

## Inputs

The decision text comes from one of:

- The slash-command argument (`/decision <text>`).
- The user's free-form message after a trigger phrase (`we decided to ...`, `log this decision: ...`, `going with X because Y`).
- Recent conversation context where a decision was discussed.

If the conversation already contains material for some sections (e.g. the user walked you through three options and picked one), surface that material in the per-section drafting step below — don't re-ask blindly, but also don't write it to disk without confirmation.

If you can't tell what the decision is, ask one short clarifying question before doing anything. Don't fabricate.

## Step 1 — Establish the title

The title becomes both the H1 (`# Decision: <title>`) and the filename slug. Keep it short and noun-shaped: name the *subject* of the decision, not the verb.

Good: `Migration of FoundryCustomers for marketplace`, `Queue backend for export jobs`, `Auth library for admin panel`.
Less good: `Decided to migrate FoundryCustomers`, `Picked Postgres`.

If the user hasn't given you a clear title, propose one based on conversation and confirm before going further. The title can be edited later; don't agonize.

## Step 2 — Walk through each section

The user has asked you to **always ask before writing each section** — meaning: never invent content for a section the user hasn't actually said anything about. That doesn't mean six sequential round-trips. The practical interpretation:

- If the conversation already has explicit content for a section, draft it and surface it for confirmation. One round-trip with all drafted sections shown is fine.
- If a section has nothing in context, ask the user for it — or ask whether to leave it blank.
- Never paraphrase aggressively. The user's wording carries nuance you'll lose.

Sections to fill, in order:

### Preamble (optional)

A one-line context note that appears before the H1, like the existing `Decisions/2026-05-12-Migration FoundryCustomers for market place.md` ("We'll use another table later to avoid getting more to delay for deploying the market place"). Most decisions don't need this — skip it unless the user gives you something that doesn't fit any other section.

### Options considered

List every option that was on the table, including the one picked. Two or three is typical; one option means there wasn't really a decision. Phrase each as a noun phrase or short clause — match the user's words. If the user only named the option they chose, ask what the alternatives were (or whether they want to list "do nothing" / "status quo" as the alternative).

### Choice

The option that was picked. Usually one of the options above, occasionally a hybrid. Keep it terse — this is the "what we're doing now".

### Why

The reasoning. This is the most valuable section for future-you, so don't trim it to one word. Capture the trade-off, not just the upside. If the user only gave a reason in one direction ("Postgres is simpler"), ask what made the rejected options worse, not just what made the chosen one good.

### Known risks

What could go wrong, what we're explicitly tolerating, what we'd need to revisit if X happens. If the user genuinely sees no risks, write that — but push back gently first ("nothing comes to mind?") because the answer is rarely actually nothing.

## Step 3 — Write the file

Compute the path:

```bash
cd /Users/tony/Workspace/fontsninja-journaling
DATE=$(date +%Y-%m-%d)
SLUG=<kebab-cased title>           # lowercase, non-alphanumeric → "-", collapse repeats, trim
TARGET="Decisions/${DATE}-${SLUG}.md"
```

**Slug rules**: lowercase the title, replace any run of non-alphanumeric characters with a single `-`, trim leading/trailing `-`, cap at ~60 chars. Don't bother splitting CamelCase tokens — if the user wrote `FoundryCustomers`, the slug `foundrycustomers` is fine.

If `$TARGET` already exists (same decision title captured today), append `-2`, `-3`, etc. until unique. Don't overwrite.

Write with this exact frontmatter shape, matching `Templates/decision.md`:

```markdown
---
date: 2026-05-13
ticket:
---
<preamble line, only if the user provided one — otherwise omit this line>
# Decision: <title>

**Options considered**
1. <option 1>
2. <option 2>
3. <option 3>

**Choice**: <chosen option>

**Why**: <reasoning>

**Known risks**: <risks, or "none identified" if the user really insists>
```

Notes on the shape:

- The `ticket:` field stays blank. The user explicitly does not want this skill to prompt for or guess Linear tickets. If they want to link one later, they'll edit by hand.
- Preserve the blank line between the frontmatter and the H1 (or preamble) so Obsidian renders it correctly.
- If `Options considered` only has one entry, write it as `1.` anyway — don't switch to prose.
- For multi-line content in any field (e.g. a multi-paragraph `Why`), indent continuation lines under the bullet/field so Obsidian's markdown stays clean.

## Step 4 — Confirm and hand off

After writing, tell the user the path in one short line:

> Saved to `Decisions/2026-05-13-queue-backend-for-export-jobs.md`.

Don't summarize the decision back to them — they just wrote it. Don't offer next steps unless they ask. If you noticed something genuinely worth flagging during the walk-through (e.g. the chosen option contradicts an earlier decision in `Decisions/`), say so in one sentence — otherwise stay out of the way.

## What "done" looks like

1. A new file in `Decisions/` with the correct date-prefixed slugged filename.
2. Frontmatter has `date:` filled and `ticket:` blank.
3. Every section in the body reflects something the user actually said or confirmed — no invented options, no fabricated risks.
4. The path is reported back to the user.

## Edge cases

- **User invokes `/decision` with no context**: ask "what's the decision?" — don't write a placeholder file.
- **User dumps a long paragraph that mixes decision + context + risks**: parse it into sections in your draft, surface the parsing for confirmation before writing. Don't silently restructure.
- **User says "no options, I just decided X"**: that's a valid capture — write the option as the only entry, and in `Why`, ask what made it the obvious choice (no alternatives is itself a reasoning signal worth recording).
- **Decision is reversing or amending a prior one**: if you can spot the prior file in `Decisions/`, mention it in the preamble (e.g. "Supersedes `2026-04-02-...`"). Don't modify the prior file — these notes are append-only history.
- **Title collision in the same day**: append `-2`, `-3`. Don't suggest the user rename the existing file.
