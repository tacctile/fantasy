# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

**Cap: 5 most recent entries only.** Each entry is a short summary (2-4 lines), not a detailed log — full session detail lives in `.claude/logs/`. When a 6th entry would be added, the oldest entry here rolls off into `.claude/PROGRESS_ARCHIVE.md` verbatim.

Newest entry on top.

---

## 2026-07-22 — Wave 3b Begun: Manual Click-to-Draft Write Path Live (First Live-Draft Feature)

First working 3b feature since the Sleeper-snake restructure: `src/services/draft-picks.ts` (`recordManualPick` — full referential validation, Nick-signed any-unclaimed-pick + server-side dup-player rejection, first-write-wins with a typed accepted/conflict/validation result carrying the authoritative row on conflict; `undoLastManualPick` — highest `source='manual'` row only, poll rows undeletable by construction) + auth-gated server actions under the draft route. 21/21 live checks against the real league, `draft_state` left at baseline; tsc/lint/build clean. Next: active-draft polling orchestration (`draft_sessions` + cadence).

---

## 2026-07-22 — League Dashboard Is a Working Feature: Page Assembled + League Selector Live

First browsable Wave 4 surface: the owner dashboard now mounts at `/leagues/[leagueId]` (Nick-signed league root; auto-land re-signed to land here), composing MatchupsGrid (URL-driven `?week=N`, default = latest scored week via new `listScoredWeeks`) over StandingsTable + PowerRankingsList, with the PlayerCard opening as a URL-driven `?player=` sheet from matchup player links. Draft board's LeagueSelector generalized (`subPath`) and reused. tsc/lint/build clean + 21/21 live render checks. Next: nav-shell sub-section (share-link panel rides the share-token singleton).

---

## 2026-07-22 — Wave 4 Begun: League-Dashboard Data Layer Live (Admin Data-Access Sub-Section Done)

First working Wave 4 feature: `src/services/dashboard.ts` shipped as one 5-item query-service fold — `getStandings` (Nick-signed wins→PF→roster-id ordering, flat), `getMatchups` (wiki-grounded pairing, byes as unpaired, full-roster lines + freshness pass-through), `getPowerRankings` (All-Play record per the wiki's decided measure; regular-season weeks via `playoff_week_start`; low-confidence flag <6 weeks), `getPlayerCard` (explicit `not_rostered` FA-gap entries, holding-team attribution), plus the scoping/security assurance (static audit + live anon-RLS zero-data proof). All live-verified against the real league incl. an exact independent all-play recomputation. Next: 04 admin UI sub-section (freshness item rides with it).

---

## 2026-07-22 — Governance: Wave Order Ruled — Wave 4 Begins Ahead of ESPN-Blocked 3b; Scoring-Engine Sub-Section Cut

Nick authorized Wave 4 (League Dashboard) ahead of 3b (ESPN-blocked ~mid-Aug) — the roadmap un-stalls immediately; 3b resumes in place when ESPN opens. Same session, Clarify surfaced 04's stale premise before any code: Wave 2 as shipped ingests `player_scores` platform-scored (never computes). Nick signed the correctness amendment — engine items 1–4 `[-]` cut, item 5 re-worded to freshness surfacing, FA-week gap accepted for v1 — with backsweep to 02's exclusions line. Next: 04 admin data-access layer (`getStandings` first).

---

## 2026-07-22 — Wave 3a Buildable Scope Complete: States + Resilience Live (Static Draft Board Feature-Complete)

The board's final sub-section shipped in one fold: route-segment loading skeleton (mirrors real density, `bg-muted` pulse), honest empty states (Nick-signed banner-over-rostered-list; pure `deriveAdpNoticeKind` — no-snapshot / format-unresolved / format-zero-rows, no cross-format fallback ever; zero-filter-match with "Clear filters"), and the route error boundary (retry + back-to-leagues escape; gaps degrade per-surface, only real failures bound). 14/14 checks incl. live no-false-positive. `03a` is now complete except the schedule-source-gated bye-week `[>]`. Next: Nick's wave-order call — Wave 4 ahead of ESPN-blocked 3b, the bye-week source decision, or hold (~mid-Aug).

---

_End of PROGRESS.md_
