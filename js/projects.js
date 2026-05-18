/**
 * VDLV Site Tracker — Projects Module v2.1
 * Handles project loading, creation, switching, and team management.
 * Site information (employer, contract no., etc.) persists in the project record.
 */

let _projects       = [];
let _activeProjectId = null;
let _currentUserRole = null; // 'admin' | 'member' for the active project

// ── Project CRUD ────────────────────────────────────

async function loadMyProjects() {
  const { data, error } = await supabaseClient
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('loadMyProjects error:', error); return []; }
  _projects = data || [];
  return _projects;
}

async function createProject(name) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Use the atomic RPC function — creates project + adds admin member
  // in one transaction, bypassing all RLS timing issues.
  const { data, error } = await supabaseClient
    .rpc('create_project', { p_name: name.trim() });

  if (error) throw error;

  // RPC returns JSON — parse it if needed
  const proj = typeof data === 'string' ? JSON.parse(data) : data;

  _projects.unshift(proj);
  _currentUserRole = 'admin'; // Creator is always admin
  return proj;
}

async function updateProjectSiteInfo(projectId, siteInfo) {
  const { error } = await supabaseClient
    .from('projects')
    .update({ site_info: siteInfo })
    .eq('id', projectId);

  if (error) console.error('updateProjectSiteInfo error:', error);
}

// ── Role Management ─────────────────────────────────

/**
 * Returns 'admin' | 'member' | null for the current user in a given project.
 */
async function getCurrentUserRole(projectId) {
  const { data, error } = await supabaseClient
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .maybeSingle();

  if (error || !data) return null;
  return data.role;
}

/**
 * Loads all members of a project (admin only — calls get_project_members RPC).
 */
async function loadProjectMembers(projectId) {
  const { data, error } = await supabaseClient
    .rpc('get_project_members', { p_project_id: projectId });

  if (error) {
    console.error('loadProjectMembers error:', error);
    return [];
  }
  return data || [];
}

/**
 * Update a member's role (admin only).
 */
async function updateMemberRole(memberId, newRole) {
  const { error } = await supabaseClient
    .from('project_members')
    .update({ role: newRole })
    .eq('id', memberId);

  if (error) throw error;
}

/**
 * Remove a member from a project (admin only).
 */
