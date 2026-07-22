---
title: "Average Draft Position (ADP) — Market Price, Not Player Value"
type: domain-knowledge
category: league-mechanics
status: active
last_updated: "2026-07-18"
confidence: high
tags:
  - adp
  - draft-strategy
  - reach-vs-value
  - best-ball
  - dynasty
  - redraft
  - keeper
  - superflex
  - te-premium
  - ppr
related:
  - league-mechanics/adp-ecr-differential
  - league-mechanics/league-size-scarcity-effects
  - league-mechanics/best-ball-strategy
  - league-mechanics/dynasty-redraft-keeper-frameworks
  - league-mechanics/breakout-candidate-modeling
  - in-season-management/reach-vs-value-detection-draft-day
  - league-mechanics/multi-platform-adp-divergence
  - sleeper-api/projections-endpoint
---

## Summary

ADP is the mean (occasionally median) draft slot at which a player is selected across a sample of drafts — it is a market-price statistic reflecting what a specific population of drafters is willing to pay, not a projection, ranking, or value judgment. ADP is only meaningful relative to the exact population that generated it: league size, scoring format, roster construction, best-ball versus managed redraft, and the sampling time window all shift the number independently, so the same player can carry a materially different ADP across sources without any of them being "wrong." The platform must treat ADP as an opportunity-cost and availability signal — what a player will cost and whether he'll still be there later — never as a substitute for an independent valuation model.

## Core Knowledge

### ADP is a market-clearing price, not a valuation

The core calculation is a simple mean of observed pick numbers for a player across a sample of drafts, though some sources use median or a trimmed mean to reduce outlier sensitivity. What matters more than the formula is the interpretation: ADP tells you what a population of drafters actually did, not what a player is worth. A player can have a low (early) ADP and still be a poor pick if the market is overpaying, and a player can have a high (late) ADP and still be an excellent pick if the market underrates his role, health, or opportunity. Treating ADP as an implicit ranking is a well-documented category error — ADP and value are related but distinct axes, and a platform that conflates them will systematically mis-signal both reaches and values.

The average alone also conceals dispersion, which is itself informative. A player selected in a tight, narrow range (low standard deviation) reflects strong market consensus; a player selected across a wide range (high standard deviation) reflects genuine disagreement or news-driven volatility. A stable draft-planning signal requires both the mean and a dispersion measure — the mean alone cannot answer "how likely is this player to still be available at my next pick," which is the question ADP is actually useful for answering.

### ADP is population-dependent, not a universal number

ADP is only valid within the population that generated it, and every major structural variable shifts the number independently:

- **League size and roster construction** — a player's ADP in a 10-team league is not transferable to a 12-team or 14-team league without adjustment, because starting demand and replacement level differ.
- **Scoring format** — PPR, half-PPR, and standard scoring reorder pass-catching backs and possession receivers relative to volume/touchdown-dependent players; mixing samples across formats contaminates the average.
- **Superflex/2QB and TE premium** — these formats compress quarterback ADP and lift premium-scoring tight ends independent of any change in the underlying player pool; standard-format ADP cannot be imported into these formats.
- **Best ball versus managed redraft** — this is one of the most consistently corroborated divergences. Best-ball drafting rewards ceiling, spike-week probability, and roster depth because the highest-scoring lineup is auto-set weekly, while managed redraft rewards weekly startability, waiver-wire insurance, and floor. A player can be correctly drafted earlier in best ball than his managed-league value would justify, and vice versa. Best-ball ADP should never be imported unadjusted into a managed league, or the reverse.
- **Platform population** — different platforms draw from different user bases with different skill levels, defaults, and behavioral tendencies (see below), and this shifts ADP independent of format.
- **Time window** — ADP drifts substantially across an offseason. Early-summer ADP is dominated by early-adopter, often more dynasty- and rookie-hype-driven drafters; late preseason ADP reflects camp news, depth-chart resolution, and a broader, more representative drafting population. A stale sample can create the appearance of value or a reach that has already been priced away by the time of an actual draft.

### Platform and provider differences are real and structural, not noise

Multiple independent sources converge that different ADP sources are measuring genuinely different markets, not the same market with sampling error:

