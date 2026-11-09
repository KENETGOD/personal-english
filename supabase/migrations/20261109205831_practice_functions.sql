-- F2 / T-2.3: sessions, attempts, minutes/XP and streak functions (docs/03 sections 3-4, docs/06 sections 4.3-4.4).
-- Every function is security definer with an empty search_path; dates come from the server clock.
-- Internal functions take the user id and a clock (`p_now`) so tests can simulate time; they are never
-- granted to clients. The public wrappers pass auth.uid() and now().

-- Daily goal changes apply from the next local day: remember the first day they are effective.
alter table public.profiles add column pending_goal_from date;
update public.profiles
  set pending_goal_from = (now() at time zone timezone)::date + 1
  where pending_daily_goal is not null;
alter table public.profiles
  add constraint profiles_pending_goal_consistent
  check ((pending_daily_goal is null) = (pending_goal_from is null));

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

  -- Stored as pending; _roll_pending_goal applies it from the next local day.
  update public.profiles
    set pending_daily_goal = case when p_minutes = daily_goal_minutes then null else p_minutes end,
        pending_goal_from = case when p_minutes = daily_goal_minutes then null
                                 else (now() at time zone timezone)::date + 1 end
    where id = v_uid
    returning * into p;
  return p;
end $$;

create type public.attempt_result as (
  valid_seconds int,
  xp int,
  active_seconds int,        -- today's total after this attempt
  goal_minutes smallint,     -- the goal the day started with
  goal_met boolean,
  current_streak int,
  longest_streak int,
  freezes_available smallint
);

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable by clients)
-- ---------------------------------------------------------------------------

-- Applies a due pending goal and returns the goal in force for p_today.
create or replace function public._roll_pending_goal(p_uid uuid, p_today date)
returns smallint language plpgsql security definer set search_path = '' as $$
declare v_goal smallint;
begin
  update public.profiles
     set daily_goal_minutes = pending_daily_goal, pending_daily_goal = null, pending_goal_from = null
   where id = p_uid and pending_daily_goal is not null and pending_goal_from <= p_today
  returning daily_goal_minutes into v_goal;
  if not found then
    select daily_goal_minutes into v_goal from public.profiles where id = p_uid;
  end if;
  return v_goal;
end $$;

-- 4.1: counts the goal for p_today once; earns a freeze every 7 streak days (max 2).
-- `>=` (not `=`) also guards a timezone change that moves "today" behind last_goal_date.
create or replace function public._register_goal_met(p_uid uuid, p_today date)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.streaks;
begin
  select * into s from public.streaks where user_id = p_uid for update;
  if s.last_goal_date >= p_today then return; end if;

  update public.streaks
     set current_streak    = s.current_streak + 1,
         longest_streak    = greatest(s.longest_streak, s.current_streak + 1),
         total_days_met    = s.total_days_met + 1,
         last_goal_date    = p_today,
         freezes_available = case
           when (s.current_streak + 1) % 7 = 0 and s.freezes_available < 2
           then s.freezes_available + 1 else s.freezes_available end,
         updated_at = now()
   where user_id = p_uid;
end $$;

-- 4.2: lazy evaluation; also rolls the pending daily goal (docs/06 section 5).
create or replace function public._settle_streak(p_uid uuid, p_now timestamptz)
returns public.streaks language plpgsql security definer set search_path = '' as $$
declare
  v_tz text;
  v_today date;
  v_missed int;
  s public.streaks;
begin
  select timezone into v_tz from public.profiles where id = p_uid;
  if not found then raise exception 'profile_not_found'; end if;
  v_today := (p_now at time zone v_tz)::date;
  perform public._roll_pending_goal(p_uid, v_today);

  select * into s from public.streaks where user_id = p_uid for update;
  if s.last_goal_date is null or s.current_streak = 0 then return s; end if;

  v_missed := (v_today - s.last_goal_date) - 1;  -- today is not over yet
  if v_missed <= 0 then return s; end if;

  if v_missed <= s.freezes_available then
    insert into public.daily_activity (user_id, local_date, goal_minutes, status)
    select p_uid, s.last_goal_date + g, p.daily_goal_minutes, 'frozen'
      from generate_series(1, v_missed) g, public.profiles p
     where p.id = p_uid
    on conflict (user_id, local_date) do update set status = 'frozen';

    update public.streaks
       set freezes_available = s.freezes_available - v_missed,
           last_goal_date    = v_today - 1,
           updated_at        = now()
     where user_id = p_uid
    returning * into s;
  else
    -- Broken: remaining freezes are kept. Streak 0 makes this idempotent.
    update public.streaks set current_streak = 0, updated_at = now()
     where user_id = p_uid
    returning * into s;
  end if;

  return s;
