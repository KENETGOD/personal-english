-- F1: profiles, streaks, handle_new_user trigger, RLS (docs/06 section 4.1-4.2).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  timezone text not null default 'America/Mexico_City',
  timezone_changed_at timestamptz,
  daily_goal_minutes smallint not null default 15 check (daily_goal_minutes in (10,15,20,30)),
  pending_daily_goal smallint check (pending_daily_goal in (10,15,20,30)),
  weekly_goal_days smallint not null default 5 check (weekly_goal_days between 1 and 7),
  accent text not null default 'en-US' check (accent in ('en-US','en-GB')),
  playback_rate numeric(3,2) not null default 1.00 check (playback_rate between 0.5 and 1.25),
  interests text[] not null default '{}',
  new_cards_per_day smallint not null default 10 check (new_cards_per_day between 0 and 50),
  correction_mode text not null default 'per_turn' check (correction_mode in ('per_turn','end')),
  reminder_time time,
  sublevels jsonb not null default '{"reading":"B1","writing":"B1","speaking":"B1","vocabulary":"B1"}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_goal_date date,
  freezes_available smallint not null default 0 check (freezes_available between 0 and 2),
  total_days_met int not null default 0,
  updated_at timestamptz not null default now()
);

-- Creates profile and streak when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.streaks (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS on every table.
alter table public.profiles enable row level security;
alter table public.streaks  enable row level security;

create policy profile_select on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profile_update on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Derived data: read-only for the owner, no insert/update/delete policies (RNF-SEC-12).
create policy streak_read on public.streaks
  for select to authenticated using ((select auth.uid()) = user_id);

-- Privileges: least privilege on top of RLS.
revoke all on public.profiles from anon, authenticated;
revoke all on public.streaks  from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, accent, playback_rate, interests, new_cards_per_day, correction_mode, reminder_time)
  on public.profiles to authenticated;
grant select on public.streaks to authenticated;

-- Internal trigger functions are not callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Guarded profile changes (docs/06 section 4.2): timezone and daily goal.
create or replace function public.change_timezone(p_timezone text)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  p public.profiles;
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'invalid_timezone' using errcode = '22023';
  end if;

  select * into p from public.profiles where id = v_uid for update;
  if p.timezone = p_timezone then
    return p;
  end if;
  if p.timezone_changed_at is not null and p.timezone_changed_at > now() - interval '7 days' then
    raise exception 'timezone_change_too_soon' using errcode = 'P0001';
  end if;

  update public.profiles
    set timezone = p_timezone, timezone_changed_at = now()
    where id = v_uid
    returning * into p;
  return p;
end $$;

create or replace function public.change_daily_goal(p_minutes smallint)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  p public.profiles;
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;
  if p_minutes not in (10, 15, 20, 30) then
    raise exception 'invalid_goal' using errcode = '22023';
  end if;

  -- Applies from the next day: stored as pending (the daily roll-over arrives with the streak functions).
  update public.profiles
    set pending_daily_goal = case when p_minutes = daily_goal_minutes then null else p_minutes end
    where id = v_uid
    returning * into p;
  return p;
end $$;

revoke execute on function public.change_timezone(text) from public, anon;
revoke execute on function public.change_daily_goal(smallint) from public, anon;
grant execute on function public.change_timezone(text) to authenticated;
grant execute on function public.change_daily_goal(smallint) to authenticated;
