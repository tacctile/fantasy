---
title: "ESPN Bye Week, IR, and Locked Lineup Quirks"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - bye-week
  - injury-status
  - roster-structure
  - endpoint-structure
  - undocumented-endpoint
related:
  - espn-api/roster-response-structure
  - espn-api/matchup-response-structure
  - espn-api/player-id-inconsistencies
---

## Summary

Three distinct systems are commonly conflated in ESPN roster/matchup data and must be modeled separately: NFL game participation and timing (bye weeks, kickoff), ESPN's own injury/IR eligibility designation, and fantasy lineup-slot placement with its lock state. Bye status is not an exposed field at all — it must be derived by cross-referencing a player's `proTeamId` against an independently-sourced NFL schedule — and lineup locking is per-player, tied to that specific player's own game kickoff, not a single league-wide weekly lock. The most consequential and best-corroborated quirk: a player placed in an IR slot is not automatically ejected when they later become IR-ineligible (e.g., upgraded to healthy) — ESPN leaves them sitting in the IR slot and instead blocks other roster transactions until the manager manually corrects the roster.

---

## Core Knowledge

### Bye Weeks Are Not a Field — They Must Be Derived

ESPN's player and roster payloads carry no `onBye` or equivalent boolean. A player's NFL team bye is determined entirely by cross-referencing that player's `proTeamId` against the NFL schedule for the current `scoringPeriodId` — this requires fetching and maintaining an independent NFL schedule mapping, not something the fantasy roster/matchup response supplies directly. A bye-week starter shows a normal `lineupSlotId` in an active slot and simply produces zero points for that period, with no flag distinguishing "started on bye" from "started, played, scored zero." Lineup-optimization or start/sit tooling that doesn't cross-reference the schedule independently will not detect bye-week starters.

Bye is not an injury state and does not affect IR eligibility on its own — a player can be simultaneously on bye and IR-eligible for unrelated reasons, and the two facts must be tracked independently.

### Injury Status and IR-Slot Eligibility Are Related but Distinct Facts

ESPN's player object carries an `injuryStatus` field using values in the general family of ACTIVE, QUESTIONABLE, DOUBTFUL, OUT, INJURY_RESERVE (or equivalent IR-designating value), and SUSPENSION-type designations. Whether a given status qualifies a player for placement in a league's IR slot is governed by league-level configuration (which statuses that specific league accepts as IR-eligible) and is not consistently or fully exposed as a clean, directly-readable eligibility flag in the API response — some leagues restrict IR eligibility to official reserve/IR-type designations only, others additionally permit OUT or DOUBTFUL. This eligibility mapping should be treated as partially reconstructed from league settings and partially opaque, not as something the platform can fully replicate from public API data alone.

### The IR-Slot-Retention Quirk — ESPN Does Not Auto-Eject

This is the single most consistently and strongly corroborated quirk across sources: once a player is placed in a league's IR slot, ESPN does not automatically move them out if their injury designation later changes to something no longer IR-eligible (e.g., upgraded from OUT to ACTIVE). The roster response continues to reflect the player sitting in the IR slot — `lineupSlotId` still shows IR — even though their current `injuryStatus` no longer qualifies. Instead of correcting this automatically, ESPN restricts the roster: further transactions (adds, certain waiver claims, and in some reports certain lineup changes) are blocked until the manager manually moves the now-ineligible player out of the IR slot.

This produces a durable state where:

$$
\text{lineupSlotId} = \text{IR} \;\neq\; \text{currently IR-eligible by injuryStatus}
$$

An integration that reads `lineupSlotId = IR` as a reliable proxy for "this player currently holds a qualifying injury designation" will be wrong for any manager who hasn't yet manually cleared a resolved IR situation — a common and expected occurrence, not a rare edge case.

### Lineup Locking Is Per-Player, Tied to That Player's Own Kickoff — Not a Single Weekly Lock

ESPN does not lock an entire team's lineup at one league-wide moment. Locking is evaluated per player, based on that specific player's NFL game's scheduled kickoff time. A player whose game has started is locked (cannot be moved between active/bench/IR slots, cannot be involved in certain transactions); a player whose game has not yet started remains movable, even if other players' games on the same roster have already begun. This means the same roster response, fetched at different points across a single Sunday's game windows, will show different players as locked versus movable within the same payload structure — there is no single "this week is now locked" signal to check.

Because game schedules include non-Sunday-afternoon slots (Thursday, international, Saturday, Monday), a model that assumes a single Sunday-afternoon lock boundary for the whole roster will be wrong for any roster containing a Thursday or Monday player.

