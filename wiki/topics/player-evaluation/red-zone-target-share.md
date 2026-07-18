---
title: "Red Zone Target Share"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - red-zone
  - target-share
  - touchdown
  - game-script
  - qb-rush-rate
related:
  - player-evaluation/target-share
  - player-evaluation/wopr
  - player-evaluation/goal-line-carry-share
---

## Summary

Red zone target share is the percentage of a team's pass attempts inside the opponent's 20-yard line directed at a specific receiver, calculated as player red-zone targets divided by team red-zone pass attempts. It isolates the highest-leverage passing volume on the field: a target inside the 20 converts to a touchdown at a rate several multiples higher than a target between the 20s, which makes red zone target share a stronger leading indicator of touchdown upside than overall target share alone. It is primarily a role metric — it identifies who the offense trusts when the field compresses — rather than a direct touchdown projection, and it is most useful when broken into sub-zones (inside-20, inside-10, inside-5) rather than treated as one undifferentiated bucket, since targets closer to the goal line carry meaningfully higher scoring probability than those near the 20-yard-line boundary.

---

## Core Knowledge

### Definition and Calculation

Red zone target share equals a player's targets with the line of scrimmage at or inside the opponent's 20-yard line, divided by the team's total red-zone pass attempts over the relevant sample. The denominator should be team red-zone *pass attempts*, not all team red-zone *plays* (which would include rushes, sacks, scrambles, and kneels) — using the broader plays-based denominator understates the share of pass-oriented receivers and makes cross-team comparisons less meaningful, since teams vary widely in how run-heavy they are once inside the 20. A target generally counts on any pass attempt with a discernible intended receiver, including completions, incompletions, and interceptions; spikes and throwaways without an identifiable target are excluded.

Because touchdown probability rises sharply as the line of scrimmage compresses toward the goal line, the single inside-20 bucket is a coarser signal than a tiered breakdown: inside-20 target share, inside-10 target share, inside-5 target share, and end-zone target share (targets thrown into the end zone itself) each carry different and increasing touchdown probability. A receiver's inside-20 share can look strong while his share of the much higher-value inside-10 or inside-5 targets is thin — the tiered breakdown is materially more predictive of touchdown output than the blanket inside-20 number, and a platform relying on the single broad bucket will systematically miss this distinction.

### Role Signal, Not a Standalone Touchdown Projection

Red zone target share is best understood as a multiplier on opportunity rather than an independent forecast of touchdowns. It identifies which receiver the offense trusts in the compressed field — a role that can reflect contested-catch ability, size, a favored route concept (fades, slants, option routes), or simply being the quarterback's first read near the goal line — but it does not by itself capture whether those targets convert. A receiver can hold an excellent red-zone share and still underperform expected touchdowns because of inaccurate quarterback play, difficult target locations (e.g., low-percentage back-shoulder fades), or ordinary variance; the reverse is equally true. The strongest signal comes from combining red-zone share with overall target share, route participation, and evidence that the team itself generates meaningful red-zone passing volume — a high share on a team that rarely reaches the red zone through the air produces fewer actual opportunities than a moderate share on a pass-heavy, high-scoring offense.

### Known Pitfalls and Failure Patterns

**Small-sample volatility.** Red-zone passing plays are sparse relative to a full season of offensive snaps, so a red-zone target share computed over a handful of games is dominated by noise. A receiver can post an extreme share (or zero share) over 2-3 games purely from how a small number of possessions happened to break, without that reflecting a durable role. The share should be read over a meaningfully larger sample (several games and dozens of team red-zone pass attempts) before being trusted as a role signal, and single-game spikes should not be treated as established usage.

**Low red-zone-volume offense trap.** A high share of a team that rarely throws in the red zone can still yield fewer actual high-value targets than a moderate share on a team that reaches the red zone often and passes there frequently. Red zone target share must always be read alongside the team's red-zone pass-attempt volume, not in isolation, to avoid overrating a receiver on a low-opportunity offense.

**Mobile-quarterback suppression.** Offenses with a quarterback who frequently scrambles or keeps the ball via designed runs near the goal line generate fewer red-zone pass attempts overall, which mechanically shrinks the entire pool of red-zone targets available to every receiver on that offense — independent of any individual receiver's talent or role. A receiver's red-zone share is not cleanly comparable across teams with very different quarterback-rushing profiles for this reason.

**Target quality is not captured by raw share.** Not all red-zone targets carry equal value. A target at the 18-yard line has a lower touchdown probability than a target at the 3-yard line or in the end zone itself, and a difficult, low-percentage route (a contested back-shoulder fade) is not equivalent in expected value to a high-percentage schemed throw (a slant or option route) even at the same field position. Raw red-zone target share treats these identically, which is why the tiered inside-10/inside-5/end-zone breakdown is a meaningfully stronger signal than the blanket inside-20 figure.

