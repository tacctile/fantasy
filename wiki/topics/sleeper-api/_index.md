# Sleeper API

Sleeper platform integration reference: endpoint structure, rate limits, auth (none required), and data shape quirks for player identity, stats, and league data.

| Page | Description | Confidence |
| ---- | ------------ | ---------- |
| [authentication](authentication.md) | No auth/API key required for any public read endpoint; no API-level concept of a private league; no 401/403 error taxonomy; all IDs must be handled as strings; a separate undocumented GraphQL/WebSocket layer handles authenticated writes and live push. | high |
| [league-endpoint](league-endpoint.md) | `GET /league/{league_id}` structure: `settings`, `scoring_settings`, `roster_positions`, lifecycle status, dynasty `previous_league_id` chaining, and the gotcha that league renewal issues a brand-new `league_id` each season. | high |
| [roster-endpoint](roster-endpoint.md) | `GET /league/{league_id}/rosters` structure: `roster_id` vs. nullable `owner_id`, the four player-ID groupings, the split integer/decimal `fpts` representation, and deriving bench via three-way set subtraction (no bench array is returned). | high |

_Notebook 5 (Sleeper API Integration) is in progress — 3 of 18 subjects ingested as of 2026-07-17, re-ingested with a cleanly-scoped panel redo on 2026-07-21 (see `wiki/verification-cache.md` Unresolved Conflicts — resolved). `wiki/_queue_nb5b.md` is ACTIVE for subjects 5.7-5.12; note subjects 5.4-5.6 in `wiki/_queue_nb5a.md` remain PENDING._
