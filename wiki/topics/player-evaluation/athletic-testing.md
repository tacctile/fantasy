---
title: "Athletic Testing (RAS / Speed Score / Burst Score)"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - ras
  - speed-score
  - burst-score
  - ceiling
  - draft-strategy
  - landing-spot
related:
  - player-evaluation/college-dominator-breakout-age
  - player-evaluation/explosive-play-rate
---

## Summary

Relative Athletic Score (RAS), Speed Score, and Burst Score convert raw NFL Combine and Pro Day testing into position-relative composite scores intended to identify athletic outliers and physical ceiling among draft prospects. RAS (developed by Kent Lee Platte) is a broad, position-normalized composite spanning most testing drills scaled 0-10; Speed Score is a weight-adjusted 40-yard-dash formula favoring size-adjusted straight-line speed; Burst Score combines vertical and broad jump to approximate lower-body explosiveness. Every source in this synthesis converges on the same core caution: these metrics measure physical ceiling, not football skill, and should function as a tiebreaker or upside flag layered on top of draft capital and college production — never as a standalone projection tool, and never used to override production or role signals when they conflict.

## Core Knowledge

### Definition and Calculation

**Relative Athletic Score (RAS)**, created by Kent Lee Platte, aggregates a player's combine/pro-day results — typically height, weight, 40-yard dash, 10-yard split, vertical jump, broad jump, three-cone drill, and short shuttle — into position-normalized percentile scores, which are then combined into a single composite scaled from 0.00 to 10.00. Each individual metric is scored relative to the historical distribution of players tested at that position, meaning RAS answers "how does this player's testing compare to every other player at his position who has been tested," not an absolute athleticism measure. A player missing multiple testing components may not receive a complete score, and Platte's database classifies players by official combine/listed position, which can create distortion for players who change position between college and the NFL.

**Speed Score**, most commonly associated with the PlayerProfiler formulation (with roots in earlier Football Outsiders research), adjusts 40-yard dash time for body weight:

$$\text{Speed Score} = \frac{\text{Weight} \times 200}{(\text{40-Yard Dash Time})^4}$$

The formula rewards players who run fast at heavier weights on the reasoning that mass-adjusted speed is rarer and more functionally valuable than raw speed alone — a heavier player running a given time scores higher than a lighter player running the same time. The fourth-power exponent in the denominator means small differences in 40 time have an outsized effect on the resulting score, which also means timing imprecision (hand-timed vs. electronic, Pro Day vs. Combine) is magnified in the final figure.

**Burst Score** combines vertical jump and broad jump to approximate lower-body explosiveness. The exact combination formula (a raw sum, a weighted sum, or a normalized/percentile composite of the two) varies by provider and is not standardized; conceptually it is intended to capture horizontal and vertical explosive power as a proxy for acceleration and change-of-direction ability, though jump tests do not directly measure football-specific first-step quickness from a football stance.

These three metrics answer different questions and are correlated but not redundant: RAS asks how unusual the athlete's *overall* tested profile is for the position; Speed Score asks how fast the athlete is *relative to body weight*; Burst Score asks how *explosive* the athlete is in jump-based testing specifically.

### Platform and Provider Differences

- **RAS** is authoritatively maintained by Kent Lee Platte's own database (the original source of the metric), which includes historical data reaching back years before modern combine record-keeping where available, flags Pro Day-sourced data distinctly from Combine data, and applies a documented (if not universally agreed-upon) adjustment for hand-timed versus electronic timing.
- **Speed Score and Burst Score** are most commonly encountered through PlayerProfiler and similar fantasy-analytics-oriented platforms; their published values and exact scaling conventions should not be assumed to map directly onto RAS's 0-10 percentile scale, since underlying methodology differs by provider.
- **PFF** maintains its own proprietary athleticism composite distinct from RAS, generally normalized only against a more recent window of draft classes (rather than the full historical database RAS draws on), which makes PFF's version less suited to cross-era comparison but potentially more representative of the current athletic baseline at each position.
- **NFL Next Gen Stats** does not publish a composite athletic testing score; its athletic-relevant public data is largely limited to 40-yard dash figures and in-game GPS-derived "top speed," which measures game speed under football conditions rather than a controlled testing environment — a meaningfully different signal from combine speed.

The most consequential and universally acknowledged source of provider disagreement is **Pro Day versus Combine data handling**. Pro Day testing environments (different track surfaces, timing systems, wind conditions, and the absence of independent verification present at the Combine) systematically produce faster 40 times and better jump results than the Combine for the same player. Sources differ on whether to include Pro Day data at all, whether to apply a standardized time penalty when doing so, and how large that penalty should be — meaning a player who tested only at a Pro Day (skipping the Combine) can show a materially inflated RAS or Speed Score relative to a Combine-tested peer, purely as a function of data source rather than actual ability.

### Edge Cases, Failure Patterns, and Pitfalls

