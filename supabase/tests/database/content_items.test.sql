-- T-2.1: content_items constraints (docs/06 section 3.2). RLS and privileges are covered in practice_security.test.sql.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into public.content_items (slug, type, level, est_minutes, payload)
values ('test-constraints', 'vocab', 'B1', 1, '{}');

select lives_ok(
  $$insert into public.content_items (slug, type, level, est_minutes, payload) values ('test-constraints-ok', 'free_talk', 'B2', 6, '{"prompt": "x"}')$$,
  'a valid item is accepted');
select throws_ok(
  $$insert into public.content_items (slug, type, level, est_minutes, payload) values ('test-constraints', 'vocab', 'B1', 1, '{}')$$,
  '23505', null, 'slug is unique');
select throws_ok(
  $$insert into public.content_items (slug, type, level, est_minutes, payload) values ('Bad Slug', 'vocab', 'B1', 1, '{}')$$,
  '23514', null, 'slug must be kebab-case');
select throws_ok(
  $$insert into public.content_items (slug, type, level, est_minutes, payload) values ('test-c-type', 'quiz', 'B1', 1, '{}')$$,
  '23514', null, 'type must be a known content type');
select throws_ok(
  $$insert into public.content_items (slug, type, level, est_minutes, payload) values ('test-c-level', 'vocab', 'C1', 1, '{}')$$,
  '23514', null, 'level must be B1 or B2');
select throws_ok(
  $$insert into public.content_items (slug, type, version, level, est_minutes, payload) values ('test-c-version', 'vocab', 0, 'B1', 1, '{}')$$,
  '23514', null, 'version starts at 1');
select throws_ok(
  $$insert into public.content_items (slug, type, level, est_minutes, payload) values ('test-c-payload', 'vocab', 'B1', 1, '[]')$$,
  '23514', null, 'payload must be a JSON object');

select * from finish();
rollback;
