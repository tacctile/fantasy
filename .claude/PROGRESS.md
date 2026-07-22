# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

**Cap: 5 most recent entries only.** Each entry is a short summary (2-4 lines), not a detailed log — full session detail lives in `.claude/logs/`. When a 6th entry would be added, the oldest entry here rolls off into `.claude/PROGRESS_ARCHIVE.md` verbatim.

Newest entry on top.

---

## 2026-07-22 — Draft Board Is a Working Feature: Player List + Roster/Need Panel Live (Player-List Sub-Section Done)

First working implementation of the board's core feature — the placeholder regions are gone. Rows (injury chips, six Nick-signed `--pos-*` position tokens — RB shifted off brand teal), debounced search + position/availability filters, header-click sorting (nulls-last, deterministic tie-break) via a pure memoized hook, and the roster/positional-need sidebar (need vs dedicated starter slots, flex honest). Companion Nick-signed fix: `ir_slot_count` = max(IR labels, `reserve_slots`) — re-synced, live-verified 0→1. Bye week deferred to a schedule-derived source (`[>]` item; wiki-mandated). 25/25 logic checks + live board query verified. Next: 03a "States + resilience" (final sub-section).

---

## 2026-07-22 — Design System Live: Dark-Only Sleeper Palette Applied App-Wide (Palette Reconciliation Fold)

DESIGN_SYSTEM.md's final token set is now what the app actually renders — teal/tinted-dark values live in `globals.css` as a single always-on dark set (scaffold light + achromatic `.dark` blocks deleted; net-new `--well`/`--warning`/`--positive`; text tiers as alpha steps; permanent `dark` class). Nick-signed Clarify: `--radius` stays 0.625rem (containers hit 12–16px via Card's `rounded-xl` step) + pill-button/input-well pattern edits applied. Live-verified via `/login` screenshot (teal pill CTA, dark text, well inputs); auth walls re-verified. Every future UI session builds on the real palette. Next: 03a player list.

---

## 2026-07-22 — First UI Surface + Owner Auth Live: Admin Draft-Board Route, Shell, and Real Sign-In (Route + Page Shell Sub-Section Done)

Core infra activation — Supabase Auth exercised for the first time ever (Nick signed in live, landed on the real board, sign-out verified). Full owner path shipped in one fold: `src/proxy.ts` session-refresh/unauth wall (Next 16 proxy), `/login` + server actions, `(admin)` gate via `is_fantasy_admin` RPC, the admin-only RSC draft route → `DraftBoardShell` (header with league selector, platform badge, ADP freshness; table/sidebar regions placeholder until the player-list sub-section). Unauth responses asserted free of league/admin data. Flagged: dark-only Sleeper palette still unapplied (scaffold light tokens live) — next-fold candidate. Next: 03a player list.

---

## 2026-07-22 — Wave 3a Begun: ADP Pipeline Live — Sleeper Undocumented Projections Endpoint Ingested

First working Wave 3a feature — the full "ADP schema + ingestion" sub-section (9 items, one fold). `adp_rankings` live (long per-format rows, Nick-signed shape), quarantined `services/adp/` ingestion against `api.sleeper.com` (validate-before-swap, pattern-based `adp_*` extraction, 999-sentinel exclusion, positional-rank derivation), `sync_runs` extended, `/api/cron/sync-adp` + daily piggyback on the sync-leagues cron (Hobby slots full — Nick-signed). Live-verified: 2,946 rows / 10 formats / season 2026, idempotent re-run, 0 unmapped, Bijan ppr 1.4/RB1 matches the wiki sample. Next: draft-board data layer.

---

## 2026-07-22 — Automated Pipeline Live: Vercel Cron Surface + sync_runs Telemetry (Cron Sub-Section Done)

Core infra activation — the data pipeline now runs itself. Three secret-gated cron routes (`/api/cron/sync-players|sync-leagues|sync-draft`), `sync_runs` telemetry table (migration `20260722160525`) with a once-per-day catalog guard, and two daily Vercel crons (Hobby cap — 15-min league cadence deferred to season start, item `[~]`; draft route unscheduled until 3b). Verified live in production: 401s unauthenticated, guard skip, full league-state run, cron registration confirmed. Next: Wave 3a, gated on its two plain-chat MANUAL_SETUP items (ADP source, board leagues).

---

_End of PROGRESS.md_
