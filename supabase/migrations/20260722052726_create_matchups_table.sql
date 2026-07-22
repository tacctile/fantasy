-- Weekly matchup participant rows (Schema Rules #1/#2/#3). One row per
-- roster per week — Sleeper's native response grain, and the interval
-- both platforms key player stats to. Pairings are reconstructed by
-- grouping rows on (league_id, week, native_matchup_id) and validating
-- group size, never forced into home/away pairs: byes, odd team counts,
-- and consolation formats legitimately produce group sizes other than
-- two, and median-league results need every roster's weekly points
-- regardless of pairing. ESPN schedule entries split into two rows (one
-- per side) at ingestion.

create table public.matchups (
  league_id uuid not null
    references public.leagues (platform_league_uuid) on delete cascade,
  native_roster_id integer not null,
  platform public.platform not null,
  season_year integer not null,
  -- NFL stat-accumulation interval: Sleeper week / ESPN scoringPeriodId.
  week integer not null,
  -- Fantasy contest interval: ESPN matchupPeriodId, stored distinct from
  -- week — equal only in single-week formats; a multi-week playoff round
  -- shares one matchup_period across its constituent weeks. Sleeper has
  -- no native contest-interval ID, so its rows carry matchup_period =
  -- week (enforced below); round structure comes from the bracket
  -- resources, never inferred here.
  matchup_period integer not null,
  -- Weekly pairing key as-received (Sleeper matchup_id / ESPN schedule
  -- entry id — both wire integers). Scoped to (league_id, week), never
  -- meaningful across weeks. Null = no head-to-head contest that week
  -- (bye); null rows are excluded from pairing groups, not grouped
  -- together.
  native_matchup_id integer,
  -- ESPN only: which side of the schedule entry this roster occupied.
  is_home boolean,
  -- Platform-computed weekly total as-received (Sleeper points / ESPN
  -- side total). Nullable — a future or unreported period has no value.
  points numeric,
  -- Sleeper only: commissioner manual override; takes precedence over
  -- points when present. ESPN folds adjustments into its total.
  custom_points numeric,
  -- The precedence rule realized once in schema: override when present,
  -- else the computed total.
  effective_points numeric
    generated always as (coalesce(custom_points, points)) stored,
  -- Neither platform signals finality; scores shift during live play and
  -- through the multi-day stat-correction window after games end. Sync
  -- stamps each successful read and promotes is_final only via our own
  -- policy (games complete + correction window elapsed + stable repeat
  -- reads) — never from any payload field.
  fetched_at timestamptz,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_id, week, native_roster_id),
  foreign key (league_id, native_roster_id)
    references public.rosters (league_id, native_roster_id) on delete cascade,
  constraint matchup_period_equals_week_on_sleeper
    check (platform <> 'sleeper' or matchup_period = week),
  constraint is_home_espn_only
    check (is_home is null or platform = 'espn'),
  constraint custom_points_sleeper_only
    check (custom_points is null or platform = 'sleeper')
);

alter table public.matchups enable row level security;

create trigger set_updated_at
  before update on public.matchups
  for each row execute function public.set_updated_at();
