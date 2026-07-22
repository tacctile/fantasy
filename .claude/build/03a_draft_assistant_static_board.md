# 03a_draft_assistant_static_board.md
**Wave 3a — Draft Assistant — Static Board**
**Status:** 🟡 In progress (ADP schema + ingestion sub-section complete 2026-07-22; draft-board data layer next)
**Registered:** 2026-07-21

---

## Scope

Static draft board UI and ADP ingestion, no live polling. Depends on Wave 1's schema (`players`, `leagues`, `league_config`, `rosters`, ESPN crosswalk, `draft_state` table shape) and Wave 2's Sleeper sync being live (player catalog, league config, rosters). Does not require ESPN sync to be functional to render a board for Sleeper leagues, but must not crash or degrade the whole board if an ESPN league's data is stale/missing — same defensive-isolation principle as Wave 2. No writes to `draft_state`, no live/manual draft-pick entry, no BPA recommendation engine — all deferred to Wave 3b.

This build file was scoped by convergence-filtering 6 independent AI panel responses against `BUILD_INDEX.md`'s Wave 3a bullet, same methodology used for Waves 1 and 2.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/schema-reference/league-configuration-data-model.md` — `league_config` raw + derived shape, needed to resolve scoring format for ADP display
- `wiki/topics/league-mechanics/average-draft-position.md` — ADP definition and source conventions
- `wiki/topics/league-mechanics/multi-platform-adp-divergence.md` — why ADP varies by source/format, relevant to source/format selection in ingestion and UI

---

## Checklist

