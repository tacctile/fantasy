---
title: "Target Distribution / Concentration by Team"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - target-distribution
  - target-share
  - wopr
  - air-yards
  - route-participation
  - red-zone
  - game-script
  - oc-tendencies
related:
  - player-evaluation/target-share
  - player-evaluation/wopr
  - player-evaluation/route-participation-rate
  - player-evaluation/air-yards-share
  - player-evaluation/red-zone-target-share
  - team-scheme/oc-play-calling-tendencies
  - team-scheme/offensive-scheme-identity
  - team-scheme/backup-qb-impact
---

## Summary

Target concentration measures how evenly or unevenly a team distributes its passing volume across its pass-catchers, and it is one of the most consistently corroborated team-context signals across this synthesis: concentrated offenses produce a more reliable WR1/TE1 floor, while diffuse offenses raise weekly variance across the receiving corps but do not automatically eliminate individual value if paired with high team pass volume. All six models converge on target share as the foundational metric, on a concentration index (most commonly a Herfindahl-Hirschman-style calculation or simple top-1/top-2 share) as the standard team-level summary statistic, and on the requirement to condition raw concentration against route participation, team pass-attempt volume, and game script before treating it as a stable, projectable trait.

## Core Knowledge

### Core Metric: Target Share

$$\text{Target Share}_i = \frac{\text{Player Targets}_i}{\text{Team Pass Attempts (or Team Targets)}}$$

League-average WR1 (alpha) target share has been historically stable in the low-to-mid 20s percentage range; a share at or above roughly 25% is generally treated as elite/WR1-caliber territory, while a share below roughly 18% is a WR2/WR3-caliber opportunity profile independent of efficiency. Target share alone is incomplete — a player must be on the field and running routes to earn targets, so it should always be paired with route participation:

$$\text{Target Rate per Route}_i = \frac{\text{Targets}_i}{\text{Routes Run}_i}$$

$$E[\text{Targets}_i] = E[\text{Team Pass Attempts}] \times E[\text{Route Participation}_i] \times E[\text{Target Rate per Route}_i]$$

### Team-Level Concentration Measures

Multiple concentration formulas recur across responses and are functionally interchangeable summary statistics of the same underlying distribution:

- **Herfindahl-Hirschman Index (HHI) adaptation:** $$HHI = \sum_{i=1}^{n} s_i^2$$, where $$s_i$$ is each pass-catcher's target share (as a proportion). Higher values indicate greater concentration. A rough working threshold cited across responses: HHI above roughly 0.22-0.25 indicates a strongly concentrated ("funnel") offense; HHI below roughly 0.15-0.18 indicates a diffuse offense. Exact cutoffs are not standardized across providers and should be treated as directional, not precise.
- **Effective number of target earners:** $$N_{\text{effective}} = \frac{1}{\sum_{i=1}^{n} s_i^2}$$ — interprets HHI as "how many equally targeted players would produce this level of concentration."
- **Top-1 and top-2 concentration:** the simplest and most actionable practical measures — the leading receiver's share alone, or the top two receivers' combined share, ordered largest to smallest.
- **Shannon entropy** as an alternative full-distribution measure, more sensitive to the tail of the distribution than HHI, which is dominated by the largest share(s).

All variants require an explicit, disclosed choice of denominator (team pass attempts vs. team targets vs. dropbacks) and inclusion rules (whether running backs, fullbacks, and low-route-count players are included), since these choices materially change the computed concentration value and are not consistent across providers.

### Validating Concentration Quality: Air Yards and Route Participation

Raw target share can be misleading without quality layers. Two corroborating metrics recur across all six responses:

- **Air Yards Share** — a player's share of team total air yards, which distinguishes concentration built on downfield, high-value targets from concentration built on short-area checkdowns and screens ("junk volume"). A receiver with a given target share and a disproportionately higher air-yards share represents higher-quality, more fantasy-relevant concentration.
- **Route Participation** — the percentage of team dropbacks on which a player runs a route. A player with a high target share but low route participation (a part-time, high-intent role) carries a much less stable opportunity base than a player with a lower target share but near-full route participation. Targets per route run (TPRR) is repeatedly identified as the most stable in-season leading indicator of future target share, since it is normalized for playing time and predicts that target volume will scale once route participation increases.

The synthesized fantasy-relevant framing, consistent across responses:

$$\text{Receiver Fantasy Ceiling} \approx \text{Team Pass Volume} \times \text{Player Target Share} \times \text{Efficiency} \times \text{Scoring Environment}$$

A concentrated offense raises the share term but does not guarantee sufficient team pass volume; a genuinely low-volume, low-tempo offense can produce a high concentration index and still yield insufficient raw target counts for elite fantasy output.

### Edge Cases, Failure Patterns, and Pitfalls

