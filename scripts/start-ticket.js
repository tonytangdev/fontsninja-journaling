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

  try {
    const file = await app.vault.create(path, content);
    await app.workspace.openLinkText(file.path, "", false);
  } catch (e) {
    new Notice(`Could not create ${ticketId}: ${e.message}`);
  }
};
