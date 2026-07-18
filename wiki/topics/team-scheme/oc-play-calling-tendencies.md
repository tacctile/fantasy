---
title: "Coaching / OC Play-Calling Tendencies"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - oc-tendencies
  - offensive-scheme
  - target-distribution
  - personnel-groupings
  - proe
  - route-participation
  - depth-chart
related:
  - team-scheme/personnel-grouping-tendencies
  - team-scheme/motion-usage-rate
  - team-scheme/proe
  - team-scheme/play-action-rate
  - team-scheme/rpo-usage-rate
  - team-scheme/offensive-scheme-identity
  - team-scheme/target-distribution-concentration
---

## Summary

An offensive coordinator's tendency profile is a multi-dimensional set of conditional play-calling probabilities — pass/run split by situation, personnel grouping, target distribution, tempo, and formation usage — used to re-project player opportunity when a coordinator changes teams. Every source converges on the same central caution: raw career-average tendencies are not portable on their own, because observed offensive output is jointly produced by coordinator preference, head-coach authority, quarterback quality, personnel fit, and game script, and separating these requires situation-neutral, opponent- and script-adjusted data rather than raw season totals. The single most-repeated actionable principle is to identify who actually calls plays (which is not always the titled OC) before applying any historical tendency data at all.

## Core Knowledge

### The Tendency Vector

Serious OC analysis decomposes play-calling into distinct, largely independent dimensions rather than a single "pass-heavy vs. run-heavy" label:

- **Situational pass/run split** — pass rate by down, distance, field position, and score state, not season-long aggregate.
- **Pass Rate Over Expected (PROE)** — actual pass rate minus a model-predicted expected pass rate given situation; this is consistently identified as more portable across teams and seasons than raw pass rate, since it isolates play-calling aggressiveness from the game states a team happens to face.

$$\text{PROE} = \text{Actual Pass Rate} - \text{Expected Pass Rate Given Situation}$$

- **Personnel grouping usage** — frequency of 11 (1RB/1TE/3WR), 12 (1RB/2TE/2WR), 21 (2RB/1TE/2WR), and other packages, which sets a structural ceiling on which positions can receive volume (see personnel-grouping-tendencies).
- **Tempo and pace** — plays per game, seconds per snap, no-huddle rate; independently scales total volume for every skill player regardless of pass/run mix.
- **Target distribution** — share of targets by position and by concentration (e.g., how evenly targets spread across WR1/WR2/WR3), which should be evaluated separately from route participation and target rate per route run.
- **Formation, motion, and play-design mix** — play-action rate, RPO rate, designed QB run rate, motion/shift rate; these affect efficiency and explosive-play generation more than raw volume.
- **Red-zone- and short-yardage-specific tendencies** — play-calling near the goal line frequently diverges sharply from between-the-20s tendencies and should be modeled separately (see red-zone-efficiency-team).

### The Attribution Problem

Observed offensive output should be understood as:

$$\text{Observed Offense} = \text{Coordinator Preference} + \text{Head-Coach Constraint} + \text{Personnel Fit} + \text{Quarterback Influence} + \text{Game Script} + \text{Opponent Response}$$

The most consistently repeated pitfall across sources is treating the titled "offensive coordinator" as the source of observed tendencies without first confirming who actually calls plays. Many head coaches call their own plays (e.g., Shanahan-tree, McVay-tree coaches) or retain veto authority over philosophy even when delegating; when a team hires a new OC under an unchanged, play-calling head coach, the new OC's historical tendencies from a prior job are largely irrelevant, and the correct unit of historical analysis is the play-caller, not the job title.

### Fantasy-Relevant Translation

Player opportunity from a coordinator's tendencies should be modeled through explicit mechanisms rather than applied as a blanket label:

$$\text{Expected Targets} = \text{Team Pass Attempts} \times \text{Route Participation} \times \text{Target Rate per Route Run}$$

$$\text{Expected Carries} = \text{Team Rush Attempts} \times \text{Backfield Opportunity Share}$$

