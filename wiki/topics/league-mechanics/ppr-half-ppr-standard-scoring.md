---
title: "PPR / Half-PPR / Standard Scoring Impact"
type: domain-knowledge
category: league-mechanics
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - ppr
  - half-ppr
  - standard-scoring
  - target-share
  - vbd-drafting
  - value-based-drafting
  - roster-construction
related:
  - league-mechanics/te-premium-scoring
  - league-mechanics/superflex-two-qb-value-shift
  - league-mechanics/roster-construction-starting-lineups
  - league-mechanics/best-ball-strategy
---

## Summary

Point-per-reception (PPR) scoring adds a fixed point value per catch — commonly 0 (standard), 0.5 (half-PPR), or 1.0 (full PPR) — layered on top of yardage and touchdown scoring. The reception bonus rewards volume and target-earning ability independent of play efficiency, which structurally shifts value toward high-target wide receivers and pass-catching running backs relative to standard scoring. The critical analytical point, corroborated strongly across independent sources, is that the correct way to measure this shift is points gained above the position's replacement level, not raw PPR points added — because replacement-level players at reception-heavy positions also gain points under PPR, which partially offsets the apparent gain for elite players.

## Core Knowledge

**The core formula difference is a fixed bonus per reception, independent of yards or outcome.** Standard scoring typically awards points only for yardage (roughly 0.1 points per yard) and touchdowns (typically 6 points); half-PPR adds 0.5 points per reception; full PPR adds 1.0 point per reception. This means a reception for zero or even negative yardage still contributes a full bonus point in full PPR — a mechanical quirk repeatedly noted across sources as a driver of value for short-area, high-volume receivers regardless of the play's real football value.

**Value must be assessed as points above replacement, not gross points gained.** This is the single most heavily corroborated and highest-confidence principle across all sources. Because wide receivers and pass-catching running backs generally have higher reception totals than other positions, both elite players and replacement-level players at these positions gain points under PPR. The net value shift for an elite target-earner is the gap between his reception-driven point gain and the reception-driven point gain of the replacement-level player at his position and roster slot — not the total reception bonus itself.

**Target share, route participation, and catch rate are described as more predictive of PPR value than yards-per-touch or touchdown rate.** Sources converge that reception volume is driven by a chain of underlying factors — route participation, target share, team pass volume, offensive scheme, and quarterback quality — and that these are more stable, predictable inputs than touchdown rate or yards-per-target efficiency, which are higher-variance.

**Receiving value for running backs is conditional on whether the receptions are additive or substitutive.** A running back's receiving role adds fantasy value only to the extent that it represents opportunity the back would not otherwise have (designed passing-game touches, screens, checkdowns) rather than receptions that come at the direct cost of rushing volume or goal-line work. A back with heavy receiving volume but a diminished rushing/goal-line role can be a less valuable overall asset than a bell-cow rusher with modest receiving work, even in full PPR — the correct evaluation considers total opportunity (carries plus targets), not receptions in isolation.

**Running back target volume is described as materially less stable year-to-year than wide receiver target volume.** Running back receiving work is frequently tied to specific situational usage (trailing game script, third-down pass-protection trust, two-minute packages) that can shift when a coaching staff, offensive line, or game script changes, whereas wide receiver target share more often reflects a durable role. This asymmetry means receiving-back projections should carry wider uncertainty than receiving-WR projections.

**Half-PPR is a genuine intermediate format, not an arithmetic average of standard and full PPR.** Multiple sources describe half-PPR as meaningfully reception-sensitive (materially elevating high-target players relative to standard) while still preserving more of the relative value of touchdown- and yardage-driven production than full PPR does. It is not accurately modeled as "half the shift" in a linear sense because the underlying reception-volume distribution across the player pool is not symmetric.

**PPR reduces variance in weekly scoring for high-target players relative to standard scoring**, because receptions are generally more stable and predictable week-to-week than touchdowns or explosive yardage plays. This raises the floor of high-target players specifically, which is described as more consequential in head-to-head league formats (where avoiding a bad week has direct matchup value) than in pure total-points formats.

**Overvaluing "empty" reception volume is a widely corroborated failure pattern.** A player accumulating receptions on short, low-value targets (screens, checkdowns) without touchdown equity, downfield role, or strong yards-after-catch ability can be systematically overvalued by treating raw PPR point totals as equivalent to real value — particularly when that volume is a byproduct of a specific game script or coaching tendency that is not durable.

**Scoring settings beyond the reception bonus itself materially change format conclusions and must be evaluated together, not the PPR value in isolation.** Passing touchdown value (4 vs. 6 points), reception bonuses that apply differently by position, 100-yard yardage bonuses, first-down bonuses, and roster/flex structure all interact with the PPR setting to determine actual positional value — a league's scoring should be evaluated as a complete system rather than by the PPR number alone.

## Key Decisions

The platform will calculate player value in PPR-format leagues as points above the position's replacement level (given that league's actual roster/starter requirements), not as raw projected PPR points, because this is the most heavily and consistently corroborated principle across independent sources and is described as the single most common analytical error when it is not followed.

The platform will weight target share, route participation, and catch rate more heavily than yards-per-touch or touchdown rate when projecting PPR value, because reception volume is described as more stable and more mechanistically traceable to underlying role than touchdown-dependent production.

The platform will evaluate running back receiving value in the context of total opportunity (carries plus targets, including goal-line role) rather than receptions in isolation, and will apply wider uncertainty bands to running back target-share projections than to wide receiver target-share projections, because running back receiving work is described as more game-script- and coaching-decision-dependent and therefore less durable year-over-year.

The platform will treat half-PPR as its own distinct value curve requiring its own replacement-level baseline, rather than interpolating linearly between standard and full-PPR value curves, because the underlying reception distribution across the player pool does not scale linearly with the reception-bonus value.

The platform will not adopt specific numeric point-gap figures offered by individual models (for example, precise claims like "high-target WRs gain 55-70 points in full PPR relative to standard") as settled figures, because the specific numbers varied substantially across independent responses with no consistent, verifiable methodology behind them. Directional and structural guidance is adopted instead of fixed point-gap coefficients. An alternative of averaging the various numeric point-gap claims across models was considered and rejected, since averaging inconsistent, unverified figures manufactures a false sense of precision rather than a genuinely corroborated number.

## Open Questions

The precise numeric magnitude of positional value shift under each scoring variant (standard, half-PPR, full PPR) is not established with a verifiable, corroborated coefficient; models offered inconsistent specific point totals and percentage shifts, so only directional and structural guidance is adopted.

Whether full PPR overstates short-area/low-value reception volume relative to actual weekly win probability, and whether point-per-first-down scoring is a superior alternative that better isolates real offensive value from raw reception count, is raised as an open, unresolved industry debate by multiple sources but has no settled resolution.

How much of a given player's reception volume reflects durable, role-driven skill versus a manufactured artifact of game script, scheme, or a specific coaching staff's tendencies is described as a persistent, unresolved evaluation challenge, particularly for running backs and low-aDOT receivers.

Whether best-ball and tournament formats should weight reception-driven floor differently than season-long head-to-head formats (since ceiling/ceiling-week outcomes matter disproportionately in single-elimination and best-ball structures) is raised as an open, format-dependent question without a settled universal answer.
