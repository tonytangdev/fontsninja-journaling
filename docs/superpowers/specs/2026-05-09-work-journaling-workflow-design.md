---
title: Work journaling workflow
date: 2026-05-09
status: approved
owner: tony
---

# Work journaling workflow

A two-phase, Mac-only journaling system for daily standups, ticket reflections, decision logs and idea capture. Phase 1 validates the habit using Obsidian alone. Phase 2 adds an MCP server and Linear webhook for conversational capture and event-driven reminders.

## Goals

- Make standup prep a 2-minute morning read of one page.
- Capture ticket impressions and decisions within minutes of finishing the work, while context is fresh.
- Capture random ideas in under 10 seconds, without breaking flow.
- Get reminded to log when a Linear ticket transitions to Done — the moment the habit is hardest to keep.
- Keep all data as plain markdown so the journal outlives any tool.

## Non-goals

- Web UI / mobile app / Obsidian plugin. Vault + Claude Desktop is enough.
- Bidirectional Linear sync. The vault contains thoughts about tickets, not the tickets themselves.
- Auto-creation of Linear tickets from ideas. Claude suggests, the human decides.
- Multi-user, sharing, team features. Purely personal.

## Guiding principles

1. **Markdown plain-text always.** No proprietary database. The journal must survive any tool.
2. **Capture < 10 seconds.** Templates and shortcuts do all the structural work.
3. **Habit before tooling.** No code is written until Phase 1 proves the habit holds.
4. **AI augments, doesn't replace.** Claude reorganizes and synthesizes; the human still captures the raw input.
5. **Linear is the source of truth for tickets.** The vault references ticket IDs, never duplicates ticket state.

## Architecture (target — Phase 2)

```
                ┌──────────────┐
                │   Linear     │
                └──────┬───────┘
                       │ poll (1/min)
                       ▼
              ┌──────────────────┐
              │ macOS LaunchAgent│  ── notif ──► macOS Notification Center
              └──────────────────┘                       │
                                                         │ click
                                                         ▼
              ┌──────────────┐  MCP   ┌──────────────┐
              │Claude Desktop│◄──────►│  MCP Server  │
              │  (capture)   │  tools │  (local TS)  │
              └──────────────┘        └──────┬───────┘
                                             │ read/write
                                             ▼
                                   ┌─────────────────────┐
                                   │  Obsidian Vault     │
                                   │  (markdown files)   │
                                   │   - Daily/          │
                                   │   - Tickets/        │
                                   │   - Ideas/          │
                                   │   - Decisions/      │
                                   └─────────────────────┘
                                             ▲
                                             │ visual review
                                   ┌─────────────────────┐
                                   │  Obsidian app       │
                                   │ (morning daily read)│
                                   └─────────────────────┘
```

In Phase 1 only the vault and the Obsidian app exist. Capture is manual, reminders are macOS Shortcuts.

---

## Phase 1 — Vault-only (validate the habit)

### Vault layout

```
fontsninja-journaling/         ← this folder = the Obsidian vault
├── Daily/
│   └── 2026-05-09.md           ← one file per day (auto by Daily Notes)
├── Tickets/
│   └── ABC-123.md              ← one file per Linear ticket worked on
├── Ideas/
│   └── 2026-05-09-1432.md      ← off-ticket ideas, datetime-stamped
├── Decisions/
│   └── 2026-05-09-router.md    ← key tech decisions (lightweight ADRs)
├── Templates/
│   ├── daily.md
│   ├── ticket.md
│   ├── idea.md
│   └── decision.md
└── .obsidian/                   ← Obsidian config (committed)
```

Four directories, one intent each. Decisions stay separate from Tickets so they can be retrieved independently — a decision often outlives the ticket that triggered it.

### Plugins (4, anti-bloat)

- **Daily Notes** (built-in) — auto-creates today's note from `Templates/daily.md`.
- **Templater** — dynamic variables and includes (date, current ticket, prompts, pulling yesterday's "End of day" into today's "Yesterday").
- **QuickAdd** — `Cmd+P` shortcuts: "New idea", "New decision", "Log ticket done", "Start ticket". One mental model: pick intent, fill form, done.
- **Tasks** — interactive checkboxes with cross-file queries (active tickets list on the daily).

No AI plugins in Phase 1. AI comes via Claude in Phase 2.

### Templates

`daily.md`:

