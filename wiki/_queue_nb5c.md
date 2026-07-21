# Queue File: Notebook 5 — Sleeper API Integration (Part C)

**Notebook:** Sleeper API Integration
**Wiki category:** sleeper-api
**Priority:** Wave 1 unblock — narrow-scope supplemental cycle, added 2026-07-21
**Entry range:** 5.13–5.18 (6 entries)
**Generated:** 2026-07-21

---

### 5.13 Cross-Referencing Sleeper Player IDs

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: How Sleeper player_id should be cross-referenced or mapped to other ID systems (ESPN, Yahoo, PFR, GSIS) for cross-platform data joins.
- Notes: Ingested 2026-07-21 via cleanly-scoped 6-model panel. Created `sleeper-api/player-id-crosswalk.md`. Updated `sleeper-api/players-endpoint.md` with reciprocal related link. Key findings: no native `pfr_id` field in Sleeper's dump (unanimous 6/6); nflverse/DynastyProcess crosswalk is the community-standard reconciliation layer; join hierarchy is direct embedded IDs, then community crosswalk, then name+birthdate+position as last resort. One contested claim (gsis_id field existence) resolved via majority in verification cache.

---

### 5.14 Sleeper Trending Players Endpoint

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: The structure and update cadence of GET /players/nfl/trending/{add|drop}.
- Notes: Ingested 2026-07-21 via cleanly-scoped 6-model panel. Created `sleeper-api/trending-endpoint.md`. Updated `sleeper-api/players-endpoint.md` and `sleeper-api/rate-limits.md` with reciprocal related links. Key findings: raw unnormalized count with no denominator (unanimous 6/6); add/drop are independent unnetted streams; refresh cadence undocumented; dynasty/best-ball population skew.

---

### 5.15 Sleeper Defense and Free-Agent Player Representation

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: How team defenses (DST) and free-agent-only players are represented in the Sleeper players dataset.
- Notes: Ingested 2026-07-21 via cleanly-scoped 6-model panel. Created `sleeper-api/dst-and-free-agents.md`. Updated `sleeper-api/players-endpoint.md`, `sleeper-api/roster-endpoint.md`, and `sleeper-api/league-endpoint.md` with reciprocal related links. Key findings: DST keyed by team abbreviation with no cross-provider external IDs (unanimous 6/6); free-agent status is two independent concepts (NFL employment vs. fantasy-league availability, unanimous 6/6); league availability computed via roster set subtraction, not a dedicated endpoint.

---

### 5.16 Sleeper Players Payload Size and Caching Strategy

- Status: PENDING
- Wiki Category: sleeper-api
- Description: How large the /players/nfl payload is, and what caching or local-storage strategy Sleeper recommends or requires.
- Notes: (pending ingestion)

---

### 5.17 Sleeper Player Data Quirks

- Status: PENDING
- Wiki Category: sleeper-api
- Description: Undocumented behaviors or inconsistencies around bye weeks, injured reserve status, or practice squad flags in Sleeper's player data.
- Notes: (pending ingestion)

---

### 5.18 Sleeper Live vs. Finalized Scoring

- Status: PENDING
- Wiki Category: sleeper-api
- Description: Known quirks in how Sleeper reports partial-week/live scoring versus finalized weekly points.
- Notes: (pending ingestion)

---

This file covers entries 5.13–5.18 — the final Sleeper API batch. This file is LOCKED until `wiki/_queue_nb5b.md` reaches COMPLETED. When all entries in this file are COMPLETED or SKIPPED, update `wiki/_queue_master.md`: set this file → COMPLETED, `wiki/_queue_nb6a.md` → ACTIVE. Notebook 5 (Sleeper API Integration) will then be fully ingested.

_End of wiki/_queue_nb5c.md_
