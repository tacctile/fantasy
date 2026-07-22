# BUILD_INDEX.md
**Master build router — tacctile/fantasy**
**Last Updated:** 2026-07-21 (Wave 5 registered)

Nothing gets built without a registered build file. No exceptions. Every new feature requires a registered build file in this index before a single line of code is written.

---

## Session Start Protocol

Every Claude Code session reads files in this exact order:

1. `.claude/MASTER_CONTEXT.md` — rules, stack, constraints
2. `.claude/STATE.yml` — what happened last session
3. `.claude/BUILD_INDEX.md` — this file, build registry and wiki category map
4. `wiki/index.md` and `wiki/ROUTING.md` — identify relevant wiki category, then read up to 3 pages from that category before beginning work
5. Only the build file(s) listed in `STATE.yml → current_build_files` — each build file lists the specific wiki pages to consult in its own WIKI PAGES section
6. Only the source files listed in the prompt

Do not read files not listed above unless the prompt explicitly requires them.

---

## Status Legend

⬜ Not started &nbsp;&nbsp; 🟡 In progress &nbsp;&nbsp; 🟢 Complete &nbsp;&nbsp; 🔴 Blocked &nbsp;&nbsp; 🔵 Needs revisit

Checklist item states: `[ ]` not started · `[x]` complete · `[~]` in progress · `[>]` deferred · `[-]` cut · `[!]` blocked

---

## Wave Roadmap

Atomic, one task per fresh Claude Code session. No scope bleed across sessions.

| Wave | Name | Status | Scope |
| ---- | ---- | ------ | ----- |
| 1 | Foundation | ⬜ | Supabase schema (with `league_id`, `platform`, `season_year`, player-identity mapping, `league_config` per MASTER_CONTEXT.md Schema Rules), env/secrets setup, initial Vercel deploy |
| 2 | Data Pipeline | ⬜ | Sleeper sync (build/validate first — no-auth, trivial case), then ESPN cookie-auth integration (harder, isolate failures defensively), cron/polling strategy |
| 3a | Draft Assistant — Static Board | ⬜ | Static draft board UI, ADP ingestion, no live polling |
| 3b | Draft Assistant — Live Draft | ⬜ | Manual click-to-draft AND live ESPN draft polling ship together — both write to the same shared `draft_state` table, first-write-wins, no staged manual-first/poller-later sequencing. BPA recommendation engine. Depends on 3a and Wave 2 (ESPN integration) |
| 4 | League Dashboard | ⬜ | Standings, matchups, power rankings, player cards. Includes the read-only share-link surface (per `MASTER_CONTEXT.md` Access Model) — same dashboard data, gated by `share_token` instead of owner auth, not a separate later build |
| 5 | Eye Candy | ⬜ | Score charts, lucky/unlucky tracker, positional breakdowns, playoff picture |
| 6 | Report + Tools | ⬜ | League report generator, free agent board, PWA manifest/service worker |

**Dependency notes:** Wave 3b depends on Wave 2's ESPN integration being live and isolated (its failure must not break Wave 3a's static board or Sleeper-sourced features). Wave 3a can start once Wave 1's schema and Wave 2's Sleeper sync are done — it does not need ESPN.

---

## Build Files Registry

Each feature gets a numbered file at `.claude/build/NN_FEATURE_NAME.md`, registered here with a status glyph, before any code is written.

| # | File | Wave | Status |
| - | ---- | ---- | ------ |
| 01 | [01_foundation.md](build/01_foundation.md) | 1 | ⬜ |
| 02 | [02_data_pipeline.md](build/02_data_pipeline.md) | 2 | ⬜ |
| 03a | [03a_draft_assistant_static_board.md](build/03a_draft_assistant_static_board.md) | 3a | ⬜ |
| 03b | [03b_draft_assistant_live_draft.md](build/03b_draft_assistant_live_draft.md) | 3b | ⬜ |
| 04 | [04_league_dashboard.md](build/04_league_dashboard.md) | 4 | ⬜ |
| 05 | [05_eye_candy.md](build/05_eye_candy.md) | 5 | ⬜ |

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
