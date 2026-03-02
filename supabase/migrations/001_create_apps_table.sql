-- =============================================================================
-- eximIA Workspace Hub — Apps Table
-- =============================================================================

create table public.apps (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  url             text not null,
  logo_url        text,
  icon_emoji      text,
  category        text not null default 'general',
  credentials_enc text,
  credentials_iv  text,
  sort_order      integer not null default 0,
  is_favorite     boolean not null default false,
  color           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes
create index idx_apps_user_id on public.apps(user_id);
create index idx_apps_user_category on public.apps(user_id, category);
create index idx_apps_user_sort on public.apps(user_id, sort_order);

-- RLS
alter table public.apps enable row level security;

create policy "Users manage own apps"
  on public.apps
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_apps_updated
  before update on public.apps
  for each row execute function public.handle_updated_at();
