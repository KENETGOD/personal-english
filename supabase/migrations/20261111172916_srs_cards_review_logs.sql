-- F3 / T-3.1: srs_cards, review_logs (docs/06 sections 3.4, 4.6; RF-VOC-03).
-- Derived/integrity data like the F2 tables: owner read-only, writes only through security definer functions.
-- error_id has no FK yet: learner_errors does not exist until the errors phase, which adds it.
-- learning_steps is the ts-fsrs v6 card field that resumes (re)learning; docs/06 predates it.

create table public.srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_type text not null check (card_type in ('vocab', 'error')),
  content_id uuid references public.content_items(id) on delete cascade,
  error_id uuid,
  due timestamptz not null default now(),
  stability double precision not null default 0 check (stability >= 0),
  difficulty double precision not null default 0 check (difficulty >= 0),
  elapsed_days int not null default 0 check (elapsed_days >= 0),
  scheduled_days int not null default 0 check (scheduled_days >= 0),
  learning_steps smallint not null default 0 check (learning_steps >= 0),
  reps int not null default 0 check (reps >= 0),
  lapses int not null default 0 check (lapses >= 0),
  state smallint not null default 0 check (state between 0 and 3),
  last_review timestamptz,
  suspended boolean not null default false,
  check ((content_id is null) <> (error_id is null)),
  unique (id, user_id)
);

create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid not null,
  rating smallint not null check (rating between 1 and 4),
  answer text check (char_length(answer) <= 500),
  state smallint not null check (state between 0 and 3),
  elapsed_days int not null default 0 check (elapsed_days >= 0),
  scheduled_days int not null default 0 check (scheduled_days >= 0),
  reviewed_at timestamptz not null default now(),
  -- the composite FK makes a log impossible against another user's card
  foreign key (card_id, user_id) references public.srs_cards (id, user_id) on delete cascade
);

create index srs_cards_user_due_idx on public.srs_cards (user_id, due) where not suspended;
create unique index srs_cards_user_content_uidx on public.srs_cards (user_id, content_id) where content_id is not null;
create unique index srs_cards_user_error_uidx on public.srs_cards (user_id, error_id) where error_id is not null;
create index review_logs_user_reviewed_idx on public.review_logs (user_id, reviewed_at desc);
create index review_logs_card_idx on public.review_logs (card_id);

alter table public.srs_cards enable row level security;
alter table public.review_logs enable row level security;

create policy srs_cards_read on public.srs_cards
  for select to authenticated using ((select auth.uid()) = user_id);
create policy review_logs_read on public.review_logs
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.srs_cards from anon, authenticated;
revoke all on public.review_logs from anon, authenticated;
grant select on public.srs_cards to authenticated;
grant select on public.review_logs to authenticated;

-- ---------------------------------------------------------------------------
-- Writes: security definer functions only (RNF-SEC-12). The scheduling state is computed in
-- lib/domain/srs.ts (ts-fsrs); the server checks ownership, due-ness and basic sanity.
-- ---------------------------------------------------------------------------

create or replace function public.add_vocab_card(p_content_id uuid)
returns public.srs_cards language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_card public.srs_cards;
begin
  if v_uid is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.content_items where id = p_content_id and is_active) then
    raise exception 'invalid_content';
  end if;
  insert into public.srs_cards (user_id, card_type, content_id) values (v_uid, 'vocab', p_content_id)
  on conflict (user_id, content_id) where content_id is not null do nothing;
  select * into v_card from public.srs_cards where user_id = v_uid and content_id = p_content_id;
  return v_card;
end $$;

create or replace function public.grade_card(
  p_card_id uuid, p_rating int, p_answer text,
  p_due timestamptz, p_stability double precision, p_difficulty double precision,
  p_elapsed_days int, p_scheduled_days int, p_learning_steps int, p_reps int, p_lapses int, p_state int)
returns public.srs_cards language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_card public.srs_cards;
begin
  if v_uid is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if p_rating is null or p_rating not between 1 and 4 then
    raise exception 'invalid_rating' using errcode = '22023';
  end if;
  if p_due is null or p_due <= now() then raise exception 'invalid_due' using errcode = '22023'; end if;

  select * into v_card from public.srs_cards where id = p_card_id and user_id = v_uid for update;
  if not found then raise exception 'card_not_found'; end if;
  if v_card.suspended then raise exception 'card_suspended'; end if;
  if v_card.due > now() then raise exception 'card_not_due'; end if;

  -- the log keeps the state the card was in before this review
  insert into public.review_logs (user_id, card_id, rating, answer, state, elapsed_days, scheduled_days, reviewed_at)
  values (v_uid, p_card_id, p_rating, p_answer, v_card.state, p_elapsed_days, p_scheduled_days, now());

  update public.srs_cards
     set due = p_due, stability = p_stability, difficulty = p_difficulty, elapsed_days = p_elapsed_days,
         scheduled_days = p_scheduled_days, learning_steps = p_learning_steps, reps = p_reps,
         lapses = p_lapses, state = p_state, last_review = now()
   where id = p_card_id
  returning * into v_card;
  return v_card;
end $$;

revoke execute on function public.add_vocab_card(uuid) from public, anon;
revoke execute on function public.grade_card(uuid, int, text, timestamptz, double precision, double precision, int, int, int, int, int, int) from public, anon;
grant execute on function public.add_vocab_card(uuid) to authenticated;
grant execute on function public.grade_card(uuid, int, text, timestamptz, double precision, double precision, int, int, int, int, int, int) to authenticated;
