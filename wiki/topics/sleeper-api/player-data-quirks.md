---
title: "Sleeper Player Data Quirks: Byes, Injury Status, and Practice Squad"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: medium
tags:
  - injury-status
  - practice-participation
  - roster-structure
  - bye-week
  - endpoint-structure
  - undocumented-endpoint
related:
  - sleeper-api/players-endpoint
  - sleeper-api/roster-endpoint
  - sleeper-api/dst-and-free-agents
  - sleeper-api/matchup-endpoint
---

## Summary

`GET /players/nfl` carries no bye-week field of any kind — byes must be derived from the team schedule, never from the player object. Availability is governed by two separate fields that are routinely conflated: `status` (a roster-level classification such as Active, Injured Reserve, Practice Squad, PUP, or Suspended) and `injury_status` (a weekly game-availability designation such as Questionable, Doubtful, or Out), and the two can disagree or update on different schedules. Sleeper's documented behavior retains an injury designation through a player's bye week rather than clearing it, and Sleeper's own fantasy IR-slot eligibility is a platform-specific interpretation of these fields that must never be conflated with an actual NFL injured-reserve transaction. Confidence here is medium rather than high: Sleeper publishes no data dictionary for this territory, so almost everything beyond the field names themselves is corroborated community-observed behavior rather than documented contract.

---

## Core Knowledge

### No Bye-Week Field — Byes Must Be Derived From the Schedule

