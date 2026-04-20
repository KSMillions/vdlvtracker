/**
 * VDLV Site Tracker — Delays & Events Module
 */

let delayCounter = 0;

function addDelay(preset = {}) {
  const id = ++delayCounter;
  const div = document.createElement('div');
  div.className = 'delay-item';
  div.id = 'del-' + id;
  div.innerHTML = `<div class="form-group"><label>Delay Category</label><select onchange="recalcDelays()"><option value="">Select type</option><option>Employer Risk — Drawing Issue (Cl. 25.1)</option><option>Employer Risk — Late Instructions (Cl. 25.2)</option><option>Force Majeure — Weather (Cl. 25.6)</option><option>Nominated Subcontractor (Cl. 25.7)</option><option>Access / Obstruction</option><option>Utility / Services Strike</option><option>Material Non-delivery</option><option>Contractor Risk</option><option>Other</option></select></div>
    <div class="form-group"><label>Duration (hrs)</label><input type="number" min="0" max="24" step="0.5" placeholder="0" oninput="recalcDelays()"/></div>
    <div class="form-group"><label>Contract Clause</label><input type="text" placeholder="e.g. 25.2.1"/></div>
    <div class="form-group"><label>Description</label><input type="text" placeholder="Brief description of delay event" value="${preset.description || ''}"/></div>
    <button class="btn-remove" onclick="removeEl('del-${id}');recalcDelays()">×</button>`;
  document.getElementById('delayContainer').appendChild(div);
  recalcDelays();
}

function recalcDelays() {
  const n = document.querySelectorAll('[id^="del-"]').length;
  document.getElementById('statDelays').textContent = n;
  document.getElementById('delayBadge').textContent = n;
  if (n > 0) pushTimeline('delays', n + ' delay event(s) logged');
}

function getDelayCounter() { return delayCounter; }
function setDelayCounter(v) { delayCounter = v; }
