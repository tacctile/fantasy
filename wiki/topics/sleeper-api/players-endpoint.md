---
title: "Sleeper Players Dump and Canonical Player ID"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - player-id-mapping
  - caching-strategy
  - endpoint-structure
  - undocumented-endpoint
related:
  - sleeper-api/roster-endpoint
  - sleeper-api/draft-endpoint
  - sleeper-api/transactions-endpoint
  - sleeper-api/rate-limits
  - sleeper-api/player-id-crosswalk
  - sleeper-api/trending-endpoint
  - sleeper-api/dst-and-free-agents
---

## Summary

`GET /players/nfl` returns a single large JSON object — a map keyed by Sleeper `player_id`, not an array — covering every player Sleeper tracks: active, inactive, practice squad, and long-retired. Sleeper's own guidance is to fetch this at most once per day and serve it from local storage (see `sleeper-api/rate-limits`). The canonical ID scheme has exactly one universally corroborated quirk that every integration must handle from day one: individual players use numeric-string IDs, but team defenses use the team's abbreviation as their `player_id` (for example `"DET"`) — every single source consulted for this page independently confirmed this same fact. The dump also carries a cross-provider ID crosswalk (`espn_id`, `yahoo_id`, `sportradar_id`, `gsis_id`, and others), but coverage of those fields is uneven and should be reconciled through a maintained community crosswalk rather than trusted alone.

---

## Core Knowledge

### Response Shape and Fetch Cadence

