---
title: "Motion Usage Rate"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - motion-rate
  - offensive-scheme
  - epa
  - opportunity
related:
  - team-scheme/play-action-rate
  - team-scheme/rpo-usage-rate
  - team-scheme/proe
---

## Summary

Motion usage rate measures the share of offensive snaps on which a player moves pre-snap after the formation is set — jet motion, orbit motion, across-the-formation motion, and similar movement types — used as a proxy for scheme sophistication because it forces defenses to reveal coverage and creates leverage or timing advantages for receivers. Every source converges on the same central classification problem that dominates this metric more than any other team-scheme statistic covered so far: providers disagree fundamentally on whether a "shift" (players changing alignment and resetting before the snap) counts as motion, and this single definitional choice alone produces double-digit percentage-point discrepancies in reported team rates between providers. The second major convergent finding is a strong confounding problem: motion correlates with higher quarterback efficiency (EPA per play) across sources, but because motion is not randomly assigned — good teams, mobile quarterbacks, and skilled receivers are more likely to be in motion-heavy schemes — the causal contribution of motion itself, independent of the talent and scheme already producing that correlation, is unresolved.

## Core Knowledge

### Definition and Calculation

$$\text{Motion Rate} = \frac{\text{Plays with Pre-Snap Motion}}{\text{Total Eligible Offensive Plays}}$$

A more useful decomposition separates motion by type, since the mechanism and fantasy implication differ meaningfully across categories:

- **Jet motion:** a receiver running at full speed parallel to the line of scrimmage, often into a handoff, screen, or as a decoy.
- **Orbit motion:** a player looping behind the quarterback.
- **Across-the-formation motion:** a player crossing from one side of the formation to the other, commonly used to identify man versus zone coverage by watching whether a defender follows.
- **Shift:** a formation change where the player resets and comes fully set before the snap — some providers exclude this from "motion" entirely; others include it, which is the single largest source of cross-provider rate disagreement.
- **Return motion:** a player who moves and returns close to the original position.
- **Read motion:** motion whose defensive reaction directly triggers a run/pass decision, overlapping conceptually with run-pass option design.

Motion functions through several distinct mechanisms rather than a single effect: it can reveal coverage shell (a defender trailing a motioning receiver signals man coverage; a defender staying put signals zone), create physical leverage or a running start for the receiver, manipulate run-game numbers and gap assignments, assist pass-blocking identification, and force defensive communication and substitution. Sources are explicit that motion rate itself should not be read as a direct measure of offensive sophistication — it is a tool whose value depends entirely on when, why, and how effectively it is deployed, and a team can post a high motion rate for reasons unrelated to scheme quality, including disorganized pre-snap operation or a need to manufacture answers for a limited quarterback.

### Platform and Provider Differences

- **The shift-versus-motion distinction is the dominant, most consequential source of disagreement**, cited across essentially every source as the largest driver of cross-provider rate variance. Providers that count any pre-snap movement (including shifts that fully reset before the snap) report meaningfully higher rates than providers that require the player to still be moving at the snap. This single definitional choice alone can produce large percentage-point gaps in a team's reported rate for the same games, particularly for offenses built around formation shifts (commonly associated with wide-zone/Shanahan-tree schemes) as opposed to live motion at the snap.
- **Motion-at-the-snap versus total pre-snap motion** is a related but distinct split: some public efficiency metrics isolate motion still occurring when the ball is snapped (argued by some sources to have the strongest, most direct causal link to receiver separation and reduced press coverage), while others aggregate all pre-snap movement regardless of whether it has stopped by the snap. Total-motion figures act as noise relative to motion-at-the-snap figures when the specific goal is projecting receiver efficiency.
- **Motion type and direction are inconsistently published.** Some providers report only a binary motion indicator per play; others break out motion by type (jet, orbit, shift), by direction (toward the boundary versus toward the field, which has different tactical implications for man- versus zone-beating concepts), and by the specific player's identity. The more granular data is materially more useful for player-level fantasy analysis but is not consistently available across sources.
- **Player identity attribution can differ** when a mover's nominal position is ambiguous (a hybrid tight end/receiver, for example), producing different position-level motion tallies across providers for the same play.
- **Automated tracking-data detection versus human film charting** trades off differently: tracking-based classification is more consistent at detecting raw movement but can be less reliable on subtle shifts, occlusion, or ambiguous player identity, while charting-based classification applies more consistent judgment on borderline cases but introduces its own subjectivity.
- Because of this range of differences, exact cross-platform motion-rate comparisons require matching the denominator, the shift/motion boundary, treatment of nullified plays, and whether multiple motion events on a single play are counted once or multiple times.

### Edge Cases, Failure Patterns, and Pitfalls

