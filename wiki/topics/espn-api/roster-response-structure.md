---
title: "ESPN Roster Response Structure (mRoster)"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - roster-structure
  - endpoint-structure
  - league-settings
  - undocumented-endpoint
  - player-id-mapping
related:
  - espn-api/view-parameter-reference
  - espn-api/matchup-response-structure
  - espn-api/base-url-and-versioning
  - espn-api/player-endpoint-and-filtering
  - espn-api/historical-season-access
  - espn-api/player-id-inconsistencies
  - espn-api/team-owner-member-id-structure
  - espn-api/bye-ir-and-lineup-lock-quirks
---

## Summary

The `mRoster` view returns each team's current roster as an `entries` array, where each entry links a player to a `lineupSlotId` — the player's current placement (starter slot, bench, or IR), which must not be confused with the player's natural/default position or with the full set of slots the player is eligible for. A well-corroborated standard slot-ID table exists (0=QB, 2=RB, 4=WR, 6=TE, 16=D/ST, 17=K, 20=Bench, 21=IR, 23=FLEX), but a specific league's actual active slot configuration must be verified against that league's `mSettings.rosterSettings.lineupSlotCounts` rather than assumed from the global table alone, since custom leagues configure different slot subsets and counts.

---

## Core Knowledge

### Response Shape

Under `mRoster`, each team object in the `teams` array gains a `roster` object containing an `entries` array. Each entry represents one occupied roster position and carries, at minimum: `playerId`, `lineupSlotId`, acquisition metadata (`acquisitionType` — e.g. `DRAFT`, `ADD`, `TRADE` — and `acquisitionDate`), and a `playerPoolEntry` object nesting the actual player data (identity, position, eligibility, injury status, and stat records).

### Three Distinct Positional Concepts — Do Not Conflate

This is the single most repeated pitfall across every source on this subject:

1. **`lineupSlotId`** — where the player is *currently placed* on the roster (their assigned slot for lineup purposes: a specific starter slot, bench, or IR). This is the only field that answers "is this player starting, and where."
2. **`defaultPositionId`** (on the nested player object) — the player's natural/primary football position (e.g., running back), which does not change based on where they're currently slotted.
3. **`eligibleSlots`** (on the nested player object) — the full array of every `lineupSlotId` the player is legally allowed to occupy in this league, given position and league rules.

A running back started in a FLEX slot has `lineupSlotId` = FLEX, `defaultPositionId` = RB, and `eligibleSlots` including RB, FLEX, Bench, and IR (if injury-eligible) — all three fields are simultaneously true and none of them substitutes for another. Determining whether a player is "starting" requires checking `lineupSlotId` against the league's active (non-bench, non-reserve) slot set — not checking whether their natural position happens to match a starting requirement.

### Standard Lineup Slot ID Mapping

The following mapping has strong, consistent cross-source corroboration for standard redraft football leagues:

| `lineupSlotId` | Slot |
|---:|---|
| 0 | QB |
| 2 | RB |
| 4 | WR |
| 6 | TE |
| 16 | D/ST |
| 17 | K |
| 20 | Bench (BE) |
| 21 | IR |
| 23 | FLEX (RB/WR/TE) |

Beyond this core set, additional slot IDs exist for less common configurations (superflex/offensive-player slots, individual-defensive-player slots, punter, head coach, and various flex sub-types like RB/WR or WR/TE), but their exact numeric IDs and semantics are less consistently corroborated across sources — some IDs in this range are contested or described as "reserved/unlabeled" by multiple sources. Treat any slot ID outside the core table above as needing per-league verification rather than assumed from a fixed global reference, particularly for IDP, superflex, and other custom league formats.

### mSettings Is the Authoritative Source for a League's Actual Slots

`mSettings.rosterSettings.lineupSlotCounts` is a per-slot-ID count map showing exactly which lineup slots a specific league has configured and how many of each. This is the correct way to determine a league's actual starting lineup structure and roster size — the global slot-ID table above tells you what a given ID *means* if it appears, but not which IDs a specific league actually uses or how many. A league's active (scoring) slot set should be derived from this settings data, not assumed from the standard table alone, since custom leagues can add, remove, or resize slots.

One source diverged from this guidance, recommending hardcoding the standard slot mapping and explicitly avoiding derivation from `mSettings`. This is a minority position against a well-corroborated majority and is not adopted here — see Open Questions.

### Player Stat Records Inside Roster Entries

The nested player object's `stats` array is not a single clean weekly line — it can contain multiple records for the same player distinguished by `statSourceId` (commonly: actual vs. projected) and `statSplitTypeId` (commonly: season-total vs. weekly split), in addition to `scoringPeriodId`. Selecting a stat record by matching only `scoringPeriodId` risks picking a projection instead of an actual result, or a season-total instead of a weekly value. All three discriminating fields should be checked together before using a stat record.

### mRoster Reflects Current State, Not History

A critical caveat: `mRoster` returns the roster as it exists **at the time of the request** — it is not a historical snapshot. Using a current `mRoster` response to determine who was on a team's roster or in their starting lineup during a past week is unreliable, since trades, waiver moves, drops, and lineup changes since that week will have altered the current state. Historical lineup reconstruction requires the roster/lineup data embedded in matchup-period-scoped responses (see `espn-api/matchup-response-structure`) rather than a fresh `mRoster` call.

---

## Key Decisions

- **Decision:** The platform will model a rostered player using three separate fields — current lineup slot, default position, and eligible-slots array — and will never derive "is this player starting" from default position alone.
  **Reasoning:** Conflating these three concepts is the most frequently repeated integration bug reported across every source consulted; a player's default position is a static attribute while their lineup slot changes weekly, and only the lineup slot determines scoring/starting status for a given period.
  **Rejected alternative:** Using a simplified single `position` field that collapses slot and default position was rejected — it is lossy in exactly the cases (FLEX, superflex, bench-vs-IR) that matter most for accurate lineup and scoring analysis.

- **Decision:** The platform will derive each league's active lineup slot set from that league's `mSettings.rosterSettings.lineupSlotCounts` at ingestion time, rather than hardcoding a single global slot table, consistent with `MASTER_CONTEXT.md`'s requirement that `league_config` store roster and scoring rules as data rather than hardcoded application assumptions.
  **Reasoning:** Nick's leagues have differing scoring and structural rules from each other; a hardcoded slot assumption would silently misclassify starters/bench in any league using a non-standard configuration (extra flex slots, IDP, superflex), and this directly conflicts with the platform's existing schema requirement to treat league configuration as data.
  **Rejected alternative:** Hardcoding the standard slot table globally (as one panel source recommended) was rejected — it directly contradicts the platform's `league_config` schema rule and would break silently for any of Nick's leagues using non-standard roster construction.

---

## Open Questions

- [ ] One source explicitly recommended hardcoding the standard slot-ID mapping and avoiding derivation from `mSettings`, diverging from the majority position adopted here (mSettings as authoritative). This is logged as an unresolved single-source disagreement rather than silently discarded — see the verification cache.
- [ ] The exact numeric IDs and semantics for less-common slots (superflex/offensive-player, individual-defensive-player variants, punter, head coach, taxi/rookie-designated slots) are inconsistently corroborated across sources and were not resolved to high confidence in this ingestion pass — treat any such slot ID as requiring direct verification against a live league's `mSettings` response before relying on it.
- [ ] Whether `statSourceId` and `statSplitTypeId` numeric values are stable across seasons, and their complete enumerated meaning, is not fully documented — needs direct empirical verification.
