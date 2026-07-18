---
title: "Fantasy Points Over Expected (FPOE)"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - fpoe
  - efficiency
  - regression
  - residual
related:
  - player-evaluation/expected-fantasy-points
  - player-evaluation/value-over-replacement
  - player-evaluation/target-share
  - player-evaluation/wopr
---

## Summary

Fantasy Points Over Expected (FPOE) measures the difference between a player's actual fantasy production and the model-predicted production from their opportunity profile: FPOE = Actual Fantasy Points − Expected Fantasy Points (xFP). It isolates efficiency and luck (touchdowns, broken tackles, defensive breakdowns) from opportunity volume. FPOE is highly volatile—especially for touchdowns and small samples—and is most valuable as a regression diagnostic (identifying buy-low and sell-high candidates) rather than as a projection tool or standalone skill metric.

---

## Core Knowledge

### What FPOE Measures

FPOE is a residual: the gap between what actually happened and what a model predicted should happen given a player's observable opportunities. The core formula is:

$$\text{FPOE} = \text{Fantasy Points}_{\text{actual}} - \text{xFP}_{\text{model}}$$

where xFP is the model's conditional expectation of fantasy points based on opportunity inputs (targets, carries, air yards, field position, down and distance). Because xFP holds opportunity constant by construction, FPOE isolates everything not explained by opportunity: execution quality, situational efficiency, defensive errors, and randomness.

**Positive FPOE** indicates a player scored more than their opportunity profile predicted—whether from elite skill (high yards after contact, contested-catch ability), favorable game variance (defensive missed tackles), or touchdown luck.

**Negative FPOE** indicates underperformance relative to opportunity—poor catch rate, low yards after contact, or fewer touchdowns than the red-zone usage suggested.

### Why FPOE Is Not a Skill Metric

This is critical: **FPOE is not primarily a measure of player skill.** It mixes skill, context the model fails to capture, and randomness.

A model might miss:
- Route design and schematic spacing
- Quarterback accuracy and decision-making
- Blocking quality and explosive opportunities
- Game script and defensive intensity
- Injuries not visible in snap count

Additionally, FPOE is heavily influenced by:
- **Touchdown variance** (year-over-year correlation ≈ 0.10–0.15 for sustained TD rate)
- **Yards after contact/catch** (moderate stability, r ≈ 0.25–0.35 for ball carriers and receivers)
- **Broken tackles and avoided contact** (moderate but noisy)
- **Game-situation randomness** (blowout garbage time, unusual script)

A player with +50 FPOE from one season may regress sharply not because they got worse, but because they benefited from an unsustainable TD spike.

### Platform Differences in xFP (and Therefore FPOE)

Because FPOE depends on xFP, different xFP models produce different FPOE for the same player:

- **PFF-style tracking**: Conditions xFP on receiver separation, defender proximity, throw accuracy, coverage type. Produces lower residual magnitudes because expectations are tighter. FPOE becomes more of a "execution quality given target difficulty" metric.
  
- **Play-by-play depth models**: Uses target location, air yards, down-distance, historical conversion rates. Produces larger FPOE swings because the baseline expectation is coarser and leaves more variance unexplained.

- **Volume-only models**: Assigns a generic expected value per target or carry without depth/location adjustment. Produces inflated FPOE for red-zone and deep-threat players because their opportunities are higher-value but treated as average.

No universal FPOE standard exists. A player can have +20 FPOE on one platform and +5 on another despite identical actual production, purely from methodological differences in xFP calculation.

### Decomposition: What Kind of FPOE?

Useful analytical breakdowns:

- **Yardage-driven FPOE**: How much of the residual comes from yards per touch exceeding the model expectation? (More stable, skill-adjacent)
- **TD-driven FPOE**: How much comes from touchdown conversion above expectation? (Highly volatile, regresses hard)
- **Opportunity-quality FPOE**: Positive residuals on high-quality targets (high separation, red zone) versus low-quality targets? (Quality matters for interpretation)

A 50-point season FPOE built from 3 touchdowns on 40 targets is fragile and likely to regress. The same 50 points built from consistent +1.2 yards per carry is stickier. Always examine the composition.

### Year-Over-Year Stability

Empirical estimates (corroborated across multiple sources):

- **Sustained positive FPOE (multiple seasons, 100+ opportunities)**: Year-over-year correlation r ≈ 0.20–0.35. Non-zero but weak. A player with +30 FPOE in Year 1 (100+ touches) and Year 2 (100+ touches) is genuinely efficient, but correlation is far below opportunity or role stability.
  
