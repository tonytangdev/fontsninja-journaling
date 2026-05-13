---
name: daily-journal
description: Fill in today's daily journal in the fontsninja-journaling repo by auto-fetching today's Linear tickets and their comments. Use when the user says "daily journal", "fill journal", "EOD", "end of day", "wrap up the day", or pastes ticket IDs (DEV-####) inside `fontsninja-journaling/`. The user can add free-form notes ("I also reviewed someone's PR", "blocked on X", "tomorrow doing Y") and those get folded into Worked on / Status / Tomorrow's goal accordingly. Can run any time of day; always overwrites the `## End of day` section.
---

# Daily Journal

Auto-fill `Daily/$(date +%F).md` from Linear: figure out which tickets the user worked on today, pull their comments, write the `## End of day` section, backfill the `## Tickets done today` list, and create/backfill per-ticket files in `Tickets/`.

The user does not provide ticket IDs — fetch them. If the user *does* paste IDs, treat them as the authoritative list and skip the discovery query (still run the per-ticket lookup so you get titles + comments).

## Extra notes from the user

The user may add free-form context to their request — work that Linear won't know about. Examples:

- "I reviewed Dongwoo's PR"
- "had a long debugging session on the staging deploy with X"
- "spike on foundry customers, no ticket yet"
- "blocked on infra access tomorrow morning"

Treat anything in the user's message that isn't a ticket ID or a trigger phrase ("EOD", "wrap up", etc.) as **additional notes**. Fold them into the output:

- **Activity-shaped notes** ("reviewed X", "meeting with Y", "spike on Z") → append as their own bullet under `Worked on`, after the ticket bullets. Don't paraphrase aggressively — the user already wrote it concisely.
- **Blocker-shaped notes** ("blocked on …", "waiting for …") → drive the `Status:` line (lead with `Blocked — <reason>`).
- **Tomorrow-shaped notes** ("tomorrow I'm doing X", "next: Y") → use verbatim as the `Tomorrow's goal:` line, overriding the parent-rollup default.

When no tickets come back from Linear but the user provided notes, still write the EOD section using just those notes — don't require tickets.

## Workflow

### 1. Locate today's file

```bash
cd /Users/tony/Workspace/fontsninja-journaling   # if not already there
TODAY=$(date +%F)
DAILY="Daily/${TODAY}.md"
```

If `$DAILY` doesn't exist, stop and tell the user.

### 2. Fetch everything in one GraphQL call

```bash
linear api --variable today="${TODAY}T00:00:00Z" <<'GRAPHQL'
query($today: DateTimeOrDuration!) {
  viewer {
    assignedIssues(filter: { updatedAt: { gte: $today } }, first: 50) {
      nodes {
        identifier
        title
        url
        state { name type }
        parent {
          identifier
          title
          children {
            nodes { identifier title state { name type } }
          }
        }
        comments(filter: { createdAt: { gte: $today } }) {
          nodes {
            body
            user { name }
            createdAt
          }
        }
      }
    }
  }
}
GRAPHQL
```

This returns, in one shot:
- Every issue assigned to the user that was touched today
- Each issue's title, URL, current state, parent
- Each parent's full child list with states (drives the "continuing tomorrow" status)
- Today's comments on each ticket, with author name

Notes:
- `state.type` values: `triage`, `backlog`, `unstarted`, `started`, `completed`, `cancelled`. Workflow names like "Ready to test" map to `type: "started"`; "Done" maps to `type: "completed"`. Use the `name` for display, the `type` for logic.
- A ticket can show up with no comments and a trivial `updatedAt` (label tweak, automation) — that's fine, the journal benefits from listing it anyway. Drop it only if the title is obviously irrelevant.

If `assignedIssues.nodes` is empty, fall back to the daily file's existing `## Tickets done today` list. If that's also empty, stop and tell the user no work was found.

If the user pasted IDs in their message, use a per-ticket variant instead — same query but with `issue(id: $id)` per ID, or build a filtered `issues(filter: { identifier: { in: [...] } })` query.

### 3. Filter comments

For each issue, drop comments whose body looks like automated PR-link / merge / deploy bot noise:
- `Pull request opened by …`, `Pull request merged …`, `Deploy succeeded`, `Linked PR …`, GitHub-app boilerplate.
- Keep everything else, including the user's own comments — they're often the most useful (decisions, retrospective notes).

Keep author + body for the surviving comments — used in step 7.

### 4. Compute "continuing tomorrow"

For each unique parent in the result, inspect `parent.children.nodes`:
- Count children whose `state.type` is `started` or `unstarted` (still open). Capture up to 4 of their titles.
- If all children are `completed`/`cancelled`, the parent is done — note this for the Status line.

### 5. Backfill the daily file's `## Tickets done today` list

Add a bullet for every ticket from step 2 that isn't already in the list:

```
- [[DEV-####]] — <title>
```

For bullets already present with an empty title (`- [[DEV-####]] — ` with nothing after the em-dash), fill in the title. Never overwrite a bullet that already has user-written content after the em-dash.

### 6. Backfill or create `Tickets/DEV-####.md`

For each ticket:

- **If the file exists**, fill in only the empties:
  - Frontmatter `linear_url:` → set to the ticket URL if currently blank.
  - H1 heading `# DEV-#### — ` → fill the title if currently blank. Normalize separator to ` — ` (space, em-dash, space).
  - **Do not touch** `## Context`, `## Decisions made`, `## Impressions / friction`, `## Done / Tomorrow` — these are the user's journaling space.

- **If the file doesn't exist**, create it from `Templates/ticket.md`. Replace the template's Templater syntax:
  - `<% tp.file.title %>` → `DEV-####` (in frontmatter `ticket:` and the H1)
  - `<% tp.date.now("YYYY-MM-DD") %>` → today's date (frontmatter `started:`)
  - `<title>` placeholder in the H1 → the ticket title from Linear
  - Set frontmatter `linear_url:` to the ticket URL
  - Set frontmatter `status:` based on `state.type`: `done` if `completed`, `in_progress` otherwise.

### 7. Write the `## End of day` section

Always overwrite. Format:

```
## End of day
- Worked on:
	- <ticket summary line(s), see grouping rules>
	- <anything from Quick notes — PR reviews, meetings, spikes>
- Status: [blocked / continuing tomorrow / done]
	- <one line>
- Tomorrow's goal:
	- <one line>
- Notes from comments:
	- [[DEV-####]] (<author first name>): <terse paraphrase>
	- ...
```

The `Notes from comments:` bullet is optional — only include it if step 3 left substantive comments. Paraphrase tightly (one short line each), preserve French if the comment is French. Cap at ~5 lines; the user can click into tickets for more.

#### Grouping rules for "Worked on"

- **3+ tickets sharing a parent** → roll up: `- N <parent-name> tickets ([[DEV-A]] short-tag, [[DEV-B]] short-tag, ...)`. Use the ticket title's first 1–3 words as the short-tag.
- **1–2 tickets, or mixed parents** → one bullet per ticket: `- [[DEV-####]] — <title>`.
- Append a separate bullet for non-ticket work picked up from `## Quick notes` (PR reviews, meetings, spikes). Don't paraphrase aggressively — the user already wrote it concisely.

#### Status phrasing

- Parent still has open sub-issues (step 4) → `Continuing tomorrow — <N> <thing>s left (<list up to 4 names>)`.
- Parent's last sub-issues done today → `<parent-name> done` (or `… complete pending deploy` if deploy hasn't happened — pull this hint from Quick notes if present).
- Blocker mentioned in Quick notes or in a today-comment → lead with `Blocked — <reason>`.
- No parent, standalone tickets → `Done`.

