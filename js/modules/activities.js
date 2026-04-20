/**
 * VDLV Site Tracker — Activity Progress Module
 */

let activityCounter = 0;

function addActivity(preset = {}) {
  const id = ++activityCounter;
  const div = document.createElement('div');
  div.className = 'activity-item';
  div.id = 'act-' + id;
  div.innerHTML = `<div class="activity-header">
    <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
      <input type="text" placeholder="Activity name" value="${preset.name || ''}" style="flex:1;min-width:0;" oninput="updateActivitySummary()"/>
      <input type="text" placeholder="Code" value="${preset.code || ''}" style="width:72px;font-family:'DM Mono',monospace;font-size:11px;" title="Cost / programme code"/>
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-left:12px;">
      <select onchange="syncActStatus(${id})" class="act-status" id="astat-${id}" style="width:120px;">
        <option value="Not Started">Not Started</option>
        <option value="In Progress" selected>In Progress</option>
        <option value="Delayed">Delayed</option>
        <option value="Complete">Complete</option>
      </select>
      <span class="status-tag on-track" id="atag-${id}">In Progress</span>
      <button class="btn-remove" onclick="removeEl('act-${id}');updateActivitySummary()">×</button>
    </div>
  </div>
  <div style="margin-top:8px;">
    <textarea placeholder="Daily progress description (e.g. 'Column Casts: Column 4, 5, 6 cast today.')..." class="act-desc" id="adesc-${id}" oninput="updateActivitySummary()"></textarea>
  </div>
  <div style="margin-top:8px; display:flex; gap:10px;">
    <input type="text" class="act-note" id="anote-${id}" placeholder="Next steps or quick notes..." style="flex:1;"/>
    <button class="btn-add" style="margin-top:0; width:auto; padding:6px 12px; border-color:var(--red); color:var(--red);" onclick="logDelayForAct(${id})">+ Log Delay Event</button>
  </div>`;
  document.getElementById('activitiesContainer').appendChild(div);
  syncActStatus(id);
}

function syncActStatus(id) {
  const val = document.getElementById('astat-' + id).value;
  const tag = document.getElementById('atag-' + id);
  if (val === 'Not Started') tag.className = 'status-tag not-started';
  else if (val === 'Complete') tag.className = 'status-tag complete';
  else if (val === 'Delayed') tag.className = 'status-tag behind';
  else tag.className = 'status-tag on-track';
  tag.textContent = val;
  updateActivitySummary();
}

function updateActivitySummary() {
  let html = '';
  let count = 0;
  document.querySelectorAll('[id^="act-"]').forEach(act => {
    count++;
    const nameEl = act.querySelector('input[type="text"]');
    const name = nameEl ? (nameEl.value || 'Activity') : 'Activity';
    const desc = act.querySelector('.act-desc')?.value || '';
    const stat = act.querySelector('.act-status')?.value || '';
    const col = stat === 'Complete' ? 'var(--green)' : stat === 'Delayed' ? 'var(--red)' : stat === 'In Progress' ? 'var(--gold)' : 'var(--text-muted)';
    html += `<div style="margin-bottom:8px; background:var(--surface2); padding:10px; border-radius:6px; border:1px solid var(--border);">
      <strong style="color:${col};font-weight:600;">${name}</strong> <span style="font-size:10px;color:var(--text-muted);">— ${stat}</span>
      ${desc ? `<div style="color:var(--text);margin-top:4px;">${desc}</div>` : ''}
    </div>`;
  });
  document.getElementById('activitySummaryList').innerHTML = html || 'No activities.';
  if (count > 0) pushTimeline('progress', count + ' activities logged today');
}

function logDelayForAct(id) {
  const actName = document.querySelector('#act-' + id + ' input[type="text"]').value || 'Activity';
  document.getElementById('astat-' + id).value = 'Delayed';
  syncActStatus(id);
  addDelay({ description: 'Delay on activity: ' + actName });
  showPage('delays');
  showToast('Delay linked. Please fill in details.');
}

function getActivityCounter() { return activityCounter; }
function setActivityCounter(v) { activityCounter = v; }
