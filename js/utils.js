/**
 * VDLV Site Tracker — Shared Utilities
 */

/** Show a toast notification */
function showToast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

/** Remove a DOM element by ID */
function removeEl(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/** Get ISO week number */
function getWeekNumber(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

/** Timeline state — tracks live activity feed */
const timelineState = {};

/** Push an update to the activity timeline */
function pushTimeline(key, text) {
  timelineState[key] = text;
  const now = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  const container = document.getElementById('recentTimeline');
  if (!container) return;
  container.innerHTML = Object.entries(timelineState).map(([k, v]) =>
    `<div class="timeline-item"><div class="timeline-date">${now}</div><div class="timeline-content"><strong>${k}</strong> ${v}</div></div>`
  ).join('');
}
