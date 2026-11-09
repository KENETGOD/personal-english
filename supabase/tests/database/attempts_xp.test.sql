-- T-2.4: active minutes and XP (docs/03 sections 3 and 6, docs/10 TC-ATT-*) with a simulated clock.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

create function pg_temp.uid(n int) returns uuid language sql immutable as
  $$ select ('22222222-2222-2222-2222-' || lpad(n::text, 12, '0'))::uuid $$;
create function pg_temp.day(n int) returns timestamptz language sql immutable as
  $$ select timestamptz '2027-03-01 18:00:00+00' + n * interval '1 day' $$;

-- Opens an attempt p_minutes before p_at and completes it at p_at.
create function pg_temp.run(p_uid uuid, p_at timestamptz, p_minutes int, p_activity text, p_content uuid default null)
returns public.attempt_result language plpgsql as $$
declare
  v_session uuid;
  v_attempt uuid;
begin
  insert into public.practice_sessions (user_id, mode) values (p_uid, 'mixed') returning id into v_session;
  insert into public.exercise_attempts (user_id, session_id, content_id, activity_type, started_at)
  values (p_uid, v_session, p_content, p_activity, p_at - p_minutes * interval '1 minute') returning id into v_attempt;
  return public._complete_attempt(p_uid, v_attempt, p_at);
end $$;

insert into auth.users (id, instance_id, aud, role, email)
select pg_temp.uid(n), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'x' || n || '@test.local'
  from generate_series(1, 2) n;

insert into public.content_items (id, slug, type, level, est_minutes, payload) values
  ('33333333-3333-3333-3333-000000000001', 'test-writing-a', 'writing_prompt', 'B1', 15, '{}'),
  ('33333333-3333-3333-3333-000000000002', 'test-reading-a', 'reading', 'B1', 8, '{}'),
  ('33333333-3333-3333-3333-000000000003', 'test-shadowing-a', 'shadowing', 'B1', 3,
   '{"sentences": [{"id":"s1"}, {"id":"s2"}, {"id":"s3"}]}');

-- TC-ATT-02: an attempt left open for 3 hours is capped by its activity type.
select is((select valid_seconds || '/' || xp from pg_temp.run(pg_temp.uid(1), pg_temp.day(0), 180, 'writing', '33333333-3333-3333-3333-000000000001')),
  '1500/15', 'TC-ATT-02 writing open for 3 h: capped at 25 min, base XP 15');
select is((select valid_seconds || '/' || xp from pg_temp.run(pg_temp.uid(1), pg_temp.day(0), 180, 'review')),
  '90/1', 'review is capped at 90 s, XP 1');
select is((select valid_seconds || '/' || xp from pg_temp.run(pg_temp.uid(1), pg_temp.day(0), 180, 'reading', '33333333-3333-3333-3333-000000000002')),
  '960/10', 'reading is capped at 2x the estimated 8 minutes, XP 10');
select is((select valid_seconds || '/' || xp from pg_temp.run(pg_temp.uid(1), pg_temp.day(0), 180, 'shadowing', '33333333-3333-3333-3333-000000000003')),
  '180/6', 'shadowing: 60 s and 2 XP per sentence (3 sentences)');
select is((select valid_seconds || '/' || xp from pg_temp.run(pg_temp.uid(1), pg_temp.day(0), 180, 'minimal_pairs')),
  '300/5', 'minimal pairs: 5 min cap, XP 5');
select is((select valid_seconds || '/' || xp from pg_temp.run(pg_temp.uid(1), pg_temp.day(0), 3, 'new_word')),
  '120/2', 'new word: 2 min cap, XP 2');

-- A short attempt counts its real time.
select is((select valid_seconds from pg_temp.run(pg_temp.uid(1), pg_temp.day(0), 2, 'conversation')),
  120, 'an attempt shorter than the cap counts its real duration');

-- TC-ATT-05: the same content again on the same local day earns 50% XP; the next day is full again.
select is((select xp from pg_temp.run(pg_temp.uid(1), pg_temp.day(0), 5, 'writing', '33333333-3333-3333-3333-000000000001')),
  7, 'TC-ATT-05 repeating the same content the same day: half XP');
select is((select xp from pg_temp.run(pg_temp.uid(1), pg_temp.day(1), 5, 'writing', '33333333-3333-3333-3333-000000000001')),
  15, 'TC-ATT-05 the next day the content earns full XP again');
select is((select xp from pg_temp.run(pg_temp.uid(2), pg_temp.day(0), 5, 'writing', '33333333-3333-3333-3333-000000000001')),
  15, 'TC-ATT-05 repetition is per user');

-- Totals land in daily_activity.
select is((select active_seconds || '/' || xp from public.daily_activity where user_id = pg_temp.uid(1) and local_date = '2027-03-01'),
  '3570/61', 'daily_activity sums seconds and XP of the local day');

-- TC-ATT-04: an attempt cannot be completed twice.
select pg_temp.run(pg_temp.uid(2), pg_temp.day(2), 5, 'review');
select throws_ok(
  format($$select public._complete_attempt(%L, %L, now())$$, pg_temp.uid(2),
    (select id from public.exercise_attempts where user_id = pg_temp.uid(2) and activity_type = 'review')),
  'P0001', 'attempt_not_open', 'TC-ATT-04 completing the same attempt twice is rejected');

-- TC-ATT-03 (function level): an attempt of another user is not found.
select throws_ok(
  format($$select public._complete_attempt(%L, %L, now())$$, pg_temp.uid(1),
    (select id from public.exercise_attempts where user_id = pg_temp.uid(2) and activity_type = 'review')),
  'P0001', 'attempt_not_found', 'TC-ATT-03 another user''s attempt cannot be completed');

-- Completion records the attempt result.
select is((select status || '/' || valid_seconds || '/' || xp from public.exercise_attempts
           where user_id = pg_temp.uid(2) and activity_type = 'review'),
  'completed/90/1', 'a completed attempt stores status, valid seconds and XP');
select ok((select completed_at is not null from public.exercise_attempts
           where user_id = pg_temp.uid(2) and activity_type = 'review'), 'completed_at is set');

select * from finish();
rollback;
