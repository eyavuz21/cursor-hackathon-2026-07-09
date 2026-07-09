-- Run this in the Supabase SQL Editor for a new project.
-- Also enable Anonymous sign-ins: Authentication → Providers → Anonymous.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  health_goal text not null check (health_goal in ('gentle', 'moderate', 'active')),
  interests text[] not null check (cardinality(interests) > 0),
  profile_details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Migration for existing projects:
-- alter table public.user_preferences
--   add column if not exists profile_details jsonb not null default '{}'::jsonb;

alter table public.user_preferences enable row level security;

create policy "Users can read own preferences"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own preferences"
  on public.user_preferences
  for delete
  using (auth.uid() = user_id);
