/**
 * VDLV Site Tracker — Projects Module
 * Handles project loading, creation, and the sidebar project switcher.
 * Site information (employer, contract no., etc.) persists in the project record.
 */

let _projects = [];
let _activeProjectId = null;

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

  // Insert project
  const { data: proj, error: projErr } = await supabaseClient
    .from('projects')
    .insert({ name: name.trim(), created_by: user.id, site_info: {} })
    .select()
    .single();

  if (projErr) throw projErr;

  // Auto-add creator as admin member
  const { error: memberErr } = await supabaseClient
    .from('project_members')
    .insert({ project_id: proj.id, user_id: user.id, role: 'admin' });

  if (memberErr) console.error('Member insert error:', memberErr);

  _projects.unshift(proj);
  return proj;
}

async function updateProjectSiteInfo(projectId, siteInfo) {
  const { error } = await supabaseClient
    .from('projects')
    .update({ site_info: siteInfo })
    .eq('id', projectId);

  if (error) console.error('updateProjectSiteInfo error:', error);
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

// ── Project Switcher UI ─────────────────────────────

function renderProjectSwitcher(projects, activeId) {
  const container = document.getElementById('projectSwitcherContainer');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="no-projects-msg">No projects yet.<br>Click <strong>+ New Project</strong> to start.</div>`;
    // Update sidebar card
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

  // Update sidebar project name card
  if (active) {
    document.getElementById('sidebarProjectName').textContent = active.name;
  }
}

async function onProjectSwitch(projectId) {
  if (projectId === getActiveProjectId()) return;
  setActiveProject(projectId);

  // Update sidebar project name immediately
  const proj = getActiveProject();
  if (proj) document.getElementById('sidebarProjectName').textContent = proj.name;

  showLoadingOverlay(true);
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
  const errorEl = document.getElementById('createProjectError');
  const name = nameInput.value.trim();

  if (!name) { errorEl.textContent = 'Please enter a project name.'; return; }

  const btn = document.getElementById('createProjectBtn');
  btn.textContent = 'Creating...';
  btn.disabled = true;

  try {
    const proj = await createProject(name);
    closeCreateProjectModal();
    renderProjectSwitcher(_projects, proj.id);
    setActiveProject(proj.id);
    clearFormForNewProject();
    document.getElementById('sidebarProjectName').textContent = proj.name;
    showToast('Project "' + proj.name + '" created ✓');
  } catch (err) {
    errorEl.textContent = err.message || 'Failed to create project.';
  } finally {
    btn.textContent = 'Create';
    btn.disabled = false;
  }
}