- **Motion is not a direct measure of scheme sophistication.** A high motion rate can reflect genuine scheme design, but it can equally reflect disorganized pre-snap communication, a need to give a limited quarterback extra pre-snap reads, or an offensive line that needs additional time to identify blitz assignments. The raw rate alone cannot distinguish these causes.
- **Talent and scheme confounding.** Motion-heavy offenses are also frequently more efficient on outside zone, more aggressive with play-action, more likely to feature mobile quarterbacks, and generally better coached or more talented at the skill positions — all correlated advantages that a raw motion-versus-no-motion efficiency comparison will incorrectly attribute to motion itself unless the comparison controls for down, distance, field position, personnel, formation, opponent, and quarterback.
- **Jet motion on run plays inflates the rate without the associated pass-efficiency benefit.** A jet sweep handoff counts as a motion play but is fundamentally a run, and a team that uses several jet sweeps per game raises its aggregate motion rate without improving quarterback efficiency. Sources recommend isolating motion rate on pass plays specifically (or early-down pass plays) when using the metric as a proxy for quarterback support, since aggregate motion rate blends run-oriented and pass-oriented motion together.
- **Motion as a pure decoy.** A receiver can motion across the formation to manipulate coverage or hold a defender without ever becoming a target on that play — genuinely useful to the team's overall offense but generating no direct fantasy value for the motioning player. High personal motion involvement does not automatically translate to target opportunity for that specific player.
- **Down-and-distance sensitivity.** Motion is generally described as most effective on early downs, when the defense has more variables to process and more to lose from a busted assignment; on third-and-long, the defense already knows a pass is likely, reducing the incremental value of a coverage-revealing motion. A team's motion rate by down is a more informative signal than the aggregate rate.
- **False start and operational risk.** Motion, particularly heavy or frequent motion, carries an elevated risk of penalty (illegal motion, false start, or timing errors), and offenses with high motion rates are described as carrying somewhat higher false-start exposure — a cost that should be weighed against any efficiency gain when evaluating whether a team's motion usage is net positive.
- **Small-sample and personnel volatility.** Motion usage can shift quickly with a new quarterback, a new offensive coordinator, a key skill-player injury, opponent-specific game planning, or a change from neutral to lopsided game states, making single-game or early-season motion-rate samples unreliable indicators of a team's stable offensive identity.
- **Defensive adaptation is an active, evolving countertrend.** As defenses increasingly train to "pass off" or "swap" coverage responsibilities on a motioning player rather than following him individually across the formation, some of motion's traditional coverage-revealing advantage is eroding. Multiple sources flag this as a live, unresolved tension rather than a settled historical advantage.

### Fantasy Application

Motion rate is most useful as a role amplifier layered on top of direct opportunity metrics, not as a standalone target or efficiency predictor. For quarterbacks, motion (particularly motion still occurring at the snap, on early-down pass plays) supports higher completion percentage and more favorable pre-snap reads, but the fantasy-relevant question is whether this translates into more efficient existing volume rather than added volume. For receivers, the identity and destination of the motioning player matters far more than the team's aggregate rate — a receiver who personally motions on a high share of his routes carries a different signal than a teammate on the same team who rarely moves, and motion toward the field side versus the boundary implies different route-concept intent (zone-beating versus man-beating, respectively). Motion should be paired with route participation, target rate, and target quality (route depth, catch probability) rather than treated as an independent positive multiplier, since motion frequently functions as a decoy or coverage-manipulation tool that benefits the offense as a whole without generating a target for the specific player in motion.

## Key Decisions

- **Decision:** The platform will define and consistently disclose whether its motion-rate figures include shifts (formation resets that settle before the snap) or are restricted to true pre-snap motion continuing toward or through the snap, and will treat these as two distinct, separately labeled figures rather than a single blended rate.
  **Reasoning:** The shift-versus-motion boundary is documented as the single largest source of cross-provider disagreement on this metric; an undisclosed internal convention would make the platform's motion figures non-comparable to external sources users may already reference.
  **Rejected alternative:** Adopting a single unified "any pre-snap movement" definition without disclosure was rejected because it silently blends two categories with materially different efficiency implications and would misrepresent teams whose primary scheme signature is shifting rather than live motion, or vice versa.

- **Decision:** The platform will report motion rate segmented by play type (pass versus run) as the default view rather than a single aggregate rate.
  **Reasoning:** Jet-motion run plays inflate aggregate motion rate without producing the passing-efficiency benefit the metric is typically used to signal; segmenting by play type isolates the pass-supportive use of motion from the run-game use, which have different fantasy implications.
  **Rejected alternative:** Surfacing only a single blended motion rate was rejected because it would systematically overstate a run-motion-heavy team's passing-game sophistication.

- **Decision:** The platform will track player-specific motion participation (the rate at which an individual player is the one in motion) as a distinct data point from team-level motion rate, and will not use team motion rate as a direct input to individual player target or efficiency projections without this player-level layer.
  **Reasoning:** Sources converge that team-level motion rate is a weak standalone predictor of any specific player's fantasy production; the identity, destination, and role of the specific motioning player is the materially more decision-useful signal.
  **Rejected alternative:** Applying team motion rate as a blanket positive multiplier across all pass-catchers on a given offense was rejected as unsupported — motion frequently functions as a decoy or coverage-manipulation mechanism that benefits teammates rather than the mover himself.

## Open Questions

- How much of the observed motion-to-efficiency correlation is causal (motion itself creating the advantage) versus confounded by the correlated presence of skilled quarterbacks, talented receivers, and generally more sophisticated coaching staffs that also happen to use more motion? This is described as a central, unresolved tension across sources.
- Is there a saturation or diminishing-returns point beyond which additional motion no longer provides a defensive-identification advantage because defenses have adapted to "pass off" or "swap" assignments on motioning players rather than following them? Sources flag this as an active and evolving question without a settled answer.
- Whether motion rate's predictive value is stable or declining league-wide as defensive coordinators increasingly train to neutralize motion's coverage-revealing benefit is not resolved and may require ongoing re-evaluation rather than a fixed conclusion.
- How much team-level motion tendency persists across a coordinator or quarterback change, versus resetting under new offensive leadership, is inconsistently addressed across sources.
- Whether motion's fantasy-relevant value is more stable or more volatile inside the red zone (where field compression changes the mechanics of coverage manipulation) compared to between the twenties is not established in available sources.

---

_End of motion-usage-rate.md_
