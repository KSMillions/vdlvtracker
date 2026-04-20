/**
 * VDLV Site Tracker — Material Deliveries Module
 */

let materialCounter = 0;

function addMaterialRow() {
  const id = ++materialCounter;
  const tr = document.createElement('tr');
  tr.id = 'mr-' + id;
  tr.innerHTML = `<td><input type="text" placeholder="e.g. Ready-mix concrete 30MPa"/></td>
    <td><input type="text" placeholder="Supplier name"/></td>
    <td><input type="text" placeholder="Docket #"/></td>
    <td><input type="number" min="0" step="0.1" placeholder="0" oninput="recalcMat()"/></td>
    <td><select><option>m³</option><option>ton</option><option>m²</option><option>m</option><option>nr</option><option>l</option><option>kg</option></select></td>
    <td><input type="time"/></td>
    <td><button class="btn-remove" onclick="removeEl('mr-${id}');recalcMat()">×</button></td>`;
  document.getElementById('materialsBody').appendChild(tr);
  recalcMat();
}

function recalcMat() {
  const n = document.querySelectorAll('#materialsBody tr').length;
  document.getElementById('statDeliveries').textContent = n;
  pushTimeline('materials', n + ' deliveries received');
}

function getMaterialCounter() { return materialCounter; }
function setMaterialCounter(v) { materialCounter = v; }
