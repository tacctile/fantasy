---
title: "Consistency Score and Boom-Bust Rate — Variance Measurement and Format-Driven Preference"
type: domain-knowledge
category: in-season-management
status: active
last_updated: "2026-07-18"
confidence: medium
tags:
  - consistency-score
  - boom-bust
  - volatility
  - ceiling
  - target-share
  - snap-share
  - best-ball
  - regression
related:
  - league-mechanics/best-ball-strategy
  - in-season-management/weekly-start-sit-projections
  - league-mechanics/bust-risk-regression-modeling
---

## Summary

Consistency and boom-bust measurement is variance analysis applied to a player's weekly fantasy scoring distribution, and independent sources converge that raw standard deviation is a flawed primary tool because it penalizes valuable high-mean players for having a wide absolute point range even when their outcomes are uniformly good — a coefficient of variation (standard deviation divided by mean) or explicit floor/ceiling percentile framing is the corroborated better approach. The stronger, more durable driver of a genuine scoring floor is stable opportunity — target share, route participation, and touch share — rather than touchdown-dependent scoring, which is corroborated across sources as the primary source of spurious, unstable-looking "boom-bust" profiles that are really just touchdown variance layered on a stable underlying role. Format context is corroborated as decisive: cash-game and traditional season-long start/sit decisions should favor low-variance, high-floor players, while best-ball and tournament (GPP) formats should favor high-ceiling, high-variance players, because the payoff structure of each format rewards a fundamentally different point in the outcome distribution.

## Core Knowledge

### Raw standard deviation is a flawed primary metric; coefficient of variation and percentile framing are corroborated as superior

Sources converge that using absolute standard deviation of weekly fantasy points as a standalone consistency measure produces systematically misleading results, because it does not account for a player's scoring level — an elite, high-mean player can show a larger absolute standard deviation than a mediocre player while still being the more valuable and arguably more reliable asset in practical terms. The corroborated correction is to normalize variance against the mean (a coefficient-of-variation-style ratio) or to report explicit floor and ceiling percentiles (for example, a player's 10th- and 90th-percentile weekly scores) alongside the median, rather than reporting a single unnormalized dispersion number. No single universal numeric threshold for what counts as "consistent" versus "boom-bust" is corroborated across sources as a settled constant — proposed cutoffs vary by position and by source and should be treated as directional guidance, not fixed constants.

### Stable opportunity, not touchdown scoring, is the corroborated driver of a genuine floor

A strongly and repeatedly corroborated theme is that a player's true week-to-week reliability is driven far more by the stability of his underlying opportunity — target share, route participation, snap share, and touch volume — than by his touchdown rate or raw yardage output. Touchdown-dependent scoring is corroborated across sources as the primary source of a spuriously volatile-looking player profile: a player with a stable, high target share who simply has not scored touchdowns in a given stretch is a fundamentally different and more reliable asset than a player whose entire scoring profile depends on unpredictable big-play or goal-line touchdown variance, even if their historical weekly-scoring dispersion looks numerically similar. Consistency analysis that is built only from realized fantasy points, without separating the opportunity component from the scoring-conversion (touchdown and efficiency) component, is corroborated as a significant analytical weakness.

### Format determines whether high or low variance is the correct preference — this is not a universal good/bad axis

Sources converge strongly that "consistency" is not inherently more valuable than "boom-bust" — the correct preference is entirely dependent on the format and decision being made. In traditional season-long start/sit decisions and cash-style contest formats where a manager must clear a single opponent's or contest's line, a stable, high-floor player who reliably avoids a very low score is the corroborated better target, because the format punishes an unusably low outcome and does not reward exceeding a threshold by a wide margin. In best-ball formats (where the highest-scoring eligible lineup is automatically selected each week) and tournament/GPP-style contest formats (which require separating from a very large field), a high-ceiling, high-variance player is corroborated as the better target, because the payoff structure rewards occasional extreme outcomes far more than it punishes a low floor that will simply not be selected into that week's optimal lineup, or that only needs to occur rarely to be worthwhile against the tournament's return structure.

### Small sample size, injury-shortened data, and role changes are major, frequently underweighted confounds

