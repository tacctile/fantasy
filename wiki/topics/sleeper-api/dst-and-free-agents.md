---
title: "Sleeper Team Defense (DST) and Free-Agent Player Representation"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - roster-structure
  - endpoint-structure
  - scoring-configuration
  - ownership-model
related:
  - sleeper-api/players-endpoint
  - sleeper-api/roster-endpoint
  - sleeper-api/league-endpoint
superseded_by:
---

## Summary

Sleeper represents team defenses as a categorically different entity from individual players inside the same players dataset — a defense's `player_id` is the team's abbreviation string (for example `"DET"`), not a numeric ID, and it carries no individual biographical fields or cross-provider external IDs at all. Free-agent status is not a field on a player object; it is two distinct, separately-computed concepts that must not be conflated — a player's real-world NFL employment status (inferred from a null `team` and the `status` field) and a player's fantasy-league availability (computed by subtracting every roster's owned players from the full player universe, since Sleeper exposes no dedicated "available players in this league" endpoint). Both distinctions have real failure modes: numeric-ID assumptions silently break on defenses, franchise relocations break historical defense joins, and a null `team` is frequently misread as retirement when it more often means practice-squad, unsigned free agent, or in-flight transaction lag.

---

## Core Knowledge

### Team Defenses Are Keyed by Team Abbreviation, Not a Player ID

A Sleeper team defense/special-teams entity has `player_id` equal to its team's abbreviation — `"SF"`, `"DET"`, `"PHI"`, and so on — appearing inline in the same roster, matchup, transaction, and draft-pick arrays as ordinary numeric-string player IDs. In the players dump itself, the DST record carries `position` and `fantasy_positions` of `"DEF"`, the team's location and name split across the name fields, and `team` equal to the same abbreviation. Critically, none of the individual-player biographical or cross-provider-ID fields apply — a defense has no birth date, no college, and none of `espn_id`/`yahoo_id`/`gsis_id`/`sportradar_id` populated, because it isn't a person. Any code path built around the assumption that every `player_id` represents an individual athlete with a resolvable external identity will fail the moment it processes a real roster, since defenses occupy ordinary starting slots exactly like any offensive or defensive player.

### Team-Abbreviation Drift Breaks Historical and Cross-Platform Joins

Because a defense's identity key is the team abbreviation itself rather than a stable, opaque ID, franchise relocations and rebrands change the key. Historical data referencing `OAK`, `SD`, or `STL` will not resolve against current-season data using `LV`, `LAC`, or `LAR` without an explicit, hand-maintained alias table covering these transitions. This is compounded by cross-provider abbreviation disagreement even in the current season — `JAX` versus `JAC`, `WAS` versus `WSH`, and `LAR` versus `LA` are common mismatches between Sleeper and other platforms. A multi-season dataset or any cross-platform DST join needs a maintained, season-aware team-abbreviation crosswalk; there is no numeric or otherwise stable identifier underneath the abbreviation to fall back on.

### DST Fantasy Scoring Must Be Computed From League Settings, Not Assumed

A defense's fantasy point value is entirely a function of the league's own `scoring_settings` — points-allowed brackets, sacks, interceptions, fumble recoveries, defensive and special-teams touchdowns, safeties, and blocked kicks are all independently configurable per league. Reconstructing or projecting DST scoring from an external stats feed requires applying the specific league's scoring configuration rather than assuming a universal formula, and definitional edge cases genuinely vary across data providers — for example, whether a pick-six thrown by the DST's own offense counts against that defense's points-allowed total is not treated identically everywhere. Any DST scoring reconstruction should be validated against at least one actual scored week in the target league before being trusted.

### Free-Agent Status Is Two Different Concepts, Not One Field

The term "free agent" conflates two independent ideas that must be tracked and computed separately. The first is real-world NFL employment status — whether a player currently holds an NFL roster spot at all — which Sleeper represents through a `null` (or otherwise unpopulated) `team` field combined with the `status` field. The second is fantasy-league availability — whether a specific Sleeper league currently has that player rostered — which has no dedicated field or endpoint anywhere in the API. A player can be an NFL free agent while still being rostered in a dynasty league, and a player can be fully NFL-employed while being a fantasy free agent in a given league simply because no manager has added him. Treating these as the same thing, or inferring league availability from the player object alone, produces incorrect results in both directions.

### League Availability Is Computed by Set Subtraction, Not Retrieved

Sleeper exposes no "list available players for this league" endpoint. Fantasy-league availability must be derived by pulling every roster's owned-players set for the league and subtracting that union from the full player universe — anyone in the global players map not present on any roster in that league is available. This computation is only as fresh as the roster data it's based on: rosters change on waiver processing (commonly overnight), so an availability list computed from a stale roster snapshot will be wrong by the time the next waiver cycle clears. The player universe side of the subtraction also needs pre-filtering before use — the full players dump includes thousands of practice-squad, retired, and long-inactive records, and taking the raw complement of "not on any roster" without first narrowing to a fantasy-relevant subset (using `fantasy_positions`, `active` status, and Sleeper's own `search_rank` relevance ordering) produces a free-agent list dominated by noise rather than genuinely actionable players.

### A Null Team Is Ambiguous — It Is Not a Reliable Retirement Signal

A `null` or absent `team` field on an individual player is commonly, and incorrectly, read as "this player has retired." In practice it covers several distinct situations: a genuinely unsigned free agent, a player between transactions during an active waiver or signing window, and — because the players dump is recommended to refresh at most daily — simple update lag behind a same-day real-world transaction. Retired players, meanwhile, are not consistently purged or distinctly flagged; some linger with a `null` team and an `"Inactive"`-style status indefinitely, while others retain stale team data. None of these states should be inferred confidently from `team` alone; `status` must be read alongside it, and even the two together do not constitute a reliable, timely transaction feed — a dedicated, fresher data source is needed for any feature that depends on knowing the moment a player's employment status actually changes.

### Practice Squad, Reserve, and Taxi Players Remain Owned

Players held on a fantasy roster's reserve or taxi-squad-style slots, and real-world practice-squad or injured-reserve players, remain owned by their roster and must not be treated as fantasy-available just because they're absent from an active starting lineup or a casual glance at "the roster." Any free-agent computation must use a roster's complete owned-players set — not merely its starters — as the basis for the subtraction described above, or reserve and taxi players will be misclassified as available when they are not.

---

## Key Decisions

- **Decision:** The platform will treat team defenses as a structurally distinct entity type from individual players throughout the data model — recognized by a team-abbreviation-style `player_id` rather than a numeric one, routed through a separate, explicitly maintained team-identity table (covering current abbreviations, cross-provider aliases, and historical relocation aliases) rather than through the individual-player crosswalk.
  **Reasoning:** Defenses carry none of the biographical or cross-provider-ID fields individual players do, and their identifier is inherently unstable across franchise relocations and rebrands in a way no individual player ID is — treating them as an ordinary player row is corroborated as the most common integration failure tied to this data.
  **Rejected alternative:** Handling defenses as an ad hoc exception only where a numeric-ID assumption happens to break was rejected — this fails on the very first real roster processed and has no natural stopping point once discovered piecemeal.

- **Decision:** The platform will compute DST fantasy scoring by applying the specific league's own `scoring_settings` at calculation time, and will validate any externally-reconstructed DST scoring against at least one actual scored week before trusting it in a live feature.
  **Reasoning:** DST scoring categories and their point values are fully league-configurable, and even the definitional edge cases (such as how a defensive-side pick-six against the DST's own offense is treated) are corroborated to vary across data providers, making an assumed universal formula unsafe.
  **Rejected alternative:** Using a single hardcoded DST scoring formula across all leagues was rejected — it would silently misstate DST value in any league whose scoring configuration diverges from that default, which is common rather than rare.

- **Decision:** The platform will track real-world NFL employment status and fantasy-league roster availability as two independent, separately computed values rather than deriving one from the other or from a single field.
  **Reasoning:** A player's `team`/`status` fields describe NFL employment, not fantasy-roster ownership, and the two are corroborated to diverge routinely (an NFL free agent can be fantasy-rostered in a dynasty league; an NFL-employed player can be a fantasy free agent); conflating them produces incorrect availability and incorrect roster-status displays in both directions.
  **Rejected alternative:** Inferring fantasy-league free-agent status directly from a null `team` field was rejected — it does not account for players who are NFL-employed but unrostered in a specific league, nor for the reverse case.

- **Decision:** The platform will compute fantasy-league availability as a set subtraction — every league roster's complete owned-players set (not merely starters) pulled fresh at decision time, subtracted from a pre-filtered, fantasy-relevant subset of the full player universe — rather than caching or inferring an availability list from stale data.
  **Reasoning:** Sleeper provides no dedicated availability endpoint, roster composition changes on a waiver cadence that makes stale snapshots wrong within a day, and reserve/taxi-held players remain owned even when absent from a starting lineup, so both the timing and the completeness of the roster-side data matter for correctness.
  **Rejected alternative:** Deriving availability from starters only, or from a periodically-cached roster snapshot without refreshing at decision time, was rejected — both would misclassify reserve/taxi players as available and would serve stale results across a waiver cycle.

- **Decision:** The platform will maintain a curated team-abbreviation-history table (covering relocations, rebrands, and known cross-provider alias mismatches) as the single reconciliation point for any historical or cross-platform defense join.
  **Reasoning:** Defense identity keys change with franchise relocation and disagree across providers even in the current season, and there is no stable identifier underneath the abbreviation to fall back on — a single maintained table is the only corroborated way to keep historical and cross-platform DST analysis correct.
  **Rejected alternative:** Handling abbreviation mismatches inline wherever a specific join fails was rejected — it does not scale across multiple providers and multiple historical relocation events, and reintroduces the same bug in every new integration point.

---

## Open Questions

- [ ] Sleeper does not publish a complete, stable enumeration of `status` field values across the full range of real-world player situations (practice squad, injured reserve, suspended, retired, exempt list), and observed values have shifted over time — treat `status` as a useful but not authoritative signal pending a documented schema.
- [ ] The precise update latency between a real-world NFL transaction (signing, release, practice-squad move) and Sleeper's `team`/`status` fields reflecting it is not documented and likely varies; no source could bound it precisely beyond the general daily-refresh cadence of the underlying players dump.
- [ ] Whether Sleeper's inclusion policy for which fringe, retired, or historical players remain in the players dump indefinitely is documented anywhere is unresolved — any "complete free-agent universe" computed from this data is bounded by that undocumented inclusion policy rather than a guaranteed completeness contract.
