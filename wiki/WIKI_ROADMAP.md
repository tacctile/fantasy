# Fantasy Football Platform Wiki — Ingestion Roadmap

> **Living status document — updated after every notebook completes**
>
> **This file is for Nick and the wiki maintenance AI — not for Claude Code**
>
> **Last Updated:** 2026-07-21

---

## How to Resume After Any Break

1. Open a fresh Cowork or Claude Desktop session with GitHub MCP
2. Drop `wiki/WIKI_CHAT_CONTEXT.md` into the session (or read it directly from the repo)
3. The AI reads `wiki/_queue_master.md` → opens the ACTIVE batch file → finds the topmost PENDING entry
4. Say: "Continue wiki ingestion." Everything picks up exactly where it left off.

The repo is the memory. The queue is the state. Nothing is ever lost.

---

## The Core Workflow

### Phase 0 — Queue Initialization (already complete)
All 100 subjects across all 4 original notebooks were pre-populated into the 16 batch queue files at wiki initialization (2026-07-14). This phase does not repeat — the Cycle 1 subject list is fixed unless Nick manually edits a batch file to add new subjects.

**Cycle 2 addition (2026-07-21):** `sleeper-api` and `espn-api` were valid categories from the original governance scaffold but had no discovery queue and no content. To unblock Wave 1 of the build roadmap, 18 sleeper-api subjects and 19 espn-api subjects were generated as a narrow-scope supplemental cycle (Notebook 5 and Notebook 6 below) and pre-populated into 6 new batch queue files (`_queue_nb5a–c`, `_queue_nb6a–c`), structured identically to Cycle 1 so the same 3-subject-per-session chathub.gg cadence applies without any protocol changes.

### Phase 1 — Subject Ingestion (3 subjects per session)
Each session processes exactly 3 subjects via the 3-Subject Panel Prompt, pasted into chathub.gg to run against all 6 configured AI models. Nick pastes each of the 6 responses back into the session, and the AI convergence-filters them per `wiki/DISCOVERY_PROTOCOL.md` before synthesizing wiki pages. Nick starts a fresh session for each triple. After every triple, the AI marks the three queue entries COMPLETED (with notes), updates the relevant `_index.md` files, updates `wiki/index.md` page counts if pages were added, and updates `wiki/_queue_master.md` if the batch file boundary was crossed.

### Phase 2 — Notebook Complete
When all entries in a notebook's batch files are COMPLETED or SKIPPED, that notebook is done. Update the Progress Tracker below.

---

## Ingestion Order

| Priority | Notebook | Wiki Category | Status |
| -------- | -------- | ------------- | ------ |
| 1 | Player Evaluation & Opportunity Metrics | player-evaluation | ✅ COMPLETED — all 25 subjects ingested |
| 2 | Team & Scheme Context | team-scheme | ✅ COMPLETED — all 25 subjects ingested |
| 3 | League Mechanics, Scoring & Draft Strategy | league-mechanics | ✅ COMPLETED — all 25 subjects ingested |
| 4 | In-Season Management, Injury/Availability & Situational Data | in-season-management | ✅ COMPLETED — all 25 subjects ingested |
| 5 | Sleeper API Integration | sleeper-api | 🔄 ACTIVE — nb5a queue ready, entries 5.1–5.3 IN_PROGRESS (dispatched to chathub.gg 2026-07-21) |
| 6 | ESPN API Integration | espn-api | 🔒 LOCKED — queued via nb6a–c, begins after Notebook 5 completes |

---

## Notebook 1 — Player Evaluation & Opportunity Metrics

**Wiki category:** player-evaluation
**Question target:** 25 pages (one per subject)
**Priority:** FIRST — foundational player metrics everything else references
**Queue files:** nb1a (ACTIVE) · nb1b/c/d (LOCKED)
**Discovery run:** Pre-populated with 25 known subjects

### Subjects (1–25)
1. Target Share
2. Air Yards Share
3. Weighted Opportunity Rating (WOPR)
4. Yards Per Route Run (YPRR)
5. Route Participation Rate
6. Snap Share
7. Red Zone Target Share
8. Goal-Line Carry Share
9. Carries Per Game / Carry Share
10. Touches Per Game
11. Catch Rate / Contested Catch Rate
12. Yards After Catch (YAC)
13. Average Depth of Target (aDOT)
14. Explosive Play Rate / Breakaway Run Rate
15. Missed Tackles Forced / Yards After Contact
16. Fantasy Points Over Expected (FPOE)
17. Expected Fantasy Points (xFP)
18. Value Over Replacement Player (VORP/VBD)
19. Drop Rate
20. First-Read Target Rate / Target Quality
21. QB Designed Rush Rate / Scramble Rate
22. QB EPA per Dropback / CPOE
23. TE Alignment Rate (Inline vs. Slot/Wide)
24. Rookie College Dominator Rating / Breakout Age
25. Athletic Testing (RAS / Speed Score / Burst Score)

