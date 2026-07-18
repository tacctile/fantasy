---
title: "Neutral Game Script Pass Rate"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - pass-rate
  - neutral-script
  - game-script
  - offensive-scheme
  - opportunity
related:
  - team-scheme/proe
  - team-scheme/pace-of-play
  - player-evaluation/target-share
---

## Summary

Neutral Game Script Pass Rate filters a team's pass rate down to situations where the score is close enough (commonly within one score, though the exact band is contested) that the offense is not being obviously forced into pass-heavy or run-heavy play-calling by score pressure alone. It removes the two clearest sources of raw-pass-rate distortion — garbage-time inflation for trailing teams and clock-killing depression for leading teams — to reveal a cleaner read of baseline offensive philosophy. Every source in this synthesis converges on treating it as a strong complement to PROE and pace rather than a replacement for either: it is more interpretable and easier to explain than a model-based expected-pass residual, but it remains a filtered descriptive measure, not a complete opportunity forecast, and a fixed score-margin threshold is a genuinely contested design choice rather than a settled standard.

## Core Knowledge

### Definition and Calculation

$$\text{Neutral Pass Rate} = \frac{\text{Pass Plays in Neutral Situations}}{\text{Pass Plays in Neutral Situations} + \text{Run Plays in Neutral Situations}}$$

The critical design choice is the definition of "neutral." Commonly cited score-margin thresholds range from roughly ±6 to ±10 points, with ±7 (a field goal) and ±8 (allowing for a touchdown plus failed two-point conversion) being the two most frequently cited conventions — no single value is treated as a settled industry standard. Beyond the score band, most rigorous implementations also apply a time filter, commonly excluding the final two minutes of each half and/or restricting the sample to the first three quarters, since two-minute-drill and clock-management situations distort play-calling independent of the raw score margin. Some more granular implementations further restrict to specific down-and-distance situations (e.g., first-and-10, or first-and-10 plus second-and-medium) to remove the play-calling constraint inherent to third-and-long or short-yardage situations, at the cost of a smaller, noisier sample.

A more refined alternative to a fixed score-margin cutoff defines neutrality using both score and time jointly (a time-dependent margin threshold, since a given point differential means something different with two minutes left than with ten minutes left), or defines it directly via win probability — restricting the sample to plays where the offense's win probability falls within a moderate band (neither clearly winning nor clearly losing). Win-probability-based definitions are more strategically meaningful than a fixed point margin, since they account for the actual leverage of the game state rather than raw score alone, but they introduce dependency on the accuracy and calibration of whatever win-probability model is used to generate the filter — a source of additional, provider-specific noise.

### Platform and Provider Differences

The definition of "neutral" is not standardized across sources, and this is the primary source of cross-provider disagreement for this metric — more so than for most other scheme statistics:

- **Score-margin threshold** varies (commonly ±7 or ±8, with some sources using wider or narrower bands), and this single choice alone can shift a given team's reported neutral pass rate and league ranking meaningfully.
- **Time-window rules** differ — full-game-with-exclusions versus first-half-only versus first-three-quarters-only are all used by different sources under the same "neutral pass rate" label, and these are not equivalent: first-half-only sampling still includes large first-half leads/deficits, two-minute offense, and end-of-half field-goal-drive situations that a stricter neutral filter would exclude.
- **Down-and-distance filtering** (restricting further to early downs or standard distances) is applied by some sources and not others, producing a more purely "philosophical" but smaller-sample read when applied.
- **Play-type inclusion** (scrambles, sacks, spikes, kneel-downs) follows the same inconsistency documented for PROE and raw pass rate — whether the denominator is pass attempts or dropbacks, and whether scrambles count as passes, changes the resulting rate.
- **Some providers report a related but distinct "neutral pace" metric** (filtering plays by score for tempo purposes) that should not be conflated with neutral pass rate — they answer different questions (how fast vs. how often the offense passes) even when built from a similar situational filter.

Because of this, two sources both labeled "neutral pass rate" can produce materially different team rankings from the same underlying game data. Cross-provider comparison requires confirming the specific score band, time window, and down-and-distance treatment before treating figures as comparable; within-provider trend tracking is the safer use.

### Edge Cases, Failure Patterns, and Pitfalls