The endpoint returns one JSON object whose top-level keys are Sleeper `player_id` strings and whose values are per-player metadata records. This is the only way to resolve the bare ID strings that appear throughout the rest of the API — rosters, matchups, transactions, and draft picks all reference players purely by these IDs, never by an embedded name or team. The payload is large (Sleeper's own documentation cites roughly 5MB; real-world reports describe it as having grown larger over time as the tracked player pool has expanded past roughly 11,000 entries including inactive and historical players). Sleeper's explicit, consistently stated guidance across every source is to fetch this endpoint at most once per day and cache it locally rather than calling it inline with user requests — see `sleeper-api/rate-limits` for the operational consequences of not doing so.

### Canonical Player ID Scheme

Individual players are keyed by a Sleeper-assigned numeric string (for example, a four- or five-digit string), assigned roughly sequentially as a player enters Sleeper's system, so ID magnitude loosely clusters by draft-class vintage. These numeric IDs are stable for the life of a player — there is no corroborated evidence of Sleeper ever reassigning or recycling an individual player's ID to a different person, and this stability is the entire foundation dynasty and keeper tooling relies on for long-horizon player tracking.

Team defenses are the one universal, unanimous exception: a team defense's `player_id` is the team's abbreviation string itself (for example `"DET"`, `"KC"`, `"SF"`), not a numeric-style ID. Every response consulted for this page independently identified this same fact with no dissent, making it the single best-corroborated claim in the entire subject. Any code path that assumes `player_id` values are uniformly numeric-looking strings will break the first time it processes a real roster, since defenses occupy ordinary starting slots on rosters and matchups exactly like any offensive or defensive player. The full treatment of defense representation, franchise-relocation abbreviation drift, and how league-level free-agent availability is derived lives in `sleeper-api/dst-and-free-agents`.

### Field Inventory

Field presence is uneven across records — treat every field beyond `player_id` as potentially absent, especially for inactive, historical, or deep practice-squad players. Commonly present fields include: `first_name`, `last_name`, `full_name` (frequently absent or unreliable for defenses); `position` (primary position) and `fantasy_positions` (an array — a player can be fantasy-eligible at more than one position simultaneously); `team` (the current NFL team abbreviation, `null` for a free agent); `status` (roster status such as Active, Inactive, Injured Reserve, or Practice Squad) and `injury_status` (a separate field for the official injury-report designation); `age`, `height`, `weight`, `college`, `years_exp`, and `birth_date`; `number` (jersey number); `depth_chart_position` and `depth_chart_order`; `search_full_name` (a lowercased, punctuation-stripped normalization of the player's name that Sleeper uses internally for search, and the best available field for any fuzzy name-based lookup); and `search_rank` (Sleeper's internal relevance/display ordering — low values for actively relevant fantasy players, very high sentinel-style values for deep or inactive entries). This is Sleeper's own internal ordering signal, not a talent or value metric, and it is not a documented, stable contract.

The dump also carries a block of cross-provider identifier fields: `espn_id`, `yahoo_id`, `sportradar_id`, `gsis_id` (the NFL's official Game Statistics and Information System ID — the standard join key into nflverse/nflfastR play-by-play data), `stats_id`, `rotowire_id`, `rotoworld_id`, `fantasy_data_id`, and `swish_id`, with additional fields observed to appear over time without notice. Any of these can be `null`, absent, or represented inconsistently (`null` versus an empty string versus a missing key entirely) for a given player — never assume completeness, and normalize all three absence forms to a single null representation at ingestion. The full join hierarchy, the PFR gap in this field set, and the community crosswalk used to close it are covered in `sleeper-api/player-id-crosswalk`.

### Cross-Provider ID Coverage Is Uneven — Use a Maintained Crosswalk

The cross-provider ID block is the dump's most valuable feature for connecting Sleeper data to outside analytics sources, but coverage is genuinely uneven rather than complete. `sportradar_id` and `gsis_id` tend to have the best coverage for active players but real gaps for practice-squad players, older retirees, and — most importantly for an in-season product — recently drafted rookies, who commonly lack a `gsis_id` until they appear in official game data for the first time. Community-maintained crosswalk resources (most notably the nflverse ecosystem's player ID mapping, which itself incorporates Sleeper IDs alongside GSIS, ESPN, Yahoo, and other provider IDs, cross-validated against multiple sources) are the standard reconciliation path for filling these gaps, and are corroborated as more reliable than trusting Sleeper's embedded external-ID fields alone. Build any cross-provider join through a maintained crosswalk table backfilled from such a resource, using Sleeper's own embedded IDs as a secondary validation signal rather than the sole source of truth.

### Name-Based Joins Are a Reliable Source of Silent Corruption

Multiple active NFL players share full names, and suffixes, punctuation, diacritics, and abbreviated first names all add further ambiguity. Joining players across data sources on name alone is a well-corroborated, common failure pattern — it produces silent misattribution, not an error, which makes it especially dangerous. `player_id` (or a validated external ID reached through a maintained crosswalk) should be the join key everywhere; `search_full_name` combined with team and position is an acceptable fallback only when no ID-based join is available, and even then it should be treated as lower-confidence and flagged for review rather than accepted silently.

### The Dump Is a Broad Reference Snapshot, Not a Live Status Feed

The dump intentionally includes players well beyond current fantasy relevance — free agents, practice-squad players, long-inactive veterans, and historical entries retained so that old rosters, drafts, and transactions still resolve correctly. Filtering to "currently fantasy-relevant" requires combining `status`, `team`, `fantasy_positions`, and `search_rank` together; no single field does this alone. Separately, because the dump is refreshed at most daily under recommended usage, its `team`, `status`, and `injury_status` fields can lag real-world roster moves and official injury reports by up to a day. `team` being `null` does not mean retired — it commonly means free agent, practice-squad cut, or holdout — and `status: "Active"` can lag an actual transaction by hours. Any feature making time-sensitive lineup, waiver, or injury-aware decisions needs a fresher signal than this daily-cadence dump can provide; the dump is correctly used as the identity and reference layer underneath those decisions, not as the decision signal itself.

### No Delta Feed — Local Diffing Is the Only History Mechanism

There is no "changes since" or delta endpoint. A caller re-pulls the entire dump and must diff it locally against the previous day's snapshot to detect meaningful changes (team moves, status flips, new players entering the pool). This is not purely a limitation — daily local diffing is also the only available mechanism for building any longitudinal history of a player's team, status, or depth-chart movement, since Sleeper itself does not expose or retain that history anywhere in the live API.

### Field-Schema Drift

The exact field inventory is not formally published or versioned, and new fields (additional cross-provider IDs, betting-related identifiers, and similar) have been observed to appear over time without a changelog or migration notice. A strict, hard-coded parser that rejects unrecognized fields will break the first time Sleeper adds one; ingestion should be permissive, preserving unrecognized fields rather than discarding or erroring on them, consistent with how the platform already treats Sleeper's other under-documented objects (see `sleeper-api/league-endpoint`'s handling of `settings` and `scoring_settings`).

---

## Key Decisions

