---
title: "Goal-Line Carry Share"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - goal-line
  - red-zone
  - backfield-committee
  - qb-rush-rate
  - workload-risk
related:
  - player-evaluation/target-share
  - player-evaluation/wopr
  - player-evaluation/carries-per-game
  - player-evaluation/snap-share
  - team-scheme/personnel-grouping-tendencies
---

## Summary

Goal-line carry share (GLCS) is the percentage of a team's rushing attempts inside the opponent's 5-yard line that go to a given player, calculated as player carries inside the 5 divided by team carries inside the 5. It is one of the cleanest available predictors of rushing touchdown upside, because scoring that close to the end zone is decided far more by role allocation than by broken-play efficiency — conversion rates on carries from the 1- and 2-yard line run roughly 40-50%, several multiples higher than the conversion rate on an average rush from open field. GLCS is a role/share metric, not a volume metric: it describes who the coaching staff trusts with the highest-value carries, independent of a player's overall workload between the 20s. It is also one of the noisiest metrics in fantasy analysis, because the sample of true inside-the-5 plays in a single team-season is small enough that a handful of carries can swing a back's share dramatically, and because quarterback rushing (sneaks, keepers, scrambles) structurally competes with the running back pool for the exact carries GLCS is trying to measure.

---

## Core Knowledge

### Definition and Calculation

GLCS equals a player's rushing attempts with the line of scrimmage at or inside the opponent's 5-yard line, divided by the team's total rushing attempts from that same zone. The 5-yard line is the most commonly used threshold because it captures the "scoring zone" where the run/pass efficiency calculus flips — passing windows compress and interception risk rises in a shrunken end zone, so teams lean toward the run disproportionately once inside the 5. Conversion probability is not flat across this zone: a carry from the 1-yard line converts to a touchdown at a meaningfully higher rate than a carry from the 5-yard line, so treating every inside-the-5 carry as equally valuable understates the importance of exactly where a back's carries are concentrated within the zone.

There is no universal agreement on the exact yard-line cutoff. Some sources and data providers use inside-the-5, others use inside-the-3, inside-the-2, or "at the 1," and the volume of qualifying plays changes sharply depending on which threshold is chosen. A tighter cutoff (inside-2 or at-the-1) is generally considered more predictive of pure short-yardage/goal-line role than a looser inside-10 cutoff, which dilutes the signal with carries that don't carry the same all-or-nothing scoring stakes.

### GLCS vs. Adjacent Metrics — Not Interchangeable

GLCS is frequently and incorrectly conflated with two related but distinct metrics. "Goal-to-go carry share" is broader — it covers any situation where the offense cannot gain a first down without scoring, which can begin well outside the 5-yard line (e.g., 1st-and-goal from the 8) and therefore captures different game situations than a strict yard-line cutoff. "Red-zone rushing share" is broader still, spanning the entire 20-yard-line-to-goal-line range, and is a materially different (and less predictive-of-touchdowns) metric than inside-the-5 share specifically. A back can post a strong red-zone carry share while losing nearly all of the highest-value inside-the-5 work to the quarterback or a short-yardage specialist teammate. These three metrics answer different questions and should not be used interchangeably or blended into a single number.

### Denominator Choice: Team-Wide vs. RB-Only

How the denominator is constructed materially changes what the metric means, and sources are not consistent about which they report. Using all team rushing attempts inside the zone (including quarterback sneaks, keepers, and scrambles) as the denominator measures a back's share of the offense's *entire* goal-line rushing opportunity — the metric most relevant to projecting his fantasy scoring share. Using only running-back carries as the denominator measures a back's share of the running back committee specifically, which is a different (and typically higher, more flattering) number that hides how much total opportunity the offense is diverting to the quarterback. Standard play-by-play data typically merges quarterback scrambles in with designed runs by default; more granular charting separates designed rushes from scrambles. If quarterback scrambles are folded into the denominator without being flagged, a running back's apparent share is artificially deflated relative to his role on designed plays specifically. The platform should treat these as two distinct, separately labeled metrics rather than a single ambiguous number.

### The Mobile-Quarterback Confound