---

## Notebook 2 — Team & Scheme Context

**Wiki category:** team-scheme
**Question target:** 25 pages
**Priority:** SECOND
**Queue files:** nb2a/b/c/d (LOCKED)
**Discovery run:** Pre-populated

---

## Notebook 3 — League Mechanics, Scoring & Draft Strategy

**Wiki category:** league-mechanics
**Question target:** 25 pages
**Priority:** THIRD
**Queue files:** nb3a/b/c/d (LOCKED)
**Discovery run:** Pre-populated

---

## Notebook 4 — In-Season Management, Injury/Availability & Situational Data

**Wiki category:** in-season-management
**Question target:** 25 pages
**Priority:** FOURTH
**Queue files:** nb4a/b/c/d (LOCKED)
**Discovery run:** Pre-populated

---

## Notebook 5 — Sleeper API Integration

**Wiki category:** sleeper-api
**Question target:** 18 pages (one per subject, unless subjects are tightly related enough to consolidate)
**Priority:** FIFTH — narrow-scope Wave 1 unblock, not part of the original 100-subject taxonomy
**Queue files:** nb5a (ACTIVE, entries 5.1–5.3 IN_PROGRESS) · nb5b/c (LOCKED)
**Discovery run:** Subjects generated 2026-07-21 by Claude at Nick's request to cover: authentication (or lack thereof), endpoint structure (league, roster, matchup, draft, players), rate limits, player data format/canonical player ID structure, and known quirks/undocumented behavior.

### Subjects (5.1–5.18)
1. Sleeper API Authentication Requirements
2. Sleeper League Endpoint Structure
3. Sleeper Roster Endpoint Structure
4. Sleeper Matchup Endpoint Structure
5. Sleeper Draft Endpoint Structure
6. Sleeper Users Endpoint Structure
7. Sleeper Transactions Endpoint Structure
8. Sleeper User and User-Leagues Endpoints
9. Sleeper Playoff Bracket Endpoints
10. Sleeper NFL State Endpoint
11. Sleeper API Rate Limits
12. Sleeper Players Dump and Canonical Player ID
13. Cross-Referencing Sleeper Player IDs
14. Sleeper Trending Players Endpoint
15. Sleeper Defense and Free-Agent Player Representation
16. Sleeper Players Payload Size and Caching Strategy
17. Sleeper Player Data Quirks
18. Sleeper Live vs. Finalized Scoring

---

## Notebook 6 — ESPN API Integration

**Wiki category:** espn-api
**Question target:** 19 pages (one per subject, unless subjects are tightly related enough to consolidate)
**Priority:** SIXTH — narrow-scope Wave 1 unblock, not part of the original 100-subject taxonomy
**Queue files:** nb6a/b/c (LOCKED — begins after Notebook 5 completes)
**Discovery run:** Subjects generated 2026-07-21 by Claude at Nick's request to cover: cookie auth mechanics (espn_s2/SWID), public vs. private league detection, endpoint structure (league, roster, matchup, draft, players), and known quirks/undocumented behavior specific to ESPN's API.

### Subjects (6.1–6.19)
1. ESPN espn_s2/SWID Origin and Auth Mechanics
2. Extracting and Refreshing ESPN Auth Cookies
3. ESPN Cookie/Header Format Requirements
4. Detecting Public vs. Private ESPN Leagues
5. ESPN Error Responses for Auth Failures
6. ESPN Public vs. Private Data Completeness
7. ESPN Fantasy API Base URL and Versioning
8. ESPN "view" Query Parameter
9. ESPN Roster Response Structure
10. ESPN Matchup Response Structure
11. ESPN Draft Detail Response Structure
12. ESPN Player Endpoint and Filtering
13. ESPN Historical Season Access
14. ESPN Team, Owner, and Member ID Structure
15. ESPN Proprietary Player ID Inconsistencies
16. ESPN Undocumented Rate-Limiting and IP Blocking
17. ESPN's History of Unannounced Breaking Changes
18. ESPN Bye Week, IR, and Locked Lineup Quirks
19. ESPN scoringPeriodId/matchupPeriodId Mismatches

---

## Progress Tracker

