-- T-3.2: new_words_today counts the caller's new words completed on their local day (RF-VOC-04).
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, instance_id, aud, role, email) values
  ('55555555-5555-5555-5555-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'na@test.local'),
  ('55555555-5555-5555-5555-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nb@test.local');
insert into public.practice_sessions (id, user_id, mode) values
  ('66666666-6666-6666-6666-00000000000a', '55555555-5555-5555-5555-00000000000a', 'vocabulary'),
  ('66666666-6666-6666-6666-00000000000b', '55555555-5555-5555-5555-00000000000b', 'vocabulary');

-- User A: two new words done today, one skipped, one review, one new word two days ago. User B: one today.
insert into public.exercise_attempts (user_id, session_id, activity_type, status, completed_at) values
  ('55555555-5555-5555-5555-00000000000a', '66666666-6666-6666-6666-00000000000a', 'new_word', 'completed', now()),
  ('55555555-5555-5555-5555-00000000000a', '66666666-6666-6666-6666-00000000000a', 'new_word', 'completed', now()),
  ('55555555-5555-5555-5555-00000000000a', '66666666-6666-6666-6666-00000000000a', 'new_word', 'skipped', now()),
  ('55555555-5555-5555-5555-00000000000a', '66666666-6666-6666-6666-00000000000a', 'review', 'completed', now()),
  ('55555555-5555-5555-5555-00000000000a', '66666666-6666-6666-6666-00000000000a', 'new_word', 'completed', now() - interval '2 days'),
  ('55555555-5555-5555-5555-00000000000b', '66666666-6666-6666-6666-00000000000b', 'new_word', 'completed', now());
insert into public.exercise_attempts (user_id, session_id, activity_type, status) values
  ('55555555-5555-5555-5555-00000000000a', '66666666-6666-6666-6666-00000000000a', 'new_word', 'started');

select ok(not has_function_privilege('anon', 'public.new_words_today()', 'execute')
      and has_function_privilege('authenticated', 'public.new_words_today()', 'execute'),
  'only authenticated can execute new_words_today');

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-00000000000a","role":"authenticated"}';
select is(public.new_words_today(), 2, 'A counts only completed new words of today (not skipped, started, review or old)');

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-00000000000b","role":"authenticated"}';
select is(public.new_words_today(), 1, 'B counts only B''s own');

reset role;
-- The local day follows the profile timezone: a word completed just before local midnight yesterday is not today's.
update public.profiles set timezone = 'Pacific/Kiritimati' where id = '55555555-5555-5555-5555-00000000000b';
delete from public.exercise_attempts where user_id = '55555555-5555-5555-5555-00000000000b';
insert into public.exercise_attempts (user_id, session_id, activity_type, status, completed_at) values
  ('55555555-5555-5555-5555-00000000000b', '66666666-6666-6666-6666-00000000000b', 'new_word', 'completed',
   date_trunc('day', now() at time zone 'Pacific/Kiritimati') at time zone 'Pacific/Kiritimati' - interval '1 minute'),
  ('55555555-5555-5555-5555-00000000000b', '66666666-6666-6666-6666-00000000000b', 'new_word', 'completed',
   date_trunc('day', now() at time zone 'Pacific/Kiritimati') at time zone 'Pacific/Kiritimati');
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-00000000000b","role":"authenticated"}';
select is(public.new_words_today(), 1, 'the day boundary uses the profile timezone');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated"}';
select is(public.new_words_today(), 0, 'without a user the count is 0');
set local role anon;
select throws_ok('select public.new_words_today()', '42501', null, 'anon cannot call new_words_today');

select * from finish();
rollback;
