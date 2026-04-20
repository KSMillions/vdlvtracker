/**
 * VDLV Site Tracker — Text Report Generator
 */

function generateReport() {
  const date = document.getElementById('logDate').value || '—';
  const proj = document.getElementById('projectName').value || 'PROJECT NAME';
  const agent = document.getElementById('siteAgent').value || '—';
  const contract = document.getElementById('contractNo').value || '—';
  const employer = document.getElementById('employer').value || '—';
  const contractForm = document.getElementById('contractForm');
  const contractLabel = contractForm ? (contractForm.selectedOptions[0]?.textContent || '—') : '—';
  const labour = document.getElementById('totalLabour').textContent;
  const plant = document.getElementById('statPlant').textContent;
  const deliveries = document.getElementById('statDeliveries').textContent;
  const delays = document.getElementById('statDelays').textContent;
  const wAM = weatherState.AM || 'Not recorded';
  const wPM = weatherState.PM || 'Not recorded';
  const workable = document.getElementById('workPossible').value || 'Not recorded';
  const rain = document.getElementById('rainfall').value || '0';
  const temp = document.getElementById('temperature').value || '—';

  // Labour details
  let labourText = '';
  document.querySelectorAll('#labourBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input, select');
    const trade = inputs[0]?.value || '';
    const contractor = inputs[1]?.value || '';
    const count = inputs[2]?.value || '0';
    const hrs = inputs[3]?.value || '';
    const status = inputs[4]?.value || '';
    if (trade) labourText += `    • ${trade} (${contractor || 'Own'}) — ${count} workers, ${hrs}hrs [${status}]\n`;
  });

  // Plant details
  let plantText = '';
  document.querySelectorAll('#plantBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input, select');
    const name = inputs[0]?.value || '';
    const regId = inputs[1]?.value || '';
    const operator = inputs[2]?.value || '';
    const hrs = inputs[3]?.value || '';
    const status = inputs[4]?.value || '';
    if (name) plantText += `    • ${name} [${regId}] — Op: ${operator || '—'}, ${hrs}hrs [${status}]\n`;
  });

  // Tool Hire details
  let toolHireText = '';
  document.querySelectorAll('#toolHireBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input, select');
    const desc = inputs[0]?.value || '';
    const qty = inputs[1]?.value || '';
    const supplier = inputs[2]?.value || '';
    const hireIn = inputs[3]?.value || '';
    const expectedOut = inputs[4]?.value || '';
    const actualOut = inputs[5]?.value || '';
    const reason = inputs[6]?.value || '';
    const notes = inputs[7]?.value || '';
    if (desc) toolHireText += `    • ${desc} x${qty} (${supplier || '—'}) In:${hireIn || '—'} Exp:${expectedOut || '—'} Act:${actualOut || '—'} [${reason}] ${notes}\n`;
  });

  // Material details
  let materialText = '';
  document.querySelectorAll('#materialsBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input, select');
    const desc = inputs[0]?.value || '';
    const supplier = inputs[1]?.value || '';
    const docket = inputs[2]?.value || '';
    const qty = inputs[3]?.value || '';
    const unit = inputs[4]?.value || '';
    const time = inputs[5]?.value || '';
    if (desc) materialText += `    • ${desc} — ${supplier}, Dkt#${docket}, ${qty} ${unit} @ ${time || '—'}\n`;
  });

  // Activity details
  let actText = '';
  document.querySelectorAll('[id^="act-"]').forEach(r => {
    const nameEl = r.querySelector('input[type="text"]');
    const name = nameEl ? nameEl.value || 'Activity' : 'Activity';
    const stat = r.querySelector('.act-status')?.value || 'Unknown';
    const desc = r.querySelector('.act-desc')?.value.replace(/\n/g, ' ') || 'No details given.';
    const note = r.querySelector('.act-note')?.value || '';
    actText += `    • [${stat}] ${name}\n      > ${desc}\n`;
    if (note) actText += `      → Next: ${note}\n`;
  });

  // Delay details
  let delayText = '';
  document.querySelectorAll('[id^="del-"]').forEach(d => {
    const inputs = d.querySelectorAll('input,select');
    const cat = inputs[0]?.value || '—';
    const hrs = inputs[1]?.value || '—';
    const clause = inputs[2]?.value || '—';
    const desc = inputs[3]?.value || '—';
    delayText += `    • [${clause}] ${cat} | ${hrs}hrs | ${desc}\n`;
  });

  const r = `══════════════════════════════════════════════════════════
  VDLV PROJECTS — DAILY SITE REPORT
══════════════════════════════════════════════════════════
  Project      : ${proj.toUpperCase()}
  Date         : ${date}
  Contract No. : ${contract}
  Employer     : ${employer}
  Site Agent   : ${agent.toUpperCase()}
  Contract     : ${contractLabel}

──────────────────────────────────────────────────────────
  WEATHER & SITE CONDITIONS
──────────────────────────────────────────────────────────
  AM Weather   : ${wAM}
  PM Weather   : ${wPM}
  Rainfall     : ${rain} mm
  Temperature  : ${temp} °C
  Work Status  : ${workable}

──────────────────────────────────────────────────────────
  LABOUR LOG [${labour} total]
──────────────────────────────────────────────────────────
${labourText || '    No labour recorded.\n'}
──────────────────────────────────────────────────────────
  PLANT & EQUIPMENT [${plant} operational]
──────────────────────────────────────────────────────────
${plantText || '    No plant recorded.\n'}
──────────────────────────────────────────────────────────
  TOOL HIRE
──────────────────────────────────────────────────────────
${toolHireText || '    No tool hire items.\n'}
──────────────────────────────────────────────────────────
  MATERIAL DELIVERIES [${deliveries} load(s)]
──────────────────────────────────────────────────────────
${materialText || '    No deliveries recorded.\n'}
──────────────────────────────────────────────────────────
  PROGRAMME PROGRESS
──────────────────────────────────────────────────────────
${actText || '    No activities recorded.\n'}
──────────────────────────────────────────────────────────
  DELAY EVENTS [${delays} logged]
──────────────────────────────────────────────────────────
${delays === '0' ? '    No delay events recorded today.\n' : delayText}
──────────────────────────────────────────────────────────
  DECLARATION
──────────────────────────────────────────────────────────
  I confirm the above information is accurate.

  Signed : _______________________________
  Name   : ${agent.toUpperCase()}
  Date   : ${date}

══════════════════════════════════════════════════════════
  Generated · VDLV Site Tracker
══════════════════════════════════════════════════════════`.trim();

  document.getElementById('reportPreview').textContent = r;
  showToast('Report generated — ready to copy');
}

function copyReport() {
  const t = document.getElementById('reportPreview').textContent;
  if (t.startsWith('Click')) { showToast('Generate the report first'); return; }
  navigator.clipboard.writeText(t).then(() => showToast('Copied to clipboard ✓'));
}
