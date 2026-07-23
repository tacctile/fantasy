-- Wave 4 named-singleton #5: the share-token data-exposure boundary.
--
-- Adds SELECT-only spectator RLS on the eight fantasy tables the read-only
-- share-link surface reads, gated on a valid share_token presented via the
-- `x-share-token` request header. Writes stay owner-only — the existing
-- fantasy_owner_all policies (FOR ALL TO authenticated, is_fantasy_admin) are
-- untouched. draft_state and draft_sessions deliberately receive NO spectator
-- policy: they remain deny-by-default to the anon role even with a valid token
-- (build-file mandate; MASTER_CONTEXT Access Model — the spectator surface must
-- never reach draft data at any wave).
--
-- Tables covered (six from the build file + players + roster_players, the two
-- the reused getMatchups/getPlayerCard getters also read — Nick-signed
-- correctness amendment 2026-07-23): leagues, league_config, rosters,
-- roster_players, matchups, standings, player_scores, players.
--
-- Blast radius (Absolute Rule 13): every object below is fantasy-owned and
-- listed in ARCHITECTURE.md's "Database Schema (live)" inventory — the eight
-- tables above, plus two new fantasy functions. NO foreign prolabel table or
-- function is referenced or altered. Owner policies and is_fantasy_admin() are
-- unchanged. GRANT SELECT to anon on these eight fantasy tables changes anon
-- privilege on fantasy tables only; RLS still gates every row.

-- The share_token presented on the current request via the `x-share-token`
-- header. PostgREST exposes request headers as a JSON object through the
-- `request.headers` GUC (header names lower-cased). Returns null when the
-- header is absent or blank so a token-less anon request matches no spectator
-- policy. STABLE + set search_path = '' (shared-namespace hardening). Single
-- source for the presented token — every spectator policy calls it.
create function public.current_share_token()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(
    coalesce(
      (nullif(current_setting('request.headers', true), '')::json) ->> 'x-share-token',
      ''
    ),
    ''
  )
$$;

comment on function public.current_share_token() is
  'The share_token presented on the current request via the x-share-token header (PostgREST request.headers GUC, lower-cased). Null when absent/blank so a token-less request matches no spectator RLS policy. Every share-token SELECT policy calls this.';

-- Owner-only regenerate/revoke: replaces one league's share_token with a fresh
-- generate_share_token() value, atomically invalidating the previous spectator
-- link (revoke == regenerate; share_token is NOT NULL, so there is no
-- "no link" state). SECURITY INVOKER — the caller's own RLS UPDATE policy
-- (fantasy_owner_all / is_fantasy_admin) is the authorization wall: a non-admin
-- caller updates zero rows and receives null. EXECUTE restricted to
-- authenticated so anon cannot even invoke the mutation.
create function public.regenerate_share_token(p_league_id uuid)
returns text
language sql
volatile
set search_path = ''
as $$
  update public.leagues
     set share_token = public.generate_share_token()
   where platform_league_uuid = p_league_id
  returning share_token
$$;

comment on function public.regenerate_share_token(uuid) is
  'Owner-only: replaces one league''s share_token with a fresh generate_share_token() value, invalidating the previous spectator link. SECURITY INVOKER — RLS (fantasy_owner_all/is_fantasy_admin) authorizes; a non-admin updates nothing and receives null.';

revoke execute on function public.regenerate_share_token(uuid) from public;
grant execute on function public.regenerate_share_token(uuid) to authenticated;

-- Base privilege: anon must be able to reach these tables for RLS to filter
-- rows (a missing GRANT is a hard permission error before RLS is consulted).
-- Access still requires a matching spectator policy below — GRANT without a
-- policy leaves RLS deny-by-default. SELECT only; anon never writes.
grant select on
  public.leagues,
  public.league_config,
  public.rosters,
  public.roster_players,
  public.matchups,
  public.standings,
  public.player_scores,
  public.players
to anon;

-- League identity: exactly the one league whose share_token matches the
-- presented header (share_token is unique). Wrapped in (select ...) so the
-- token lookup is an InitPlan evaluated once per statement, matching the owner
-- policies' pattern.
create policy spectator_share_read on public.leagues
  for select to anon
  using (share_token = (select public.current_share_token()));

-- League-scoped child tables: rows whose league_id resolves from the presented
-- token. The uncorrelated subselect is a single InitPlan per statement.
create policy spectator_share_read on public.league_config
  for select to anon
  using (
    league_id in (
      select platform_league_uuid from public.leagues
      where share_token = (select public.current_share_token())
    )
  );

create policy spectator_share_read on public.rosters
  for select to anon
  using (
    league_id in (
      select platform_league_uuid from public.leagues
      where share_token = (select public.current_share_token())
    )
  );

create policy spectator_share_read on public.roster_players
  for select to anon
  using (
    league_id in (
      select platform_league_uuid from public.leagues
      where share_token = (select public.current_share_token())
    )
  );

create policy spectator_share_read on public.matchups
  for select to anon
  using (
    league_id in (
      select platform_league_uuid from public.leagues
      where share_token = (select public.current_share_token())
    )
  );

create policy spectator_share_read on public.standings
  for select to anon
  using (
    league_id in (
      select platform_league_uuid from public.leagues
      where share_token = (select public.current_share_token())
    )
  );

create policy spectator_share_read on public.player_scores
  for select to anon
  using (
    league_id in (
      select platform_league_uuid from public.leagues
      where share_token = (select public.current_share_token())
    )
  );

-- players is the global, non-league-scoped canonical identity catalog (public
-- NFL identity data — names/positions/teams). Readable to any holder of a
-- valid token (Nick's Clarify: full spectator matchups/player cards). Gated on
-- the presence of a matching league, not a per-row league_id (there is none).
create policy spectator_share_read on public.players
  for select to anon
  using (
    exists (
      select 1 from public.leagues
      where share_token = (select public.current_share_token())
    )
  );
