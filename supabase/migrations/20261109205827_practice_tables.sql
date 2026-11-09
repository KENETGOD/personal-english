-- F2 / T-2.2: practice_sessions, exercise_attempts, daily_activity, achievements (docs/06 sections 3.1, 3.3).
-- All four are derived/integrity data: owner read-only, no insert/update/delete policies or privileges.
-- Writes happen only through security definer functions (next migration), RNF-SEC-12.

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('reading', 'writing', 'speaking', 'vocabulary', 'mixed')),
  plan jsonb not null default '{}' check (jsonb_typeof(plan) = 'object' and pg_column_size(plan) <= 16384),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned'))
);

create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  content_id uuid references public.content_items(id),
  activity_type text not null check (activity_type in (
    'review', 'new_word', 'reading', 'writing', 'conversation', 'shadowing', 'minimal_pairs', 'free_talk', 'grammar')),
  status text not null default 'started'
    check (status in ('started', 'completed', 'completed_partial', 'skipped', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  valid_seconds int not null default 0 check (valid_seconds >= 0),
  xp int not null default 0 check (xp >= 0),
  score numeric,
  prompt_version text
);

create table public.daily_activity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  active_seconds int not null default 0 check (active_seconds >= 0),
  xp int not null default 0 check (xp >= 0),
  goal_minutes smallint not null check (goal_minutes in (10, 15, 20, 30)),
  status text not null default 'none' check (status in ('none', 'met', 'frozen')),
  primary key (user_id, local_date)
);

create table public.achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null check (char_length(code) between 1 and 64),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);

create index practice_sessions_user_idx on public.practice_sessions (user_id, started_at desc);
create index exercise_attempts_user_completed_idx on public.exercise_attempts (user_id, completed_at desc);
create index exercise_attempts_session_idx on public.exercise_attempts (session_id);

alter table public.practice_sessions enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.daily_activity    enable row level security;
alter table public.achievements      enable row level security;

create policy sessions_read on public.practice_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy attempts_read on public.exercise_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy daily_read on public.daily_activity
  for select to authenticated using ((select auth.uid()) = user_id);
create policy achievements_read on public.achievements
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.practice_sessions from anon, authenticated;
revoke all on public.exercise_attempts from anon, authenticated;
revoke all on public.daily_activity    from anon, authenticated;
revoke all on public.achievements      from anon, authenticated;
grant select on public.practice_sessions to authenticated;
grant select on public.exercise_attempts to authenticated;
grant select on public.daily_activity    to authenticated;
grant select on public.achievements      to authenticated;
