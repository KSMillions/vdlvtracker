/**
 * VDLV Site Tracker — Main Application Orchestrator v2.1
 */

// ── Navigation ─────────────────────────────────────
function toggleSidebar() {
  const sb = document.querySelector('.sidebar');
  const ov = document.getElementById('mobileOverlay');
  sb.classList.toggle('open');
  ov.classList.toggle('active');
}

function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (el) el.classList.add('active');
  const sb = document.querySelector('.sidebar');
  if (sb.classList.contains('open')) toggleSidebar();

  // Load team data when navigating to team page
  if (id === 'team') loadAndRenderTeam();
}

// ── Sidebar & Dashboard Updates ────────────────────
function updateSidebar() {
  const proj  = document.getElementById('projectName').value;
  const agent = document.getElementById('siteAgent').value;
  if (proj)  document.getElementById('sidebarProjectName').textContent = proj;
  if (agent) {
    document.getElementById('sidebarAgent').textContent = '👤 ' + agent;
    document.getElementById('dashAgent').textContent    = agent;
  }
}

function updateDash() {
  const w = document.getElementById('workPossible').value;
  const r = document.getElementById('rainfall').value;
  if (w) document.getElementById('dashWorkable').textContent = w;
  document.getElementById('dashRainfall').textContent = (r || '0') + ' mm';
}

// ── Save (now routes to cloud) ─────────────────────
function saveDailyLog() {
  saveToCloud();
}

// ── New Day Reset ───────────────────────────────────
function resetForNewDay() {
  if (!confirm(
    'Reset for a new day?\n\n' +
    'WILL BE CLEARED:\n' +
    '  • Material Deliveries\n' +
    '  • Weather & Site Conditions\n\n' +
    'WILL BE KEPT:\n' +
    '  • Labour Log\n' +
    '  • Plant & Equipment\n' +
    '  • Tool Hire\n' +
    '  • Activity Progress\n' +
    '  • Delays & Events\n' +
    '  • Site Information'
  )) return;

  // ── Clear Material Deliveries ──
  const matBody = document.getElementById('materialsBody');
  if (matBody) matBody.innerHTML = '';
  setMaterialCounter(0);
  recalcMat();

  // ── Clear Weather & Site Conditions ──
  setWeatherState('', '');
  document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('selected'));
  ['workPossible', 'rainfall', 'temperature'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // ── Advance the log date to today ──
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('logDate').value = today;

  // ── Reset report preview ──
  const preview = document.getElementById('reportPreview');
  if (preview) preview.textContent = 'Click "Generate Report" to compile today\'s entries into a structured daily site report.';

  showToast('New day started — deliveries & weather cleared ✓');
}


// ── Initialization ─────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth guard — redirect to login if not signed in
  showLoadingOverlay(true);
  const user = await guardAuth();
  if (!user) return;

  // 2. Render user email badge + week/date info
  renderUserBadge(user);
  const today = new Date();
  document.getElementById('logDate').value = today.toISOString().split('T')[0];
  document.getElementById('liveDateBadge').textContent =
    today.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  document.getElementById('dashboardDate').textContent =
    today.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const weekNum = getWeekNumber(today);
  document.getElementById('weekDisplay').textContent = 'W' + weekNum;
  document.getElementById('sidebarWeek').textContent = '📅 Week ' + weekNum;

  // 3. Populate contract dropdown
  const contractSelect = document.getElementById('contractForm');
  if (contractSelect && typeof populateContractDropdown === 'function') {
    populateContractDropdown(contractSelect);
  }

  // 4. Check director status first (affects UI and project loading)
  await checkIsDirector();
  applyRoleBasedUI(); // Show Director badge immediately if applicable

  // 5. Load user's projects (RLS auto-returns ALL projects for directors)
  const projects       = await loadMyProjects();
  const lastProjectId  = getActiveProjectId();
  const defaultProject = projects.find(p => p.id === lastProjectId) || projects[0];

  renderProjectSwitcher(projects, defaultProject?.id);

  if (defaultProject) {
    setActiveProject(defaultProject.id);

    // 5. Load role for this project and apply role-based UI
    const role = await getCurrentUserRole(defaultProject.id);
    _currentUserRole = role;
    applyRoleBasedUI();

    await loadProjectData(defaultProject.id);
  } else {
    showLoadingOverlay(false);
    showPage('overview', document.querySelector('.nav-item'));
    showToast('Welcome! Create your first project using the sidebar.');
    applyRoleBasedUI();
  }

  // 6. Start auto-save (every 6 hours + on visibility change)
  startAutoSave();

  showLoadingOverlay(false);
  updateSidebar();
  updateDash();
});
