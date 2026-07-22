# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

Newest entry on top.

---

## 2026-07-21 — Wave 1 Execution Started: First Working Application Code (Project Scaffold)

First build session executed via `BUILD_PROTOCOL.md`. The entire Project scaffold section of `01_foundation.md` (six items, folded into one session with Nick's explicit approval) is complete: Next.js 16.2.11 (App Router, TypeScript strict, `src/`, npm), verified `@/*` alias, shadcn/ui with CSS-variable theming (neutral base, oklch, zero hex), lucide-react, Tailwind v4 default spacing + tabular-nums. `npm run build` and `npm run lint` pass. This is the repo's transition from pure governance/planning to working application code — the first working build of a registered build file's scope. Next: the Supabase project + migration workflow section of Wave 1.

---

## 2026-07-21 — Wave 6 Build File Registered (Build-Queue Scoping Complete)

`.claude/build/06_report_and_tools.md` created and registered in `BUILD_INDEX.md`, using the same 6-model convergence-filtering methodology as Waves 1, 2, 3a, 3b, 4, and 5. This is the final wave in the v1 roadmap — all six waves are now registered, scoped build files.

**What's in scope:** a league report generator that composes existing Wave 4/5 data (standings, matchups, power rankings, luck summary, playoff status) into a stored, versioned DTO and renders it as a mobile-first artifact through the existing share-token-gated spectator path, with an admin-side generate/regenerate action; a read-only, admin-only free agent board (Sleeper catalog minus rostered players, ESPN resolved through the crosswalk, filter/sort/search, never a waiver write); and app-shell-only PWA installability (manifest, icons, a service worker caching only static shell assets, offline fallback, production-only registration) that does not blur the admin/spectator access boundary.

**Explicitly deferred/excluded:** recomputing any Wave 4/5 data (report only composes it); executing any waiver claim/add/drop; any historical/multi-season report; push notifications or background sync.

**Dependency:** requires Wave 4 (dashboard data) and Wave 5 (eye-candy data) to be live; requires Wave 2's Sleeper/ESPN sync and crosswalk for free-agent availability.

**Why this milestone matters:** with all six waves scoped, the project's build-queue planning phase is complete. Every wave from `BUILD_INDEX.md`'s roadmap now has a registered, convergence-filtered build file (01 through 06). None have been executed yet — the next session should begin execution with Wave 1 (Foundation), in dependency order.

---

## 2026-07-21 — Wave 5 Build File Registered

`.claude/build/05_eye_candy.md` created and registered in `BUILD_INDEX.md`, using the same 6-model convergence-filtering methodology as Waves 1, 2, 3a, 3b, and 4.

**What's in scope:** current-season-only score charts (weekly team-score trends + distribution, built on a shared chart-primitives layer with CSS-variable colors and tabular-nums), a lucky/unlucky tracker (all-play expected-wins calculation driving a luck differential chart/table), positional breakdowns (scoring grouped by `league_config` roster slots, including flex/superflex attribution), and a playoff picture engine (clinch/eliminate/magic-number computation driven by `league_config` playoff settings, no hardcoded bracket size). Primarily an admin-surface feature set extending the Wave 4 dashboard — only the lucky/unlucky summary and playoff status get simplified, separately-built mobile spectator equivalents.

**Explicitly deferred:** league report generator, free agent board, PWA manifest/service worker (Wave 6); rebuilding standings/matchups/power-rankings/player-cards (Wave 4, already built); any historical/year-over-year view (rejected for v1 project-wide); a spectator twin for every chart (only luck summary and playoff status get one).

**Dependency:** requires Wave 4's computed `player_scores` and dashboard data layer; does not touch the draft assistant (Wave 3a/3b).

---

## 2026-07-21 — Wave 4 Build File Registered

`.claude/build/04_league_dashboard.md` created and registered in `BUILD_INDEX.md`, using the same 6-model convergence-filtering methodology as Waves 1, 2, 3a, and 3b.

**What's in scope:** a new fantasy-scoring engine (pure `computeFantasyPoints` driven entirely by each league's `league_config`, wired into the existing Sleeper/ESPN sync cadence, idempotent and failure-isolated per league) since this is the first wave needing computed `player_scores` rather than raw stats; owner-authenticated standings/matchups/power-rankings/player-card query services and admin UI; and — built together in this same wave, not deferred — the read-only share-link spectator surface: `share_token`-gated RLS read policies (explicitly excluding `draft_state`), token regenerate/revoke, and a genuinely separate mobile-first spectator route/component tree sharing only data-access logic with the admin dashboard.

**Explicitly deferred:** score charts, lucky/unlucky tracking, positional breakdowns, playoff picture (Wave 5); league report generator, free agent board, PWA manifest (Wave 6); any historical/season-over-season view (rejected for v1 project-wide, not just this wave).

**Dependency:** requires Wave 1's schema and Wave 2's sync pipelines; does not depend on or touch the draft assistant (Wave 3a/3b).

---

## 2026-07-21 — Wave 3b Build File Registered

`.claude/build/03b_draft_assistant_live_draft.md` created and registered in `BUILD_INDEX.md`, using the same 6-model convergence-filtering methodology as Waves 1, 2, and 3a.

