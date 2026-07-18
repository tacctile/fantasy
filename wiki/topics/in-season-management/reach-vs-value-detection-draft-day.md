---
title: "Reach vs. Value Detection During a Live Draft"
type: domain-knowledge
category: in-season-management
status: active
last_updated: "2026-07-18"
confidence: high
tags:
  - reach-vs-value
  - adp
  - draft-strategy
  - tier-breaks
  - positional-run
  - vbd-drafting
  - adp-divergence
related:
  - league-mechanics/average-draft-position
  - league-mechanics/adp-ecr-differential
  - league-mechanics/value-based-drafting
  - in-season-management/positional-run-detection-draft-day
---

## Summary

Reach vs. value detection is the real-time, in-draft judgment of whether a specific pick deviates meaningfully from market expectation, and — unlike a post-draft ADP audit — its output must feed the very next decision, not just grade the pick already made. Raw pick-number-minus-ADP is not a usable signal on its own: it must be normalized for draft-slot dispersion, checked against tier structure, and re-based continuously as positional runs make static pre-draft ADP stale mid-draft. The single most corroborated failure mode across independent analysis is treating a normal market-price fluctuation as a meaningful reach or value signal when it is actually noise, a stale-ADP artifact, or the mathematically correct response to a run already in progress.

## Core Knowledge

### Why raw ADP-minus-pick fails as a live signal

The naive formula — pick number minus ADP — treats every unit of draft-slot distance as equivalent everywhere on the board. It is not. A 10-pick gap in the first two rounds crosses several tier breaks and represents a large practical value difference; the same 10-pick gap in round 12 often crosses zero tier breaks and is statistical noise. A live detection system must normalize the raw gap against the player's own draft-slot dispersion (how tightly or loosely he is drafted across the sample) and against tier structure, not treat a fixed pick-count threshold as universally meaningful. This is the same non-linear-pick-value problem documented for ADP generally, applied specifically to the moment-to-moment decision rather than a post-hoc audit.

### Positional runs make static ADP stale mid-draft — the single largest live-detection blind spot

When three or four players at one position are selected in a tight sequence, every remaining player at that position has effectively moved up the board in real time, independent of any change to their pre-draft ADP. A live system that compares the next pick at that position against pre-draft ADP will flag a "reach" that is in fact the market correctly re-pricing scarcity as the tier thins. This is a structural blind spot shared by every commonly used consensus ADP source, because none of them re-derive ADP dynamically during an individual draft — they are static, pre-computed reference points. A usable live system must track recent picks at each position within the current draft and treat the reference point as a moving target, not a fixed number pulled once before the draft started.

### Tier breaks, not raw gaps, are the correct unit of analysis

If a player falls within the same value tier as the players selected immediately before and after him, no meaningful value was lost or gained regardless of the raw ADP gap — the drafter's ranking would have produced a similar outcome regardless of which player in that tier was actually selected. Conversely, a pick that appears to be only a small ADP gap but crosses a steep tier cliff (the point where projected value drops sharply between adjacent-ranked players) represents a much larger real cost or gain than the raw number suggests. Tier-break analysis is the corroborated correction to raw-gap analysis, and it is the same correction documented for post-draft ADP interpretation generally — it applies with equal or greater force in real time, because the cost of misreading a live tier cliff compounds into the rest of the draft.

### Opportunity cost is the decision-relevant quantity, not the reach/value label itself

The purpose of live reach/value detection is not to produce a grade for the pick just made — it is to inform the next decision. The decision-relevant quantity is the expected value gap between the best player available now at a position of need and the best player likely to be available at that same position by the drafter's next turn, given the current run rate at that position. A player can register as a raw-ADP "reach" and still be the correct selection if the marginal value of the remaining pool at that position is degrading faster than the apparent overpay, because waiting risks a larger loss than the reach itself. This reframes "is this a reach" into "is taking this player now better than the realistic alternative of waiting," which is the only version of the question that changes subsequent draft behavior.

### Format context changes what counts as a reach

