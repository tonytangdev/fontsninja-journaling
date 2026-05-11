# Phase 1 retro — 2026-05-26

Cut-off date: 2026-05-26 (Pentecost Monday 2026-05-25 is a holiday — pushed one day).
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
