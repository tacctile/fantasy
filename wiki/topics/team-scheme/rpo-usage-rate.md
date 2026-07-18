---
title: "RPO Usage Rate"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - rpo
  - offensive-scheme
  - play-action
  - target-depth
  - opportunity
related:
  - team-scheme/play-action-rate
  - team-scheme/proe
  - team-scheme/offensive-line-blocking-efficiency
  - team-scheme/motion-usage-rate
---

## Summary

RPO usage rate measures how often an offense runs a play design that gives the quarterback a genuine post-snap (or mesh-point) choice between a designed run and a quick pass, based on a read of a specific conflict defender. It is a scheme diagnostic rather than a volume statistic: the same offensive snap can produce a running back carry, a quarterback keep, or a receiver target depending entirely on the defense's post-snap behavior, which means RPO-heavy offenses systematically break traditional snap-share and target-share opportunity models. Every source converges on the same central classification problem — there is no industry-standard definition, and providers disagree substantially on whether to include play-action-style fakes, pre-snap "gift" access throws, pure read-option keepers, and quarterback scrambles under the RPO label, producing materially different reported rates for the same team. The metric is most useful when decomposed into its outcome branches (pass, handoff, keep) and tied to the specific player attached to each branch, rather than cited as a single team-level percentage.

## Core Knowledge

### Definition and Calculation

$$\text{RPO Usage Rate} = \frac{\text{RPO Snaps}}{\text{Total Offensive Snaps}}$$

The basic team-level formula is straightforward, but the denominator and numerator both vary meaningfully across use cases and providers. Common denominator variants include total offensive plays, dropbacks only, designed runs only, or "eligible" plays that exclude kneels, spikes, aborted snaps, and obvious garbage-time situations. For player-level analysis, sources converge on decomposing the team rate into outcome branches:

$$\text{RPO Pass Rate} = \frac{\text{RPO Plays Ending in a Pass Attempt}}{\text{RPO Snaps}}$$

$$\text{RPO Handoff (Give) Rate} = \frac{\text{RPO Plays Ending in a Handoff}}{\text{RPO Snaps}}$$

$$\text{RPO Keep Rate} = \frac{\text{RPO Plays Ending in a QB Keep}}{\text{RPO Snaps}}$$

These three branches should sum to approximately 1, with the gap accounted for by sacks, aborted plays, and penalties. This decomposition is the single most load-bearing idea across sources: a team's raw RPO rate says nothing about fantasy impact without knowing which branch is being selected and which player owns each branch. A high RPO rate paired with a QB who mostly hands off produces a very different fantasy environment (efficient RB volume, light boxes) than a high RPO rate paired with a QB who frequently pulls and throws (suppressed RB carries, elevated short-area WR/TE targets).

### Core Mechanics

An RPO combines three elements that must all be present: a called run concept (commonly inside/outside zone, split zone, power, or counter) blocked as a run by the offensive line; an attached quick-pass option (bubble, now-screen, slant, glance, stick, or flat route) run by one or more receivers; and a post-snap read of a specific conflict defender — typically a second-level linebacker, overhang/apex defender, or safety. The offense puts that defender in a bind: if he fills the run lane, the quarterback throws behind or outside him; if he widens or drops to cover the pass, the quarterback hands off or keeps.

Because the offensive line is run-blocking, the ball must come out very quickly if the quarterback throws (commonly under ~1.5–2.5 seconds) to avoid an ineligible-receiver-downfield penalty, since linemen cannot legally be more than one yard past the line of scrimmage when a forward pass beyond the line is thrown. This constrains RPO passing concepts almost exclusively to short, quick-developing routes — sources agree RPO throws rarely target beyond ~7-10 air yards and essentially never attack the deep or intermediate middle of the field the way play-action does.

### Platform and Provider Differences

