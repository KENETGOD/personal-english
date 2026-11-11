-- T-3.1: srs_cards / review_logs constraints, indexes, RLS and the grade_card / add_vocab_card API (docs/06 sections 3.4, 4.6; RF-VOC-03).
begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

insert into auth.users (id, instance_id, aud, role, email) values
  ('88888888-8888-8888-8888-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ra@test.local'),
  ('88888888-8888-8888-8888-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rb@test.local');
insert into public.content_items (id, slug, type, level, est_minutes, payload) values
  ('99999999-9999-9999-9999-000000000001', 'test-srs-one', 'vocab', 'B1', 1, '{}'),
  ('99999999-9999-9999-9999-000000000002', 'test-srs-two', 'vocab', 'B1', 1, '{}');
insert into public.srs_cards (id, user_id, card_type, content_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-00000000000b', '88888888-8888-8888-8888-00000000000b', 'vocab', '99999999-9999-9999-9999-000000000001');
insert into public.review_logs (user_id, card_id, rating, state) values
  ('88888888-8888-8888-8888-00000000000b', 'aaaaaaaa-aaaa-aaaa-aaaa-00000000000b', 3, 0);

select ok((select bool_and(relrowsecurity) from pg_class where oid in ('public.srs_cards'::regclass, 'public.review_logs'::regclass)),
  'RLS is enabled on srs_cards and review_logs');
select has_index('public', 'srs_cards', 'srs_cards_user_due_idx', 'due-cards index exists');
select has_index('public', 'review_logs', 'review_logs_user_reviewed_idx', 'review history index exists');

-- Defaults describe a new FSRS card.
select is((select state || '/' || reps || '/' || lapses || '/' || suspended::text || '/' || coalesce(last_review::text, 'null')
             from public.srs_cards where id = 'aaaaaaaa-aaaa-aaaa-aaaa-00000000000b'),
  '0/0/0/false/null', 'a new card is in state 0 with no reps and no last review');

-- Constraints (checked as owner).
select throws_ok($$insert into public.srs_cards (user_id, card_type) values ('88888888-8888-8888-8888-00000000000a', 'vocab')$$,
  '23514', null, 'a card needs content_id or error_id');
select throws_ok($$insert into public.srs_cards (user_id, card_type, content_id, error_id)
  values ('88888888-8888-8888-8888-00000000000a', 'vocab', '99999999-9999-9999-9999-000000000001', gen_random_uuid())$$,
  '23514', null, 'a card cannot have both content_id and error_id');
select throws_ok($$insert into public.srs_cards (user_id, card_type, content_id)
  values ('88888888-8888-8888-8888-00000000000a', 'quiz', '99999999-9999-9999-9999-000000000001')$$,
  '23514', null, 'card_type must be vocab or error');
select throws_ok($$insert into public.srs_cards (user_id, card_type, content_id, state)
  values ('88888888-8888-8888-8888-00000000000a', 'vocab', '99999999-9999-9999-9999-000000000001', 4)$$,
  '23514', null, 'state is 0..3');
select throws_ok($$insert into public.srs_cards (user_id, card_type, content_id)
  values ('88888888-8888-8888-8888-00000000000b', 'vocab', '99999999-9999-9999-9999-000000000001')$$,
  '23505', null, 'one card per user and content item');
select throws_ok($$insert into public.srs_cards (user_id, card_type, content_id)
  values ('88888888-8888-8888-8888-00000000000a', 'vocab', gen_random_uuid())$$,
  '23503', null, 'content_id must exist');
select throws_ok($$insert into public.review_logs (user_id, card_id, rating, state)
  values ('88888888-8888-8888-8888-00000000000b', 'aaaaaaaa-aaaa-aaaa-aaaa-00000000000b', 5, 0)$$,
  '23514', null, 'rating is 1..4');
select throws_ok($$insert into public.review_logs (user_id, card_id, rating, state)
  values ('88888888-8888-8888-8888-00000000000a', 'aaaaaaaa-aaaa-aaaa-aaaa-00000000000b', 3, 0)$$,
  '23503', null, 'a log must belong to the owner of its card');

-- Anonymous.
set local role anon;
select throws_ok('select * from public.srs_cards', '42501', null, 'anon cannot read srs_cards');
select throws_ok('select * from public.review_logs', '42501', null, 'anon cannot read review_logs');

-- Function privileges.
select ok(not has_function_privilege('anon', 'public.grade_card(uuid, integer, text, timestamptz, double precision, double precision, integer, integer, integer, integer, integer, integer)', 'execute')
      and not has_function_privilege('anon', 'public.add_vocab_card(uuid)', 'execute'), 'anon cannot execute the SRS functions');
select ok(has_function_privilege('authenticated', 'public.grade_card(uuid, integer, text, timestamptz, double precision, double precision, integer, integer, integer, integer, integer, integer)', 'execute')
      and has_function_privilege('authenticated', 'public.add_vocab_card(uuid)', 'execute'), 'authenticated can execute the SRS functions');

-- Authenticated without a user id.
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated"}';
select throws_ok($$select public.add_vocab_card('99999999-9999-9999-9999-000000000001')$$, '28000', 'unauthenticated', 'add_vocab_card needs a user');

-- User A sees nothing of B.
set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.srs_cards), 0, 'A sees no cards of B');
select is((select count(*)::int from public.review_logs), 0, 'A sees no review logs of B');

