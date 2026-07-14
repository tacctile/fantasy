# Fantasy Football Platform Wiki — Ingestion Roadmap

> **Living status document — updated after every notebook completes**
>
> **This file is for Nick and the wiki maintenance AI — not for Claude Code**
>
> **Last Updated:** 2026-07-14

---

## How to Resume After Any Break

1. Open a fresh Cowork or Claude Desktop session with GitHub MCP
2. Drop `wiki/WIKI_CHAT_CONTEXT.md` into the session (or read it directly from the repo)
3. The AI reads `wiki/_queue_master.md` → opens the ACTIVE batch file → finds the topmost PENDING entry
4. Say: "Continue wiki ingestion." Everything picks up exactly where it left off.

The repo is the memory. The queue is the state. Nothing is ever lost.

---

## The Core Workflow

### Phase 0 — Discovery Prompt (once per notebook)
Run the Discovery Prompt from `wiki/DISCOVERY_PROTOCOL.md` in the target NotebookLM notebook. The prompt requests exactly 25 subjects (this wiki has 25 subjects per notebook), ranked strictly by volume of source material (most coverage first), each annotated with a corpus depth rating (Rich / Moderate / Thin). NotebookLM returns the ranked list. Paste the response into the session. The AI parses it into the four `_queue_nb{N}{a-d}.md` batch files (~6-7 slots each), replaces any placeholder stubs, commits all four files, and updates `wiki/_queue_master.md`. The discovery cycle for that notebook is initialized.

### Phase 1 — Subject Ingestion (3 subjects per session)
Each session processes exactly 3 subjects via the 3-Subject Followup Prompt. Nick starts a fresh session for each triple. After every triple, the AI marks the three queue entries COMPLETED (with notes), updates the relevant `_index.md` files, updates `wiki/index.md` page counts if pages were added, and updates `wiki/_queue_master.md` if the batch file boundary was crossed.

### Phase 2 — Notebook Complete
When all entries in a notebook's four batch files are COMPLETED or SKIPPED, that notebook is done. Update the Progress Tracker below.

---

## Ingestion Order

| Priority | Notebook | Wiki Category | Status |
| -------- | -------- | ------------- | ------ |
| 1 | Player Evaluation & Opportunity Metrics | player-evaluation | 🔄 ACTIVE — nb1a queue ready, ingestion not yet begun |
| 2 | Team & Scheme Context | team-scheme | 🔒 LOCKED |
| 3 | League Mechanics, Scoring & Draft Strategy | league-mechanics | 🔒 LOCKED |
| 4 | In-Season Management, Injury/Availability & Situational Data | in-season-management | 🔒 LOCKED |

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

## Progress Tracker

| Notebook | Queue Populated | Pages Committed | Status |
| -------- | --------------- | --------------- | ------ |
| 1 — Player Evaluation & Opportunity Metrics | ✅ 25 subjects | ⬜ | 🔄 ACTIVE — ingestion not yet begun |
| 2 — Team & Scheme Context | ✅ 25 subjects | ⬜ | 🔒 LOCKED |
| 3 — League Mechanics, Scoring & Draft Strategy | ✅ 25 subjects | ⬜ | 🔒 LOCKED |
| 4 — In-Season Management, Injury/Availability & Situational Data | ✅ 25 subjects | ⬜ | 🔒 LOCKED |

---

## Notes & Audibles

**2026-07-14:** Wiki initialized. All 16 batch queue files created with all 100 subjects pre-populated across 4 notebooks. nb1a is ACTIVE. No ingestion has begun — all 100 subjects are PENDING. Run the first wiki maintenance session to begin ingesting notebook 1.

---

_End of wiki/WIKI_ROADMAP.md_
