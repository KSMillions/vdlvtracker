/**
 * VDLV Site Tracker — Main Application Orchestrator (v2 — Supabase)
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
}

// ── Sidebar & Dashboard Updates ────────────────────
function updateSidebar() {
  const proj  = document.getElementById('projectName').value;
  const agent = document.getElementById('siteAgent').value;
  if (proj)  document.getElementById('sidebarProjectName').textContent = proj;
  if (agent) {
    document.getElementById('sidebarAgent').textContent   = '👤 ' + agent;
    document.getElementById('dashAgent').textContent      = agent;
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
// Clears DAILY data only — site info persists in project record
function resetForNewDay() {
  if (!confirm('Reset daily entries for a new day?\n\nSite information (project name, employer, contract) will be kept.\nLabour, plant, materials, activities and delays will be cleared.')) return;

  clearFormForNewProject();
  document.getElementById('reportPreview').textContent =
    'Click "Generate Report" to compile today\'s entries into a structured daily site report.';

  Object.keys(timelineState).forEach(k => delete timelineState[k]);

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('logDate').value = today;

  recalcLabour(); recalcPlant(); recalcMat(); recalcDelays(); recalcToolHire(); updateActivitySummary();
  showToast('Reset for new day — site info retained');
}

// ── Initialization ─────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth guard — redirect to login if not signed in
  showLoadingOverlay(true);
  const user = await guardAuth();
  if (!user) return; // guardAuth handles redirect

  // 2. Render user email badge + week/date info
  renderUserBadge(user);
  const today = new Date();
  document.getElementById('logDate').value = today.toISOString().split('T')[0];
  document.getElementById('liveDateBadge').textContent =
    today.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  document.getElementById('dashboardDate').textContent =
    today.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const weekNum = getWeekNumber(today);
  document.getElementById('weekDisplay').textContent  = 'W' + weekNum;
  document.getElementById('sidebarWeek').textContent  = '📅 Week ' + weekNum;

  // 3. Populate contract dropdown
  const contractSelect = document.getElementById('contractForm');
  if (contractSelect && typeof populateContractDropdown === 'function') {
    populateContractDropdown(contractSelect);
  }

  // 4. Load user's projects
  const projects = await loadMyProjects();
  const lastProjectId = getActiveProjectId();
  const defaultProject = projects.find(p => p.id === lastProjectId) || projects[0];

  renderProjectSwitcher(projects, defaultProject?.id);

  if (defaultProject) {
    setActiveProject(defaultProject.id);
    await loadProjectData(defaultProject.id);
  } else {
    showLoadingOverlay(false);
    // Show empty state prompt to create first project
    showPage('overview', document.querySelector('.nav-item'));
    showToast('Welcome! Create your first project using the sidebar.');
  }

  // 5. Start auto-save (every 6 hours + on visibility change)
  startAutoSave();

  showLoadingOverlay(false);
  updateSidebar();
  updateDash();
});
