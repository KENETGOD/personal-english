-- T-2.2 / T-2.3 / T-2.4: RLS, function privileges and tampering for content, sessions, attempts,
-- daily_activity, achievements (RNF-SEC-12, docs/10 TC-STK-11/12, TC-ATT-03/04/06).
begin;
create extension if not exists pgtap with schema extensions;
select plan(57);

-- Two users, one active and one inactive content item, and a session + attempt that belong to B.
insert into auth.users (id, instance_id, aud, role, email) values
  ('44444444-4444-4444-4444-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa@test.local'),
  ('44444444-4444-4444-4444-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sb@test.local');
insert into public.content_items (id, slug, type, level, est_minutes, is_active, payload) values
  ('55555555-5555-5555-5555-000000000001', 'test-sec-active', 'vocab', 'B1', 1, true, '{}'),
  ('55555555-5555-5555-5555-000000000002', 'test-sec-inactive', 'vocab', 'B1', 1, false, '{}');
insert into public.practice_sessions (id, user_id, mode) values
  ('66666666-6666-6666-6666-00000000000b', '44444444-4444-4444-4444-00000000000b', 'vocabulary');
insert into public.exercise_attempts (id, user_id, session_id, activity_type) values
  ('77777777-7777-7777-7777-00000000000b', '44444444-4444-4444-4444-00000000000b',
   '66666666-6666-6666-6666-00000000000b', 'review');
insert into public.daily_activity (user_id, local_date, active_seconds, goal_minutes) values
  ('44444444-4444-4444-4444-00000000000b', '2027-03-01', 900, 15);
insert into public.achievements (user_id, code) values ('44444444-4444-4444-4444-00000000000b', 'streak_7');

select ok((select bool_and(relrowsecurity) from pg_class where oid in (
  'public.content_items'::regclass, 'public.practice_sessions'::regclass, 'public.exercise_attempts'::regclass,
  'public.daily_activity'::regclass, 'public.achievements'::regclass)), 'RLS is enabled on all F2 tables');

-- Function privileges (checked as owner; PUBLIC grants count for anon/authenticated).
select is((select count(*)::int from pg_proc p
            where p.pronamespace = 'public'::regnamespace
              and p.proname in ('_register_goal_met', '_settle_streak', '_complete_attempt', '_roll_pending_goal', '_attempt_effort_met')
              and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))),
  0, 'internal functions are not executable by anon or authenticated');
select is((select count(*)::int from pg_proc p
            where p.pronamespace = 'public'::regnamespace
              and p.proname in ('start_session', 'end_session', 'start_attempt', 'skip_attempt', 'complete_attempt', 'settle_streak', 'today_progress')
              and has_function_privilege('anon', p.oid, 'execute')),
  0, 'public API functions are not executable by anon');
select is((select count(*)::int from pg_proc p
            where p.pronamespace = 'public'::regnamespace
              and p.proname in ('start_session', 'end_session', 'start_attempt', 'skip_attempt', 'complete_attempt', 'settle_streak', 'today_progress')
              and has_function_privilege('authenticated', p.oid, 'execute')),
  7, 'public API functions are executable by authenticated');

-- Anonymous.
set local role anon;
select throws_ok('select * from public.content_items', '42501', null, 'anon cannot read content_items');
select throws_ok('select * from public.practice_sessions', '42501', null, 'anon cannot read practice_sessions');
select throws_ok('select * from public.exercise_attempts', '42501', null, 'anon cannot read exercise_attempts');
select throws_ok('select * from public.daily_activity', '42501', null, 'anon cannot read daily_activity');
select throws_ok('select * from public.achievements', '42501', null, 'anon cannot read achievements');
select throws_ok('select public.settle_streak()', '42501', null, 'anon cannot call settle_streak');

-- Authenticated without a user id.
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated"}';
select throws_ok($$select public.start_session('vocabulary')$$, '28000', 'unauthenticated', 'start_session needs a user');
select throws_ok($$select public.complete_attempt('77777777-7777-7777-7777-00000000000b')$$, '28000', 'unauthenticated', 'complete_attempt needs a user');

-- User A.
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-00000000000a","role":"authenticated"}';

