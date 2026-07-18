---
title: "Offensive Line Pass-Block / Run-Block Efficiency"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - offensive-line
  - pass-block
  - run-block
  - epa
  - opportunity
related:
  - team-scheme/offensive-line-continuity
  - team-scheme/offensive-line-injuries
  - player-evaluation/yards-after-contact
  - player-evaluation/qb-epa-cpoe
---

## Summary

Offensive line pass-block and run-block efficiency metrics attempt to isolate the line's structural contribution from quarterback and running back skill, but no single, universally accepted composite exists — the field splits into charting/grading approaches (PFF-style, subjective but assignment-aware), timing-based win-rate approaches (ESPN/Next Gen Stats-style, objective but assignment-agnostic), and outcome-adjusted approaches (Football Outsiders-style adjusted line yards, which allocate rushing yardage between line and runner by distance bucket). Every source converges on the same central caution: pass-block metrics are heavily confounded by quarterback pocket presence and time-to-throw, and run-block metrics are heavily confounded by running back vision, burst, and contact-balance — neither family of metric cleanly isolates line performance without carrying real caveats about attribution.

## Core Knowledge

### Definition and Calculation

**Pass-block efficiency** is typically built from a weighted combination of negative outcomes per pass-blocking snap:

$$\text{Pass-Block Efficiency} = 1 - \frac{a(\text{Sacks}) + b(\text{Hits}) + c(\text{Hurries})}{\text{Pass-Block Snaps}}$$

Sacks are weighted most heavily (they end drives and carry the largest negative expected-points impact), hits next, and hurries least — but the specific weights are not standardized across sources; different providers use different coefficients derived from internal, generally undisclosed regression work. A simpler and more commonly cited alternative is raw **pressure rate** (sacks plus hits plus hurries, divided by pass-blocking snaps or dropbacks), which is easier to compute and compare but more directly conflates line performance with quarterback time-to-throw — a quarterback who holds the ball longer mechanically generates more pressure opportunities independent of block quality.

**Run-block efficiency** is harder to isolate because rushing outcomes are jointly determined by the line, the runner, the play design, and the defensive front. Common component metrics include:

- **Yards before contact per attempt (YBC/A)** — yardage gained before the first defender makes contact, treated as the cleanest available proxy for lane creation, though a runner's gap selection and hesitation still affect it.
- **Stuff rate** — the share of runs stopped at or behind the line of scrimmage.
- **Adjusted line yards (ALY)** — a distance-bucketed crediting scheme that attributes a larger share of short-gain yardage to the line and progressively discounts (or in some formulations, penalizes) long gains as increasingly runner-driven:

$$\text{ALY} \approx \alpha_1(\text{yards at/behind LOS}) + \alpha_2(\text{yards 1-4}) + \alpha_3(\text{yards 5-10}) + \alpha_4(\text{yards beyond 10})$$

The specific coefficients vary by source and are not raw yards before contact — ALY is a modeled allocation, not a direct measurement, and should not be interpreted as if it were.

**Win-rate metrics** (associated with Next Gen Stats/ESPN-style products) ask a narrower, timing-based question: did the blocker sustain an advantageous position over a defined window (commonly cited around 2.5 seconds for both pass- and run-blocking contexts)? This is objective and assignment-agnostic — no subjective grading is required — but a blocker can technically "win" his individual rep while the quarterback is pressured from elsewhere, or "lose" a rep that has no bearing on the play's outcome because the ball is already out.

### Platform and Provider Differences

- **PFF** uses charting-based, assignment-aware grading — evaluators attempt to assess whether a blocker fulfilled his assumed assignment, not just the raw outcome, which requires inferring intended assignment from play design and introduces judgment/subjectivity that is not independently reproducible by external users. PFF grades are not directly interchangeable with pressure rate or ALY; a play can register a positive outcome while containing a graded individual blocking error, and vice versa.
- **Win-rate products (Next Gen Stats/ESPN-style)** use tracking data to evaluate matchup-level timing outcomes rather than final play results — objective and replicable, but the "win" definition depends on a fixed timing window that doesn't perfectly map onto every play type (see Edge Cases).
- **Outcome-adjusted, Football-Outsiders-style metrics** (adjusted line yards, stuff rate, power success, second-level yards) intentionally split credit between the line and the running back using a formula rather than film judgment, which is transparent and reproducible but still an allocation model, not a direct measurement of blocking quality.
- **Charting services differ on classification of pressures, hits, and hurries themselves** — what one source charts as a "hurry" another may not credit as pressure at all, and these definitional gaps compound when composite efficiency scores are built on top of them.
- **No source treats these approaches as fungible.** Sources converge strongly on the point that pressure rate, sack rate, PFF grade, and win rate each capture meaningfully different — and only moderately correlated — information, meaning a composite built from multiple approaches captures more signal than any single approach alone, but requires disclosing which components and weights are used.

### Edge Cases, Failure Patterns, and Pitfalls

