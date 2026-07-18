---
title: "Weighted Opportunity Rating (WOPR)"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - wopr
  - target-share
  - air-yards
related:
  - player-evaluation/target-share
  - player-evaluation/air-yards-share
  - player-evaluation/red-zone-target-share
  - player-evaluation/goal-line-carry-share
---

## Summary

Weighted Opportunity Rating (WOPR) is a composite metric, originated by analyst Josh Hermsmeyer, that combines target share and air yards share into a single opportunity score: WOPR = 1.5 × target share + 0.7 × air yards share. It blends the stability and floor of raw target volume with the ceiling and depth signal of downfield usage, and is treated as a stronger single-number predictor of future fantasy production than either component alone. A WOPR of 0.60 or higher marks elite, top-tier receiver usage; 0.50+ indicates a reliable, high-volume starter.

---

## Core Knowledge

### Formula and Design Logic

WOPR is calculated as 1.5 times target share plus 0.7 times air yards share, typically expressed as a decimal (e.g., 0.65). Target share is weighted more than twice as heavily as air yards share because raw target volume is the more stable, higher-floor driver of fantasy production, while air yards share contributes upside and depth signal without dominating the score. This 1.5/0.7 pairing is the canonical, dominant formula across independent sources and is the formula this platform uses. A single alternate weighting (0.75 target share / 0.25 air yards share, attributed to one specific platform) has been reported in isolation but was not independently corroborated across a larger cross-check of sources; it is treated as unverified rather than as a legitimate competing standard, consistent with the general rule that single-source specific claims require independent confirmation before being trusted. Some sources separately note that platforms may apply small format-specific adjustments (e.g., weighting target share slightly higher for full-PPR formats), which is a distinct claim from the alternate-coefficient-pair claim above.

The design intent is that target share and air yards share each capture a different, incomplete dimension of receiver opportunity — one measures how often a player is involved, the other measures how valuable that involvement is downfield — and that combining them into one score outperforms using either individually for projecting fantasy output.

### Elite and Starter Thresholds

A WOPR of 0.60 or higher is the accepted benchmark for elite, top-tier wide receiver usage; some sources place the true "alpha" threshold closer to 0.70+. A WOPR around 0.50 indicates a solid, reliable high-volume starter. These thresholds carry medium corroboration across independent sources.

### Known Pitfalls and Failure Patterns

**Archetype distortion.** WOPR can produce identical scores for two very different receiver profiles — for example, a high-target-share/low-air-yards short-area possession receiver versus a low-target-share/high-air-yards boom-or-bust deep threat. These two players carry very different weekly floors and ceilings despite an equivalent composite score, so WOPR should never be used without also examining its two underlying components separately. Concretely: a pure deep threat with a 12% target share but a 35% air yards share produces a WOPR of roughly 0.43 (1.5×0.12 + 0.7×0.35); a possession slot receiver with a 22% target share but only a 15% air yards share produces a nearly identical WOPR of roughly 0.44 (1.5×0.22 + 0.7×0.15). These two composite scores are effectively the same number describing a low-floor/high-ceiling boom-bust asset and a high-floor/low-ceiling volume asset — proof that the raw composite alone provides no archetype discrimination.

**Red-zone blind spot.** WOPR does not account for target location relative to the goal line. A target inside the 5-yard line carries materially higher expected fantasy value (particularly in touchdown-driven scoring) than a target of equivalent air yards at midfield, but standard WOPR weights them identically based purely on depth. Red-zone target share should be tracked as a separate, complementary signal.

**Small-sample skew.** Because WOPR inherits the volatility of air yards share, a single fluky long target early in a season or short sample can spike a player's air yards share — and therefore their WOPR — creating a false signal of sustained offensive priority. WOPR computed on small samples should be treated with the same caution as its air yards share input.

**Denominator inheritance.** WOPR is exposed to the same charting-methodology noise as its two inputs. If either target share or air yards share is affected by differences in how a data source defines its denominator, that noise propagates directly into the composite score.

**No absolute-volume scaling.** Two players with identical WOPR on offenses with very different total pass attempts (e.g., 30 attempts per game versus 45) will produce materially different raw fantasy output, because WOPR is a share-based metric and does not scale for the underlying volume of the offense it's calculated from. This is addressable by converting the share-based score into an absolute figure — sometimes called "Weighted Opportunity Points" — by multiplying a player's WOPR (or normalized WOPR, scaled 0–1) by the team's projected pass attempts for the relevant period. This produces a projected-volume figure that is directly comparable across players on different offenses, rather than comparing two percentages that mean different things in different offensive environments.

### Use Case: Buy-Low and Regression Identification

WOPR's primary practical application is identifying players whose underlying opportunity (as captured by the composite) exceeds their recent fantasy production — flagging positive-regression or buy-low candidates. A player sustaining a high WOPR (above roughly 0.60) despite disappointing recent output is more likely, on the strength of the underlying opportunity metric, to see production correct upward than a player whose good recent output isn't backed by comparable opportunity.

---

## Key Decisions

- **Decision:** The platform will surface WOPR alongside its two component metrics (target share and air yards share) rather than as a standalone number.
  **Reasoning:** WOPR's archetype-distortion pitfall means the composite alone can mask materially different risk/reward profiles; showing the components lets users distinguish a high-floor possession profile from a high-ceiling deep-threat profile that share the same composite score.
  **Rejected alternative:** Displaying only the composite WOPR score on player cards was rejected because it would present two very different player types as equivalent assets.

- **Decision:** The platform will use the standard fixed coefficients (1.5 × target share + 0.7 × air yards share) rather than inventing custom weights.
  **Reasoning:** No source provides a rigorously re-validated alternative weighting, and fabricating custom coefficients without empirical backing would introduce unfounded precision; the standard formula is the only version with cross-source corroboration.
  **Rejected alternative:** Deriving platform-specific coefficients from the platform's own historical data was deferred, not rejected outright — this should be revisited once the platform has sufficient historical performance data to backtest against, per the Open Questions below.

- **Decision:** The platform will pair WOPR with red-zone target share as a separate, adjacent metric rather than folding red-zone data into WOPR itself.
  **Reasoning:** WOPR's red-zone blind spot is a known, structural limitation of the formula; adding red-zone context as a separate signal preserves the formula's cross-source validity while covering its known gap.
  **Rejected alternative:** Modifying the WOPR formula to incorporate red-zone weighting was rejected because it would produce a non-standard metric no longer comparable to the widely understood public version.

---

## Open Questions

- [ ] Are the fixed 1.5/0.7 coefficients still optimal given the modern NFL's shift toward shorter, higher-percentage passing games and RPO usage? — needs the platform's own backtesting once sufficient historical data is available; sources disagree without resolution.
- [ ] Should the platform develop a modernized or format-specific (PPR vs. standard vs. TE-premium) WOPR variant? — needs a product decision informed by backtested predictive performance, not available from current sources.
- [ ] What is WOPR's actual year-over-year correlation with fantasy points on this platform's specific scoring settings? — needs internal validation once player data pipeline is built; existing sources report inconsistent correlation estimates without a settled figure.