Sources converge that any player's weekly-scoring-based consistency read is highly vulnerable to distortion from a small number of games, injury-shortened seasons that both create false-zero weeks and truncate the sample, and a mid-season change in role, quarterback, offensive coordinator, or team context that effectively creates two different, non-comparable scoring distributions within what looks like one player-season. A consistency or boom-bust figure calculated across a season that includes a materially different role or supporting cast in different stretches is corroborated as unreliable and potentially actively misleading unless those distinct periods are separated or the metric is recalculated on the post-change sample only.

### Positional baselines for what counts as "consistent" differ meaningfully and should not be applied uniformly

Sources converge that a fixed, cross-position variance threshold is a common and identifiable error — what counts as an acceptable level of week-to-week volatility differs meaningfully by position, driven by how touchdown-dependent that position's scoring tends to be and how concentrated its opportunity typically is. Tight ends and touchdown-dependent receivers are corroborated as structurally more volatile as a group than high-target-share possession receivers or high-volume running backs, meaning the same numeric variance figure represents a different practical reliability level depending on position, and cross-position comparison using an identical absolute threshold is corroborated as a common analytical mistake.

### Provider and platform methodologies for "consistency" are not standardized or directly comparable

Sources converge that there is no single industry-standard formula for a "consistency score" or "boom-bust rate" — providers variously use raw standard deviation, coefficient of variation, percentage of weeks above or below a fixed point threshold, percentage of weeks finishing inside a positional rank band (such as weekly top-12 or top-24), or percentile-based distribution reporting. Because these methodologies differ in what they actually measure — some capture role/opportunity stability, others capture raw scoring-output stability, and still others capture relative positional-rank stability — a "consistency" label from one source is not corroborated as directly comparable to the same label from a different source without knowing the underlying methodology.

## Key Decisions

The platform will report player variance using a normalized measure (coefficient of variation or explicit floor/ceiling percentiles) rather than raw, unnormalized standard deviation as the primary consistency signal, because sources converge that unnormalized standard deviation systematically penalizes high-scoring players and is a corroborated weaker approach.

The platform will decompose a player's scoring-variance profile into an opportunity-stability component (target share, route participation, touch share) and a scoring-conversion component (touchdown rate, big-play rate) rather than treating realized fantasy points as an undifferentiated single signal, because sources converge that opportunity stability is the more durable driver of a genuine floor and touchdown dependence is the primary source of spurious volatility.

The platform will surface variance-based guidance differently by format — favoring low-variance, high-floor players for traditional season-long start/sit and cash-style decisions, and favoring high-variance, high-ceiling players for best-ball and tournament/GPP contexts — rather than applying a single universal "prefer consistency" or "prefer upside" rule, because sources converge the correct preference is format-dependent, not absolute.

The platform will apply position-specific variance baselines rather than a single fixed numeric threshold across all positions when classifying a player as high-floor or boom-bust, because sources converge that positions differ structurally in typical touchdown dependence and opportunity concentration, making a uniform threshold misleading.

The platform will require a minimum sample size and will separate or flag periods surrounding a material role, quarterback, or coaching change before calculating a season-long consistency figure, because sources converge that small samples, injury-shortened seasons, and mid-season context changes are common and significant sources of a misleading variance read.

## Open Questions

- [ ] Whether consistency (as measured by variance metrics) is a genuinely repeatable, year-over-year player trait once role and opportunity are controlled for, or whether it is largely a lagging artifact of stable volume that itself is not durably predictable, is raised across sources without a corroborated resolution.
- [ ] What specific numeric thresholds should define "boom," "bust," and "consistent" by position and by scoring format has no corroborated, settled figure across sources — proposed cutoffs vary and should be treated as directional starting points requiring platform-specific calibration.
- [ ] Whether expected-fantasy-points-based variance (removing touchdown and efficiency luck) produces a meaningfully more predictive forward-looking consistency signal than realized-points-based variance is plausible per the corroborated opportunity-versus-conversion distinction but was not validated with a specific methodology across sources.
- [ ] How to best handle weeks with a partial-game injury exit (early removal from a game) when calculating variance metrics is raised as a real methodological problem without a corroborated standard treatment across sources.
