/**
 * VDLV Site Tracker — Main Application (Orchestrator)
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
  const proj = document.getElementById('projectName').value;
  const agent = document.getElementById('siteAgent').value;
  if (proj) document.getElementById('sidebarProjectName').textContent = proj;
  if (agent) {
    document.getElementById('sidebarAgent').textContent = '👤 ' + agent;
    document.getElementById('dashAgent').textContent = agent;
  }
}

function updateDash() {
  const w = document.getElementById('workPossible').value;
  const r = document.getElementById('rainfall').value;
  if (w) document.getElementById('dashWorkable').textContent = w;
  document.getElementById('dashRainfall').textContent = (r || '0') + ' mm';
}

// ── Save / Clear ───────────────────────────────────
function saveDailyLog() {
  saveToLocalStorage();
  showToast('Daily log saved to browser storage ✓');
}

function clearAll() {
  if (!confirm('Clear all entries and reset for a new day?')) return;
  ['labourBody', 'plantBody', 'materialsBody', 'toolHireBody'].forEach(id => document.getElementById(id).innerHTML = '');
  document.getElementById('activitiesContainer').innerHTML = '';
  document.getElementById('delayContainer').innerHTML = '';
  document.getElementById('reportPreview').textContent = 'Click "Generate Report" to compile today\'s entries.';
  setLabourCounter(0);
  setPlantCounter(0);
  setMaterialCounter(0);
  setActivityCounter(0);
  setDelayCounter(0);
  setToolHireCounter(0);
  Object.keys(timelineState).forEach(k => delete timelineState[k]);
  setWeatherState('', '');
  document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('selected'));
  localStorage.removeItem('vdlv_tracker_state');
  recalcLabour(); recalcPlant(); recalcMat(); recalcDelays(); recalcToolHire(); updateActivitySummary();
  showToast('Reset — ready for new day');
}

// ── Initialization ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();

  // Populate contract dropdown from config
  const contractSelect = document.getElementById('contractForm');
  if (contractSelect && typeof populateContractDropdown === 'function') {
    populateContractDropdown(contractSelect);
  }

  if (!loadFromLocalStorage()) {
    // Default starter data only if no saved state
    ['Concrete Gang', 'Steel Fixers', 'Bricklayers', 'General Workers'].forEach(t => addLabourRow(t));
    [{ name: 'Tower Crane', id: 'TC-01' }, { name: 'Concrete Pump', id: 'CP-01' }, { name: 'TLB / Excavator', id: 'TLB-02' }].forEach(p => addPlantRow(p));
    [{ name: 'Reinforced Concrete Structure — Columns', code: '2110' }, { name: 'Formwork & Shuttering', code: '2200' }, { name: 'Brickwork — External Envelope', code: '3100' }, { name: 'Roof Structure', code: '5100' }, { name: 'Waterproofing — Basement', code: '4210' }].forEach(a => addActivity(a));
  }

  // Always set today's date
  document.getElementById('logDate').value = today.toISOString().split('T')[0];
  document.getElementById('liveDateBadge').textContent = today.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  document.getElementById('dashboardDate').textContent = today.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const weekNum = getWeekNumber(today);
  document.getElementById('weekDisplay').textContent = 'W' + weekNum;
  document.getElementById('sidebarWeek').textContent = '📅 Week ' + weekNum;

  // Update sidebar from loaded data
  updateSidebar();
  updateDash();
});
