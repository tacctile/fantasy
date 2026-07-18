---
title: "Third-Down Conversion Rate (Team)"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - third-down-rate
  - epa
  - game-script
  - pace-of-play
  - qb-rush-rate
related:
  - team-scheme/red-zone-efficiency-team
  - team-scheme/proe
  - team-scheme/neutral-game-script-pass-rate
---

## Summary

Team third-down conversion rate (conversions divided by attempts) is a possession-extension metric that indirectly drives fantasy volume by increasing plays per drive, but every source converges that the raw percentage is a poor standalone signal: it is a downstream, context-heavy outcome of early-down efficiency and distance distribution rather than an independent measure of offensive quality. A team facing mostly third-and-short converts at a structurally higher rate regardless of underlying skill, while a team with an explosive offense may face fewer third downs altogether and post a merely average rate despite elite play-calling. The dominant cross-source theme is that early-down success rate/EPA is the more stable, more predictive metric, and third-down rate should be treated as a secondary, distance-adjusted confirmation signal rather than a primary volume driver.

## Core Knowledge

### Definition and Calculation

$$\text{Third-Down Conversion Rate} = \frac{\text{Third Downs Converted}}{\text{Third-Down Attempts}}$$

A conversion is credited when the offense gains a first down or scores on the play. Sources converge that the metric mixes two distinct things that should be decomposed:

1. **Third-down opportunity/distance profile** — how often and how far the offense needs to gain on third down, driven by early-down success.
2. **Conditional conversion probability** — success rate given a specific down-and-distance bucket.

$$\text{Third-Down Rate} = \sum_{d} P(\text{distance}=d) \times P(\text{Convert} \mid d)$$

Two teams with identical raw rates can arrive there through very different processes — one converting a steady diet of third-and-2, another converting an unusual share of third-and-9 through high-variance quarterback play — and these are not equivalent signals of offensive quality.

### Relationship to Fantasy Volume

Third-down conversion affects fantasy output only indirectly, through drive length and total plays per possession:

$$\text{Expected Offensive Plays} \approx \text{Possessions} \times \text{Plays Per Possession}$$

Conversion rate is one input into plays per possession alongside pace, explosive-play rate, sack rate, penalties, and fourth-down behavior — it is not a direct multiplier and should never be used in isolation to project player-level volume.

### Distance-Bucket Weighting

Multiple sources independently propose weighting conversions by down-and-distance difficulty rather than treating all conversions as equal, since a 3rd-and-1 conversion is far less informative about quarterback/passing-game quality than a 3rd-and-9 conversion. No major public platform currently publishes a standardized EPA-weighted third-down rate — this is a gap analysts fill manually using play-by-play data (e.g., nflfastR), and it is the single largest actionable improvement over raw rate.

### Platform and Provider Differences

- **Penalty treatment is the largest source of divergence.** Whether a defensive penalty (pass interference, defensive holding) that grants an automatic first down counts as a "conversion" differs by provider; some datasets separate penalty-driven first downs from true offensive conversions, others do not.
- **Sack and scramble classification varies.** Sacks should remain in the denominator as failed third-down plays; scrambles on designed pass plays are sometimes charted as pass-play intent (PFF-style) and sometimes as pure rushing outcomes (official/box-score style), which shifts a mobile-QB team's conversion rate depending on source.
- **Opponent adjustment separates providers into two tiers.** Legacy DVOA-lineage providers (Football Outsiders, FTN) and EPA-based public models adjust for opponent defensive strength, down/distance, and game situation; raw official statistics, ESPN/NFL.com-style box scores, and most fantasy-platform dashboards do not, and will rank a team facing mostly short-yardage third downs above a functionally superior offense facing longer distances.
- **Garbage-time and game-state filtering is inconsistent.** "Neutral script" definitions (score margin, quarter, win-probability band) vary across Sharp Football, RotoViz, and EPA-based models, and none of these thresholds are standardized league-wide.
- **Success Rate, EPA per third down, and Conversions Over Expected are related but non-interchangeable alternatives to raw rate** — a team can convert often while producing low EPA (short, low-leverage conversions) or convert modestly while producing high EPA (explosive, high-value gains). Treating these as the same measurement produces materially different team rankings.

### Edge Cases, Failure Patterns, and Known Pitfalls

