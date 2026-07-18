---
title: "Weather Impact (Wind, Precipitation, Cold, Dome)"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - weather
  - wind
  - implied-team-total
  - vegas-total
  - game-script
  - pass-rate
  - adot
related:
  - team-scheme/vegas-implied-team-total
  - team-scheme/pace-of-play
  - player-evaluation/average-depth-of-target
  - player-evaluation/drop-rate
---

## Summary

Weather affects fantasy production through three distinct and non-equivalent mechanisms — wind, precipitation, and cold — and every model in this synthesis converges that wind is by far the dominant, most reliable, and most actionable variable, with a meaningful effect threshold around 15 mph sustained that escalates non-linearly and disproportionately damages deep passing. Precipitation's primary fantasy channel is drops and fumbles rather than completion percentage, cold alone (once wind is controlled for) is a weak standalone factor commonly overstated by casual analysis, and dome/indoor games neutralize all three vectors, producing systematically more stable and reliable passing environments. The platform should treat "bad weather" as a multidimensional, position- and route-depth-specific input rather than a single blanket downgrade applied to every player in a game.

## Core Knowledge

### Wind — the Dominant Variable

Wind disrupts ball flight through aerodynamic drag and crosswind drift, and its effect on passing efficiency is non-linear rather than a flat percentage-per-mph relationship. Below roughly 10 mph, effects are within measurement noise. Sustained wind at or above approximately 15 mph is the consensus threshold at which passing efficiency (completion percentage, yards per attempt, deep-ball accuracy) begins degrading consistently and materially; effects intensify further and become severe above 25 mph, and near-catastrophic for accurately thrown deep balls above 30 mph.

The damage is not uniform across route depth. Deep passing (intermediate-to-vertical concepts) is disproportionately affected because the ball is in the air longer, giving wind more time to exert force on trajectory and velocity; short and quick-game passing is far less affected. This means an offense's typical depth of target matters as much as raw wind speed — a short-area, quick-game offense is meaningfully more wind-resistant than a vertical, explosive-pass-dependent offense, and a flat wind-speed adjustment applied uniformly to all offenses misrepresents this interaction.

Wind direction relative to the throw matters distinctly from wind speed alone: a crosswind disrupts intermediate and sideline throwing windows continuously throughout the game, while a pure headwind or tailwind primarily affects straight-line deep-ball distance and field-goal/punt distance. Models that report only wind speed without direction are missing a materially important dimension — the same headline wind speed can mean very different things depending on whether it is blowing across or along the field.

Kicking is also directly and reliably affected: long field-goal attempts and punts lose distance and accuracy in sustained wind, and this is described across sources as one of the single most consistent weather effects in the data, more reliable than most passing-efficiency adjustments.

### Precipitation — a Different Mechanism Than Wind

Rain and snow operate through a distinct physical channel than wind: reduced grip (ball security, catch reliability) and reduced footing/traction, rather than aerodynamic disruption. The fantasy-relevant consequence is that precipitation's primary effect is elevated drop rate and fumble rate, not a large independent reduction in completion percentage — several models converge that light-to-moderate rain alone, without accompanying wind, has a smaller effect on core passing efficiency than casual fantasy analysis typically assumes. Heavy precipitation (versus light) matters considerably more; treating all "rain" as a single undifferentiated condition understates the range of actual impact between light drizzle and a heavy, sustained downpour or snow accumulation.

Snow adds visibility and traction complications beyond rain, and its effects compound with wind and cold when present simultaneously — these three variables frequently co-occur in the same storm system, and applying full independent penalties for each without accounting for their correlation risks double-counting the same underlying weather event.

### Cold — Commonly Overstated as a Standalone Factor

Once wind and precipitation are controlled for, cold temperature alone has a comparatively weak independent effect on passing efficiency. Much of the historically observed "cold hurts passing" pattern is a confound: cold-weather games are disproportionately also windy games, and analyses that fail to separate the two variables attribute wind's effect to cold. Extreme cold does have a real, if secondary, mechanism: below-freezing temperatures increase ball hardness and rigidity, which reduces grip and modestly raises drop risk and fumble risk independent of precipitation. This effect is generally described as smaller and less consistent than the wind effect, and should be weighted accordingly — a moderate cold game with calm wind is a substantially weaker weather concern than a moderate-temperature game with strong wind.

### Dome and Indoor Environments

Dome and fully indoor stadiums eliminate all three outdoor weather vectors, producing a stable, predictable passing environment and — independent of any specific efficiency boost — a lower-variance, more reliable projection environment generally. This reliability benefit (reduced projection uncertainty) is treated across sources as at least as important as any raw efficiency advantage, since it removes a major source of game-to-game unpredictability rather than simply inflating expected output. Retractable-roof stadiums require checking actual roof status rather than assuming dome-equivalent conditions by default, since roof status can vary by game and is sometimes misclassified by automated weather feeds that default to outdoor conditions.

### Fantasy Translation and Positional Effects

Severe wind and heavy precipitation together tend to compress the passing game and shift play-calling toward shorter, lower-variance concepts: more designed runs, screens, and quick-game throws, fewer vertical shots. This shift does not automatically translate into a clean running-back upgrade — while rush attempt share can rise, overall offensive efficiency, red-zone trips, and total scoring opportunity can decline simultaneously, meaning the net effect on a given running back's fantasy output is not uniformly positive and depends on whether his volume and role were already secure.