### Three Independent Dimensions, Not One Composite State

The safest model keeps four facts about a rostered player fully separate rather than collapsing them into a single "availability" concept:

1. **Lineup slot** — where the player is currently placed (active slot, bench, or IR).
2. **Injury/status designation** — ESPN's current label for the player.
3. **IR-slot legality** — whether the current slot placement is currently valid given the current designation and league rules (these can disagree, per the retention quirk above).
4. **Lock state** — whether that specific player's own game has started, independent of the other three.

A roster can simultaneously show a player in an IR slot (fact 1), with a status that no longer qualifies for IR (fact 2), in a state ESPN currently treats as illegal for further transactions (fact 3), while that same player's game either has or hasn't started (fact 4) — all four facts are independently true and none can be inferred from another.

### Transaction Restriction Is a Roster-Level Consequence, Not a Player-Level Flag

The IR-ineligibility restriction described above manifests as a block on the manager's ability to complete other transactions (adds, some waiver claims), not as an error specifically flagging the offending player. An integration attempting to simulate or predict whether a proposed roster move will succeed needs to independently evaluate whole-roster legality (are all currently-IR-slotted players still eligible?) rather than validating only the specific move being simulated.

---

## Key Decisions

- **Decision:** The platform will derive bye-week status for every player by cross-referencing `proTeamId` against an independently maintained NFL schedule keyed by `scoringPeriodId`, and will never rely on the ESPN roster/matchup response to surface bye status directly.
  **Reasoning:** ESPN's API does not expose a bye field at all — every corroborated source agrees this must be derived — and any start/sit or lineup-quality feature that skips this cross-reference will silently miss bye-week starters, which is exactly the kind of error a fantasy decision-support tool cannot afford.
  **Rejected alternative:** Inferring bye status from a zero-point week was rejected — a player can score zero for reasons unrelated to bye (inactive, no production, game cancellation), and conflating these produces misleading "why did this happen" explanations to the user.

- **Decision:** The platform will track lineup slot, injury/status designation, and IR-slot legality as three separate fields per rostered player, and will compute IR-slot legality itself (current status vs. league's IR-eligible designation set) rather than assuming `lineupSlotId = IR` implies current eligibility.
  **Reasoning:** ESPN itself does not auto-correct this state — a player can sit in an IR slot after becoming ineligible, and the platform showing that player as "IR" without flagging the eligibility lapse would misrepresent the manager's actual constrained roster state (blocked transactions) as normal.
  **Rejected alternative:** Trusting `lineupSlotId = IR` as sufficient proof of current IR eligibility was rejected — it is the most consistently corroborated quirk across the panel, and building on this false assumption would produce roster-legality features that disagree with what ESPN itself is actually enforcing.

- **Decision:** The platform will compute lock state per player from that player's own NFL game kickoff time against an independent, authoritative NFL schedule feed, rather than relying solely on any lock-state field ESPN's response may include.
  **Reasoning:** Locking is per-player and per-game, not weekly; a model keyed to a single "week is locked" boundary will misclassify every roster containing a Thursday, Saturday, international, or Monday game player, which is common in any realistic league.
  **Rejected alternative:** Treating the entire roster/week as either fully locked or fully unlocked was rejected — it directly contradicts the well-corroborated per-player kickoff-based lock model documented across the panel.

---

## Open Questions

- [ ] Whether bench (non-starting) roster slots lock at the same per-player kickoff boundary as active slots, or follow separate/looser league-configurable rules, was not resolved to a clear majority position — a subset of panel responses describe bench-lock behavior as league-setting-dependent while others describe it as following the same universal per-player kickoff rule as active slots. Logged as an unresolved cross-model tension; the platform should verify actual bench-lock behavior against a live league response rather than assume either position.
- [ ] The exact, complete set of `injuryStatus` values ESPN accepts as IR-slot-eligible, and whether this set is fully derivable from `mSettings` or partially enforced only server-side with no exposed configuration, is not resolved with confidence — logged as needing direct verification against a live league's settings payload.
- [ ] Whether the specific transactions blocked by an IR-ineligibility roster violation (adds, waiver claims, trades, lineup changes) are consistent across all league configurations, or vary by league settings, is not corroborated with enough specificity to state definitively.
- [ ] Whether ESPN's lock-state timing has ever been observed to trigger slightly before actual scheduled kickoff (a minority-corroborated claim) is unconfirmed and should not be relied upon for time-sensitive lineup-change logic near kickoff.
