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

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: What NFL state/season metadata is available via GET /state/nfl, and how it should be used to determine the current week.
- Notes: Ingested via cleanly-scoped 6-model panel, 2026-07-21. Created `sleeper-api/nfl-state-endpoint`. Strong convergence (4-5 of 6) on the season_type-gated decision procedure (week for stats/matchups, leg for transactions, display_week for UI only), the Tuesday-rollover divergence between week/display_week, and league_season/league_create_season leading season during the winter rollover. Reciprocal related links added to league-endpoint, transactions-endpoint, matchup-endpoint.

---

### 5.11 Sleeper API Rate Limits

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: Sleeper's documented and empirically observed rate limits, and what HTTP behavior occurs when they're exceeded.
- Notes: Ingested via cleanly-scoped 6-model panel, 2026-07-21. Created `sleeper-api/rate-limits` (confidence: medium, due to a cross-model contradiction on the exact ceiling — 5 of 6 responses stated ~1,000 requests/minute, 1 response reported an empirically observed ~100/minute — logged in `wiki/verification-cache.md` Unresolved Conflicts). Strong convergence on the players-dump once-daily rule and on enforcement escalating beyond clean 429s to connection-level failures or edge/CDN challenge responses. Reciprocal related link added to authentication.

---

### 5.12 Sleeper Players Dump and Canonical Player ID

- Status: COMPLETED
- Wiki Category: sleeper-api
- Description: The structure of the full GET /players/nfl dump, and Sleeper's canonical player_id scheme.
- Notes: Ingested via cleanly-scoped 6-model panel, 2026-07-21. Created `sleeper-api/players-endpoint`. Unanimous 6-of-6 agreement on the canonical ID scheme (numeric player IDs, team-abbreviation defense IDs) — the single strongest corroboration of any claim in this session — and on the once-daily fetch guidance. Reciprocal related links added to roster-endpoint, draft-endpoint, transactions-endpoint, rate-limits.

---

This file covers entries 5.7–5.12. All entries are now COMPLETED. Per `wiki/_queue_master.md` transition rules, this file is set to COMPLETED and `wiki/_queue_nb5c.md` is promoted to ACTIVE.

_End of wiki/_queue_nb5b.md_
