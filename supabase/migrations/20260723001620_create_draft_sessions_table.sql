-- Draft-session state (Wave 3b, active-draft polling orchestration): the
-- admin-only is_draft_active flag, keyed by league — toggling it is what
-- elevates draft polling to live cadence. Deliberately its OWN table, NOT a
-- column on leagues or league_config: both of those receive share_token-gated
-- spectator SELECT policies in Wave 4, and draft state must never be
-- spectator-reachable at any wave (build-file mandate). This table gets the
-- owner policy only — no spectator policy will ever be added to it.
--
-- 1:1 extension of the league row (league_config precedent): league_id is PK
-- and FK, and platform/season_year are deliberately not duplicated — the
-- parent leagues row carries both. Operational state, not stat data — no
-- season_year per the sync_runs precedent (Schema Rule #3 covers stat/score/
-- matchup tables).
--
-- Staleness is computed at READ time (Nick's 2026-07-22 Clarify decision):
-- readers treat the flag as inactive once activated_at is older than the
-- 6-hour soft TTL — no scheduled job ever mutates this row.
--
-- Blast radius: creates only this new table (+ its policy/trigger).
-- Name verified absent from the live shared prolabel schema (62 tables
-- listed, no draft_sessions) before creation.

create table public.draft_sessions (
  league_id uuid primary key
    references public.leagues (platform_league_uuid) on delete cascade,
  is_draft_active boolean not null default false,
  -- Set on every activation — the soft-TTL anchor. Required while active so
  -- the read-time staleness computation always has a timestamp to work from.
  activated_at timestamptz,
  -- Set on explicit deactivation (audit trail of the last stop; null until
  -- the first stop or while a session has only ever been started).
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_requires_activated_at
    check (not is_draft_active or activated_at is not null)
);

alter table public.draft_sessions enable row level security;

create policy fantasy_owner_all on public.draft_sessions
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create trigger set_updated_at
  before update on public.draft_sessions
  for each row execute function public.set_updated_at();
