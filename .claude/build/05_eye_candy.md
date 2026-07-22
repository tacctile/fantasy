# 05_eye_candy.md
**Wave 5 — Eye Candy**
**Status:** ⬜ Not started
**Registered:** 2026-07-21

---

## Scope

Score charts, lucky/unlucky tracker, positional breakdowns, playoff picture — all scoped to the current season only (no historical/year-over-year views, per project-wide rule). This wave extends the existing League Dashboard (Wave 4) with new analysis/visualization features built on top of the already-computed `player_scores` and standings/matchups data — it does not rebuild standings, matchups, power rankings, or player cards. Primarily an admin-surface (tablet/PC-first) feature set; only the lucky/unlucky summary and playoff status get simplified, separately-built mobile spectator equivalents — not every chart needs a spectator twin.

This build file was scoped by convergence-filtering 6 independent AI panel responses against `BUILD_INDEX.md`'s Wave 5 bullet, same methodology used for Waves 1, 2, 3a, 3b, and 4.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/in-season-management/points-for-against-luck-analysis.md` — the luck/all-play methodology this wave's tracker implements
- `wiki/topics/league-mechanics/roster-construction-starting-lineups.md` — roster-slot conventions needed for the positional breakdown calculator
- `wiki/topics/schema-reference/league-configuration-data-model.md` — `league_config` shape, including playoff team count needed for the playoff-picture engine

---

## Checklist

### Shared foundations
- [ ] Add chart color-scale CSS variables (categorical series, positive/negative divergence, positional accents, neutral grid/axis) to the existing shadcn theme — zero inline hex in any chart config, dark-mode compatible
- [ ] Build a shared chart-primitives layer (responsive container, tooltip, legend, axis formatters, loading/empty skeletons) with `tabular-nums` enforced on every axis tick, tooltip, and legend value
- [ ] Build a current-season league-context helper resolving `league_id`, `platform`, `season_year`, and `league_config` for both admin and share-token paths, with no hardcoded league count or platform assumption

### Score charts
- [ ] Build a weekly team-score aggregation query service returning each team's actual points per week for the current season, joined from existing `player_scores`/matchup data, scoped to one league
- [ ] Build the admin score-trend chart: multi-team weekly line/bar chart with a league-average reference series, team toggle, tabular-nums throughout
- [ ] Build a score-distribution/spread view (histogram or min/median/max band) contextualizing an individual team's scores against the league
- [ ] Integrate score charts into the existing admin league dashboard as a new "Score Trends" section, with loading/empty (no weeks scored yet) states

### Lucky/unlucky tracker
- [ ] Implement an all-play expected-wins calculation: for each team each week, compute its win share against every other team that same week (ties split evenly), current season only
- [ ] Implement a pure luck calculation (`actual wins − expected all-play wins`, plus cumulative luck through the current week) as a testable utility with no I/O
- [ ] Add unit tests covering ties, byes, incomplete weeks, zero completed weeks, and odd/even team counts
- [ ] Build the admin lucky/unlucky query service that loads current-season completed matchups/standings for one league and returns teams ranked by luck differential with stable tie-breakers
- [ ] Build the admin luck visualization (zero-centered diverging chart or ranked table) showing actual vs. expected record, luck delta, using positive/negative CSS-variable colors and tabular-nums
- [ ] Build a simplified spectator luck summary (a single season luck delta + short label per team) as a separate mobile component — no dense chart or table reused from admin

### Positional breakdowns
- [ ] Build a positional scoring aggregation service grouping current-season `player_scores` by roster and canonical position (QB/RB/WR/TE/K/DEF, flex/superflex attributed via `league_config` roster slots — no hardcoded standard roster shape)
- [ ] Build the admin positional breakdown visualization (stacked/grouped bar or radar) comparing a team's positional scoring mix against league averages
- [ ] Build a positional detail table (per-team totals, share percentages) with tabular-nums
- [ ] Add empty/edge-state handling for missing position data, byes, or incomplete current-season data, and unmapped ESPN players explicitly surfaced rather than silently dropped

### Playoff picture
- [ ] Implement a playoff-rules resolver reading playoff team count, seeding order, and any division/bye rules from `league_config` — no hardcoded bracket size or seed count
- [ ] Implement a pure playoff-picture calculation using current standings and remaining schedule to compute each team's clinched/eliminated/in-contention status and magic number to clinch, current season only
- [ ] Add unit tests covering preseason/late-season states, ties, incomplete schedules, and arbitrary league sizes/playoff-spot counts
- [ ] Build the admin playoff-picture table/matrix (seed, record, points-for, status badge, magic number) with tabular-nums
- [ ] Build a simplified spectator playoff-status view (clinched/bubble/eliminated list only, no magic-number grid) as a separate mobile component

### Integration and resilience
- [ ] Assemble the four admin sections (score charts, lucky/unlucky tracker, positional breakdown, playoff picture) into the existing admin league dashboard as a new analysis area
- [ ] Wire the spectator luck summary and playoff-status components into the existing share-token spectator surface, using only share-token-scoped queries that never select `draft_state` or admin-only fields
- [ ] Add loading/empty/error states for every new section so one section's failure (or an ESPN-specific data gap) never blocks the rest of the dashboard

---

## Explicitly NOT in this wave

- League report generator, free agent board, PWA manifest/service worker (Wave 6)
- Any draft-related UI or logic (already built, Wave 3a/3b)
- Rebuilding standings, matchups, power rankings, or player cards from scratch (Wave 4, already built — extended here, not replaced)
- Any historical, season-over-season, or year-over-year view (explicitly rejected for v1 project-wide)
- A spectator twin for every admin chart — only the luck summary and playoff status get simplified mobile equivalents in this wave

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (adds the luck, positional-breakdown, and playoff-picture calculation services) and `DESIGN_SYSTEM.md` if new chart color tokens were added.
