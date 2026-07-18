---
title: "Air Yards Share"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - air-yards
  - adot
  - target-share
related:
  - player-evaluation/target-share
  - player-evaluation/wopr
---

## Summary

Air yards share is a player's percentage of a team's total air yards — the distance the ball travels in the air from the line of scrimmage to the target point, whether the pass is completed or not. It isolates downfield opportunity and vertical role from catch-based outcomes, complementing target share by capturing depth of usage rather than volume. A player with an air yards share of 30% or higher holds a significant big-play role in the offense; 40%+ marks an elite, primary downfield threat.

---

## Core Knowledge

### Definition and Calculation

Air yards share equals a player's total air yards divided by the team's total air yards over a game, sample of games, or season. Air yards are counted on every target regardless of outcome — a deep incompletion still counts its full intended distance. Because air yards approximate average depth of target multiplied by target volume, the share metric effectively ranks who is being asked to stretch the field vertically, independent of whether those throws are actually caught.

This metric is more sensitive to charting methodology than target share. Definitional differences affect the total meaningfully: whether all intended targets are included, how throwaways are handled, whether deep shots nullified by penalty count, and how off-target or aborted throws are assigned. Small methodology differences between data sources can move a player's air yards share more than equivalent differences would move target share, so cross-source comparisons should be treated with more caution.

### Elite and Role Thresholds

An air yards share of 40% or greater is the benchmark for an elite, primary downfield/vertical threat. A share above 30% indicates a meaningful, valuable big-play role within the offense. These thresholds carry medium corroboration — multiple independent analyses converge on them, though the underlying corpus coverage for this metric is thinner than for target share.

### Known Pitfalls and Failure Patterns

**Uncatchable-deep-ball inflation.** A high air yards share can be driven substantially by low-probability, low-completion-percentage deep throws. A player with a large air yards share but a low catchable-target rate will underproduce relative to what the raw opportunity metric suggests. Air yards share should always be read alongside actual catch rate or catchable-target rate, not as a standalone production forecast.

**Small-sample volatility ("prayer yard" effect).** Because a single long target can be worth as much air yardage as ten short ones, air yards share is highly volatile in small samples. A player can post a very large single-game air yards share off just two or three targets, and early-season or short-window air yards share figures should be discounted accordingly until sample size grows.

**Negative or near-zero air yards.** Players who work primarily behind the line of scrimmage — screen-heavy receivers, backfield pass-catchers, shallow slot roles — can post negative or near-zero air yards, since a target thrown behind the line of scrimmage counts as negative distance. This penalizes high-volume, high-value short-area roles that don't show up as valuable under this metric, even though target share and actual production may be strong.

**Scheme dependency.** Offenses that rely on quick, layered short-passing concepts will show generally lower team-wide air yards regardless of individual talent, which can understate a player's relative importance within that system. Air yards share is most informative when compared within similar offensive schemes, not blindly across different offensive systems.

### Pairing with Efficiency Context

Air yards share measures opportunity, not conversion. Pairing it with a receiver's air yards conversion rate (actual receiving yards produced relative to air yards targeted) clarifies whether underperformance relative to opportunity stems from poor quarterback accuracy/decision-making or from the receiver's own inefficiency at the catch point. High air yards share plus high target share together form the strongest combined opportunity signal available at the individual-metric level; a player strong in one but weak in the other describes a materially different (safer-but-lower-ceiling, or higher-ceiling-but-volatile) profile.

---

## Key Decisions

- **Decision:** The platform will surface air yards share as a secondary/complementary metric alongside target share, not as a standalone ranking stat.
  **Reasoning:** Air yards share in isolation is prone to uncatchable-deep-ball inflation and small-sample volatility; its value is in describing the *quality* of opportunity that target share's *volume* signal doesn't capture.
  **Rejected alternative:** A blended leaderboard ranking players purely by air yards share was rejected because it would overrate low-percentage deep specialists with poor floors.

- **Decision:** The platform will flag air yards share values computed from fewer than a minimum sample of targets (to be set once the platform's own data pipeline is built) as low-confidence rather than suppressing them.
  **Reasoning:** Because a couple of deep targets can swing this metric dramatically, unflagged small-sample values risk misleading users into treating noise as a stable role signal.
  **Rejected alternative:** Withholding the stat entirely until a sample threshold is met was rejected because early-season signal, even if noisy, still has directional value to engaged users if properly labeled.

---

## Open Questions

- [ ] What minimum target sample size should the platform require before displaying air yards share with full confidence, versus flagging it as small-sample? — needs backtesting against the platform's own historical data once available.
- [ ] How should air yards share be normalized across offensive schemes (quick-passing vs. vertical-heavy systems) for fair cross-team comparison? — needs further analysis; current sources note the issue but do not converge on a normalization method.
- [ ] Should uncatchable/contested deep targets be down-weighted rather than counted at full intended distance? — sources disagree on whether raw, unadjusted air yards or a catchability-adjusted figure is more predictive; unresolved in available material.
