# Fantasy Football Platform Wiki — Discovery Queue Master Index

> **Navigation index only — no subject entries live here**
>
> **Read this file first → find the first ACTIVE queue file → read that file → find the topmost PENDING entry**
>
> **Total subjects:** 100 (Cycle 1 — original sweep) + 37 (Cycle 2 — Wave 1 API unblock: sleeper-api 18, espn-api 19) + 3 (Cycle 3 — Wave 1 schema unblock: schema-reference 3, decision-record mode)
> **Total slots:** 100 (16 files × 6-7 per file, Cycle 1) + 37 (6 files × 6-7 per file, Cycle 2) + 3 (1 file, Cycle 3)
> **Cycle:** 1 (initial build) — COMPLETED · 2 (Wave 1 API unblock) — ACTIVE · 3 (Wave 1 schema unblock) — LOCKED
> **Generated:** 2026-07-14 (Cycle 1) · 2026-07-21 (Cycle 2) · 2026-07-21 (Cycle 3)
> **Updated:** 2026-07-21 — Subjects 6.11–6.13 (draft detail, player endpoint/filtering, historical season access) ingested via cleanly-scoped 6-model panels. `_queue_nb6b.md` is now fully COMPLETED — all 6 of 6 subjects ingested. `_queue_nb6c.md` (subjects 6.14–6.19) is now ACTIVE.

---

## Navigation Instructions

1. Read this file to find which queue file is ACTIVE.
2. Read the ACTIVE queue file.
3. Find the topmost PENDING (or IN_PROGRESS) entry in that file and proceed from there.
4. If no ACTIVE file has any PENDING entries, the current cycle is complete.

Never add subject entries to this file. All entries live exclusively in the batch queue files below.

---

## Queue Files

### Cycle 1 — Original 100-Subject Sweep (COMPLETED)

| File | Notebook | Subjects | Category | Status |
| ---- | -------- | -------- | -------- | ------ |
| [_queue_nb1a.md](_queue_nb1a.md) | Player Evaluation & Opportunity Metrics | 1.1–1.7 (7) | player-evaluation | COMPLETED |
| [_queue_nb1b.md](_queue_nb1b.md) | Player Evaluation & Opportunity Metrics | 1.8–1.13 (6) | player-evaluation | COMPLETED |
| [_queue_nb1c.md](_queue_nb1c.md) | Player Evaluation & Opportunity Metrics | 1.14–1.19 (6) | player-evaluation | COMPLETED |
| [_queue_nb1d.md](_queue_nb1d.md) | Player Evaluation & Opportunity Metrics | 1.20–1.25 (6) | player-evaluation | COMPLETED |
| [_queue_nb2a.md](_queue_nb2a.md) | Team & Scheme Context | 2.1–2.7 (7) | team-scheme | COMPLETED |
| [_queue_nb2b.md](_queue_nb2b.md) | Team & Scheme Context | 2.8–2.13 (6) | team-scheme | COMPLETED |
| [_queue_nb2c.md](_queue_nb2c.md) | Team & Scheme Context | 2.14–2.19 (6) | team-scheme | COMPLETED |
| [_queue_nb2d.md](_queue_nb2d.md) | Team & Scheme Context | 2.20–2.25 (6) | team-scheme | COMPLETED |
| [_queue_nb3a.md](_queue_nb3a.md) | League Mechanics, Scoring & Draft Strategy | 3.1–3.7 (7) | league-mechanics | COMPLETED |
| [_queue_nb3b.md](_queue_nb3b.md) | League Mechanics, Scoring & Draft Strategy | 3.8–3.13 (6) | league-mechanics | COMPLETED |
| [_queue_nb3c.md](_queue_nb3c.md) | League Mechanics, Scoring & Draft Strategy | 3.14–3.19 (6) | league-mechanics | COMPLETED |
| [_queue_nb3d.md](_queue_nb3d.md) | League Mechanics, Scoring & Draft Strategy | 3.20–3.25 (6) | league-mechanics | COMPLETED |
| [_queue_nb4a.md](_queue_nb4a.md) | In-Season Management, Injury/Availability & Situational Data | 4.1–4.7 (7) | in-season-management | COMPLETED |
| [_queue_nb4b.md](_queue_nb4b.md) | In-Season Management, Injury/Availability & Situational Data | 4.8–4.13 (6) | in-season-management | COMPLETED |
| [_queue_nb4c.md](_queue_nb4c.md) | In-Season Management, Injury/Availability & Situational Data | 4.14–4.19 (6) | in-season-management | COMPLETED |
| [_queue_nb4d.md](_queue_nb4d.md) | In-Season Management, Injury/Availability & Situational Data | 4.20–4.25 (6) | in-season-management | COMPLETED |

