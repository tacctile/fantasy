---
title: "Weekly Start/Sit Projections — Opportunity-First Framework with Vegas and Health Overlays"
type: domain-knowledge
category: in-season-management
status: active
last_updated: "2026-07-18"
confidence: high
tags:
  - start-sit
  - opportunity
  - snap-share
  - route-participation
  - target-share
  - vegas-total
  - implied-team-total
  - game-script
  - injury-status
  - consistency-score
  - volatility
related:
  - in-season-management/rest-of-season-rankings
  - in-season-management/injury-status-practice-participation-tracking
  - league-mechanics/playoff-schedule-strength
  - league-mechanics/trade-value-calculation
---

## Summary

Weekly start/sit decisions are an expected-value problem under uncertainty, not a search for the single most likely point total. All six independently sampled models converge that projected opportunity (snap share, route participation, target share, carry share, red-zone/goal-line usage) explains the large majority of week-to-week fantasy variance and must be established before any efficiency or matchup adjustment is applied — efficiency is comparatively noisy at the single-game level and should be regressed toward a player's longer-run baseline rather than trusted from a recent hot or cold stretch. Vegas market data (implied team total, spread, game total, pace) is corroborated as a legitimate contextual multiplier on projected volume and touchdown environment, but every source warns against letting it override role-based opportunity, and injury/practice status must be decomposed into two separate questions — will the player be active, and will his role be normal if he is — rather than treated as a single binary.

## Core Knowledge

### Opportunity is the dominant driver; efficiency should be heavily regressed

Every source independently converges on the same sequencing: establish probable role and volume first, then apply efficiency, then apply touchdown probability as a separate calculation, then apply game-environment and health adjustments last. Sources describing this quantitatively estimate that opportunity metrics explain roughly 60-80% of week-to-week variance for running backs and wide receivers, somewhat less for quarterbacks and tight ends, though the precise percentages differ across sources and should be treated as directional rather than settled figures. The corroborated reasoning is that per-touch efficiency (yards per carry, yards per target, catch rate) is heavily influenced by defensive alignment, broken plays, quarterback accuracy, and game script — noise that regresses hard at single-game sample sizes — while snap share, route participation, target share, and carry share are comparatively stable and directly observable from role. A player receiving a high volume of opportunities in a mediocre matchup is corroborated across sources as a stronger starting option than a player receiving a low volume of opportunities in an excellent matchup.

Position-specific opportunity drivers, corroborated across the panel:
- **Running backs**: carry share, route participation, target share, goal-line/red-zone share, two-minute and hurry-up role, and pass-blocking substitution risk. A nominal starter who leaves the field on passing downs can have a lower ceiling than a lower-billed back with strong receiving-down involvement; a receiving back's value is sensitive to the team's trailing probability and can lose value in a positive game script.
- **Wide receivers and tight ends**: route participation and target share are corroborated as more predictive and more stable than raw snap counts, because snap share includes non-passing-down and blocking snaps that carry no receiving opportunity. A tight end with a high overall snap share but a low route-run rate on dropbacks can be a weaker option than a lower-snap-share player who runs routes on nearly every passing play.
- **Quarterbacks**: designed rushing attempts, scramble rate, and red-zone carry share are corroborated as high-value structural advantages independent of passing volume, because rushing production is less dependent on pass-catcher distribution and often carries a disproportionately high touchdown probability near the goal line. A quarterback's rushing role should be inferred from usage patterns, not from past fantasy point totals alone.

### Touchdown probability should be modeled as a separate, more volatile component

Sources converge that touchdown production should not be baked into a single yards-to-points conversion ratio because touchdowns are structurally less predictable than yardage — they depend on red-zone and goal-line opportunity share, the team's overall red-zone scoring rate, and game-script-driven scoring opportunities, all of which vary game to game more than volume does. The corroborated practice is to project touchdown probability from red-zone/goal-line usage share multiplied by team scoring rate as its own calculation, and to regress touchdown rates toward a role-based baseline unless there is a credible, specific reason (a new goal-line role, a change in red-zone play-calling) to expect a sustained shift. A player whose recent scoring output has outpaced his underlying opportunity is a recurring signal for future touchdown-rate regression, not sustained value.

### Vegas context functions as a prior on scoring environment and game script, not a deterministic player-level forecast

All sources treat implied team total, spread, game total, and expected pace as legitimate and useful inputs, but consistently frame them as adjustments to the volume and touchdown environment at the team level — they do not, by themselves, specify which individual player receives the resulting opportunity. A team with a high implied total generates more scoring chances broadly; a team favored by a large margin tends to see increased rushing volume and suppressed passing volume in the second half as it protects a lead, while a team trailing by a large margin tends to see increased passing volume and suppressed rushing volume as it plays catch-up. Multiple sources warn that this game-script effect cuts differently by player role within the same team: a pass-catching running back can see target volume increase in a negative game script even as their teammate's carry volume collapses, so team-level script effects must be translated to player-specific role before being applied. Sources caution against using stale lines — the market moves throughout the week, and a Tuesday line can differ meaningfully from a Sunday line, particularly around late-breaking injury news to either team.