A coordinator change can move total team pass attempts (via PROE and pace) without moving an individual player's fantasy value if route participation, target competition, personnel deployment, or red-zone role change in an offsetting direction. Generic labels like "pass-happy" or "run-heavy" conceal which specific mechanism is actually driving a player's opportunity change and should not be treated as sufficient for player-level projection.

### Platform and Provider Differences

- **Granularity varies by provider focus.** Sharp Football Analysis and similar situational-data providers are strongest for filtered pass/run splits (by score, quarter, down, distance) and popularized the "neutral script" framing (competitive score margin, first three quarters) as the standard correction to raw season-long rates. PFF is strongest for formation, personnel, and motion charting depth, including signature-stats-level detail on play-action and pre-snap movement, but has limited "career tendency" rollups for coordinators who changed teams. FTN/legacy-Football-Outsiders-lineage data is strongest for league-adjusted tendency tracking (how far a team deviates from league average) rather than raw rates.
- **Play-type classification is inconsistent across charting systems.** Whether a broken-down designed pass that becomes a QB scramble counts toward pass-rate/PROE calculations differs by provider — some treat it as a pass by play intent, others by rushing result. RPO plays that result in a handoff are similarly charted inconsistently as run or pass depending on provider convention. Sacks should be included in dropback rate for accurate play-calling analysis but are handled inconsistently across sources.
- **Personnel and formation classification differs when players motion pre-snap**, creating disagreement about which personnel grouping a play should be credited to — nominal (pre-snap) grouping versus final (post-motion) alignment.
- **Target-share denominators vary** — some platforms compute target share against official team pass attempts, others against total team targets (which can diverge slightly due to nullified plays), producing small but real cross-platform discrepancies.
- **No single provider dominates all dimensions.** Multiple sources converge that combining at least two data sources (a situational-splits provider and a formation/personnel-charting provider) is standard practice for serious OC tendency analysis.

### Edge Cases, Failure Patterns, and Known Pitfalls

- **The HC/OC overlap problem.** When the head coach retains play-calling authority, the titled OC's historical tendencies are close to meaningless for projection purposes; the correct question is always "who calls the plays," not "who holds the OC title."
- **Small-sample distortion for new coordinators.** The first 4–8 games of a new OC's tenure — especially a first-time play-caller — reflect installation, personnel discovery, and adjustment rather than settled philosophy; projecting from an early-season sample is a common and consistently flagged error.
- **Personnel-driven vs. philosophy-driven tendencies are frequently conflated.** An OC's historical personnel usage (e.g., heavy 12 personnel) may reflect the specific tight-end talent on a prior roster rather than a portable preference; roster quality and fit should be weighted at least as heavily as historical rate when an OC changes teams.
- **Game-script correlation with tendency is the most common raw-data error.** A team that trailed frequently in a given season will show an inflated pass rate in full-season data; using unfiltered season-long pass rate without a neutral-script correction consistently overstates how "pass-happy" a coordinator actually is.
- **Quarterback influence confounds attribution.** Elite quarterbacks audible and check down at high rates, meaning the coordinator's called play is frequently overridden pre- or post-snap; how much of an observed tendency reflects the coordinator versus the quarterback is not cleanly separable with public data.
- **Coaching-tree assumptions are weaker than commonly believed.** Coaches who worked under the same scheme lineage (e.g., the Shanahan coaching tree) can diverge substantially in specific tendencies (personnel usage, target distribution) even while sharing broad structural DNA (outside zone runs, play-action boot concepts); tree lineage predicts structure, not detailed tendency profiles.
- **League-wide year-over-year shifts invalidate stale comparisons.** League-average pass rate, motion rate, and personnel usage change season to season; comparing a coordinator's tendencies from several years ago to a current-season baseline without adjusting for league context produces an invalid comparison. The correct framing is always deviation from that season's league average.
- **Injury-driven tendency shifts should not be projected forward.** A coordinator forced into a specific approach (more screens, more quick game) by an injured starter should not be assumed to retain that approach once personnel is healthy.

