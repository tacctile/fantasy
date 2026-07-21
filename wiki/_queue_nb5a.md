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

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: The structure of GET /league/{league_id}/matchups/{week}, and how matchup_id pairings and starters/points are reported.
- Notes: Created wiki/topics/sleeper-api/matchup-endpoint.md (confidence: high). This was a cleanly-scoped 3-subject panel run (5.4-5.6) — all 6 responses addressed the requested subjects directly. 6/6 unanimous on the core structural fact (one object per roster, not per matchup; group by matchup_id to reconstruct pairings) and on the full field set (roster_id, matchup_id, points, custom_points, starters, starters_points, players, players_points). Strong convergence (5-6/6) on custom_points precedence, live-scoring finality gap, and median-league invisibility.

---

### 5.5 Sleeper Draft Endpoint Structure

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: The structure of GET /league/{league_id}/drafts, GET /draft/{draft_id}, and GET /draft/{draft_id}/picks, including pick metadata.
- Notes: Created wiki/topics/sleeper-api/draft-endpoint.md (confidence: high). Cleanly-scoped panel run. 6/6 unanimous that a league can have multiple drafts, on the three-endpoint structure, and that roster_id (not draft_slot or picked_by) is the authoritative pick-ownership field reflecting traded picks. Strong convergence (5-6/6) on snake-draft math being a fallback only, auction metadata.amount as the true cost signal, and pick metadata staleness.

---

### 5.6 Sleeper Users Endpoint Structure

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: The structure of GET /league/{league_id}/users, and how user_id, display_name, and team names map to rosters.
- Notes: Created wiki/topics/sleeper-api/users-endpoint.md (confidence: high). Cleanly-scoped panel run. 6/6 unanimous that this endpoint returns accounts (no roster_id at all) and that the owner_id/co_owners join to the rosters endpoint is required to map users to teams; also unanimous on the team-name display fallback hierarchy and on user_id as the only safe identity key. Strong convergence (4-5/6) on orphaned-roster and users-without-rosters edge cases.

---

This file covers entries 5.1–5.6. All 6 entries are now COMPLETED (2026-07-21). `wiki/_queue_master.md` updated: this file is now COMPLETED in full; `wiki/_queue_nb5b.md` is promoted to ACTIVE for subjects 5.7–5.12.

_End of wiki/_queue_nb5a.md_
