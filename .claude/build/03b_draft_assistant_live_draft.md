# 03b_draft_assistant_live_draft.md
**Wave 3b — Draft Assistant — Live Draft**
**Status:** ⬜ Not started
**Registered:** 2026-07-21

---

## Scope

Manual click-to-draft AND live ESPN/Sleeper draft polling ship together in this single wave — both write to the same shared `draft_state` table (schema from Wave 1; poll write paths for `source='sleeper_poll'`/`source='espn_poll'` already built in Wave 2), enforcing first-write-wins via the existing `(league_id, pick_number)` unique constraint. No staged manual-first/poller-later sequencing. Also includes the BPA (best-player-available) recommendation engine. Depends on Wave 3a (static board UI/data layer) and Wave 2 (ESPN integration must be live). This wave extends and makes live the Wave 3a board — it does not rebuild the player table, row component, or filter/search/sort toolbar from scratch.

This build file was scoped by convergence-filtering 6 independent AI panel responses against `BUILD_INDEX.md`'s Wave 3b bullet, same methodology used for Waves 1, 2, and 3a.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/sleeper-api/draft-endpoint.md` — draft pick response shape, polling considerations
- `wiki/topics/espn-api/draft-detail-response-structure.md` — ESPN draft pick response shape and quirks
- `wiki/topics/espn-api/rate-limits-and-blocking.md` — constraints on raising ESPN polling frequency during a live draft

---

## Checklist

### Manual click-to-draft write path
- [ ] Add a server-side manual-pick mutation (Route Handler or server action) that validates `league_id`, `pick_number`, `round`, `sleeper_player_id`, and target roster, then inserts into `draft_state` with `source='manual'`
- [ ] Rely solely on the existing `(league_id, pick_number)` unique constraint for conflict detection (`INSERT ... ON CONFLICT DO NOTHING` or equivalent) — return a typed result discriminating `accepted` vs. `conflict` (a poller already won that pick) vs. `validation_error`
- [ ] Restrict the manual-pick endpoint to Nick's authenticated admin session only — never reachable from the spectator/share-token surface
- [ ] Add an admin-only "undo last manual pick" action that deletes only the highest `pick_number` row for the league where `source='manual'` — must never delete `sleeper_poll`/`espn_poll` rows

### Active-draft polling orchestration
- [ ] Add an `is_draft_active` flag on a new admin-only table (e.g. `draft_sessions`, keyed by `league_id`) — NOT on `leagues` or `league_config`, since both of those tables receive `share_token`-gated spectator SELECT access in Wave 4, and draft state must never be spectator-reachable at any wave. Add a start/stop control surfacing it — toggling this is what elevates polling cadence
- [ ] Tune the existing Wave 2 Sleeper draft-state poller to a high-frequency interval (e.g. every 5 seconds) while `is_draft_active` is true for that league, falling back to its normal cadence otherwise
- [ ] Tune the existing Wave 2 ESPN draft-state poller to the same high-frequency cadence under the same flag, within ESPN's existing defensive isolation boundary — an ESPN polling failure must not affect the Sleeper poller, other ESPN leagues, or any Sleeper-sourced feature
- [ ] Add backoff/retry handling in the ESPN live poller for rate-limit or transient failure responses, so aggressive polling cadence cannot invalidate cookies or trip rate limits
- [ ] Record every active-draft poll run (source, league, status, timestamps, accepted/rejected counts, error summary) in the existing sync-run tracking table

### Client-side live sync
- [ ] Build a client polling/subscription mechanism (interval-based re-fetch, or Supabase Realtime if adopted) scoped to the active `league_id`, active only while the draft board is visible and `is_draft_active` is true
- [ ] Merge incoming `draft_state` rows into the board's existing player/availability derivation (from Wave 3a) by `pick_number`, deduplicating so repeated snapshots don't cause redundant re-renders
- [ ] Add optimistic UI for a manual pick: immediately mark the player unavailable and pending in local state, then reconcile on server response
- [ ] On conflict (a poller won the pick first), roll back the optimistic update, adopt the authoritative row, and surface a non-blocking toast — no retry loop
- [ ] Add a live status indicator (last successful poll time, active polling source, connection health) in the board toolbar

### Live board UI extensions (built on top of Wave 3a, not replacing it)
- [ ] Add a "Draft" action to the existing player row, visible only when `is_draft_active` is true and the player is available, disabled while its own request is in flight
- [ ] Derive and display the current pick number, round, and team on the clock from `draft_state` count plus snake-draft order from `league_config`
- [ ] Extend the existing static roster/positional-need panel from Wave 3a to update live as picks land from any source (manual, Sleeper poll, ESPN poll)
- [ ] Add a compact recent-picks feed (pick number, round, player, roster, source badge distinguishing manual/sleeper_poll/espn_poll)
- [ ] Ensure the drafted-player set continues to correctly drive the existing filter/search/sort toolbar's "available only" behavior live

### BPA recommendation engine

Base mechanism is Value-Over-Replacement (VORP/VBD), computed dynamically, with need kept as an independent signal rather than blended into the ranking score. This is a hard design constraint, not a preference: research across the panel is unanimous that blended "trust the algorithm" scores are distrusted by serious drafters, while separated signals with visible reasoning are preferred.

