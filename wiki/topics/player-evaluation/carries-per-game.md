---
title: "Carries Per Game / Carry Share"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - workload-risk
  - backfield-committee
  - snap-share
  - game-script
  - qb-rush-rate
related:
  - player-evaluation/snap-share
  - player-evaluation/goal-line-carry-share
  - player-evaluation/target-share
  - player-evaluation/wopr
---

## Summary

Carries per game (CPG) and carry share are the two foundational workload metrics for evaluating running back opportunity. CPG is a player's total rushing attempts divided by games played, expressing raw weekly volume; carry share is a player's rushing attempts divided by team rushing attempts, expressing what fraction of the backfield's opportunity a player controls independent of how run-heavy the team is overall. The two are complementary rather than redundant — the same CPG can represent very different roles depending on how much a team runs the ball in aggregate, and the same carry share can represent very different absolute volume depending on team pace and play-calling tendency. Neither metric alone is sufficient: both are workload/volume measures that say nothing about receiving involvement, per-touch efficiency, or the value concentration of the touches themselves (goal-line carries and passing-down work are not interchangeable with a first-and-10 run between the tackles), and both are heavily influenced by team-level context — game script, pace, and quarterback rushing — that has little to do with an individual player's underlying role or skill.

---

## Core Knowledge

### Definition and Calculation

CPG equals total rushing attempts divided by games played. Carry share equals a player's rushing attempts divided by team rushing attempts. Both figures depend heavily on denominator choices that are not standardized across data providers, and the platform should be explicit about which convention it uses rather than presenting either figure as a single unambiguous number.

For CPG, "games played" can mean total team games, games the player was active for, games the player started, or games in which the player recorded at least one carry — these produce materially different averages, particularly for players who were injured, activated mid-season, given a planned rest day, or exited a game early. Excluding a game in which a player was active but saw a diminished or zero role (rather than truly absent) artificially inflates apparent per-game role; for workload projection purposes, "games active" is generally the more defensible denominator than "games with a recorded carry."

For carry share, the team-rushing-attempts denominator can include or exclude quarterback kneels, quarterback scrambles, and designed quarterback runs, and different providers are not consistent about this. Quarterback kneels are typically recorded as official team rushing attempts in box-score data even though they represent no competitive opportunity, which mechanically deflates every running back's share if kneels are not excluded. Quarterback scrambles and designed quarterback runs both genuinely compete with running backs for carries and are appropriately included in a team-wide denominator, but public play-by-play data does not always cleanly distinguish a scramble from a designed run, which complicates isolating "the RB committee's share" specifically. A separate, narrower metric — a player's carries divided only by the total carries among running backs on the team ("backfield carry share") — measures standing within the RB room specifically rather than share of all team rushing offense; these are different metrics that answer different questions and should be labeled distinctly rather than used interchangeably.

### CPG and Carry Share Are Complementary, Not Redundant

The relationship between the two is arithmetic rather than empirical: carry share removes team-level rushing-volume differences from the picture, while CPG does not. A player's CPG can rise even at a constant carry share if the team's overall rushing volume increases (more competitive game scripts, faster pace, more early-down runs), and conversely a stable carry share can mask declining CPG if team rushing volume itself is shrinking. Reading either number without the other risks misattributing a team-level volume change to an individual role change, or vice versa. Carry share is generally the better lens for isolating role and coaching trust; CPG is the better lens for raw expected weekly production.

### Known Pitfalls and Failure Patterns

**Low-volume-offense trap ("empty calories").** A very high carry share (65%+) on a run-light, low-efficiency, or generally low-volume offense can still produce mediocre CPG and minimal fantasy output — dominating a small pie is worth less than a smaller share of a large one. Carry share should always be read alongside actual team rush-attempt volume, not in isolation.

**Game-script distortion.** Trailing teams throw more and run less, which suppresses raw carries (and CPG) for the lead back even when his underlying role hasn't changed, while leading teams run out the clock and inflate the same numbers. Carry share is comparatively more resistant to this than raw CPG, but a season-long blended share can still mask a real split between how a back is used in competitive game states versus while leading or trailing. Rolling or recent-window carry share, and role-based splits (neutral script vs. trailing vs. leading), are more informative than a single blended season number for in-season decisions.

**Injury, rotation, and small-sample noise.** Per-game and per-week samples are volatile given the limited number of rushing attempts any single team runs per game. A returning-from-injury player's season-long CPG will understate his current or full role if computed across games where he was on a limited pitch count; a healthy backup's one huge game due to a starter's in-game injury is not a reliable signal of a permanent role change until confirmed by usage the following week.

**Committee ambiguity.** A given carry share does not mean the same thing in every backfield structure — a 55% share in a messy three-way committee is not equivalent in value to a 55% share in a clean two-man split, and neither is equivalent to a bell-cow's 80%+. What matters as much as the raw share number is whether the player in question also holds the high-value carries (passing-down work, goal-line carries) within that share, since a committee back can lead in overall carry share while still losing the most valuable touches to a teammate.

**Quarterback-rushing suppression.** In offenses with a mobile or sneak-heavy quarterback, quarterback carries structurally reduce both team rushing attempts available to the running back room and the individual back's practical CPG/carry share ceiling, independent of that back's role or talent. This is the same structural confound documented for goal-line carry share, and it applies at the whole-game level as well as specifically near the goal line.

**Pass-game erasure.** A high carry share without meaningful target share or route participation caps a back's fantasy ceiling, particularly in PPR formats, since carries and targets are not equal in expected fantasy value (a target is generally worth more than a carry in most PPR-influenced scoring systems). A workload metric that simply adds carries and targets together as equivalent units is a real simplification and understates the receiving-back archetype's value relative to a pure early-down grinder with a similar combined touch count.

