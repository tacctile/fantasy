---
title: "Expected Fantasy Points (xFP)"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - xfp
  - expected-value
  - opportunity
  - regression-baseline
related:
  - player-evaluation/fantasy-points-over-expected
  - player-evaluation/value-over-replacement
  - player-evaluation/target-share
  - player-evaluation/air-yards-share
  - player-evaluation/red-zone-target-share
---

## Summary

Expected Fantasy Points (xFP) is a model-derived estimate of how many fantasy points a player should score given their observed opportunity profile, calculated as a probability-weighted sum of outcomes (receptions, rushing yards, touchdowns) conditional on targets, carries, field position, and down-distance. Unlike FPOE (which measures efficiency divergence), xFP is a pure opportunity metric—it answers "how valuable was this player's role?" rather than "how well did they execute it?" High xFP provides a strong floor estimate and regression baseline; comparing actual points to xFP identifies overperformers (regression candidates) and underperformers (buy-low targets).

---

## Core Knowledge

### What xFP Measures

xFP is a conditional expectation function:

$$\text{xFP} = E[\text{Fantasy Points} \mid \text{Opportunity Profile}]$$

For each touch or target, the model estimates:
- Probability of a completion (for targets)
- Expected yards conditional on the outcome
- Probability of a touchdown
- Probability of other scoring events (two-point conversions, bonuses)

The model then sums expected points across all opportunities. A simplified formulation for a single target:

$$\text{xFP}_{\text{target}} = P(\text{catch}) \times \text{yards}_{\text{expected}} + P(\text{TD}) \times 6$$

For a carry:

$$\text{xFP}_{\text{carry}} = \text{yards}_{\text{expected}} + P(\text{TD}) \times 6$$

Aggregated over a week or season:

$$\text{xFP}_{\text{player}} = \sum_i \text{xFP}_i$$

### Opportunity Quality vs. Opportunity Quantity

The critical distinction in xFP methodology: does the model weight all targets and carries equally, or does it condition on quality indicators?

- **Quality-blind models** assign league-average expected value to every target (e.g., 0.8 PPR points per target) and every carry (e.g., 0.4 PPR points per carry). These are simple but miss that a red-zone target is worth far more than a screen pass, and a goal-line carry is worth far more than a carry at midfield.

- **Quality-aware models** condition on:
  - Target depth (air yards, aDOT)
  - Field position (yard line, goal-line proximity)
  - Down and distance
  - Coverage type and defender proximity (in tracking-based models)
  - Historical conversion rates by scenario

Quality-aware models produce xFP that better reflects true opportunity value and produce smaller residuals (FPOE) because expectations are tighter.

### Decomposition: Yardage vs. Touchdown vs. Reception

Useful analysis treats xFP as three separate components:

- **Expected receiving/rushing yards**: yards component, relatively stable
- **Expected touchdown probability**: TD component, volatile and position/location-specific
- **Expected reception rate**: for targets, the probability the catch is completed, varies by aDOT and coverage

A player can have identical total xFP but very different risk profiles depending on which component dominates. A receiver with high xFP from red-zone targets has ceiling-weighted (high-variance) value; one with high xFP from high-volume short-area targets has floor-weighted (stable) value.

### Platform and Provider Variance

No universal xFP standard exists. Sources differ in scoring assumptions, input granularity, and TD modeling:

**Scoring format**: xFP must match the league's scoring (PPR, half-PPR, standard, TE premium, bonuses, first-down points). A full-PPR xFP of 12 means something different than a standard-scoring xFP of 12 for the same target.

**Opportunity inputs**: 
- Volume-only models: targets, carries, nothing else
- Moderate models: targets, carries, air yards, field position, down-distance
- Tracking-enhanced models: everything above plus separation, coverage, pass rush time, route type

**Touchdown treatment**:
- Simple models: use league-average TD rate by position (e.g., 5% of red-zone targets yield a TD in the aggregate)
- Sophisticated models: adjust by field position (2% at the 20-yard line, 30% at the 2-yard line), coverage shell, and QB accuracy

**Defensive adjustment**:
- Most public models use league-average conversion rates (context-neutral)
- Some models adjust for opponent defense strength, but this requires caution to avoid double-counting if the underlying projection already reflects matchup

Different platforms can report the same player with xFP ranging 8–14 points on identical output, purely from these methodological choices.

### How xFP and FPOE Relate

xFP and FPOE are complementary, not substitutable:

$$\text{FPOE} = \text{Actual Fantasy Points} - \text{xFP}$$

- **High xFP + positive FPOE**: Elite role, strong execution. Typically a premium asset.
- **High xFP + negative FPOE**: Elite role, poor execution. Buy-low candidate if role persists.
- **Low xFP + positive FPOE**: Weak role, exceptional execution. Fragile; likely regression.
- **Low xFP + negative FPOE**: Weak role, poor execution. Generally avoid unless role is changing.