- **Quarterback pocket presence and mobility distort pass-block metrics in both directions.** A mobile, pressure-averse quarterback who escapes what would otherwise be sacks makes an average or below-average line look better in raw sack-rate terms, since escaped pressures don't register as sacks; conversely, a quarterback who holds the ball or lacks pocket awareness can make a genuinely strong line's pressure and sack numbers look worse than the underlying blocking performance warrants. This confound is repeatedly flagged as one of the most consequential and least-correctable issues in pass-block evaluation using outcome-based metrics alone.
- **Running back vision and contact balance distort run-block metrics similarly.** An elite runner can convert a modest running lane into a strong gain (inflating apparent run-block quality), while a below-average runner can fail to hit an available lane cleanly (deflating it) — yards before contact mitigates but does not eliminate this, since gap selection and initial burst are still runner-dependent even before contact.
- **Play-action and quick-game plays systematically inflate pass-block efficiency figures if not separated out.** Play-action passes benefit from a hesitation window created by the run fake, independent of the line's blocking quality on that specific rep, and quick-game concepts (screens, hitches, slants with very short time-to-throw) deflate pressure and sack rates simply because the ball is released before pressure can develop — best practice is to separate these play types from standard dropbacks, but this is inconsistently done across public analysis.
- **Scheme confounds run-block comparisons.** Zone-blocking systems and gap/power systems produce structurally different yards-before-contact and win-rate profiles because the underlying blocking mechanics (reach blocks and combination releases in zone; down blocks and pulling linemen in gap/power) create different contact timing and lane characteristics — comparing a zone-heavy team's run metrics directly against a gap-heavy team's without acknowledging this is a documented source of misleading conclusions.
- **Injured or compromised individual linemen playing through injury drag down composite team-level figures** in ways that don't reflect the unit's underlying, healthy-state quality, and offensive line injury designations are generally less publicized and less closely tracked than skill-position injuries, making this harder to account for in real time.
- **Opponent quality is a major, frequently under-adjusted confound.** A given line's raw efficiency figures look very different against an elite pass rush or run defense than against a weak one, and few public composite metrics apply a rigorous opponent adjustment; treating unadjusted efficiency figures as stable, opponent-independent talent measures is a common analytical error.
- **The pass-block/run-block correlation across the same line is weak.** Multiple sources note that a given offensive line can be strong in one discipline and mediocre or poor in the other, without a well-established theory for why the split persists — this weakens confidence in any single composite "offensive line quality" score that doesn't separate the two disciplines.

### Fantasy Application

Sources converge on treating these metrics as efficiency and volatility modifiers, not volume drivers — offensive line quality should adjust a quarterback's projected completion rate, sack/turnover risk, and time available for routes to develop, and a running back's projected per-touch efficiency and short-yardage/goal-line conversion probability, but actual touch volume and target volume are governed separately by game script, scheme, and role rather than by line quality itself. A recommended prioritization order for fantasy-relevant projection places quarterback talent and pressure-response skill, and running back talent and vision, ahead of line efficiency metrics specifically — line quality is real and matters, but is not the dominant input relative to the skill player's own talent and the team's scheme and opponent context.

## Key Decisions

- **Decision:** The platform will maintain pass-block and run-block efficiency as separate metrics and will not combine them into a single "offensive line quality" composite score.
  **Reasoning:** Sources document weak correlation between a line's pass-block and run-block performance, and each discipline has distinct confounds (quarterback mobility for pass-block; running back vision for run-block) that a blended score would obscure rather than resolve.
  **Rejected alternative:** A single composite offensive line rating was rejected because it would mask which specific discipline (protection or run-blocking) is actually driving a given player's projection-relevant environment.

- **Decision:** The platform will disclose which underlying data family (charting/grading, timing-based win rate, or outcome-adjusted) any surfaced blocking-efficiency figure derives from, rather than presenting a bare unlabeled number.
  **Reasoning:** These three families are documented to be only moderately correlated and to capture meaningfully different information; presenting them interchangeably under a generic "line efficiency" label would misrepresent what is actually being measured.
  **Rejected alternative:** Adopting a single internal methodology without disclosure was rejected because it would prevent users from reconciling the platform's figures against other sources they may already be referencing.

- **Decision:** The platform will treat offensive line efficiency metrics as adjustments to skill-player efficiency and risk projections, not as inputs to volume/opportunity projections.
  **Reasoning:** Convergent guidance places quarterback and running back talent, plus scheme and game script, ahead of line efficiency in the fantasy-relevant causal chain; volume is governed by role and scheme, while line quality primarily affects how efficiently a given volume of touches converts to production.
  **Rejected alternative:** Using line efficiency as a direct multiplier on projected touches or targets was rejected because no source supports line quality as a meaningful driver of opportunity volume itself.

## Open Questions

- Can offensive line performance be meaningfully separated from running back pass-protection responsibility (blitz pickup)? A back who fails to identify or pick up a blitzer creates a pressure that outcome-based pass-block metrics will generally attribute to the line, and no public metric cleanly separates this responsibility split.
- Why does the pass-block/run-block correlation within the same line tend to be weak, and is this a real talent-allocation pattern (linemen suited to one discipline over the other) or a measurement artifact? No source offers a resolved explanation.
- How should pre-snap motion and formation variety be incorporated into blocking-efficiency evaluation? Motion can reveal defensive intent and plausibly benefit both pass and run blocking, but this interaction is largely unexplored in publicly available models.
- What is the correct, validated set of weights for combining sacks, hits, and hurries (or for combining win-rate and outcome-based approaches) into a single pass-block efficiency figure? No source provides weights validated through disclosed, reproducible methodology.
- How much of a line's measured efficiency reflects genuine talent versus favorable scheme design (quick-game concepts, heavy play-action usage, favorable box counts) that reduces the line's true exposure? This is flagged as a persistent attribution problem across multiple sources.

---

_End of offensive-line-blocking-efficiency.md_