```markdown
# {{date}}

## Standup script
- Yesterday: <auto-pulled from yesterday's "End of day">
- Today:
- Blocked:

## Quick notes


## Active tickets
<Tasks query: tickets in progress>

## End of day
- Worked on:
- Status: [blocked / continuing tomorrow / done]
- Tomorrow's goal:
```

`ticket.md`:

```markdown
---
ticket: ABC-123
linear_url:
status: in_progress
started: {{date}}
---

# ABC-123 — <title>

## Context
## Decisions made
## Impressions / friction
## Done / Tomorrow
```

`idea.md`:

```markdown
---
captured: {{date}} {{time}}
status: raw
needs: [ticket? message? nothing?]
---

<just the idea, raw>
```

`decision.md`:

```markdown
---
date: {{date}}
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

### Daily workflow

**Morning (2 min).** Open Obsidian → today's daily note exists. The "Yesterday" line is pre-filled by Templater from `[[<yesterday>]]#End of day`. Eyeball, tweak, ready for standup.

**During the day.**
- Random thought → `Cmd+P` → "New idea" → 5-second capture into `Ideas/`.
- Loose note tied to today → typed under "Quick notes" in the daily.
- Starting a Linear ticket → `Cmd+P` → "Start ticket" → asks for ID, creates `Tickets/<id>.md` from template.

**On ticket completion** (the hardest habit). `Cmd+P` → "Log ticket done" → 4-field QuickAdd form (`ticket id`, `impressions`, `key decision`, `next ticket?`). Output: appends to `Tickets/<id>.md`, flips frontmatter `status: done`, adds a line to today's daily.

**On a real decision.** `Cmd+P` → "New decision" → form with 3 option slots, links back to the current ticket.

**End of day (3 min).** Open today's daily, fill the "End of day" block. That block becomes tomorrow's "Yesterday" auto-fill. Loop closed.

### Phase 1 reminder strategy

Native **macOS Shortcuts** only (no third-party install):
- A global keyboard shortcut `Cmd+Opt+L` triggers a Shortcut that shows a notification: *"Did you log your last ticket?"*
- A recurring macOS Reminder every 90 min during work hours: *"Anything to capture?"*

Crude on purpose. The point of Phase 1 is to find out whether a passive nudge is enough. If it isn't, the answer is event-driven (Phase 2), not a fancier nag.

### Phase 1 success criteria (gate to Phase 2)

After 2 calendar weeks:

- [ ] Morning daily opened ≥ 4 days/week.
- [ ] ≥ 60% of Linear tickets closed during these 2 weeks have a same-day log entry.
- [ ] ≥ 1 decision file captured.

