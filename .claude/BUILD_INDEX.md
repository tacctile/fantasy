# BUILD_INDEX.md
**Master build router — tacctile/fantasy**
**Last Updated:** 2026-07-31
> AUTHORING RULE: `Last Updated` is a single date — replace it each session, never append to it.
> Status detail lives in `STATE.yml`. Session history lives in `PROGRESS.md` / `PROGRESS_ARCHIVE.md`.

**Current status:** **Wave 5 (`05_eye_candy.md`) is 🟡 in progress** — four sub-sections shipped 2026-07-31: Shared foundations (4 items), Score charts (7 items) at `/leagues/[leagueId]/score-trends`, the Lucky/unlucky tracker (7 items) at `/leagues/[leagueId]/luck`, and the **Positional breakdowns** (5 items, one artifact fold) at `/leagues/[leagueId]/positional`, which lights the third of the sidebar slots Wave 4 reserved. Decisions of record from the positional fold (all Nick's Clarify, 2026-07-31): only STARTED rows count (positional strength is what a team started, not what it owned — bench points would flatter a deep bench and diverge from the `effective_points` total every other surface shows); flex/superflex attribution is INFERRED by filling dedicated slots first with the highest scorer per position, because `player_scores` records THAT a player started and never WHICH slot he filled — no per-week lineup slot exists anywhere in the schema, so this is a permanent ceiling rather than a v1 shortcut, and it is disclosed on the surface; week scope runs through the SAME `parsePlayoffWeekStart` the other three sections share; and players whose position doesn't resolve get their own visible Unmapped bucket with a count disclosure rather than being dropped (the seam ESPN's crosswalk residue will surface through in August). One decision was declared genuine wiki silence at decision time: which POSITIONS each flex label admits — `sleeper-api/league-endpoint` names the labels and records that the set isn't exhaustively documented, while `league-mechanics/flex-spot-configuration` covers which position TENDS TO WIN a flex (predictive draft-value guidance, not an eligibility table), so conventional meanings are encoded and an unrecognised flex label is treated as open to every position rather than dropping its points. Both selections are URL params (`?team=`, `?sort=`), so the section stays server-rendered with zero client JS and a sorted, team-focused view is shareable. Earlier Wave 5 decisions of record still standing: no charting library (hand-rolled SVG/CSS primitives in `src/components/charts/`), a machine-validated teal-free categorical ramp, `components/charts/` shared by the admin AND spectator surfaces, `RosterSlotLayout`/`parseRosterSlotLayout` living in `services/league-context.ts`, a week's points being the stored `matchups.effective_points` rather than a re-sum of `player_scores`, actual records RECOMPUTED from matchup pairings for the luck differential, and Pythagorean expectation deliberately NOT computed. The luck section's item 7 spectator summary remains a COMPONENT only — its share-surface wiring stays with the Integration sub-section. The **Playoff picture** sub-section is now 3/7: items 1–3 (rules resolver, pure calculation, unit tests) shipped 2026-07-31 as `src/services/playoff-picture.ts` — no UI yet. **The standing playoff-fields gap is closed**: `settings.playoff_teams`/`playoff_type`/`playoff_round_type`/`divisions` are read from `league_config.roster_settings_raw` under the league-configuration-data-model ADR's raw-column escape hatch, the same posture `parsePlayoffWeekStart` established. Decisions of record from that fold (all Nick's Clarify, 2026-07-31): seeds are RECOMPUTED from matchup pairings (luck.ts's precedent) rather than read from the `standings` snapshot, ordered by win percentage → points-for → roster id, with any snapshot disagreement surfaced; divisions are DETECTED AND DISCLOSED but never applied to seed order, since no source documents how Sleeper seeds them; an absent `playoff_teams` resolves to NULL with every team reading `undetermined`, never to a conventional default, because a guessed field size yields confident-but-false "CLINCHED" badges; the magic number counts down to a BERTH only, never a seed or a bye; zero remaining games is reported as `scheduleExhausted` rather than claimed as a finished season, since the module cannot distinguish that from unsynced future weeks; and clinch/elimination are STRICT — true under any tiebreaker — via a deliberately asymmetric tie comparison (a tie counts against the team when clinching and for it when eliminating), which is what stops the calculation printing "eliminated" on a team merely tied for the last spot. Four decisions were declared genuine wiki silence at decision time: seeding order/tiebreakers, clinch/magic-number methodology, fantasy-league division seeding, and the numeric VALUE semantics of `playoff_type`/`playoff_round_type` (the wiki names those keys but never enumerates what their integers mean, so they are stored raw and never branched on). First-round byes are INFERRED arithmetically as `nextPowerOfTwo(N) − N` and typed as such, because no bracket resource is ingested anywhere in this platform. **Items 4–6 shipped 2026-07-31 in a second fold the same day**, taking the sub-section to 6/7: the section is live at `/leagues/[leagueId]/playoff-picture` (fourth reserved sidebar slot lit) as a deterministic status table plus a what-if layer whose recompute is the SAME pure function the server ran — `applyHypotheticalResults` + `computePlayoffPicture`, imported directly into the section's one client module, so no second status function and no probabilistic logic can exist. Item 6's prohibition is enforced by machine assertions over the rendered markup (no percentage, likelihood vocabulary, meter/progress element, or width-as-value geometry) in both the resting and hypothetical views, rather than left to review. Decisions of record from that fold (all Nick's Clarify, 2026-07-31): the clinch sentence says ONLY what the service computed and never names a rival — the build file's illustrative "OR [Team X] loses" would require the pairwise tiebreaker reasoning items 1–3 declared wiki silence on, so `needs_help` states the shape of its dependency instead; row focus is `?team=` (the durable my-team gap's honest stand-in, now shared by Luck, Positional, and this table); a hypothetical view carries a persistent banner with a reset and marks every row whose status changed; a hypothetical moves a RECORD and never points-for, so a points tiebreaker still turns on the real season; only fully unplayed pairs get a toggle (a half-scored matchup is a sync artifact, not an upcoming game); and zero remaining games replaces the controls with an explanation naming the full-season matchup sweep, which is the state the connected 2025 league is in today. Governance change signed the same session: `--warning` is now scoped as "unmet condition or provisional state", unifying roster-need, regenerate-confirm, injury Q/D, the Needs Help badge, and the what-if mode — `MASTER_CONTEXT.md` and `DESIGN_SYSTEM.md` updated together per the Dual-Location Instruction Rule. Declared testing ceiling: vitest runs in a `node` environment with no DOM, so no test presses a toggle; the two pure functions behind the click are fully covered, the wiring is not. Next: 05 line 73, the spectator playoff-status view (clinched/bubble/eliminated list only, no magic numbers, no toggles) as a separate mobile component — its share-surface wiring stays with the Integration sub-section. Wave 4 🟢 complete (2026-07-31). Wave 3b 🟢 complete. Wave 3c 🔴 ESPN-blocked (~mid-August 2026). Wave 3a 🟡 bye-week `[>]` schedule-gated. Wave 2 🟡 ESPN residue `[!]`, cron cadence `[~]`, finality promotion `[>]`. Still standing: run the waiver-formula scoping session in plain chat before Wave 5's waiver/FAAB item.

