# 05_eye_candy.md
**Wave 5 — Eye Candy**
**Status:** ⬜ Not started
**Registered:** 2026-07-21

---

## Scope

Score charts, lucky/unlucky tracker, positional breakdowns, playoff picture, trade evaluation, and waiver/FAAB recommendations — all scoped to the current season only (no historical/year-over-year views, per project-wide rule). This wave extends the existing League Dashboard (Wave 4) with new analysis/visualization features built on top of the already-computed `player_scores` and standings/matchups data — it does not rebuild standings, matchups, power rankings, or player cards. Primarily an admin-surface (tablet/PC-first) feature set; only the lucky/unlucky summary and playoff status get simplified, separately-built mobile spectator equivalents — not every chart needs a spectator twin.

Trade evaluation and waiver/FAAB recommendations were added to this wave's scope on 2026-07-21 (previously unclaimed by any build file). Amending Wave 5 rather than registering a new build file, because both features are read-only analysis/recommendation surfaces consuming the same `player_scores`/`league_config`/roster data this wave already assembles, and the trade evaluator's positional-fit panel directly reuses this wave's positional-breakdown bar component rather than building a new one — a separate build file would only recreate a dependency this wave already has. This amendment was made before any Wave 5 work started, consistent with the Build File Amendment Norm's "genuine requirement change" exception.

This build file was scoped by convergence-filtering 6 independent AI panel responses against `BUILD_INDEX.md`'s Wave 5 bullet, same methodology used for Waves 1, 2, 3a, 3b, and 4. The trade/waiver amendment and the presentation-layer guidance below were scoped by a further reconciliation pass cross-validating 6 draft-day-mechanics research rounds and 6 in-season-analytics-UX research rounds against this file.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/in-season-management/points-for-against-luck-analysis.md` — the luck/all-play methodology this wave's tracker implements
- `wiki/topics/league-mechanics/roster-construction-starting-lineups.md` — roster-slot conventions needed for the positional breakdown calculator
- `wiki/topics/schema-reference/league-configuration-data-model.md` — `league_config` shape, including playoff team count needed for the playoff-picture engine
- `wiki/topics/league-mechanics/trade-value-calculation.md` — settled VBD-based trade value math (replacement level, ~15-20% consolidation premium, dynasty/redraft modes) this wave's trade evaluator displays
- `wiki/topics/league-mechanics/waiver-wire-faab-strategy.md` — settled FAAB strategy guidance (front-loading, role-certainty bidding, positional scarcity multipliers); note the scoring formula itself is NOT settled — see Waiver/FAAB recommendations section below

---

## Checklist

### Shared foundations

**Standing anti-pattern note (applies to every visualization built in this wave):** the following chart types are rejected outright, per unanimous convergence across 6 independent in-season-analytics-UX research passes — do not use them anywhere in Wave 5, including future amendments: radar/spider charts (fail at multi-entity comparison, area-distorts perception), gauges/speedometers (poor data-to-ink ratio), pie/donut charts for comparisons, full branching scenario trees (combinatorially unreadable), opaque composite scores/single "grade" numbers without a visible component breakdown, spaghetti multi-line charts with more than ~4 series on one chart (use small multiples instead), and 3D or animated-for-decoration charts.

- [ ] Add chart color-scale CSS variables (categorical series, positive/negative divergence, positional accents, neutral grid/axis) to the existing shadcn theme — zero inline hex in any chart config, dark-mode compatible
- [ ] Build a shared chart-primitives layer (responsive container, tooltip, legend, axis formatters, loading/empty skeletons) with `tabular-nums` enforced on every axis tick, tooltip, and legend value
- [ ] Build a shared small-multiples layout primitive for any comparison exceeding ~4 series, reused across score trends, positional comparisons, and any future multi-team chart in this wave
- [ ] Build a current-season league-context helper resolving `league_id`, `platform`, `season_year`, and `league_config` for both admin and share-token paths, with no hardcoded league count or platform assumption

### Score charts
- [ ] Build a weekly team-score aggregation query service returning each team's actual points per week for the current season, joined from existing `player_scores`/matchup data, scoped to one league
- [ ] Build the admin weekly-points chart as a bar chart, not a line chart — discrete per-week data is better communicated by bars than a line implying false continuity between weeks
- [ ] Build the admin rolling/cumulative score-trend chart as a line chart with a league-average (or expectation) reference line for context — this is the one score-chart view where a line is correct, since it's tracking a genuine cumulative trend
- [ ] Cap any single score chart at ~4 team series before switching to the shared small-multiples layout primitive (one mini-chart per team) rather than overplotting
- [ ] Build a score-distribution/spread view (histogram or min/median/max band) contextualizing an individual team's scores against the league
- [ ] Use sparklines (not full charts) for score trend in any table/list row context; expand to the full bar/line chart only on click/drill-down
- [ ] Integrate score charts into the existing admin league dashboard as a new "Score Trends" section, with loading/empty (no weeks scored yet) states

