# 04_league_dashboard.md
**Wave 4 — League Dashboard**
**Status:** 🟡 In progress (2026-07-22: Nick authorized Wave 4 ahead of ESPN-blocked 3b; scoring-engine sub-section resolved by Nick-signed correctness amendment — see sub-section note)
**Registered:** 2026-07-21

---

## Scope

Standings, matchups, power rankings, player cards — for both the admin (owner) surface and the read-only share-link spectator surface, built together in this one wave per `MASTER_CONTEXT.md`'s Access Model (the spectator surface is explicitly not a separate later build). Fantasy points are platform-scored and ingested as-received into `player_scores` by Wave 2's sync — no scoring computation happens in this wave (correctness amendment 2026-07-22, Nick-signed: the original "scoring engine turning raw synced stats into `player_scores`" premise predated Wave 2's shipped ingestion decision; see the amended sub-section below). The spectator surface is a genuinely separate rendering path sharing only data-access logic with the admin surface, gated by `share_token` instead of owner auth, and must never expose draft-board, admin, or `draft_state` data or markup. Depends on Wave 1's schema, Wave 2's sync pipelines (scored points/rosters/matchups), and Wave 3's admin route conventions — does not depend on or touch the draft assistant itself.

This build file was scoped by convergence-filtering 6 independent AI panel responses against `BUILD_INDEX.md`'s Wave 4 bullet, same methodology used for Waves 1, 2, 3a, and 3b.

Admin navigation shell (persistent sidebar, command-center home, sticky context) added to this wave's scope on 2026-07-21 via a cross-cutting reconciliation pass — previously undocumented anywhere. Assigned to Wave 4 rather than Wave 5 because it is the foundational IA layer the admin surface needs regardless of which analysis features exist yet, and Wave 5's sections are designed to mount into it rather than build their own frame. Made before any Wave 4 work started, consistent with the Build File Amendment Norm.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/schema-reference/league-configuration-data-model.md` — `league_config` raw + derived shape, required to compute scoring correctly per league
- `wiki/topics/league-mechanics/ppr-half-ppr-standard-scoring.md` — scoring format variants the engine must support
- `wiki/topics/in-season-management/points-for-against-luck-analysis.md` — relevant context for standings/power-ranking presentation (luck/PF-PA framing is Wave 5 scope for charts, but informs what data this wave's queries need to expose)

---

## Checklist

### Fantasy scoring engine — sub-section resolved by correctness amendment (Nick-signed, 2026-07-22)

Registered 2026-07-21 on the premise that Wave 2 would sync raw per-player stat lines. Wave 2 as shipped (2026-07-22, one day later) made the opposite, Nick-signed decision: `player_scores` is ingested as-received from platform-scored values (Sleeper's `players_points` map, league-scored by Sleeper per each league's own settings — pure ingestion, never computation; ESPN equivalents land the same way at ingestion when unblocked). No raw-stats table, sync, or wiki-covered source exists. Platform-scored ingestion is the source of record; a compute-from-raw-stats engine would require a new undocumented data source and is not v1 scope. The confirmation was never backswept against this file until now (Amendment Hygiene practice 1).

- [-] Implement a pure `computeFantasyPoints(rawStats, scoringRules)` function — cut 2026-07-22: no raw-stats source exists in the pipeline; `player_scores` is platform-scored at ingestion (Wave 2 decision of record)
- [-] Add unit tests covering standard/PPR/half-PPR/TE-premium variants, fractional values, missing stats, and zero scores — cut with the engine
- [-] Implement an idempotent batch job that computes and upserts `player_scores` rows — cut 2026-07-22: `syncLeagueMatchups` already upserts `player_scores` idempotently at ingestion
- [-] Wire this computation into the existing Sleeper and ESPN sync pipelines — cut 2026-07-22: ingestion already writes `player_scores` in the same sync pass, per-league isolated via the orchestrator
- [x] Surface the existing score freshness machinery (`fetched_at`/`is_final` on `player_scores`/`matchups`) in the dashboard UI so stale or non-final scores are never silently presented as current — re-worded 2026-07-22 (the schema machinery shipped in Wave 1/2; surfacing is the remaining work; belongs with the admin UI sub-section's fold)

### Admin data-access layer (owner-authenticated, server-side)
- [x] Build `getStandings(leagueId)` — team records, wins/losses/ties, points-for/against, ordered per league rules, scoped to current `season_year`
- [x] Build `getMatchups(leagueId, week)` — head-to-head pairs with rosters/starters and both teams' computed scores from `player_scores`
- [x] Build `getPowerRankings(leagueId)` — a single deterministic current-season formula (no historical/cross-season inputs) producing ordered teams with rank and rank-delta vs. standings
- [x] Build `getPlayerCard(sleeperPlayerId, leagueId)` — Sleeper-anchored identity, roster/availability status in that league, and per-week scores from `player_scores` for the current season, resolving ESPN players through the existing crosswalk (scope note, Nick-signed 2026-07-22: weeks a player was on no roster have no score row on any platform payload — render honestly as not-rostered, never invented)
- [x] Ensure every admin query is scoped to leagues Nick owns and never selects `share_token` or `draft_state`

### Admin UI (tablet/PC-first, extends existing admin route conventions)
- [x] Build `StandingsTable` — dense table, tabular-nums, rank/team/record/PF/PA columns
- [x] Build `MatchupsGrid` (or cards) — current week's head-to-head pairs with a week selector, tabular-nums scores
- [x] Build `PowerRankingsList` — ranked teams with rank-delta indicator, tabular-nums
- [x] Build a `PlayerCard`/detail panel — identity, roster status, per-week score line for the current season, tabular-nums (no charts — Wave 5 scope)
- [ ] Assemble the admin league dashboard page composing the four components above under owner auth, for any connected `league_id` (no hardcoded league count)
- [ ] Add a league selector so Nick can switch between all connected Sleeper/ESPN leagues from this dashboard
- [ ] Add a share-link settings panel (copyable spectator URL + a regenerate-token action) on the admin dashboard only

### Admin navigation shell and information architecture

This is the persistent admin shell that Wave 3a/3b's draft-day surface and Wave 5's analytics sections mount into — build it once here, as the foundational IA layer for the whole admin surface, not per-feature. Scoped from a cross-cutting reconciliation pass covering both draft-day and in-season-analytics research.

- [ ] Build a persistent sidebar navigation component for the admin surface (not top tabs) — scales better than tabs past ~5 sections for a power user who wants constant-time access to any section
- [ ] Build a dashboard/command-center home view: one summary card per major feature area (standings/power-rank snapshot now; luck rank, top waiver add, playoff status, and trade alerts once Wave 5 exists), each card a deep-link into its full feature page — this is what makes a 2-minute "quick check" session work without forcing full navigation
- [ ] Build global sticky context (selected league and, where applicable, selected team/week persists across sections as the user navigates) to eliminate re-selection friction between sections
- [ ] Leave explicit mount points/route slots in the sidebar for Wave 5's sections (Score Trends, Luck, Positional, Playoff Picture, Trade Evaluator, Waiver Recommendations) and Wave 6's report/free-agent-board sections, so those waves extend this shell rather than each building their own navigation frame

### Share-token infrastructure
- [ ] Add RLS `SELECT` policies on `leagues`, `league_config`, `rosters`, `matchups`, `standings`, and `player_scores` granting read access when a valid, matching `share_token` is presented — writes remain owner-only on every table
- [ ] Explicitly do NOT add any spectator read policy on `draft_state` — it must remain inaccessible via `share_token` entirely
- [ ] Implement an owner-only share-token regenerate/revoke action that issues a new unguessable token for a `league_id` and immediately invalidates the old one, without recreating the league

### Spectator surface (genuinely separate rendering path, mobile-first)
- [ ] Build a server-side spectator data loader that resolves `share_token` → `league_id` and fetches only standings/matchups/power-rankings/player-card data — returns a clean not-found result for invalid/revoked tokens, never touches `draft_state`
- [ ] Create the spectator route (e.g. `/share/[share_token]`) as a page that imports zero components from the admin dashboard path — shared data-access utilities are fine, shared UI components are not
- [ ] Build `SpectatorStandings` — mobile-first stacked cards, compact, tabular-nums, no admin controls
- [ ] Build `SpectatorMatchups` — mobile-first vertically stacked current-week score cards, no week-navigation control (current week only), no admin markup
- [ ] Build `SpectatorPowerRankings` — compact ranked list, no dense secondary metrics from the admin view
- [ ] Build a lightweight spectator player-card/drawer view — simplified summary, no admin tooling
- [ ] Compose the spectator page with league name/platform badge header, mobile-first single-column layout, shadcn tokens only, no login prompt or auth UI anywhere on the page

### Resilience and verification
- [ ] Add loading/empty/error states for standings, matchups, power rankings, and player cards on both surfaces, without leaking internal errors, and keeping ESPN-specific failures isolated from Sleeper-backed data
- [ ] Write a test asserting the spectator route's rendered response contains no admin-surface markup (draft board, BPA, admin nav, regenerate-token control)
- [ ] Write a test confirming `share_token`-scoped queries never return another league's data
- [ ] Write a test confirming `draft_state` is inaccessible via `share_token` (empty result or permission denied)

---

## Explicitly NOT in this wave

- Score charts, lucky/unlucky tracker, positional breakdowns, playoff picture (Wave 5 — Eye Candy)
- League report generator, free agent board, PWA manifest/service worker (Wave 6)
- Any draft-related UI or logic — already built in Wave 3a/3b, untouched here
- Any historical or season-over-season view (explicitly rejected for v1 project-wide)
- Treating the spectator surface as "the admin view with parts hidden" — it is a separate rendering path, not a UI toggle; this is a hard project rule, not a preference

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (adds the dashboard query services) and note the new spectator route surface and the admin sidebar navigation shell/command-center home (which Wave 5 and Wave 6 mount into rather than rebuilding).