> Full session history: `.claude/STATE.yml` (last session detail) · `.claude/PROGRESS.md` (5 most recent milestones) · `.claude/PROGRESS_ARCHIVE.md` (full history)

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
| 3b | Draft Assistant — Live Draft (Sleeper Snake) | 🟢 | Manual click-to-draft AND live Sleeper draft polling ship together — both write to the same shared `draft_state` table, first-write-wins, no staged manual-first/poller-later sequencing. BPA/VORP recommendation engine, tier-cliff detection, positional runs, queue/auto-pick. Sleeper snake only — no ESPN, no auction (Sleeper doesn't support auction on this platform). Depends on 3a only — unblocked, self-locatable now (restructured 2026-07-22, split from the original combined file) |
| 3c | Draft Assistant — ESPN Live Draft + Auction | 🔴 | ESPN client/cookie-auth/crosswalk sync/live polling/draft-state writes, plus all auction-draft mechanics (nomination/bid state, budget tracking, auction valuation) — auction applies to ESPN only. Extends 3b's shared shell (manual-pick path, live board UI, BPA engine) rather than duplicating it. Depends on 3b and Wave 2's ESPN integration. Blocked pending ESPN commissioner unlock (~mid-August 2026), same external timing as `02_data_pipeline.md`'s ESPN sub-sections (registered 2026-07-22) |
| 4 | League Dashboard | 🟢 | Standings, matchups, power rankings, player cards. Includes the read-only share-link surface (per `MASTER_CONTEXT.md` Access Model) — same dashboard data, gated by `share_token` instead of owner auth, not a separate later build. Also owns the admin surface's persistent sidebar navigation shell and command-center home, which Wave 5 and Wave 6 mount into. Scoring is NOT computed here — `player_scores` arrives platform-scored from Wave 2's sync (scoring-engine sub-section cut 2026-07-22, Nick-signed) |
| 5 | Eye Candy | 🟡 | Score charts (🟢 shipped 2026-07-31 — own route `/leagues/[id]/score-trends`), lucky/unlucky tracker (🟢 shipped 2026-07-31 — own route `/leagues/[id]/luck`), positional breakdowns (🟢 shipped 2026-07-31 — own route `/leagues/[id]/positional`), playoff picture, trade evaluation, waiver/FAAB recommendations (trade + waiver amended into scope 2026-07-21 — see 05_eye_candy.md scope note; waiver scoring formula itself deferred to a follow-up session) |
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
| 03b | [03b_draft_assistant_live_draft.md](build/03b_draft_assistant_live_draft.md) | 3b | 🟢 |
| 03c | [03c_draft_assistant_espn_and_auction.md](build/03c_draft_assistant_espn_and_auction.md) | 3c | 🔴 |
| 04 | [04_league_dashboard.md](build/04_league_dashboard.md) | 4 | 🟢 |
| 05 | [05_eye_candy.md](build/05_eye_candy.md) | 5 | 🟡 |
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