- **Small-sample volatility.** With roughly 60–120 third-down attempts per team per season, raw rate has a standard deviation in the range of several percentage points, comparable in magnitude to the true-talent spread between elite and poor offenses — 8+ games of data are needed before the rate carries meaningful signal, and early-season rates should be treated as largely noise.
- **Garbage-time inflation.** Teams trailing by two or more scores late face softer prevent-style coverage that inflates conversion rate without reflecting true offensive quality; conversely, protecting a large lead can suppress a team's own third-down aggression as it runs the ball to kill clock.
- **The "borrowed time" pattern.** A high raw conversion rate combined with poor early-down efficiency (low first/second-down success rate or EPA) is a common false-positive: the team is converting unsustainable long-yardage situations and its rate is likely to regress toward the mean as its distance distribution normalizes.
- **Explosive-offense distortion.** A team that generates chunk gains on first and second down reaches fewer third downs altogether, which can make its raw third-down sample smaller and its rate a weaker overall signal of offensive quality — explosive teams should not be penalized for a merely average third-down rate.
- **Mobile-quarterback skew.** Designed QB runs and scrambles convert third-and-short and third-and-medium at elevated rates, which sustains drives and inflates team conversion rate but concentrates the underlying value in the quarterback position rather than distributing it to pass-catchers; this materially changes which skill positions actually benefit from a high team rate.
- **Fourth-down substitution effect.** No major platform adjusts third-down rate for a team's subsequent fourth-down behavior. An aggressive coaching staff (see head coach aggressiveness) converts some third-down failures into extended drives anyway via fourth-down attempts, meaning raw third-down rate alone understates that team's true drive-continuation ability.
- **Endogeneity with early-down metrics.** Third-down conversion is caused by prior-play quality, not independent of it; using it alongside early-down EPA, drive success rate, and first-downs-per-drive as separate model inputs risks double-counting the same underlying signal.

### Fantasy Application

Third-down conversion rate should be used as a secondary, distance- and opponent-adjusted confirmation signal for offensive quality, never as a primary standalone input for player-volume projection. The correct hierarchy for projecting team-level offensive volume is: early-down efficiency and distance distribution first, third-down conversion conditional on that distance distribution second, and fourth-down continuation behavior modeled separately as a further extension of drive survival. For player-level analysis, the position that benefits from a team's third-down conversion ability depends entirely on *how* the team converts — a mobile-quarterback-driven rate concentrates value in the QB, a slot-receiver/receiving-back-driven rate distributes value to specific pass-catching roles, and a raw team-wide rate says nothing on its own about which player benefits.

## Key Decisions

- **Decision:** The platform will not use raw team third-down conversion rate as a standalone input to any player-volume or team-scoring-environment projection model.
  **Reasoning:** All sources converge that raw rate is a downstream, context-heavy outcome of early-down efficiency and distance distribution rather than an independent measure of offensive quality; using it directly risks conflating a team's true talent with its schedule-driven distance profile.
  **Rejected alternative:** Surfacing raw third-down percentage as a headline team-quality stat was rejected because it would present a noisy, distance-confounded number with the same apparent authority as more stable early-down efficiency metrics.

- **Decision:** The platform will decompose third-down performance into distance-bucketed conversion rates (short: 1–3, medium: 4–6, long: 7-plus) rather than a single blended figure, and will pair this with early-down success rate/EPA as the primary offensive-quality signal.
  **Reasoning:** Multiple sources independently identify distance confounding as the largest single distortion in raw third-down rate; a team facing mostly short-yardage third downs is not directly comparable to one facing mostly long-yardage third downs even at an identical raw percentage.
  **Rejected alternative:** An EPA-weighted composite third-down score was considered but rejected for the initial implementation because no standardized weighting scheme exists across sources and construction from raw play-by-play data would require ongoing manual maintenance disproportionate to the marginal signal gained over distance-bucketed rates.

- **Decision:** The platform will filter third-down conversion data to neutral game script (competitive score margin, excluding late-game clock-killing and prevent-defense situations) before surfacing it as a team-quality signal, and will separately display full-sample rate for descriptive/box-score purposes.
  **Reasoning:** Garbage-time and lopsided-game distortion is consistently identified as a major confound; a team's full-season raw rate can meaningfully overstate or understate its true offensive quality depending on how often it trailed or led by large margins.
  **Rejected alternative:** Displaying only full-sample season rate was rejected because it silently launders game-script noise into what users would reasonably interpret as a stable team-skill measurement.

- **Decision:** The platform will require a minimum sample (approximately 8 games / 50+ third-down attempts) before displaying third-down conversion rate with high confidence, and will visually flag smaller samples as low-reliability.
  **Reasoning:** Standard deviation of raw rate over small samples is comparable in magnitude to the true-talent spread between elite and poor offenses; early-season rate is described across sources as largely noise.
  **Rejected alternative:** Displaying the statistic identically regardless of sample size was rejected as the default failure mode that causes users to overreact to small-sample third-down swings.

## Open Questions

- How much of third-down conversion rate is a repeatable team skill after controlling for quarterback quality, offensive line, opponent strength, and distance distribution? Sources describe the decomposition between durable skill and situational noise as unresolved, with year-to-year correlation described as weak-to-moderate (in the range of 0.35–0.40) but not tightly established.
- Whether Conversions Over Expected (EPA- or distance-weighted) is meaningfully more stable and predictive than raw rate across seasons — theoretically preferable per most sources, but not clearly validated as outperforming simpler distance-bucketed approaches in practice.
- How should fourth-down continuation behavior (see head coach aggressiveness) be integrated into a combined "drive survival" metric rather than modeled as a separate, disconnected statistic? No source proposes a fully worked composite.
- Whether a team that deliberately avoids third downs through aggressive/explosive early-down play-calling should be evaluated on a different framework entirely, since its third-down sample becomes too small to carry independent signal.

---

_End of third-down-conversion-rate-team.md_