### Lucky/unlucky tracker
- [ ] Implement an all-play expected-wins calculation: for each team each week, compute its win share against every other team that same week (ties split evenly), current season only
- [ ] Implement a pure luck calculation (`actual wins − expected all-play wins`, plus cumulative luck through the current week) as a testable utility with no I/O
- [ ] Add unit tests covering ties, byes, incomplete weeks, zero completed weeks, and odd/even team counts
- [ ] Build the admin lucky/unlucky query service that loads current-season completed matchups/standings for one league and returns teams ranked by luck differential with stable tie-breakers
- [ ] Build the admin luck visualization as a league-wide ranked horizontal diverging bar chart, centered at zero, sorted by luck magnitude — never a lone abstract score. Frame each team's bar/label in actual-vs-expected-record terms (e.g., "7-2 actual / 5.4-3.6 expected"), not an abstract index, so it reads without a legend. Use positive/negative CSS-variable colors and tabular-nums throughout
- [ ] Build a per-team drill-down view (separate from the primary ranked view) showing weekly luck accumulation over the season as a diverging bar or line chart
- [ ] Build a simplified spectator luck summary (a single season luck delta + short label per team, in actual-vs-expected terms) as a separate mobile component — no dense chart or table reused from admin

### Positional breakdowns
- [ ] Build a positional scoring aggregation service grouping current-season `player_scores` by roster and canonical position (QB/RB/WR/TE/K/DEF, flex/superflex attributed via `league_config` roster slots — no hardcoded standard roster shape)
- [ ] Build the single-team-vs-league positional breakdown visualization as horizontal bars, one per position, centered/anchored on league average, with rank/percentile labeled at the bar endpoint — radar is explicitly rejected for this view
- [ ] Build the multi-team positional comparison visualization as a heatmap grid (teams × positions, color-coded by percentile), sortable by column, with the requesting user's team pinned/highlighted
- [ ] Build a positional detail table (per-team totals, share percentages) with tabular-nums
- [ ] Add empty/edge-state handling for missing position data, byes, or incomplete current-season data, and unmapped ESPN players explicitly surfaced rather than silently dropped

### Playoff picture
- [ ] Implement a playoff-rules resolver reading playoff team count, seeding order, and any division/bye rules from `league_config` — no hardcoded bracket size or seed count
- [ ] Implement a pure playoff-picture calculation using current standings and remaining schedule to compute each team's clinched/eliminated/in-contention status and magic number to clinch, current season only
- [ ] Add unit tests covering preseason/late-season states, ties, incomplete schedules, and arbitrary league sizes/playoff-spot counts
- [ ] Build the admin playoff-picture table/matrix (seed, record, points-for, status badge, magic number) with tabular-nums. Status badges are one of Clinched / Controls Own Path / Needs Help / Eliminated, paired with a plain-language magic-number sentence (e.g., "Clinch with: a win, OR [Team X] loses") — do not build a probability-style bar or any probabilistic-looking visual, since this platform's playoff mechanism is deterministic clinch/eliminate, not simulation-based, and a probability-shaped display would misrepresent that
- [ ] Build an optional interactive layer: matchup-outcome toggles for each remaining game that let the user set a hypothetical result and see standings/clinch-status recompute live using the existing deterministic playoff-picture calculation (no new probabilistic logic) — this was the most-praised interactive pattern across the research panel and is worth the build effort
- [ ] Explicitly avoid full scenario trees or any visual resembling a probability distribution/simulation output
- [ ] Build a simplified spectator playoff-status view (clinched/bubble/eliminated list only, no magic-number grid, no interactive toggles) as a separate mobile component

### Trade evaluation

Calculation is settled — use `wiki/topics/league-mechanics/trade-value-calculation.md` (VBD-based, league-specific replacement level, ~15-20% tunable consolidation premium for multi-player-to-one-player trades, structurally distinct redraft/dynasty/keeper modes, separate market-consensus vs. model-projected value tracks). This section is display-only; do not reinterpret or re-derive the calculation.

- [ ] Build the trade-value calculation service per the wiki-documented formula: league-specific replacement level from `league_config`, evaluated by effect on each side's optimal starting lineup and bench depth (not a sum of individual chart values), with the consolidation premium applied to the single-elite-asset side of any multi-player package
- [ ] Reject a flat "Fair/Unfair" binary verdict entirely — do not build one, even as a secondary label
- [ ] Build a two-sided value ledger: horizontal stacked bars showing value given vs. value received, segmented by individual player so composition is visible, not just totals
- [ ] Build a centered balance indicator with a neutral/dead-zone band (e.g., roughly ±5% renders as "even") rather than a hard pass/fail cutoff
- [ ] Build a before/after positional-fit panel reusing the single-team-vs-league positional bar component from the Positional breakdowns section above, shown pre-trade vs. post-trade with deltas highlighted — this is the mechanism that makes "fair value but bad fit" visible without a paragraph of text; keep it a second, independent readout, never collapsed into the value ledger's single score
- [ ] Add an optional "add X to make it even" suggestion when a trade is close to the neutral band but not quite balanced
- [ ] Add empty/edge-state handling for proposed trades involving injured/bye-week players and incomplete roster data

