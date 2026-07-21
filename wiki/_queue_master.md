# Fantasy Football Platform Wiki — Discovery Queue Master Index

> **Navigation index only — no subject entries live here**
>
> **Read this file first → find the first ACTIVE queue file → read that file → find the topmost PENDING entry**
>
> **Total subjects:** 100 (Cycle 1 — original sweep) + 37 (Cycle 2 — Wave 1 API unblock: sleeper-api 18, espn-api 19)
> **Total slots:** 100 (16 files × 6-7 per file, Cycle 1) + 37 (6 files × 6-7 per file, Cycle 2)
> **Cycle:** 1 (initial build) — COMPLETED · 2 (Wave 1 API unblock) — ACTIVE
> **Generated:** 2026-07-14 (Cycle 1) · 2026-07-21 (Cycle 2)
> **Updated:** 2026-07-21 — Cycle 2 initialized: nb5a–nb5c (sleeper-api) and nb6a–nb6c (espn-api) added. nb5a set ACTIVE with entries 5.1–5.3 IN_PROGRESS (first Sleeper panel prompt already generated and sent to Nick, awaiting chathub.gg 6-model responses).

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
| [_queue_nb5a.md](_queue_nb5a.md) | Sleeper API Integration | 5.1–5.6 (6) | sleeper-api | ACTIVE |
| [_queue_nb5b.md](_queue_nb5b.md) | Sleeper API Integration | 5.7–5.12 (6) | sleeper-api | LOCKED |
| [_queue_nb5c.md](_queue_nb5c.md) | Sleeper API Integration | 5.13–5.18 (6) | sleeper-api | LOCKED |
| [_queue_nb6a.md](_queue_nb6a.md) | ESPN API Integration | 6.1–6.7 (7) | espn-api | LOCKED |
| [_queue_nb6b.md](_queue_nb6b.md) | ESPN API Integration | 6.8–6.13 (6) | espn-api | LOCKED |
| [_queue_nb6c.md](_queue_nb6c.md) | ESPN API Integration | 6.14–6.19 (6) | espn-api | LOCKED |

**Status values:** ACTIVE / LOCKED / COMPLETED

**Valid categories (7 total):** `player-evaluation`, `team-scheme`, `league-mechanics`, `in-season-management`, `sleeper-api`, `espn-api`, `schema-reference` (schema-reference has no discovery queue — it stays empty until Wave 1 defines the real schema, per `wiki/WIKI_ROADMAP.md`).

---

## Transition Rules

When all entries in the ACTIVE file are COMPLETED or SKIPPED:
1. Set the current ACTIVE file → COMPLETED in the table above.
2. Set the next file in the table → ACTIVE (order: nb1a → nb1b → nb1c → nb1d → nb2a → … → nb4d → nb5a → nb5b → nb5c → nb6a → nb6b → nb6c).
3. Commit this file (`wiki/_queue_master.md`) as part of housekeeping.

When all files in a cycle's table are COMPLETED or SKIPPED, that cycle is complete. Report it and stop — do not auto-start a new cycle.

---

_End of wiki/_queue_master.md_
