<%*
const today = tp.date.now("YYYY-MM-DD");
let priorFile = null;
let priorDate = "";
for (const f of app.vault.getMarkdownFiles()) {
  if (!f.path.startsWith("Daily/")) continue;
  const name = f.basename;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) continue;
  if (name >= today) continue;
  if (name > priorDate) { priorDate = name; priorFile = f; }
}
let yesterdayEOD = "(no prior entry)";
if (priorFile) {
  const content = await app.vault.read(priorFile);
  const m = content.match(/##\s*End of day\s*\n([\s\S]*?)(?=\n##\s|$)/);
  if (m && m[1].trim()) yesterdayEOD = `_(from ${priorDate})_\n${m[1].trim()}`;
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
