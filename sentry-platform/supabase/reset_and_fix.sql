-- Comprehensive fix/reset script. Safe to run multiple times.
-- Run this in Supabase Dashboard -> SQL Editor -> New query.

-- ------------------------------------------------------------------
-- 1) Wipe every existing policy on profiles + administration_staff
--    (removes any leftover/recursive/conflicting ones from earlier
--    attempts) and reinstall clean, known-good ones.
-- ------------------------------------------------------------------
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'profiles' loop
    execute format('drop policy if exists %I on profiles', pol.policyname);
  end loop;
  for pol in select policyname from pg_policies where tablename = 'administration_staff' loop
    execute format('drop policy if exists %I on administration_staff', pol.policyname);
  end loop;
end $$;

alter table profiles enable row level security;
alter table administration_staff enable row level security;

create policy "select own profile" on profiles
    for select using (auth.uid() = id);

create policy "insert own profile" on profiles
    for insert with check (auth.uid() = id and role in ('user', 'administration'));

create policy "update own profile (onboarding only)" on profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id and role in ('user', 'administration'));

create policy "select own staff row" on administration_staff
    for select using (auth.uid() = user_id);

create policy "insert own staff row" on administration_staff
    for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- 2) Sanity checks -- run these and eyeball the output.
-- ------------------------------------------------------------------
select policyname, cmd, tablename from pg_policies
  where tablename in ('profiles', 'administration_staff')
  order by tablename, cmd;

select id, email, role, created_at from profiles order by created_at desc;
select user_id, status, created_at from administration_staff order by created_at desc;

-- ------------------------------------------------------------------
-- 3) OPTIONAL -- only run this if you want a totally clean slate
--    (wipes every test account's role/report data, NOT the auth
--    users themselves -- those live in Supabase Auth, delete them
--    from Dashboard -> Authentication if needed).
-- Uncomment the block below to use it:
-- ------------------------------------------------------------------
-- truncate table administration_staff;
-- truncate table stolen_cars restart identity cascade;
-- truncate table detections restart identity cascade;
-- truncate table profiles cascade;