-- Content: read-only, active items only.
select is((select count(*)::int from public.content_items where slug like 'test-sec-%'), 1, 'A reads only active content');
select throws_ok($$insert into public.content_items (slug, type, level, est_minutes, payload) values ('hack', 'vocab', 'B1', 1, '{}')$$,
  '42501', null, 'A cannot insert content');
select throws_ok($$update public.content_items set is_active = false$$, '42501', null, 'A cannot update content');
select throws_ok($$delete from public.content_items$$, '42501', null, 'A cannot delete content');

-- A sees nothing of B.
select is((select count(*)::int from public.practice_sessions), 0, 'A sees no sessions of B');
select is((select count(*)::int from public.exercise_attempts), 0, 'A sees no attempts of B');
select is((select count(*)::int from public.daily_activity), 0, 'A sees no daily_activity of B');
select is((select count(*)::int from public.achievements), 0, 'A sees no achievements of B');

-- Cross-user access through the API.
select throws_ok($$select public.start_attempt('66666666-6666-6666-6666-00000000000b', null, 'review')$$,
  'P0001', 'invalid_session', 'TC-ATT-03 A cannot start an attempt in the session of B');
select throws_ok($$select public.complete_attempt('77777777-7777-7777-7777-00000000000b')$$,
  'P0001', 'attempt_not_found', 'TC-ATT-03 A cannot complete the attempt of B');
select throws_ok($$select public.skip_attempt('77777777-7777-7777-7777-00000000000b')$$,
  'P0001', 'attempt_not_found', 'A cannot skip the attempt of B');
select throws_ok($$select public.end_session('66666666-6666-6666-6666-00000000000b')$$,
  'P0001', 'invalid_session', 'A cannot end the session of B');

-- Input validation.
select throws_ok($$select public.start_session('cheating')$$, '22023', 'invalid_mode', 'start_session rejects unknown modes');
select set_config('test.session', public.start_session('vocabulary')::text, true);
select is((select count(*)::int from public.practice_sessions), 1, 'A sees its new session');
select throws_ok(format($$select public.start_attempt(%L, null, 'hacking')$$, current_setting('test.session')),
  '22023', 'invalid_activity', 'start_attempt rejects unknown activity types');
select throws_ok(format($$select public.start_attempt(%L, '55555555-5555-5555-5555-000000000002', 'review')$$, current_setting('test.session')),
  'P0001', 'invalid_content', 'start_attempt rejects inactive content');
select throws_ok(format($$select public.start_attempt(%L, gen_random_uuid(), 'review')$$, current_setting('test.session')),
  'P0001', 'invalid_content', 'start_attempt rejects unknown content');

-- Attempt lifecycle. The client sends no times: started_at is the server clock.
select set_config('test.attempt1', public.start_attempt(current_setting('test.session')::uuid, '55555555-5555-5555-5555-000000000001', 'review')::text, true);
select is((select started_at from public.exercise_attempts where id = current_setting('test.attempt1')::uuid),
  now(), 'started_at comes from the server clock');
select is((select status from public.exercise_attempts where id = current_setting('test.attempt1')::uuid),
  'started', 'a new attempt is started');
select is((select valid_seconds || '/' || goal_met::text from public.complete_attempt(current_setting('test.attempt1')::uuid)),
  '0/false', 'an attempt completed immediately counts no time and meets no goal');
select throws_ok(format($$select public.complete_attempt(%L)$$, current_setting('test.attempt1')),
  'P0001', 'attempt_not_open', 'TC-ATT-04 completing twice is rejected');

-- TC-ATT-06: a skipped attempt earns nothing.
select set_config('test.attempt2', public.start_attempt(current_setting('test.session')::uuid, null, 'writing')::text, true);
select lives_ok(format($$select public.skip_attempt(%L)$$, current_setting('test.attempt2')), 'A can skip its attempt');
select is((select status || '/' || valid_seconds || '/' || xp from public.exercise_attempts where id = current_setting('test.attempt2')::uuid),
  'skipped/0/0', 'TC-ATT-06 a skipped attempt has 0 seconds and 0 XP');
select throws_ok(format($$select public.complete_attempt(%L)$$, current_setting('test.attempt2')),
  'P0001', 'attempt_not_open', 'a skipped attempt cannot be completed afterwards');