A pick's classification depends entirely on which market it is being compared against, and importing the wrong reference market is a leading cause of false signals. Best-ball ADP rewards ceiling, ownership diversification, and stacking correlation; a pick that looks like a reach against a managed-redraft reference can be correctly priced or even a value pick against a best-ball reference, and the reverse holds equally. Dynasty and rookie ADP incorporate multi-year surplus value and shift substantially across a single offseason as landing-spot and depth-chart information resolves, so an early-summer reference point can misclassify a pick that would be fairly priced against a late-preseason reference. A live detection system must be explicitly matched to the format and time window of the draft it is being applied to.

### News latency creates transient, resolving false signals

A player affected by injury news, a depth-chart change, or a coaching change will often still carry a stale reference price for some period after the news breaks, because consensus references only update as new draft samples accumulate. Drafting that player relative to his current, still-adjusting price will look like a reach or a value pick depending on the direction of the news, when the selection is actually an efficient response to information the reference hasn't caught up to yet. This category of false signal is transient by nature — it resolves as the reference catches up — and should be treated differently from a durable, structural mispricing.

### Roster-construction feedback: what to do after a reach has already happened

Live detection is only useful if it changes behavior going forward. Once a reach has been made at a position, the corroborated guidance is to raise the internal threshold for reaching again at that same position unless a genuine tier cliff is immediately ahead — the premium has already been paid once, and compounding it without a clear cliff justification is a common overcorrection pattern. Deliberate strategic deviations (for example, systematically declining to draft a position early) generate a portfolio of apparent early-round "value" at other positions offset by apparent late-reaches at the deprioritized position; evaluating those picks in isolation, rather than as a coordinated portfolio effect, produces a misleading read on the draft as a whole.

### Stack and correlation adjustments in best ball

In best-ball and correlation-sensitive formats, a pick that pairs a quarterback with his own pass-catcher carries a positive covariance benefit that a standalone reach/value calculation does not capture — the combined ceiling of the pairing is higher than the sum of the two players' independent value, so a portion of an apparent ADP overpay on the second half of the stack is offset by the correlation benefit. Reach/value systems that evaluate every pick independently, without accounting for already-rostered correlated pieces, will systematically overstate the cost of stack-completing picks in formats where correlation is rewarded.

## Key Decisions

The platform will compute live reach/value signals against a dynamically adjusted, in-draft positional reference rather than a static pre-draft ADP number, re-weighting the reference for each position as picks accumulate within the live draft, because stale-reference false positives from positional runs are the most consistently identified failure mode of naive live detection.

The platform will present tier-break proximity alongside any raw ADP gap, and will suppress or down-weight the reach/value flag for picks that fall within the same tier as the surrounding selections, because raw pick-count gaps are corroborated to be a poor proxy for real value loss when no tier boundary is crossed.

The platform will require the drafter's active league format (best ball vs. managed redraft, standard vs. superflex/TE-premium, redraft vs. dynasty) to be set before computing any live reach/value signal, and will not present a generic, format-agnostic signal, because the same pick can be correctly classified in opposite directions depending on the reference market.

The platform will not adopt a single fixed numeric threshold (a specific pick-count or standard-deviation cutoff) as the universal reach/value boundary, because sources proposed materially different thresholds without independent corroboration on the correct value; thresholds will instead scale with draft-slot dispersion and tier proximity as described above.

The platform will surface a roster-construction follow-up prompt after a flagged reach — recommending a raised threshold for repeating a reach at the same position absent an immediate tier cliff — because sources converge that live detection is only useful when it changes the drafter's subsequent decisions, not merely when it labels the pick already made.

## Open Questions

- [ ] What is the correct decay rate for re-weighting a positional reference point as a run unfolds within a single live draft — needs empirical tuning against realized draft-room behavior.
- [ ] How much weight opponent/league-mate-specific tendencies (a known manager's historical positional preferences) should carry relative to generic format-matched ADP is raised as directionally useful but inherently subjective across sources, with no established method.
- [ ] Whether a quantifiable season-long point or win-probability cost can be attached to a given reach magnitude, versus reach/value remaining a qualitative screening signal only, is unresolved — needs backtesting against realized outcomes tied to draft-day pick data.