### Matchup data is most useful when applied by mechanism, not as an aggregate "points allowed to position" figure

Every source that addresses matchup analysis independently criticizes generic "fantasy points allowed to position" rankings as too aggregated to be reliably actionable, because the figure conflates multiple distinct vulnerabilities (rushing efficiency versus receiving-back volume, slot coverage versus perimeter coverage, red-zone defense versus general-field defense) and is distorted by the quality of offenses a defense has actually faced and by touchdown variance in the underlying sample. The corroborated alternative is to evaluate matchups by mechanism — man versus zone coverage tendency, slot versus perimeter alignment, box count and run-defense structure, pressure rate and a quarterback's documented response to pressure, and red-zone-specific defensive performance — matched against the specific player's role and alignment. Sources converge that matchup adjustments should generally be modest relative to opportunity-based projections: a favorable matchup cannot indefinitely compensate for a collapsing or diminished role, and matchup-driven swings in an otherwise stable player's projection should be treated with lower confidence than volume-driven swings.

### Health status must be split into availability probability and role-if-active probability

Every source converges that injury and practice-participation status answers two separate questions that are frequently conflated: whether the player will be active for the game, and whether his role and workload will be normal if he does play. A player returning from a soft-tissue injury, or listed as limited late in the week, can be active while still running a reduced route total, seeing fewer designed touches, losing red-zone or two-minute usage, or facing increased in-game substitution on passing downs. Sources are unanimous that using a single flat multiplier for a "Questionable" designation (applying, for example, a uniform 75% haircut regardless of injury type, practice trajectory, or position) is a documented and common error; the correct practice weights recent practice trajectory and injury type before assigning any workload discount. When a starter is ruled out late, sources caution that the resulting opportunity redistribution among remaining players is rarely a simple proportional split and depends on the specific coaching staff's historical substitution behavior rather than the raw depth chart.

### Confidence tiering should reflect uncertainty in role, health, and model disagreement — not simply restate the ranking

Sources converge that a weekly projection is more useful as a range (floor, median, ceiling) plus a confidence tier than as a single point estimate, because reporting a precise point value implies more certainty than the underlying opportunity and health inputs support. High confidence corresponds to a stable, well-established role combined with clean health status and a stable game environment; medium confidence corresponds to a stable role but volatile matchup or game-script conditions; low confidence corresponds to ambiguous injury status, a new or unproven role (new starting quarterback, backfield committee, a player's first game in an expanded role), or unresolved health uncertainty heading into the decision deadline. When two players' point projections are close (within roughly a few points, though the exact threshold is not corroborated to a precise figure across sources), the corroborated guidance is to let confidence tier — not the marginal point difference — decide the closer call.

## Key Decisions

The platform will compute weekly projections using an opportunity-first sequence — projected snap share, route participation, target share, and carry share established first, efficiency applied second as a regressed (not trailing-average) figure, and touchdown probability modeled as a separate calculation from red-zone/goal-line share — because every source in the panel converges on this sequencing and on opportunity's dominance over efficiency in explaining week-to-week variance.

The platform will apply Vegas-derived game-environment adjustments (implied team total, spread, pace) as a multiplier on team-level scoring and play-volume expectation, translated to player-specific role before being applied to an individual projection, rather than as a direct player-level point adjustment, because sources converge that market data specifies team scoring environment and game script but not which player receives the resulting opportunity, and that script effects can move in opposite directions for different roles on the same team.

The platform will reject generic "fantasy points allowed to position" as a primary matchup input and will instead surface matchup adjustments by mechanism (coverage tendency, alignment-specific vulnerability, pressure rate, red-zone-specific defensive performance) where the underlying data is available, falling back to points-allowed only as a lower-confidence signal, because sources converge that the aggregate figure is contaminated by opponent quality and touchdown variance in ways mechanism-specific data corrects for.

The platform will model player availability and role-if-active as two separate probabilities rather than a single flat discount tied to game-status designation, and will decompose the availability discount by injury type, position, and recent practice trajectory rather than applying a uniform percentage to all "Questionable" designations, because sources unanimously identify the flat-multiplier approach as a common and documented projection error.

The platform will surface a floor/median/ceiling range and an explicit confidence tier alongside every weekly projection, with confidence driven by role stability, health clarity, and game-environment stability rather than restating the point-based ranking, because sources converge that a single point estimate overstates certainty and that confidence tier — not marginal projection difference — should decide close start/sit calls.

## Open Questions

- [ ] The precise percentage of week-to-week fantasy variance explained by opportunity versus efficiency differs across sources (estimates in the roughly 50-80% range depending on position) with no single corroborated figure — needs empirical validation against the platform's own historical data once available.
- [ ] The exact point-differential threshold at which confidence tier should override a marginal projection edge between two players is not corroborated to a specific number across sources and should be treated as a tunable design parameter.
- [ ] Whether stacking or correlated-outcome adjustments (pairing a quarterback's projection with his primary receiving target) meaningfully improve single-league (non-tournament) start/sit accuracy is raised by only a subset of sources with no strong corroboration — treat as a lower-priority refinement pending further evidence.