- **No universal public taxonomy exists.** This is the most consistently cited fact across sources: PFF, SIS, Next Gen Stats/tracking-based classification, and public play-by-play data all define and identify RPOs differently, and cross-source rate comparisons for the same team are not reliable without knowing each provider's exact inclusion rules.
- **Human film-charting providers** (the family PFF and SIS belong to) identify RPOs by evaluating offensive line run-blocking behavior, the quarterback's mesh-point mechanics and eyes, and the attached route concept, generally distinguishing "intent" (was this designed as an RPO) from "execution" (did the QB actually exercise the option). This charting-based approach is generally considered the most useful for scheme-identity and fantasy-projection purposes because it captures the underlying design even when the final result is a simple handoff.
- **Tracking-data-based classification** (associated with player-tracking/chip data) infers RPOs from spatial and kinematic signals — quarterback-running back mesh-point duration, immediate downfield lineman movement, conflict-defender recovery angles — which is more objective but can misclassify plays, particularly confusing true RPOs with play-action passes where linemen also show run-blocking action but no genuine post-snap option exists. Public tracking products have not historically exposed a consistently documented, directly comparable RPO-usage field.
- **Public play-by-play and official NFL gamebooks do not identify RPOs at all.** They record only the final result (rush, pass attempt, sack), so any RPO rate derived from box-score data alone is an inference from proxy signals (shotgun run/pass mix, quick time-to-throw, short target depth) rather than a measurement of the actual play design, and carries meaningfully higher false-positive/false-negative risk than charted data.
- **The single largest documented source of cross-provider disagreement is the numerator, not the formula.** Sources repeatedly identify the same set of ambiguous plays that different charters classify differently: pre-snap "gift"/access throws where the QB's decision is arguably made before the snap; pure read-option plays with a run/keep choice but no pass option; play-action passes that superficially resemble RPOs; designed screens with run-action window dressing; and plays where the QB is sacked or the play is aborted before the read completes. A reported team RPO rate of roughly high-single-digits to low-20s percent of offensive plays is plausible under most charted methodologies, but the exact figure for any given team-season should not be treated as precisely comparable across sources without confirming definitions.

### Edge Cases, Failure Patterns, and Pitfalls