The single most common false assumption about Sleeper's player data is that it carries a bye-week field. It does not. `/players/nfl` object fields cover identity, team, position, and status — there is no `bye_week` attribute anywhere in the payload, and this was independently confirmed across the large majority of sources consulted for this page, with no source providing a verifiable, corroborated counter-example. Bye week is correctly modeled as a property of the NFL team schedule for the season, not a property of the player, and must be computed by joining the player's current `team` against schedule data sourced elsewhere (an external schedule feed, or Sleeper's own undocumented projections/schedule context). A player-level bye value is especially vulnerable to going stale after a trade, release, or signing — deriving it fresh from current team plus schedule at read time, rather than caching a bye value on the player record, avoids that entire class of staleness bug.

One reviewed response claimed the player object contains "a college and sometimes a hardcoded `bye_week` field" that fails to update reliably around trades. This claim is rejected here: it was not corroborated by any other source, directly contradicts the strong majority position that no such field exists at all, and is treated as a single-model fabrication risk rather than a genuine platform quirk. It is logged in `wiki/verification-cache.md` as a resolved contradiction.

### Two Separate Fields: Roster `status` vs. Game-Week `injury_status`

Player availability is governed by two independent fields that different responses converged on describing the same way, and that are a well-corroborated, common source of integration bugs when conflated:

- **`status`** is a broad roster/NFL-standing classification — values observed include Active, Inactive, Injured Reserve, Physically Unable to Perform (PUP), Non-Football Injury (NFI), Practice Squad, and Suspended.
- **`injury_status`** is a narrower, weekly game-availability designation — values observed include Questionable, Doubtful, Out, and designation-style tags for IR, PUP, and (as a legacy value from the COVID-19 era) a COVID-specific tag.

These fields are not guaranteed to move in lockstep. A player can show a roster `status` of Injured Reserve while `injury_status` is null or stale, particularly in the window immediately following a transaction — because once a player is formally on IR, there is no longer a weekly game-designation being generated for a game he is not eligible to play in, so `injury_status` legitimately does not need to carry fresh information. The reverse pattern also occurs: a fresh weekly `injury_status` of Out can be posted before the corresponding `status` transaction (an official IR move) has been fully processed and reflected. Any availability logic that reads only one of these two fields will misclassify players in exactly these transition windows — the recommended pattern is to require both fields be read together and to treat disagreement between them as a signal to defer to whichever reading is more conservative for the lineup-lock decision at hand, rather than picking one field as universally authoritative.

### Bye-Week Injury-Designation Retention

Sleeper's own support-facing documentation states a specific, non-obvious behavior: if a player carries an injury designation into a week where his team is on bye, Sleeper retains that designation through the bye week rather than clearing it, since no new official game-week injury report is generated for a team that isn't playing. This is corroborated across multiple independently-reviewed sources as documented Sleeper behavior, not merely community speculation, making it one of the higher-confidence specific claims on this page. The practical consequence is that a designation observed during a bye week is not necessarily a fresh assessment — it may be several weeks stale, carried forward purely because no superseding report has been generated. Any system modeling injury recency needs to account for team bye-week context rather than treating every observed `injury_status` as equally current; a bye-week Out tag observed today could reflect an assessment from the player's last active game week.

One reviewed source additionally specified that this retention behavior was introduced as a rule change before a particular past season. That specific dating detail is not independently corroborated elsewhere and is treated as lower-confidence — the retention behavior itself is well-supported, but its exact introduction date is not verified here and is logged as an open question.

### Weekly Reset and Practical Consequences for Roster Locks

Game-week `injury_status` designations are tied to that week's official injury report cycle and are described as resetting around the middle of the following calendar week (early in the new NFL week) unless superseded by a fresh designation, a new IR/Suspended-style `status` change, or the bye-week retention behavior described above. The practical failure pattern this produces: a manager who stashes a player expecting continued IR-slot eligibility can find the designation has cleared and the player is no longer IR-eligible under the league's settings, even though nothing has functionally changed about the player's real-world availability yet — the official weekly report simply hasn't been re-issued. This is intended platform behavior tracking the official NFL injury-report cadence, not a data error, but it is a frequent source of user confusion and should be treated as expected, schedulable behavior in any feature that surfaces IR-eligibility to users.

### Sleeper Fantasy IR Eligibility Is Not the Same as NFL Injured Reserve

This is the most consequential semantic trap in this entire subject area, and it was corroborated across effectively every source reviewed. Actual NFL injured reserve is a real roster-transaction list maintained by NFL teams. Sleeper's fantasy IR-slot eligibility is a separate, platform-specific concept: a league setting determines which `injury_status`/`status` designations are permitted to occupy that league's IR-style roster slots, and PUP designations in particular are corroborated as automatically IR-slot-eligible on Sleeper regardless of whether the player is on the NFL's own PUP list in the strict sense. Consequences that follow directly from this distinction:

- "Eligible for a Sleeper IR slot" does not imply "on the NFL's injured reserve list."
- "On the NFL's actual injured reserve list" should never be inferred solely from a generic `injury_status` designation — the platform-facing designation and the underlying NFL transaction are related but not identical concepts.
- A player can be fantasy-IR-eligible on Sleeper while never having been placed on the NFL's actual injured-reserve list, purely because the league's settings permit a broader set of designations into IR slots than the strict NFL definition would allow.
- Because eligible-designation sets are a league setting, not a platform-wide constant, hardcoding a fixed list of "IR-eligible" designations against Sleeper's global behavior is fragile — the effective set can vary by league configuration.

Any feature enforcing or displaying IR-slot legality should model this as Sleeper-specific platform logic layered on top of `status`/`injury_status`, informed by the specific league's settings — not as a proxy for genuine NFL transactional status. Any feature attempting real football-operations analysis (return timelines, genuine injury severity) needs a dedicated, better-documented data source; Sleeper's fields answer "what does this platform currently permit," not "what is this player's actual medical status."

### Practice Squad Is a `status` Value, Not a Dedicated Flag — and Elevations Are Effectively Invisible

Practice-squad membership has no dedicated boolean field anywhere in the players dump. It is represented purely as one possible value of the general `status` field, alongside Active, Inactive, and the various reserve-list designations. This has a direct, corroborated consequence for game-day roster mechanics: a practice-squad player elevated for a single game (a routine, common NFL transaction, typically processed on a Saturday) is not reliably reflected as a distinct state anywhere in the player object — elevation is a transactional, same-day event, and the daily-cadence player dump has no mechanism to represent "elevated for this game only" as opposed to the player's steady-state Practice Squad classification. A tool that filters "ineligible for consideration" purely off a `status` of Practice Squad risks incorrectly excluding a player who is, in fact, active and eligible to play that week. This is flagged at moderate rather than high confidence: it follows from the structural absence of an elevation field combined with the daily-refresh cadence described on `sleeper-api/players-endpoint`, rather than from a directly documented Sleeper statement, and should be verified against a live payload during an active game week before being relied upon in production logic.

### Team Defenses Sidestep Most of This Complexity

Team defenses (see `sleeper-api/dst-and-free-agents` for the full identity model) carry no `injury_status` and no meaningful bye-week ambiguity in the same sense individual players do — a defense's bye maps directly and unambiguously to its team's single bye week on the schedule, with no player-level staleness risk to account for. Logic built to handle the quirks described on this page should explicitly branch around defense-style entries rather than attempting to apply injury/bye-derivation logic uniformly across every roster slot.

### Depth Chart and Free-Agent Fields Compound the Same Problem

`depth_chart_position` and `depth_chart_order` are corroborated as frequently null or stale for practice-squad and fringe players specifically — the same population most affected by the elevation-invisibility issue above — making depth-chart fields a poor substitute signal for practice-squad or game-day-active status. Separately, a `null` `team` field should not be read as a bye, injury, or retirement signal on its own; it more commonly reflects an unsigned free agent or a same-day transaction not yet reflected under the recommended daily refresh cadence. The full treatment of null-team ambiguity and the distinction between real-world NFL employment status and fantasy-league roster availability lives on `sleeper-api/dst-and-free-agents` and applies identically here.

---

## Key Decisions

- **Decision:** The platform will derive bye weeks exclusively from a team-and-season schedule table, resolved against the player's current team at read time, and will never read or cache a bye-week value from the player object itself.
  **Reasoning:** No bye-week field exists in `/players/nfl` at all — a majority-corroborated finding with one rejected outlier claim — and even if one existed, a player-level cached value would go stale immediately after any trade or signing.
  **Rejected alternative:** Trusting a player-object bye field was rejected outright, both because the field doesn't reliably exist and because a schedule-derived value is inherently more correct after any team change.

- **Decision:** The platform will require agreement between `status` and `injury_status` before hard-classifying a player's availability, and will default to the more conservative (more restrictive) reading when the two fields disagree, rather than treating either field alone as authoritative.
  **Reasoning:** The two fields are corroborated to update on different schedules and can legitimately disagree during transaction and reporting-cycle transition windows; picking one field as the sole source of truth produces predictable misclassifications during exactly those windows.
  **Rejected alternative:** Using `injury_status` alone (or `status` alone) as a single availability signal was rejected — both fields have documented gaps the other one covers.

- **Decision:** The platform will track Sleeper fantasy IR-slot eligibility (a platform- and league-setting-specific concept) as fully independent from real NFL injured-reserve/roster-transaction status, and will never derive one from the other.
  **Reasoning:** This distinction is corroborated as the most consequential and most commonly conflated concept in this entire subject area — Sleeper's own IR-slot eligibility rules (including automatic PUP eligibility) diverge from actual NFL transaction status by design, not by data error.
  **Rejected alternative:** Treating any generic injury designation as equivalent to "on NFL injured reserve" was rejected — it would misrepresent real football-operations status for any player whose Sleeper designation is broader than the strict NFL IR definition.

- **Decision:** The platform will timestamp every `injury_status` read and will cross-reference team bye-week context before treating a designation observed during a bye week as a fresh assessment.
  **Reasoning:** Sleeper's documented behavior retains an injury designation through a player's bye week rather than clearing it, so an unadorned designation read during a bye can be substantially stale without any indication of that staleness in the field itself.
  **Rejected alternative:** Treating every `injury_status` read as equally current regardless of bye-week context was rejected — it would systematically overstate the freshness of designations for players on bye.

- **Decision:** The platform will not infer practice-squad game-day elevation from the player object's `status` field, and will source same-day roster-eligibility changes from a fresher signal (the transactions endpoint or an external source) rather than the daily-cadence players dump.
  **Reasoning:** Elevation is a transactional, same-day event with no dedicated field anywhere in the player object, and the recommended once-daily refresh cadence structurally cannot capture a Saturday elevation ahead of a Sunday game.
  **Rejected alternative:** Excluding all Practice Squad-status players from lineup/eligibility consideration was rejected — it would systematically and incorrectly exclude legitimately game-day-active elevated players, particularly at positions prone to deep-roster churn.

---

## Open Questions

- [ ] The complete, current enumeration of `status` and `injury_status` values is not published anywhere; community-observed lists are reverse-engineered and Sleeper has added and retired values (for example, a legacy COVID-19 designation) without notice.
- [ ] The exact date or season in which bye-week injury-designation retention was introduced as platform behavior is asserted by only one reviewed source and is not independently corroborated here — the retention behavior itself is well-supported, but its origin timing is not.
- [ ] Whether practice-squad game-day elevation is reflected anywhere in the public API faster than the daily players-dump cadence (for instance, via the transactions endpoint) has not been directly verified against a live elevation event.
- [ ] The precise timing and universality of the weekly injury-designation reset (which fields it applies to, and whether it is truly consistent week to week) is described only at a general level across sources and needs direct season-long observation to bound precisely.
- [ ] A one-source claim that `/players/nfl` contains a hardcoded, unreliable `bye_week` field was evaluated and rejected in this page as an uncorroborated single-model claim contradicting the majority position — flagged here in case future direct sampling surfaces evidence either way.
