---
title: "Explosive Play Rate / Breakaway Run Rate"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - explosive-play-rate
  - breakaway-run-rate
  - big-play-upside
  - ceiling
  - volatility
  - boom-bust
related:
  - player-evaluation/yards-before-contact
  - player-evaluation/yards-after-contact
  - player-evaluation/missed-tackles-forced
---

## Summary

Explosive play rate measures the percentage of touches (carries or receptions) that gain 15 or more yards, capturing big-play ceiling and boom-week potential independent of volume. The metric is **highly volatile and scheme-dependent**, with low year-over-year stability (r ~0.25–0.35), making it valuable for identifying upside but unreliable for projecting repeatability. Explosive play rate should always be paired with opportunity volume—rate alone is noise; rate multiplied by touches reveals genuine weekly ceiling potential.

## Core Knowledge

### Definition and Calculation

Explosive play rate is typically defined as:

$$\text{Explosive Play Rate} = \frac{\text{Touches gaining 15+ yards}}{\text{Total qualifying touches}}$$

For running backs:

$$\text{Breakaway Run Rate} = \frac{\text{Carries gaining 15+ yards}}{\text{Total carries}}$$

For receivers:

$$\text{Explosive Reception Rate} = \frac{\text{Receptions gaining 15+ yards}}{\text{Total receptions}}$$

A related volume metric is:

$$\text{Explosive Plays per Game} = \frac{\text{Explosive plays}}{\text{Games played}}$$

And a workload-adjusted version:

$$\text{Explosive Plays per Touch} = \frac{\text{Explosive plays}}{\text{Total touches}}$$

The 15-yard threshold is a convention in fantasy analytics, not a natural law. Alternative thresholds exist:

- **10-yard threshold:** More frequent, better sample size stability, but includes many ordinary "good" runs that are not game-changing
- **15-yard threshold:** Standard fantasy convention; reasonably rare and more indicative of true big-play ability
- **20-yard threshold:** Stricter, more selective ("breakaway" proper), but low-frequency and higher variance

No industry consensus exists on the optimal threshold. **Comparing explosive rates across sources without verifying the threshold is a common analytical error.**

### What Explosive Play Rate Measures

Explosive play rate captures the frequency of large gains. It reflects a combination of:

- **Player skill:** acceleration, top-end speed, vision, balance, contact avoidance
- **Blocking and scheme:** gap creation, cutback lanes, play-action misdirection, designed space
- **Defensive alignment:** box count, coverage depth, pursuit angles
- **Game situation:** leading vs. trailing, time of game, down and distance
- **Opportunity type:** inside vs. outside, designed runs vs. scrambles, contested catches vs. open-field receptions

For running backs specifically, explosive runs can be subdivided:

- **Yards before contact:** scheme and blocking-driven (how much space is created before the runner meets a defender)
- **Yards after contact:** runner skill-driven (power, balance, elusiveness through contact)

Most publicly available explosive metrics do not separate these; they treat all 15-yard gains as equivalent regardless of mechanism. This conflates blocking quality with individual talent.

### Rate vs. Volume Trade-off

A critical distinction:

- **Rate:** Percentage of touches. A high rate with low volume is noise.
- **Volume:** Total count of explosive plays. A player with one explosive play on 25 touches has a high rate but limited total upside.
- **Frequency:** Explosive plays per game or per week. Useful for projection, but depends on volume assumption.

Example: Player A has 2 explosive plays on 20 carries (10% rate). Player B has 5 explosive plays on 100 carries (5% rate). Player B has more total big-play upside (5 vs. 2) despite a lower rate. For fantasy purposes, total explosive plays often matters more than rate, because fantasy points are scored per game (function of total opportunity), not per play (function of efficiency).

### Year-over-Year Stability and Regression

Explosive play rate is one of the most volatile efficiency metrics in football.

**Year-over-year correlation:** r ~0.25–0.35 for running backs; slightly higher (r ~0.30–0.40) for receivers due to higher target volume. This is very low. For context, yards per carry (YPC) is r ~0.20–0.30, so explosive rate is only marginally more stable than raw YPC.

**Practical implication:** A running back or receiver with an elite explosive rate in Year N should be expected to regress substantially in Year N+1, even if volume and role remain constant. Regression to league mean is aggressive. A player above 10% explosive rate is likely to decline toward 5–7%. A player below 4% may improve, but predicting which players will break above average is speculative.

