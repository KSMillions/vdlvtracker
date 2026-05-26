-- ══════════════════════════════════════════════════════════════════
-- VDLV Site Tracker — Patch v2.2
-- Run this in Supabase SQL Editor AFTER the main schema v2.1 script.
--
-- Fixes:
--   1. members_insert RLS: admins can now insert ANY user (not just themselves)
--   2. Adds create_project() RPC — atomically creates project + admin membership
--   3. Adds add_project_member() RPC — admins can add users to their projects
--   4. Adds get_available_users() RPC — lists users not yet in a given project
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Fix members_insert RLS ──────────────────────────────────────
-- Problem: old policy `user_id = auth.uid()` only lets users insert
--   themselves. Admins need to insert OTHER users via the add_member RPC.
-- Fix: use a security-definer RPC for all inserts → remove the blanket
--   insert policy and rely solely on the RPCs (which run as DB owner).

drop policy if exists "members_insert" on project_members;

-- New policy: only allow inserts if the caller is an admin of that project
-- (this also handles the self-insert case during project creation via RPC)
create policy "members_insert" on project_members
  for insert with check (
    -- The user being added is themselves (first-time self-join / RPC)
    user_id = auth.uid()
    OR
    -- Or the caller is an admin of this project
    check_project_admin(project_id)
  );

-- ── 2. create_project() RPC ───────────────────────────────────────
-- Creates a project row AND inserts the caller as admin in one transaction.
-- Returns the new project row as JSON.

create or replace function public.create_project(p_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_project    json;
begin
  -- Insert project
  insert into public.projects (name, created_by)
  values (p_name, auth.uid())
  returning id into v_project_id;

  -- Add creator as admin member
  insert into public.project_members (project_id, user_id, role)
  values (v_project_id, auth.uid(), 'admin');

  -- Return the full project row as JSON
  select row_to_json(p) into v_project
  from public.projects p
  where p.id = v_project_id;

  return v_project;
end;
$$;

-- ── 3. add_project_member() RPC ───────────────────────────────────
-- Allows an admin to add another user to their project.

create or replace function public.add_project_member(
  p_project_id uuid,
  p_user_id    uuid,
  p_role       text default 'member'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only admins may call this
  if not public.check_project_admin(p_project_id) then
    raise exception 'Only project admins can add members.';
  end if;

  -- Upsert to avoid duplicate key errors
  insert into public.project_members (project_id, user_id, role)
  values (p_project_id, p_user_id, p_role)
  on conflict (project_id, user_id) do update set role = excluded.role;
end;
$$;

-- ── 4. get_available_users() RPC ──────────────────────────────────
-- Returns all auth users who are NOT already members of the given project.
-- Used to populate the "Add Member" dropdown.

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
  where u.id not in (
    select pm.user_id
    from public.project_members pm
    where pm.project_id = p_project_id
  )
  order by u.email;
$$;

-- ── 5. Grant execute rights to authenticated users ─────────────────

grant execute on function public.create_project(text)                          to authenticated;
grant execute on function public.add_project_member(uuid, uuid, text)          to authenticated;
grant execute on function public.get_available_users(uuid)                     to authenticated;
grant execute on function public.get_project_members(uuid)                     to authenticated;
grant execute on function public.check_project_member(uuid)                    to authenticated;
grant execute on function public.check_project_admin(uuid)                     to authenticated;

-- ══════════════════════════════════════════════════════════════════
-- DONE — Verify with:
--   select public.create_project('Test Project');
--   select * from public.get_available_users('some-project-uuid'::uuid);
-- ══════════════════════════════════════════════════════════════════