**What's in scope:** manual click-to-draft write path (first-write-wins via the existing `(league_id, pick_number)` unique constraint, admin-only, with a manual-only undo action) shipped together with tuned high-frequency Sleeper and ESPN draft-state polling gated by an `is_draft_active` flag, both writing into the same shared `draft_state` table established in Wave 1 — no staged manual-first/poller-later sequencing, per the earlier scope reversal. Also includes client-side live sync (optimistic UI, conflict rollback, dedup), live extensions to the Wave 3a board (current-pick indicator, live roster/positional-need panel, recent-picks feed), and a BPA recommendation engine (ADP + positional scarcity + league_config scoring weights) wired into one-click draft actions.

**Explicitly deferred:** rebuilding Wave 3a's static display primitives (extended, not replaced); scoring computation, standings/matchups, and the spectator surface remain Wave 4+.

**Dependency:** requires Wave 3a (static board) and Wave 2's ESPN integration to be live.

---

## 2026-07-21 — Wave 3a Build File Registered

`.claude/build/03a_draft_assistant_static_board.md` created and registered in `BUILD_INDEX.md`, using the same 6-model convergence-filtering methodology as Waves 1 and 2.

**What's in scope:** ADP schema (`adp_rankings` keyed by season/source/`sleeper_player_id`) and a defensively-isolated ADP ingestion service/cron route with sync-run tracking; a server-side draft-board query service joining Sleeper-anchored players, ADP, and league rosters scoped to one `league_id` (ESPN leagues resolved through the crosswalk, `share_token` explicitly excluded); an admin-only tablet/PC-first draft-board route with league selector, search/filter/sort toolbar, position-styled player rows with tabular-nums ADP data, a static roster/positional-need panel, and loading/empty/error states.

**Explicitly deferred:** all live draft polling (ESPN or Sleeper), the manual click-to-draft write path, any write to `draft_state`, and the BPA recommendation engine — all three are Wave 3b, which ships together with live polling per the earlier scope reversal. Scoring computation, standings/matchups, and the spectator surface remain Wave 4+.

**Dependency:** requires Wave 1's schema and Wave 2's Sleeper sync to be live; does not require ESPN sync to function to render Sleeper-league boards, but must degrade gracefully (not crash) if ESPN league data is stale/missing.

---

## 2026-07-21 — Wave 2 Build File Registered

`.claude/build/02_data_pipeline.md` created and registered in `BUILD_INDEX.md`, using the same 6-model convergence-filtering methodology as Wave 1.

**What's in scope:** Sleeper client + player-catalog sync (validated first, no-auth), Sleeper league-config/rosters/matchups sync, Sleeper draft-state write path into the Wave-1-created shared `draft_state` table; isolated ESPN client with per-league public/private detection (never assumed), encrypted cookie storage, ESPN↔Sleeper crosswalk resolution, ESPN league-config/rosters sync, ESPN draft-state polling into the same shared `draft_state` table; explicit error isolation on every ESPN operation so its fragile, unversioned API can never cascade failures into Sleeper-sourced features; Vercel Cron scheduling plus a sync-run tracking table for pipeline health visibility.

**Explicitly deferred:** applying league scoring rules to compute `player_scores` (Wave 4), the manual click-to-draft write path (Wave 3 — this wave only builds the two automated write paths into the shared table), any client-side polling/UI (Wave 3/4), live-draft-day polling cadence tuning (Wave 3).

**Dependency:** Wave 2 requires Wave 1's schema (`players`, `leagues`, `league_config`, `rosters`, `matchups`, `draft_state`, ESPN crosswalk table) to already be live — must execute after Wave 1, not in parallel.

---

## 2026-07-21 — Wave 1 Build File Registered (First Registered Build File)

`.claude/build/01_foundation.md` created and registered in `BUILD_INDEX.md`'s Build Files Registry — the first entry in that table since the governance scaffold was established. This is the first concrete, executable scope for actual application code in this project.

