-- Run this in Supabase SQL Editor if you already created user_preferences
-- without the profile_details column.
-- https://supabase.com/dashboard/project/svosjlfcpzrnggfznfoe/sql/new

alter table public.user_preferences
  add column if not exists profile_details jsonb not null default '{}'::jsonb;