**Game-script and down-and-distance distortion.** Some offenses pass at a high rate between the 20 and the 10 but shift to a run-heavy approach once inside the 5, meaning a receiver's overall red-zone target share can look strong while his access to the highest-leverage, closest-to-the-goal-line targets is limited. Game state also matters: a team trailing late may generate an unusually high volume of red-zone passing attempts, while a leading team may lean on the run, so a season-long blended share can obscure how a receiver is used across different competitive contexts.

**Injury-driven and temporary role inflation.** A receiver's red-zone share can spike sharply following a teammate's injury or a coverage-driven shift in defensive attention. This kind of spike should not automatically be treated as a new, durable baseline — it may reverse once the full receiving corps returns healthy, and needs to be evaluated the same way any role change should be: confirmed across multiple subsequent games rather than assumed from a single data point.

### Best-Practice Usage

Red zone target share should be treated as a touchdown-upside multiplier layered on top of, not a replacement for, overall target share and route participation. The strongest combined profile is a receiver who holds meaningful overall target share, above-average red-zone share, and — most importantly — real involvement in the inside-10 or inside-5 subset specifically, on a team that generates consistent red-zone passing volume. When evaluating whether a red-zone share is trustworthy, the sample size of underlying team red-zone pass attempts matters as much as the share itself; a share built on a handful of plays should be discounted relative to one built on a full season's worth of red-zone opportunities. Red zone target share pairs naturally with overall target share and air yards share (as tracked in Weighted Opportunity Rating) as a complementary signal specifically addressing the touchdown-equity gap that those broader opportunity metrics do not capture on their own.

---

## Key Decisions

- **Decision:** The platform will calculate and surface red zone target share using team red-zone pass attempts (not all red-zone plays) as the denominator.
  **Reasoning:** Using all red-zone plays as the denominator dilutes the metric with rushing attempts, sacks, and kneels, understating the true share for pass-catchers and making the metric incomparable across teams with different red-zone run/pass tendencies.
  **Rejected alternative:** Using total red-zone plays as the denominator was rejected because it does not isolate passing-game opportunity, which is the entire purpose of the metric.

- **Decision:** The platform will surface a tiered red-zone breakdown (inside-20, inside-10, inside-5) rather than a single blanket red-zone target share figure.
  **Reasoning:** Touchdown probability rises sharply as the line of scrimmage compresses, and a single inside-20 number can mask a receiver's actual access (or lack of access) to the highest-value inside-10 and inside-5 targets specifically, which is the more predictive signal for touchdown upside.
  **Rejected alternative:** Reporting only the single inside-20 figure was rejected as the industry-default oversimplification that this platform can improve on given available play-by-play granularity.

- **Decision:** The platform will require a minimum sample of team red-zone pass attempts before surfacing a red zone target share as a stable role indicator, flagging shares built on very small samples as provisional.
  **Reasoning:** Red-zone passing volume is sparse per team-season, and every independently corroborated source on this metric identifies small-sample volatility as its dominant failure mode; presenting an unflagged, noise-dominated share risks misleading users into overreacting to short-sample spikes.
  **Rejected alternative:** Displaying raw, unflagged red zone target share regardless of sample size was rejected as the default pattern most likely to produce false signals.

- **Decision:** The platform will display red zone target share alongside team red-zone pass-attempt volume rather than as an isolated percentage.
  **Reasoning:** A high share on a low-red-zone-pass-volume offense produces fewer actual high-value opportunities than a moderate share on a high-volume offense; showing the underlying team volume prevents users from overrating receivers on low-opportunity offenses.
  **Rejected alternative:** Displaying red zone target share as a standalone ranked figure was rejected because it would systematically overrate receivers on offenses that rarely throw in the red zone.

---

## Open Questions

- [ ] What is the platform's threshold for a "stable" red zone target share sample — how many team red-zone pass attempts are required before the metric should be treated as a reliable role signal rather than provisional? — needs backtesting once the platform has sufficient historical red-zone play-by-play data.
- [ ] Should red-zone targets be weighted by field position within the zone (e.g., an end-zone target counted as more valuable than a target from the 19-yard line) to build a single "expected red-zone touchdown" figure, rather than treating all inside-20 targets as equal within each tier? — flagged as a plausible refinement with no settled public methodology identified.
- [ ] Does red zone target share reflect a durable, receiver-attributable skill (contested-catch ability, size, separation near the goal line) or is it primarily a function of offensive scheme and quarterback preference that resets with coaching or personnel changes? — genuinely unresolved across sources; treat year-over-year projection of this metric with corresponding caution.
- [ ] How should the platform handle red-zone target share for receivers who benefit from a teammate's injury — at what point should an elevated share be treated as a new baseline rather than a temporary role bump? — needs a corroboration-window rule (e.g., minimum consecutive games) once the platform has role-change historical data to validate against.
