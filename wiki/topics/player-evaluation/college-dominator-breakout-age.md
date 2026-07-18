---
title: "Rookie College Dominator Rating / Breakout Age"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - dominator-rating
  - breakout-age
  - target-share
  - regression-baseline
  - landing-spot
  - draft-strategy
related:
  - player-evaluation/target-share
  - player-evaluation/route-participation-rate
  - player-evaluation/value-over-replacement
---

## Summary

College Dominator Rating measures a prospect's share of his team's receiving production (typically an average of receiving-yards share and receiving-touchdown share), and Breakout Age is the age at which he first crossed a meaningful production threshold — together they attempt to isolate market-share dominance and its timing as a prospect signal independent of raw counting stats. Every model in this synthesis converges on the same core claim: early, sustained market share is a strong prospect signal for wide receivers, more reliable in combination than either component alone, but the exact threshold (commonly cited in the 20-30% range), the age-calculation convention, and the competition-level adjustment are all unstandardized across sources. The metric is meaningfully weaker and less validated for tight ends and running backs, where positional role structurally suppresses receiving market share regardless of talent.

## Core Knowledge

### Definition and Calculation

The standard Dominator Rating formula averages two production-share components:

$$\text{Yardage Share} = \frac{\text{Player Receiving Yards}}{\text{Team Receiving Yards}}$$

$$\text{Touchdown Share} = \frac{\text{Player Receiving Touchdowns}}{\text{Team Receiving Touchdowns}}$$

$$\text{Dominator Rating} = \frac{\text{Yardage Share} + \text{Touchdown Share}}{2}$$

Some sources incorporate a third component (target share or reception share) into a three-factor average rather than the classic two-factor version; these are related but not numerically identical, and should not be treated as interchangeable when comparing dominator figures across sources. A commonly cited alternative, particularly favored where target data is unreliable or unavailable, is receiving yards per team pass attempt, which reduces (but does not eliminate) distortion from differing team pass volumes.

Breakout Age is the age at which a player first crosses a defined Dominator threshold — most commonly cited around 20% for wide receivers, though sources vary from roughly 15% to 30%, with some applying a lower threshold (commonly around 15%) for tight ends given the position's structurally lower receiving-share ceiling. The age itself can be calculated multiple ways — age at season start (commonly September 1), age at season end, or exact age at the specific game the threshold was crossed — and this convention is not standardized across sources, meaning two platforms can report different breakout ages for the same player using the same underlying production data.

$$\text{Breakout Age} = \text{Player's age (by chosen convention) in the first season meeting the Dominator threshold}$$

The underlying thesis: a player who commands a large share of his team's receiving production at a young age demonstrates both physical/technical readiness ahead of his peer group and coaching trust in a high-usage role, both of which are treated as more predictive of NFL target-earning ability than raw senior-year counting statistics accumulated after older, more talented teammates have departed.

### Platform and Provider Differences

There is no single official Dominator or Breakout Age standard; differences arise primarily from source data and formula choice rather than a single canonical definition:

- **The threshold itself is contested.** Some sources treat a 20% Dominator as the standard wide receiver breakout threshold; others use 25% or 30%, with the specific dispute being that lower thresholds (around 25%) may better capture high-impact players from run-heavy offenses or committee/timeshare situations that a stricter 30% cutoff would miss as false negatives.
- **Team receiving denominator composition** varies — whether the "team receiving yards/touchdowns" denominator includes running back and quarterback receiving production, or is restricted to wide receivers and tight ends only, changes the resulting share meaningfully and is not consistently disclosed by every source.
- **Postseason and bowl-game inclusion** differs by source, as does treatment of transfer-portal seasons split across two schools.
- **Age-calculation convention** (season-start vs. season-end vs. exact-date) is inconsistent, as noted above, and matters most for players whose birthdays fall mid-season.
- **Competition-level (conference strength) adjustment** is widely acknowledged as necessary — a given Dominator Rating at a Group of 5 or FCS program is not equivalent to the same rating in a Power Four conference — but no standardized, peer-reviewed adjustment factor exists; different sources apply different informal discounts, and some do not adjust at all.

Because full calculation methodology is often not published in replicable detail, two sources can report materially different Dominator or Breakout Age figures for the same player while each remaining internally consistent — a significant practical caveat when comparing figures across platforms.

### Edge Cases, Failure Patterns, and Pitfalls

- **Touchdown-share denominator instability.** When a team's total receiving touchdowns are low, a single touchdown can swing a player's Dominator Rating substantially, since the touchdown-share component divides by a small number. A yardage-heavy or multi-year-averaged version is more stable when touchdown volume is limited, and touchdown share generally should be treated as noisier than yardage share.
- **Elite-teammate suppression.** A receiver sharing a passing offense with one or more other future high-draft-capital prospects (a loaded receiving corps) can post a modest Dominator Rating not because of limited talent but because target volume is legitimately split among multiple NFL-caliber players — this is a well-documented false-negative pattern in Dominator-based evaluation.
- **Low-volume/run-heavy-offense inflation and suppression working in both directions.** A player can post an artificially high Dominator Rating by dominating a small overall receiving-yardage pool in a run-heavy or option-based offense (dominating the offense on paper while generating limited absolute NFL-relevant production), while conversely a talented player in a genuinely pass-heavy, evenly distributed offense may show a lower Dominator despite comparable or superior underlying ability. Both distortions point to the same conclusion: Dominator Rating should always be read alongside team pass volume and offensive context, not as an isolated share.
- **Transfer portal and extended-eligibility distortion.** Players who transfer schools often show a suppressed early-career Dominator Rating due to a new team's depth chart, followed by a later, larger breakout that penalizes them under a strict early-breakout-age framework. Separately, the COVID-era extra year of eligibility produced a cohort of players with mechanically older breakout ages relative to historical cohorts, a distortion that most sources have not systematically corrected for when comparing across draft classes.
- **Competition-quality and "conference bias."** A given Dominator Rating achieved against a small-conference or lower level of competition is not equivalent to the same figure achieved in a major conference; the magnitude of the appropriate adjustment is unresolved and applied inconsistently (or not at all) across sources.
- **Small-sample and role-mismatch noise.** A single strong season, particularly a true freshman or sophomore year, can be driven by a handful of explosive plays and is a noisier signal than sustained multi-year production; conversely, a player used primarily as a field-stretching decoy or in a gadget/rushing role may show suppressed receiving-share numbers that understate genuine NFL receiving upside.

### Position-Specific Applicability

Dominator Rating and Breakout Age were developed primarily for, and are best validated for, wide receivers. Multiple independent syntheses converge on treating the metric as substantially weaker for tight ends — the position's receiving-share ceiling is structurally lower due to blocking responsibilities and route-tree constraints inherent to college tight end usage, such that a standard wide-receiver-calibrated threshold produces a high false-negative rate for tight ends (several of the position's best current NFL producers had modest college Dominator figures). The running back analog (a rushing-production-share version) has been proposed by some analysts but is not well validated and is confounded heavily by offensive line quality, making it a considerably weaker signal than the receiver version.