- [ ] Build a pure replacement-level calculation per position: the projected points of the last startable player at that position given the league's actual roster/flex/bench settings from `league_config` (e.g., a 12-team, 2-RB-starter league implies a replacement RB around RB24-30 depending on flex and bench demand) — no hardcoded roster shape
- [ ] Calibrate replacement-level depth against market ADP (from `adp_rankings`, Wave 3a) rather than a fixed round-count baseline, so roughly half of players at a position sit above/below their ADP-implied replacement line — this avoids classic VBD's tendency to overvalue QB/TE
- [ ] Build a pure base-value function: `player_projection − replacement_projection` for each undrafted player, using the league's scoring weights from `league_config` — no hardcoded scoring weights
- [ ] Make replacement level and base value recompute after every pick as the available player pool shrinks — this dynamic recompute is what makes positional scarcity real-time rather than a pre-draft snapshot; do not cache a static pre-draft replacement baseline
- [ ] Build a separate, independent roster-need signal (remaining starter slots vs. remaining bench slots by position, from current roster state and `league_config`) — this must never multiply into or reorder the base VORP ranking
- [ ] Expose the BPA function via a server-side query/action returning the top-N ranked candidates (ranked purely by base VORP value) for the selected league, given current `draft_state`, each annotated with its independent need signal
- [ ] Build a recommendations panel in the board sidebar showing the top few candidates with ADP, base VORP value, and an inline need badge/tag ("Fills starter need," "Bench depth," "Position full") displayed alongside — never merged into — the value ranking, tabular-nums throughout
- [ ] Wire recommendation rows to the same one-click draft action as the main table (shared logic, not duplicated)
- [ ] Recalculate base VORP and replacement levels immediately after any new pick lands, from any source

### Tier-cliff detection
- [ ] Build a pure tier-boundary calculation per position: sort undrafted players within the position by projection (or VORP z-score), insert a tier boundary wherever the point-gap between consecutive players exceeds a per-position threshold — tune thresholds tighter for RB/WR (deeper positions) than QB/TE (shallower positions)
- [ ] Target tier counts as a starting calibration, not a hard rule: roughly 3-5 tiers for QB/TE, roughly 6-9 tiers for RB/WR
- [ ] Recompute tier boundaries alongside the base VORP recompute after every pick, since the shrinking pool shifts where gaps fall
- [ ] Surface a live "N remaining in this tier" counter per position in the board UI — this is the highest-leverage piece of the tier system, since it tells the drafter whether to reach now or wait for the next tier

### Positional run detection
- [ ] Build a pure run-detection function using a sliding window over the last N picks (recommend N=5-6) with a same-position count threshold (recommend 3-4 within that window) to flag an active run
- [ ] Use position-specific thresholds: lower trigger threshold for shallow positions (QB/TE) than deep ones (RB/WR)
- [ ] Surface run detection as a non-blocking inline badge near the position filter — never a modal or blocking interrupt
- [ ] Keep run detection purely informational: it must never auto-adjust BPA ranking or base VORP directly — only the dynamic replacement-level recompute (already triggered by each pick) is allowed to move rankings. Run detection and value recalculation are separate, independently inspectable mechanisms even though a run will naturally shift replacement level too

### Draft queue and auto-pick
- [ ] Build a user-ordered queue (priority list) per league/session, stored independently of and never silently reordered by the BPA/recommendation engine
- [ ] When a queued player is drafted by anyone else (manual, Sleeper poll, or ESPN poll): remove from queue, promote the next queued player automatically, and surface a brief non-blocking notification
- [ ] Build roster-construction-aware auto-pick: when the draft clock expires or the user is away, walk the queue top-to-bottom and skip any player who would violate a hard roster rule (e.g., a 3rd QB before the bench is otherwise full) rather than blindly taking queue position 1 — auto-pick must never draft a queue entry that breaks a hard roster constraint
- [ ] Build directly against Sleeper's live draft API/WebSocket for this single Sleeper-hosted league — no generic multi-platform sync layer, no ESPN/Yahoo/other-platform fallback logic for queue or auto-pick

### Resilience
- [ ] Ensure the board remains usable read-only (falls back to Wave 3a's static behavior) if live polling, realtime, or BPA calculation degrades or errors
- [ ] Add tests covering: concurrent manual + poll writes racing on `(league_id, pick_number)` with only one accepted, ESPN poll failure isolation from Sleeper/other leagues, BPA/replacement-level recompute after a pick is recorded, tier-boundary recompute after a pick shifts the pool, run-detection triggering/resetting across a sliding window, and auto-pick skipping a queue entry that violates a hard roster rule

---

## Explicitly NOT in this wave

- Rebuilding the static board's core display primitives (player table, row component, filter/search/sort toolbar) from scratch — extended and made live, not replaced
- ADP ingestion, ADP schema, or ADP source management (Wave 3a, already built)
- Applying league scoring rules to compute live `player_scores` — Wave 4
- Standings, matchups, power rankings, or any in-season dashboard content — Wave 4
- The mobile-first read-only spectator/share-link surface — no live draft data or draft-board markup may ever reach that surface, at any wave
- Score charts, lucky/unlucky tracking, positional breakdowns, playoff picture, trade evaluation, waiver/FAAB recommendations — Wave 5
- League report generation, free agent board, PWA manifest/service worker — Wave 6
- Any staged "manual-first, then add polling later" sequencing — this was explicitly reversed by Nick; both ship together in this one wave
- Multi-platform draft sync abstraction — this tool targets a single Sleeper-hosted league; no ESPN/Yahoo/other-platform draft queue or auto-pick fallback

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (adds the manual-pick mutation, active-draft poll orchestration, BPA/replacement-level scoring service, tier-boundary service, run-detection service, and queue/auto-pick service).
