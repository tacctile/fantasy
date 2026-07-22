# 04_league_dashboard.md
**Wave 4 — League Dashboard**
**Status:** ⬜ Not started
**Registered:** 2026-07-21

---

## Scope

Standings, matchups, power rankings, player cards — for both the admin (owner) surface and the read-only share-link spectator surface, built together in this one wave per `MASTER_CONTEXT.md`'s Access Model (the spectator surface is explicitly not a separate later build). This is the first wave that needs computed fantasy points, so it also builds the scoring engine that turns raw synced stats into `player_scores`, driven entirely by each league's `league_config` — no hardcoded scoring assumptions. The spectator surface is a genuinely separate rendering path sharing only data-access logic with the admin surface, gated by `share_token` instead of owner auth, and must never expose draft-board, admin, or `draft_state` data or markup. Depends on Wave 1's schema, Wave 2's sync pipelines (raw stats/rosters/matchups), and Wave 3's admin route conventions — does not depend on or touch the draft assistant itself.

This build file was scoped by convergence-filtering 6 independent AI panel responses against `BUILD_INDEX.md`'s Wave 4 bullet, same methodology used for Waves 1, 2, 3a, and 3b.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/schema-reference/league-configuration-data-model.md` — `league_config` raw + derived shape, required to compute scoring correctly per league
- `wiki/topics/league-mechanics/ppr-half-ppr-standard-scoring.md` — scoring format variants the engine must support
- `wiki/topics/in-season-management/points-for-against-luck-analysis.md` — relevant context for standings/power-ranking presentation (luck/PF-PA framing is Wave 5 scope for charts, but informs what data this wave's queries need to expose)

---

## Checklist

### Fantasy scoring engine (new — required by every other item in this wave)
- [ ] Implement a pure `computeFantasyPoints(rawStats, scoringRules)` function that applies a league's `league_config` scoring rules (PPR/half-PPR/TE-premium and all stat weights) to raw per-player stats — no hardcoded league assumptions, fully unit-testable
- [ ] Add unit tests covering standard/PPR/half-PPR/TE-premium variants, fractional values, missing stats, and zero scores
- [ ] Implement an idempotent batch job that computes and upserts `player_scores` rows keyed by `(player_id, league_id, season_year, week)` for a given league, safe to re-run without duplicating
- [ ] Wire this computation into the existing Sleeper and ESPN sync pipelines (Wave 2) so scores recompute immediately after raw stats/rosters are synced, isolated per league so one league's bad config/data can't block others
- [ ] Represent score freshness/computation status explicitly (e.g. last-computed timestamp) so stale or partially computed scores are never silently presented as current

### Admin data-access layer (owner-authenticated, server-side)
- [ ] Build `getStandings(leagueId)` — team records, wins/losses/ties, points-for/against, ordered per league rules, scoped to current `season_year`
- [ ] Build `getMatchups(leagueId, week)` — head-to-head pairs with rosters/starters and both teams' computed scores from `player_scores`
- [ ] Build `getPowerRankings(leagueId)` — a single deterministic current-season formula (no historical/cross-season inputs) producing ordered teams with rank and rank-delta vs. standings
- [ ] Build `getPlayerCard(sleeperPlayerId, leagueId)` — Sleeper-anchored identity, roster/availability status in that league, and per-week computed scores for the current season, resolving ESPN players through the existing crosswalk
- [ ] Ensure every admin query is scoped to leagues Nick owns and never selects `share_token` or `draft_state`

### Admin UI (tablet/PC-first, extends existing admin route conventions)
- [ ] Build `StandingsTable` — dense table, tabular-nums, rank/team/record/PF/PA columns
- [ ] Build `MatchupsGrid` (or cards) — current week's head-to-head pairs with a week selector, tabular-nums scores
- [ ] Build `PowerRankingsList` — ranked teams with rank-delta indicator, tabular-nums
- [ ] Build a `PlayerCard`/detail panel — identity, roster status, per-week score line for the current season, tabular-nums (no charts — Wave 5 scope)
- [ ] Assemble the admin league dashboard page composing the four components above under owner auth, for any connected `league_id` (no hardcoded league count)
- [ ] Add a league selector so Nick can switch between all connected Sleeper/ESPN leagues from this dashboard
- [ ] Add a share-link settings panel (copyable spectator URL + a regenerate-token action) on the admin dashboard only

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

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (adds the scoring engine and dashboard query services) and note the new spectator route surface.
