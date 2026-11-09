-- T-2.4: streak rules (docs/03 sections 4.1-4.3, docs/10 TC-STK-*) with a simulated clock.
-- Runs as the table owner against the internal functions, which take the clock as a parameter.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

create function pg_temp.uid(n int) returns uuid language sql immutable as
  $$ select ('11111111-1111-1111-1111-' || lpad(n::text, 12, '0'))::uuid $$;

-- Day n at 12:00 in America/Mexico_City (UTC-6, no DST): 2027-03-01 + n.
create function pg_temp.day(n int) returns timestamptz language sql immutable as
  $$ select timestamptz '2027-03-01 18:00:00+00' + n * interval '1 day' $$;

-- Starts an attempt p_minutes before p_at and completes it at p_at.
create function pg_temp.meet(p_uid uuid, p_at timestamptz, p_minutes int default 20)
returns public.attempt_result language plpgsql as $$
declare
  v_session uuid;
  v_attempt uuid;
begin
  insert into public.practice_sessions (user_id, mode) values (p_uid, 'writing') returning id into v_session;
  insert into public.exercise_attempts (user_id, session_id, activity_type, started_at)
  values (p_uid, v_session, 'writing', p_at - p_minutes * interval '1 minute') returning id into v_attempt;
  return public._complete_attempt(p_uid, v_attempt, p_at);
end $$;

create function pg_temp.snap(n int) returns text language sql as $$
  select current_streak || '/' || longest_streak || '/' || freezes_available || '/' || total_days_met
         || '/' || coalesce(last_goal_date::text, '-')
    from public.streaks where user_id = pg_temp.uid(n) $$;

insert into auth.users (id, instance_id, aud, role, email)
select pg_temp.uid(n), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'u' || n || '@test.local'
  from generate_series(1, 11) n;

update public.profiles set daily_goal_minutes = 10 where id = pg_temp.uid(7);
update public.profiles set timezone = 'Pacific/Auckland' where id = pg_temp.uid(8);
update public.profiles set timezone = 'America/New_York' where id in (pg_temp.uid(10), pg_temp.uid(11));

-- TC-STK-01: first day met.
select pg_temp.meet(pg_temp.uid(1), pg_temp.day(0));
select is(pg_temp.snap(1), '1/1/0/1/2027-03-01', 'TC-STK-01 first day met: current 1, longest 1');
select is((select status || '/' || active_seconds from public.daily_activity where user_id = pg_temp.uid(1)),
  'met/1200', 'TC-STK-01 daily_activity records the met day');

-- TC-STK-02: meeting the goal twice on the same day counts once.
select pg_temp.meet(pg_temp.uid(1), pg_temp.day(0) + interval '1 hour');
select is(pg_temp.snap(1), '1/1/0/1/2027-03-01', 'TC-STK-02 second completion the same day changes nothing');
select is((select active_seconds from public.daily_activity where user_id = pg_temp.uid(1)),
  2400, 'TC-STK-02 minutes still accumulate');

-- TC-STK-03: 7 consecutive days earn a freeze and the first achievement.
do $$ begin
  for n in 0..6 loop perform pg_temp.meet(pg_temp.uid(2), pg_temp.day(n)); end loop;
end $$;
select is(pg_temp.snap(2), '7/7/1/7/2027-03-07', 'TC-STK-03 7 days: streak 7, 1 freeze');
select is((select count(*)::int from public.achievements where user_id = pg_temp.uid(2) and code = 'streak_7'),
  1, 'TC-STK-03 streak_7 achievement unlocked');

-- TC-STK-04: freezes cap at 2 (21 days with none used).
do $$ begin
  for n in 0..13 loop perform pg_temp.meet(pg_temp.uid(3), pg_temp.day(n)); end loop;
end $$;
select is(pg_temp.snap(3), '14/14/2/14/2027-03-14', 'TC-STK-04 14 days: 2 freezes');
do $$ begin
  for n in 14..20 loop perform pg_temp.meet(pg_temp.uid(3), pg_temp.day(n)); end loop;
end $$;
select is(pg_temp.snap(3), '21/21/2/21/2027-03-21', 'TC-STK-04 21 days: freezes stay capped at 2');

-- TC-STK-05: one missed day is covered by a freeze.
do $$ begin
  for n in 0..6 loop perform pg_temp.meet(pg_temp.uid(4), pg_temp.day(n)); end loop;
end $$;
select is((select current_streak || '/' || freezes_available from public._settle_streak(pg_temp.uid(4), pg_temp.day(7))),
  '7/1', 'TC-STK-05 settling on the day after the last goal changes nothing (today is not lost yet)');
select is((select current_streak || '/' || freezes_available || '/' || last_goal_date from public._settle_streak(pg_temp.uid(4), pg_temp.day(8))),
  '7/0/2027-03-08', 'TC-STK-05 one missed day with one freeze: streak intact, freeze spent');
select is((select status from public.daily_activity where user_id = pg_temp.uid(4) and local_date = '2027-03-08'),
  'frozen', 'TC-STK-05 the covered day is marked frozen');
select is((select longest_streak || '/' || total_days_met from public.streaks where user_id = pg_temp.uid(4)),
  '7/7', 'TC-STK-05 frozen days do not add to the streak or the total');

-- TC-STK-10: settle is idempotent, including later the same day.
select public._settle_streak(pg_temp.uid(4), pg_temp.day(8));
select public._settle_streak(pg_temp.uid(4), pg_temp.day(8) + interval '5 hours');
select is(pg_temp.snap(4), '7/7/0/7/2027-03-08', 'TC-STK-10 settle is idempotent after a freeze');