- **TD-dependent FPOE**: Year-over-year correlation r ≈ 0.10–0.15. Touchdown rate is one of the least stable fantasy metrics.

- **Yardage efficiency (yards per touch)**: Year-over-year r ≈ 0.25–0.35, modestly stronger than pure FPOE but still regressive.

Small samples (under 50 touches) are contaminated by noise and should not be used for efficiency conclusions.

---

## Key Decisions

- **Decision:** The platform will present FPOE as a regression diagnostic tool, not as a projection input.
  **Reasoning:** FPOE's primary value is identifying divergence between opportunity and production, which flags potential regression targets (buy-low/sell-high), not as a stable forward-looking efficiency forecast. Treating high FPOE as predictive of future efficiency is the most common analytical error.
  **Rejected alternative:** Using FPOE directly as a player talent score was rejected because the metric conflates skill, luck, and model incompleteness; doing so would misidentify random variance as repeatable skill.

- **Decision:** The platform will require minimum-sample thresholds before reporting FPOE meaningfully. Season-long FPOE requires 80+ targets (WR/TE) or 150+ carries (RB). Rolling 4-game FPOE requires 15+ touches per game.
  **Reasoning:** Below these thresholds, FPOE is dominated by randomness and single-play variance. Displaying small-sample FPOE without qualification would mislead users into treating noise as signal.
  **Rejected alternative:** Reporting rolling FPOE on arbitrarily low samples was rejected as creating false precision and encouraging regression-fallacy mistakes.

- **Decision:** When FPOE is reported, decomposition by source (TD-driven vs. yardage-driven) will be provided or clearly noted as unavailable, rather than presenting an aggregate number only.
  **Reasoning:** Aggregate FPOE alone cannot distinguish repeatable efficiency from random TD variance. Showing the decomposition lets users judge stickiness.
  **Rejected alternative:** Reporting only total FPOE was rejected because it obscures whether the residual is structural or random.

---

## Best Practices

### High Confidence

- **Use FPOE for regression identification.** High positive FPOE on large samples (100+ touches, multiple seasons) suggests efficiency above league average that deserves some forward projection credit, but should be regressed aggressively toward zero (assume 60–70% reversion in the next period).

- **Use FPOE as a tie-breaker between similar-opportunity players.** If two receivers have identical target share and depth profile but one has +15 FPOE and the other has −15 FPOE, the positive-FPOE player warrants a modest upside.

- **Identify buy-low candidates.** High xFP with negative FPOE (strong role, poor recent conversion) flags players likely to regress upward, especially if injury, QB change, or unusual game script explains the underperformance.

- **Identify sell-high candidates.** Low xFP with high positive FPOE (weak role, exceptional recent efficiency) flags players whose fantasy points exceed their opportunity, suggesting future regression downward.

- **Never project next-season fantasy output from FPOE alone.** The metric's year-over-year stability is weak. Use xFP (opportunity) as the primary baseline; apply a small efficiency adjustment only if FPOE is sustained, high-sample, and explained by skill metrics (yards after contact, yards per route run, target competition) rather than TD rate.

### Moderate Confidence

- **Separate rushing and receiving FPOE for RBs.** Receiving-focused FPOE is modestly more stable than rushing FPOE because pass-catching roles are less volatile than backfield carries. A RB with negative rushing FPOE but positive receiving FPOE may be value-ready if the receiving role is durable.

- **Context matters.** FPOE accumulated in blowout fourth quarters, garbage time, or unusual game scripts is less predictive of future value than FPOE earned in competitive game states. If possible, exclude script-distorted periods from FPOE analysis.

### Lower Confidence

- **Whether sustained positive FPOE reflects true talent or favorable scheme fit.** Some players (e.g., elite WRs in wide-open spacing schemes) consistently post +FPOE. Is this repeatable skill or context-dependent? Hard to untangle.

- **Exact regression rates for FPOE.** The claim "regress 70% toward zero" is illustrative, not empirically settled. Optimal regression depends on position, sample size, TD-dependence, and league/platform specifics.

---

## Open Questions

- How much of multi-year positive FPOE in elite receivers (e.g., +40 points per season) is true talent versus scheme, usage design, or persistent quarterback accuracy?
- Should FPOE from scramble-drill situations (undesigned plays, broken coverage) be weighted differently than FPOE from called plays?
- Can FPOE be reliably used to distinguish catching skill from YAC skill, or is the correlation too high?
- What is the optimal shrinkage parameter for regressing FPOE toward zero by position and sample size?

---

_End of fantasy-points-over-expected.md_
