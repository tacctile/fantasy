---
title: "Target Share"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - target-share
  - snap-share
  - route-participation
  - waiver-wire
related:
  - player-evaluation/air-yards-share
  - player-evaluation/wopr
---

## Summary

Target share is the percentage of a team's pass attempts directed at a specific player, calculated as player targets divided by team pass attempts. It is a pure opportunity metric — it isolates how often the offense looks to a player independent of catch rate, yards, or touchdowns — and is the single most predictive per-game opportunity measure for wide receivers and tight ends. A sustained target share of 20% or higher over 4+ games is the accepted threshold for a genuine, high-usage role; 25%+ marks elite, alpha-receiver usage.

---

## Core Knowledge

### Definition and Calculation

Target share equals a player's individual targets divided by the team's total pass attempts over a game, sample of games, or season. It measures structural role and coaching intent — how large a slice of the passing offense a player commands — rather than how efficiently that opportunity converts into production. Because it normalizes for differing team pass volume, it allows fair comparison of receiver role across offenses with very different pass-attempt totals.

There is a methodological split in how the denominator is defined. Basic calculations use raw team pass attempts from the box score. More rigorous charting-based calculations exclude non-intentional plays — throwaways, spiked balls, and passes batted down at the line of scrimmage — to better reflect actual offensive design and coaching intent. A related but distinct denominator is team dropbacks (pass attempts plus sacks plus scrambles on designed passing plays); this "dropback target rate" is not the conventional target-share statistic and should not be blended with pass-attempt-denominated figures, since sacks reduce a dropback-based denominator without producing a target, which otherwise inflates every receiver's apparent share. This distinction matters most in small samples and unusual game flows; over a full season the different denominators converge closely but not exactly.

### Why Opportunity Outpredicts Efficiency

Target share is treated as more predictive of future fantasy output than efficiency stats (catch rate, yards per target, touchdown rate) because opportunity is sticky — a player's role tends to persist week to week — while efficiency is volatile and regresses toward the mean. A player who commands a large, stable share of targets will generally continue producing usable fantasy value even through stretches of poor efficiency, whereas an efficiency spike without a stable target share is far less repeatable. This is not just directional: year-over-year target share correlation is meaningfully higher (roughly 0.65–0.70 in cited analyses) than year-over-year correlation for total fantasy points (roughly 0.40–0.45), which is the quantitative basis for treating target share as a foundational input to projection rather than a secondary descriptive stat.

### Elite and Starter Thresholds

A target share of 25% or higher is the accepted benchmark for elite, top-tier wide receiver usage, with some sources placing true elite closer to 28%+. A share in the 20–24% range indicates a stable, reliable starter-caliber role. Below roughly 20%, sustained over multiple games, a player has not established a genuine primary role in the passing offense. Tight end thresholds run lower across the board given the position's structural target-share ceiling — roughly 18–22% marks a strong TE1 role, with 22%+ considered elite. These thresholds are corroborated across multiple independent analyses and treated as settled, though exact cutoffs should be read as bands rather than precise breakpoints.

### Known Pitfalls and Failure Patterns

**Low-volume offense trap.** A high target share on a low-pass-volume team can still produce mediocre absolute output — 25% of 22 attempts yields fewer raw targets than 18% of 42 attempts. Target share must be read alongside team pass attempts, not in isolation, to assess true opportunity.

**Small-sample and early-season noise.** A strong target share over one or two games does not establish a role. The reliability threshold requires the share to hold over 4 or more games; single-game outliers (blowouts, unusual game scripts) distort seasonal averages if not treated carefully.

**Injury-driven distortion.** When a starting quarterback or a competing pass-catcher is injured mid-game or mid-season, target distribution skews sharply. A resulting spike in another player's share may reflect a temporary vacancy rather than a permanent role change, and should not be treated as a new baseline until it persists.

**Positional discount for tight ends.** Tight ends structurally post lower target shares than wide receivers due to route distribution and blocking responsibilities, even when they are heavily relied upon in specific situations such as the red zone or third down. Comparing TE and WR target shares directly without this adjustment understates a tight end's true offensive importance.

**Dump-off and check-down inflation.** Short-area, schemed throws — screens, running back dump-offs, quick check-downs — inflate target share without reflecting downfield value or genuine offensive priority. A high share built primarily on short-area volume describes a different (generally lower-ceiling) role than one built on intermediate and deep involvement.

**Garbage-time inflation.** Target share accumulated in blowout garbage time can overstate a player's role in competitive game states and should be discounted accordingly.

**Vacated-target overestimation.** When a player departs a team (trade, free agency, retirement), their "vacated targets" are frequently assumed to redistribute proportionally among the remaining pass-catchers. In practice, redistribution depends heavily on the departed player's routes and alignment, whether their targets were designed or incidental, the specific replacement personnel, quarterback preference, and whether the offense's scheme changes alongside the personnel change. Vacated targets should be treated as an opportunity pool with uncertain allocation, not a guaranteed transfer to any single remaining player.

### Pairing with Route-Level and Depth Context

Target share does not distinguish short-area targets from downfield targets and does not capture target quality. To evaluate true target-earning efficiency independent of snap count fluctuations (from blowouts, injury, or committee usage), it should be paired with targets per route run (TPRR), which normalizes for how often a player is actually on the field running routes. It should also be paired with depth-of-target or air yards context, since target share alone cannot separate a high-value intermediate/deep role from a low-ceiling short-area role.

---

## Key Decisions

- **Decision:** The platform will calculate and surface target share as a rolling multi-game statistic (minimum 4-game window) rather than only single-game or full-season snapshots.
  **Reasoning:** The reliability threshold for target share as a role signal requires 4+ games; single-game values are noise-dominated and would mislead users if presented without that context.
  **Rejected alternative:** Surfacing only season-to-date target share was rejected because it masks recent role changes (e.g., post-injury target redistribution) that are more actionable than a season-long average.

- **Decision:** The platform will display target share alongside team pass attempt volume and TPRR wherever it is surfaced, rather than as an isolated number.
  **Reasoning:** Target share read in isolation is misleading in both low-volume and high-volume passing offenses; pairing it with team pass attempts and route-normalized usage gives users the context needed to avoid the low-volume-offense trap and injury-driven false signals.
  **Rejected alternative:** Displaying target share as a standalone ranked leaderboard stat was rejected because it would systematically overrate players on pass-heavy but low-efficiency offenses and underrate efficient players on run-heavy teams.

- **Decision:** The platform will apply a positional adjustment note (not a numeric correction) when comparing tight end and wide receiver target shares side by side.
  **Reasoning:** Tight ends are structurally disadvantaged in raw target share due to route distribution, and an unadjusted cross-position comparison would misrepresent a tight end's actual offensive value.
  **Rejected alternative:** A blanket numeric multiplier to "normalize" TE target share was rejected as fabricating precision the underlying data does not support; a contextual flag is more honest than a false numeric adjustment.

---

## Open Questions

- [ ] Should target share denominators exclude throwaways, spikes, and batted passes by default, or should the platform default to raw pass attempts and offer the adjusted view as a toggle? — needs a data-source decision based on what the platform's play-by-play provider actually distinguishes.
- [ ] What is the optimal way to weight target share against absolute team pass volume when ranking players across teams with very different pass rates? — needs further model testing once the platform has historical target data to backtest against.
