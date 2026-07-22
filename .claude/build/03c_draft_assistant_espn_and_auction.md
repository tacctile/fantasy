# 03c_draft_assistant_espn_and_auction.md
**Wave 3c — Draft Assistant — ESPN Live Draft + Auction**
**Status:** 🔴 Blocked (external timing — ESPN commissioner-locked, expected ~mid-August 2026)
**Registered:** 2026-07-22 (split from `03b_draft_assistant_live_draft.md`)

---

## Scope

Everything ESPN-related for live draft mechanics (client, cookie auth, player-identity crosswalk sync, live-draft polling, `draft_state` writes) AND auction-specific draft mechanics for ESPN (nomination/bid state, budget tracking, auction-specific BPA/valuation logic) — both scoped to ESPN only. Sleeper does not support auction drafts on this platform (Nick's decision of record); Sleeper snake-draft live mechanics live in `03b_draft_assistant_live_draft.md`, which is unblocked and buildable now. This file depends on Wave 2's ESPN integration being live (currently `[!]` blocked in `02_data_pipeline.md`) and on `03b`'s shared mechanisms (manual-pick write path, active-draft session flag, live board UI shell, BPA/tier/run-detection engines) as the foundation ESPN and auction extend rather than duplicate.

### Why this file exists

The original `03b_draft_assistant_live_draft.md` bundled Sleeper snake, ESPN snake, and no auction support into one wave, which meant the entire wave was blocked on ESPN's commissioner-lock even though Sleeper snake mechanics have zero ESPN dependency. This file isolates the genuinely-blocked scope (ESPN, plus auction which only applies to ESPN leagues) so `03b` can be built immediately and this file can be picked up the moment ESPN unblocks.

---

## Blocked — do not start

**Blocked 2026-07-22 (Nick-signed, external timing), consistent with `02_data_pipeline.md`'s ESPN sub-sections:** ESPN leagues are commissioner-locked until 2026 season setup opens (expected ~2026-08-19 → 2026-09-02). Do not guess visibility, fabricate placeholder league IDs, or attempt to build against assumed ESPN response shapes ahead of that unlock. When ESPN unblocks: resolve `02_data_pipeline.md`'s ESPN manual-setup items first (per `STATE.yml`'s `nick_pending` entry), flip those `[!]` items back to `[ ]`, then flip this file's items back to `[ ]` and self-locate a build session here.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/espn-api/draft-detail-response-structure.md` — ESPN draft pick response shape (`teamId` as ownership, `keeper` flag, `bidAmount` for auction), quirks
- `wiki/topics/espn-api/rate-limits-and-blocking.md` — constraints on raising ESPN polling frequency during a live draft
- `wiki/topics/league-mechanics/auction-draft-budget-allocation.md` — discretionary-budget calculation, replacement-level-to-dollar conversion, stars-and-scrubs vs. balanced allocation, dead-zone overpricing pattern

---

## Checklist

### ESPN client + active-draft polling
- [!] Add a dedicated, server-only ESPN live-draft client extending Wave 2's isolated ESPN HTTP client (no shared code path with Sleeper) — reads `mDraftDetail`, structurally isolated so an ESPN draft-polling failure never affects Sleeper-sourced features or other ESPN leagues
- [!] Tune the ESPN draft-state poller to the same high-frequency cadence as `03b`'s Sleeper poller, gated by the same `is_draft_active` flag on `draft_sessions` (from `03b`) — no new active-draft flag table
- [!] Add backoff/retry handling in the ESPN live poller for rate-limit or transient failure responses, so aggressive polling cadence cannot invalidate cookies or trip rate limits, per `espn-api/rate-limits-and-blocking.md`
- [!] Record every ESPN active-draft poll run (source, league, status, timestamps, accepted/rejected counts, error summary) in the existing sync-run tracking table, same shape as `03b`'s Sleeper poll-run logging

### ESPN player identity + draft-state write path
- [!] Resolve every ESPN draft pick's `playerId` through the Wave 1 crosswalk table to `sleeper_player_id` before writing to `draft_state` — unresolved mappings recorded explicitly, never silently dropped, never used to create a parallel identity row
- [!] Implement ESPN draft-state polling write path → shared `draft_state` table, `source='espn_poll'`, same first-write-wins `(league_id, pick_number)` constraint as the Sleeper and manual paths
- [!] Read team ownership from each pick's `teamId` field directly, never from a reconstructed snake-order formula — per `espn-api/draft-detail-response-structure.md`'s Key Decision; `overallPickNumber`/`roundId`/`roundPickNumber` are ground truth, not derived
- [!] Filter out `keeper: true` picks before any draft-value, ADP, or positional-run analysis fed by ESPN data — keeper status stored as a separate fact from any league-specific keeper-cost rule (which lives in `league_config`, not inferred from the pick record)

### ESPN live board integration (extends 03b's shell, does not duplicate it)
- [!] Extend `03b`'s live status indicator, recent-picks feed, and roster/positional-need panel to render ESPN-sourced picks (source badge `espn_poll`) alongside Sleeper — same components, no ESPN-specific UI fork
- [!] Ensure an ESPN polling failure degrades that league's live board to `03a`'s static read-only behavior without affecting any Sleeper league's live board

### Auction — schema and valuation foundation
- [!] Confirm `draft_state.amount` (from Wave 1) is sufficient for auction winning-bid storage — no new migration expected; auction picks populate `amount` from ESPN's `bidAmount`, coerced/validated, never trusted as a confirmed value without checking the `keeper` flag first per `espn-api/draft-detail-response-structure.md`'s Auction bidAmount Key Decision
- [!] Build a pure discretionary-budget calculation: total league budget minus the sum of minimum bids across every roster spot on every team, from `league_config` roster slots and the draft's budget setting — never treat the full nominal budget as available for value allocation, per `auction-draft-budget-allocation.md`'s Key Decision
- [!] Build auction-specific replacement-level calculation using the same flex-pooled, format-specific methodology as `03b`'s Sleeper VORP engine, but computed as a distinct model for single-QB vs. superflex/2QB formats — reuse `03b`'s pure replacement-level function shape, do not fork a parallel implementation from scratch
- [!] Build a pure dollar-value conversion: distribute the discretionary budget proportionally across all players with positive value-over-replacement, then add the minimum-bid floor back on top — per `auction-draft-budget-allocation.md`
- [!] Flag fragile, non-elite mid-tier players (particularly RBs with uncertain receiving/goal-line roles) as an auction-specific overpricing-risk category, distinct from clearly-elite or clearly-cheap/high-variance players — the auction "dead zone" pattern; this is a Nick-signed build-time decision on the specific detection heuristic, deferred to when this item is actually picked up, not solved here

### Auction — live draft state and UI
- [!] Track live remaining budget and remaining open roster slots per team from `draft_state` (amount-bearing rows) and `rosters`, surfaced as first-class in-draft auction tooling — per `auction-draft-budget-allocation.md`'s Key Decision on real-time budget-tracking guidance
- [!] Build a nomination/current-bid state view (who is nominated, current high bid, time remaining if applicable) reflecting `draft_state`'s incoming ESPN poll rows — read-only display of ESPN's authoritative auction state, this tool does not nominate or bid on Nick's behalf (read-only platform rule, no exception for auction)
- [!] Extend the recommendations panel (from `03b`) with an auction mode: candidates annotated with computed dollar value and remaining-budget context instead of snake-draft VORP rank alone — same underlying replacement-level engine, different display/annotation layer
- [!] Do not build any nomination-order strategy feature (which team to nominate against) — per `auction-draft-budget-allocation.md`'s Open Questions, nomination-order edge is not corroborated as generalizable; out of scope for v1

### Resilience
- [!] Ensure the board remains usable read-only (falls back to `03a`'s static behavior) if ESPN polling, auction valuation, or budget-tracking degrades or errors, isolated from any Sleeper league's live board
- [!] Add tests covering: ESPN poll failure isolation from Sleeper/other ESPN leagues, concurrent manual + ESPN-poll writes racing on `(league_id, pick_number)` with only one accepted, keeper-pick filtering before value analysis, discretionary-budget calculation correctness against a known roster/budget configuration, and auction dollar-value recompute after a pick changes the available pool

---

## Explicitly NOT in this wave

- Any Sleeper draft mechanics — `03b_draft_assistant_live_draft.md`, unblocked and built independently
- Rebuilding `03b`'s shared shell (manual-pick write path, `draft_sessions`/`is_draft_active`, live board UI primitives, BPA/tier/run-detection core engines) from scratch — this file extends those, it does not duplicate them
- Applying league scoring rules to compute live `player_scores` — Wave 4
- Standings, matchups, power rankings, or any in-season dashboard content — Wave 4
- The mobile-first read-only spectator/share-link surface — no live draft data or draft-board markup may ever reach that surface, at any wave
- Nomination-order strategy guidance — declared out of scope per the Open Questions in `auction-draft-budget-allocation.md`
- Score charts, lucky/unlucky tracking, positional breakdowns, playoff picture, trade evaluation, waiver/FAAB recommendations — Wave 5
- League report generation, free agent board, PWA manifest/service worker — Wave 6
- Any write to Sleeper, ESPN, or any other external platform — this tool never nominates, bids, or drafts on Nick's behalf on any external platform; ESPN's own live draft state is the sole source of truth for what actually happened, ingested read-only via polling

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (adds the ESPN active-draft poll orchestration, ESPN draft-state write path, auction budget/valuation service, and auction UI state service).
