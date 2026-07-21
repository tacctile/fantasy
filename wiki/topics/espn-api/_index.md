# ESPN API

ESPN platform integration reference: undocumented view parameters, cookie-based auth (espn_s2, SWID), rate limits, and endpoint structure for rosters, draft state, standings, and matchups.

| Page | Description | Confidence |
| ---- | ------------ | ---------- |
| [authentication](authentication.md) | Cookie-based auth model (SWID/espn_s2), origin, public/private league distinction, extraction procedure, and validation-driven refresh strategy. | high |
| [format-requirements](format-requirements.md) | Cookie header construction, SWID brace and espn_s2 encoding pitfalls, client-interface differences, supplementary headers. | high |
| [data-completeness](data-completeness.md) | Public vs. private league data parity, view-parameter-dependence, and the specific resources withheld from every caller regardless of authentication. | high |
