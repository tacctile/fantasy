# Queue File: Notebook 5 — Sleeper API Integration (Part B)

**Notebook:** Sleeper API Integration
**Wiki category:** sleeper-api
**Priority:** Wave 1 unblock — narrow-scope supplemental cycle, added 2026-07-21
**Entry range:** 5.7–5.12 (6 entries)
**Generated:** 2026-07-21

---

### 5.7 Sleeper Transactions Endpoint Structure

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: The structure of GET /league/{league_id}/transactions/{round}, and how waiver, free agency, and trade transaction types are differentiated.
- Notes: Ingested via cleanly-scoped 6-model panel, 2026-07-21. Created `sleeper-api/transactions-endpoint`. Strong convergence on type discriminator, uniform adds/drops/draft_picks/waiver_budget asset model, and failed-waiver-claims-pollute-counts pitfall. Reciprocal related links added to roster-endpoint, users-endpoint, league-endpoint, draft-endpoint.

---

### 5.8 Sleeper User and User-Leagues Endpoints

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: The structure of GET /user/{username or user_id} and GET /user/{user_id}/leagues/nfl/{season}.
- Notes: Ingested via cleanly-scoped 6-model panel, 2026-07-21. Created `sleeper-api/user-leagues-endpoint`. Strong convergence on user_id-as-durable-key and discovery-only (not ownership-source) framing. Reciprocal related links added to league-endpoint, roster-endpoint, users-endpoint. Co-manager visibility on this endpoint left as an open question (sources disagreed).

---

### 5.9 Sleeper Playoff Bracket Endpoints

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: What playoff bracket endpoints exist (winners_bracket / losers_bracket), and how bracket progression is encoded.
- Notes: Ingested via cleanly-scoped 6-model panel, 2026-07-21. Created `sleeper-api/playoff-bracket-endpoint` (confidence: medium, due to an unresolved cross-source contradiction on mid-playoff reseeding — logged in `wiki/verification-cache.md` Unresolved Conflicts). Reciprocal related links added to matchup-endpoint, roster-endpoint, league-endpoint.

---

### 5.10 Sleeper NFL State Endpoint

- Status: PENDING
- Wiki Category: sleeper-api
- Description: What NFL state/season metadata is available via GET /state/nfl, and how it should be used to determine the current week.
- Notes: (pending ingestion)

---

### 5.11 Sleeper API Rate Limits

- Status: PENDING
- Wiki Category: sleeper-api
- Description: Sleeper's documented and empirically observed rate limits, and what HTTP behavior occurs when they're exceeded.
- Notes: (pending ingestion)

---

### 5.12 Sleeper Players Dump and Canonical Player ID

- Status: PENDING
- Wiki Category: sleeper-api
- Description: The structure of the full GET /players/nfl dump, and Sleeper's canonical player_id scheme.
- Notes: (pending ingestion)

---

This file covers entries 5.7–5.12. This file is LOCKED until `wiki/_queue_nb5a.md` reaches COMPLETED. When all entries in this file are COMPLETED or SKIPPED, update `wiki/_queue_master.md`: set this file → COMPLETED, `wiki/_queue_nb5c.md` → ACTIVE.

_End of wiki/_queue_nb5b.md_