- **Decision:** The platform will fetch the full players dump on a scheduled daily job — never per-request or per-user-action — store it keyed by string `player_id` in the platform's own database, and resolve all player-ID lookups against that local copy.
  **Reasoning:** This matches Sleeper's own explicit, consistently stated guidance, avoids the most commonly cited real-world cause of rate-limit problems (see `sleeper-api/rate-limits`), and is appropriate given the payload changes on at most a daily cadence.
  **Rejected alternative:** Fetching the dump on demand when an unrecognized `player_id` is encountered was rejected — it reintroduces per-request dependency on a large, slow external call for data that is trivially cacheable and explicitly meant to be cached.

- **Decision:** The platform will treat `player_id` as an opaque string everywhere in the schema with no numeric coercion, and will maintain an explicit team-defense identity table so that abbreviation-style IDs are recognized and routed through defense-specific handling wherever player IDs are parsed, stored, or displayed.
  **Reasoning:** Every source consulted independently and unanimously confirmed that team defenses use team abbreviations rather than numeric-style IDs; this is the single most consequential and best-corroborated integration detail for this endpoint, and it is consistent with the platform's existing decision to never numerically coerce Sleeper IDs elsewhere (see `sleeper-api/authentication` and `sleeper-api/roster-endpoint`).
  **Rejected alternative:** Assuming all `player_id` values are numeric-style and handling defenses as an ad hoc exception wherever a lookup happens to break was rejected — it is the most commonly reported integration bug tied to this endpoint and would fail on the very first real roster processed.

- **Decision:** The platform will never join players across data sources on name alone, and will build an explicit crosswalk table keyed on Sleeper `player_id`, backfilled against a maintained community crosswalk resource (such as the nflverse player ID mapping) to fill gaps in Sleeper's own embedded cross-provider IDs — particularly for recently drafted rookies.
  **Reasoning:** Name collisions, suffixes, and punctuation variants make name-based joins an unreliable, silently corrupting join key; Sleeper's own embedded external-ID coverage has real, corroborated gaps, especially early in a rookie's career, and maintained crosswalks are corroborated as the standard way to fill exactly that gap.
  **Rejected alternative:** Relying solely on Sleeper's embedded external-ID fields for cross-provider joins was rejected — null coverage on those fields, concentrated precisely among new draft classes, would silently drop or misjoin players at the moments (season start, new rookie classes) when correct joins matter most.

- **Decision:** The platform will not treat the players dump's `status`, `injury_status`, or `team` fields as the authoritative source for time-sensitive lineup, waiver, or injury-aware decisions, and will source any near-real-time roster or injury signal from a fresher path than this daily-cadence dump.
  **Reasoning:** Under recommended once-daily fetch cadence, these fields can lag real-world transactions and official injury reports by up to a day; a feature built on this endpoint alone for live decisions would act on stale information at exactly the moments accuracy matters most.
  **Rejected alternative:** Treating the daily dump as sufficient for injury-aware lineup recommendations was rejected — staleness on precisely the fields that drive that use case would produce recommendations based on outdated status.

- **Decision:** The platform will retain daily snapshots of the players dump (or at minimum a structured diff log of team, status, and depth-chart changes) rather than overwriting its local player table in place on every refresh.
  **Reasoning:** Sleeper provides no delta or history endpoint for this data, so the platform's own daily snapshots are the only mechanism available for reconstructing what was known about a player at any past point in time — information with real value for historical lineup, transaction, and role-change analysis elsewhere on the platform.
  **Rejected alternative:** Overwriting the local player table in place on every daily refresh with no retained history was rejected — it would make it impossible to reconstruct past player state, which other planned platform features already depend on being able to do.

---

## Open Questions

- [ ] Does Sleeper ever reuse or merge a `player_id` — for example, correcting a duplicate identity created in error — or are individual numeric IDs guaranteed permanent for the life of the player? — no source provides direct evidence of reuse, but none confirms a formal permanence guarantee either; treat as durably stable absent contrary evidence.
- [ ] What is the current, complete field inventory and exact payload size at any given moment, given that fields are added without notice and size has grown over time? — needs verification against a fresh pull rather than trusting any static list, including this page's.
- [ ] Are `search_rank` sentinel values and general semantics stable over multiple seasons, or has Sleeper changed their meaning or scale? — used safely today as a rough relevance filter, but it is an internal, undocumented signal with no stability contract.
- [ ] How long, in practice, does it take newly drafted rookies and undrafted free agents to receive complete metadata — particularly `gsis_id` and other cross-provider IDs — after entering the player pool? — no source gives a precise bound; needs direct observation across a draft cycle.
