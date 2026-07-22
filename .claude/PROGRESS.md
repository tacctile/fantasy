# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

**Cap: 5 most recent entries only.** Each entry is a short summary (2-4 lines), not a detailed log — full session detail lives in `.claude/logs/`. When a 6th entry would be added, the oldest entry here rolls off into `.claude/PROGRESS_ARCHIVE.md` verbatim.

Newest entry on top.

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

## 2026-07-22 — Draft Board Is a Working Feature: Player List + Roster/Need Panel Live (Player-List Sub-Section Done)

First working implementation of the board's core feature — the placeholder regions are gone. Rows (injury chips, six Nick-signed `--pos-*` position tokens — RB shifted off brand teal), debounced search + position/availability filters, header-click sorting (nulls-last, deterministic tie-break) via a pure memoized hook, and the roster/positional-need sidebar (need vs dedicated starter slots, flex honest). Companion Nick-signed fix: `ir_slot_count` = max(IR labels, `reserve_slots`) — re-synced, live-verified 0→1. Bye week deferred to a schedule-derived source (`[>]` item; wiki-mandated). 25/25 logic checks + live board query verified. Next: 03a "States + resilience" (final sub-section).

---

## 2026-07-22 — Design System Live: Dark-Only Sleeper Palette Applied App-Wide (Palette Reconciliation Fold)

DESIGN_SYSTEM.md's final token set is now what the app actually renders — teal/tinted-dark values live in `globals.css` as a single always-on dark set (scaffold light + achromatic `.dark` blocks deleted; net-new `--well`/`--warning`/`--positive`; text tiers as alpha steps; permanent `dark` class). Nick-signed Clarify: `--radius` stays 0.625rem (containers hit 12–16px via Card's `rounded-xl` step) + pill-button/input-well pattern edits applied. Live-verified via `/login` screenshot (teal pill CTA, dark text, well inputs); auth walls re-verified. Every future UI session builds on the real palette. Next: 03a player list.

---

_End of PROGRESS.md_