-- Tampering: no direct writes, either table (RNF-SEC-12).
select throws_ok($$insert into public.srs_cards (user_id, card_type, content_id)
  values ('88888888-8888-8888-8888-00000000000a', 'vocab', '99999999-9999-9999-9999-000000000002')$$,
  '42501', null, 'A cannot insert cards directly');
select throws_ok($$update public.srs_cards set due = now() - interval '1 day', reps = 0$$, '42501', null, 'A cannot rewrite scheduling directly');
select throws_ok($$delete from public.srs_cards$$, '42501', null, 'A cannot delete cards');
select throws_ok($$insert into public.review_logs (user_id, card_id, rating, state)
  values ('88888888-8888-8888-8888-00000000000a', 'aaaaaaaa-aaaa-aaaa-aaaa-00000000000b', 3, 0)$$,
  '42501', null, 'A cannot insert review logs directly');
select throws_ok($$update public.review_logs set rating = 1$$, '42501', null, 'A cannot update review logs');
select throws_ok($$delete from public.review_logs$$, '42501', null, 'A cannot delete review logs');

-- add_vocab_card.
select throws_ok($$select public.add_vocab_card(gen_random_uuid())$$, 'P0001', 'invalid_content', 'add_vocab_card rejects unknown content');
select set_config('test.card1', (select id::text from public.add_vocab_card('99999999-9999-9999-9999-000000000002')), true);
select is((select state || '/' || reps || '/' || card_type from public.srs_cards where id = current_setting('test.card1')::uuid),
  '0/0/vocab', 'add_vocab_card creates a new vocab card for A');
select is((select id::text from public.add_vocab_card('99999999-9999-9999-9999-000000000002')), current_setting('test.card1'),
  'add_vocab_card is idempotent');
select set_config('test.card2', (select id::text from public.add_vocab_card('99999999-9999-9999-9999-000000000001')), true);

-- grade_card. Args after the card id: rating, answer, due, stability, difficulty, elapsed, scheduled, steps, reps, lapses, state.
select throws_ok(format($$select public.grade_card(%L, 5, null, now() + interval '1 day', 1, 5, 0, 1, 0, 1, 0, 2)$$, current_setting('test.card1')),
  '22023', 'invalid_rating', 'grade_card rejects a bad rating');
select throws_ok(format($$select public.grade_card(%L, 3, null, now() - interval '1 day', 1, 5, 0, 1, 0, 1, 0, 2)$$, current_setting('test.card1')),
  '22023', 'invalid_due', 'grade_card rejects a due date in the past');
select throws_ok($$select public.grade_card('aaaaaaaa-aaaa-aaaa-aaaa-00000000000b', 3, null, now() + interval '1 day', 1, 5, 0, 1, 0, 1, 0, 2)$$,
  'P0001', 'card_not_found', 'A cannot grade the card of B');
select is((select reps || '/' || state || '/' || (due > now())::text
             from public.grade_card(current_setting('test.card1')::uuid, 3, 'ans', now() + interval '1 day', 4.5, 5.2, 0, 1, 0, 1, 0, 2)),
  '1/2/true', 'grade_card updates and returns the card');
select is((select count(*)::int from public.review_logs where card_id = current_setting('test.card1')::uuid), 1, 'grade_card inserts exactly one log');
select is((select rating || '/' || answer || '/' || state || '/' || scheduled_days from public.review_logs where card_id = current_setting('test.card1')::uuid),
  '3/ans/0/1', 'the log keeps the pre-review state');
select throws_ok(format($$select public.grade_card(%L, 3, null, now() + interval '2 days', 4.5, 5.2, 0, 2, 0, 2, 0, 2)$$, current_setting('test.card1')),
  'P0001', 'card_not_due', 'a card that is not due cannot be graded');
reset role;
update public.srs_cards set suspended = true where id = current_setting('test.card2')::uuid;
set local role authenticated;
set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-00000000000a","role":"authenticated"}';
select throws_ok(format($$select public.grade_card(%L, 3, null, now() + interval '1 day', 1, 5, 0, 1, 0, 1, 0, 2)$$, current_setting('test.card2')),
  'P0001', 'card_suspended', 'a suspended card cannot be graded');
select is((select count(*)::int from public.review_logs), 1, 'rejected grades leave no logs behind');

select * from finish();
rollback;
