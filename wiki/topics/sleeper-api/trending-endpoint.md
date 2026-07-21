---
title: "Sleeper Trending Players Endpoint"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - undocumented-endpoint
  - waiver-wire
  - player-id-mapping
related:
  - sleeper-api/players-endpoint
  - sleeper-api/rate-limits
superseded_by:
---

## Summary

`GET /players/nfl/trending/{add|drop}` returns a ranked list of `player_id`/`count` pairs reflecting platform-wide roster-add or roster-drop transaction volume over a rolling window (`lookback_hours`, default 24; `limit`, default 25). The single most important structural fact is that `count` is a raw, unnormalized transaction count with no available denominator — it is not a percentage, not a rostered-rate, and not comparable across different points in the season without a self-built baseline, since Sleeper does not expose how many total leagues or eligible rosters fed into that count. Adds and drops are entirely separate, unnetted queries, and the endpoint's actual refresh cadence is undocumented, so this data is best treated as a directional, Sleeper-population-specific attention signal rather than a precise or externally comparable metric.

---

## Core Knowledge

### Request and Response Shape

The endpoint is `GET /players/nfl/trending/{type}` where `type` is either `add` or `drop`, with two optional query parameters: `lookback_hours` (defaults to 24) and `limit` (defaults to 25, controlling how many ranked results are returned). The response is a flat JSON array, ordered descending by `count`, where each element carries exactly two fields: `player_id` and `count`. There is no player name, position, team, timestamp, or window-boundary metadata in the response at all — every result must be joined back to the cached players dump to become useful, and any pipeline consuming this endpoint inherits every player-ID handling concern documented for that dump, including the fact that team defenses can appear in these results using their team-abbreviation ID rather than a numeric one.

### `count` Is a Raw, Unnormalized Number