-- Tampering: no direct writes to derived tables (RNF-SEC-12, TC-STK-11).
select throws_ok($$update public.streaks set current_streak = 999$$, '42501', null, 'TC-STK-11 A cannot write current_streak');
select throws_ok($$update public.exercise_attempts set xp = 999$$, '42501', null, 'A cannot inflate attempt XP');
select throws_ok($$update public.exercise_attempts set score = 100$$, '42501', null, 'A cannot inflate attempt scores');
select throws_ok($$update public.exercise_attempts set valid_seconds = 99999$$, '42501', null, 'A cannot inflate valid_seconds');
select throws_ok($$insert into public.exercise_attempts (user_id, session_id, activity_type, status, xp)
  values ('44444444-4444-4444-4444-00000000000a', current_setting('test.session')::uuid, 'writing', 'completed', 999)$$,
  '42501', null, 'A cannot insert attempts directly');
select throws_ok($$delete from public.exercise_attempts$$, '42501', null, 'A cannot delete attempts');
select throws_ok($$insert into public.practice_sessions (user_id, mode) values ('44444444-4444-4444-4444-00000000000a', 'mixed')$$,
  '42501', null, 'A cannot insert sessions directly');
select throws_ok($$update public.practice_sessions set status = 'completed'$$, '42501', null, 'A cannot update sessions directly');
select throws_ok($$insert into public.daily_activity (user_id, local_date, active_seconds, goal_minutes, status)
  values ('44444444-4444-4444-4444-00000000000a', '2027-02-20', 99999, 15, 'met')$$,
  '42501', null, 'A cannot back-fill days (no retroactive records)');
select throws_ok($$update public.daily_activity set active_seconds = 99999$$, '42501', null, 'A cannot write daily_activity');
select throws_ok($$insert into public.achievements (user_id, code) values ('44444444-4444-4444-4444-00000000000a', 'streak_100')$$,
  '42501', null, 'A cannot grant itself achievements');
select throws_ok($$select public._register_goal_met('44444444-4444-4444-4444-00000000000a', current_date)$$,
  '42501', null, 'TC-STK-12 _register_goal_met is not callable by clients');
select throws_ok($$select public._complete_attempt('44444444-4444-4444-4444-00000000000a', gen_random_uuid(), now() + interval '30 days')$$,
  '42501', null, '_complete_attempt (with its clock parameter) is not callable by clients');

-- Goal reached through the public API: needs real elapsed time, so the owner back-dates the start.
select set_config('test.attempt3', public.start_attempt(current_setting('test.session')::uuid, null, 'writing')::text, true);
reset role;
update public.exercise_attempts set started_at = now() - interval '20 minutes' where id = current_setting('test.attempt3')::uuid;
set local role authenticated;
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-00000000000a","role":"authenticated"}';
select is((select valid_seconds || '/' || xp || '/' || goal_met::text || '/' || current_streak from public.complete_attempt(current_setting('test.attempt3')::uuid)),
  '1200/15/true/1', 'complete_attempt reaches the goal: 20 min, 15 XP, streak 1');
select is((select active_seconds || '/' || goal_minutes || '/' || status from public.today_progress()),
  '1200/15/met', 'today_progress reports the day');
select is((select current_streak || '/' || freezes_available from public.settle_streak()), '1/0', 'settle_streak returns the streak');

-- Goal changes apply from the next local day.
select is((select pending_goal_from from public.change_daily_goal(30::smallint)),
  (select (now() at time zone timezone)::date + 1 from public.profiles), 'a goal change is pending from tomorrow');
select is((select pending_daily_goal from public.change_daily_goal(15::smallint)), null::smallint, 'choosing the current goal clears the pending change');

-- Ending a session abandons open attempts and closes it.
select set_config('test.attempt4', public.start_attempt(current_setting('test.session')::uuid, null, 'review')::text, true);
select is((select status from public.end_session(current_setting('test.session')::uuid)), 'completed', 'A can end its session');
select is((select status from public.exercise_attempts where id = current_setting('test.attempt4')::uuid), 'abandoned', 'ending a session abandons open attempts');
select throws_ok(format($$select public.start_attempt(%L, null, 'review')$$, current_setting('test.session')),
  'P0001', 'invalid_session', 'no attempts can start in an ended session');

select * from finish();
rollback;
