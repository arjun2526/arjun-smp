-- ARJUN SMP PHASE 2
-- Run this in Supabase SQL Editor.

create table if not exists public.admin_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,
    created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

-- Remove old policy if you are rerunning this script.
drop policy if exists "Admin can read own record"
on public.admin_users;

create policy "Admin can read own record"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id);

-- No public signup or public admin creation policy.
-- Add the admin record manually using the SQL Editor.