#### Tomorrow's goal

- Default: describe the next chunk of the parent ticket work (e.g., "Migrate the remaining workers to nest 11").
- If the morning standup's "Tomorrow's goal" still applies (the work didn't happen today), restate it. Don't invent a new goal for variety.
- If the user gave a hint in their message ("tomorrow I'm doing X"), use that verbatim.

## Style

- Tabs (not spaces) for sub-bullet indentation — every existing daily file uses tabs.
- `[[DEV-####]]` wikilinks for ticket refs.
- French phrases ("MEP", "gestion foundry customers") are normal — preserve them, don't translate.
- The whole `## End of day` section should fit in ~6–12 lines. If it's longer, you're padding.
- Don't touch other sections of the daily file except for backfilling `## Tickets done today` titles.
- Don't add a trailing summary or signature.

## After writing

One sentence confirming what was filled in — number of tickets, parent rollup if any, whether comments contributed. Don't re-print the section unless the user asks.

## Example

GraphQL result returns four assigned issues all in state `Done` with parent `DEV-9371 Migrer vers nest 11 pour les jobs`. `parent.children.nodes` shows two more children still in `state.type: "started"`. One issue (`DEV-9446`) has a today-comment from Tony Tang explaining a fix.

Output written to `## End of day`:

```
## End of day
- Worked on:
	- 4 nest 11 migration tickets ([[DEV-9473]] font-families-worker, [[DEV-9474]] font-versions-worker, [[DEV-9475]] fonts-worker, [[DEV-9476]] fonts-tagging-worker)
	- [[DEV-9446]] — Débloquer le téléchargement de la facture de Mars
- Status: [blocked / continuing tomorrow / done]
	- Continuing tomorrow — 2 workers left to migrate
- Tomorrow's goal:
	- Migrer les workers restants vers nest 11
- Notes from comments:
	- [[DEV-9446]] (Tony): reports générés en local et upload sur ikoula — cron probablement défaillant
```