This 2×2 framework is more informative than either metric alone.

### Stability and Predictiveness

**Theoretical advantage over raw fantasy points**: xFP should correlate better with future fantasy points than past actual points because it removes the randomness of efficiency variance and touchdown luck. Empirically, this holds across multiple analyses—opportunity (captured by xFP) is stickier than efficiency (captured by FPOE or actual fantasy points).

**Year-over-year target/carry volume**: Year-to-year correlation r ≈ 0.60–0.70 for established players. Role changes between seasons break this, but within a stable offense, opportunity volume is predictable.

**Year-over-year conversion (efficiency given opportunity)**: Year-to-year r ≈ 0.25–0.35 for yards per target and yards per carry. Much weaker. This is why xFP (opportunity) is more predictive than FPOE (efficiency) for projections.

---

## Key Decisions

- **Decision:** The platform will calculate xFP using quality-aware inputs (target depth, field position, down-distance), not volume-only baselines.
  **Reasoning:** Quality-blind xFP systematically misvalues deep threats, red-zone threats, and goal-line backs. A model that treats a screen pass the same as a red-zone target is not usable for accurate floor/ceiling estimation.
  **Rejected alternative:** Volume-only xFP models were rejected as insufficiently granular; they conflate very different opportunity types.

- **Decision:** The platform will require a minimum-sample threshold for xFP interpretation. Meaningful rolling xFP requires 4+ games of data; single-game xFP is descriptive but not predictive.
  **Reasoning:** One game's xFP can reflect unusual game script, blowout garbage time, or anomalous play-calling. Multi-game rolling windows smooth out single-game noise and better represent true role.
  **Rejected alternative:** Reporting single-game xFP prominently was rejected as encouraging overreaction to one-off usage patterns.

- **Decision:** When xFP is surfaced, decomposition (yardage-xFP vs. TD-xFP vs. reception-xFP) will be provided or noted as unavailable.
  **Reasoning:** Total xFP alone cannot convey whether a player's expected value is floor-weighted (stable) or ceiling-weighted (volatile). Decomposition is essential for matching projections to league context (e.g., floor in cash games, ceiling in GPP).
  **Rejected alternative:** Reporting only total xFP was rejected as losing material information about risk profile.

- **Decision:** The platform will pair xFP with target/carry share and team pass/run volume, never in isolation.
  **Reasoning:** xFP absent context can be misleading. High xFP on a low-volume team is less actionable than high xFP on a pass-heavy team. Role context is essential.
  **Rejected alternative:** Displaying xFP on leaderboards independent of volume was rejected as encouraging false equivalence between abundance and depth.

---

## Best Practices

### High Confidence

- **Use xFP as your primary regression baseline.** Project next-week fantasy output as: (next-week projected opportunity) × (expected efficiency based on recent FPOE regression + baseline). Don't project efficiency forward unchanged; do regress FPOE and rebuild from xFP + regressed efficiency.

- **Compare actual points to xFP to identify divergence.** High xFP with actual points well below it is your highest-confidence buy-low signal, especially if the gap is explained by drops, bad luck, or QB issues rather than skill.

- **Use rolling 4-game xFP to detect role changes.** A player's xFP over weeks 1–4 vs. weeks 5–8 reveals whether their offensive role expanded or contracted, independent of efficiency noise.

- **Separate floor from ceiling.** High red-zone xFP implies high ceiling (TD probability). High volume at short area implies high floor (consistency). Don't conflate them.

### Moderate Confidence

- **Use xFP per game for comparisons across different snap/target volumes.** A player with 12 xFP in 60% snap share is outproducing opportunity relative to a player with 15 xFP in 80% snap share. Normalize by participation.

- **Adjust xFP for expected role changes.** A backup running back receiving goal-line carries in practice or earning hints from coaches may see xFP increase next game, even if current xFP is low. Forward-looking xFP is a projection tool; historical xFP is a diagnostic.

### Lower Confidence

- **Precise calibration of TD probability by field position.** Exact "red-zone TD rate" or "goal-line conversion rate" varies by team offensive line, QB, and script. Using league-average rates introduces systematic bias that is hard to quantify without access to individual team data.

- **Cross-provider xFP comparisons.** Because methodologies differ, importing one platform's xFP into another platform's analysis without recalibration is unreliable.

---

## Open Questions

- What is the optimal granularity for opportunity conditioning? Is depth of target sufficient, or do routes (slant vs. go vs. screen) warrant separate modeling?
- Should xFP models condition on QB accuracy and arm talent as a separate variable, or is conditioning on targets/air-yards sufficient?
- How much defensive strength should feed into expected-point models without risking double-counting with actual outcomes?
- What is xFP's true year-over-year predictive power relative to raw fantasy points for rest-of-season forecasting? (Varies by position and tenure; no consensus.)

---

_End of expected-fantasy-points.md_