`count` is the number of add (or drop) transactions recorded platform-wide within the lookback window — not a percentage of leagues, not a rostered-rate, and not weighted by league format, league size, or how many leagues had that player available to add in the first place. Sleeper does not expose that denominator anywhere in the public API. This means a count of several thousand in October and the same count in June do not represent comparable levels of relative interest, because the pool of active leagues and transaction volume differs enormously by time of season — any meaningful interpretation requires the caller to build their own baseline (for example, comparing a player's current count against their own trailing average, or against the top result in the same snapshot) rather than treating the raw number as portable across time or across platforms.

### Adds and Drops Are Independent, Unnetted Streams

The `add` and `drop` endpoints are queried and counted completely separately. A player experiencing high transaction churn — added and dropped repeatedly across many leagues in reaction to ambiguous news, a bye week, or a streaming-position role — can rank highly on both lists simultaneously. Sleeper does not net these for you. Any usable interest signal requires pulling both endpoints over the same window and computing the difference locally; using the `add` count in isolation risks flagging heavily-churned, low-conviction players (backup kickers, streaming defenses, speculative same-day stashes) as genuine breakouts.

### No Documented Refresh Cadence

Sleeper does not publish how frequently the underlying aggregation refreshes, what caching layer sits in front of it, or whether `count` reflects transaction creation time, processing time, or completion time. Empirically the numbers move on a scale of minutes to tens of minutes, consistent with a frequently-refreshed but not strictly real-time cache, but this is observed behavior rather than a documented contract and should not be relied upon for precise timing logic. Whether repeated actions by the same manager within the window are deduplicated is also undocumented and unconfirmed either way — treat the count as a raw event tally, not a unique-adopter count, unless a future direct test settles this.

### Population Skew Toward Dynasty and Best-Ball Behavior

Sleeper's user base skews more heavily toward dynasty, keeper, and best-ball formats relative to the more redraft-heavy populations of ESPN and Yahoo. This means trending data reflects that population: rookie stashes, handcuff speculation, and taxi-squad-relevant moves show up more prominently in Sleeper's trending lists than they would on a platform with a more casual, redraft-dominant user base. This is a real, structural bias in what the signal represents, not noise to be averaged away — a tool built for redraft decision-making that treats Sleeper trending as a neutral market signal will systematically over-weight dynasty-flavored moves.

### Streaming Positions Dominate Raw Rankings

Defense and kicker streaming generates enormous weekly churn on both the add and drop lists, particularly around the Tuesday-Wednesday waiver-processing window. A raw top-25 list in-season is frequently dominated by a handful of streamed defenses and kickers rather than skill-position signal. Any use of this endpoint for skill-position waiver targeting should filter or down-weight these positions rather than reading the raw ranked list directly.

### Truncation and Format-Skew Around `limit`

Because the endpoint returns only the top `limit` results, a player's absence from the returned list means "not in the current top set," not "zero activity" — this matters for any pipeline that tries to build a complete per-player time series rather than just reading the visible leaderboard. Format skew adds a second wrinkle: because the counts are dominated by the platform-wide population rather than any single league's context, a player who is highly relevant in a deep or specialized league (many bench spots, IDP, superflex) may show only modest global counts, while a shallow-league streamer dominates the visible list.

### Offseason Semantics Are a Different Population

Outside the regular season, the same endpoint reflects an entirely different kind of activity — dynasty and best-ball roster churn, rookie-class hype following the draft, and depth-chart news — rather than in-season waiver-wire demand. A model or heuristic calibrated on in-season count behavior will misread offseason numbers if applied without adjustment, since the underlying population of leagues generating activity has shifted even though the endpoint's shape is identical.

---

## Key Decisions

- **Decision:** The platform will always query the `add` and `drop` endpoints together over the same window and compute a net-interest signal locally (adds minus drops, or an add share of total churn) rather than using either endpoint's raw count in isolation.
  **Reasoning:** The two streams are unnetted by Sleeper and a player can rank highly on both simultaneously due to churn; using one stream alone risks surfacing heavily-churned, low-conviction players as if they were high-conviction breakouts.
  **Rejected alternative:** Using the `add` endpoint alone as a "hot waiver target" signal was rejected — it cannot distinguish genuine emerging value from streaming-position churn or speculative same-day stash-and-drop behavior.

- **Decision:** The platform will normalize every trending count against a self-built rolling baseline (the player's own trailing average, or the same-snapshot maximum) rather than treating the raw count as meaningful in isolation or comparable across different points in the season.
  **Reasoning:** Sleeper provides no denominator for the count (total eligible leagues or active-league volume), so raw magnitude is not portable across time; a locally-built baseline is the only way to convert the number into a genuinely comparable relative signal.
  **Rejected alternative:** Displaying or ranking on the raw `count` value directly to users was rejected — it would misrepresent October's much larger transaction volume as more "significant" than a proportionally similar signal earlier in the season.

- **Decision:** The platform will poll this endpoint on a fixed, moderate interval (on the order of every 15 to 60 minutes) and persist timestamped snapshots locally, rather than depending on any assumption about Sleeper's own refresh cadence.
  **Reasoning:** Sleeper documents no refresh interval or cache TTL for this endpoint, and building any time-series or momentum feature requires the platform's own historical record since Sleeper does not retain or expose trending history itself.
  **Rejected alternative:** Reading the endpoint only at the moment of a user action and treating it as always-current was rejected — without a documented refresh guarantee, a single point-in-time read cannot support any trend or momentum analysis, and Sleeper gives no way to retrieve past snapshots after the fact.

- **Decision:** The platform will down-weight or separately segment defense and kicker results when using this endpoint for skill-position waiver recommendations.
  **Reasoning:** Streaming behavior at these positions generates transaction volume disconnected from underlying talent or opportunity change, and raw rankings are corroborated to be dominated by this churn during the regular season.
  **Rejected alternative:** Treating the raw ranked list as a uniform signal across all positions was rejected — it would surface schedule-driven streaming noise as if it were equivalent in meaning to genuine skill-position opportunity signal.

---

## Open Questions

- [ ] The exact refresh cadence and caching behavior behind this endpoint is undocumented; observed behavior suggests minutes-to-tens-of-minutes freshness, but no source could confirm this as a stable guarantee rather than incidental current behavior.
- [ ] Whether repeated add/drop actions by the same manager within the lookback window are deduplicated in the `count`, or counted as separate events each time, is unconfirmed either way.
- [ ] Whether failed waiver claims (as opposed to completed free-agent adds) contribute to the `add` count is unresolved, and would materially affect interpretation of the Tuesday/Wednesday waiver-processing spike shape.
- [ ] No rigorous, published comparison exists between Sleeper trending counts and subsequent fantasy production, or between Sleeper trending and ESPN/Yahoo ownership-percentage changes for the same players — its value as anything beyond a same-platform attention/news-detection signal remains unverified.