The low stability reflects:

- **Touch rarity:** Explosive plays are low-frequency events. A single broken tackle or defensive lapse can generate one-quarter of a player's seasonal explosive plays.
- **Scheme volatility:** A change in blocking scheme, gap assignments, or play-action frequency materially affects explosive opportunity.
- **Defensive scheme responsiveness:** Defenses adjust to frequent big-play threats by stacking the box or playing deeper, suppressing future explosive opportunities.
- **Injury and conditioning:** A player's speed or burst can decline with age or injury, reducing explosive potential.
- **Sample size limitations:** Regressing the mean without sufficient touches or receptions produces unreliable estimates.

### Platform and Provider Differences

The 15-yard threshold is not universal.

**PFF and NFL official data:** Typically use 10+ yards for "explosive runs" and 15+ yards for "breakaway runs." Two distinct metrics.

**PlayerProfiler:** Published "Explosive Play Rating (EPX)" that combines rate with total explosive-yards output. EPX is a composite, not a pure rate, and is non-comparable to raw rate from other sources.

**Secondary sites:** May use 15+ or 20+ yards, and may compute rate on receptions vs. targets for receivers (different denominators).

**Major discrepancy:** Moving from 10-yard to 15-yard to 20-yard threshold produces non-monotonic changes in player rankings. A player with many 11–14 yard gains will have high 10-yard explosive rate but low 15-yard rate. A player with few 16–19 yard gains but a couple of 25+ yard runs will have high 20-yard rate but lower 15-yard rate. Rankings are not portable across thresholds.

### Sample Size Minimums

Explosive play rate requires substantial sample size to be meaningful:

- **Below 50 carries or targets:** Noise. One play dramatically alters the metric.
- **50–100 carries/targets:** Preliminary signal. Large confidence intervals.
- **100+ carries/targets:** Meaningful signal if supported by yards-before-contact and yards-after-contact context.

Backup running backs and pass-catching specialists may never reach 100 carries in a season. For these players, explosive play rate is purely descriptive (what actually happened) rather than predictive (what to expect).

## Key Decisions

**The platform will use explosive play rate as a ceiling and upside indicator, not a floor or consistency indicator.** High explosive rate predicts weeks above 20 fantasy points but does not predict minimum weekly scoring.

**The platform will require pairing explosive rate with opportunity volume.** Rate alone is insufficient. The platform will compute or reference both:
- Explosive play rate (frequency)
- Total explosive plays (volume)
- Explosive plays per game (workload-adjusted frequency)

**The platform will regress explosive rate aggressively when projecting future seasons.** A player's Year N explosive rate should be shrunk toward league mean, weighted by sample size and prior seasons. Regression should account for age, role changes, injury status, and defensive adaptation.

**The platform will distinguish explosive rate drivers when available.** For running backs, separating yards before contact from yards after contact clarifies whether explosiveness is scheme-driven (less repeatable) or skill-driven (more repeatable). The platform will note this distinction where data exists.

**The platform will treat threshold choice (10 vs. 15 vs. 20 yards) as material, not interchangeable.** When comparing players across sources, the platform will verify the threshold and adjust for known differences if comparing across methodologies.

**The platform will use explosive play rate primarily in DFS tournament and best-ball contexts, where ceiling matters more than consistency.** In season-long formats with bench spots and waiver flexibility, explosive rate is useful for identifying high-upside speculative adds, but not the primary driver of starting recommendations.

## Open Questions

- **Optimal threshold:** Is 15 yards the natural inflection point for "game-breaking" plays, or are 10-yard and 20-yard thresholds equally informative? No comparative predictive study exists.
- **Stability under role expansion:** Does a backup's explosive rate remain stable if elevated to starter? Early evidence suggests no (role expansion is usually defensive-limited), but the interaction is not thoroughly modeled.
- **Interaction with game script:** Does explosive rate suppress differently in positive vs. negative game scripts, and can this be normalized? Game script dependency is known but quantification is lacking.
- **Mechanism isolation:** Can we build a reliable model that separates yards-before-contact (blocking) from yards-after-contact (runner skill) and predicts which is more stable? Current public work conflates them.
- **EPA-weighted explosiveness:** Would weighting explosive plays by expected points added (EPA) provide more predictive power than yardage threshold? Unknown.

---

_End of explosive-play-rate.md_