async function removeMember(memberId) {
  const { error } = await supabaseClient
    .from('project_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

// ── Active Project State ────────────────────────────

function setActiveProject(id) {
  _activeProjectId = id;
  sessionStorage.setItem('vdlv_active_project', id);
}

function getActiveProjectId() {
  if (_activeProjectId) return _activeProjectId;
  const stored = sessionStorage.getItem('vdlv_active_project');
  if (stored) _activeProjectId = stored;
  return _activeProjectId;
}

function getActiveProject() {
  return _projects.find(p => p.id === getActiveProjectId()) || null;
}

function getAllProjects() {
  return _projects;
}

function getActiveUserRole() {
  return _currentUserRole;
}

// ── Project Switcher UI ─────────────────────────────

function renderProjectSwitcher(projects, activeId) {
  const container = document.getElementById('projectSwitcherContainer');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="no-projects-msg">No projects yet.<br>Click <strong>+ New Project</strong> to start.</div>`;
    document.getElementById('sidebarProjectName').textContent = 'No project selected';
    return;
  }

  const active = projects.find(p => p.id === activeId) || projects[0];
  container.innerHTML = `
    <select id="projectDropdown" onchange="onProjectSwitch(this.value)" title="Switch project">
      ${projects.map(p => `
        <option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>${p.name}</option>
      `).join('')}
    </select>`;

  if (active) {
    document.getElementById('sidebarProjectName').textContent = active.name;
  }
}

async function onProjectSwitch(projectId) {
  if (projectId === getActiveProjectId()) return;
  setActiveProject(projectId);

  const proj = getActiveProject();
  if (proj) document.getElementById('sidebarProjectName').textContent = proj.name;

  showLoadingOverlay(true);

  // Load role for new project
  _currentUserRole = await getCurrentUserRole(projectId);
  applyRoleBasedUI();

  await loadProjectData(projectId);
  showLoadingOverlay(false);
  showToast('Project loaded: ' + (proj?.name || ''));
}

// ── Create Project Modal ────────────────────────────

function openCreateProjectModal() {
  document.getElementById('createProjectModal').classList.add('open');
  document.getElementById('newProjectNameInput').focus();
}

function closeCreateProjectModal() {
  document.getElementById('createProjectModal').classList.remove('open');
  document.getElementById('newProjectNameInput').value = '';
  document.getElementById('createProjectError').textContent = '';
}

async function submitCreateProject() {
  const nameInput = document.getElementById('newProjectNameInput');
  const errorEl   = document.getElementById('createProjectError');
  const name      = nameInput.value.trim();

  if (!name) { errorEl.textContent = 'Please enter a project name.'; return; }

  const btn = document.getElementById('createProjectBtn');
  btn.textContent = 'Creating...';
  btn.disabled    = true;

  try {
    const proj = await createProject(name);
    closeCreateProjectModal();
    renderProjectSwitcher(_projects, proj.id);
    setActiveProject(proj.id);
    clearFormForNewProject();
    document.getElementById('sidebarProjectName').textContent = proj.name;
    applyRoleBasedUI();
    showToast('Project "' + proj.name + '" created ✓');
  } catch (err) {
    errorEl.textContent = err.message || 'Failed to create project.';
  } finally {
    btn.textContent = 'Create';
    btn.disabled    = false;
  }
}

// ── Role-Based UI ───────────────────────────────────

/**
 * Show or hide admin-only UI elements based on _currentUserRole.
 */
function applyRoleBasedUI() {
  const isAdmin = _currentUserRole === 'admin';
  const hasProject = _currentUserRole !== null;

  // Role badge in header — only show when a project is selected
  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    if (!hasProject) {
      roleBadge.textContent = '';
    } else {
      roleBadge.textContent = isAdmin ? '⭐ Admin' : 'Site Clerk';
      roleBadge.style.color = isAdmin ? 'var(--gold)' : 'var(--text-muted)';
    }
  }

  // Admin-only nav items — hide when no project OR user is not admin
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
}

// ── Team Panel ──────────────────────────────────────

async function loadAndRenderTeam() {
  const projectId = getActiveProjectId();
  if (!projectId) return;

  const container = document.getElementById('teamMemberList');
  if (!container) return;

  container.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:12px 0;">Loading team…</div>';

  const members = await loadProjectMembers(projectId);

  if (members.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:12px 0;">No members found. You may need admin access to view this.</div>';
    return;
  }

  container.innerHTML = members.map(m => `
    <div class="team-member-row" id="tmr-${m.member_id}">
      <div class="team-member-info">
        <div class="team-avatar">${m.email.charAt(0).toUpperCase()}</div>
        <div>
          <div class="team-email">${m.email}</div>
          <div class="team-role-badge ${m.role}">${m.role === 'admin' ? '⭐ Admin' : '📋 Site Clerk'}</div>
        </div>
      </div>
      <div class="team-actions admin-only">
        <select onchange="handleRoleChange('${m.member_id}', this.value)" class="role-select">
          <option value="admin"  ${m.role === 'admin'  ? 'selected' : ''}>Admin</option>
          <option value="member" ${m.role === 'member' ? 'selected' : ''}>Site Clerk</option>
        </select>
        <button class="btn-remove-member" onclick="handleRemoveMember('${m.member_id}', '${m.email}')" title="Remove member">✕</button>
      </div>
    </div>
  `).join('');

  applyRoleBasedUI();
}

async function handleRoleChange(memberId, newRole) {
  try {
    await updateMemberRole(memberId, newRole);
    showToast('Role updated ✓');
  } catch (err) {
    showToast('⚠️ Failed to update role: ' + err.message);
  }
}

async function handleRemoveMember(memberId, email) {
  if (!confirm(`Remove ${email} from this project?`)) return;
  try {
    await removeMember(memberId);
    const row = document.getElementById('tmr-' + memberId);
    if (row) row.remove();
    showToast('Member removed ✓');
  } catch (err) {
    showToast('⚠️ Failed to remove member: ' + err.message);
  }
}

// ── Add Member Panel ────────────────────────────────

async function openAddMemberPanel() {
  const panel = document.getElementById('addMemberPanel');
  const select = document.getElementById('addMemberUserSelect');
  const projectId = getActiveProjectId();

  // Toggle — if already open, close it
  if (panel.style.display !== 'none') {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  select.innerHTML = '<option value="">Loading users…</option>';

  try {
    // Fetch all Supabase users NOT already in this project
    const { data, error } = await supabaseClient
      .rpc('get_available_users', { p_project_id: projectId });

    if (error) throw error;

    if (!data || data.length === 0) {
      select.innerHTML = '<option value="">No available users — all users are already members</option>';
      return;
    }

    select.innerHTML = '<option value="">— Select a user —</option>' +
      data.map(u => `<option value="${u.user_id}">${u.email}</option>`).join('');

  } catch (err) {
    select.innerHTML = '<option value="">Error loading users</option>';
    console.error('get_available_users error:', err);
  }
}

async function submitAddMember() {
  const userSelect  = document.getElementById('addMemberUserSelect');
  const roleSelect  = document.getElementById('addMemberRoleSelect');
  const errorEl     = document.getElementById('addMemberError');
  const btn         = document.getElementById('addMemberSubmitBtn');
  const projectId   = getActiveProjectId();

  const userId = userSelect.value;
  const role   = roleSelect.value;
  const email  = userSelect.options[userSelect.selectedIndex]?.text;

  errorEl.style.display = 'none';

  if (!userId) {
    errorEl.textContent = 'Please select a user.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Adding…';

  try {
    const { error } = await supabaseClient
      .rpc('add_project_member', {
        p_project_id: projectId,
        p_user_id:    userId,
        p_role:       role
      });

    if (error) throw error;

    showToast(`${email} added as ${role === 'admin' ? 'Admin' : 'Site Clerk'} ✓`);

    // Close panel and refresh member list
    document.getElementById('addMemberPanel').style.display = 'none';
    await loadAndRenderTeam();

  } catch (err) {
    errorEl.textContent = err.message || 'Failed to add member.';
    errorEl.style.display = 'block';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Add to Project';
  }
}
