---
title: "QB Designed Rush Rate / Scramble Rate"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - qb-rush-rate
  - scramble-rate
  - epa
  - opportunity
  - volatility
  - ceiling
  - workload-risk
related:
  - player-evaluation/goal-line-carry-share
  - player-evaluation/expected-fantasy-points
  - player-evaluation/qb-epa-cpoe
---

## Summary

Quarterback rushing production splits into designed runs (the play call is a QB run) and scrambles (the QB abandons a pass design and runs after the pocket breaks down or coverage locks). Every model in this synthesis converges on the same core framing: designed rushes provide a stable, scheme-driven fantasy floor, while scrambles provide a more volatile, pressure- and coverage-dependent ceiling. The split is charting-dependent and disputed at the margins — RPO keepers, bootlegs, and rollout runs are the primary classification battlegrounds — but the fantasy-relevant distinction (predictable floor vs. explosive but fragile upside) is well established.

## Core Knowledge

### Definition and Calculation

Designed rushes include quarterback draws, zone-read/option keepers where the QB pulls at the mesh point, sprint-outs and bootlegs called as runs, QB sneaks, and short-yardage power runs — any rush where the play call itself made the quarterback the intended ball carrier. Scrambles occur when a passing play is called, the pocket collapses or coverage takes away every receiving option, and the quarterback crosses the line of scrimmage with the ball rather than throwing or taking a sack.

$$\text{Designed Rush Rate} = \frac{\text{Designed QB Rush Attempts}}{\text{Total QB Rush Attempts (or Team Plays)}}$$

$$\text{Scramble Rate} = \frac{\text{Scramble Attempts}}{\text{Total Dropbacks}}$$

Denominator choice materially affects the resulting rate and is not standardized: some sources use total rush attempts as the denominator for designed rush rate (producing a share-of-rushing-workload figure), others use total team plays or total dropbacks (producing a rate-of-opportunity figure). For scramble rate specifically, whether sacks and aborted snaps are included in the dropback denominator, and whether kneel-downs are excluded from the rushing-attempt numerator, changes the reported rate meaningfully — box-score rushing totals in the NFL include kneel-downs and botched exchanges as rushing attempts, and failing to filter these out understates a quarterback's true rushing efficiency.

### The Fantasy Asymmetry

Designed runs and scrambles are not interchangeable sources of the same production:

- **Designed runs** are scripted and scheme-dependent, giving a repeatable weekly floor largely independent of that week's defensive pass rush or coverage quality. They also carry outsized goal-line value — designed QB runs (including sneaks) inside the five-yard line are a clean, high-leverage source of rushing touchdowns that materially caps the goal-line opportunity available to the team's running backs.
- **Scrambles** tend to occur against man coverage with defenders' backs turned, or when a pass rush forces the QB out of structure, and can be highly efficient per attempt. But scramble volume is reactive — it rises with pressure, tight coverage, and negative game script — rather than scripted, making it a much noisier input to project forward. A quarterback whose rushing profile leans heavily on scrambles is more exposed to variance from opponent pass rush quality, his own offensive line's protection, and game state than one with a stable designed-run role.

The practical fantasy read: designed rush volume is the primary driver of a rushing quarterback's weekly floor; scramble activity is a volatility and ceiling factor layered on top of that floor, not a substitute for it.

### Platform and Provider Differences

- **PFF** and similar manual-charting operations (Sports Info Solutions) classify designed vs. scramble based on blocking-scheme keys — if the offensive line run-blocks downfield, the play is charted designed; if linemen set in pass protection and the QB runs after the fact, it's charted a scramble. This charting-based approach is widely treated as the more rigorous standard for the distinction, though it still requires judgment calls on ambiguous plays.
- **NFL Next Gen Stats** infers scrambles from tracking data — QB velocity, lateral movement relative to the tackle box, and time elapsed since snap — rather than reading blocking keys directly. This can misclassify an RPO keeper as a scramble (or vice versa) when the automated model doesn't have visibility into the actual blocking assignment.
- **Fantasy-specific data providers** (Fantasy Points Data Suite and similar) increasingly separate designed carries from scrambles in accessible form, tracking figures like designed-carry share and scramble yards per game, but these are typically downstream of either PFF-style charting or NGS-style inference and inherit that source's classification rules.
- **The terminology trap:** some sources define "scramble" as any QB run that wasn't a designed run (a residual-category definition), while others define it specifically as a run where the QB was under pressure and left the pocket — even if the underlying play call was a run. This produces disagreement specifically on bootlegs, rollouts, and RPO keepers, since a designed rollout that the QB extends into a longer run may be classified as "still designed" by one system and "scramble-adjacent" by another.

### Edge Cases, Failure Patterns, and Pitfalls