end $$;

-- Minimum-effort hook (docs/03 section 3). The evidence tables (writing_submissions, conversation_turns,
-- pronunciation_results, ...) arrive in F3-F6, which redefine this function per activity type.
-- Until then every attempt is accepted as having met the minimum effort.
create or replace function public._attempt_effort_met(p_attempt public.exercise_attempts)
returns boolean language sql stable set search_path = '' as $$
  select true
$$;

create or replace function public._complete_attempt(p_uid uuid, p_attempt_id uuid, p_now timestamptz)
returns public.attempt_result language plpgsql security definer set search_path = '' as $$
declare
  a public.exercise_attempts;
  c public.content_items;
  d public.daily_activity;
  s public.streaks;
  v_tz text;
  v_today date;
  v_goal smallint;
  v_sentences int;
  v_cap int;
  v_base int;
  v_valid int;
  v_xp int;
  v_repeat boolean;
begin
  select * into a from public.exercise_attempts where id = p_attempt_id and user_id = p_uid for update;
  if not found then raise exception 'attempt_not_found'; end if;
  if a.status <> 'started' then raise exception 'attempt_not_open'; end if;

  select timezone into v_tz from public.profiles where id = p_uid;
  v_today := (p_now at time zone v_tz)::date;
  -- Settle first: a stale streak must be frozen/broken before today's goal can extend it.
  perform public._settle_streak(p_uid, p_now);
  select daily_goal_minutes into v_goal from public.profiles where id = p_uid;

  select * into c from public.content_items where id = a.content_id;
  v_sentences := case when jsonb_typeof(c.payload -> 'sentences') = 'array'
                      then greatest(jsonb_array_length(c.payload -> 'sentences'), 1) else 1 end;

  -- Duration cap and base XP per activity type (docs/03 sections 3 and 6).
  -- Assumptions: shadowing = one set (cap and XP per sentence); reading without content: 10 min;
  -- grammar: 5 min cap, no XP (not listed in the docs).
  v_cap := case a.activity_type
    when 'review' then 90
    when 'new_word' then 120
    when 'reading' then coalesce(ceil(c.est_minutes * 120)::int, 600)
    when 'writing' then 1500
    when 'conversation' then 1200
    when 'shadowing' then 60 * v_sentences
    when 'minimal_pairs' then 300
    when 'free_talk' then 360
    when 'grammar' then 300
  end;
  v_base := case a.activity_type
    when 'review' then 1
    when 'new_word' then 2
    when 'reading' then 10
    when 'writing' then 15
    when 'conversation' then 15
    when 'shadowing' then 2 * v_sentences
    when 'minimal_pairs' then 5
    when 'free_talk' then 15
    when 'grammar' then 0
  end;

  if public._attempt_effort_met(a) then
    v_valid := least(greatest(extract(epoch from p_now - a.started_at), 0)::int, v_cap);
    -- Same content again on the same local day earns 50% XP (docs/03 section 6).
    select exists (
      select 1 from public.exercise_attempts x
       where x.user_id = p_uid and x.content_id = a.content_id and x.id <> a.id
         and x.status in ('completed', 'completed_partial') and (x.valid_seconds > 0 or x.xp > 0)
         and (x.completed_at at time zone v_tz)::date = v_today
    ) into v_repeat;
    v_xp := case when v_repeat then v_base / 2 else v_base end;
  else
    v_valid := 0;
    v_xp := 0;
  end if;

  update public.exercise_attempts
     set status = 'completed', completed_at = p_now, valid_seconds = v_valid, xp = v_xp
   where id = a.id;

  -- The row keeps the goal the day started with (a pending goal only applies from the next day).
  insert into public.daily_activity as da (user_id, local_date, active_seconds, xp, goal_minutes)
  values (p_uid, v_today, v_valid, v_xp, v_goal)
  on conflict (user_id, local_date) do update
    set active_seconds = da.active_seconds + excluded.active_seconds, xp = da.xp + excluded.xp
  returning * into d;

  if d.status <> 'met' and d.active_seconds >= d.goal_minutes * 60 then
    update public.daily_activity set status = 'met'
     where user_id = p_uid and local_date = v_today
    returning * into d;
    perform public._register_goal_met(p_uid, v_today);

    insert into public.achievements (user_id, code, unlocked_at)
    select p_uid, m.code, p_now
      from (values ('streak_7', 7), ('streak_30', 30), ('streak_100', 100)) as m(code, n)
     where m.n <= (select current_streak from public.streaks where user_id = p_uid)
    on conflict (user_id, code) do nothing;
  end if;

  select * into s from public.streaks where user_id = p_uid;
  return row(v_valid, v_xp, d.active_seconds, d.goal_minutes, d.status = 'met',
             s.current_streak, s.longest_streak, s.freezes_available)::public.attempt_result;