- **RPO vs. play-action confusion is the most common and consequential misclassification.** Play-action is a called pass in which the quarterback fakes a handoff and is expected to throw; the offensive line typically pass-protects or uses controlled run-action rules. An RPO is a genuine run/pass decision with the line run-blocking. The practical fantasy consequence is large: play-action passes tend to be slower-developing and target intermediate/deep routes, elevating explosive-pass and yardage ceiling, while RPO passes are fast, short, high-completion-percentage throws that raise floor but not ceiling. Lumping the two together — which some providers and casual analysts do — materially misrepresents both a quarterback's and a receiver's downfield/explosive-play profile.
- **RPO vs. read-option confusion.** A read-option (including zone-read) gives the quarterback a run/keep choice only, with no pass option; some charting conventions loosely apply "RPO" to any packaged run concept including these plays. This matters because read-option affects only the RB/QB rushing split, while a true pass-inclusive RPO also redistributes opportunity to receivers and tight ends.
- **Pre-snap "gift" or access throws are a genuine borderline case.** If the quarterback sees a favorable pre-snap alignment (soft cushion, numbers advantage) and throws immediately, the decision may have been effectively made before the snap rather than being a true post-snap read. Some providers count these as RPOs because they are packaged with a run call; others separate them. Fantasy implication: gift-throw-heavy target volume can look stable against defenses that keep conceding access but disappears against defenses that press or rotate late — this volume is more opponent-dependent than route-earned target share.
- **Quarterback scrambles should not be counted as RPO keeps.** A scramble occurs when a pocket passer's dropback breaks down and he runs out of necessity; a designed RPO keep is a scheme-intentional decision. Conflating the two overstates a quarterback's designed rushing floor and understates how much of his rushing production is scheme-dependent versus improvisational.
- **Sacks and penalties require explicit handling.** A quarterback who holds the ball too long on an RPO read can be sacked, and offensive linemen who release downfield too early on an intended RPO pass can draw an ineligible-receiver-downfield penalty — a failure mode largely unique to this play type given the run-blocking requirement. Different providers handle whether these plays count toward the RPO denominator inconsistently; for realized-production fantasy models, sacked/penalized plays should generally be excluded from counted carries/targets even if retained for scheme-tendency analysis.
- **Game script and down-and-distance strongly suppress RPO usage.** RPOs are concentrated on early downs and manageable distances in competitive game states; usage collapses in obvious passing situations (third-and-long) and in lopsided game scripts (large deficits force pure dropback mode; large leads shift to conventional clock-control runs). A season-long blended RPO rate can meaningfully understate or overstate the offense's current-week tendency, and neutral-script, early-down, or red-zone/goal-line-specific rates are more actionable than the season aggregate.
- **Red-zone and goal-line RPO usage is disproportionately important relative to its snap count.** A team's overall RPO rate can conceal a much higher (or lower) red-zone rate; because touchdown outcomes are decided in a small number of plays, a modest sample of goal-line RPOs concentrated on a specific tight end or slot receiver can matter more for touchdown-dependent player valuation than dozens of low-leverage midfield RPOs.
- **Quarterback and coordinator changes should sharply discount historical team RPO data.** RPO branch selection (how often the QB throws vs. hands off vs. keeps) is heavily QB-specific — dependent on the individual quarterback's read speed, accuracy, decisiveness, and rushing threat — and a new offensive coordinator can retain RPO terminology while changing the read defender, attached concept, or QB's authority to pull the ball. Prior-season team-level RPO tendencies should not be assumed to transfer across a quarterback or coordinator change.
- **The "decoy" problem understates true role importance.** A running back or receiver can be central to an RPO's defensive-conflict mechanism (forcing a linebacker or safety to hesitate) while rarely receiving the ball on that specific play. Models based purely on realized carries/targets can misread a declining touch share as a diminished role when the player may still be functioning as a load-bearing conflict piece that enables other production.

### Fantasy Application by Position

**Running backs:** Effects are not uniformly positive or negative. RPOs can improve rushing efficiency by discouraging loaded boxes (the pass threat holds defenders), but a quarterback with a high pull-and-throw tendency converts called runs into passes, directly reducing carry volume for the back. The determining factor is the team's RPO handoff rate and the specific back's share of those handoffs, not the team's overall RPO rate. Goal-line RPOs can shift short-yardage touchdown opportunity away from the back toward quarterback keeps or quick passes to a tight end or slot receiver.

**Wide receivers and tight ends:** Benefit is concentrated on the specific player(s) structurally attached to the pass option (commonly a slot receiver or tight end running glance, slant, stick, or bubble/flat concepts), not distributed evenly across the receiving corps. Attached players gain a designed, relatively stable target-access mechanism independent of full-field progression reads, typically with high catch probability but low target depth — valuable for PPR floor, less valuable for yardage/explosive-play ceiling. Non-attached receivers running clear-out routes on RPO snaps see no direct benefit and may see reduced overall route diversity if the offense leans heavily on the concept.

**Quarterbacks:** RPOs generally improve real-football efficiency (higher completion percentage, lower sack rate, faster decisions) but do not straightforwardly raise fantasy ceiling, since they typically substitute for conventional downfield dropbacks rather than adding to total pass volume. A quarterback whose designed-run threat is credible (mobile, real keep threat) unlocks more value from the same RPO rate than a pure pocket passer, because the keep branch adds rushing floor. RPO efficiency should be evaluated as additive to, not a replacement for, evaluating a quarterback's non-RPO dropback aggression and downfield volume.

## Key Decisions

