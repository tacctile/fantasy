---
title: "Bust Risk Modeling — Touchdown Regression and Unsustainable Efficiency"
type: domain-knowledge
category: league-mechanics
status: active
last_updated: "2026-07-18"
confidence: high
tags:
  - bust-risk
  - regression
  - fpoe
  - xfp
  - catch-rate
  - red-zone
  - game-script
  - epa
  - target-share
  - regression-baseline
related:
  - league-mechanics/breakout-candidate-modeling
  - league-mechanics/value-based-drafting
  - league-mechanics/waiver-wire-faab-strategy
  - league-mechanics/dynasty-redraft-keeper-frameworks
---

## Summary

Bust risk modeling identifies players whose current fantasy production is inflated relative to the sustainable opportunity and efficiency that generated it, with touchdown-rate overperformance as the single strongest and most consistently corroborated regression signal across all six independently sampled models. The core mechanic is comparing actual fantasy output against an opportunity-based expected output (expected fantasy points, expected touchdowns) and flagging players whose actual production exceeds that baseline by a wide margin. The most important corroborated nuance, repeated across multiple sources, is that elite players and players on strong offenses regress toward their own established baseline or their team's baseline rather than toward a generic league-average rate — applying league-wide regression thresholds uniformly to every player is a documented modeling error.

## Core Knowledge

### Touchdown-rate overperformance is the strongest and most agreed-upon regression signal

Every source in the panel identifies touchdown regression as the most reliable and highest-confidence bust signal, more reliable than catch-rate or yardage-efficiency regression. The underlying mechanic compares actual touchdowns to an expected-touchdowns baseline derived from opportunity type and location (carry location, target depth, red-zone/goal-line share), and flags large positive residuals as high regression risk. Multiple sources provide illustrative league-average touchdown-conversion baselines — rushing touchdowns roughly once per 15-to-20 carries league-wide, receiving touchdowns roughly once per 8-to-14 targets depending on position and target depth — but these figures vary meaningfully by source and should be treated as illustrative ranges rather than settled constants; only the directional mechanism (compare actual to opportunity-implied expected, flag large positive gaps) is strongly corroborated, not the precise numeric baselines.

### The single most important corroborated nuance: elite players and strong offenses regress toward their own baseline, not the league baseline

Multiple independent sources explicitly warn that applying a uniform league-average touchdown or efficiency baseline to every player systematically over-flags players on elite offenses and elite individual talents as bust candidates when they are not. The corrected approach, repeated across sources: regress a player's rate toward his own established multi-season baseline, or toward his specific team's offensive scoring environment, rather than toward the generic league mean. A player on a top-tier scoring offense should sustain a higher touchdown rate than league average without that representing unsustainable luck, and an established elite performer's "true" efficiency baseline sits meaningfully above a replacement-level player's baseline. Sources explicitly name this as a common practical modeling failure — treating an entire elite offense's skill-position group as uniformly "due for regression" using undifferentiated league-wide thresholds.

### Catch-rate and yards-after-catch regression require conditioning on target difficulty, not raw rate comparison

Sources converge that raw catch-rate thresholds (for example, flagging any receiver above roughly 70-75% catch rate) are unreliable without first conditioning on target depth, target type, and route role. A high catch rate driven by shallow, schemed, high-percentage targets (common for slot receivers, running backs on check-downs, and possession tight ends) is structurally different from — and far more sustainable than — a high catch rate on contested, high-difficulty, or deep targets. The corroborated best practice is to compare observed catch rate against an expected catch rate conditioned on target depth and difficulty, rather than against a single positional threshold applied uniformly.

### Volume growth can mask or offset genuine rate regression, and models must track total expected points, not rate alone

A specific, well-corroborated failure pattern: a player's touchdown rate or efficiency rate can decline exactly as regression models predict, while his total fantasy output simultaneously rises because his underlying volume (carries, targets, routes) increased enough to offset the rate decline. Models that flag regression using rate metrics alone, without simultaneously checking for a volume increase, will incorrectly label a player who is actually improving in expected total value as a bust candidate. The correct check computes total expected fantasy points (opportunity multiplied by expected rate), not the rate in isolation.

### Game-script and role-portability risk is a distinct, moderate-confidence regression vector separate from touchdown or efficiency regression

Multiple sources identify game-script dependence — production concentrated in blowout wins (favorable, run-heavy positive scripts) or large deficits (pass-heavy negative scripts) — as a real but comparatively lower-confidence regression signal than touchdown-rate overperformance. The mechanism: if a player's role is not durable across neutral game situations, a shift in team competitiveness (the team becoming more or less competitive than the prior sample) can suppress his role independent of any change in individual talent or efficiency. Sources recommend weighting production in close, neutral-script games more heavily than production concentrated in lopsided scripts when assessing role durability, though the precise weighting scheme is not corroborated to a specific formula.

## Key Decisions

The platform will build touchdown regression around a player-specific and team-specific expected baseline rather than a single uniform league-average rate, because multiple independent sources explicitly identify uniform league-average regression thresholds as a documented source of false-positive bust flags for elite players and players on strong offenses.

The platform will condition catch-rate regression analysis on target depth and target difficulty rather than comparing raw catch-rate percentages against a flat positional threshold, because sources converge that unconditioned catch-rate thresholds fail to distinguish sustainable short-area/scheme-driven efficiency from genuinely unsustainable high-difficulty conversion rates.

The platform will always compute total expected fantasy points (opportunity times expected rate) rather than flagging regression from rate metrics in isolation, because a documented failure pattern is mistaking a rate decline offset by volume growth for a genuine production decline, when total expected value may actually be rising.

The platform will treat touchdown-rate overperformance as the highest-confidence bust signal in the ranking hierarchy, with catch-rate/target-difficulty regression as secondary and game-script/role-durability as a tertiary, lower-confidence modifier, because this ordering reflects the panel's consistent confidence ranking across sources.

The platform will incorporate injury-status context (soft-tissue injuries, limited practice participation) as an explanatory variable that can pause or discount regression flags, because a documented false-positive pattern is attributing a health-driven efficiency dip to statistical regression when the underlying cause is an undisclosed or minor injury that resolves on its own.

The platform will not build a single, universally applied numeric regression threshold (such as a fixed touchdown-rate cutoff) as the sole bust-detection mechanism, because sources provide meaningfully different illustrative baseline figures and agree only on the directional mechanism, not on precise league-wide constants.

## Open Questions

- [ ] The precise numeric touchdown-conversion baselines by position and opportunity type (carries inside the 5-yard line, targets in the end zone, etc.) vary across sources and are not corroborated to a single settled figure — needs platform-specific empirical derivation from play-by-play data rather than adoption of any single source's stated constants.
- [ ] Whether elite players possess genuine, repeatable touchdown-conversion skill beyond what opportunity and team context explain, or whether all apparent "skill" in touchdown conversion is fully explained by role and team quality, is explicitly flagged as unresolved and contested across sources.
- [ ] The optimal look-back window for regression calculations (a rolling 3-week window versus a longer trailing window with recency weighting) has no corroborated standard — sources note this is an open design choice with a real detection-speed-versus-false-positive tradeoff.
- [ ] How to handle regression modeling across a mid-season coaching or coordinator change, which alters the underlying data-generating process mid-stream, is explicitly named as an unresolved methodological gap with no accepted approach across sources.
- [ ] The extent to which opponent (defensive) strength should shift the timing of when a regression signal is expected to manifest is raised as an open question by one source and not corroborated elsewhere — treat as a single-source hypothesis pending further verification.
