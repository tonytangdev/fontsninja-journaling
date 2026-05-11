# Work Journaling — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Phase 1 vault-only journaling workflow so a 2-week habit test can run against the success criteria in the spec.

**Architecture:** This is a configuration project, not an application. The repo root `/Users/tony/Workspace/fontsninja-journaling/` *is* the Obsidian vault. We create four content directories (`Daily/`, `Tickets/`, `Ideas/`, `Decisions/`), four template files, configure four Obsidian plugins (Daily Notes, Templater, QuickAdd, Tasks), drop two QuickAdd user scripts that the macros call, and wire two macOS-native reminders. No code is shipped to production; everything lives in this repo and is committed.

**Tech Stack:** Obsidian 1.x (vault), Templater (community plugin), QuickAdd (community plugin), Tasks (community plugin), macOS Shortcuts.app, macOS Reminders.app, plain markdown.

**Spec:** `docs/superpowers/specs/2026-05-09-work-journaling-workflow-design.md`

**Conventions for this plan:**
- "Verify" steps are mostly manual Obsidian-UI checks. Do them — they are the test suite.
- After every task, commit the vault. `.obsidian/` is tracked (except the gitignored `workspace.json` / `workspace-mobile.json` / `cache`), so plugin settings flow into git automatically.
- Use `git add <path>` rather than `git add -A` so we never accidentally commit `.DS_Store` or stray scratch files.
- Repo root in commands below is `/Users/tony/Workspace/fontsninja-journaling`. Run commands from there unless stated.

---

## File Structure

Files this plan creates or modifies (all paths relative to repo root):

```
Daily/.gitkeep                                ← keep empty dir in git
Tickets/.gitkeep
Ideas/.gitkeep
Decisions/.gitkeep

Templates/daily.md                            ← Daily Notes template
Templates/ticket.md                           ← Start ticket template
Templates/idea.md                             ← New idea template
Templates/decision.md                         ← New decision template

.obsidian/scripts/start-ticket.js             ← QuickAdd user script
.obsidian/scripts/log-ticket-done.js          ← QuickAdd user script

.obsidian/daily-notes.json                    ← Daily Notes config (created by plugin)
.obsidian/community-plugins.json              ← which community plugins are enabled
.obsidian/plugins/templater-obsidian/data.json
.obsidian/plugins/quickadd/data.json
.obsidian/plugins/obsidian-tasks-plugin/data.json
.obsidian/app.json                            ← already exists; left alone

docs/superpowers/plans/2026-05-11-phase-1-retro.md   ← retro checklist (created in Task 11)
```

Files the plan does **not** touch:
- `.obsidian/app.json` already excludes `docs/` from indexing; leave it.
- No source code, no Linear code, no MCP server. That's Phase 2.

---

## Task 1: Create the vault directory skeleton

**Files:**
- Create: `Daily/.gitkeep`
- Create: `Tickets/.gitkeep`
- Create: `Ideas/.gitkeep`
- Create: `Decisions/.gitkeep`
- Create: `Templates/.gitkeep` (will be replaced by real templates in Task 2, but commit the dir first so the structure shows up immediately)

- [ ] **Step 1: Create directories and placeholder files**

Run:

```bash
mkdir -p Daily Tickets Ideas Decisions Templates
touch Daily/.gitkeep Tickets/.gitkeep Ideas/.gitkeep Decisions/.gitkeep Templates/.gitkeep
```

- [ ] **Step 2: Verify**

Run:

```bash
ls -la Daily Tickets Ideas Decisions Templates
```

Expected: each directory exists and contains a single `.gitkeep` file.

- [ ] **Step 3: Commit**

```bash
git add Daily/.gitkeep Tickets/.gitkeep Ideas/.gitkeep Decisions/.gitkeep Templates/.gitkeep
git commit -m "vault: scaffold Daily/Tickets/Ideas/Decisions/Templates dirs"
```

---

## Task 2: Write the four templates

These are the templates QuickAdd and Daily Notes will instantiate. `{{date}}` / `{{time}}` placeholders from the spec are translated into Templater syntax (`<% tp.date.now() %>`) so the daily template can also run a script to auto-pull yesterday's "End of day" block.

