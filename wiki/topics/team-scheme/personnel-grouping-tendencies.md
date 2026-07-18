---
title: "Personnel Grouping Tendencies (11/12/21)"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - personnel-groupings
  - depth-chart
  - offensive-scheme
  - snap-share
  - opportunity
related:
  - player-evaluation/snap-share
  - player-evaluation/goal-line-carry-share
  - team-scheme/proe
---

## Summary

Personnel grouping uses a two-digit code (running backs first, tight ends second, with wide receivers filling the remaining spots to five eligible skill players) to describe which positions are physically on the field: 11 personnel (1 RB/1 TE/3 WR) is the modern league baseline and maximizes wide receiver route participation, 12 personnel (1 RB/2 TE/2 WR) elevates a second tight end at the direct expense of the third wide receiver, and 21 personnel (2 RB/1 TE/2 WR) puts a second back on the field but frequently means a blocking specialist rather than a second fantasy-relevant rusher. Every source converges on the central mechanism: personnel grouping sets a structural floor or ceiling on which positions can possibly be involved on a given play, but it does not determine actual opportunity — route participation, target rate, and touch rate within a package must be measured separately from the raw package frequency. The dominant cross-provider disagreement is classification of hybrid and fullback-type players (a "TE" who plays as a big slot, a "RB" who is really a lead-blocking fullback), which can shift a team's reported package rate by several percentage points depending on whether a provider classifies by roster position or by actual snap-to-snap alignment.

## Core Knowledge

### Definition and Calculation

$$\text{Personnel Rate}_{p} = \frac{\text{Plays Using Package } p}{\text{Total Eligible Offensive Plays}}$$

The denominator should exclude kneel-downs, spikes, aborted snaps, and typically two-point attempts; treatment of penalty-nullified plays, sacks, and scrambles varies by provider and is a secondary but real source of cross-source variance.

For fantasy application, a personnel-conditional opportunity model is more useful than the raw rate:

$$\text{Expected Opportunity} = \sum_{p} \Pr(p) \times \text{Player Participation Rate}_{p} \times \text{Opportunity Rate}_{p}$$

This decomposition is the load-bearing idea across all sources: package frequency alone tells you almost nothing about an individual player's fantasy value without knowing (1) whether that player is actually on the field within the package, and (2) what their route or touch rate is when they are.

### What Each Package Structurally Implies

**11 personnel** is the default because it preserves three-receiver spacing while retaining a blocking/protection tight end. It raises wide receiver route participation and creates three-way target competition among the receiving corps; it does not guarantee a pass call, since many offenses run efficiently out of 11 against light boxes. Sustained high 11 usage (widely characterized as roughly 65%+ in neutral situations) is the clearest positive signal for a third wide receiver having standalone weekly value; offenses well below that threshold are structurally hostile to a stable WR3 role.

**12 personnel** puts a second tight end on the field, which can either keep the defense in its base personnel (creating a mismatch if the offense then throws) or force the defense into a heavier sub-package (opening spread-field run lanes). The second tight end may detach into the slot or perimeter, in which case the package functions closer to 11 despite the personnel label — or may function as a blocking-only sixth lineman, in which case the nominal tight end target boost never materializes. 12 personnel's value for tight end opportunity depends entirely on whether the second tight end is a genuine route participant, not on the package rate itself.

**21 personnel** puts two backs on the field, but the second back is frequently a fullback or lead-blocking specialist with minimal receiving or rushing opportunity rather than a second fantasy-relevant runner. Whether 21 personnel indicates a genuine two-back committee or a single feature back plus a blocker must be evaluated player-by-player, not inferred from the package rate alone.

### Platform and Provider Differences

- **Fullback classification is the most commonly cited discrepancy.** Some providers count a fullback as a running back for personnel notation (inflating 21/22 rates for fullback-heavy teams), while others classify the same player as a tight end unless he is explicitly aligned in the backfield on a given snap. This alone can shift a team's reported 21 personnel rate by several percentage points.
- **Nominal versus functional classification.** The two-digit code is based on roster position, not alignment. A player labeled a tight end who routinely aligns in the slot, or a running back who routinely lines up wide, produces a package label that does not match how the play actually functions. Sources agree the nominal package should be used for reproducibility, but functional alignment is necessary for correct interpretation.
- **Formation and tracking data do not map cleanly to personnel.** Providers that publish formation data (shotgun, pistol, singleback, empty) rather than personnel groupings directly cannot be used to infer 11 versus 12 without additional information, since teams increasingly run heavier personnel packages from shotgun and spread formations.
- **Treatment of penalties, sacks, scrambles, and no-huddle broadcast limitations varies**, and providers occasionally revise historical classifications after further film review, meaning historical package rates from the same provider are not perfectly stable over time.
- **The most useful public data is conditional, not aggregate.** Package frequency broken out by down, distance, field zone, and score state is materially more informative than a single season-long percentage, but not all providers publish these splits.

### Edge Cases, Failure Patterns, and Pitfalls

