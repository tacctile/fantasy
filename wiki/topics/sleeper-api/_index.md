# Sleeper API

Sleeper platform integration reference: endpoint structure, rate limits, auth (none required), and data shape quirks for player identity, stats, and league data.

| Page | Description | Confidence |
| ---- | ------------ | ---------- |
| [authentication](authentication.md) | No auth/API key required for any public read endpoint; no API-level concept of a private league; a separate undocumented GraphQL/WebSocket layer handles authenticated writes and live push. | high |
| [league-endpoint](league-endpoint.md) | `GET /league/{league_id}` structure: `settings`, `scoring_settings`, `roster_positions`, lifecycle status, and dynasty `previous_league_id` chaining. | high |
| [roster-endpoint](roster-endpoint.md) | `GET /league/{league_id}/rosters` structure: `roster_id` vs. nullable `owner_id`, the four player-ID groupings, and the split integer/decimal `fpts` representation. | high |

_Notebook 5 (Sleeper API Integration) is in progress — 3 of 18 subjects ingested as of 2026-07-21. See `wiki/_queue_nb5a.md` for queue status._
