-- F2 / T-2.1: content_items (docs/06 section 3.2). Written only by the seed script (service role).

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  type text not null check (type in (
    'vocab', 'reading', 'writing_prompt', 'scenario', 'shadowing', 'minimal_pairs', 'free_talk', 'grammar_lesson')),
  version int not null default 1 check (version >= 1),
  level text not null check (level in ('B1', 'B2')),
  topics text[] not null default '{}',
  grammar_tags text[] not null default '{}',
  est_minutes numeric not null check (est_minutes > 0),
  is_active boolean not null default true,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);

create index content_items_type_level_idx on public.content_items (type, level) where is_active;

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

alter table public.content_items enable row level security;

-- Pattern A: read-only for authenticated users, active items only.
create policy content_read on public.content_items
  for select to authenticated using (is_active);

revoke all on public.content_items from anon, authenticated;
grant select on public.content_items to authenticated;
