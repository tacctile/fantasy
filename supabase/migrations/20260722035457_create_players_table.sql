-- Sleeper-anchored canonical player identity store (Schema Rule #4).
-- sleeper_player_id is the canonical player key app-wide, including for
-- players in ESPN leagues. Text, never numeric: D/ST rows use Sleeper's
-- team-abbreviation-style player_id (e.g. 'DET').
create table public.players (
  sleeper_player_id text primary key,
  full_name text,
  first_name text,
  last_name text,
  position text,
  team text,
  status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.players enable row level security;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();
