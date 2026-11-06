begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- Two users; the handle_new_user trigger creates their profile and streak.
insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.local');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass)
  and (select relrowsecurity from pg_class where oid = 'public.streaks'::regclass),
  'RLS is enabled on profiles and streaks');
-- Scope to the test users: other suites (E2E) may leave rows in the local DB.
select is((select count(*)::int from public.profiles where id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')), 2, 'trigger created both profiles');
select is((select count(*)::int from public.streaks where user_id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')), 2, 'trigger created both streaks');

-- Anonymous role sees nothing and cannot write.
set local role anon;
select throws_ok('select * from public.profiles', '42501', null, 'anon cannot read profiles');
select throws_ok('select * from public.streaks', '42501', null, 'anon cannot read streaks');

-- User A.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is((select count(*)::int from public.profiles), 1, 'A sees only one profile');
select is((select id from public.profiles), '00000000-0000-0000-0000-00000000000a'::uuid, 'A sees its own profile');
select is((select count(*)::int from public.streaks), 1, 'A sees only one streak');

update public.profiles set display_name = 'Alice' where id = '00000000-0000-0000-0000-00000000000a';
select is((select display_name from public.profiles), 'Alice', 'A can update its own safe columns');

-- A cannot touch B's profile: the row is invisible, so zero rows are affected.
with u as (
  update public.profiles set display_name = 'Hacked' where id = '00000000-0000-0000-0000-00000000000b' returning 1
) select is((select count(*)::int from u), 0, 'A cannot update the profile of B');

select throws_ok(
  $$update public.profiles set id = '00000000-0000-0000-0000-00000000000b' where id = '00000000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'A cannot change profile ownership');
select throws_ok(
  $$update public.profiles set daily_goal_minutes = 30$$,
  '42501', null, 'A cannot write daily_goal_minutes directly');
select throws_ok(
  $$update public.profiles set timezone = 'UTC'$$,
  '42501', null, 'A cannot write timezone directly');
select throws_ok(
  $$insert into public.profiles (id) values (gen_random_uuid())$$,
  '42501', null, 'A cannot insert profiles');
select throws_ok(
  $$delete from public.profiles$$,
  '42501', null, 'A cannot delete profiles');

-- Streak values are not client-writable (RNF-SEC-12).
select throws_ok(
  $$update public.streaks set current_streak = 999$$,
  '42501', null, 'A cannot write streak values');
select throws_ok(
  $$insert into public.streaks (user_id) values (gen_random_uuid())$$,
  '42501', null, 'A cannot insert streaks');
select throws_ok(
  $$delete from public.streaks$$,
  '42501', null, 'A cannot delete streaks');

-- Guarded functions.
select is((select daily_goal_minutes from public.change_daily_goal(30::smallint)), 15::smallint, 'daily goal change keeps the active goal');
select is((select pending_daily_goal from public.profiles), 30::smallint, 'daily goal change is stored as pending');
select lives_ok($$select public.change_timezone('America/Bogota')$$, 'first timezone change is allowed');
select throws_ok($$select public.change_timezone('Europe/Madrid')$$, 'P0001', 'timezone_change_too_soon', 'second timezone change within 7 days is rejected');

select * from finish();
rollback;