**Files:**
- Create: `Templates/daily.md`
- Create: `Templates/ticket.md`
- Create: `Templates/idea.md`
- Create: `Templates/decision.md`
- Delete: `Templates/.gitkeep` (no longer needed)

- [ ] **Step 1: Write `Templates/daily.md`**

```markdown
<%*
const yesterday = tp.date.now("YYYY-MM-DD", -1);
let yesterdayEOD = "(no prior entry)";
const prior = tp.file.find_tfile(`Daily/${yesterday}`);
if (prior) {
  const content = await app.vault.read(prior);
  const m = content.match(/##\s*End of day\s*\n([\s\S]*?)(?=\n##\s|$)/);
  if (m && m[1].trim()) yesterdayEOD = m[1].trim();
}
-%>
# <% tp.date.now("YYYY-MM-DD") %>

## Standup script
- Yesterday:
<% yesterdayEOD %>
- Today:
- Blocked:

## Quick notes


## Active tickets
```tasks
not done
path includes Tickets/
```

## Tickets done today

## End of day
- Worked on:
- Status: [blocked / continuing tomorrow / done]
- Tomorrow's goal:
```

Note: the inner ```` ```tasks ```` fence inside the markdown is intentional — it is a Tasks-plugin query block. When pasting into a markdown file in your editor, keep the inner backticks as-is.

- [ ] **Step 2: Write `Templates/ticket.md`**

```markdown
---
ticket: <% tp.file.title %>
linear_url:
status: in_progress
started: <% tp.date.now("YYYY-MM-DD") %>
---

# <% tp.file.title %> — <title>

- [ ] In progress

## Context
## Decisions made
## Impressions / friction
## Done / Tomorrow
```

The `- [ ] In progress` checkbox is what the daily's `## Active tickets` Tasks query picks up. `log-ticket-done.js` will flip it to `- [x] In progress`.

- [ ] **Step 3: Write `Templates/idea.md`**

```markdown
---
captured: <% tp.date.now("YYYY-MM-DD HH:mm") %>
status: raw
needs: [ticket? message? nothing?]
---

```

The body is intentionally empty — QuickAdd's "New idea" capture appends the user-typed line below the frontmatter.

- [ ] **Step 4: Write `Templates/decision.md`**

```markdown
---
date: <% tp.date.now("YYYY-MM-DD") %>
ticket:
---

# Decision: <what>

**Options considered**
1.
2.
3.

**Choice**:

**Why**:

**Known risks**:
```

- [ ] **Step 5: Remove the Templates/.gitkeep placeholder**

```bash
rm Templates/.gitkeep
```

- [ ] **Step 6: Verify file content**

```bash
ls Templates/
```

Expected: `daily.md  decision.md  idea.md  ticket.md` and no `.gitkeep`.

- [ ] **Step 7: Commit**

```bash
git add Templates/daily.md Templates/ticket.md Templates/idea.md Templates/decision.md
git rm Templates/.gitkeep
git commit -m "vault: add Templater templates for daily, ticket, idea, decision"
```

---

## Task 3: Configure the built-in Daily Notes plugin

Daily Notes is built into Obsidian — no install needed. We just point it at `Daily/` and `Templates/daily.md`.

**Files:**
- Created by Obsidian: `.obsidian/daily-notes.json`

- [ ] **Step 1: Open the vault in Obsidian**

Launch Obsidian.app → "Open folder as vault" → select `/Users/tony/Workspace/fontsninja-journaling`. If prompted "Trust author and enable plugins", click **Trust author and enable plugins**.

- [ ] **Step 2: Enable Daily Notes core plugin**

Settings (⌘,) → Core plugins → flip **Daily notes** on.

- [ ] **Step 3: Configure Daily Notes**

Settings → Daily notes:
- **Date format**: `YYYY-MM-DD`
- **New file location**: `Daily`
- **Template file location**: `Templates/daily.md`
- **Open daily note on startup**: ON

Close Settings.

- [ ] **Step 4: Verify config landed on disk**

Run:

```bash
cat .obsidian/daily-notes.json
```

Expected: JSON containing `"folder":"Daily"`, `"template":"Templates/daily.md"`, `"format":"YYYY-MM-DD"`, `"autorun":true` (key names may vary slightly by Obsidian version — the values are what matter).

- [ ] **Step 5: Commit**