-- TC-STK-06 / docs/03 4.3: three missed days with 2 freezes, evaluated once.
do $$ begin
  for n in 0..13 loop perform pg_temp.meet(pg_temp.uid(5), pg_temp.day(n)); end loop;
end $$;
select public._settle_streak(pg_temp.uid(5), pg_temp.day(17));
select is(pg_temp.snap(5), '0/14/2/14/2027-03-14', 'TC-STK-06 three missed days: streak 0, freezes kept, longest kept');
select public._settle_streak(pg_temp.uid(5), pg_temp.day(17));
select public._settle_streak(pg_temp.uid(5), pg_temp.day(30));
select is(pg_temp.snap(5), '0/14/2/14/2027-03-14', 'TC-STK-10 settle is idempotent after a break');
select pg_temp.meet(pg_temp.uid(5), pg_temp.day(30));
select is(pg_temp.snap(5), '1/14/2/15/2027-03-31', 'a new streak starts at 1 after a break; longest and total are kept');

-- docs/03 4.3 "three days without practice with 2 freezes": both are used, broken on the third day (app opened daily).
do $$ begin
  for n in 0..13 loop perform pg_temp.meet(pg_temp.uid(6), pg_temp.day(n)); end loop;
end $$;
select public._settle_streak(pg_temp.uid(6), pg_temp.day(15));
select is(pg_temp.snap(6), '14/14/1/14/2027-03-15', 'day 1 missed: first freeze used');
select public._settle_streak(pg_temp.uid(6), pg_temp.day(16));
select is(pg_temp.snap(6), '14/14/0/14/2027-03-16', 'day 2 missed: second freeze used');
select public._settle_streak(pg_temp.uid(6), pg_temp.day(17));
select is(pg_temp.snap(6), '0/14/0/14/2027-03-16', 'day 3 missed: streak breaks');

-- TC-STK-07: activity from 23:55 to 00:07 counts for the day it completed.
select pg_temp.meet(pg_temp.uid(7), timestamptz '2027-03-10 06:07:00+00', 12);
select is((select local_date || '/' || active_seconds || '/' || status from public.daily_activity where user_id = pg_temp.uid(7)),
  '2027-03-10/720/met', 'TC-STK-07 counts for the new local day, with the real elapsed time');
select is((select count(*)::int from public.daily_activity where user_id = pg_temp.uid(7)),
  1, 'TC-STK-07 nothing is recorded for the previous day');
select is(pg_temp.snap(7), '1/1/0/1/2027-03-10', 'TC-STK-07 streak counts the new day');

-- TC-STK-08: moving the clock behind the last counted day (timezone change) never earns a second day.
select pg_temp.meet(pg_temp.uid(8), timestamptz '2027-03-01 20:00:00+00');
select is(pg_temp.snap(8), '1/1/0/1/2027-03-02', 'Auckland: 2027-03-01 20:00Z is local March 2');
update public.profiles set timezone = 'America/Mexico_City' where id = pg_temp.uid(8);
select pg_temp.meet(pg_temp.uid(8), timestamptz '2027-03-01 22:00:00+00');
select is(pg_temp.snap(8), '1/1/0/1/2027-03-02', 'TC-STK-08 after moving west, the earlier local date does not add a day');

-- TC-STK-09: a goal change applies from the next local day; the current day keeps its goal.
update public.profiles set pending_daily_goal = 10, pending_goal_from = '2027-03-02' where id = pg_temp.uid(9);
select is((select goal_met::text || '/' || goal_minutes from pg_temp.meet(pg_temp.uid(9), pg_temp.day(0), 10)),
  'false/15', 'TC-STK-09 10 minutes does not meet the day that started with a 15-minute goal');
select is((select daily_goal_minutes || '/' || pending_daily_goal from public.profiles where id = pg_temp.uid(9)),
  '15/10', 'TC-STK-09 goal stays 15 with 10 pending during the same day');
select is((select goal_met::text || '/' || goal_minutes from pg_temp.meet(pg_temp.uid(9), pg_temp.day(1), 10)),
  'true/10', 'TC-STK-09 next day the new goal applies');
select is((select daily_goal_minutes || '/' || coalesce(pending_daily_goal::text, 'null') from public.profiles where id = pg_temp.uid(9)),
  '10/null', 'TC-STK-09 the pending goal was rolled into the profile');

-- Daylight saving: dates come from the IANA zone, not from a fixed offset (US DST starts 2027-03-14).
select pg_temp.meet(pg_temp.uid(10), timestamptz '2027-03-13 12:00:00+00');
select pg_temp.meet(pg_temp.uid(10), timestamptz '2027-03-14 11:30:00+00');
select pg_temp.meet(pg_temp.uid(10), timestamptz '2027-03-15 11:30:00+00');
select is(pg_temp.snap(10), '3/3/0/3/2027-03-15', 'DST: three calendar days across a 23-hour day make a 3-day streak');
select pg_temp.meet(pg_temp.uid(11), timestamptz '2027-03-15 04:30:00+00');
select is((select min(local_date)::text from public.daily_activity where user_id = pg_temp.uid(11)),
  '2027-03-15', 'DST: 04:30Z after the change is 00:30 EDT of March 15 (a fixed -5 offset would say March 14)');

-- Registro retroactivo / device clock: no function accepts a date or a duration from the caller.
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('start_attempt', 'complete_attempt', 'settle_streak')
             and (pg_get_function_arguments(p.oid) ~* '(date|time|second|minute)')),
  0, 'public streak/attempt functions take no date, time or duration from the client');

select * from finish();
rollback;
