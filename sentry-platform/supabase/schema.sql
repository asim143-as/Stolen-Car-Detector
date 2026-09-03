-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
--
-- Order matters: run this BEFORE first starting the backend, or run it
-- any time after -- either way is fine, the IF NOT EXISTS guards make
-- it safe to run more than once.
--
-- `profiles` and `stolen_cars`/`detections` are created automatically
-- by the FastAPI backend on startup (see backend/app.py -> init_db()).
-- This script only adds the one table the backend doesn't own
-- (administration_staff, written directly by the Next.js frontend) and
-- the Row Level Security policies that let the frontend talk to
-- Supabase directly and safely.

-- ------------------------------------------------------------------
-- administration_staff: approval workflow for the Administration role.
-- Mirrors MediSight's doctor-approval pattern -- signing up as
-- Administration doesn't grant access until an Admin approves it.
-- ------------------------------------------------------------------
create table if not exists administration_staff (
    user_id     uuid primary key references profiles(id) on delete cascade,
    status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at  timestamptz default now()
);

alter table administration_staff enable row level security;

drop policy if exists "select own staff row" on administration_staff;
create policy "select own staff row" on administration_staff
    for select using (auth.uid() = user_id);

drop policy if exists "insert own staff row" on administration_staff;
create policy "insert own staff row" on administration_staff
    for insert with check (auth.uid() = user_id);

-- No update policy for regular users -- only an Admin (via the
-- service-role key in the Next.js API routes, which bypasses RLS
-- entirely) can approve/reject.

-- ------------------------------------------------------------------
-- profiles: created by the backend, but RLS + policies live here since
-- the Next.js frontend reads/writes it directly (middleware role
-- checks, onboarding).
-- ------------------------------------------------------------------
alter table profiles enable row level security;

drop policy if exists "select own profile" on profiles;
create policy "select own profile" on profiles
    for select using (auth.uid() = id);

drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles
    for insert with check (auth.uid() = id and role in ('user', 'administration'));

drop policy if exists "update own profile (onboarding only)" on profiles;
create policy "update own profile (onboarding only)" on profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id and role in ('user', 'administration'));
-- Note: this policy deliberately does NOT allow setting role='admin'.
-- Promoting someone to Admin has to be done manually the first time
-- (see the README), and after that, only through the Admin portal's
-- /api/admin/users route, which uses the service-role key.

-- ------------------------------------------------------------------
-- One-time: make yourself the first Admin. Sign up / log in through
-- the app once first (so your profiles row exists), then run:
--
--   update profiles set role = 'admin' where email = 'you@example.com';
--
-- After that you can promote/approve everyone else from the Admin
-- portal itself.
-- ------------------------------------------------------------------