**Efficiency-and-role are not independent.** Carry volume has an endogenous relationship with team offensive success: efficient teams sustain longer drives and generate more offensive plays (and thus more rushing attempts) in the aggregate, while stalled possessions truncate a team's own rushing volume. This makes it genuinely difficult to cleanly separate whether a high CPG reflects coaching commitment to a player, the player's own quality, or simply that his team's offense is generating more total plays — a caution against treating rising CPG as pure evidence of individual role growth without checking team-level play-volume context.

**Not all carries are equal quality.** Raw carry counts treat a first-and-10 run, a short-yardage carry, a draw against a favorable box, and (depending on provider convention) a kneel-down identically, despite very different underlying value. A rising carry count with declining situational quality (fewer passing-down or goal-line carries, more early-down/low-leverage work) can mask a declining fantasy role even as the topline volume number holds steady or grows.

### Best-Practice Usage

Carry share is generally the first number to check when assessing a running back's underlying role, since it strips out team-level volume noise that raw CPG carries. It should be read together with CPG (for absolute weekly expectation), snap share and route participation (to catch backs whose role is diluted by blocking assignments or, inversely, backs whose true involvement exceeds what carries alone suggest), target share (to capture receiving value that pure rushing metrics miss entirely), and goal-line carry share (to capture touchdown-upside concentration that a blended carry-share number does not reveal). A complete workload profile ideally separates early-down carries, short-yardage/goal-line carries, two-minute/no-huddle work, third-down snaps and targets, and pass-protection reps, since a single blended carry total can obscure very different underlying roles that carry the same topline number. For projecting future volume, multiplying a player's role share by the team's projected rush-attempt volume (accounting for pace and expected game script) is a more defensible approach than extrapolating raw season-long CPG directly, and role-based splits (before/after an injury, before/after a coaching change, with/without a specific teammate) are more informative for in-season decisions than a single blended season average.

---

## Key Decisions

- **Decision:** The platform will report carry share and carries-per-game as a paired, always-co-displayed set rather than surfacing either in isolation.
  **Reasoning:** The two metrics answer different questions — carry share isolates role from team-level volume noise, CPG expresses raw expected weekly output — and every independent analysis of this metric converges on reading them together to avoid misattributing team-level volume changes to individual role changes or vice versa.
  **Rejected alternative:** Surfacing a single blended "workload score" that combines the two into one number was rejected because it would obscure exactly the distinction (team-context-driven volume vs. player-attributable role) that makes the pairing useful in the first place.

- **Decision:** The platform will define and expose two explicitly labeled carry-share denominators — "team carry share" (player carries over all team rushing attempts, including QB) and "backfield carry share" (player carries over RB-only carries) — rather than a single ambiguous carry-share figure.
  **Reasoning:** These measure different things — a back's share of the offense's total rushing opportunity versus his standing within the running back room specifically — and collapsing them into one number hides how much of the team's rushing workload a mobile or sneak-heavy quarterback is absorbing, which materially affects projection.
  **Rejected alternative:** Reporting only RB-only ("backfield") carry share was rejected because it flatters backs in mobile-QB offenses relative to their true share of team scoring opportunity and breaks cross-team comparability.

- **Decision:** The platform will exclude quarterback kneels from the team rushing-attempt denominator by default when computing running back carry share, with raw (kneel-inclusive) figures available as a secondary view.
  **Reasoning:** Kneels are recorded as official rushing attempts in box-score convention despite representing zero competitive opportunity; including them by default mechanically and needlessly deflates every running back's apparent share, particularly late in blowout wins.
  **Rejected alternative:** Using unadjusted official box-score rushing attempts as the sole denominator was rejected as the default across public sources that multiple independent analyses flag as a distortion worth correcting.

- **Decision:** The platform will compute and surface a rolling, recent-window carry share (in addition to season-to-date) rather than only a single blended season average.
  **Reasoning:** Season-long blended figures mask game-script splits, post-injury role changes, and post-coaching-change shifts that are more actionable for in-season decisions than a full-season number; sources converge on preferring recent or role-based splits over blended season averages.
  **Rejected alternative:** Displaying only season-to-date carry share was rejected because it treats early-season and current-week role identically, obscuring exactly the kind of role change (post-injury, post-coaching-change) that matters most for near-term decisions.

---

## Open Questions

- [ ] What is the correct "games played" denominator for CPG — games active, games with a recorded carry, or games started — and should the platform default to one with the others available as alternate views? — no universal convention exists across sources; needs a platform-specific decision informed by what the data pipeline can reliably distinguish.
- [ ] How should carries and targets be combined into a single "opportunity" figure that reflects their differing expected fantasy value, rather than a naive 1:1 sum (raw carries + raw targets)? — flagged as unresolved and increasingly important for PPR-format analysis; no settled weighting methodology was identified.
- [ ] Is there a carry-share floor (e.g., roughly 50%) that remains viable for elite weekly production when paired with a strong target share under a modern committee-first offense, or does bell-cow-level share (65%+) remain necessary for a true weekly RB1 floor? — genuinely contested; needs backtesting once the platform has sufficient historical role and scoring data.
- [ ] At what volume does a high carry share begin to hurt per-touch efficiency (via defensive keying or in-season fatigue accumulation), and should the platform model this as a discount on projected value at very high workload levels? — raised as a plausible mechanism with no consensus threshold across sources.
- [ ] How should the platform properly separate whether a given CPG or carry-share level reflects coaching commitment, individual player quality, or team-level offensive-success-driven play volume, given the endogenous relationship between efficiency and rushing opportunity? — unresolved; noted as a genuinely hard isolation problem rather than a data-availability gap.
