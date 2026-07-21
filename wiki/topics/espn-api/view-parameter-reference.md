---
title: "ESPN API View Parameter Reference"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - undocumented-endpoint
  - league-settings
  - roster-structure
  - rest-api
related:
  - espn-api/base-url-and-versioning
  - espn-api/roster-response-structure
  - espn-api/matchup-response-structure
  - espn-api/data-completeness
  - espn-api/draft-detail-response-structure
  - espn-api/player-endpoint-and-filtering
---

## Summary

ESPN's Fantasy API returns a minimal league shell unless `view` query parameters are appended to request specific data modules. Each view controls which top-level fields are hydrated and how deeply — `mTeam` for team/owner metadata, `mRoster` for current rosters, `mMatchup`/`mMatchupScore` for schedule and scoring, `mSettings` for league configuration, `mDraftDetail` for draft results, and `mLiveScoring` for in-progress scoring. Views are additive in that combining them adds data, but the merge is not a clean union — the same field can appear with different depth depending on which other views were requested alongside it, and an omitted view produces a silently sparse but still valid `200` response rather than an error.

---

## Core Knowledge

### Requesting Views

Multiple views are requested by repeating the query parameter: `?view=mTeam&view=mRoster&view=mMatchup`. View names are case-sensitive and must match exactly (`mRoster`, not `mroster`). There is no dedicated documentation for the complete set of valid view names — the list below reflects what is consistently corroborated across community reverse-engineering; ESPN can add, remove, or rename views without notice.

### Per-View Reference

**`mTeam`** — Team and ownership metadata: team ID, abbreviation, location/nickname, logo, owner/member references, division ID, record, standings-related fields (rank, seed), transaction counters, and points-for/points-against totals. This is season-level team state, not proof of any specific historical week's roster or lineup.

**`mRoster`** — Current roster composition for every team: a `roster.entries` array per team, where each entry links a `playerId` to a `lineupSlotId` (current lineup placement) and a `playerPoolEntry` containing the player's identity, position, eligibility, and injury metadata. Critically, this reflects the **current** roster state at request time — it is not a historical snapshot, and does not by itself reconstruct what a team's lineup looked like in a past week. See `espn-api/roster-response-structure` for full field detail.

**`mMatchup`** — The fuller schedule/box-score view: a `schedule` array where each entry represents one matchup, with `home`/`away` sides carrying team IDs, point totals, and (depending on context) roster/lineup detail for that specific matchup. Generally richer in per-player detail than `mMatchupScore`.

**`mMatchupScore`** — A lighter schedule view emphasizing score summaries — team-level point totals, live totals, and projected live totals — without the same depth of nested player-level detail as `mMatchup`. The practical boundary between these two views is not cleanly or consistently documented, and third-party wrapper libraries frequently combine both behind one method, obscuring which field originated from which view. See `espn-api/matchup-response-structure` for full field detail.

**`mSettings`** — League configuration: `rosterSettings` (including `lineupSlotCounts`, the authoritative per-league mapping of which lineup slots are actually active and how many of each), `scoringSettings` (scoring type and per-stat point values/modifiers), `scheduleSettings` (matchup period count and length, playoff structure), `draftSettings`, `waiverSettings`, and `tradeSettings`. This view is a required companion to `mRoster` and `mMatchup` for any analytical use — a raw stat line or `lineupSlotId` has no leaguespecific meaning without it.

**`mDraftDetail`** — Draft state and pick log: draft completion/in-progress status, pick sequence (round, round-pick number, overall pick number), the selecting team ID, the selected player ID, keeper flags, and auction bid amounts where applicable. Field completeness varies by draft type (snake vs. auction) and by whether the draft is in-progress, completed, or has keeper/dynasty carryover.

**`mLiveScoring`** — In-progress scoring-period data: live player stats, live applied fantasy points, and live projections, layered onto roster or matchup context during active NFL game windows. This view is volatile by design — values can change during a live window due to stat corrections, delayed feeds, or in-progress games, and it should never be treated as a source of historical/finalized truth. Outside an active game window it commonly returns empty rather than an error.

### Views Are Not a Clean Union

Requesting multiple views together does not simply concatenate independent data blocks — ESPN's backend performs a merge that can alter nesting or omit fields present under a single view requested alone. The order or combination of views in a single call is not guaranteed to be commutative or fully predictable from view names alone.

### The Silent-Sparse-Response Failure Pattern

The single most consistently reported integration failure across this API: omitting a needed view does not produce an HTTP error. It produces a valid `200` response with a JSON body that simply lacks the expected fields or nested structure. Client code that doesn't explicitly validate the presence of expected fields — checking only the HTTP status code — will silently operate on incomplete data. This is distinct from and more dangerous than an outright request failure, because nothing in the transport layer signals that anything went wrong.

### Companion Query Parameters

Several non-`view` query parameters scope the temporal slice of data returned alongside a view: `scoringPeriodId` (selects an NFL week/scoring interval — see `espn-api/matchup-response-structure` for its distinction from `matchupPeriodId`) and `matchupPeriodId` (selects a fantasy contest interval). Without an explicit `scoringPeriodId`, ESPN defaults to the current active period, which makes historical data pulls unreliable unless the parameter is always passed explicitly. Player-pool-oriented views (`kona_player_info`, referenced but not detailed here) additionally rely on an `X-Fantasy-Filter` HTTP header carrying a JSON filter payload — a separate mechanism from `view` query parameters, covered under `espn-api/base-url-and-versioning`.

---

## Key Decisions

- **Decision:** The platform's ESPN request layer will request only the specific views a given feature needs, explicitly pass `scoringPeriodId` on every historically-scoped request, and validate the presence of expected response fields rather than relying on HTTP status alone.
  **Reasoning:** The dominant, well-corroborated failure pattern in this API is a `200` response with silently missing data caused by an omitted view or an implicit "current period" default — status-code-only validation will not catch this class of bug, and requesting broad view sets "to be safe" increases payload size without eliminating the need for field validation anyway.
  **Rejected alternative:** Requesting a large fixed bundle of views on every call was rejected — it does not remove the need for explicit field validation and adds unnecessary payload weight and latency for features that only need a narrow slice of data.

- **Decision:** `mSettings` will always be fetched and cached alongside any feature that consumes `mRoster` or `mMatchup` data, and will be treated as the authoritative source for interpreting league-specific configuration (scoring weights, active lineup slots).
  **Reasoning:** Raw roster and matchup data is meaningless without league-specific scoring and slot configuration — `mSettings` changes rarely within a season (primarily at settings changes, not on every request), making it cheap to cache and treat as a required dependency rather than an optional companion view.
  **Rejected alternative:** Hardcoding a single global scoring/slot assumption and skipping `mSettings` was rejected — Nick's leagues already have differing scoring rules from each other per `MASTER_CONTEXT.md`, so no single hardcoded assumption is valid across leagues.

---

## Open Questions

- [ ] The exhaustive list of valid `view` values, including less common ones like `mScoreboard`, `mStandings`, `mBoxscore`, and `mStatus`, is not authoritatively documented — the views detailed here are the ones with strong cross-model corroboration; others exist but were not covered in this ingestion pass.
- [ ] Whether ESPN validates unrecognized `view` values server-side or silently ignores them is not confirmed with certainty — empirical observation suggests silent ignoring, but this is not a documented guarantee and could change without notice.
- [ ] The precise algebra of view-combination merging (which field wins when two views would populate the same nested path differently) remains unmapped and would require direct empirical testing against a live league.
