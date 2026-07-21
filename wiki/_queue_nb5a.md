# Queue File: Notebook 5 — Sleeper API Integration (Part A)

**Notebook:** Sleeper API Integration
**Wiki category:** sleeper-api
**Priority:** Wave 1 unblock — narrow-scope supplemental cycle, added 2026-07-21 (not part of the original 100-subject/4-notebook sweep)
**Entry range:** 5.1–5.6 (6 entries)
**Generated:** 2026-07-21

---

### 5.1 Sleeper API Authentication Requirements

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: Does the Sleeper API require API keys, OAuth, or any authentication for read endpoints, and are there any authenticated or write endpoints at all?
- Notes: Created wiki/topics/sleeper-api/authentication.md (confidence: high). chathub.gg 6-model panel unanimous (6/6) that public read access requires no auth; 2-3 models additionally corroborated an undocumented authenticated GraphQL/WebSocket layer for mutations and live push, but with low precision on mechanics (see verification-cache.md Pending Verification). RISK: the panel run did not cleanly isolate subjects 5.1-5.3 — most responses answered a full Sleeper+ESPN sweep rather than the 3 requested subjects; only the portions relevant to 5.1 were synthesized here.

---

### 5.2 Sleeper League Endpoint Structure

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: The full structure and response schema of GET /league/{league_id}, including settings, scoring_settings, and roster_positions.
- Notes: Created wiki/topics/sleeper-api/league-endpoint.md (confidence: high). 4+ of 6 panel responses converged in detail on the settings/scoring_settings/roster_positions triad, lifecycle status values, and previous_league_id dynasty chaining. Same panel-scope-mismatch RISK as 5.1 applies — see verification-cache.md Unresolved Conflicts.

---

### 5.3 Sleeper Roster Endpoint Structure

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: The structure of GET /league/{league_id}/rosters, and how roster slots, taxi squad, IR, and reserve are represented.
- Notes: Created wiki/topics/sleeper-api/roster-endpoint.md (confidence: high). 3+ of 6 panel responses converged on roster_id/owner_id/players/starters/reserve/taxi structure and the fpts integer/decimal split mechanic (also logged to verification-cache.md). Same panel-scope-mismatch RISK as 5.1 applies.

---

### 5.4 Sleeper Matchup Endpoint Structure

- Status: PENDING
- Wiki Category: sleeper-api
- Description: The structure of GET /league/{league_id}/matchups/{week}, and how matchup_id pairings and starters/points are reported.
- Notes: (pending ingestion) — recommend re-running a cleanly scoped 3-subject panel prompt for 5.4-5.6 rather than reusing the 5.1-5.3 dump, since that material answered a broader scope than requested.

---

### 5.5 Sleeper Draft Endpoint Structure

- Status: PENDING
- Wiki Category: sleeper-api
- Description: The structure of GET /league/{league_id}/drafts, GET /draft/{draft_id}, and GET /draft/{draft_id}/picks, including pick metadata.
- Notes: (pending ingestion)

---

### 5.6 Sleeper Users Endpoint Structure

- Status: PENDING
- Wiki Category: sleeper-api
- Description: The structure of GET /league/{league_id}/users, and how user_id, display_name, and team names map to rosters.
- Notes: (pending ingestion)

---

This file covers entries 5.1–5.6. Entries 5.1–5.3 are COMPLETED (2026-07-21). `wiki/_queue_master.md` updated: this file → COMPLETED, `wiki/_queue_nb5b.md` → ACTIVE.

_End of wiki/_queue_nb5a.md_
