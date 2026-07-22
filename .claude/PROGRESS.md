# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

**Cap: 5 most recent entries only.** Each entry is a short summary (2-4 lines), not a detailed log — full session detail lives in `.claude/logs/`. When a 6th entry would be added, the oldest entry here rolls off into `.claude/PROGRESS_ARCHIVE.md` verbatim.

Newest entry on top.

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

## 2026-07-22 — Wave 2 Begun: First Live Data Ingestion — Sleeper Player Catalog Synced (12,200 Players)

First working Wave 2 feature. The full "Sleeper — client + player catalog" sub-section shipped as one fold: typed server-only Sleeper client (`src/services/sleeper/`), validate-before-persist catalog sync, and catalog-presence inactive marking (two new `players` columns, migration `20260722134911`). Live verification: 12,200 players fetched and upserted into production `players` in ~33s via `npm run sync:players`; D/ST abbreviation IDs and metadata's cross-provider ID block confirmed intact. Next: Sleeper league-scoped sync (needs a real league ID — open MANUAL_SETUP item).

---

## 2026-07-22 — WAVE 1 COMPLETE: Deployed Health-Check Gate Passed, `01_foundation.md` 🟢

Full checklist completion — the first build file finished. The final item shipped `/api/health` (public, minimal `{ ok }`) plus the deferred secret-key admin client; deployed production returned 200 `{"ok":true}` on a real authenticated read, functionally proving the Vercel env vars and end-to-end DB reachability. Registry + roadmap rows flipped 🟢. Next in roadmap order: `02_data_pipeline.md` (Wave 2 — all its MANUAL_SETUP items still open: Sleeper league ID, ESPN public/private decisions, cookies).

---

_End of PROGRESS.md_
