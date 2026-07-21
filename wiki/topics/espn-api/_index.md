# ESPN API

ESPN platform integration reference: undocumented view parameters, cookie-based auth (espn_s2, SWID), rate limits, and endpoint structure for rosters, draft state, standings, and matchups.

| Page | Description | Confidence |
| ---- | ------------ | ---------- |
| [authentication](authentication.md) | Cookie-based auth model (SWID/espn_s2), origin, public/private league distinction, extraction procedure, and validation-driven refresh strategy. | high |
| [format-requirements](format-requirements.md) | Cookie header construction, SWID brace and espn_s2 encoding pitfalls, client-interface differences, supplementary headers. | high |
| [data-completeness](data-completeness.md) | Public vs. private league data parity, view-parameter-dependence, and the specific resources withheld from every caller regardless of authentication. | high |
| [base-url-and-versioning](base-url-and-versioning.md) | v3 base URL structure, path component semantics, the view-parameter system, X-Fantasy-Filter header, and the historical-season endpoint split. | high |
| [view-parameter-reference](view-parameter-reference.md) | Per-view field reference (mTeam, mRoster, mMatchup, mMatchupScore, mSettings, mDraftDetail, mLiveScoring), non-additive view merging, and the silent-sparse-response failure pattern. | high |
| [roster-response-structure](roster-response-structure.md) | mRoster response shape, lineupSlotId vs. defaultPositionId vs. eligibleSlots, standard slot-ID table, and mSettings as the authoritative per-league slot source. | high |
| [matchup-response-structure](matchup-response-structure.md) | mMatchup/mMatchupScore response shape, scoringPeriodId vs. matchupPeriodId, multi-week playoff summation pitfall, and score reconciliation guidance. | high |
| [draft-detail-response-structure](draft-detail-response-structure.md) | mDraftDetail response shape, why explicit pick fields (not snake-order reconstruction) are the source of truth, keeper-flag vs. keeper-cost-rule distinction, and auction bidAmount ambiguity. | high |
| [player-endpoint-and-filtering](player-endpoint-and-filtering.md) | kona_player_info and the X-Fantasy-Filter header, silent filter degradation, pagination without a total-count field, and slot/stat disambiguation. | high |
| [historical-season-access](historical-season-access.md) | leagueHistory endpoint, the array-response pitfall, reduced historical view support, and team/owner identity instability across seasons. | high |
| [team-owner-member-id-structure](team-owner-member-id-structure.md) | Three-layer identity model (teamId/memberId/leagueId), owners[]/primaryOwner join mechanics, co-ownership, and team-continuity-vs-owner-continuity. | high |
| [player-id-inconsistencies](player-id-inconsistencies.md) | Proprietary playerId as a non-portable key, D/ST id-vs-proTeamId distinction, name-matching fragility, and rookie/offseason id timing gaps. | high |
| [rate-limits-and-blocking](rate-limits-and-blocking.md) | No published quota, multi-layered enforcement, silent-degradation failure pattern, retry-storm anti-pattern, and caching as the most reliable mitigation. | medium |
