# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

**Cap: 5 most recent entries only.** Each entry is a short summary (2-4 lines), not a detailed log — full session detail lives in `.claude/logs/`. When a 6th entry would be added, the oldest entry here rolls off into `.claude/PROGRESS_ARCHIVE.md` verbatim.

Newest entry on top.

---

## 2026-07-22 — Wave 3a Begun: ADP Pipeline Live — Sleeper Undocumented Projections Endpoint Ingested

First working Wave 3a feature — the full "ADP schema + ingestion" sub-section (9 items, one fold). `adp_rankings` live (long per-format rows, Nick-signed shape), quarantined `services/adp/` ingestion against `api.sleeper.com` (validate-before-swap, pattern-based `adp_*` extraction, 999-sentinel exclusion, positional-rank derivation), `sync_runs` extended, `/api/cron/sync-adp` + daily piggyback on the sync-leagues cron (Hobby slots full — Nick-signed). Live-verified: 2,946 rows / 10 formats / season 2026, idempotent re-run, 0 unmapped, Bijan ppr 1.4/RB1 matches the wiki sample. Next: draft-board data layer.

---

## 2026-07-22 — Automated Pipeline Live: Vercel Cron Surface + sync_runs Telemetry (Cron Sub-Section Done)

Core infra activation — the data pipeline now runs itself. Three secret-gated cron routes (`/api/cron/sync-players|sync-leagues|sync-draft`), `sync_runs` telemetry table (migration `20260722160525`) with a once-per-day catalog guard, and two daily Vercel crons (Hobby cap — 15-min league cadence deferred to season start, item `[~]`; draft route unscheduled until 3b). Verified live in production: 401s unauthenticated, guard skip, full league-state run, cron registration confirmed. Next: Wave 3a, gated on its two plain-chat MANUAL_SETUP items (ADP source, board leagues).

---

## 2026-07-22 — Governance: Wave 2 ESPN Blocked on External Timing; Build Path Re-Routed

ESPN leagues are commissioner-locked until 2026 season setup (~2026-08-19 → 2026-09-02) — the Wave 2 ESPN manual items can't exist until then. Dated blocker recorded (MANUAL_SETUP_CHECKLIST, STATE.yml); all 9 ESPN items in `02_data_pipeline.md` flipped `[!]`; no guessed/placeholder ESPN data ever (Nick's instruction). Build sessions now self-locate to the cron sub-section, then Wave 3a (ESPN-independent per BUILD_INDEX — gated on Nick's plain-chat ADP-source + board-league items). Wave 3b inherits the blocker.

---

## 2026-07-22 — Sleeper Sync Surface Complete: Draft Ingestion + Per-League Orchestrator (Wave 2 Sub-Sections 1–2 Done)

The whole Sleeper half of Wave 2's ingestion now runs as one command. `draft-state.ts` ingests the real league's full draft (170 picks, all matching Sleeper's wire exactly; first-write-wins verified — re-runs write 0); `sync-orchestrator.ts` chains config → rosters → matchups → draft per league with per-league failure isolation (verified live: a bad league fails cleanly, the next league syncs untouched). Client gained the deferred global rate-pacing gate (250ms). Next: ESPN sub-sections (blocked on Nick's public/private decisions) or cron sub-section.

---

## 2026-07-22 — First Real League Connected: Sleeper League-Scoped Sync Live (Config, Rosters, Standings, Matchups, Player Scores)

Nick's league "10 enter 1 Leaves" (2025, 10-team full-PPR) fully ingested end-to-end by three new services (`league-config`, `league-rosters`, `league-matchups` in `src/services/sleeper/` + `sync:league`/`sync:rosters`/`sync:matchups` runners): `leagues`+`league_config` (45 raw scoring keys, derived_config), 10 rosters/174 membership rows/10 standings, and 18 weeks of matchups (180 rows) + 3,152 player scores. Verified live: starter-sum vs. Sleeper's own totals matched on all 180 roster-weeks; standings and `derived_config` (with sign-off) folded in as build-file scope corrections. Next: Sleeper draft-state write path + per-league orchestrator.

---

_End of PROGRESS.md_
