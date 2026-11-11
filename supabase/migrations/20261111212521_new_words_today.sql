-- F3 / T-3.2: how many new words the caller completed today, for the daily new-word limit (RF-VOC-04).
-- Counted from completed new_word attempts: srs_cards has no creation date and a word can only be new once.
-- Security invoker: RLS limits it to the caller's own rows, like today_progress.

create or replace function public.new_words_today()
returns int language sql stable security invoker set search_path = '' as $$
  select count(*)::int
    from public.profiles p
    join public.exercise_attempts a on a.user_id = p.id
   where a.activity_type = 'new_word' and a.status = 'completed'
     and (a.completed_at at time zone p.timezone)::date = (now() at time zone p.timezone)::date
$$;

revoke execute on function public.new_words_today() from public, anon;
grant execute on function public.new_words_today() to authenticated;
