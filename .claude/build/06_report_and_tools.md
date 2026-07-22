# 06_report_and_tools.md
**Wave 6 — Report + Tools**
**Status:** ⬜ Not started
**Registered:** 2026-07-21

---

## Scope

League report generator, free agent board, PWA manifest/service worker — the final wave in the v1 roadmap. The report generator composes existing Wave 4/5 data (standings, matchups, power rankings, luck summary, playoff status) into a shareable, mobile-first artifact rendered through the existing share-token-gated spectator path — it does not recompute any of that underlying data. The free agent board is a read-only, admin-only roster-research tool (never a waiver claim/write) surfacing Sleeper-catalog players not currently rostered in a given league, resolved through the ESPN↔Sleeper crosswalk for ESPN leagues. PWA scope is installability only (manifest + app-shell service worker caching) — no push notifications, no background sync, and installation must not blur the admin/spectator access boundary.

This build file was scoped by convergence-filtering 6 independent AI panel responses against `BUILD_INDEX.md`'s Wave 6 bullet, same methodology used for Waves 1, 2, 3a, 3b, 4, and 5. This is the last wave in the roadmap — once scoped, all six waves (01, 02, 03a, 03b, 04, 05, 06) are registered build files, none yet executed.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/sleeper-api/dst-and-free-agents.md` — free-agent/availability conventions from Sleeper's data model
- `wiki/topics/schema-reference/player-identity-mapping.md` — crosswalk shape needed to resolve ESPN rosters to canonical `sleeper_player_id` for availability filtering
- `wiki/topics/league-mechanics/waiver-wire-faab-strategy.md` — context for what roster-research signals belong on a free-agent board (this wave surfaces availability/research only, never executes a claim)

---

## Checklist

### League report generator
- [ ] Add a report storage table keyed by `league_id`, `season_year`, generated payload data, and `generated_at` — reuses the league's existing `share_token` for the spectator link, no new token type
- [ ] Build a report-aggregation service that loads only current-season standings, matchups, power rankings, luck summary, and playoff status from the existing Wave 4/5 services — no recomputation of any underlying scoring or ranking logic
- [ ] Define a stable, versioned report DTO (section keys, summary stats, tabular rows) as the shape shared between storage, generation, and rendering
- [ ] Add an admin-only action/route to generate or regenerate the current-season report for a league, persist it, and return the report's spectator share URL
- [ ] Add an admin UI entry point (e.g. on the league dashboard) to trigger report generation and surface/copy the resulting share link
- [ ] Build a share-token-gated spectator loader that returns the persisted report DTO only for a valid, matching token — clean not-found/invalid states for bad or revoked tokens, never touching draft or admin-only data
- [ ] Build the mobile-first spectator report page (header with league name/season/generated-at, standings summary, matchup highlights, luck summary, playoff status) composed entirely from the DTO, tabular-nums throughout
- [ ] Add a share action (Web Share API with clipboard fallback) on the report page for leaguemates to pass the link along
- [ ] Add loading/empty states for "no report generated yet" and invalid-token cases on the spectator path

### Free agent board (admin-only, read-only)
- [ ] Build a free-agent availability query: the full Sleeper player catalog minus every player currently rostered in the selected league, scoped by `league_id` + current `season_year`
- [ ] Resolve ESPN league rosters through the existing ESPN↔Sleeper crosswalk inside this query so Sleeper and ESPN leagues share one canonical availability surface — unresolved/unmapped players explicitly excluded from confirmed availability, never silently miscounted
- [ ] Join availability results to Sleeper player metadata (name, position, team, status) and that league's current-season `player_scores` — using `league_config` only for scoring-format display labels, never hardcoded scoring
- [ ] Isolate ESPN crosswalk-resolution failures so they degrade to an explicit error for that league only, never breaking Sleeper-league free-agent boards
- [ ] Build the admin-only free-agent board page (tablet/PC-first) guarded by the existing admin auth pattern, unreachable from the spectator surface
- [ ] Add filter controls (position, NFL team/status, text search) and sort controls (season points, name, position) — all client-side over already-fetched data, tabular-nums on every numeric column
- [ ] Add a dense, sortable table/list UI for results, with pagination or virtualization if the full catalog view is large
- [ ] Add empty/no-matches, loading, and error states, including a visible indicator when the underlying roster sync is stale

### PWA installability
- [ ] Add app icon assets (192×192, 512×512, apple-touch-icon) and a `manifest.json`/`manifest.ts` with app name, short name, `start_url`, `display: standalone`, and theme/background colors sourced from existing CSS variable tokens
- [ ] Wire the manifest link and theme-color meta tags into the root layout
- [ ] Write a minimal service worker that precaches only static app-shell assets (HTML shell, CSS, JS, fonts, icons) — explicitly excludes API/data routes and any admin-only payload from caching, no push, no background sync
- [ ] Register the service worker via a client-only hook, guarded to production builds, called once from the root layout
- [ ] Build a simple offline-fallback route/page shown when a network request fails and no cached shell is available
- [ ] Add an optional install-prompt affordance (listening to `beforeinstallprompt`) on the admin shell only — the spectator share surface stays clean, with no install CTA tightly coupled to admin routes
- [ ] Verify installing the app grants no additional route or data access beyond what the existing admin/spectator auth boundary already allows

---

## Explicitly NOT in this wave

- Any draft-related UI or logic (already built, Wave 3a/3b)
- Rebuilding standings, matchups, power rankings, player cards, score charts, luck tracker, positional breakdowns, or playoff picture from scratch — the report generator composes their existing data, never recomputes it
- Executing a waiver claim, add/drop, or any write to Sleeper/ESPN — the free agent board is read-only research only
- Any historical, season-over-season, or multi-season report (explicitly rejected for v1 project-wide)
- Yahoo integration or any Yahoo-related scaffolding (indefinitely deferred, out of scope entirely)
- Any N-platform speculative abstraction beyond Sleeper/ESPN as they actually behave
- Push notifications, background sync, or any service-worker capability beyond installability/offline-shell caching

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s Service API Reference section (adds the report-aggregation and free-agent availability services), and note that this is the final wave in the v1 roadmap once complete — flag in the completion report if any subsequent wave-level planning is needed beyond the six registered build files.
