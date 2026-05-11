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
    try {
      ticketFile = await app.vault.create(ticketPath, seed);
    } catch (e) {
      new Notice(`Could not create ${ticketId}: ${e.message}`);
      return;
    }
  }

  // 2. Read, mutate, write the ticket file:
  //    - flip frontmatter status to done
  //    - check off the "- [ ] In progress" checkbox so the Tasks query drops it
  //    - append timestamped impressions and (optional) decision
  let content = await app.vault.read(ticketFile);
  content = content.replace(/^status:\s*in_progress\s*$/m, "status: done");
  content = content.replace(/^- \[ \] In progress\s*$/m, "- [x] In progress");

  const impressionLine = `\n- ${today} ${now}: ${(impressions || "").split("\n").join("\n  ")}`;
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