### Cycle 2 — Wave 1 API Unblock (ACTIVE, added 2026-07-21)

Narrow-scope supplemental cycle. `sleeper-api` and `espn-api` were registered as valid categories in `wiki/schema.yml` from the original .claude/ governance scaffold but left empty, blocking Wave 1 of the build roadmap. Subject lists (18 for sleeper-api, 19 for espn-api) were generated separately from the original 100-subject taxonomy and are queued here using the identical Notebook/batch-file structure so ingestion follows the same 3-subject-per-session chathub.gg cadence.

| File | Notebook | Subjects | Category | Status |
| ---- | -------- | -------- | -------- | ------ |
| [_queue_nb5a.md](_queue_nb5a.md) | Sleeper API Integration | 5.1–5.6 (6) | sleeper-api | COMPLETED |
| [_queue_nb5b.md](_queue_nb5b.md) | Sleeper API Integration | 5.7–5.12 (6) | sleeper-api | COMPLETED |
| [_queue_nb5c.md](_queue_nb5c.md) | Sleeper API Integration | 5.13–5.18 (6) | sleeper-api | COMPLETED |
| [_queue_nb6a.md](_queue_nb6a.md) | ESPN API Integration | 6.1–6.7 (7) | espn-api | COMPLETED |
| [_queue_nb6b.md](_queue_nb6b.md) | ESPN API Integration | 6.8–6.13 (6) | espn-api | COMPLETED |
| [_queue_nb6c.md](_queue_nb6c.md) | ESPN API Integration | 6.14–6.19 (6) | espn-api | ACTIVE |

**Status values:** ACTIVE / LOCKED / COMPLETED

**Valid categories (7 total):** `player-evaluation`, `team-scheme`, `league-mechanics`, `in-season-management`, `sleeper-api`, `espn-api`, `schema-reference` (schema-reference's discovery queue is Cycle 3 below — it runs in decision-record mode, not panel-synthesis mode, and stays LOCKED until Cycle 2 finishes).

### Cycle 3 — Wave 1 Schema Unblock (LOCKED, added 2026-07-21)

Single-file supplemental cycle for the `schema-reference` category. Unlike Cycles 1 and 2, these subjects have no external source of truth to synthesize from — they are the platform's own internal data model and must be decided, not researched. Pages here are `decision-record` type, not `domain-knowledge`. Full rationale and process notes live in `_queue_nb7a.md` itself.

| File | Notebook | Subjects | Category | Status |
| ---- | ---- | -------- | -------- | ------ |
| [_queue_nb7a.md](_queue_nb7a.md) | Schema Reference | 7.1–7.3 (3) | schema-reference | LOCKED |

**Unlocks when:** `_queue_nb6c.md` (Cycle 2's last file) reaches COMPLETED — i.e. after both Sleeper and ESPN are fully ingested. Run as a dedicated decision-making session with Nick, not a solo panel-and-commit loop.

---

## Transition Rules

When all entries in the ACTIVE file are COMPLETED or SKIPPED:
1. Set the current ACTIVE file → COMPLETED in the table above.
2. Set the next file in the table → ACTIVE (order: nb1a → nb1b → nb1c → nb1d → nb2a → … → nb4d → nb5a → nb5b → nb5c → nb6a → nb6b → nb6c → nb7a).
3. Commit this file (`wiki/_queue_master.md`) as part of housekeeping.

When all files in a cycle's table are COMPLETED or SKIPPED, that cycle is complete. Report it and stop — do not auto-start a new cycle.

---

_End of wiki/_queue_master.md_