Across independent analyses, the single most consistently identified structural factor suppressing running back GLCS is quarterback rushing. Offenses built around a running or sneak-heavy quarterback route a disproportionate share of the highest-value goal-line carries to the QB position itself (short-yardage sneaks converting at very high rates with low risk), which mechanically caps how much of the goal-line rushing pie is even available to the running back room — independent of that back's talent, coaching trust, or overall workload. This means GLCS numbers are not cleanly comparable across teams with very different quarterback rushing profiles: two backs with identical raw GLCS can have very different effective opportunity if one plays behind a pocket passer and the other behind a heavy sneak/keeper quarterback. This confound should be treated as structural and persistent (tied to quarterback identity and scheme) rather than as noise, and it is a major reason not to project a back's GLCS forward without accounting for who is playing quarterback and how the offense uses him near the goal line.

### The Short-Yardage Specialist ("Vulture") Pattern

A related, well-documented pattern is the short-yardage or "vulture" back — a player who holds a near-monopoly on inside-the-5 carries despite a minimal role in the rest of the offense (low overall snap share, low carry share between the 20s, little to no receiving role). This role produces touchdown-dependent, low-floor fantasy value: the player's entire fantasy relevance is contingent on the team reaching the goal line and calling his number once there, with no other pathway to production. High GLCS decoupled from broader offensive involvement should be treated as a fragile, TD-variance-dependent role rather than a stable weekly asset, and is a materially riskier profile than a back who combines a meaningful inside-the-5 share with real early-down or receiving involvement elsewhere.

### Known Pitfalls and Failure Patterns

**Small-sample volatility.** This is the most universally cited weakness of GLCS. True inside-the-5 rushing attempts are rare — many teams accumulate well under 30 such plays in a full season, and it is common for a team to have under 15 qualifying plays. A single injury, trick play, penalty, or one unusual game can swing a back's season-long share by a large margin. GLCS should be regressed toward a team-average or multi-season prior rather than taken at face value in-season, and single-game spikes should not be treated as a role change without corroborating evidence.

**Passing-suppression in short yardage.** On some 3rd-and-goal-from-inside-3 situations, teams may choose to pass rather than run, which reduces a back's GLCS relative to his true high-leverage involvement without reflecting a loss of coaching trust — the play-call distribution itself, not just the runner, determines the observed share.

**Role misclassification by situation.** A back can hold the bulk of a team's 1st-and-goal carries while losing 3rd-and-goal or short-yardage-specific work to a teammate or the quarterback. A blended GLCS number that doesn't separate down-and-distance can overstate a back's involvement in the highest-leverage situations specifically.

**Offensive-line and execution variance not captured.** GLCS measures opportunity, not execution. A well-blocked gap-scheme carry scores more reliably than an equally "deserved" carry that is poorly blocked; offensive-line short-yardage push and defensive front strength both materially affect whether a given share of carries converts to touchdowns, and none of that is visible in the share number itself. A stuffed carry still counts as a real opportunity — it demonstrates role access even though it produced no value — and should not be discounted as a null observation.

**Game-script and personnel-change instability.** Leading versus trailing game states can shift which back or rushing style gets goal-line work, so a season-long blended share can mask a real game-state-dependent split. Personnel changes — a new offensive line, a new quarterback, a coordinator change, or an in-season backfield injury — routinely move a team's goal-line distribution more than underlying player skill does, which makes year-over-year GLCS a weak basis for forward projection without accounting for personnel continuity.

**Receiving work near the goal line is invisible to rushing GLCS.** Backs used as receivers near the goal line (swing passes, angle routes, option routes, screens) retain real touchdown equity that a pure rushing-carries metric does not capture. Evaluating a back's total goal-line scoring equity requires pairing rushing GLCS with receiving usage in the same zone.

### Best-Practice Usage

GLCS is most useful when paired with the raw volume of team inside-the-5 opportunities — a high share of a team that rarely reaches the goal line has limited practical fantasy payoff, and a lower share on a high-scoring, high-red-zone-volume offense can still produce more total opportunities. Quarterback goal-line carries should be tracked and reported as an explicit, separate line item rather than silently absorbed into (or excluded from) the denominator, so users can see how much of the goal-line pie the QB is taking before evaluating the RB room's internal split. GLCS should be treated as a role snapshot to combine with team red-zone rushing efficiency, offensive-line short-yardage performance, and quarterback sneak tendency — not as a standalone predictive number. Sustained multi-week or multi-season role stability is a stronger signal than any single-game or single-season observation, and a role change should only be treated as real once corroborated by snap-share or personnel evidence, not from a single-game share spike.

