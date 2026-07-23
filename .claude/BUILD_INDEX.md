# BUILD_INDEX.md
**Master build router — tacctile/fantasy**
**Last Updated:** 2026-07-22 (Wave 3b progressing: the active-draft polling orchestration sub-section is `[x]` — new admin-only `draft_sessions` table (6h soft TTL, owner RLS only), toolbar Start/End control, client-driven 5s elevated polling (Nick-signed — Hobby crons are daily-only) with every executed poll recorded in `sync_runs`; live-verified 37/37. Next unchecked item = client-side live sync (fold 2–3 items max per the live-behavior ceiling). Prior: manual click-to-draft write path sub-section `[x]` — `recordManualPick`/`undoLastManualPick` service + auth-gated server actions, first-write-wins live-verified against the real league; 03b ⬜→🟡. Prior: RESTRUCTURED: `03b_draft_assistant_live_draft.md` split into Sleeper-snake-only scope (unblocked, buildable now) and a new `03c_draft_assistant_espn_and_auction.md` (ESPN client/auth/crosswalk/polling + all auction mechanics, blocked pending ESPN commissioner unlock ~mid-August 2026) — Sleeper supports snake draft only, ESPN will support both snake and auction once unblocked. Wave 4 build progressing: data-access layer, freshness surfacing, the four display components, and the page-assembly + league-selector fold are all `[x]` — the admin dashboard is mounted at `/leagues/[leagueId]` with root auto-land re-signed onto it. Next unchecked items: the nav-shell sub-section; the share-link panel rides the share-token RLS singleton. Standing context: Nick's wave-order ruling runs Wave 4 ahead of ESPN-blocked 3c; the scoring-engine sub-section was cut by Nick-signed correctness amendment (`player_scores` is ingested platform-scored, never computed). Prior state: Wave 3a 🟡 — all five sub-sections complete, sole remainder the schedule-source-gated bye-week `[>]`; `02_data_pipeline.md` 🟡: 9 ESPN items `[!]` external-timing, cron cadence `[~]`, finality promotion `[>]`; Wave 1 complete — `01_foundation.md` 🟢)

Nothing gets built without a registered build file. No exceptions. Every new feature requires a registered build file in this index before a single line of code is written.

---

## Session Start Protocol

Every Claude Code session reads files in this exact order:

1. `.claude/MASTER_CONTEXT.md` — rules, stack, constraints
2. `.claude/STATE.yml` — what happened last session
3. `.claude/BUILD_INDEX.md` — this file, build registry and wiki category map
4. `wiki/index.md` and `wiki/ROUTING.md` — identify relevant wiki category, then read up to 3 pages from that category before beginning work (the Wiki Coverage Rule — Absolute Rule 12, canonical text in `BUILD_PROTOCOL.md` — overrides this cap whenever a decision isn't fully specified by pages already read)
5. Only the build file(s) listed in `STATE.yml → current_build_files` — each build file lists the specific wiki pages to consult in its own WIKI PAGES section
6. Only the source files listed in the prompt

Do not read files not listed above unless the prompt explicitly requires them.

---

## Status Legend

⬜ Not started &nbsp;&nbsp; 🟡 In progress &nbsp;&nbsp; 🟢 Complete &nbsp;&nbsp; 🔴 Blocked &nbsp;&nbsp; 🔵 Needs revisit

Checklist item states: `[ ]` not started · `[x]` complete · `[~]` in progress · `[>]` deferred · `[-]` cut · `[!]` blocked

---

## Wave Roadmap

Atomic sessions per the Folding Policy (canonical text in `BUILD_PROTOCOL.md`): one folded unit per fresh Claude Code session — up to 3 decision-dense items, one mechanical sub-section, or one independently verifiable artifact's full item set, subject to that policy's hard stops and named singleton exceptions. No scope bleed beyond the declared fold.

| Wave | Name | Status | Scope |
| ---- | ---- | ------ | ----- |
| 1 | Foundation | 🟢 | Supabase schema (with `league_id`, `platform`, `season_year`, player-identity mapping, `league_config` per MASTER_CONTEXT.md Schema Rules), env/secrets setup, initial Vercel deploy — complete 2026-07-22, deployed health-check gate passed |
| 2 | Data Pipeline | 🟡 | Sleeper sync (build/validate first — no-auth, trivial case), then ESPN cookie-auth integration (harder, isolate failures defensively), cron/polling strategy |
| 3a | Draft Assistant — Static Board | 🟡 | Static draft board UI, ADP ingestion, no live polling — all five sub-sections complete 2026-07-22; only the bye-week `[>]` deferral remains |
| 3b | Draft Assistant — Live Draft (Sleeper Snake) | 🟡 | Manual click-to-draft AND live Sleeper draft polling ship together — both write to the same shared `draft_state` table, first-write-wins, no staged manual-first/poller-later sequencing. BPA/VORP recommendation engine, tier-cliff detection, positional runs, queue/auto-pick. Sleeper snake only — no ESPN, no auction (Sleeper doesn't support auction on this platform). Depends on 3a only — unblocked, self-locatable now (restructured 2026-07-22, split from the original combined file) |
| 3c | Draft Assistant — ESPN Live Draft + Auction | 🔴 | ESPN client/cookie-auth/crosswalk sync/live polling/draft-state writes, plus all auction-draft mechanics (nomination/bid state, budget tracking, auction valuation) — auction applies to ESPN only. Extends 3b's shared shell (manual-pick path, live board UI, BPA engine) rather than duplicating it. Depends on 3b and Wave 2's ESPN integration. Blocked pending ESPN commissioner unlock (~mid-August 2026), same external timing as `02_data_pipeline.md`'s ESPN sub-sections (registered 2026-07-22) |
| 4 | League Dashboard | 🟡 | Standings, matchups, power rankings, player cards. Includes the read-only share-link surface (per `MASTER_CONTEXT.md` Access Model) — same dashboard data, gated by `share_token` instead of owner auth, not a separate later build. Also owns the admin surface's persistent sidebar navigation shell and command-center home, which Wave 5 and Wave 6 mount into. Scoring is NOT computed here — `player_scores` arrives platform-scored from Wave 2's sync (scoring-engine sub-section cut 2026-07-22, Nick-signed) |
| 5 | Eye Candy | ⬜ | Score charts, lucky/unlucky tracker, positional breakdowns, playoff picture, trade evaluation, waiver/FAAB recommendations (trade + waiver amended into scope 2026-07-21 — see 05_eye_candy.md scope note; waiver scoring formula itself deferred to a follow-up session) |
| 6 | Report + Tools | ⬜ | League report generator, free agent board, PWA manifest/service worker |

**Dependency notes:** Wave 3b depends only on Wave 3a (static board UI/data layer) — it has zero ESPN dependency and is unblocked/self-locatable now. Wave 3c depends on Wave 3b (extends its shared shell) and on Wave 2's ESPN integration being live and isolated (its failure must not break Wave 3a/3b's Sleeper-sourced features); 3c is blocked until ESPN's commissioner lock clears. Wave 3a can start once Wave 1's schema and Wave 2's Sleeper sync are done — it does not need ESPN. Wave 4 does not depend on 3b, 3c, or ESPN — Nick authorized it to run ahead of ESPN-blocked draft-live work (2026-07-22 ruling); its data needs are served by the live Sleeper pipeline, and ESPN leagues join its surfaces automatically once connected. 3c's position in roadmap order is unchanged from the original 3b slot — it resumes when the ESPN block clears.

---

## Build Files Registry

Each feature gets a numbered file at `.claude/build/NN_FEATURE_NAME.md`, registered here with a status glyph, before any code is written.

| # | File | Wave | Status |
| - | ---- | ---- | ------ |
| 01 | [01_foundation.md](build/01_foundation.md) | 1 | 🟢 |
| 02 | [02_data_pipeline.md](build/02_data_pipeline.md) | 2 | 🟡 |
| 03a | [03a_draft_assistant_static_board.md](build/03a_draft_assistant_static_board.md) | 3a | 🟡 |
| 03b | [03b_draft_assistant_live_draft.md](build/03b_draft_assistant_live_draft.md) | 3b | 🟡 |
| 03c | [03c_draft_assistant_espn_and_auction.md](build/03c_draft_assistant_espn_and_auction.md) | 3c | 🔴 |
| 04 | [04_league_dashboard.md](build/04_league_dashboard.md) | 4 | 🟡 |
| 05 | [05_eye_candy.md](build/05_eye_candy.md) | 5 | ⬜ |
| 06 | [06_report_and_tools.md](build/06_report_and_tools.md) | 6 | ⬜ |

---

## Wiki Category Map

| Category | Covers |
| -------- | ------ |
| `player-evaluation` | Statistical models for player performance, opportunity share, efficiency |
| `team-scheme` | Team-level tendencies, scheme identity, offensive line, coaching |
| `league-mechanics` | Scoring formats, roster construction, draft strategy, ADP, trade value |
| `in-season-management` | Injury tracking, matchup analysis, start/sit, rest-of-season rankings |
| `sleeper-api` | Sleeper endpoint structure, player ID format, rate limits |
| `espn-api` | ESPN cookie auth, undocumented view params, rate limits, endpoint structure |
| `schema-reference` | League scoping conventions, player ID mapping, `league_config` data model |