- **Sharper, high-stakes/best-ball markets** (repeatedly cited as more sophisticated participant pools) tend to react to news and role changes faster than broad public/casual markets, and are generally treated as a sharper price signal for players whose value is actively in flux.
- **Casual, mainstream platforms** with large user bases tend to show stronger bias toward name recognition, recent-season narrative, and default/autopick-influenced valuations — sources agree this is a mechanical artifact of default rankings and autodraft behavior rather than considered human judgment, and it systematically distorts the average for any player whose default ranking is stale or wrong.
- **Aggregated/composite ADP** (blending multiple platforms into one number) smooths out extreme values and is useful as a general-consensus reference, but actively destroys information for any specific-league decision — if a player's true ADP is materially different across the underlying sources being blended, the composite accurately describes neither sub-market. Composite ADP should be treated as a coarse reference signal, not a substitute for format- and platform-matched ADP.
- Exact platform-by-platform behavioral claims (specific named sites' internal methodology, precise day-count "lead times" on news reactions, specific weighting formulas) varied across sources without independent corroboration and are excluded from this page as unverifiable specifics — the structural pattern (sharp markets react faster; casual/autodraft-heavy markets lag and skew toward defaults) is corroborated; the precise magnitudes are not.

### Known failure patterns and pitfalls

- **Small-sample instability.** Late-round and fringe players are drafted in relatively few of the sampled drafts, so their ADP is statistically unstable — a handful of unusual selections can swing the average by a full round or more. ADP should be treated as increasingly unreliable, not increasingly precise, as it moves later in a draft.
- **Undrafted-player censoring.** Most sources calculate ADP only from drafts where the player was actually selected, excluding drafts where he went undrafted entirely. This systematically inflates (improves) the apparent ADP of fringe players relative to their true market demand, because it ignores every draft room that didn't want him at all.
- **Autodraft/default-ranking contamination.** Autopicked selections follow a platform's default rankings rather than considered human judgment. Heavy autodraft volume artificially anchors ADP toward whatever a platform's default list says, independent of actual drafter sentiment — this is a mechanical bias, not a market signal, and is most severe on platforms with weak or unreviewed default rankings.
- **News latency and staleness.** ADP is a lagging indicator by construction — it only updates as new drafts complete. A significant news event (injury, depth-chart change, suspension) can take days to fully propagate through a draft sample, meaning a player's currently-published ADP may reflect stale information. This creates transient, resolving-not-persistent gaps between "true" current value and observed ADP.
- **Non-linear pick value.** ADP treats the distance between any two adjacent picks as equivalent, but the actual value gap between picks 10 and 11 is generally much smaller than the gap between picks 14 and 15 if a tier break falls between them. Judging a selection as a "reach" or "value" purely by ADP distance, without accounting for tier structure, produces frequently wrong conclusions.
- **Format leakage.** Applying an ADP generated in one context (a different league size, scoring system, or best-ball/redraft split) to a different context is one of the most common analytical errors — the number is precise but the wrong population, which is a more dangerous failure mode than an imprecise number from the right population.

## Key Decisions

The platform will always require and display the exact format context (league size, scoring system, best-ball vs. managed redraft, superflex/TE-premium status) alongside any ADP figure, and will not present a single "generic" ADP as authoritative across contexts, because the corroborated evidence is that ADP is only valid within its generating population and cross-context use is a leading cause of valuation error.

The platform will surface dispersion (standard deviation or comparable range measure) alongside mean ADP wherever the underlying data supports it, rather than displaying the mean alone, because the mean cannot answer the availability question ADP is primarily used for, and dispersion is a corroborated, non-controversial signal across all sources.

The platform will weight recency in its ADP sampling (favoring a rolling or recency-weighted window over a flat full-offseason average) because sources consistently agree that early-offseason ADP reflects a less representative population and stale news, while late-preseason data is the most representative signal — though the platform will not adopt a specific fixed decay rate or window length as settled, since sources disagreed on the exact parameter.

The platform will not treat ADP as a valuation or ranking signal in isolation, and will pair any ADP-driven "value" or "reach" flag with a separate tier/replacement-level model before surfacing it as guidance, because conflating market price with player value is the single most consistently identified failure pattern across sources.

The platform will not adopt specific numeric claims about named platforms' internal methodology, exact news-reaction lead times, or precise behavioral bias magnitudes from any single source as settled fact, because these varied substantially across independent sources with no shared or verifiable methodology; only the directional, structurally corroborated patterns (sharp markets react faster; autodraft/default rankings mechanically bias casual-platform ADP; best ball and managed redraft are non-transferable markets) are adopted.

## Open Questions

- [ ] Whether ADP genuinely converges toward efficient pricing as an offseason progresses, or retains persistent, exploitable inefficiencies through the final pre-draft window, is unresolved across sources — needs empirical backtesting against realized season outcomes.
- [ ] The optimal recency-weighting method (rolling window length, exponential decay half-life, or flat cutoff) for ADP sampling has no consensus figure across sources — needs a platform-specific decision or empirical tuning.
- [ ] How to handle the undrafted-player censoring problem (whether to exclude undrafted instances entirely, or assign a penalty pick value to approximate true demand) is unresolved with no dominant approach identified across sources.
- [ ] Whether the platform should attempt to detect and filter autodraft-driven picks from its own ADP sampling, versus treating the mixed human/autodraft population as the relevant market to model, is an open design decision rather than a settled analytical question.
