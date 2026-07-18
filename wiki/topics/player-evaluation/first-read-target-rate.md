---
title: "First-Read Target Rate / Target Quality"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - first-read-target-rate
  - target-depth
  - receiving-role
  - route-participation
  - opportunity
  - expected-value
related:
  - player-evaluation/route-participation-rate
  - player-evaluation/target-share
  - player-evaluation/average-depth-of-target
  - player-evaluation/wopr
---

## Summary

First-read target rate measures the share of a quarterback's dropbacks (or progressions) on which a given receiver is the designed primary read, isolating scheme trust and route priority from raw target volume. It is not a standardized public statistic — providers disagree materially on both the numerator (was the receiver actually the QB's first look) and the denominator (total dropbacks, total routes, or total targets) — so the same label can describe meaningfully different metrics across sources. Its strongest use is as a role-confirmation and offensive-intent signal that should be paired with route participation and target rate per route, not as a standalone projection input.

## Core Knowledge

### Definition and Calculation

At its simplest, first-read target rate is targets earned as the QB's primary progression divided by opportunities where the receiver was the first read:

$$\text{First-Read Target Rate} = \frac{\text{Targets on First-Read Progressions}}{\text{Total First-Read Opportunities}}$$

Three materially different formulations exist and are frequently conflated under the same name:

- **First-Read Opportunity Rate** — plays on which the receiver was the designed first read, divided by total eligible pass plays or dropbacks. This is the most comprehensive version because it includes plays where the QB never got to the first read (pressure, sack, scramble).
- **First-Read Target Share** — first-read targets divided by the receiver's *total* targets. This measures what fraction of a player's existing volume came as a first read, not how often he was schemed as the priority option. A player who is rarely targeted at all can still post a high value here.
- **First-Read Conversion Rate** — targets actually thrown on first-read opportunities divided by total first-read opportunities. This isolates how often the QB actually pulls the trigger on the designed look versus moving to a later read, checking down, or scrambling.

These three answer different questions (offensive intent, volume composition, and quarterback follow-through respectively) and are not interchangeable. Comparing a "first-read rate" from one source against another without confirming which denominator is in use is a common analytical error.

A fuller target-quality model decomposes the process into distinct stages: designed priority (does the concept structurally feature the receiver), quarterback progression (does the QB actually reach the receiver in the read), coverage accessibility (is the receiver schemed open against the defense shown), throwability (does the route produce a viable window), and the actual target (does the ball get thrown). First-read status describes only the first stage — a first-read target can still be low-value (a quick screen, a heavily contested deep shot) while a later-progression target can be high-value (an explosive play against favorable post-snap coverage). For this reason "target quality" is broader than first-read status alone, and should incorporate air yards, route type, and coverage context rather than first-read status in isolation.

### Platform and Provider Differences

Reliable public data on this metric is limited because first-read classification is inherently charting-dependent and, in most cases, proprietary.

