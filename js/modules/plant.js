/**
 * VDLV Site Tracker — Plant & Equipment Module
 */

let plantCounter = 0;

function addPlantRow(preset = {}) {
  const id = ++plantCounter;
  const tr = document.createElement('tr');
  tr.id = 'pr-' + id;
  tr.innerHTML = `<td><input type="text" placeholder="e.g. Tower Crane" value="${preset.name || ''}"/></td>
    <td><input type="text" placeholder="Reg / ID" value="${preset.id || ''}"/></td>
    <td><input type="text" placeholder="Operator name"/></td>
    <td><input type="number" min="0" max="24" value="9" step="0.5" style="width:80px;" oninput="recalcPlant()"/></td>
    <td><select class="pstatus" onchange="recalcPlant()"><option value="operational">Operational</option><option value="idle">Idle</option><option value="breakdown">Breakdown</option><option value="offhire">Off-hire</option></select></td>
    <td><button class="btn-remove" onclick="removeEl('pr-${id}');recalcPlant()">×</button></td>`;
  document.getElementById('plantBody').appendChild(tr);
  recalcPlant();
}

function recalcPlant() {
  let active = 0;
  document.querySelectorAll('.pstatus').forEach(s => {
    if (s.value === 'operational') active++;
  });
  document.getElementById('statPlant').textContent = active;
  pushTimeline('plant', active + ' plant units operational');
}

function getPlantCounter() { return plantCounter; }
function setPlantCounter(v) { plantCounter = v; }