| Notebook | Queue Populated | Pages Committed | Status |
| -------- | --------------- | ---------------- | ------ |
| 1 — Player Evaluation & Opportunity Metrics | ✅ 25 subjects | ✅ 26 pages | ✅ COMPLETED |
| 2 — Team & Scheme Context | ✅ 25 subjects | ✅ 24 pages | ✅ COMPLETED |
| 3 — League Mechanics, Scoring & Draft Strategy | ✅ 25 subjects | ✅ 24 pages | ✅ COMPLETED |
| 4 — In-Season Management, Injury/Availability & Situational Data | ✅ 25 subjects | ✅ 23 pages | ✅ COMPLETED |
| 5 — Sleeper API Integration | ✅ 18 subjects | ⏳ 0 pages | 🔄 ACTIVE — 5.1–5.3 IN_PROGRESS |
| 6 — ESPN API Integration | ✅ 19 subjects | ⏳ 0 pages | 🔒 LOCKED |

---

## Notes & Audibles

**2026-07-14:** Wiki initialized. All 16 batch queue files created with all 100 subjects pre-populated across 4 notebooks. nb1a is ACTIVE. No ingestion has begun — all 100 subjects are PENDING. Run the first wiki maintenance session to begin ingesting notebook 1.

**2026-07-17:** Ingestion source switched from NotebookLM to a chathub.gg 6-model AI panel. NotebookLM is fully removed from the pipeline — no per-notebook discovery step, no corpus to diff against. Each session triple now generates a single 3-Subject Panel Prompt (opens with a fixed fantasy-football-analytics-expert framing, no platform/wiki context) run against all 6 models in chathub.gg; Nick pastes back the 6 responses and Claude applies the Convergence-Filtering Standard (`wiki/DISCOVERY_PROTOCOL.md`) before synthesizing pages. First triple ingested under this pipeline: 1.1 Target Share, 1.2 Air Yards Share, 1.3 WOPR — all three created in `wiki/topics/player-evaluation/`.

**2026-07-17 (later):** Notebook 1 (Player Evaluation & Opportunity Metrics) fully ingested — all 25 subjects COMPLETED across nb1a–nb1d, 26 pages committed to `wiki/topics/player-evaluation/`. Notebook 2 (Team & Scheme Context) is now ACTIVE via `wiki/_queue_nb2a.md`.

**2026-07-17 (later still):** Notebook 2 (Team & Scheme Context) fully ingested — all 25 subjects COMPLETED across nb2a–nb2d, 24 pages committed to `wiki/topics/team-scheme/`. Notebook 3 (League Mechanics, Scoring & Draft Strategy) is now ACTIVE via `wiki/_queue_nb3a.md`.

**2026-07-18:** Notebook 3 (League Mechanics, Scoring & Draft Strategy) fully ingested — all 25 subjects COMPLETED across nb3a–nb3d, 24 pages committed to `wiki/topics/league-mechanics/`. Notebook 4 (In-Season Management, Injury/Availability & Situational Data) is now ACTIVE via `wiki/_queue_nb4a.md`.

**2026-07-18 (later):** Notebook 4 (In-Season Management, Injury/Availability & Situational Data) fully ingested — all 25 subjects COMPLETED across nb4a–nb4d, 23 pages committed to `wiki/topics/in-season-management/` (2 pages routed to `wiki/topics/league-mechanics/` where content fit better: multi-platform-adp-divergence). All 16 queue files across all 4 notebooks are now COMPLETED. The full discovery cycle (Cycle 1) is complete — 100 subjects processed, 98 total wiki pages committed.

**2026-07-21:** `sleeper-api` and `espn-api` identified as blockers for Wave 1 of the build roadmap — both were registered as valid categories in `wiki/schema.yml` at governance-scaffold time (2026-07-18) but never had a discovery queue or any content. Ran a narrow, targeted subject-generation pass (not a full taxonomy sweep): 18 subjects for sleeper-api and 19 subjects for espn-api. Initialized Cycle 2 of the discovery queue — Notebook 5 (Sleeper API Integration, `_queue_nb5a–c.md`) and Notebook 6 (ESPN API Integration, `_queue_nb6a–c.md`) — using the identical structure, 3-Subject Panel Prompt template (reframed for API/technical-integration expertise instead of fantasy analytics), and 3-subjects-per-session cadence as Cycle 1. `wiki/_queue_master.md`, `wiki/MAINTAINER.md`, and this file updated for consistency. nb5a set ACTIVE with entries 5.1–5.3 (Sleeper auth, league endpoint, roster endpoint) IN_PROGRESS — panel prompt already generated and sent to Nick, dispatched to chathub.gg, awaiting the 6 model responses. `schema-reference` remains untouched and empty per the roadmap — it stays empty until Wave 1 defines the real schema.

---

_End of wiki/WIKI_ROADMAP.md_
