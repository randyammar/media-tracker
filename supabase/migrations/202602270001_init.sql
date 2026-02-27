-- Collectify schema
create extension if not exists pgcrypto;

create type media_type as enum ('movie', 'music', 'game');
create type media_status as enum ('owned', 'wishlist', 'currently_using', 'completed');
create type share_scope_type as enum ('collection', 'item');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  media_type media_type not null,
  title text not null check (char_length(title) between 1 and 200),
  creator text not null check (char_length(creator) between 1 and 200),
  release_date date,
  genre text[] not null default '{}',
  status media_status not null default 'wishlist',
  rating int check (rating between 1 and 10),
  notes text,
  cover_image_url text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  scope_type share_scope_type not null,
  media_item_id uuid references public.media_items(id) on delete cascade,
  token text unique,
  token_hash text not null unique,
  is_revoked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint share_scope_media_item_check check (
    (scope_type = 'collection' and media_item_id is null) or
    (scope_type = 'item' and media_item_id is not null)
  )
);

create unique index if not exists share_links_active_scope_idx
on public.share_links (owner_id, scope_type, coalesce(media_item_id, '00000000-0000-0000-0000-000000000000'::uuid))
where is_revoked = false;

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  source_context jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists media_items_updated_at on public.media_items;
create trigger media_items_updated_at
before update on public.media_items
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.media_items enable row level security;
alter table public.share_links enable row level security;
alter table public.ai_recommendations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "media_select_own" on public.media_items;
create policy "media_select_own"
on public.media_items for select
using (auth.uid() = owner_id);

drop policy if exists "media_insert_own" on public.media_items;
create policy "media_insert_own"
on public.media_items for insert
with check (auth.uid() = owner_id);

drop policy if exists "media_update_own" on public.media_items;
create policy "media_update_own"
on public.media_items for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "media_delete_own" on public.media_items;
create policy "media_delete_own"
on public.media_items for delete
using (auth.uid() = owner_id);

drop policy if exists "share_links_select_own" on public.share_links;
create policy "share_links_select_own"
on public.share_links for select
using (auth.uid() = owner_id);

drop policy if exists "share_links_insert_own" on public.share_links;
create policy "share_links_insert_own"
on public.share_links for insert
with check (auth.uid() = owner_id);

drop policy if exists "share_links_update_own" on public.share_links;
create policy "share_links_update_own"
on public.share_links for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "share_links_delete_own" on public.share_links;
create policy "share_links_delete_own"
on public.share_links for delete
using (auth.uid() = owner_id);

drop policy if exists "ai_recommendations_select_own" on public.ai_recommendations;
create policy "ai_recommendations_select_own"
on public.ai_recommendations for select
using (auth.uid() = owner_id);

drop policy if exists "ai_recommendations_insert_own" on public.ai_recommendations;
create policy "ai_recommendations_insert_own"
on public.ai_recommendations for insert
with check (auth.uid() = owner_id);

drop policy if exists "ai_recommendations_delete_own" on public.ai_recommendations;
create policy "ai_recommendations_delete_own"
on public.ai_recommendations for delete
using (auth.uid() = owner_id);
