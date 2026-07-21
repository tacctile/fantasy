# Sleeper API

Sleeper platform integration reference: endpoint structure, rate limits, auth (none required), and data shape quirks for player identity, stats, and league data.

| Page | Description | Confidence |
| ---- | ------------ | ---------- |
| [authentication](authentication.md) | No auth/API key required for any public read endpoint; no API-level concept of a private league; no 401/403 error taxonomy; all IDs must be handled as strings; a separate undocumented GraphQL/WebSocket layer handles authenticated writes and live push. | high |
| [league-endpoint](league-endpoint.md) | `GET /league/{league_id}` structure: `settings`, `scoring_settings`, `roster_positions`, lifecycle status, dynasty `previous_league_id` chaining, and the gotcha that league renewal issues a brand-new `league_id` each season. | high |
| [roster-endpoint](roster-endpoint.md) | `GET /league/{league_id}/rosters` structure: `roster_id` vs. nullable `owner_id`, the four player-ID groupings, the split integer/decimal `fpts` representation, and deriving bench via three-way set subtraction (no bench array is returned). | high |
| [matchup-endpoint](matchup-endpoint.md) | `GET /league/{league_id}/matchups/{week}` structure: one object per roster (not per matchup) grouped via `matchup_id`, `custom_points` override precedence, no live-scoring finality signal, and median-league results computed independently of this endpoint. | high |
| [draft-endpoint](draft-endpoint.md) | The three draft endpoints (`/drafts`, `/draft/{id}`, `/draft/{id}/picks`): `roster_id` as the authoritative pick-ownership field over `draft_slot`/`picked_by`, multi-draft-per-league handling, and pick metadata as a point-in-time snapshot. | high |
| [users-endpoint](users-endpoint.md) | `GET /league/{league_id}/users` structure: accounts, not teams — no `roster_id` on this endpoint; the `owner_id`/`co_owners` join to rosters; and the team-name display fallback hierarchy. | high |
| [transactions-endpoint](transactions-endpoint.md) | `GET /league/{league_id}/transactions/{round}` structure: `type` (waiver/free_agent/trade) as the classification field, uniform asset movement via `adds`/`drops`/`draft_picks`/`waiver_budget`, and the pitfall of failed waiver claims polluting naive activity counts. | high |
| [user-leagues-endpoint](user-leagues-endpoint.md) | `GET /user/{username or user_id}` and `GET /user/{user_id}/leagues/nfl/{season}`: global identity resolution, `user_id` as the only durable key, season-scoped league discovery, and why this endpoint is discovery-only, never an ownership source. | high |
| [playoff-bracket-endpoint](playoff-bracket-endpoint.md) | `GET /league/{league_id}/winners_bracket` and `/losers_bracket`: the match-graph model via `t1_from`/`t2_from` reference objects, placement ladder via `p`, bye encoding, and an unresolved cross-source contradiction over mid-playoff reseeding. | medium |

_Notebook 5 (Sleeper API Integration) is in progress — 9 of 18 subjects ingested as of 2026-07-21 (subjects 5.1–5.9 complete). `wiki/_queue_nb5b.md` is now ACTIVE for subjects 5.10–5.12._
