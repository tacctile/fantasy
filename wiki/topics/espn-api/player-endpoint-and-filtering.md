---
title: "ESPN Player Endpoint and Filtering (kona_player_info, X-Fantasy-Filter)"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - undocumented-endpoint
  - rest-api
  - player-id-mapping
  - roster-structure
related:
  - espn-api/view-parameter-reference
  - espn-api/base-url-and-versioning
  - espn-api/roster-response-structure
---

## Summary

ESPN's player-pool endpoint (`view=kona_player_info`) is queried not through URL parameters but through a required `X-Fantasy-Filter` HTTP header carrying a JSON-serialized filter object controlling status, position/slot eligibility, stat periods, sorting, and pagination. The single most important pitfall: an unrecognized, misspelled, or malformed filter key does not raise an error — it is silently ignored or falls back to a sparse default result, the same silent-failure pattern already documented for `view` parameters on this API.

---

## Core Knowledge

### The X-Fantasy-Filter Mechanism

Player-pool queries against `kona_player_info` require a JSON object serialized into the `X-Fantasy-Filter` request header — not query-string parameters. The filter is nested under a `players` key and commonly includes: `filterStatus` (roster-availability status, e.g. free agent / waivers / rostered), `filterSlotIds` (eligible lineup-slot IDs, using the same slot-ID space documented on `espn-api/roster-response-structure`), `filterIds` (explicit ESPN player IDs, for targeted lookup), fields controlling which stat periods and sources to return, one or more sort specifications, and `limit`/`offset` for pagination. This header-based approach is unique among the platforms in scope — it is a server-side query plan inferred from ESPN's own web client traffic, not a documented or versioned contract, and its exact accepted key set can change between seasons without notice.

### Player Pool Entry Structure

Each returned element is a player-pool entry, not a bare player record — it wraps player identity and biographical fields (name, `defaultPositionId`, `eligibleSlots`, pro team, injury status) together with pool/ownership-context fields (percent owned, percent started, ownership change, acquisition/roster status where applicable) and a `stats` array. The identity fields belong to the nested player object; ownership and league-pool-context fields belong to the wrapping entry — conflating the two, or assuming league-specific roster status is present outside a league-scoped request, is a documented source of error.

### Silent Filter Degradation

The single most consistently reported failure pattern for this endpoint: an invalid, misspelled, or unsupported filter key does not produce an HTTP error. The request still returns `200` with valid JSON, but the filter is silently ignored in whole or in part, commonly falling back to a small default/sparse result set. This is the same class of failure already documented for omitted `view` parameters elsewhere in this API, applied here to filter-header content rather than query parameters. Every filter's actual effect should be validated against the returned records (e.g., confirming all returned IDs match an explicit `filterIds` request, or all returned players carry the requested slot eligibility) rather than trusting the request status code alone.

### Pagination Has No Total-Count Signal

`limit` and `offset` control pagination, but the response carries no `totalCount` or `hasMore` field. The only reliable way to detect the end of a result set is that a returned page contains fewer records than the requested `limit`. Values seen for a practical `limit` ceiling before truncation or errors were inconsistent across the panel — some values differ by an order of magnitude — so no single number should be hardcoded as a safe upper bound; conservative batched pagination with explicit page-boundary detection is the reliable approach regardless of the exact ceiling.

### Position and Slot Filtering — Same Distinction as Roster Data

Filtering by `filterSlotIds` matches lineup-slot eligibility, not a player's primary position — this is the identical `lineupSlotId` / `defaultPositionId` / `eligibleSlots` distinction already established for roster data. A flex-eligible player will appear across multiple slot-filtered queries; aggregating results across separate slot-filter calls without deduplicating by player ID will double-count multi-eligible players.

### Stat Record Disambiguation

Each player's `stats` array can contain multiple records for the same player differentiated by scoring period, stat source (actual vs. projected), and split type (season-total vs. weekly) — the identical three-field disambiguation already required for roster and matchup stat records elsewhere in this API. Selecting a stat record by scoring period alone risks picking a projection when an actual result was wanted, or a season aggregate when a single week was wanted. League-specific applied fantasy-point totals returned by this endpoint reflect the scoring settings of the league context the request was made in, and should not be assumed portable across leagues with different scoring rules.

### Undocumented and Season-Unstable Filter Grammar

The complete set of valid filter keys, sortable fields, and internal numeric codes (stat source IDs, split-type IDs, slot IDs beyond the core table) is not published by ESPN and is known only through reverse engineering of its own web client. Filter keys and behaviors that work in one season have been reported to silently stop working in a subsequent season with no changelog or deprecation notice — this is consistent with the broader no-versioning-contract behavior already documented for ESPN's API as a whole.

---

## Key Decisions

- **Decision:** The platform will construct `X-Fantasy-Filter` headers as strictly validated JSON and will empirically verify a filter's actual effect against returned records rather than trusting a `200` response alone.
  **Reasoning:** Silent filter degradation — an unrecognized or malformed key being ignored rather than rejected — is the dominant, consistently corroborated failure mode for this endpoint, and is a specific instance of the same silent-sparse-response pattern already established as this API's single most common integration failure class.
  **Rejected alternative:** Trusting HTTP status code alone as confirmation a filter was applied was rejected — it is precisely the validation gap responsible for the most commonly reported production bugs against this endpoint.

- **Decision:** The platform will paginate player-pool queries with explicit, conservative page sizes and will detect the end of results by observing a short page, never by assuming a fixed total-count field or a specific maximum `limit` value.
  **Reasoning:** No `totalCount`/`hasMore` field exists in the response, and panel sources reported inconsistent practical `limit` ceilings — hardcoding any single number as safe risks either unnecessary truncation or unreliable requests depending on which figure turns out to be accurate for a given season.
  **Rejected alternative:** Fetching with a single maximally large `limit` in one request was rejected — the inconsistency in reported safe ceilings makes this brittle, and conservative batched pagination degrades gracefully regardless of the true limit.

---

## Open Questions

- [ ] The exact practical ceiling for the `limit` parameter before truncation, timeout, or error is unresolved — panel sources gave inconsistent figures differing by an order of magnitude, and no single number should be treated as authoritative without direct testing.
- [ ] The complete, exhaustive set of valid `X-Fantasy-Filter` keys and their accepted value formats is not documented and was only partially corroborated across sources — needs direct empirical verification, particularly for stat-source and split-type numeric codes, before building features that depend on less common filter combinations.
- [ ] Whether unrecognized filter keys are always silently ignored, or occasionally produce a harder failure (e.g. `400`) depending on which key is malformed, is not fully resolved — treat both outcomes as possible until directly observed.