If all three hit, Phase 2 is justified. If any miss, **debug the friction first** — don't add tech complexity. Likely root causes: rendezr the Shortcut more intrusive, simplify templates to 3 fields max, or accept that Linear isn't actually your source of truth (in which case Phase 2's Linear webhook design is moot).

A 15-minute mini-retro at the end of week 2 shapes Phase 2 priorities.

---

## Phase 2 — MCP server + Linear webhook

### MCP server

A local TypeScript stdio MCP server. Claude Desktop calls its tools. The server reads/writes the vault directly.

**Stack.** TypeScript, `@modelcontextprotocol/sdk`, plain `fs` for vault I/O, a tiny Linear API client for reads. ~300–500 LOC. No framework, no DB.

**Layout** (separate repo or sibling folder, **not** inside the vault):

```
fontsninja-journal-mcp/
├── src/
│   ├── index.ts              ← MCP server entrypoint
│   ├── tools/                ← one file per tool
│   ├── vault.ts              ← markdown read/write helpers (append-only)
│   └── linear.ts             ← Linear API client (minimal)
├── package.json
└── README.md
```

**Tool surface (6 tools, kept minimal):**

| Tool | Behavior | Writes |
|---|---|---|
| `start_ticket` | Creates `Tickets/<id>.md` with frontmatter; fetches title from Linear API | `Tickets/<id>.md` |
| `log_ticket_done` | Appends impressions + decisions to ticket file; flips frontmatter `status: done`; appends a line to today's daily | `Tickets/<id>.md`, `Daily/<today>.md` |
| `log_idea` | Creates a timestamped idea file | `Ideas/<datetime>.md` |
| `log_decision` | Creates a decision file with options/choice/why; links back to current ticket | `Decisions/<date>-<slug>.md` |
| `daily_briefing` | Reads yesterday's daily and active tickets; returns today's standup script | (read-only) |
| `end_of_day` | Prompts for "worked on / status / tomorrow's goal"; writes to today's daily | `Daily/<today>.md` |

Storage is still markdown files in the vault. Deleting the MCP server leaves the vault fully usable — that is the contract.

### Linear webhook → macOS notification

**Chosen approach: local polling.** A LaunchAgent runs every 60s, queries Linear's GraphQL for issues moved to `Done` since the last poll, fires a notification via `terminal-notifier` (or `osascript display notification`).

Trade-offs considered:

- *Cloud webhook → ntfy/Pushover → Mac.* More reliable across sleep/wake; introduces a serverless function as one more moving part. Switch to this only if local polling proves unreliable.
- *Local polling.* Zero infrastructure, fully self-hosted, easier to debug. ≤60s lag is acceptable. Linear's free tier (1500 req/h) leaves enormous headroom for 1 req/min.

**Notification flow:**
1. You move ABC-123 to Done in Linear.
2. Within ≤60s, macOS notification: *"Just finished ABC-123? Click to log."*
3. Click → opens Claude Desktop with a pre-filled prompt: *"I just finished ABC-123, here's my impression: …"*.
4. You dictate or type. Claude calls `log_ticket_done`. Vault updated.

**Same flow for end-of-day.** A Calendar event at 18:00 fires a Shortcut → opens Claude with the `end_of_day` prompt.

### Configuration

- `VAULT_PATH` — absolute path to the vault. Fail-fast if missing on startup.
- `LINEAR_API_TOKEN` — read-only scope on issues. In `.env`. `.env` gitignored. Never in the vault repo.
- `POLL_INTERVAL_SECONDS` — defaults to 60.

---

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Habit doesn't stick after 3 weeks | High | Phase 1 gate exists for this. If habit fails, kill the project; do not build Phase 2. |
| Linear API token leak | Medium | Token in `.env`, gitignored. MCP repo separate from vault repo. Read-only scope. |
| MCP write corrupts a markdown file | Low | All writes go through an `appendOnly` helper. No `rm`, no overwriting under existing headers — only appending. Vault auto-committed daily by a LaunchAgent. |
| Claude calls a tool with wrong target (wrong ticket) | Medium | Each tool returns a confirmation showing what was written, with file path. The human sees the result inline before continuing. |
| Linear polling rate limits | Low | 1 req/min vs. 1500/h budget. Plenty of headroom. |
| Notification fatigue | Medium | Only two sources: ticket→Done (event-driven, infrequent) and 18:00 EOD (once/day). No timed nags. |
| Vault grows messy after months | Medium | Monthly Claude job: summarize last month's decisions and ideas into an archive note. Keep raw, layer summaries on top. |

## Edge cases the MCP server must handle

- **`log_ticket_done` for a ticket whose file does not exist.** Create the file with minimal frontmatter, then append. Do not error.
- **Logging impressions for the same ticket twice.** Append both with timestamps. Never overwrite.
- **Notification fires for a ticket that was never started via `start_ticket`.** Tool creates the file on the fly.
- **macOS sleeps during a poll cycle.** `KeepAlive: true` on the LaunchAgent. On wake, the next poll uses Linear's `updatedAt > lastSeen` filter to catch up missed transitions.
- **Vault renamed or moved.** Server reads `VAULT_PATH` from env and fails fast on startup if the folder is missing.

## Evolution path (Phase 3+, only if real friction emerges)

Each item below requires its own brainstorm + design pass. No drift.

- **Voice capture.** macOS Whisper Shortcut → text → Claude → MCP tool. Worth it if the user finds themselves wanting to log while pacing or away from the keyboard.
- **Auto-categorization of `Ideas/`.** Weekly Claude job tags each idea as `→ ticket` / `→ message` / `→ archive`. Human approves; Claude executes.
- **Linear ticket auto-creation from approved ideas.** Adds a `propose_ticket` MCP tool with a manual approval step.
- **Cross-vault semantic search.** Smart Connections plugin, only when vault > ~200 files.
- **Mobile capture.** PWA or Apple Shortcuts → ntfy webhook → MCP server. Only if Mac-only becomes painful.

## Open questions

- Should the design doc live inside the vault (current location) or in a sibling repo? Decision deferred — first commit lands here; can be moved later if Obsidian indexing of `docs/` becomes noisy.
- Default Linear team / project filter for the polling query? To be set when Linear API token is provisioned.
