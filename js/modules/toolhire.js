/**
 * VDLV Site Tracker — Tool Hire Module
 */

let toolHireCounter = 0;

function addToolHireRow() {
  const id = ++toolHireCounter;
  const tr = document.createElement('tr');
  tr.id = 'thr-' + id;
  tr.innerHTML = `<td><input type="text" placeholder="Tool name/desc"/></td>
    <td><input type="number" min="1" value="1" style="width:60px;" oninput="recalcToolHire()"/></td>
    <td><input type="text" placeholder="Supplier"/></td>
    <td><input type="date" class="th-in" onchange="recalcToolHire()"/></td>
    <td><input type="date" class="th-out" onchange="recalcToolHire()"/></td>
    <td><input type="date" class="th-actual" onchange="recalcToolHire()"/></td>
    <td><select style="width:130px;"><option value="">Select...</option><option>Client instruction</option><option>Non-conformance</option><option>Damaged own tools</option><option>Calibration</option><option>Other</option></select></td>
    <td><span class="status-tag not-started" id="th-stat-${id}">Active</span></td>
    <td><input type="text" placeholder="Notes"/></td>
    <td><button class="btn-remove" onclick="removeEl('thr-${id}');recalcToolHire()">×</button></td>`;
  document.getElementById('toolHireBody').appendChild(tr);
  recalcToolHire();
}

function recalcToolHire() {
  let active = 0, nearing = 0, overdue = 0;
  const todayStr = document.getElementById('logDate').value || new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);
  today.setHours(0, 0, 0, 0);

  document.querySelectorAll('[id^="thr-"]').forEach(tr => {
    const qty = parseInt(tr.querySelector('input[type="number"]').value) || 0;
    const outDateStr = tr.querySelector('.th-out').value;
    const actualDateStr = tr.querySelector('.th-actual').value;
    const tag = document.getElementById('th-stat-' + tr.id.split('-')[1]);

    if (actualDateStr) {
      tag.textContent = 'Returned';
      tag.className = 'status-tag not-started';
      return;
    }
    if (!outDateStr) {
      active += qty;
      tag.textContent = 'Active';
      tag.className = 'status-tag on-track';
      return;
    }

    const outD = new Date(outDateStr);
    outD.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((outD - today) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      overdue += qty; active += qty;
      tag.textContent = 'Overdue';
      tag.className = 'status-tag behind';
    } else if (diffDays <= 3) {
      nearing += qty; active += qty;
      tag.textContent = 'Nearing Off-hire';
      tag.className = 'status-tag complete';
    } else {
      active += qty;
      tag.textContent = 'Active';
      tag.className = 'status-tag on-track';
    }
  });

  const alertCard = document.getElementById('hireAlertCard');
  if (alertCard) {
    if (nearing > 0 || overdue > 0) {
      alertCard.style.display = 'block';
      let msg = '';
      if (overdue > 0) msg += `<span style="color:var(--red);font-weight:bold;">${overdue} overdue</span>`;
      if (nearing > 0) msg += (msg ? ' · ' : '') + `<span style="color:var(--gold);font-weight:bold;">${nearing} nearing</span>`;
      document.getElementById('statToolsNearing').innerHTML = msg;
      const badge = document.getElementById('toolHireBadge');
      badge.style.display = 'inline-block';
      badge.textContent = overdue > 0 ? overdue : '!';
    } else {
      alertCard.style.display = 'none';
      document.getElementById('toolHireBadge').style.display = 'none';
    }
  }
}

function getToolHireCounter() { return toolHireCounter; }
function setToolHireCounter(v) { toolHireCounter = v; }