- **RPO and read-option ambiguity.** This is the single largest source of classification disagreement across every source reviewed. On a zone-read or RPO, the quarterback's decision to keep the ball is dictated by an unblocked defender's post-snap behavior, not a fixed pre-snap design in the way a QB draw is. Whether this counts as "designed" (the playcall included the keep option) or reflects post-snap improvisation (closer to a scramble) has no industry consensus, and different providers will chart the same play differently.
- **Bootlegs and rollouts.** A QB rolling out on a designed bootleg is not scrambling in the conventional sense, but if the pass option is covered and the QB runs, some charters call this a scramble (the pass play "broke down") while others call it a designed rollout converted to a run. The classification is not consistent across sources.
- **Scheme-driven low designed-rush rate.** Some clearly mobile quarterbacks post low designed rush rates purely because their offensive system rarely calls QB runs, not because of a talent limitation. When evaluating a mobile quarterback changing teams or offensive coordinators, the new scheme's historical designed-rush tendency is often a more useful anchor than the quarterback's own prior designed-rush rate.
- **Scramble-dependent QBs are more fragile.** Quarterbacks whose rushing production leans heavily on scrambles rather than designed runs are more exposed to defensive spy usage, offensive line improvement (better protection reduces the need to scramble), and pass-rush-driven injury risk, since scrambles more often expose the QB to open-field or blindside contact than a designed run with a prepared blocking scheme.
- **Sample-size fragility.** Quarterback rushing attempts are a low-frequency event category. A small sample of designed or scramble attempts (particularly for backups with limited snaps) can produce rates that look decisive but are statistically noisy and prone to reversion once the quarterback sees a larger, more defensively game-planned workload.
- **QB sneak inclusion.** QB sneaks are technically designed runs but occur almost exclusively in short-yardage/goal-line situations. Including them in a general designed-rush rate inflates the figure for quarterbacks on teams that convert short-yardage situations frequently; some analysts exclude sneaks to isolate "true" designed runs (zone reads, draws, options) from situational conversions.

### The Injury and Longevity Question

Every model flags this as unresolved: designed runs are commonly assumed to be safer than scrambles because the quarterback anticipates contact and can brace or find a controlled angle, while scrambles more often end in open-field or unanticipated hits. But designed runs — particularly sneaks and short-yardage power runs — also concentrate contact at the goal line and in the box, where hits are typically harder even if fewer in number. No public model has cleanly quantified per-attempt injury risk separately for designed runs versus scrambles, and coaching staffs often phase out designed QB runs as a player ages specifically to protect against this risk, independent of whether the player's underlying rushing ability has declined — which can artificially suppress an aging dual-threat quarterback's fantasy ceiling.

## Key Decisions

- **Decision:** The platform will report designed rush rate and scramble rate as separate metrics, never blended into a single "QB rushing rate" figure.
  **Reasoning:** The two carry different fantasy implications (floor vs. ceiling/volatility) and different projection reliability; collapsing them into one number discards the signal that makes the split useful in the first place.
  **Rejected alternative:** Reporting only total QB rushing attempts per game was rejected because it treats a scripted designed-run role identically to a scramble-dependent profile, which have materially different projection risk.

- **Decision:** The platform will weight designed rush rate more heavily than scramble rate when projecting a quarterback's rushing floor, and will treat scramble rate as a secondary ceiling/volatility adjustment.
  **Reasoning:** Designed rushes are scheme-driven and more scripted; scramble volume is reactive to pass-rush and coverage conditions the platform cannot reliably forecast on a week-to-week basis.
  **Rejected alternative:** Weighting both equally was rejected because it would systematically overstate the reliability of scramble-dependent rushing profiles.

- **Decision:** The platform will flag goal-line designed-rush usage as a distinct input from overall designed rush rate, rather than assuming it scales proportionally.
  **Reasoning:** Goal-line rushing opportunity is scheme-specific and can diverge sharply from a quarterback's overall designed-rush rate; a quarterback with a modest overall rate but a strong short-yardage/sneak role can still carry meaningful touchdown equity that overall rate alone would understate.
  **Rejected alternative:** Deriving goal-line rushing expectation directly from overall designed rush rate was rejected because it would misprice touchdown equity for quarterbacks with concentrated short-yardage roles.

## Open Questions

- Is there a "rush attempt ceiling" that defenses can impose through scheme (spy defenders, contain rushes) on high-scramble quarterbacks, or is scramble rate primarily a function of QB instinct and offensive structure that defenses can't meaningfully suppress? The answer has direct implications for year-to-year scramble-rate projection.
- Does designed rush rate correlate with lower injury risk than scramble rate, as commonly assumed, or does the concentration of goal-line and short-yardage contact on designed plays offset that advantage? No public model has resolved this with confidence.
- How reliably does a new offensive coordinator's historical designed-rush tendency predict a quarterback's rate in year one of a scheme change, versus the quarterback's own prior usage carrying over? Case studies exist; no systematic predictive model has been published.
- As read-option and RPO-heavy offenses become more prevalent, does the designed/scramble distinction itself lose analytical value, or does it require a third category (e.g., "post-snap-read designed run") to remain meaningful?

---

_End of qb-designed-rush-scramble-rate.md_
