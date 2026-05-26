-- ══════════════════════════════════════════════════════════════════
-- VDLV Site Tracker — Patch v2.3  (Ghost / Developer Role)
-- Run in Supabase SQL Editor.
--
-- What this does:
--   1.  Ensures system_roles table exists with proper RLS
--   2.  Creates check_is_ghost() security-definer helper
--   3.  Updates ALL RLS policies so ghost bypasses membership checks
--   4.  Updates get_project_members() to EXCLUDE ghost users
--   5.  Updates get_available_users() to EXCLUDE ghost users
--   6.  Assigns 'ghost' role to info@speco.co.za
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Ensure system_roles table exists ───────────────────────────

create table if not exists system_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null  -- 'director' | 'ghost'
);

alter table system_roles enable row level security;

-- Users can only read their OWN system role (keeps ghost invisible)
drop policy if exists "system_roles_select" on system_roles;
create policy "system_roles_select" on system_roles
  for select using (user_id = auth.uid());

-- Only service_role can insert/update system roles (managed via dashboard only)
drop policy if exists "system_roles_insert" on system_roles;
drop policy if exists "system_roles_update" on system_roles;
drop policy if exists "system_roles_delete" on system_roles;

-- ── 2. check_is_ghost() helper ────────────────────────────────────

create or replace function public.check_is_ghost()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.system_roles
    where user_id = auth.uid()
      and role = 'ghost'
  );
$$;

-- ── 3. Update projects RLS — ghost bypasses membership ───────────

drop policy if exists "projects_select" on projects;
drop policy if exists "projects_update" on projects;
drop policy if exists "projects_delete" on projects;

create policy "projects_select" on projects
  for select using (
    check_project_member(id) OR check_is_ghost()
  );

create policy "projects_update" on projects
  for update using (
    check_project_admin(id) OR check_is_ghost()
  );

create policy "projects_delete" on projects
  for delete using (
    check_project_admin(id) OR check_is_ghost()
  );

-- ── 4. Update daily_logs RLS — ghost bypasses membership ─────────

drop policy if exists "logs_select" on daily_logs;
drop policy if exists "logs_insert" on daily_logs;
drop policy if exists "logs_update" on daily_logs;
drop policy if exists "logs_delete" on daily_logs;

create policy "logs_select" on daily_logs
  for select using (
    check_project_member(project_id) OR check_is_ghost()
  );

create policy "logs_insert" on daily_logs
  for insert with check (
    check_project_member(project_id) OR check_is_ghost()
  );

create policy "logs_update" on daily_logs
  for update using (
    check_project_member(project_id) OR check_is_ghost()
  );

create policy "logs_delete" on daily_logs
  for delete using (
    check_project_admin(project_id) OR check_is_ghost()
  );

-- ── 5. Rebuild get_project_members() — exclude ghost users ────────

create or replace function public.get_project_members(p_project_id uuid)
returns table(member_id uuid, user_id uuid, role text, email text)
language sql
security definer
stable
set search_path = public, auth
as $$
  select
    pm.id       as member_id,
    pm.user_id,
    pm.role,
    u.email
  from public.project_members pm
  join auth.users u on u.id = pm.user_id
  -- Exclude ghost/developer accounts from all team views
  where pm.project_id = p_project_id
    and public.check_project_admin(p_project_id)
    and not exists (
      select 1 from public.system_roles sr
      where sr.user_id = pm.user_id
        and sr.role = 'ghost'
    );
$$;

-- ── 6. Rebuild get_available_users() — exclude ghost users ────────

create or replace function public.get_available_users(p_project_id uuid)
returns table(user_id uuid, email text)
language sql
security definer
stable
set search_path = public, auth
as $$
  select
    u.id   as user_id,
    u.email
  from auth.users u
  -- Not already a member
  where u.id not in (
    select pm.user_id
    from public.project_members pm
    where pm.project_id = p_project_id
  )
  -- Exclude ghost accounts from the "Add Member" dropdown
  and u.id not in (
    select sr.user_id
    from public.system_roles sr
    where sr.role = 'ghost'
  )
  order by u.email;
$$;

-- ── 7. Grant execute on check_is_ghost to authenticated ──────────

grant execute on function public.check_is_ghost() to authenticated;

-- ── 8. Assign ghost role to info@speco.co.za ─────────────────────
-- This is safe to re-run — uses upsert so it won't duplicate.

do $$
declare
  v_user_id uuid;
begin
  -- Look up the user by email
  select id into v_user_id
  from auth.users
  where email = 'info@speco.co.za'
  limit 1;

  if v_user_id is null then
    raise notice 'User info@speco.co.za not found in auth.users. '
                 'Make sure this account is created/invited in Supabase Auth first, '
                 'then re-run this script.';
  else
    insert into public.system_roles (user_id, role)
    values (v_user_id, 'ghost')
    on conflict (user_id) do update set role = 'ghost';

    raise notice 'Ghost role assigned to info@speco.co.za (user_id: %)', v_user_id;
  end if;
end $$;

-- ══════════════════════════════════════════════════════════════════
-- DONE — Verify with:
--   select * from system_roles;
--   select check_is_ghost();   -- run as info@speco.co.za = true
-- ══════════════════════════════════════════════════════════════════