By position, the converging pattern is:
- **Quarterbacks and vertical/deep-threat receivers** carry the most weather downside, since their value is concentrated in exactly the throws wind disrupts most.
- **Short-area, high-target-share receivers and pass-catching backs** are comparatively weather-resistant, since their target profile shifts less under compressed passing conditions and may even see target concentration increase.
- **Tight ends**, who typically operate at shorter average depth of target with larger catch radius, are among the least weather-sensitive pass-catching positions, though this is a lower-confidence, less-tested conclusion than the wind/deep-ball relationship.
- **Kickers** carry the single most consistent and reliable weather downgrade in the data, specifically for long field-goal attempts in high wind.
- **Running backs** benefit conditionally, not unconditionally — the benefit depends on whether the offense's overall efficiency and scoring opportunity hold up despite the more run-heavy approach.

### Platform and Provider Variance

Weather data and adjustment methodology vary substantially across analytics providers, and this variance itself is a source of projection disagreement independent of the underlying weather science:

- **Data sourcing:** Some tools use the nearest airport or regional weather station rather than stadium-specific conditions, which can misrepresent actual field-level wind — stadium architecture (open end zones versus enclosed bowls) can meaningfully amplify or shield a field from ambient wind readings.
- **Threshold vs. continuous modeling:** Some platforms apply a binary/categorical treatment (e.g., a flat downgrade once wind crosses a single threshold), while others apply continuous or non-linear adjustment curves. Binary threshold models are simpler to communicate but blunt real differences between moderate and severe conditions.
- **Sustained wind vs. gusts:** Providers differ in whether they weight sustained wind speed or peak gusts more heavily; gusts are argued by some sources to matter more for deep throws and kicks specifically, though the exact relative weighting is not settled.
- **Forecast timing:** Early-week forecasts carry meaningfully more uncertainty than game-day or near-kickoff readings; platforms that lock projections early in the week are more exposed to forecast error than those that update close to kickoff.
- **Dome misclassification:** Some tools have been observed to apply outdoor weather logic incorrectly to dome or closed-roof games, or fail to check actual roof status on retractable-roof stadiums.

## Key Decisions

- **Decision:** The platform will treat wind — not precipitation or cold — as the primary weather input for adjusting quarterback, wide receiver, and kicker projections, using sustained wind and, where available, direction relative to field orientation.
  **Reasoning:** Every source converges that wind is the dominant and most reliably actionable weather variable, with a well-corroborated ~15 mph threshold, while precipitation and cold effects are secondary, smaller, and more inconsistent across sources.
  **Rejected alternative:** Treating "bad weather" as a single undifferentiated category (combining wind, rain, and cold into one flat downgrade) was rejected because it discards the strongest and most specific signal in the data — wind — and would misapply weather adjustments to games with precipitation or cold but calm wind, which carry substantially less risk.

- **Decision:** The platform will scale wind-based downgrades by the affected offense's or player's typical depth of target, applying a larger downgrade to deep-dependent passing profiles and a smaller downgrade to short-area, quick-game profiles, rather than a single flat wind adjustment applied uniformly to every passer and receiver in the game.
  **Reasoning:** The disproportionate impact of wind on deep passing versus short passing is one of the most consistently documented mechanisms across sources, and a uniform adjustment would systematically overstate risk for weather-resistant short-area players and understate it for vertical-offense-dependent players.
  **Rejected alternative:** Applying an identical percentage downgrade to all pass-catchers in a windy game regardless of route depth was rejected as the most commonly cited modeling error across sources.

- **Decision:** The platform will source weather data at the stadium level (not nearest-airport) where available, and will apply a lower-confidence flag to weather-based adjustments when only regional station data is available.
  **Reasoning:** Stadium architecture can materially amplify or shield ambient wind, and multiple sources specifically identify airport-proxy weather data as a documented source of projection error.
  **Rejected alternative:** Using regional or airport weather data uniformly without a data-quality flag was rejected because it presents low-fidelity weather inputs with the same implied confidence as stadium-specific readings.

- **Decision:** The platform will apply the single strongest and most consistent weather downgrade to kicker field-goal probability (particularly long attempts) in high wind, weighting this more heavily than the corresponding quarterback/receiver downgrade.
  **Reasoning:** Sources converge that the wind-to-field-goal-accuracy relationship is among the most reliable and least contested weather effects identified, stronger and more consistent than most passing-efficiency adjustments.
  **Rejected alternative:** Treating kicker weather risk as proportional to the general offensive weather downgrade was rejected because kicking accuracy is described as more directly and severely wind-sensitive than passing efficiency.

## Open Questions

- [ ] What is the correct functional relationship between wind speed and passing-efficiency degradation — linear, threshold-based, or a more complex non-linear curve scaled by depth of target — and should the platform build or license a validated model rather than relying on an approximate threshold rule? — no source in this synthesis provided a verified, reproducible coefficient suitable for direct implementation.
- [ ] How should the platform weight sustained wind versus peak gusts, particularly for kicking and deep-pass accuracy? — flagged as plausibly important by multiple sources but without a settled relative weighting.
- [ ] Does elite quarterback arm talent meaningfully mitigate wind effects relative to average passers, and if so, by how much? — a plausible but unverified claim raised in this synthesis; would require player-specific wind-performance data to validate.
- [ ] How should precipitation and wind adjustments be combined when both are present in the same game, given that they frequently co-occur and independent additive penalties risk double-counting the same weather system? — no source provided a validated combined-effect model.
