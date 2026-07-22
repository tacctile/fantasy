# 02_data_pipeline.md
**Wave 2 — Data Pipeline**
**Status:** 🟡 In progress
**Registered:** 2026-07-21

---

## Scope

Sleeper sync built and validated first (no-auth, trivial case), then ESPN cookie-auth integration (harder, isolated defensively so its failures never cascade to Sleeper-sourced features), plus the cron/polling strategy that keeps both current. Depends on Wave 1's schema being live (`players`, `leagues`, `league_config`, `rosters`, `matchups`, `draft_state`, ESPN crosswalk table all already exist per `01_foundation.md`). Scoring calculation (applying league rules to raw stats) and any client-facing UI/polling hooks are explicitly out of scope — this wave is server-side ingestion only.

This build file was scoped by convergence-filtering 6 independent AI panel responses against `BUILD_INDEX.md`'s Wave 2 bullet, same methodology used for Wave 1 and for `wiki/` discovery ingestion.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/sleeper-api/players-endpoint.md` — bulk player fetch shape, caching/freshness cadence
- `wiki/topics/espn-api/authentication.md` — cookie model, public/private detection, validation-driven refresh
- `wiki/topics/espn-api/rate-limits-and-blocking.md` — silent-degradation failure pattern, caching as mitigation

Consult additional `sleeper-api`/`espn-api` pages as needed per specific endpoint (roster, matchup, draft-detail response-structure pages) — the three above are the mandatory minimum.

---

## Checklist

### Sleeper — client + player catalog (build and validate first, no auth required)
- [x] Build a typed, server-only Sleeper HTTP client (no auth headers, request timeout, structured error translation) — isolated module, reusable across all Sleeper endpoints
- [x] Implement full player-catalog fetch (`/players/nfl`) and bulk upsert into `players`, keyed on `sleeper_player_id` — per `sleeper-api/players-endpoint.md`, this is a large (~5MB+) payload; must be fetched at most once per day, never more often
- [x] Handle players no longer present in a completed catalog response — mark inactive, never delete (preserves historical roster/draft references)