- **Athletic testing measures physical ceiling, not football skill.** A strong test profile supports plausible recovery speed, explosive release potential, and vertical-route or run-after-catch upside — it does not establish route-running precision, release technique, tracking and hands, processing speed, or the ability to translate raw traits into live-game production. This distinction is the single most repeated caution across all sources.
- **Pro Day inflation is real, well-documented, and inconsistently corrected.** As noted above, Pro Day results run systematically faster/better than Combine results for the same athlete, and the standard correction applied (when applied at all) is often a flat adjustment rather than one calibrated to the actual magnitude of inflation, which likely varies by testing venue and possibly by position.
- **Position reclassification distorts RAS.** Because RAS compares an athlete against a historical positional database, a player whose testing position differs from either his college role or his eventual NFL role (a hybrid safety/linebacker, a college quarterback projected as a receiver, a tweener tight end) can see his score swing substantially depending on which comparison group is used.
- **Speed Score's weight-adjustment can overvalue mass at some positions.** The formula's underlying logic (heavier-and-fast is rarer and more valuable) was developed with running backs in mind, where added mass plausibly translates to functional between-the-tackles power; for wide receivers, the relationship between weight and on-field performance is weaker and less linear, and the formula may overrate heavier receivers while underrating lighter, quicker ones whose value comes from short-area quickness rather than mass-adjusted straight-line speed.
- **Jump-based Burst Score is confounded by technique and training environment.** Vertical and broad jump technique is coachable, and players from programs with more sophisticated strength and conditioning infrastructure may test better on jump-based drills independent of underlying explosive ability, meaning Burst Score partially reflects training environment rather than pure physical trait.
- **Testing context (injury, weight manipulation) is not captured by the raw score.** A player testing shortly after an injury, or one who has manipulated his weigh-in weight relative to his likely playing weight, receives the same nominal score as a fully healthy, playing-weight-accurate peer — no major public source systematically tracks or adjusts for testing conditions.
- **Draft-capital double-counting.** Because NFL evaluators already incorporate athletic testing into the draft-capital decision itself, naively adding a raw athletic score as an independent input to a projection model that also includes draft capital risks double-counting the same underlying signal rather than adding new information.

### Best-Use Context by Position and Signal Type

Multiple sources converge on athletic testing being **most useful as an early-career signal that decays over time** — testing thresholds appear more associated with early (rookie/Year 1-2) production than with long-term outcomes, where role, scheme fit, and skill development come to dominate. There is also convergence that the metric's value is **position- and role-dependent**: an inline-blocking tight end prospect and a detached receiving tight end prospect should not be evaluated against the same athletic profile expectations, and a boundary receiver's ideal testing profile differs from a slot receiver's. Speed Score is generally treated as most relevant for running backs specifically (its original design context), with more limited standalone value for wide receivers, where RAS or the individual component scores (agility, burst) may carry more position-relevant signal.

## Key Decisions

- **Decision:** The platform will treat athletic testing scores (RAS, Speed Score, Burst Score) as tiebreaker and upside-flag inputs, subordinate to draft capital and college production in any prospect ranking or projection.
  **Reasoning:** Convergent guidance across all sources places athletic testing below production and draft capital in projection value, and treating it as a primary ranking input risks double-counting information draft capital already reflects.
  **Rejected alternative:** Weighting athletic testing equally with production and draft capital was rejected because no source in this synthesis supports that weighting, and doing so would overvalue physical outliers who have not demonstrated translatable football skill.

- **Decision:** The platform will flag whether a displayed testing figure derives from Combine or Pro Day data, and will not present Pro Day-only figures with the same confidence weighting as Combine-verified figures without disclosure.
  **Reasoning:** Pro Day inflation is a universally acknowledged and unresolved data-quality issue; presenting both data sources identically without disclosure would mislead users comparing players across different testing venues.
  **Rejected alternative:** Excluding Pro Day data entirely was rejected because many prospects (particularly those who skip the Combine due to injury or scheduling) would have no athletic testing data at all under that policy, which is a worse outcome than flagged, lower-confidence inclusion.

- **Decision:** The platform will contextualize athletic testing scores by projected NFL role (e.g., inline vs. detached tight end, boundary vs. slot receiver) rather than presenting a single undifferentiated score against the full positional population.
  **Reasoning:** Sources converge on athletic testing's value being highly role-dependent; a single score compared only against the broad positional population obscures whether the specific traits tested are the ones that matter for the player's likely usage.
  **Rejected alternative:** Presenting only the broad positional RAS/Speed/Burst scores without role context was rejected because it would treat all players at a position as interchangeable in terms of which athletic traits matter, which is inconsistent with how the underlying research describes the metric's actual value.

## Open Questions

- How much incremental predictive value does athletic testing add once draft capital and college production are already accounted for, given that draft capital itself substantially incorporates the same athletic information NFL evaluators observed? This attribution/double-counting question is not resolved in current public research.
- Is in-game GPS-derived "top speed" (from Next Gen Stats tracking) a better predictor of NFL production than Combine 40-yard dash time, given that it reflects speed under actual football conditions rather than a controlled sprint? Public data on this comparison remains limited.
- What is the correct, standardized magnitude for the Pro Day-to-Combine time adjustment, and does it vary meaningfully by position or by individual testing venue? No peer-reviewed standard exists.
- Should athletic testing scores be adjusted for player age at the time of testing, given that younger declared players may not have reached full physical maturity and could test below their eventual NFL-arrival ceiling? No validated adjustment formula has been published.
- Is athletic testing becoming less predictive over time as NFL offenses increasingly emphasize scheme-created separation and quick-processing routes over raw physical mismatch — and if so, does this trend differ by position (e.g., holding more for tight ends, where athletic mismatch remains a more direct weapon, than for receivers)?

---

_End of athletic-testing.md_
