-- Extend sync_runs.source with 'adp_ingestion' (Wave 3a) — the extension
-- path the sync_runs migration itself specified for new job families. ADP
-- ingestion runs are global (league_id null, like the players catalog) with
-- platform 'sleeper'.
--
-- Blast radius: alters only the fantasy-owned public.sync_runs table's own
-- check constraint (name verified live against pg_constraint before
-- writing). No other table touched.

alter table public.sync_runs
  drop constraint sync_runs_source_check;

alter table public.sync_runs
  add constraint sync_runs_source_check
    check (source in ('players_catalog', 'league_state', 'draft_poll', 'adp_ingestion'));
