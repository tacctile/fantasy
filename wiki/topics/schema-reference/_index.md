# Schema Reference

This platform's own internal data model — decided, not researched. League scoping conventions, platform-agnostic player identity mapping (Sleeper-anchored), and the league configuration data model. Pages here are `decision-record` type, not `domain-knowledge`, and were produced through a dedicated decision session with Nick rather than chathub.gg panel synthesis.

| Page | Description | Confidence |
| ---- | ------------ | ---------- |
| [league-identity-and-scoping](league-identity-and-scoping.md) | Internally-generated `platform_league_uuid` as the primary key for every league record, with `previous_platform_league_uuid` threading Sleeper's per-season renewal chain while ESPN's stable `leagueId` needs no chain at all. | high |
| [player-identity-mapping](player-identity-mapping.md) | Sleeper-anchored `player_id_crosswalk` table, population priority order (Sleeper embedded fields → nflverse/DynastyProcess crosswalk → local ESPN reconciliation), and D/ST as a distinct entity type. | high |
| [league-configuration-data-model](league-configuration-data-model.md) | One `league_config` table per league storing raw provider-native scoring/roster payloads plus a small derived, platform-agnostic settings subset for day-to-day application queries. | high |

Complete — all 3 planned subjects ingested (2026-07-21).