### Sleeper — league-scoped sync
- [x] Implement Sleeper league metadata fetch (`/league/{league_id}`) → transform and upsert into `league_config` (scoring settings, roster slots as JSONB data, never hardcoded)
- [x] Implement Sleeper rosters + users fetch → upsert into `rosters`/`roster_players`/`standings` tables, scoped by `league_id` + `platform` + `season_year` (standings added by scope correction 2026-07-22, Nick's sign-off: the rosters endpoint's `settings` object is the sole Sleeper standings source and the live `standings` table was built expecting this sync — the original item text omitted it)
- [x] Implement Sleeper weekly matchups fetch → upsert into `matchups`, scoped by `league_id` + `season_year` + week (player_scores ingestion added by scope correction 2026-07-22, Nick's sign-off: the same response's `players_points` map is the `player_scores` table's documented source, already league-scored by Sleeper — pure ingestion, distinct from the Wave 4 compute-from-raw-stats exclusion)
- [x] Implement Sleeper draft-state fetch (`/draft/{draft_id}/picks`) → write into the shared `draft_state` table (schema from Wave 1) using `source='sleeper_poll'`; this write path shares the same first-write-wins unique constraint that manual entry and ESPN polling will also use in Wave 3 — Wave 2 only needs the Sleeper write path working correctly against that shared table, not the manual/ESPN paths themselves
- [x] Build a per-league Sleeper sync orchestrator that runs the above in dependency order (league config → rosters → matchups → draft-state; draft-state added by scope correction 2026-07-22, Nick's sign-off: the item text predates the draft-state item's addition to this sub-section — "the above" now includes it, and its roster FK fixes its position after rosters) and isolates a single bad league response from blocking sync of the other connected Sleeper leagues

### ESPN — isolated client + per-league access detection

**Blocked 2026-07-22 (Nick-signed, external timing):** ESPN leagues are commissioner-locked until 2026 season setup opens (expected ~2026-08-19 → 2026-09-02) — the Wave 2 ESPN `MANUAL_SETUP_CHECKLIST.md` items cannot exist until then (see that file's Wave 2 note + decision of record). Do not guess visibility or fabricate placeholder league IDs. Build order proceeds to the cron sub-section below, then Wave 3a (ESPN-independent per `BUILD_INDEX.md`). Flip these items back to `[ ]` when the manual items clear.

- [!] Build a dedicated, server-only ESPN HTTP client, structurally separate from the Sleeper client (no shared code path) — accepts `espn_s2`/`SWID` cookies only when actually needed
- [!] Implement per-league public/private detection: attempt an unauthenticated request first; only fall back to cookie-authenticated request if that fails — per `espn-api/authentication.md`, never assume private/cookie-auth is required without checking
- [!] Implement encrypted storage/retrieval for `espn_s2`/`SWID` per private league — cookies never reach the browser, never stored plaintext
- [!] Implement cookie validation (a minimal authenticated test call) so an expired/invalid cookie pair degrades only that specific league's ESPN sync, not the whole ESPN pipeline

### ESPN — player identity + league-scoped sync

**Blocked 2026-07-22:** same external-timing blocker as the sub-section above.

- [!] Implement ESPN↔Sleeper player crosswalk resolution using the Wave 1 crosswalk table — every ESPN player reference must resolve to a `sleeper_player_id` before being persisted; unresolved mappings are recorded explicitly, never silently dropped, never used to create a parallel identity row
- [!] Implement ESPN league metadata sync → `league_config`, using the same JSONB-as-data pattern as the Sleeper path (no hardcoded scoring assumptions, no ESPN-specific special-casing in application logic beyond the sync layer itself)
- [!] Implement ESPN rosters sync → `rosters`, resolving every roster player through the crosswalk before insert
- [!] Implement ESPN draft-state polling → same shared `draft_state` table, `source='espn_poll'`, same first-write-wins constraint as the Sleeper path
- [!] Wrap every ESPN fetch/parse/upsert operation in explicit error isolation (try/catch → log → skip that league → continue) — this is the single most-corroborated requirement across the panel: ESPN's fragile, unversioned API must never take down Sleeper-sourced features or other ESPN leagues' sync

### Cron / polling strategy
- [x] Add authenticated Vercel Cron route(s) — protected by a secret header/token, not publicly invokable
- [~] Configure `vercel.json` cron schedule: daily player-catalog refresh (once per day, respects the once-per-day Sleeper guidance), league-state sync (rosters/matchups/config) every 15 minutes, and a separate faster cadence path reserved for active-draft polling (the polling frequency itself is tuned in Wave 3b once the draft UI consumes it — Wave 2 just needs the scheduling mechanism and route wired correctly) — *2026-07-22: scheduling mechanism live and verified (vercel.json ships 2 daily crons — catalog 09:00 UTC, league-state 10:00 UTC — registration confirmed in the Vercel dashboard; draft fast path is an authenticated route with no schedule entry until Wave 3b, Nick's Clarify decision). The 15-minute league-state cadence is plan-gated — Vercel Hobby caps crons at once daily — and deferred to season start by Nick's decision (Pro upgrade or alternative trigger); flip to [x] when the sub-daily cadence ships.*
- [x] Add a sync-run tracking table (source, league_id, platform, status, started_at/completed_at, record counts, error summary) so sync health is visible without digging through Vercel logs — this is what makes ESPN's isolated failures actually diagnosable rather than just silently swallowed
- [>] In-season finality promotion — registered 2026-07-22 (Nick-signed scope-error correction: `ARCHITECTURE.md`'s matchups note deferred promotion "to the cron sub-section," but this sub-section's original three items never included it). Extend the daily league-state cron with a previous-week re-sync + promotion pass realizing the `sleeper-api/matchup-endpoint` ADR finality heuristic: when `season_type='regular'` and `week ≥ 2`, each daily run also re-syncs week−1 per league; NFL-state week advancement is the "all games for the week have completed" proxy, and a Friday-or-later (UTC) re-read whose scores match the stored rows (the daily cadence supplies the stable-repeat-read requirement) promotes that week's `matchups` + `player_scores` rows to `is_final=true` — changed values update in place and defer promotion to the next run. Both operationalizations are wiki-silent derivations, Nick-signed 2026-07-22 per Rule 12's genuine-silence provision. Plus the league-complete backstop: a league whose lifecycle status reads `complete` while unfinalized rows exist gets one automatic full-season sweep (self-healing after cron outages; retires the run-the-manual-sweep-after-completion dependency). Requires a caller-driven finality extension to `syncLeagueMatchups` (status-derived stamping alone cannot promote in-season). Deferred `[>]` by Nick's 2026-07-22 sequencing decision — flip to `[ ]` and build as its own fold once Wave 3a is progressing, or bundle with the season-start cadence session, whichever comes first; HARD DEADLINE: before the 2026 NFL week 1→2 rollover (~2026-09-15, promotion first needed ~2026-09-18)

---

## Explicitly NOT in this wave

- Applying league scoring rules to raw stats to compute `player_scores` (Wave 4 — dashboard/scoring display consumes this)
- Manual click-to-draft write path (Wave 3 — this wave only builds the Sleeper and ESPN automated write paths into the already-shared `draft_state` table)
- Any client-side polling hooks, Realtime subscriptions, or UI of any kind (Wave 3/4)
- Live/aggressive draft-day polling cadence tuning (Wave 3, once the draft board actually needs it)

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (this wave is the first to populate real service/sync-layer code).
