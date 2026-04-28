-- ═══════════════════════════════════════════════════════
-- VDLV Site Tracker — Supabase Database Schema
-- Run this entire script in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Projects table (persistent site info lives here)
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now(),
  site_info   jsonb default '{}'::jsonb
);

-- 2. Project members (controls who can access which project)
create table if not exists project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member',   -- 'admin' | 'member'
  unique(project_id, user_id)
);

-- 3. Daily log — ONE row per project, overwritten each day
--    site_info persists in projects.site_info
--    daily data (labour/plant/materials/etc.) lives in data JSONB
create table if not exists daily_logs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null unique references projects(id) on delete cascade,
  log_date    date not null,
  data        jsonb not null default '{}'::jsonb,
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz default now()
);

-- ── Enable Row-Level Security ────────────────────────
alter table projects       enable row level security;
alter table project_members enable row level security;
alter table daily_logs      enable row level security;

-- ── Projects RLS ────────────────────────────────────
-- SELECT: user must be a member of the project
create policy "projects_select" on projects
  for select using (
    id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

-- INSERT: any authenticated user can create a project (invite-only means they already have an account)
create policy "projects_insert" on projects
  for insert with check (created_by = auth.uid());

-- UPDATE: only admins of the project can update it
create policy "projects_update" on projects
  for update using (
    id in (
      select project_id from project_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ── Project Members RLS ──────────────────────────────
-- SELECT: you can see your own membership + members of your admin projects
create policy "members_select" on project_members
  for select using (
    user_id = auth.uid()
    or project_id in (
      select project_id from project_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- INSERT: users can add themselves to a project (creation flow)
create policy "members_insert" on project_members
  for insert with check (user_id = auth.uid());

-- DELETE: admins can remove members
create policy "members_delete" on project_members
  for delete using (
    project_id in (
      select project_id from project_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ── Daily Logs RLS ───────────────────────────────────
-- SELECT: project members only
create policy "logs_select" on daily_logs
  for select using (
    project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

-- INSERT: project members can create a log
create policy "logs_insert" on daily_logs
  for insert with check (
    project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

-- UPDATE: project members can update the log
create policy "logs_update" on daily_logs
  for update using (
    project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

-- ── Enable Realtime on daily_logs ────────────────────
-- Run this to allow Supabase Realtime to broadcast changes:
alter publication supabase_realtime add table daily_logs;

-- ═══════════════════════════════════════════════════════
-- DONE. Verify with:
--   select * from projects;
--   select * from project_members;
--   select * from daily_logs;
-- ═══════════════════════════════════════════════════════