**How it was scoped:** the same 6-model convergence-filtering methodology used for `wiki/` discovery ingestion, applied to build planning instead of research. A single, fully self-contained panel prompt (project context + Wave 1's `BUILD_INDEX.md` scope bullet) was run against 6 independent AI models, each producing a 25-item atomic task breakdown for Wave 1. Responses were convergence-filtered — tasks appearing in 5-6 of 6 responses were treated as consensus and form the spine of the build file; low-corroboration items (env validation via Zod, Realtime publication, defensive raw-ingest snapshot tables) were noted but not adopted into this wave's scope.

**What's in scope:** Next.js/Tailwind/shadcn scaffold, Supabase project + migration workflow, `platform` enum, Sleeper-anchored `players` table + ESPN crosswalk, `leagues` table with `share_token` generation, `league_config`, league-scoped rosters/matchups/standings/player_scores tables, shared `draft_state` table (schema only — write logic is Wave 3), RLS enabled with owner-only write policies (spectator read policies deferred to Wave 4), generated TypeScript types, env/secrets + Vercel deploy with a live connectivity smoke test as the completion gate.

**Explicitly deferred out of Wave 1** (documented in the build file itself, not silently dropped): ESPN cookie-auth flow, any data ingestion/sync logic, share-token-gated spectator RLS policies and the spectator route surface, manual/automated draft-pick write logic.

**Why this milestone matters:** per `BUILD_INDEX.md`'s own rule, nothing gets built without a registered build file — this is the moment the project becomes buildable, transitioning from pure planning/governance/wiki work to an executable build queue.

---

## 2026-07-21 — Scope Corrections: Open-Ended League Count, Access Model, Draft-Entry Sequencing

Three scope corrections landed in `MASTER_CONTEXT.md` and `BUILD_INDEX.md`, driven by a full extraction of Nick's prior conversation history on this project cross-checked against the committed repo state. This is a governance/scope change affecting all future build sessions.

**What changed:**
- **League count is now open-ended, not fixed.** Previous text hardcoded "2 Sleeper leagues, 2 ESPN leagues." Corrected to: the platform must support any number of Sleeper and/or ESPN leagues Nick connects — the schema already supports this via `league_id` scoping, this was a documentation framing fix, not an architecture change. Yahoo remains explicitly out of scope for v1, unchanged.
- **Access Model added** (`MASTER_CONTEXT.md`, new section after UX Architecture): Nick is sole owner/admin of every league; leaguemates get a no-login, revocable, per-league `share_token`-based read-only URL. The read-only surface is a genuinely separate rendering path — never the admin view with controls conditionally hidden — since leaked admin markup in a client bundle would expose Nick's draft tooling to viewers. Added as Schema Rule #6 (`share_token` column, one-way door, correct from migration one).
- **Wave 3b scope changed**: manual click-to-draft and live ESPN draft polling now ship together in v1, both writing to one shared `draft_state` table (first-write-wins) — no staged "manual first, poller as v2" sequencing (that staging was a real decision from an earlier session, explicitly reversed by Nick this session).
- **Wave 4 scope note added**: the read-only share-link dashboard is part of Wave 4 (League Dashboard), not a separate later build — same data, gated by `share_token` instead of owner auth.

**Why:** Nick ran a full extraction of every prior conversation touching this project (spanning an abandoned 2025 Bubble/no-code era and the current 2026 Next.js/Supabase era) and reconciled it against the live repo. Most of the extraction confirmed existing `MASTER_CONTEXT.md` content; these three items were genuine gaps or reversals Nick called out directly rather than items the extraction resolved on its own.

**Not yet resolved:** ESPN league public/private visibility per league — still pending Nick's confirmation before ESPN cookie-auth work begins (see `STATE.yml` → `nick_pending`).

---

## 2026-07-18 — .claude/ Governance Scaffold Established

Committed the full `.claude/` build-governance system for tacctile/fantasy, adapted from `tacctile/tacctile_webapp`'s governance model. This is a governance system change affecting all future sessions.

**What was established:**
- `CLAUDE.md` auto-loader (root) + `.claude/MASTER_CONTEXT.md` — rules, stack, schema requirements, data source architecture, UX split, code conventions, design token discipline, session-start protocol, absolute rules
- `.claude/STATE.yml` — session state tracking
- `.claude/BUILD_INDEX.md` — 6-wave roadmap (Foundation, Data Pipeline, Draft Assistant 3a/3b, League Dashboard, Eye Candy, Report+Tools), wiki category map
- `.claude/ARCHITECTURE.md` — satellite doc, Code Conventions, Supabase migration rule
- `.claude/DESIGN_SYSTEM.md` — token/scale/radius discipline for Tailwind+shadcn, lucide-react as icon library
- `.claude/COMPLETION_TEMPLATES.md` — 3 report templates, PROMPT SCORE rubric, Dual-Location Instruction Rule

**Deliberate scope decisions baked in:**
- No Yahoo integration (deferred indefinitely)
- No postmortem system (no build_session_count tracking, no postmortem trigger — dropped entirely, not deferred)
- No terminology/banned-word-list mechanic (fantasy has no product-identity language to protect)

**Wiki taxonomy reconciled, not overwritten:** `wiki/schema.yml` already had a live, content-populated 4-category taxonomy (player-evaluation, team-scheme, league-mechanics, in-season-management — 102+ existing pages) that predated this session. Merged rather than replaced: kept the 4 existing categories untouched, added 3 new technical categories (sleeper-api, espn-api, schema-reference) for platform-integration and schema documentation. draft-mechanics was considered and folded into league-mechanics — no separate draft-content cluster existed to justify a standalone category. Final taxonomy: 7 categories total. Updated `wiki/schema.yml`'s category enum and `system_files_required`, created 3 new `_index.md` stubs, extended `wiki/ROUTING.md`'s Category Routing Guide — all under the explicit Rule 22 exception authorized in this session's prompt.

**Not yet resolved:** none — all open items from the prior extraction series (category taxonomy, branch name, design token mechanism) were decided this session.

**Next:** Wave 1 (Foundation) — Supabase schema, env/secrets setup, initial Vercel deploy. Not started.

---

_End of PROGRESS.md_