### Waiver/FAAB recommendations

**Calculation is a genuine open gap — do not invent the scoring formula in this session.** `wiki/topics/league-mechanics/waiver-wire-faab-strategy.md` documents strategy (front-load 40-50% of FAAB by week 4, bid on role certainty not box-score production, positional scarcity multipliers for RB handcuffs and superflex QBs, zero-dollar claims, league-specific bid calibration) but no scoring formula. Recommended direction for a follow-up session: opportunity-based scoring (snap share / target share / touch share trends) rather than points-based (points lag opportunity and get inflated by touchdown variance) — this is a recommendation to carry into that follow-up, not a specification to build against now.

- [ ] **DEFERRED — needs its own scoping session before build:** the waiver/FAAB candidate scoring formula (opportunity-based signal weighting, positional scarcity multiplier magnitudes, bid-dollar conversion). Do not write scoring logic against a guessed formula.
- [ ] Build the display layer against a placeholder/stubbed scoring service so UI work isn't blocked on the formula session: tiered grouping (Must-Add / Priority / Speculative / Watch) as the primary visual differentiator — not a raw 1-N ranked list, not font-size-as-signal
- [ ] Build dense single-line recommendation rows: player/position/team, one-sentence reason (not a paragraph), small trend sparkline showing opportunity-share trend specifically (not points), suggested FAAB bid or claim priority
- [ ] Pair each recommendation row with a suggested drop candidate inline, turning the recommendation into a one-decision action rather than a research starting point
- [ ] Add row expansion on click for deeper stats — never cram secondary stats into the default row
- [ ] Add empty-state handling for leagues with no viable waiver claims in a given week

### Integration and resilience
- [ ] Mount the six admin sections (score charts, lucky/unlucky tracker, positional breakdown, playoff picture, trade evaluation, waiver/FAAB recommendations) into Wave 4's persistent sidebar navigation shell, filling the route slots Wave 4 reserved for this wave — not a standalone navigation frame
- [ ] Add a summary card for each section (luck rank, top waiver add, playoff status, any trade alerts) to Wave 4's dashboard/command-center home view, each deep-linking into its full section
- [ ] Build cross-feature contextual links between this wave's sections at natural analysis endpoints — e.g. a "weak at WR" positional-breakdown result links directly to the waiver recommendations view pre-filtered to WR, or to the trade evaluator pre-filtered to a WR-heavy trade partner — since a real analysis session is a chain of "so then what," not an isolated lookup
- [ ] Respect Wave 4's global sticky context (selected league/team/week) across all six sections rather than re-prompting for selection per section
- [ ] Wire the spectator luck summary and playoff-status components into the existing share-token spectator surface, using only share-token-scoped queries that never select `draft_state` or admin-only fields
- [ ] Add loading/empty/error states for every new section so one section's failure (or an ESPN-specific data gap, or the deferred waiver-formula stub) never blocks the rest of the dashboard

---

## Explicitly NOT in this wave

- League report generator, free agent board, PWA manifest/service worker (Wave 6)
- Any draft-related UI or logic (already built, Wave 3a/3b)
- Rebuilding standings, matchups, power rankings, or player cards from scratch (Wave 4, already built — extended here, not replaced)
- Rebuilding the admin sidebar navigation shell or dashboard/command-center home — built once in Wave 4, this wave mounts into it
- Any historical, season-over-season, or year-over-year view (explicitly rejected for v1 project-wide)
- A spectator twin for every admin chart — only the luck summary and playoff status get simplified mobile equivalents in this wave
- Inventing the waiver/FAAB scoring formula — explicitly deferred to a follow-up scoping session, see Waiver/FAAB recommendations section above
- Any radar/spider chart, gauge/speedometer, pie/donut comparison, full scenario tree, opaque composite score, >4-series spaghetti line chart, or 3D/decorative animation — rejected project-wide for this wave per the Shared foundations anti-pattern note
- Executing any trade or waiver claim against Sleeper/ESPN — this platform is read-only end-to-end; trade evaluation and waiver recommendations are decision-support only, never a transaction path

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (adds the luck, positional-breakdown, playoff-picture, trade-value, and waiver-recommendation-display calculation services — note the waiver scoring formula itself remains unbuilt pending its deferred scoping session) and `DESIGN_SYSTEM.md` if new chart color tokens were added.
