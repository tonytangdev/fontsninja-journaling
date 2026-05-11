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
