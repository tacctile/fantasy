# 03a_draft_assistant_static_board.md
**Wave 3a — Draft Assistant — Static Board**
**Status:** ⬜ Not started
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
- [ ] Migration: `adp_rankings` table keyed by `season_year`, `adp_source`, `sleeper_player_id` (FK to `players`) — columns for overall ADP, positional ADP/rank, scoring-format variant, ingested-at timestamp; unique constraint on `(sleeper_player_id, adp_source, season_year)`
- [ ] Add typed ADP domain types (`AdpEntry`/`AdpRow`, ingestion result type) under the project's types convention — named/`export type` per Code Conventions
- [ ] **ADP source unconfirmed — verify before building (see MANUAL_SETUP_CHECKLIST.md):** no wiki page in `sleeper-api/` documents a public Sleeper ADP endpoint. Confirm whether one exists; if not, pick a real source (e.g. FantasyPros) before writing the ingestion service — do not build against an assumed endpoint. Build a server-only ADP ingestion service that fetches the confirmed source's data, validates the response shape, and normalizes rows against canonical `sleeper_player_id` (no separate identity system, per Schema Rule #4) — *2026-07-22: source CONFIRMED (Nick's decision of record + live-verified response shape on the MANUAL_SETUP_CHECKLIST.md Wave 3a item): Sleeper's undocumented projections endpoint, `api.sleeper.com/projections/nfl/{year}?season_type=regular`, per-format ADP fields keyed by native `sleeper_player_id`, no API key. The verify-before-building condition is satisfied; the ingestion build must honor the constraints recorded on that item (undocumented → defensive isolation; `api.sleeper.com` host split from the documented API; endpoint is wiki-silent per STATE.yml known_issues).*
- [ ] Record unmapped/unresolved player references explicitly (never silently dropped, never used to create a parallel identity row) — surfaced in ingestion result counts
- [ ] Implement an idempotent upsert into `adp_rankings` for the current season/source — safe to re-run, preserves last-good snapshot if a fetch/validation fails
- [ ] Wrap ADP ingestion in the same defensive error-isolation pattern as ESPN sync (Wave 2) — an ADP fetch failure must not affect Sleeper or ESPN sync paths
- [ ] Extend the existing sync-run tracking table (from Wave 2) to log ADP ingestion runs — source, season, status, timestamps, record/skip/unmapped counts
- [ ] Add a protected Vercel cron route for scheduled ADP ingestion, secured the same way as existing Wave 2 cron routes (secret header/token, not publicly invokable)
- [ ] Add a way to run ADP ingestion on demand during local development, independent of the cron route

### Draft-board data layer
- [ ] Build a server-side draft-board query service that joins `players` (Sleeper-anchored) with `adp_rankings` and the selected league's `rosters` to produce a merged, ADP-ordered player list scoped to one `league_id`
- [ ] Derive per-player availability from that league's roster data (rostered vs. available) — explicit, not inferred from missing data
- [ ] Resolve ESPN league players through the existing crosswalk so ESPN-league boards render the same Sleeper-anchored player fields as Sleeper-league boards
- [ ] Resolve the league's scoring/roster-slot context from `league_config` (PPR/half-PPR/TE-premium) for board display — no hardcoded scoring assumptions in application code
- [ ] Explicitly exclude `share_token` and any other spectator/admin-boundary fields from every draft-board query response
- [ ] Query service returns only leagues Nick owns — invalid or inaccessible `league_id` resolves to a not-found state, never a partial/leaked response

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
