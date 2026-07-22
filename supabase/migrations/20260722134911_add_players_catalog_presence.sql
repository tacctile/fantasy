-- Catalog-presence tracking for the Wave 2 Sleeper players-dump sync.
-- Deliberately distinct from Sleeper's own `status` column (whose value set
-- includes its own 'Inactive', meaning NFL roster standing): these columns
-- record presence in the daily /players/nfl catalog response itself.
-- Players absent from a completed catalog response are marked inactive,
-- never deleted — historical roster/draft references must keep resolving.
--
-- is_active_in_catalog: false once a completed catalog response omits the
--   player; flipped back to true if the player reappears.
-- catalog_last_seen_at: stamped with the sync run's start time on every row
--   present in that run's response — makes the mark-absent pass a single
--   set-based UPDATE and records when an absent player was last seen.
alter table public.players
  add column is_active_in_catalog boolean not null default true,
  add column catalog_last_seen_at timestamptz;