- **The motion loophole.** Personnel grouping is declared when the offense breaks the huddle or sets its initial formation, and the label does not update even if pre-snap motion or shifts fundamentally change who is aligned where. A team that breaks in 12 personnel and then motions a tight end into the slot while sending a receiver into the backfield is still logged as "12 personnel" despite functioning like 11 on that specific play. This is a significant and repeatedly flagged source of mismatch between the recorded package and the actual on-field structure, particularly for teams that use heavy pre-snap movement to disguise personnel.
- **Snap presence is not route participation.** A receiver or tight end can be on the field within a given package while blocking frequently, running low-value routes, or being substituted out specifically in the red zone. Package-level snap counts without route-participation data are especially misleading for tight ends, who can post a high 12-personnel snap share while functioning primarily as a sixth offensive lineman.
- **Game-script distortion.** Personnel usage shifts meaningfully with score state — teams trailing late lean far more heavily into 11 personnel than their season average, while teams protecting a lead increase heavier package usage. Season-long aggregate rates blend these states together; the standard correction across sources is to isolate first-and-second-down plays in competitive game states (commonly framed as within one score, in the first three quarters) to approximate a team's "true" personnel identity.
- **Small-sample instability, especially after a coordinator, quarterback, or personnel change.** A new offensive staff, a single unusual opponent matchup, or an in-game injury can produce a temporary personnel spike that reverses once the underlying cause resolves. Multi-game or multi-season data (with stable coaching) is preferred over any single-game or early-season sample.
- **Defensive response is part of the mechanism, not a separate variable.** The fantasy-relevant effect of an offensive package depends partly on how the defense answers it — a defense that stays in its base personnel against 12 can hand the offense a run advantage, while a defense that substitutes into nickel can create a mismatch for a detached tight end. Personnel grouping alone, without accounting for the induced defensive response, is an incomplete predictor of play outcome.
- **Empty formations and package undercounting.** True 5-receiver "00" personnel is rare; most "empty" formations are actually 11 or 12 personnel with the back and/or tight end split out wide. Providers that classify these plays as a separate "empty" category rather than their true base personnel can understate a team's actual 11/12 rates.

### Fantasy Application

The practical workflow across sources is consistent: identify package frequency (ideally conditioned on neutral game script), then determine which specific players are on the field within that package, then determine their route or touch rate once there, and only then draw a fantasy conclusion. A wide receiver's floor is strengthened by sustained high-rate 11 usage combined with full-time participation within that package and stable involvement regardless of opponent personnel or red-zone situation. A tight end's role is strengthened by high 12 usage only when paired with genuine route participation rather than blocking-only deployment. A second running back's fantasy relevance in 21 personnel depends on whether he has designed touches, motion usage, and red-zone involvement independent of game script, as opposed to functioning purely as a lead blocker.

## Key Decisions

- **Decision:** The platform will report personnel grouping rates conditioned on neutral game script (early downs, competitive score state, first three quarters) as the default view, with season-long aggregate rates available as a secondary figure.
  **Reasoning:** Every source identifies game-script-driven personnel shifts as a major distortion on raw season averages, and the neutral-script rate is repeatedly cited as the more reliable indicator of a team's true offensive identity for forward projection.
  **Rejected alternative:** Surfacing only the blended season-long rate was rejected because it conflates genuine scheme identity with score-state-driven behavior that will not recur in a different game context.

- **Decision:** The platform will pair any personnel package rate with player-level route participation or touch rate within that package, and will not present raw package frequency as a standalone opportunity signal.
  **Reasoning:** Sources converge that package frequency sets a structural ceiling, not a guarantee, on positional opportunity; without the player-level participation layer, a package rate alone cannot distinguish a genuine role from a blocking-only or decoy presence.
  **Rejected alternative:** Displaying team personnel rates as a standalone leaderboard was rejected because it would imply a direct opportunity relationship that no source supports independent of individual player role.

- **Decision:** The platform will track and disclose whether a given player's personnel classification is based on roster position or on functional alignment, particularly for fullbacks, hybrid tight ends, and receivers who split out from the backfield.
  **Reasoning:** Fullback and hybrid-player classification is documented as the largest source of cross-provider disagreement on personnel rates; making the platform's own convention explicit avoids silently producing figures that are non-comparable to other sources users may reference.
  **Rejected alternative:** Adopting an undisclosed internal classification convention was rejected for the same reason it was rejected for play-action/RPO classification — it produces platform-specific figures with no way for users to reconcile them against external sources.

## Open Questions

- How much independent predictive value does personnel grouping add once team pass rate, pace, route participation, target share, and formation are already accounted for? Sources note this is genuinely unresolved — much of the personnel signal may be redundant with more direct role measures.
- Does the causal direction run from personnel to offensive success, or from a team's available personnel (e.g., having three good receivers) to its personnel usage? This affects how confidently a personnel shift should be projected forward after a roster change, and is not resolved in available sources.
- Whether defensive adaptation (nickel defense increasingly treated as the true base personnel against modern offenses) will cap or reverse the long-running league-wide drift toward 11 personnel usage is an open and actively debated question.
- How much team-level personnel identity persists across a coordinator or quarterback change versus resetting with new offensive leadership is inconsistently described across sources and likely varies by coaching staff.
- Whether package-level efficiency (success rate within a personnel grouping) or package-level expected opportunity is the more decision-useful framing for player evaluation is not settled.

---

_End of personnel-grouping-tendencies.md_
