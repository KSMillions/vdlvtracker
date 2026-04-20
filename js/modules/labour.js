/**
 * VDLV Site Tracker — Labour Module
 */

let labourCounter = 0;

function addLabourRow(tradeName = '') {
  const id = ++labourCounter;
  const tr = document.createElement('tr');
  tr.id = 'lr-' + id;
  tr.innerHTML = `<td><input type="text" placeholder="Trade / discipline" value="${tradeName}" oninput="recalcLabour()"/></td>
    <td><input type="text" placeholder="Own / Subcontractor name"/></td>
    <td><input type="number" min="0" value="0" class="lcount" oninput="recalcLabour()" style="width:70px;"/></td>
    <td><input type="number" min="0" max="24" value="9" step="0.5" style="width:80px;"/></td>
    <td><select><option>Present</option><option>Absent</option><option>Overtime</option><option>Partial</option></select></td>
    <td><button class="btn-remove" onclick="removeEl('lr-${id}');recalcLabour()">×</button></td>`;
  document.getElementById('labourBody').appendChild(tr);
  recalcLabour();
}

function recalcLabour() {
  let total = 0;
  document.querySelectorAll('.lcount').forEach(c => total += parseInt(c.value) || 0);
  document.getElementById('totalLabour').textContent = total;
  document.getElementById('statLabour').textContent = total;
  document.getElementById('labourBadge').textContent = total;
  pushTimeline('labour', total + ' workers on site');
}

function getLabourCounter() { return labourCounter; }
function setLabourCounter(v) { labourCounter = v; }
