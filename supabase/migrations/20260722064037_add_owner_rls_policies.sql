-- Owner RLS policies (Wave 1, Schema — integrity).
-- The fantasy admin is the pre-existing prolabel auth user nick@prolabelco.com
-- (1d5dab52-9b93-4544-a99b-6d4dc3c84a66, created 2026-05-15) — reused by Nick's
-- decision 2026-07-22; a duplicate email cannot be created in the shared namespace.
-- Policies pin to this specific auth.uid(), never the blanket authenticated role:
-- the auth namespace is shared with Nick's other prolabel apps.
-- Full owner CRUD (Nick's decision 2026-07-22): the working tool reads as Nick;
-- share_token spectator READ policies are Wave 4 scope. RLS is already enabled on
-- all ten tables (at creation) with zero policies — deny-by-default until here.

create function public.is_fantasy_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() = '1d5dab52-9b93-4544-a99b-6d4dc3c84a66'::uuid
$$;

comment on function public.is_fantasy_admin() is
  'True when the current session is the fantasy app admin (Nick''s specific auth user). Single place to rotate the admin identity — every fantasy owner policy calls this.';

-- One FOR ALL policy per fantasy table. The (select ...) wrapper makes the check
-- an InitPlan evaluated once per statement, not once per row.
create policy fantasy_owner_all on public.players
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create policy fantasy_owner_all on public.player_id_crosswalk
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create policy fantasy_owner_all on public.leagues
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create policy fantasy_owner_all on public.league_config
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create policy fantasy_owner_all on public.rosters
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create policy fantasy_owner_all on public.roster_players
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create policy fantasy_owner_all on public.matchups
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create policy fantasy_owner_all on public.standings
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create policy fantasy_owner_all on public.player_scores
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create policy fantasy_owner_all on public.draft_state
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));
