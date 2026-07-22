-- Sync-run tracking (Wave 2, cron sub-section): one row per sync unit —
-- a global players-catalog run (league_id null) or one league's slice of a
-- scheduled league-state/draft-poll run — so sync health is visible without
-- digging through Vercel logs, and later ESPN's isolated per-league failures
-- are diagnosable rather than silently swallowed. Operational telemetry, not
-- league-scoped stat data: no season_year (Schema Rule #3 covers stat/score/
-- matchup tables), and league_id is nullable because catalog runs are global.
--
-- Blast radius: creates only this new table (+ its policy/trigger/indexes).
-- Name verified absent from the live shared prolabel schema before creation.

create table public.sync_runs (
  id bigint generated always as identity primary key,
  -- Which sync job produced the row. ESPN jobs extend this set via a new
  -- migration when the ESPN sub-sections unblock.
  source text not null
    check (source in ('players_catalog', 'league_state', 'draft_poll')),
  -- Null for global (non-league-scoped) runs — exactly the players catalog.
  league_id uuid
    references public.leagues (platform_league_uuid) on delete cascade,
  platform public.platform not null,
  -- 'skipped' records a run the once-per-day guard declined to start —
  -- distinct from failure, and never counted as a completed sync.
  status text not null
    check (status in ('running', 'success', 'failure', 'skipped')),
  started_at timestamptz not null,
  completed_at timestamptz,
  -- Per-job record counts as data (shapes differ per source — catalog runs
  -- carry fetched/upserted/inactive, league runs carry roster/matchup/score/
  -- pick counts), mirroring the raw-payload-as-jsonb precedent.
  counts jsonb,
  -- Failure detail. May contain native league IDs — surfaced to the owner
  -- dashboard only, never to any spectator/public surface.
  error_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sync_runs enable row level security;

create policy fantasy_owner_all on public.sync_runs
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create trigger set_updated_at
  before update on public.sync_runs
  for each row execute function public.set_updated_at();

-- FK join index (integrity-index convention), and the guard/recency query
-- path: latest run per source/status, e.g. the players-catalog once-per-day
-- guard's "any running/success run in the last 24h".
create index idx_sync_runs_league_id on public.sync_runs (league_id);
create index idx_sync_runs_source_status_started_at
  on public.sync_runs (source, status, started_at desc);