- **A fixed score threshold is not truly neutral across all game states.** A seven-point deficit with two minutes remaining carries fundamentally different strategic pressure than the same deficit in the second quarter, and a fixed-margin filter without a time component will treat both as identically "neutral," contaminating the sample with genuine urgency-driven play-calling.
- **Selection bias in which teams accumulate a large neutral sample.** Neutral plays are not a random sample of a team's offense — they overrepresent competitive games, stronger opponents, and the early-to-middle portions of games. A team that frequently builds large leads will have a neutral sample concentrated in the early game; a team that frequently falls behind early will have a smaller, differently-skewed neutral sample. This makes cross-team neutral-rate comparisons less clean than they appear.
- **Small-sample instability for blowout-prone or dominant teams.** Teams with many lopsided outcomes (either direction) can end up with a genuinely small neutral-script sample for a given stretch of the season, making the reported rate sensitive to a handful of individual drives or third-down conversions.
- **Down-and-distance composition confounds the philosophical read.** A team facing frequent third-and-long situations within its neutral sample (due to poor early-down offensive efficiency, not aggressive philosophy) can show an elevated neutral pass rate that reflects situational necessity rather than a genuinely pass-heavy baseline approach — this is why neutral pass rate is best paired with neutral PROE (whether the team passed more or less than expected *even within* the neutral subset), rather than read in isolation.
- **Opponent quality and pass-rush pressure can inflate neutral pass rate without improving receiver ceiling.** A team facing a dominant pass rush may shift toward quick, short-area passing even while remaining conservative in downfield intent — raising the neutral pass rate without a corresponding increase in target quality or explosive-play upside.
- **The metric does not distinguish play type or target distribution.** Neutral pass rate does not separate play-action from true dropback passing, does not capture designed quarterback runs versus conventional runs, and says nothing about how concentrated or diffuse the resulting targets are — a team with a high neutral pass rate but a heavily concentrated target tree may only meaningfully benefit one receiver.

### Fantasy Application

Neutral pass rate is most useful for distinguishing two structurally different types of passing offenses: teams that pass aggressively even in competitive game states, versus teams whose passing volume depends heavily on falling behind. The first group generally offers a safer, more predictable receiver floor across a range of likely game outcomes; the second group can produce comparable or higher ceiling in specific unfavorable-spread matchups, but with materially higher week-to-week volatility tied to how the specific game script plays out. A fuller expected-volume model decomposes total passing volume by game state:

$$E[\text{Pass Attempts}] = P(\text{Neutral}) \times E[\text{Passes} \mid \text{Neutral}] + P(\text{Trailing}) \times E[\text{Passes} \mid \text{Trailing}] + P(\text{Leading}) \times E[\text{Passes} \mid \text{Leading}]$$

Neutral pass rate estimates only the first term of this decomposition; a complete weekly projection also requires an estimate of how likely the team is to be in each game state (informed by the point spread and projected total) and how the team behaves specifically when trailing or leading.

## Key Decisions

- **Decision:** The platform will define its neutral-script filter using both a score-margin band and an explicit time-remaining component, rather than a fixed point-margin threshold alone.
  **Reasoning:** Convergent synthesis flags fixed-margin-only filters as a documented failure pattern, since the same score differential carries different strategic weight depending on time remaining; combining both dimensions produces a more genuinely neutral sample.
  **Rejected alternative:** A simple fixed ±7 or ±8 point filter with no time component was rejected because it would misclassify late-game urgency situations as neutral, contaminating the philosophical signal the metric is meant to isolate.

- **Decision:** The platform will always present neutral pass rate alongside neutral PROE (or, where PROE isn't available, alongside down-and-distance context) rather than as a standalone figure.
  **Reasoning:** Neutral pass rate alone cannot distinguish a genuinely aggressive passing philosophy from situational necessity driven by poor early-down efficiency (e.g., frequent third-and-long); pairing it with an expectation-adjusted view resolves this ambiguity.
  **Rejected alternative:** Surfacing neutral pass rate as an isolated leaderboard statistic was rejected because it would misrepresent inefficient, situationally-forced passing as intentional offensive aggression.

- **Decision:** The platform will require a minimum neutral-play sample size before displaying a neutral pass rate with high confidence, and will flag low-confidence figures for teams with few neutral-script snaps (e.g., due to frequent blowouts).
  **Reasoning:** Selection bias and small-sample instability are well-documented failure patterns for this metric, particularly for teams at either extreme of the standings; an undisclosed low-sample figure risks misleading users into treating noise as signal.
  **Rejected alternative:** Displaying neutral pass rate uniformly regardless of underlying sample size was rejected because it would present equally unreliable figures with false equivalence to well-sampled ones.

## Open Questions

- Are fixed-score-margin neutral filters sufficiently principled for serious analysis, or does the field need to converge on win-probability-based neutrality despite the added dependency on win-probability model quality? Sources are split, with the transparency and reproducibility of fixed filters weighed against the greater strategic accuracy of probability-based ones.
- Is neutral pass rate fundamentally a philosophy metric or a matchup-response metric? Offensive coordinators may deliberately adjust their baseline approach against specific defensive profiles, and treating that deviation as unexplained "noise" in the metric may mischaracterize a rational, matchup-specific decision as inconsistency.
- Is first-half pass rate a viable, simpler proxy for neutral pass rate, or does it retain too much distinct distortion (large first-half leads/deficits, two-minute-drill situations, end-of-half field-goal-focused drives) to be treated as equivalent?
- Is the relationship between neutral pass rate and downstream fantasy production linear? A given increase in neutral passing volume may produce large receiver gains if it comes with increased route participation and target concentration for a specific player, or comparatively little individual gain if the added volume is distributed across backs, tight ends, and a diffuse target tree.

---

_End of neutral-game-script-pass-rate.md_