## Key Decisions

- **Decision:** The platform will treat College Dominator Rating and Breakout Age as WR-primary prospect signals, and will not apply the same threshold framework to tight ends or running backs without a position-specific recalibration.
  **Reasoning:** Convergent synthesis indicates the standard threshold-based framework produces a materially higher false-negative rate for tight ends given the position's structurally lower receiving-share ceiling, and the running back rushing-share analog is not well validated.
  **Rejected alternative:** Applying a uniform Dominator threshold across all skill positions was rejected because it would systematically undervalue legitimate tight end and running back prospects whose positional role suppresses receiving-share metrics regardless of talent.

- **Decision:** The platform will present Breakout Age as a continuous input alongside Dominator Rating rather than as a rigid pass/fail cutoff at a single threshold.
  **Reasoning:** The specific threshold (20% vs. 25% vs. 30%) is genuinely contested across sources, and treating a borderline player (e.g., just under a chosen cutoff) as categorically different from one just above it manufactures false precision the underlying research does not support.
  **Rejected alternative:** Adopting a single hard threshold (e.g., 30% Dominator by age 20.5) as a binary prospect filter was rejected because it would discard genuine signal from borderline cases and encode a threshold choice that is not settled in the underlying research.

- **Decision:** The platform will display Dominator Rating alongside team pass-attempt volume, competition level, and (where determinable) primary receiving-corps competition, rather than as an isolated percentage.
  **Reasoning:** Every documented failure pattern in this metric — elite-teammate suppression, run-heavy-offense distortion, small-conference inflation — is only detectable with this surrounding context; the raw percentage alone is insufficient and can actively mislead.
  **Rejected alternative:** Surfacing Dominator Rating as a standalone leaderboard percentage was rejected because it would systematically misrank players from loaded receiving corps, low-competition schools, and unusual offensive systems.

## Open Questions

- Is Breakout Age genuinely predictive of NFL outcomes independent of draft capital, or does it primarily proxy for information that draft capital (which reflects scouts' own evaluation of the same underlying tape) already captures? This attribution question is not resolved in the available synthesis.
- What is the appropriate, standardized adjustment for competition level (conference strength, level of division), and can such an adjustment be made rigorous rather than an informal discount applied inconsistently across sources?
- How should transfer-portal careers spanning multiple programs, and post-COVID extended-eligibility seasons, be normalized against historical breakout-age baselines established before these structural changes to college football?
- Does target share provide meaningfully different (and possibly superior) signal compared to the traditional yards-and-touchdowns Dominator formula, particularly for evaluating short-area/high-volume receiver archetypes whose per-target yardage is lower?
- Has increasing college passing volume over time (era effects) inflated what a given Dominator percentage represents, such that raw historical comparisons across draft classes from different eras may need normalization?

---

_End of college-dominator-breakout-age.md_