### ADP schema + ingestion
- [x] Migration: `adp_rankings` table keyed by `season_year`, `adp_source`, `sleeper_player_id` (FK to `players`) — columns for overall ADP, positional ADP/rank, scoring-format variant, ingested-at timestamp; unique constraint on `(sleeper_player_id, adp_source, season_year)` — *2026-07-22: shipped as migration `20260722175619`, pushed and live-verified (collision check passed against the full 60-table shared schema first). Correctness amendment (Nick-signed Clarify): this item's constraint predated source confirmation — the confirmed endpoint carries 12+ per-format `adp_*` fields per player with an open field inventory, so the shape is one row per scoring format: composite PK `(sleeper_player_id, adp_source, season_year, scoring_format)`, `scoring_format` deliberately unconstrained text (pattern ingestion), `adp_overall` check-constrained `>0 and <999` (999.0 sentinel backstop), `positional_rank` derived at ingestion (the source provides no positional ADP), current-snapshot-only semantics. Types regenerated.*
- [x] Add typed ADP domain types (`AdpEntry`/`AdpRow`, ingestion result type) under the project's types convention — named/`export type` per Code Conventions — *2026-07-22: `src/services/adp/types.ts` — permissive wire types (`AdpProjectionRecord` mirrors the observed array-element shape, every field optional + unknown-preserving per the wiki's permissive-parsing decision), `AdpEntry`, `AdpRow` (Insert alias), `AdpIngestionResult` with first-class skip/unmapped counts.*
- [x] **ADP source unconfirmed — verify before building (see MANUAL_SETUP_CHECKLIST.md):** no wiki page in `sleeper-api/` documents a public Sleeper ADP endpoint. Confirm whether one exists; if not, pick a real source (e.g. FantasyPros) before writing the ingestion service — do not build against an assumed endpoint. Build a server-only ADP ingestion service that fetches the confirmed source's data, validates the response shape, and normalizes rows against canonical `sleeper_player_id` (no separate identity system, per Schema Rule #4) — *2026-07-22: source CONFIRMED (Nick's decision of record + live-verified response shape on the MANUAL_SETUP_CHECKLIST.md Wave 3a item): Sleeper's undocumented projections endpoint, `api.sleeper.com/projections/nfl/{year}?season_type=regular`, per-format ADP fields keyed by native `sleeper_player_id`, no API key. The verify-before-building condition is satisfied; the ingestion build must honor the constraints recorded on that item (undocumented → defensive isolation; `api.sleeper.com` host split from the documented API; endpoint is wiki-silent per STATE.yml known_issues).* — *2026-07-22 BUILT: `src/services/adp/client.ts` (separate api.sleeper.com client — own pacing gate/backoff/`AdpSourceError`; verified request form only: `season_type=regular` + `position[]` QB/RB/WR/TE/K/DEF (Nick-signed) + `order_by`) and `src/services/adp/ingestion.ts` (`syncAdpRankings`: validate-before-swap, pattern-based `adp_*` extraction, positional-rank derivation, catalog-resolved identity). The wiki-silence note is stale since the same-day wiki-maintenance session — `sleeper-api/projections-endpoint` covers the surface and was read this session. Live-verified: 3,292 records → 2,946 rows across 10 formats; Bijan Robinson ppr 1.4/RB1 matches the wiki's twice-verified sample; `adp_rookie` and bare `adp_dynasty` were all-sentinel in this pull (consistent with the wiki's vestigial-field note).* explicitly (never silently dropped, never used to create a parallel identity row) — surfaced in ingestion result counts — *2026-07-22: `unmappedPlayerCount`/`unmappedPlayerIds` in `AdpIngestionResult`, skip-and-report (league-rosters precedent, self-heals after the next catalog run); live run: 0 unmapped — every ADP player resolved against the canonical catalog.*
- [x] Implement an idempotent upsert into `adp_rankings` for the current season/source — safe to re-run, preserves last-good snapshot if a fetch/validation fails — *2026-07-22: chunked upsert on the composite PK; validation + plausibility gates (array shape, ≥200-record floor, sample structure, ≥50%-of-existing insertable ratio) all run before any write. Judgment call, disclosed: after a fully-successful validated persist, rows the new snapshot no longer carries are deleted (current-snapshot semantics per Nick's schema sign-off; rosters/standings stale-row precedent + catalog complete-response-then-reconcile ordering). Idempotency live-verified: back-to-back runs identical (2,946 upserted, 0 stale both times).*
- [x] Wrap ADP ingestion in the same defensive error-isolation pattern as ESPN sync (Wave 2) — an ADP fetch failure must not affect Sleeper or ESPN sync paths — *2026-07-22: structurally separate `services/adp/` (own client, own `AdpSourceError`, no shared code path with `services/sleeper/`, never part of the orchestrator's league chain), plus `runTrackedAdpIngestion` — a never-throws containment wrapper both callers use; the sync-leagues piggyback logs/records an ADP failure without affecting the league-state outcome or status code.*
- [x] Extend the existing sync-run tracking table (from Wave 2) to log ADP ingestion runs — source, season, status, timestamps, record/skip/unmapped counts — *2026-07-22: migration `20260722180354` extends the `sync_runs_source_check` with `'adp_ingestion'` (constraint name verified live first); `SyncRunSource` union extended; `runTrackedAdpIngestion` writes the start/finish pair with full counts (fetched/with-adp/entries/upserted/stale/sentinel/implausible/unmapped). Global run: `league_id` null, platform `'sleeper'` (catalog precedent). Season rides in counts context, not a column (sync_runs deliberately has no season_year).*
- [x] Add a protected Vercel cron route for scheduled ADP ingestion, secured the same way as existing Wave 2 cron routes (secret header/token, not publicly invokable) — *2026-07-22: `GET /api/cron/sync-adp` — Bearer-`CRON_SECRET`-gated (`requireCronSecret`, fail-closed), counts-only response, 500 on failure. Scheduling amendment (Nick-signed Clarify): both Hobby cron slots are taken, so the route carries NO `vercel.json` entry — scheduled ADP ingestion piggybacks on the daily 10:00 UTC sync-leagues run in an isolated containment boundary with its own `sync_runs` row (`adpOk` surfaced in that route's response body; league-state status code unaffected). The dedicated route remains for on-demand runs and as the mount point if a dedicated slot opens at season start.*
- [x] Add a way to run ADP ingestion on demand during local development, independent of the cron route — *2026-07-22: `scripts/sync-adp.ts` via `npm run sync:adp [-- <season_year>]` (tsx `--env-file` pattern); season defaults from `/state/nfl` `league_season` per the nfl-state page's season-selection decision. Calls the service directly — no sync_runs row from the manual path (sync-players precedent).*

### Draft-board data layer
- [x] Build a server-side draft-board query service that joins `players` (Sleeper-anchored) with `adp_rankings` and the selected league's `rosters` to produce a merged, ADP-ordered player list scoped to one `league_id` — *2026-07-22: `src/services/draft-board.ts` → `getDraftBoardData(db, leagueId)`. Nick-signed decisions: board pool = ADP carriers ∪ league-rostered (ADP-less rostered sort last, null ADP); ADP season = latest ingested snapshot (current-market semantics; returned in context for display); ordering ADP asc nulls-last, `sleeper_player_id` tie-break. Live-verified against the real league: 276-player pool (245 ADP ∪ 174 rostered), top-5 matches market order, ordering invariant asserted.*
- [x] Derive per-player availability from that league's roster data (rostered vs. available) — explicit, not inferred from missing data — *2026-07-22: explicit `availability: 'rostered' | 'available'` from `roster_players` presence, with team attribution (`native_roster_id`, team/owner display names). Live-verified: rostered count exactly equals the league's `roster_players` row count (174).*
- [x] Resolve ESPN league players through the existing crosswalk so ESPN-league boards render the same Sleeper-anchored player fields as Sleeper-league boards — *2026-07-22: satisfied by construction — crosswalk resolution happens at Wave 2 ingestion (ESPN `playerId` → `sleeper_player_id` before rows reach `roster_players`/`draft_state`), so this service's single code path (every join keyed on `sleeper_player_id`, zero platform branching) serves ESPN boards identically. Disclosed: live ESPN verification impossible until ESPN leagues open (~mid-Aug, external blocker) — structurally complete now, exercised when the first ESPN league connects.*
- [x] Resolve the league's scoring/roster-slot context from `league_config` (PPR/half-PPR/TE-premium) for board display — no hardcoded scoring assumptions in application code — *2026-07-22: `DraftBoardLeagueContext` carries the full `derived_config` subset (ppr/te_premium/superflex/slot counts/league size, parsed defensively — malformed JSONB degrades to nulls, never invented defaults) plus the RESOLVED ADP FORMAT via `resolveAdpScoringFormat` (Nick-signed bucketed mapping: superflex→'2qb' precedence per multi-platform-adp-divergence's QB-sensitivity decision; ppr≥1→'ppr', 0<ppr<1→'half_ppr', 0→'std'; dynasty/IDP unmapped in v1; te_premium has no source ADP axis — display-only; NO cross-format fallback per average-draft-position's format-leakage rule). This closes the league-format→scoring_format gap recorded in STATE.yml known_issues. Live: full-PPR 1QB league → 'ppr'.*
- [x] Explicitly exclude `share_token` and any other spectator/admin-boundary fields from every draft-board query response — *2026-07-22: every query selects explicit columns (never `*`); `share_token`, `owner_id`, and `native_league_id` never appear in any select in the module. Live-verified: serialized full result asserted free of all boundary field names.*
- [x] Query service returns only leagues Nick owns — invalid or inaccessible `league_id` resolves to a not-found state, never a partial/leaked response — *2026-07-22: typed `{ ok: false, reason: 'league_not_found' }`; malformed IDs UUID-rejected before any query (so genuine DB errors still throw rather than masquerading as not-found); unknown UUIDs → maybeSingle null → not_found. Ownership is structural (every `leagues` row is Nick's per the Access Model; the service takes the caller's Supabase client, so the route layer's RLS-enforced client adds the second wall). Live-verified: unknown UUID and malformed-string cases both resolve not_found.*

### Draft-board route + page shell
- [ ] Add the admin-only draft-board route (e.g. `app/(admin)/leagues/[leagueId]/draft/page.tsx`) as a Server Component that fetches league config + merged player/ADP data server-side and passes it to a client shell — this route is never reused by or merged with the spectator rendering path
- [ ] Build the tablet/PC-first page shell (toolbar + player table region + detail/roster sidebar), using shadcn/ui primitives, Tailwind default spacing, CSS-variable colors, and `--radius` tokens only
- [ ] Build a league selector reflecting all of Nick's connected Sleeper and ESPN leagues (no hardcoded league count), switching the board by `league_id`
- [ ] Build a header/toolbar element showing league name, `platform` badge, season year, active ADP source, and last successful ingestion time

### Player list — display, filter, sort
- [ ] Build the player row component: name, NFL team, position, bye week, overall ADP, positional ADP/rank, availability state — `font-variant-numeric: tabular-nums` on every numeric field
- [ ] Apply position-based row/badge styling using shadcn CSS variables only (zero inline hex)
- [ ] Build a search/filter toolbar: debounced text search, position multi-select, and an available/all toggle
- [ ] Implement client-side (or server-paginated) sorting by ADP, positional rank, and player name, with a deterministic tie-breaker (`sleeper_player_id`) for stable ordering
- [ ] Implement filtering logic as a pure, memoized function/hook consuming the full player list and current filter/sort state
- [ ] Add a roster/positional-need context panel showing each drafted-so-far team's roster fill derived from `league_config` roster slots (static snapshot, no live updates)

### States + resilience
- [ ] Build a loading skeleton mirroring the board's real layout density
- [ ] Build empty states for: no ADP ingested yet for the current season/source, and zero players matching active filters — each with a clear next action
- [ ] Build an error boundary/fallback for the draft-board route that catches data-fetch failures without exposing raw error details, and ensures an ESPN-specific data gap degrades gracefully rather than blocking the whole board

---

## Explicitly NOT in this wave

- Any live draft polling (ESPN or Sleeper) — Wave 3b
- Manual click-to-draft write path or any write to `draft_state` — Wave 3b
- BPA (best-player-available) recommendation engine — Wave 3b
- Applying league scoring rules to compute live `player_scores` — Wave 4
- Standings, matchups, power rankings, or any in-season dashboard content — Wave 4
- The mobile-first read-only spectator/share-link surface — Wave 4
- Score charts, lucky/unlucky tracking, positional breakdowns, playoff picture — Wave 5
- League report generation, free agent board, PWA manifest/service worker — Wave 6

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (adds the ADP ingestion service and draft-board query service alongside Wave 2's sync services).