```bash
git add .obsidian/daily-notes.json
git commit -m "obsidian: configure Daily Notes to use Templates/daily.md"
```

Note: we are not creating today's daily file yet — that requires Templater (Task 4) to render `<% ... %>` syntax. Without Templater, Daily Notes would write the raw template literally.

---

## Task 4: Install and configure Templater

**Files:**
- Created by Obsidian: `.obsidian/community-plugins.json`, `.obsidian/plugins/templater-obsidian/`

- [ ] **Step 1: Enable community plugins**

Settings → Community plugins → if Restricted mode is on, click **Turn on community plugins**.

- [ ] **Step 2: Install Templater**

Settings → Community plugins → **Browse** → search "Templater" → author SilentVoid13 → **Install** → **Enable**.

- [ ] **Step 3: Configure Templater**

Settings → Templater:
- **Template folder location**: `Templates`
- **Trigger Templater on new file creation**: ON
- **Folder templates** → click **Add new folder template** → folder `Daily`, template `Templates/daily.md`. (This makes Templater render the daily template — Daily Notes alone won't run `<% %>`.)
- **User script files folder location**: `.obsidian/scripts` (we'll create this folder in Task 7; setting it now is fine even if the folder is empty).

- [ ] **Step 4: Smoke-test by creating today's daily note**

In Obsidian, run command palette (⌘P) → **Daily notes: Open today's daily note**.

A file `Daily/<today>.md` opens. Verify:
- Title heading is today's date in `YYYY-MM-DD` form.
- "Yesterday" line says `(no prior entry)` (because nothing exists in `Daily/` yet).
- No literal `<% ... %>` text remains in the file — if you see raw Templater syntax, the folder-template wiring in Step 3 is wrong.

If raw syntax appears, delete the file, re-check Step 3, retry.

- [ ] **Step 5: Commit**

```bash
git add .obsidian/community-plugins.json .obsidian/plugins/templater-obsidian/
git add Daily/$(date +%Y-%m-%d).md
git commit -m "obsidian: install + configure Templater, render first daily note"
```

---

## Task 5: Install and configure the Tasks plugin

**Files:**
- Created by Obsidian: `.obsidian/plugins/obsidian-tasks-plugin/`
- Modified by Obsidian: `.obsidian/community-plugins.json`

- [ ] **Step 1: Install Tasks**

Settings → Community plugins → **Browse** → search "Tasks" → author "Clare Macrae / obsidian-tasks-group" → **Install** → **Enable**.

- [ ] **Step 2: Verify the daily's `## Active tickets` query renders without error**

Open today's daily note. The `## Active tickets` section should now render as a Tasks-plugin query block (empty list, since no tickets exist yet) instead of raw text. If it still shows raw `not done / path includes Tickets/` text, re-check the plugin is enabled.

- [ ] **Step 3: Commit**

```bash
git add .obsidian/community-plugins.json .obsidian/plugins/obsidian-tasks-plugin/
git commit -m "obsidian: install Tasks plugin for cross-file active-ticket query"
```

---

## Task 6: Install QuickAdd (no choices configured yet)

We split QuickAdd setup into two tasks: install (here) and choice/macro wiring (Task 8) so the QuickAdd user scripts from Task 7 are in place when we wire choices to them.

**Files:**
- Created by Obsidian: `.obsidian/plugins/quickadd/`
- Modified by Obsidian: `.obsidian/community-plugins.json`

- [ ] **Step 1: Install QuickAdd**

Settings → Community plugins → **Browse** → search "QuickAdd" → author "Christian B. B. Houmann" → **Install** → **Enable**.

- [ ] **Step 2: Set the user scripts folder**

Settings → QuickAdd → **Scripts folder path**: `.obsidian/scripts`.

(Leave choices empty for now — we configure them in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add .obsidian/community-plugins.json .obsidian/plugins/quickadd/
git commit -m "obsidian: install QuickAdd (choices wired in next task)"
```

---

## Task 7: Write the two QuickAdd user scripts

These two JS files implement the macro logic that's too multi-file to express as plain QuickAdd captures.

**Files:**
- Create: `.obsidian/scripts/start-ticket.js`
- Create: `.obsidian/scripts/log-ticket-done.js`

- [ ] **Step 1: Create the scripts directory**

```bash
mkdir -p .obsidian/scripts
```

- [ ] **Step 2: Write `.obsidian/scripts/start-ticket.js`**

```javascript
module.exports = async (params) => {
  const { app, quickAddApi } = params;

  const ticketId = await quickAddApi.inputPrompt("Ticket ID (e.g. ABC-123)");
  if (!ticketId) return;

  const title = await quickAddApi.inputPrompt("Ticket title (optional)");

  const today = window.moment().format("YYYY-MM-DD");
  const path = `Tickets/${ticketId}.md`;

  const existing = app.vault.getAbstractFileByPath(path);
  if (existing) {
    new Notice(`${ticketId} already exists — opening`);
    await app.workspace.openLinkText(path, "", false);
    return;
  }

  const titleLine = title ? `# ${ticketId} — ${title}` : `# ${ticketId}`;
  const content =
`---
ticket: ${ticketId}
linear_url:
status: in_progress
started: ${today}
---

${titleLine}

- [ ] In progress

## Context
## Decisions made
## Impressions / friction
## Done / Tomorrow
`;

  const file = await app.vault.create(path, content);
  await app.workspace.openLinkText(file.path, "", false);
};
```

- [ ] **Step 3: Write `.obsidian/scripts/log-ticket-done.js`**

```javascript
module.exports = async (params) => {
  const { app, quickAddApi } = params;

  const ticketId = await quickAddApi.inputPrompt("Ticket ID (e.g. ABC-123)");
  if (!ticketId) return;

  const impressions = await quickAddApi.wideInputPrompt("Impressions / friction");
  const keyDecision = await quickAddApi.wideInputPrompt("Key decision (or blank)");
  const nextTicket  = await quickAddApi.inputPrompt("Next ticket? (or blank)");

  const today = window.moment().format("YYYY-MM-DD");
  const now   = window.moment().format("HH:mm");

  // 1. Ensure ticket file exists. If not, create with minimal frontmatter
  //    and `status: done` straight away (covers the spec edge case
  //    "log_ticket_done for a ticket whose file does not exist").
  const ticketPath = `Tickets/${ticketId}.md`;
  let ticketFile = app.vault.getAbstractFileByPath(ticketPath);
  if (!ticketFile) {
    const seed =
`---
ticket: ${ticketId}
linear_url:
status: done
started: ${today}
---

# ${ticketId}

- [x] In progress

## Context
## Decisions made
## Impressions / friction
## Done / Tomorrow
`;
    ticketFile = await app.vault.create(ticketPath, seed);
  }

  // 2. Read, mutate, write the ticket file:
  //    - flip frontmatter status to done
  //    - check off the "- [ ] In progress" checkbox so the Tasks query drops it
  //    - append timestamped impressions and (optional) decision
  let content = await app.vault.read(ticketFile);
  content = content.replace(/^status:\s*in_progress\s*$/m, "status: done");
  content = content.replace(/^- \[ \] In progress\s*$/m, "- [x] In progress");

  const impressionLine = `\n- ${today} ${now}: ${impressions}`;
  content = content.replace(/(##\s*Impressions \/ friction)/, `$1${impressionLine}`);

  if (keyDecision && keyDecision.trim()) {
    const decisionLine = `\n- ${today}: ${keyDecision}`;
    content = content.replace(/(##\s*Decisions made)/, `$1${decisionLine}`);
  }

  if (nextTicket && nextTicket.trim()) {
    const nextLine = `\n- Next: [[${nextTicket}]]`;
    content = content.replace(/(##\s*Done \/ Tomorrow)/, `$1${nextLine}`);
  }

  await app.vault.modify(ticketFile, content);

  // 3. Append a one-line bullet to today's daily under "## Tickets done today".
  //    If today's daily doesn't exist yet, silently skip — user can re-log later.
  const dailyPath = `Daily/${today}.md`;
  const dailyFile = app.vault.getAbstractFileByPath(dailyPath);
  if (dailyFile) {
    let daily = await app.vault.read(dailyFile);
    const oneLine = (impressions || "").split("\n")[0].slice(0, 120);
    const bullet  = `\n- [[${ticketId}]] — ${oneLine}`;
    daily = daily.replace(/(##\s*Tickets done today)/, `$1${bullet}`);
    await app.vault.modify(dailyFile, daily);
  }

  new Notice(`Logged ${ticketId} as done`);
};
```

- [ ] **Step 4: Verify both files are valid JS**

```bash
node -c .obsidian/scripts/start-ticket.js && node -c .obsidian/scripts/log-ticket-done.js && echo OK
```

Expected: `OK`. Any SyntaxError means a copy-paste mismatch — re-paste the affected file.

- [ ] **Step 5: Commit**

```bash
git add .obsidian/scripts/start-ticket.js .obsidian/scripts/log-ticket-done.js
git commit -m "vault: add QuickAdd user scripts for start-ticket and log-ticket-done"
```

---

## Task 8: Wire QuickAdd choices

Configure the four choices the spec promises: **New idea**, **New decision**, **Start ticket**, **Log ticket done**. All four are reachable via `⌘P → QuickAdd: <choice name>`.

**Files:**
- Modified by Obsidian: `.obsidian/plugins/quickadd/data.json`

- [ ] **Step 1: Open QuickAdd settings**

Settings → QuickAdd → **Manage Macros** / **Add Choice** UI.

- [ ] **Step 2: Add "New idea" (type: Capture)**

Click **Add Choice** → name `New idea` → type **Capture** → ⚙ settings:
- **File name**: `Ideas/{{DATE:YYYY-MM-DD-HHmm}}.md`
- **Create file if it doesn't exist**: ON
- **Use template**: ON, path `Templates/idea.md`
- **Capture format**: `{{VALUE:idea}}` (this prompts for the idea text and appends it below the template frontmatter)
- **Append to file**: ON
- Save.

- [ ] **Step 3: Add "New decision" (type: Capture)**

Click **Add Choice** → name `New decision` → type **Capture** → ⚙:
- **File name**: `Decisions/{{DATE:YYYY-MM-DD}}-{{VALUE:slug}}.md`
- **Create file if it doesn't exist**: ON
- **Use template**: ON, path `Templates/decision.md`
- **Capture format**: leave default; the user fills the file body interactively.
- **Open file after capture**: ON
- Save.

- [ ] **Step 4: Add "Start ticket" (type: Macro)**

Click **Add Choice** → name `Start ticket` → type **Macro**. In the macro editor:
- **Add command** → **User Scripts** → select `start-ticket`.
- Save.

- [ ] **Step 5: Add "Log ticket done" (type: Macro)**

Click **Add Choice** → name `Log ticket done` → type **Macro**. In the macro editor:
- **Add command** → **User Scripts** → select `log-ticket-done`.
- Save.

- [ ] **Step 6: Smoke-test each choice**

In the vault, run each one from the command palette:

1. `⌘P` → **QuickAdd: Start ticket** → type `TEST-1`, title `smoke test`.
   - Expected: `Tickets/TEST-1.md` is created with frontmatter `status: in_progress` and opens in a tab. Today's daily note's `## Active tickets` block now shows TEST-1's `- [ ] In progress` line.
2. `⌘P` → **QuickAdd: New idea** → type "buy milk".
   - Expected: a new file `Ideas/<datetime>.md` exists, frontmatter intact, body contains "buy milk".
3. `⌘P` → **QuickAdd: New decision** → slug `routing`.
   - Expected: a new file `Decisions/<today>-routing.md` exists with the decision template body.
4. `⌘P` → **QuickAdd: Log ticket done** → ticket `TEST-1`, impressions "felt easy", decision blank, next blank.
   - Expected: `Tickets/TEST-1.md` frontmatter now reads `status: done`, the `- [ ] In progress` line is checked off, "## Impressions / friction" has a timestamped entry, today's daily has a `- [[TEST-1]] — felt easy` bullet under `## Tickets done today`, and TEST-1 is gone from the `## Active tickets` query.

- [ ] **Step 7: Clean up smoke-test artifacts**

```bash
rm Tickets/TEST-1.md
rm Ideas/*.md 2>/dev/null || true
rm Decisions/*-routing.md
```

Also clear the `## Tickets done today` line in today's daily by hand (open it in Obsidian, delete the `- [[TEST-1]] …` bullet).

- [ ] **Step 8: Commit**

```bash
git add .obsidian/plugins/quickadd/data.json
git commit -m "obsidian: wire QuickAdd choices for idea, decision, start-ticket, log-done"
```

---

## Task 9: macOS Shortcut "Did you log your last ticket?" with a global hotkey

The spec asks for `⌘⌥L` to trigger a notification: *"Did you log your last ticket?"*

**Files:** none in this repo. This step configures Shortcuts.app + System Settings.

- [ ] **Step 1: Create the Shortcut**

Open Shortcuts.app → **+ New Shortcut** → name it `Journaling: ticket nudge`.

Add one action: **Show Notification**.
- **Title**: `Journaling`
- **Body**: `Did you log your last ticket?`
- **Sound**: optional.

Close the editor; the shortcut auto-saves.

- [ ] **Step 2: Wire the global hotkey**

In Shortcuts.app, right-click `Journaling: ticket nudge` → **Add Keyboard Shortcut** → press `⌘⌥L`.

If macOS warns about a conflict, pick a different combo (e.g. `⌘⌥⌃L`) and update the rest of this plan accordingly.

- [ ] **Step 3: Verify**

Switch focus to any app and press `⌘⌥L`. A notification banner appears with title "Journaling" and body "Did you log your last ticket?".

If nothing happens: System Settings → Privacy & Security → Notifications → **Shortcuts** → **Allow notifications**.

- [ ] **Step 4: Document the hotkey in the vault**

Append to `Templates/daily.md` is **not** the right move — instead, add a one-liner to a new file `Daily/README.md` so it's discoverable in the vault but not pulled into every daily.

Create `Daily/README.md`:

```markdown
# Daily folder

This folder holds one note per day, auto-created by the Daily Notes plugin
from `Templates/daily.md`.

Global hotkey `⌘⌥L` shows a macOS notification: "Did you log your last ticket?".
```

- [ ] **Step 5: Commit**

```bash
git add Daily/README.md
git commit -m "vault: document the ⌘⌥L journaling-nudge hotkey"
```

---

## Task 10: Recurring 90-minute Reminder during work hours

Native macOS Reminders is the lightest-weight option that survives a reboot.

**Files:** none in this repo.

- [ ] **Step 1: Create the recurring reminder**

Open Reminders.app → **+ New Reminder** → title `Anything to capture?`.

Click the **info (ⓘ)** button on the reminder:
- **On a Day**: today.
- **At a Time**: 09:30.
- **Repeat**: **Custom…** → frequency **Hourly**, every `1.5` hours. (If macOS rejects fractional hours, use **every 90 minutes** via the explicit minutes field, or fall back to every 2 hours and accept the coarser cadence.)
- **End Repeat**: **Never**.

Save.

- [ ] **Step 2: Verify it survives a relaunch**

Quit Reminders.app, relaunch it, confirm the reminder still has the recurrence rule.

- [ ] **Step 3: Note the limitation**

The spec calls these reminders "crude on purpose" — that's fine. Document the cadence in `Daily/README.md` so a future you remembers which app to tweak.

Edit `Daily/README.md` (append):

```markdown

Recurring nag: macOS Reminders.app → "Anything to capture?", every 90 min.
```

- [ ] **Step 4: Commit**

```bash
git add Daily/README.md
git commit -m "vault: document the 90-min capture nag in Reminders.app"
```

---

## Task 11: Set up the 2-week Phase 1 retro

The spec requires a 15-minute retro at the end of week 2 to evaluate the success criteria. We pre-create the retro doc with the criteria already filled in so the future check-in is a 2-minute exercise.

**Files:**
- Create: `docs/superpowers/plans/2026-05-11-phase-1-retro.md`

- [ ] **Step 1: Create the retro checklist file**

```markdown
# Phase 1 retro — 2026-05-25

Cut-off date: 2026-05-25 (2 weeks after 2026-05-11).
Time-box: 15 minutes.

## Success criteria (from the spec)

- [ ] Morning daily opened ≥ 4 days/week (averaged over the 2 weeks).
- [ ] ≥ 60% of Linear tickets closed in this window have a same-day log entry.
- [ ] ≥ 1 decision file captured.

## How to measure

- **Mornings opened**: `ls Daily/*.md | wc -l` should be ≥ 8 over 14 days; cross-check by spot-reading 2–3 dailies that they aren't empty.
- **Tickets logged**: count files under `Tickets/` with frontmatter `status: done` whose `started` date is in window. Cross-check against the Linear "Done" filter for the same window.
- **Decisions**: `ls Decisions/*.md | wc -l` ≥ 1.

## Outcome

- [ ] All three met → proceed to Phase 2 plan.
- [ ] Any miss → debug friction first. Likely root causes (per spec): make the Shortcut more intrusive, simplify templates to 3 fields max, or accept that Linear isn't actually the source of truth (in which case Phase 2's Linear webhook is moot).

## Notes
```

- [ ] **Step 2: Add a Calendar event for the retro**

In Calendar.app, create an event on **2026-05-25 17:00** titled "Journaling Phase 1 retro" with the body `See docs/superpowers/plans/2026-05-11-phase-1-retro.md`. Set a 1-day-before alert.

(No automation here — the spec is explicit that Phase 1 stays manual.)

- [ ] **Step 3: Verify the retro file is excluded from Obsidian's indexing**

The vault's `.obsidian/app.json` already has `"userIgnoreFilters": ["docs/"]`, so the retro file is invisible to Obsidian's search. Confirm by opening Obsidian and `⌘O` searching for `phase-1-retro` — no result should appear.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-05-11-phase-1-retro.md
git commit -m "plans: pre-stage the 2026-05-25 Phase 1 retro checklist"
```

---

## Task 12: End-to-end dry run

A single one-shot rehearsal so the human knows the system works before relying on it for two weeks.

- [ ] **Step 1: Walk the morning flow**

Quit and relaunch Obsidian. Confirm today's daily note opens automatically (Daily Notes "Open on startup" was set in Task 3). Confirm:
- Title heading is today's date.
- "Yesterday" line is either `(no prior entry)` or the End-of-day block from the most recent daily.

- [ ] **Step 2: Walk the during-the-day flow**

In order: trigger `⌘⌥L` and dismiss the notification. Then ⌘P → **QuickAdd: New idea** → "test the dry run". Then ⌘P → **QuickAdd: Start ticket** → `DRY-1`, title "dry run".

Confirm the daily's `## Active tickets` block now lists DRY-1.

- [ ] **Step 3: Walk the ticket-done flow**

⌘P → **QuickAdd: Log ticket done** → ticket `DRY-1`, impressions "all good", decision blank, next blank.

Confirm:
- `Tickets/DRY-1.md` has `status: done`, the in-progress checkbox is ticked, impressions are timestamped.
- Daily note's `## Tickets done today` has `- [[DRY-1]] — all good`.
- `## Active tickets` no longer shows DRY-1.

- [ ] **Step 4: Walk the end-of-day flow**

In the daily, type real-looking content under `## End of day`. Save (⌘S).

- [ ] **Step 5: Tear down dry-run artifacts**

```bash
rm Tickets/DRY-1.md Ideas/*.md 2>/dev/null || true
```

In Obsidian, edit today's daily and remove the `- [[DRY-1]] — all good` bullet from `## Tickets done today`. Leave `## End of day` filled in — it's real content for tomorrow's "Yesterday" pull.

- [ ] **Step 6: Verify tomorrow's "Yesterday" pull works**

In Obsidian, ⌘P → **Templater: Create new note from template** → `daily.md` → save as `Daily/<tomorrow>.md`. (We're synthesizing tomorrow's note one day early as a test only.)

Confirm tomorrow's note's "Yesterday" line shows the End-of-day block you wrote in Step 4. Then **delete** the synthesized file (`rm Daily/<tomorrow>.md`) so the real daily is created fresh tomorrow.

- [ ] **Step 7: Commit final state**

```bash
git add -A
git status   # eyeball: only the real daily and any deliberate edits should be staged
git commit -m "vault: dry-run completed, Phase 1 ready for 2-week habit test"
```

If `git status` shows surprising files (e.g. `Tickets/DRY-1.md` still there), abort the commit, clean up, retry.

---

## Done — what's next

Phase 1 is live. Use it daily for 2 weeks. On 2026-05-25 the Calendar event fires, you open `docs/superpowers/plans/2026-05-11-phase-1-retro.md`, fill the checkboxes from the actual file counts, and decide whether to write the Phase 2 plan.

Do **not** start Phase 2 work before the retro. The whole point of the gate is to let the habit test answer the question of whether Phase 2 is worth building.