### Fantasy Application

When an OC or play-caller changes teams, the platform's projection workflow should proceed in this order: (1) confirm who actually calls plays, since title alone is unreliable; (2) apply PROE and neutral-script pace as the primary team-volume signal, since these are the most portable tendency measures; (3) apply personnel-grouping history only after adjusting for the new roster's actual personnel fit; (4) treat target-distribution and red-zone tendencies as the least portable dimension, since these depend heavily on which specific players are on the new roster; (5) re-weight toward current-season observed usage as soon as a meaningful in-season sample (roughly 6–8 games) accumulates, since actual role evidence should override historical reputation once available.

## Key Decisions

- **Decision:** The platform will attribute historical play-calling tendencies to the confirmed play-caller (which may be the head coach), not to the titled offensive coordinator by default.
  **Reasoning:** Multiple sources identify this as the single most common and highest-impact attribution error in OC analysis; when a play-calling head coach retains authority, a newly hired OC's historical tendencies carry little to no predictive value.
  **Rejected alternative:** Defaulting to job title (OC) as the unit of tendency attribution was rejected because it would systematically mislead projections whenever the head coach is the actual play-caller, a common and identifiable NFL arrangement.

- **Decision:** The platform will use Pass Rate Over Expected (PROE) and neutral-script pace, not raw season-long pass rate, as the primary portable signal when projecting a coordinator's tendencies onto a new team.
  **Reasoning:** Every source that addresses portability identifies PROE as more stable across situational and roster context than raw pass rate, since it isolates aggressiveness from the specific game states a team's schedule and quality happened to produce.
  **Rejected alternative:** Using raw historical pass/run ratio directly was rejected because it conflates coordinator philosophy with game-script and opponent effects specific to the prior team and season.

- **Decision:** The platform will down-weight a coordinator's historical target-distribution and personnel-grouping tendencies when personnel quality changes materially between the old and new roster, applying a personnel-fit adjustment rather than a direct transplant of historical rates.
  **Reasoning:** Sources converge that target distribution and personnel usage are the least portable tendency dimensions, since they are substantially shaped by which specific players (e.g., a strong tight-end room versus a weak one) were available on the prior roster.
  **Rejected alternative:** Direct transplantation of historical target-share percentages onto a new roster was rejected as producing systematically overconfident projections whenever personnel quality differs meaningfully from the coordinator's prior situation.

- **Decision:** The platform will require a minimum in-season sample (approximately 6–8 games) of actual play-calling data before fully overriding a preseason coordinator-change projection with current-season observed tendencies, and will begin blending observed data in progressively before that threshold.
  **Reasoning:** Sources consistently flag the first several games of a new coordinator's tenure as an installation/discovery period that does not reliably reflect settled philosophy, while also noting that role evidence should eventually override historical reputation once a meaningful sample exists.
  **Rejected alternative:** Either fully trusting preseason historical projections all season, or fully overriding them after only 1–2 games of new data, were both rejected as failing to balance early-season noise against genuine in-season adaptation.

## Open Questions

- How much of an observed coordinator's tendency profile is attributable to the coordinator versus quarterback autonomy (audibles, checks, no-huddle adjustments)? Sources describe this attribution problem as unresolved and not cleanly separable using public data.
- Which tendency dimensions are most portable across personnel and team changes? Sources broadly agree tempo, PROE, and structural motion/formation habits are more portable than target-distribution-by-position, but no source offers a validated, quantified portability ranking.
- How quickly do coordinators genuinely adapt their philosophy to new personnel versus impose a fixed system regardless of fit? Described across sources as a real behavioral split between "adaptive" and "dogmatic" play-callers with no reliable pre-season method to classify which type a given hire will be.
- How should red-zone- and short-yardage-specific coordinator tendencies be integrated with general-field tendencies, given that sources describe these as frequently diverging sharply within the same coordinator's overall profile?

---

_End of oc-play-calling-tendencies.md_
