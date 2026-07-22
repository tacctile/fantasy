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
- [ ] Add an `is_draft_active` flag (per league, e.g. on `league_config` or `leagues`) with a start/stop control surfacing it — toggling this is what elevates polling cadence
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
- [ ] Build a pure BPA scoring function that ranks undrafted players using ADP (from `adp_rankings`, Wave 3a), positional scarcity (remaining roster needs vs. remaining supply by position), and the league's scoring/roster-slot weights from `league_config` — no hardcoded scoring weights
- [ ] Expose the BPA function via a server-side query/action that returns the top-N ranked candidates for the selected league, given current `draft_state`
- [ ] Build a recommendations panel in the board sidebar showing the top few candidates with ADP, positional need signal, and score — tabular-nums throughout
- [ ] Wire recommendation rows to the same one-click draft action as the main table (shared logic, not duplicated)
- [ ] Recalculate recommendations immediately after any new pick lands, from any source

### Resilience
- [ ] Ensure the board remains usable read-only (falls back to Wave 3a's static behavior) if live polling, realtime, or BPA calculation degrades or errors
- [ ] Add tests covering: concurrent manual + poll writes racing on `(league_id, pick_number)` with only one accepted, ESPN poll failure isolation from Sleeper/other leagues, and BPA re-ordering after a pick is recorded

---

## Explicitly NOT in this wave

- Rebuilding the static board's core display primitives (player table, row component, filter/search/sort toolbar) from scratch — extended and made live, not replaced
- ADP ingestion, ADP schema, or ADP source management (Wave 3a, already built)
- Applying league scoring rules to compute live `player_scores` — Wave 4
- Standings, matchups, power rankings, or any in-season dashboard content — Wave 4
- The mobile-first read-only spectator/share-link surface — no live draft data or draft-board markup may ever reach that surface, at any wave
- Score charts, lucky/unlucky tracking, positional breakdowns, playoff picture — Wave 5
- League report generation, free agent board, PWA manifest/service worker — Wave 6
- Any staged "manual-first, then add polling later" sequencing — this was explicitly reversed by Nick; both ship together in this one wave

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (adds the manual-pick mutation, active-draft poll orchestration, and BPA scoring service).
