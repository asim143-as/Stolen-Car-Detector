-- Fixes "infinite recursion detected in policy for relation 'profiles'"
-- This happens when a policy on `profiles` queries `profiles` itself
-- inside its USING/WITH CHECK clause (a common pattern for "let admins
-- see everyone" that backfires). This script removes EVERY existing
-- policy on profiles (whatever it's called) and reinstalls only the
-- three safe ones from supabase/schema.sql.
--
-- Run this once in the Supabase SQL Editor.

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'profiles' loop
    execute format('drop policy if exists %I on profiles', pol.policyname);
  end loop;
end $$;

create policy "select own profile" on profiles
    for select using (auth.uid() = id);

create policy "insert own profile" on profiles
    for insert with check (auth.uid() = id and role in ('user', 'administration'));

create policy "update own profile (onboarding only)" on profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id and role in ('user', 'administration'));

-- Sanity check -- should list exactly these 3 policies, nothing else:
select policyname, cmd from pg_policies where tablename = 'profiles';