- **False/fake concentration from low volume.** A high concentration index on a low-pass-volume team can still yield an insufficient raw target count. Concentration must always be multiplied by projected team pass attempts before being treated as actionable opportunity — a 30% share on 28 team attempts and a 22% share on 42 team attempts can produce nearly identical raw target counts.
- **Injury-driven distortion.** When a team's WR2 or another pass-catcher is out, the remaining top target-earner's share inflates artificially. This is a depth-chart artifact, not a durable structural trait, and should not be projected forward once the injured player returns. Best practice across responses is to establish concentration from healthy-lineup weeks specifically.
- **Game-script confounding.** Teams trailing tend to increase overall pass volume, but that additional volume often flows disproportionately to running backs and secondary/slot receivers in catch-up/checkdown mode rather than to the nominal top receiver; teams with a lead tend to run more and, when they do throw, concentrate more tightly on the reliable top option. A concentration figure computed across all game states blends two structurally different behaviors — the standard correction is to segment concentration by competitive-game state (commonly within one score) versus blowout state.
- **Rookie-quarterback effect.** Teams starting a rookie quarterback frequently show artificially inflated top-receiver target share for the first several weeks as the quarterback defaults to his most trusted or largest target; this normalizes as the quarterback develops and should not be extrapolated as a season-long baseline from early-season data.
- **Red-zone concentration is a distinct layer.** Overall-field concentration can conceal a materially different distribution inside the red zone — a team can distribute targets evenly between the 20s while funneling nearly all red-zone or end-zone targets to a single tight end or receiver. Red-zone target concentration should be evaluated as its own metric, separate from overall target concentration, since it disproportionately drives touchdown outcomes.
- **Position-mix distortion.** Including running backs and tight ends in a single team-wide concentration calculation can produce a "diffuse" reading that does not reflect true wide receiver competition; a team can look diffuse overall while its WR corps specifically is tightly concentrated (or vice versa). Concentration should be computed separately for the full pass-catcher pool and for the receiver-specific subset when the question concerns WR valuation specifically.
- **Small-sample and early-season instability.** Concentration computed from fewer than roughly 6 games is unstable and should not be treated as a settled team trait; multiple responses converge on a rolling multi-week window (commonly 4-6 games) rather than season-to-date aggregation for in-season decisions.
- **Vacated-target redistribution is not proportional.** When a top target-earner is traded, injured long-term, or departs in the offseason, remaining players do not inherit vacated targets in proportion to their prior share — the redistribution depends on route-tree overlap, coach trust, and which specific players absorb the departed player's routes, and models that assume proportional redistribution systematically overstate the new top target-earner's projected share.

### Platform and Provider Differences

- **Denominator choice** varies meaningfully across providers — some compute target share against raw official team pass attempts, others against team targets net of spikes, throwaways, and batted passes at the line. Providers stripping out uncatchable/administrative plays produce a cleaner, generally higher "earned" target share reading for the same player, particularly on offenses with an error-prone or risk-averse quarterback.
- **Route definition** differs across charting providers, affecting targets-per-route-run calculations specifically for running backs and safety-valve tight ends — some count any pass play where a player does not stay in to block as a route run, others require the player to cross the line of scrimmage with clear route intent.
- **Concentration-index reporting is inconsistent.** Most public-facing platforms report only simple top-receiver or top-two target share rather than a full HHI or entropy calculation; formal concentration indices are more common in advanced/proprietary analytics products than in mainstream fantasy tools, and exact threshold conventions (what counts as "concentrated" vs. "diffuse") are not standardized across sources.
- **Season-total versus per-game reporting** produces different pictures — season totals can mask missed games or a mid-season role change, while a small per-game sample can overstate volatility; responses converge that both views should be available rather than defaulting to one.

## Key Decisions

- **Decision:** The platform will compute and display target concentration (HHI or effective-number equivalent, plus simple top-1/top-2 share) separately for the full pass-catcher pool and for the wide-receiver-only subset, using a rolling multi-week window as the default rather than season-to-date aggregate.
  **Reasoning:** All six models converge that including running backs and tight ends in a single figure can misrepresent WR-specific competition, and that season-long aggregation blends game-script, injury, and rookie-quarterback distortions that a rolling window avoids.
  **Rejected alternative:** A single season-long, all-pass-catchers concentration figure was rejected because it conflates structurally different information (true WR competition vs. overall pass-catcher diffusion) and hides in-season shifts that matter more for weekly decisions than season averages.

- **Decision:** The platform will always pair a displayed target-share or concentration figure with team pass-attempt volume and route participation, and will not present raw concentration as a standalone opportunity signal.
  **Reasoning:** Every model identifies the "false concentration from low volume" and "target share without route participation" pitfalls as the most common misreadings of this metric; volume and route context are necessary companions, not optional enrichments.
  **Rejected alternative:** Displaying target share or concentration index alone as a leaderboard metric was rejected because it would imply a direct opportunity guarantee that no source supports independent of pass volume and route context.

- **Decision:** The platform will surface red-zone target concentration as a distinct figure from overall-field target concentration, rather than a single blended number.
  **Reasoning:** Multiple models independently flag that red-zone/end-zone target distribution frequently diverges sharply from between-the-20s distribution and disproportionately drives touchdown-dependent scoring outcomes; a blended figure would conceal this divergence.
  **Rejected alternative:** A single inside-the-20-and-out concentration figure was rejected as the common industry oversimplification the platform can meaningfully improve on given available red-zone play-by-play.

- **Decision:** The platform will exclude weeks affected by a significant injury to another pass-catcher when establishing a player's baseline target-share and concentration profile, flagging injury-affected weeks separately rather than blending them into the healthy-lineup baseline.
  **Reasoning:** Injury-driven target-share inflation is identified across responses as a common source of overstated concentration that does not persist once the injured player returns.
  **Rejected alternative:** Using an unadjusted season-to-date target share regardless of lineup health was rejected because it would systematically overstate a backup or WR2's true concentrated role.

## Open Questions

- [ ] Is target concentration primarily a durable team/scheme trait, a quarterback-specific tendency, or primarily a reflection of available player talent depth? — needs multi-year panel data isolating quarterback changes while holding scheme and personnel depth roughly constant.
- [ ] What is the minimum sample size (in games or routes) at which a target concentration reading becomes statistically stable rather than noise? — needs a formal stabilization-point analysis across multiple NFL seasons.
- [ ] Does target-quality-weighted concentration (incorporating air yards and route depth) outperform raw target-count concentration for predicting fantasy scoring, particularly in PPR formats? — needs a direct predictive-accuracy comparison, which no single model response provided with verifiable methodology.
