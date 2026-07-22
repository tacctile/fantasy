-- Corrective migration after verifying players against the sleeper-api wiki
-- (players-endpoint, player-data-quirks) — promotes fields the wiki assigns a
-- concrete platform role from the metadata blob to first-class columns.
-- All nullable: field presence is uneven across Sleeper's dump.
--
-- fantasy_positions + search_rank: with status and team, the wiki-specified
--   four-field combination required to filter fantasy relevance.
-- injury_status: independent of status; the two must be read together and can
--   legitimately disagree during transaction windows — never conflate.
-- search_full_name + birth_date: the identity ADR's last-resort flagged
--   name-matching key (with position); search_full_name is Sleeper's own
--   normalized fuzzy-lookup field.
--
-- Deliberately still absent: bye_week (derived from team schedule at read
-- time, never stored on the player) and any practice-squad/elevation flag
-- (elevation is invisible to the daily dump; sourced fresher in Wave 2).
alter table public.players
  add column fantasy_positions text[],
  add column search_rank integer,
  add column injury_status text,
  add column search_full_name text,
  add column birth_date date;
