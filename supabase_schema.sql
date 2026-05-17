-- ══════════════════════════════════════════════════════════════════
-- VDLV Site Tracker — Production Schema v2.1
-- Run this ENTIRE script in Supabase SQL Editor (safe to re-run)
-- Fixes: RLS infinite recursion, adds log history, team RPC
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Create tables if they don't exist ─────────────────────────

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now(),
  site_info   jsonb default '{}'::jsonb
);

create table if not exists project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member',  -- 'admin' | 'member'
  unique(project_id, user_id)
);

create table if not exists daily_logs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  log_date    date not null,
  data        jsonb not null default '{}'::jsonb,
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz default now()
);

-- ── 2. Patch: add missing columns safely ─────────────────────────

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'site_info'
  ) then
    alter table projects add column site_info jsonb default '{}'::jsonb;
  end if;
end $$;

-- ── 3. Fix daily_logs: replace project_id-only unique with (project_id, log_date)
--       This enables daily log HISTORY rather than a single overwritten row.

do $$ begin
  -- Drop old unique constraint on project_id alone (if it exists)
  if exists (
    select 1 from pg_constraint
    where conname = 'daily_logs_project_id_key' and contype = 'u'
  ) then
    alter table daily_logs drop constraint daily_logs_project_id_key;
  end if;
end $$;

do $$ begin
  -- Add new unique constraint on (project_id, log_date)
  if not exists (
    select 1 from pg_constraint
    where conname = 'daily_logs_project_date_key' and contype = 'u'
  ) then
    alter table daily_logs add constraint daily_logs_project_date_key
      unique (project_id, log_date);
  end if;
end $$;

-- ── 4. Enable Row Level Security ──────────────────────────────────

alter table projects        enable row level security;
alter table project_members enable row level security;
alter table daily_logs      enable row level security;

-- ── 5. CRITICAL FIX — Security-Definer Helper Functions ──────────
--       These run as the database owner and BYPASS RLS entirely.
--       This breaks the infinite recursion caused by policies that
--       query project_members from within project_members policies.

create or replace function public.check_project_member(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
      and user_id    = auth.uid()
  );
$$;

create or replace function public.check_project_admin(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
      and user_id    = auth.uid()
      and role       = 'admin'
  );
$$;

-- ── 6. RPC: get all members of a project (admins only) ───────────
--       Called from the client to populate the Team panel.
--       security definer so it can read auth.users for email addresses.

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
  where pm.project_id = p_project_id
    and public.check_project_admin(p_project_id);
$$;

-- ── 7. Drop ALL existing policies (clean slate) ───────────────────

drop policy if exists "projects_select"  on projects;
drop policy if exists "projects_insert"  on projects;
drop policy if exists "projects_update"  on projects;
drop policy if exists "projects_delete"  on projects;

drop policy if exists "members_select"   on project_members;
drop policy if exists "members_insert"   on project_members;
drop policy if exists "members_update"   on project_members;
drop policy if exists "members_delete"   on project_members;

drop policy if exists "logs_select"      on daily_logs;
drop policy if exists "logs_insert"      on daily_logs;
drop policy if exists "logs_update"      on daily_logs;
drop policy if exists "logs_delete"      on daily_logs;

-- ── 8. Recreate projects RLS policies ────────────────────────────

create policy "projects_select" on projects
  for select using (check_project_member(id));

create policy "projects_insert" on projects
  for insert with check (created_by = auth.uid());

create policy "projects_update" on projects
  for update using (check_project_admin(id));

create policy "projects_delete" on projects
  for delete using (check_project_admin(id));

-- ── 9. Recreate project_members RLS policies ─────────────────────
-- SELECT: simple — only see YOUR OWN membership rows (no self-reference)
-- Team listing for admins is handled via the get_project_members() RPC above.

create policy "members_select" on project_members
  for select using (user_id = auth.uid());

create policy "members_insert" on project_members
  for insert with check (user_id = auth.uid());

create policy "members_update" on project_members
  for update using (check_project_admin(project_id));

create policy "members_delete" on project_members
  for delete using (check_project_admin(project_id));

-- ── 10. Recreate daily_logs RLS policies ─────────────────────────

create policy "logs_select" on daily_logs
  for select using (check_project_member(project_id));

create policy "logs_insert" on daily_logs
  for insert with check (check_project_member(project_id));

create policy "logs_update" on daily_logs
  for update using (check_project_member(project_id));

create policy "logs_delete" on daily_logs
  for delete using (check_project_admin(project_id));

-- ── 11. Enable Realtime ───────────────────────────────────────────

do $$ begin
  perform pg_catalog.set_config('search_path', 'public', false);
  -- Only add if not already in publication
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'daily_logs'
  ) then
    alter publication supabase_realtime add table daily_logs;
  end if;
end $$;

-- ══════════════════════════════════════════════════════════════════
-- DONE. Verify with:
--   select * from projects;
--   select * from project_members;
--   select * from daily_logs;
--   select check_project_member('some-uuid'::uuid);
-- ══════════════════════════════════════════════════════════════════