- **Film-charting providers** (PFF, Sports Info Solutions, and the Reception Perception methodology originated by Matt Harmon) assign first-read status via manual review — quarterback helmet/eye orientation, play-design intent, and analyst judgment on route-progression order. This is the most granular approach but is inherently subjective on plays with mirrored concepts, option routes, or coverage-based route conversions, and full first-read datasets are frequently not released publicly (PFF's, for instance, is subscriber-gated).
- **Tracking-data providers** (NFL Next Gen Stats) can infer route structure, separation, quarterback orientation, and throw timing, but cannot directly observe the quarterback's intended progression — a receiver's apparent priority is an inference from time-to-throw and separation, not a verified read. As of the current data cycle, NGS does not publish a direct public "first read" metric, despite having the tracking inputs (QB orientation at snap, route-stem timing) that could support one.
- **Fantasy-specific aggregators** (Fantasy Points Data Suite, StatRankings) publish first-read-derived metrics sourced from their own charting or licensed data, making them among the more accessible sources in a fantasy context. StatRankings, notably, defines its published figure as first-read targets divided by *total targets* — the target-share formulation, not the opportunity-rate formulation — which produces different rankings than a dropback-denominated version.

The practical takeaway: consistent terminology ("first-read rate," "first-read share," "designed target rate") masks inconsistent methodology. Always check which of the three formulations above a given source is actually reporting before comparing players across platforms.

### Edge Cases, Failure Patterns, and Pitfalls

- **The decoy/bracket problem.** A receiver can be the first read on a high share of dropbacks yet rarely get targeted because the defense takes him away with bracket or double coverage, forcing the QB to the second read. This makes first-read rate overstate realized production for exactly the players — elite WR1s who draw extra attention — where the gap matters most.
- **RPOs and option routes.** In RPO-based offenses, the "first read" is often a pre-snap or immediate post-snap defender key (an unblocked edge player), not a conventional receiver progression. A receiver's route on an RPO may be charted as a first read by some systems even though the quarterback's actual decision point was structural, not receiver-based. Option routes compound this: the route's final shape depends on leverage, so a designed-priority receiver may be charted as a first read even on plays where he isn't targeted.
- **Screens and quick game.** Screens and manufactured touches are frequently the technical first read (the QB reads the block and throws immediately), but they are a qualitatively different — generally lower-value — target than an intermediate route won in coverage. Raw first-read rate does not distinguish between the two; target quality requires layering in air yards and route type.
- **Motion and coverage disguise.** Increasing use of pre-snap motion (used partly to diagnose coverage) can shift the QB's actual first look post-snap even when the play was designed to feature someone else. Coverage rotations and disguises can likewise change the correct progression after the snap, meaning pre-snap priority and post-snap priority diverge. Charting methods handle this inconsistently.
- **Progression-neutral and timing offenses.** Some schemes (West Coast timing concepts, mirrored route combinations) do not use a fixed pre-snap first read at all — the QB works a coverage-based rule rather than scanning a fixed hierarchy. Charting a "first read" onto these systems overstates the precision of the underlying decision process and inflates rates for the primary route in the concept regardless of individual receiver skill.
- **Scramble and pressure censoring.** Once a QB scrambles or is pressured into an early throwaway, the progression is abandoned before reaching later options, and some systems record these as failed first-read opportunities for the primary receiver — correct for opportunity-rate purposes but easy to misread as an efficiency failure.
- **Small-sample volatility.** First-read rate is generally more volatile than target share or route participation because it depends on play-level subjective classification rather than a simple count. Values are considered unstable below roughly 40–50 total targets/opportunities, and a single game with several shot plays or goal-line concepts can move the rate sharply; multi-week or full-season samples are needed before treating the rate as a real signal.

### Position-Specific Notes

First-read rate is more informative for tight ends than for the general receiver population, since TE targets are disproportionately schemed (designed) rather than earned in broken coverage — a meaningfully elevated TE first-read rate (well above replacement-level tight ends) typically marks a true focal-point receiving role rather than a situational one. For running backs, first-read status is close to structurally irrelevant in most offenses, since RB targets are overwhelmingly late-progression checkdowns; the metric only carries signal for backs in schemes that explicitly design RB routes as a primary option.

## Key Decisions

- **Decision:** The platform will treat first-read rate as a role-confirmation and offensive-intent signal, not as a standalone projection input for targets or fantasy points.
  **Reasoning:** All available synthesis converges on the same conclusion: first-read status describes designed intent, not realized opportunity, and can diverge sharply from actual target production due to bracket coverage, QB decision-making, and scheme structure. Treating it as directly predictive would overstate its reliability.
  **Rejected alternative:** Using first-read rate as a primary ranking input alongside target share was rejected because the underlying data is charting-dependent, inconsistently defined across sources, and not yet validated at the level target share and route participation are.

- **Decision:** The platform will require first-read data (where available) to be explicitly labeled with its denominator — opportunity-rate, target-share, or conversion-rate — rather than displayed as a single undifferentiated "first-read rate."
  **Reasoning:** The three formulations answer different questions and are not numerically comparable; presenting them interchangeably would mislead users into false cross-player or cross-source comparisons.
  **Rejected alternative:** Normalizing all first-read data into a single platform-defined formula was rejected because the platform does not control the underlying charting methodology of licensed data sources, and forcing a false equivalence would fabricate precision the source data doesn't support.

- **Decision:** The platform will pair any first-read signal with route participation, target rate per route run, and aDOT before surfacing a role-change alert.
  **Reasoning:** First-read rate alone is volatile and subjective; a role change is only credible when it's confirmed by structural, more stable metrics (route participation, TPRR) alongside it.
  **Rejected alternative:** Triggering role-change alerts on first-read movement alone was rejected because of the metric's small-sample volatility and charting-dependent noise.

## Open Questions

- What is the true predictive value of first-read rate for future targets after controlling for route participation and target rate per route run? Cross-sectional data (who had a high rate in a given season) is available; longitudinal stability studies are not.
- Is first-read priority more stable at the player level, the quarterback level, or the play-concept/scheme level? This has direct implications for projecting a player through a coordinator or quarterback change.
- Can tracking data (NGS-style) ever reliably reconstruct a true first-read signal from QB orientation and route timing alone, without direct observation of the quarterback's intended progression? The underlying cognitive event is not fully recoverable from film or tracking data.
- How should target-quality models treat plays where a receiver is used as a coverage manipulator (drawing attention to free up another target) rather than as an intended recipient? Current public frameworks do not separate this role from a "failed" first read.

---

_End of first-read-target-rate.md_