end $$;

-- ---------------------------------------------------------------------------
-- Public API (security definer, authenticated only)
-- ---------------------------------------------------------------------------

create or replace function public.start_session(p_mode text, p_plan jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if p_mode is null or p_mode not in ('reading', 'writing', 'speaking', 'vocabulary', 'mixed') then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;
  insert into public.practice_sessions (user_id, mode, plan)
  values (v_uid, p_mode, coalesce(p_plan, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.end_session(p_session_id uuid)
returns public.practice_sessions language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  ps public.practice_sessions;
begin
  if v_uid is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  update public.practice_sessions set status = 'completed', ended_at = now()
   where id = p_session_id and user_id = v_uid and status = 'active'
  returning * into ps;
  if not found then raise exception 'invalid_session'; end if;
  update public.exercise_attempts set status = 'abandoned'
   where session_id = p_session_id and status = 'started';
  return ps;
end $$;

create or replace function public.start_attempt(p_session_id uuid, p_content_id uuid, p_activity text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if p_activity is null or p_activity not in (
    'review', 'new_word', 'reading', 'writing', 'conversation', 'shadowing', 'minimal_pairs', 'free_talk', 'grammar') then
    raise exception 'invalid_activity' using errcode = '22023';
  end if;
  perform 1 from public.practice_sessions
   where id = p_session_id and user_id = v_uid and status = 'active';
  if not found then raise exception 'invalid_session'; end if;
  if p_content_id is not null
     and not exists (select 1 from public.content_items where id = p_content_id and is_active) then
    raise exception 'invalid_content';
  end if;

  insert into public.exercise_attempts (user_id, session_id, content_id, activity_type, status, started_at)
  values (v_uid, p_session_id, p_content_id, p_activity, 'started', now())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.skip_attempt(p_attempt_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  update public.exercise_attempts set status = 'skipped', completed_at = now(), valid_seconds = 0, xp = 0
   where id = p_attempt_id and user_id = v_uid and status = 'started';
  if not found then raise exception 'attempt_not_found'; end if;
end $$;

create or replace function public.complete_attempt(p_attempt_id uuid)
returns public.attempt_result language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  return public._complete_attempt(v_uid, p_attempt_id, now());
end $$;

create or replace function public.settle_streak()
returns public.streaks language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  return public._settle_streak(v_uid, now());
end $$;

-- Today's progress for the home screen. Security invoker: RLS limits it to the caller's own rows.
create or replace function public.today_progress()
returns table (local_date date, active_seconds int, goal_minutes smallint, xp int, status text)
language sql stable security invoker set search_path = '' as $$
  with p as (
    select (now() at time zone timezone)::date as today,
           case when pending_daily_goal is not null and pending_goal_from <= (now() at time zone timezone)::date
                then pending_daily_goal else daily_goal_minutes end as goal
      from public.profiles
  )
  select p.today, coalesce(d.active_seconds, 0), coalesce(d.goal_minutes, p.goal), coalesce(d.xp, 0),
         coalesce(d.status, 'none')
    from p left join public.daily_activity d on d.local_date = p.today
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke execute on function public._roll_pending_goal(uuid, date) from public, anon, authenticated;
revoke execute on function public._register_goal_met(uuid, date) from public, anon, authenticated;
revoke execute on function public._settle_streak(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public._attempt_effort_met(public.exercise_attempts) from public, anon, authenticated;
revoke execute on function public._complete_attempt(uuid, uuid, timestamptz) from public, anon, authenticated;

revoke execute on function public.start_session(text, jsonb) from public, anon;
revoke execute on function public.end_session(uuid) from public, anon;
revoke execute on function public.start_attempt(uuid, uuid, text) from public, anon;
revoke execute on function public.skip_attempt(uuid) from public, anon;
revoke execute on function public.complete_attempt(uuid) from public, anon;
revoke execute on function public.settle_streak() from public, anon;
revoke execute on function public.today_progress() from public, anon;
grant execute on function public.start_session(text, jsonb) to authenticated;
grant execute on function public.end_session(uuid) to authenticated;
grant execute on function public.start_attempt(uuid, uuid, text) to authenticated;
grant execute on function public.skip_attempt(uuid) to authenticated;
grant execute on function public.complete_attempt(uuid) to authenticated;
grant execute on function public.settle_streak() to authenticated;
grant execute on function public.today_progress() to authenticated;