---

## Key Decisions

- **Decision:** The platform will calculate and label two distinct denominators for goal-line carry share — "team goal-line share" (all team rushing attempts inside the 5, including QB) and "backfield goal-line share" (running-back-only carries inside the 5) — rather than exposing a single ambiguous GLCS number.
  **Reasoning:** These answer genuinely different questions — one measures a back's share of the offense's entire goal-line rushing opportunity (the number most relevant to projecting scoring share), the other measures his standing within the running back committee specifically. Collapsing them into one figure silently hides how much of the goal-line workload a mobile or sneak-heavy quarterback is absorbing.
  **Rejected alternative:** Reporting only RB-only share was rejected because it flatters backs on mobile-QB offenses relative to their true fantasy-relevant opportunity, and would misrepresent cross-team comparisons.

- **Decision:** The platform will apply small-sample regression (toward a team-level or multi-season prior) to GLCS whenever the underlying sample of qualifying team plays falls below a set threshold, rather than displaying raw season-to-date share.
  **Reasoning:** Inside-the-5 rushing attempts are rare enough per team-season that raw share is dominated by noise in-season; every independent analysis of this metric flags small-sample volatility as its primary weakness.
  **Rejected alternative:** Displaying unregressed raw share was rejected as the default failure mode that misleads users into overreacting to single-game or early-season GLCS spikes.

- **Decision:** The platform will surface quarterback goal-line rushing volume as an explicit companion data point alongside any running back's GLCS, rather than only showing the running back number in isolation.
  **Reasoning:** Quarterback rushing is the most consistently cited structural confound suppressing RB goal-line opportunity; without visibility into QB goal-line volume, users cannot distinguish a back who is losing role to a teammate from one who is losing it to a sneak-heavy quarterback, which have very different implications for value stability.
  **Rejected alternative:** Folding QB scrambles and sneaks silently into (or excluding them silently from) the team denominator was rejected because both approaches obscure the same underlying signal that needs to be visible, not averaged away.

- **Decision:** The platform will not project forward-looking GLCS stability across an offensive line change, a coordinator change, or a quarterback change without an explicit uncertainty flag.
  **Reasoning:** Multiple independent analyses converge on personnel and scheme continuity — not underlying player skill — as the dominant driver of goal-line role shifts year over year; treating GLCS as a stable player attribute across such changes would overstate projection confidence.
  **Rejected alternative:** Treating prior-season GLCS as a durable, skill-based projection input regardless of offseason personnel changes was rejected as unsupported by the convergent evidence that context, not skill, drives most of the observed variance.

---

## Open Questions

- [ ] What is the platform's standard yard-line cutoff for GLCS — inside-5, inside-3, or inside-2? — no consensus exists across sources; the choice materially changes sample size and predictive tightness, and needs a data-availability-driven decision.
- [ ] Should GLCS carries be weighted by exact yard line within the zone (e.g., a 1-yard-line carry counted as more valuable than a 5-yard-line carry) to build an "expected goal-line touchdowns" framework? — flagged as an unresolved, unbuilt idea in the available data; would require play-by-play granularity the platform may not yet have.
- [ ] Does GLCS reflect a durable, player-attributable skill (size, contact balance, ball security) or is it primarily a coaching-preference and scheme artifact? — genuinely unresolved; treat any forward projection of GLCS with corresponding uncertainty until the platform can backtest role persistence across coaching continuity.
- [ ] Should goal-line role be evaluated jointly with personnel-grouping context (e.g., 12/21 heavy personnel vs. 11 personnel) rather than as a pure carries-based share? — raised as a plausible refinement with no settled methodology.
- [ ] How should receiving touchdown equity near the goal line (swing passes, angle routes) be integrated alongside rushing GLCS into a single "goal-line scoring share" view, rather than tracking rushing and receiving goal-line usage as separate, uncombined numbers? — no standard approach identified.