- **Decision:** The platform will not use a single team-level RPO usage rate as a standalone opportunity input. It will require RPO data (where available) to be decomposed into pass/handoff/keep branch rates before being applied to any individual player's projection.
  **Reasoning:** Every source converges that the same team-level RPO rate produces materially different fantasy outcomes depending on branch distribution, and the branch, not the raw rate, determines whether a specific back, receiver, or quarterback benefits.
  **Rejected alternative:** Applying team RPO rate as a direct positive or negative multiplier on running back or receiver volume was rejected because no source supports a reliable, generalizable directional relationship independent of branch selection and the individual player's attached role.

- **Decision:** The platform will explicitly distinguish RPO plays from play-action plays and from pure read-option plays in any scheme data it surfaces, and will flag when a data source's classification is ambiguous or unknown rather than silently blending categories.
  **Reasoning:** RPO/play-action conflation is identified as the most common and consequential misclassification across sources, with materially different implications for target depth and explosive-play ceiling; RPO/read-option conflation similarly misattributes rushing-only effects to receiver opportunity.
  **Rejected alternative:** Treating "run-action passing concepts" as a single unified category was rejected because it would erase the floor-versus-ceiling distinction that is the primary fantasy-relevant signal these concepts carry.

- **Decision:** The platform will weight red-zone and goal-line RPO usage/branch data more heavily than season-long aggregate RPO rate when evaluating touchdown-dependent player value (particularly for tight ends and secondary receivers).
  **Reasoning:** Sources converge that touchdown outcomes are disproportionately sensitive to a small number of high-leverage plays, and a team's overall RPO rate can conceal a very different red-zone-specific tendency that matters more for scoring projection.
  **Rejected alternative:** Using only season-aggregate RPO rate for all projection purposes was rejected because it treats all RPO snaps as equally fantasy-relevant regardless of field position and leverage, which sources explicitly warn against.

- **Decision:** The platform will discount (lower confidence weight on) historical team RPO tendency data immediately following a quarterback or offensive coordinator change, rather than carrying prior-season rates forward unadjusted.
  **Reasoning:** Branch selection within RPOs is described across sources as heavily individual-QB-dependent (read speed, decisiveness, rushing threat) and coordinator-dependent (choice of read defender, attached concept); a new player or play-caller in an otherwise unchanged scheme can produce a materially different branch distribution.
  **Rejected alternative:** Treating RPO tendencies as a stable team-level trait independent of personnel was rejected as unsupported by any source and contradicted by the QB-dependence and coordinator-dependence points raised across all six.

## Open Questions

- Is RPO usage rate independently predictive of fantasy outcomes, or is it primarily a descriptive artifact of offenses that already have identifiable traits (mobile quarterback, shotgun-heavy structure, efficient offensive line, aggressive quick game)? Sources note this causal-identification problem without resolving it — team RPO tendency and quarterback mobility/skill are likely confounded rather than cleanly separable from public data.
- How should decoy involvement (a player who occupies the defensive conflict mechanism without receiving the ball) be credited in opportunity models? No source offers an established method for valuing this non-realized-touch contribution, and standard fantasy models based on realized carries/targets structurally cannot capture it.
- What is the correct stabilization sample size for player-level RPO branch share (e.g., a receiver's share of team RPO targets)? Sources agree it is noisier and slower to stabilize than conventional route-based target share, particularly because branch outcomes are partly opponent-dependent (defensive alignment on a given week), but no specific game-count threshold is established.
- How much of a defense's response to RPOs (late rotation, disguised coverage, "slow-playing" the conflict defender) is currently reflected in public fantasy analysis? Sources agree defensive counter-adaptation is a live, evolving tension that materially affects week-to-week RPO branch outcomes but is not yet well modeled in accessible data.
- Should pre-snap "gift" access throws be classified with true post-snap RPO reads for player-evaluation purposes, or tracked as a separate, more opponent-volatile category? Sources are split on inclusion convention with no resolved consensus.

---

_End of rpo-usage-rate.md_
