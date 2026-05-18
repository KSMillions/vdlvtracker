/**
 * VDLV Site Tracker — Full Comprehensive PDF Export
 */

/**
 * Sanitize text for pdf-lib StandardFonts (Helvetica = WinAnsi / Latin-1 only).
 * Converts smart quotes, dashes, accented chars, and anything non-Latin-1
 * into safe ASCII equivalents so pdf-lib never throws a character encoding error.
 */
function sanitize(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    // Smart / curly quotes
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    // Dashes
    .replace(/[\u2013\u2014\u2015]/g, '-')
    // Ellipsis
    .replace(/\u2026/g, '...')
    // Bullet
    .replace(/[\u2022\u2023\u25E6\u2043]/g, '-')
    // Common accented characters -> ASCII approximation
    .replace(/[\xC0-\xC5\u0100\u0102]/g, 'A')
    .replace(/[\xE0-\xE5\u0101\u0103]/g, 'a')
    .replace(/[\xC8-\xCB\u0112\u0114]/g, 'E')
    .replace(/[\xE8-\xEB\u0113\u0115]/g, 'e')
    .replace(/[\xCC-\xCF\u012C]/g, 'I')
    .replace(/[\xEC-\xEF\u012D]/g, 'i')
    .replace(/[\xD2-\xD6\u014C\u014E]/g, 'O')
    .replace(/[\xF2-\xF6\u014D\u014F]/g, 'o')
    .replace(/[\xD9-\xDC\u016A\u016C]/g, 'U')
    .replace(/[\xF9-\xFC\u016B\u016D]/g, 'u')
    .replace(/\xD1/g, 'N').replace(/\xF1/g, 'n')
    .replace(/\xC7/g, 'C').replace(/\xE7/g, 'c')
    // Strip any remaining non-Latin-1 chars
    .replace(/[^\x00-\xFF]/g, '?')
    // Clean up control chars
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

async function downloadPDF() {
  if (typeof PDFLib === 'undefined') {
    showToast('\u26A0\uFE0F PDF library not loaded. Check internet connection.');
    return;
  }

  // Show loading state on the button
  const pdfBtn = document.getElementById('pdfDownloadBtn');
  const origLabel = pdfBtn ? pdfBtn.innerHTML : null;
  if (pdfBtn) { pdfBtn.innerHTML = '\u23F3 Building PDF...'; pdfBtn.disabled = true; }

  try {
    await _buildAndDownloadPDF();
  } catch (err) {
    console.error('PDF generation error:', err);
    showToast('\u274C PDF failed: ' + (err.message || 'Unknown error. Check console.'));
  } finally {
    if (pdfBtn) { pdfBtn.innerHTML = origLabel; pdfBtn.disabled = false; }
  }
}

async function _buildAndDownloadPDF() {
  const { PDFDocument, rgb, StandardFonts } = PDFLib;

  // ── Gather all data (sanitized) ──────────────────
  const proj     = sanitize(document.getElementById('projectName')?.value) || 'Unspecified Project';
  const date     = sanitize(document.getElementById('logDate')?.value) || new Date().toISOString().split('T')[0];
  const contract = sanitize(document.getElementById('contractNo')?.value) || '-';
  const employer = sanitize(document.getElementById('employer')?.value) || '-';
  const agent    = sanitize(document.getElementById('siteAgent')?.value) || '-';
  const contractFormEl = document.getElementById('contractForm');
  const contractLabel  = sanitize(contractFormEl?.selectedOptions[0]?.textContent) || '-';
  const totalLabour    = sanitize(document.getElementById('totalLabour')?.textContent);
  const plantActive    = sanitize(document.getElementById('statPlant')?.textContent);
  const totalDeliveries = sanitize(document.getElementById('statDeliveries')?.textContent);
  const totalDelays    = sanitize(document.getElementById('statDelays')?.textContent);
  const wAM    = sanitize(weatherState?.AM) || 'Not recorded';
  const wPM    = sanitize(weatherState?.PM) || 'Not recorded';
  const workable = sanitize(document.getElementById('workPossible')?.value) || 'Not recorded';
  const rain   = sanitize(document.getElementById('rainfall')?.value) || '0';
  const temp   = sanitize(document.getElementById('temperature')?.value) || '-';

  // Labour data
  const labourRows = [];
  document.querySelectorAll('#labourBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input, select');
    labourRows.push({
      trade:      sanitize(inputs[0]?.value),
      contractor: sanitize(inputs[1]?.value),
      count:      sanitize(inputs[2]?.value) || '0',
      hours:      sanitize(inputs[3]?.value),
      status:     sanitize(inputs[4]?.value)
    });
  });

  // Plant data
  const plantRows = [];
  document.querySelectorAll('#plantBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input, select');
    plantRows.push({
      name:     sanitize(inputs[0]?.value),
      regId:    sanitize(inputs[1]?.value),
      operator: sanitize(inputs[2]?.value),
      hours:    sanitize(inputs[3]?.value),
      status:   sanitize(inputs[4]?.value)
    });
  });

  // Tool hire data
  const toolHireRows = [];
  document.querySelectorAll('#toolHireBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input, select');
    toolHireRows.push({
      desc:        sanitize(inputs[0]?.value),
      qty:         sanitize(inputs[1]?.value),
      supplier:    sanitize(inputs[2]?.value),
      hireIn:      sanitize(inputs[3]?.value),
      expectedOut: sanitize(inputs[4]?.value),
      actualOut:   sanitize(inputs[5]?.value),
      reason:      sanitize(inputs[6]?.value),
      notes:       sanitize(inputs[7]?.value)
    });
  });

  // Material data
  const materialRows = [];
  document.querySelectorAll('#materialsBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input, select');
    materialRows.push({
      desc:     sanitize(inputs[0]?.value),
      supplier: sanitize(inputs[1]?.value),
      docket:   sanitize(inputs[2]?.value),
      qty:      sanitize(inputs[3]?.value),
      unit:     sanitize(inputs[4]?.value),
      time:     sanitize(inputs[5]?.value)
    });
  });

  // Activity data
  const activityRows = [];
  document.querySelectorAll('[id^="act-"]').forEach(act => {
    const nameEl = act.querySelector('input[type="text"]');
    activityRows.push({
      name:   sanitize(nameEl?.value) || 'Activity',
      code:   sanitize(act.querySelectorAll('input[type="text"]')[1]?.value),
      status: sanitize(act.querySelector('.act-status')?.value),
      desc:   sanitize(act.querySelector('.act-desc')?.value),
      note:   sanitize(act.querySelector('.act-note')?.value)
    });
  });

  // Delay data
  const delayRows = [];
  document.querySelectorAll('[id^="del-"]').forEach(del => {
    const inputs = del.querySelectorAll('input, select');
    delayRows.push({
      category: sanitize(inputs[0]?.value) || '-',
      hours:    sanitize(inputs[1]?.value) || '-',
      clause:   sanitize(inputs[2]?.value) || '-',
      desc:     sanitize(inputs[3]?.value) || '-'
    });
  });

  // ── Create PDF ─────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const vdlvYellow = rgb(0.788, 0.659, 0.298); // #C9A84C
  const vdlvBlack = rgb(0.04, 0.04, 0.04);
  const textGrey = rgb(0.3, 0.3, 0.3);
  const lightGrey = rgb(0.85, 0.85, 0.85);
  const lineGrey = rgb(0.7, 0.7, 0.7);
  const white = rgb(1, 1, 1);
  const sectionBg = rgb(0.95, 0.95, 0.95);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 50;
  const CONTENT_W = PAGE_W - 2 * MARGIN;

  let currentPage;
  let curY;
  let pageNum = 0;

  function newPage() {
    currentPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pageNum++;
    curY = PAGE_H - MARGIN;
    return currentPage;
  }

  function checkSpace(needed) {
    if (curY - needed < MARGIN + 40) {
      drawFooter();
      newPage();
      drawPageHeader();
    }
  }

  function drawFooter() {
    const footerY = 30;
    currentPage.drawLine({ start: { x: MARGIN, y: footerY + 15 }, end: { x: PAGE_W - MARGIN, y: footerY + 15 }, thickness: 0.5, color: lineGrey });
    const footerText = `${proj} | Daily Site Report : ${date}`;
    currentPage.drawText(footerText, { x: MARGIN, y: footerY, size: 8, font: fontRegular, color: textGrey });
    const pgText = `Page ${pageNum}`;
    const pgW = fontRegular.widthOfTextAtSize(pgText, 8);
    currentPage.drawText(pgText, { x: PAGE_W - MARGIN - pgW, y: footerY, size: 8, font: fontRegular, color: textGrey });
  }

  function drawPageHeader() {
    currentPage.drawText('VDLV Projects — Daily Site Activity Report', { x: MARGIN, y: curY, size: 9, font: fontRegular, color: textGrey });
    currentPage.drawLine({ start: { x: MARGIN, y: curY - 8 }, end: { x: PAGE_W - MARGIN, y: curY - 8 }, thickness: 0.5, color: lightGrey });
    curY -= 24;
  }

  function drawSectionHeader(title) {
    checkSpace(35);
    // Gold bar
    currentPage.drawRectangle({ x: MARGIN, y: curY - 18, width: CONTENT_W, height: 22, color: rgb(0.788, 0.659, 0.298) });
    currentPage.drawText(title.toUpperCase(), { x: MARGIN + 10, y: curY - 13, size: 10, font: fontBold, color: vdlvBlack });
    curY -= 30;
  }

  function drawLabelValue(label, value, indent = 0) {
    checkSpace(16);
    const x = MARGIN + indent;
    currentPage.drawText(sanitize(label), { x, y: curY, size: 9, font: fontBold, color: vdlvBlack });
    const lw = fontBold.widthOfTextAtSize(sanitize(label), 9);
    currentPage.drawText(' ' + sanitize(value), { x: x + lw, y: curY, size: 9, font: fontRegular, color: textGrey });
    curY -= 16;
  }

  function drawText(text, size = 9, indent = 0, color = textGrey) {
    // Auto-sanitize: catches ALL special chars including hardcoded ones
    const safe = sanitize(text || '');
    const maxW = CONTENT_W - indent;
    const words = safe.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (fontRegular.widthOfTextAtSize(test, size) > maxW) {
        checkSpace(14);
        currentPage.drawText(line, { x: MARGIN + indent, y: curY, size, font: fontRegular, color });
        curY -= 14;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      checkSpace(14);
      currentPage.drawText(line, { x: MARGIN + indent, y: curY, size, font: fontRegular, color });
      curY -= 14;
    }
  }

  function drawTableHeader(cols) {
    checkSpace(20);
    currentPage.drawRectangle({ x: MARGIN, y: curY - 12, width: CONTENT_W, height: 16, color: sectionBg });
    let x = MARGIN + 4;
    for (const col of cols) {
      currentPage.drawText(sanitize(col.label), { x, y: curY - 8, size: 7, font: fontBold, color: vdlvBlack });
      x += col.width;
    }
    curY -= 18;
  }

  function drawTableRow(cols, values) {
    checkSpace(16);
    let x = MARGIN + 4;
    currentPage.drawLine({ start: { x: MARGIN, y: curY - 2 }, end: { x: PAGE_W - MARGIN, y: curY - 2 }, thickness: 0.3, color: lightGrey });
    for (let i = 0; i < cols.length; i++) {
      const val = sanitize(values[i] || '').substring(0, Math.floor(cols[i].width / 4.5));
      currentPage.drawText(val, { x, y: curY + 2, size: 8, font: fontRegular, color: textGrey });
      x += cols[i].width;
    }
    curY -= 14;
  }

  // ═══════════════════════════════════════════════════
  // PAGE 1: COVER PAGE
  // ═══════════════════════════════════════════════════
  newPage();

  // Company name (top right)
  currentPage.drawText('JC Van der Linde & Venter Projects (Pty) Ltd', { x: PAGE_W - 280, y: PAGE_H - 50, size: 10, font: fontRegular, color: textGrey });

  // Logo block
  const logoY = PAGE_H - 140;
  currentPage.drawRectangle({ x: MARGIN, y: logoY, width: 100, height: 70, color: vdlvBlack });
  currentPage.drawText('VV', { x: 72, y: logoY + 18, size: 54, font: fontBold, color: rgb(0.98, 0.76, 0.05) });
  currentPage.drawRectangle({ x: 150, y: logoY, width: 230, height: 70, color: rgb(0.98, 0.76, 0.05) });
  currentPage.drawText('J.C. VAN DER LINDE', { x: 165, y: logoY + 45, size: 16, font: fontBold, color: vdlvBlack });
  currentPage.drawText('& VENTER PROJECTS', { x: 165, y: logoY + 25, size: 16, font: fontBold, color: vdlvBlack });
  currentPage.drawText('(Pty) Ltd', { x: 260, y: logoY + 8, size: 12, font: fontBold, color: vdlvBlack });

  // Title
  currentPage.drawText('Daily Site Activity Report', { x: MARGIN, y: logoY - 50, size: 22, font: fontRegular, color: vdlvBlack });

  // Separator
  currentPage.drawLine({ start: { x: MARGIN, y: logoY - 70 }, end: { x: PAGE_W - MARGIN, y: logoY - 70 }, thickness: 1.5, color: vdlvYellow });

  // Cover details
  curY = logoY - 110;
  drawLabelValue('Project Title:', proj);
  drawLabelValue('Contract No.:', contract);
  drawLabelValue('Employer:', employer);
  drawLabelValue('Contractor:', 'JC Van der Linde & Venter Projects (Pty) Ltd');
  drawLabelValue('Contract Form:', contractLabel);
  drawLabelValue('Report Date:', date);
  drawLabelValue('Site Agent:', agent);
  curY -= 10;

  // Summary stats box
  currentPage.drawRectangle({ x: MARGIN, y: curY - 80, width: CONTENT_W, height: 85, color: sectionBg, borderColor: lightGrey, borderWidth: 0.5 });
  curY -= 10;
  drawLabelValue('Total Labour on Site:', totalLabour + ' workers', 10);
  drawLabelValue('Plant / Equipment Active:', plantActive + ' unit(s)', 10);
  drawLabelValue('Material Deliveries:', totalDeliveries + ' load(s)', 10);
  drawLabelValue('Delay Events Logged:', totalDelays, 10);

  drawFooter();

  // ═══════════════════════════════════════════════════
  // PAGE 2+: DETAILED SECTIONS
  // ═══════════════════════════════════════════════════
  newPage();
  drawPageHeader();

  // ── Weather & Site Conditions ────────────────────
  drawSectionHeader('Weather & Site Conditions');
  drawLabelValue('AM Weather:', wAM, 6);
  drawLabelValue('PM Weather:', wPM, 6);
  drawLabelValue('Rainfall:', rain + ' mm', 6);
  drawLabelValue('Temperature:', temp + ' °C', 6);
  drawLabelValue('Work Status:', workable, 6);
  curY -= 10;

  // ── Labour Log ──────────────────────────────────
  drawSectionHeader('Labour Log — ' + totalLabour + ' workers');
  if (labourRows.length > 0) {
    const labourCols = [
      { label: 'Trade / Discipline', width: 140 },
      { label: 'Contractor', width: 120 },
      { label: 'Count', width: 50 },
      { label: 'Hours', width: 50 },
      { label: 'Status', width: 80 }
    ];
    drawTableHeader(labourCols);
    labourRows.forEach(r => drawTableRow(labourCols, [r.trade, r.contractor, r.count, r.hours, r.status]));
  } else {
    drawText('No labour recorded for this day.', 9, 6);
  }
  curY -= 10;

  // ── Plant & Equipment ───────────────────────────
  drawSectionHeader('Plant & Equipment — ' + plantActive + ' operational');
  if (plantRows.length > 0) {
    const plantCols = [
      { label: 'Plant / Equipment', width: 130 },
      { label: 'Reg / ID', width: 80 },
      { label: 'Operator', width: 100 },
      { label: 'Hours', width: 50 },
      { label: 'Status', width: 80 }
    ];
    drawTableHeader(plantCols);
    plantRows.forEach(r => drawTableRow(plantCols, [r.name, r.regId, r.operator, r.hours, r.status]));
  } else {
    drawText('No plant / equipment recorded.', 9, 6);
  }
  curY -= 10;

  // ── Tool Hire ───────────────────────────────────
  drawSectionHeader('Tool Hire Register');
  if (toolHireRows.length > 0) {
    const thCols = [
      { label: 'Tool', width: 100 },
      { label: 'Qty', width: 35 },
      { label: 'Supplier', width: 80 },
      { label: 'Hire In', width: 65 },
      { label: 'Exp. Off', width: 65 },
      { label: 'Reason', width: 80 }
    ];
    drawTableHeader(thCols);
    toolHireRows.forEach(r => drawTableRow(thCols, [r.desc, r.qty, r.supplier, r.hireIn, r.expectedOut, r.reason]));
  } else {
    drawText('No tool hire items recorded.', 9, 6);
  }
  curY -= 10;

  // ── Material Deliveries ─────────────────────────
  drawSectionHeader('Material Deliveries — ' + totalDeliveries + ' load(s)');
  if (materialRows.length > 0) {
    const matCols = [
      { label: 'Material', width: 140 },
      { label: 'Supplier', width: 100 },
      { label: 'Docket #', width: 65 },
      { label: 'Qty', width: 50 },
      { label: 'Unit', width: 40 },
      { label: 'Time', width: 50 }
    ];
    drawTableHeader(matCols);
    materialRows.forEach(r => drawTableRow(matCols, [r.desc, r.supplier, r.docket, r.qty, r.unit, r.time]));
  } else {
    drawText('No material deliveries recorded.', 9, 6);
  }
  curY -= 10;

  // ── Activity Progress ───────────────────────────
  drawSectionHeader('Programme Progress — ' + activityRows.length + ' activities');
  if (activityRows.length > 0) {
    activityRows.forEach((a, i) => {
      checkSpace(60);
      // Activity name + status
      currentPage.drawText(`${i + 1}. ${a.name}`, { x: MARGIN + 6, y: curY, size: 9, font: fontBold, color: vdlvBlack });
      const statusColor = a.status === 'Complete' ? rgb(0.32, 0.79, 0.48) : a.status === 'Delayed' ? rgb(0.88, 0.32, 0.32) : rgb(0.788, 0.659, 0.298);
      const statusW = fontBold.widthOfTextAtSize(`[${a.status}]`, 8);
      currentPage.drawText(`[${a.status}]`, { x: PAGE_W - MARGIN - statusW - 6, y: curY, size: 8, font: fontBold, color: statusColor });
      curY -= 14;

      if (a.code) {
        drawText('Code: ' + a.code, 8, 12, textGrey);
      }
      if (a.desc) {
        drawText(a.desc, 8, 12, textGrey);
      }
      if (a.note) {
        drawText('-> Next: ' + a.note, 8, 12, rgb(0.4, 0.4, 0.6));
      }
      curY -= 6;
    });
  } else {
    drawText('No activities recorded.', 9, 6);
  }
  curY -= 10;

  // ── Delays & Events ─────────────────────────────
  drawSectionHeader('Delay Events — ' + totalDelays + ' logged');
  if (delayRows.length > 0) {
    delayRows.forEach((d, i) => {
      checkSpace(40);
      currentPage.drawText(`${i + 1}. ${d.category}`, { x: MARGIN + 6, y: curY, size: 9, font: fontBold, color: vdlvBlack });
      curY -= 14;
      drawText(`Clause: ${d.clause} | Duration: ${d.hours} hrs`, 8, 12, textGrey);
      drawText(d.desc, 8, 12, textGrey);
      curY -= 6;
    });
  } else {
    drawText('No delay events recorded today.', 9, 6);
  }
  curY -= 10;

  // ── Declaration ─────────────────────────────────
  drawSectionHeader('Declaration');
  checkSpace(80);
  drawText('I confirm the above information is an accurate record of the daily site activities.', 9, 6, vdlvBlack);
  curY -= 20;
  drawLabelValue('Signed:', '___________________________________', 6);
  drawLabelValue('Name:', agent.toUpperCase(), 6);
  drawLabelValue('Date:', date, 6);

  drawFooter();

  // ── Save & Download (cross-platform + mobile) ────────
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const filename = `VDLV_Site_Report_${date.replace(/[^0-9a-zA-Z-]/g, '')}.pdf`;

  // iOS detection — Safari on iPhone/iPad doesn't support a.download
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isMobileSafari = isIOS || (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) && 'ontouchstart' in window);

  if (isMobileSafari) {
    // iOS: open PDF in new tab — user can tap Share → Save to Files
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    showToast('PDF opened — tap Share to save ✓');
  } else if (typeof saveAs !== 'undefined') {
    // FileSaver.js available (best for desktop)
    saveAs(blob, filename);
    showToast('Full report PDF downloaded ✓');
  } else {
    // Standard download fallback (Chrome, Firefox, Edge, Android)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    showToast('Full report PDF downloaded ✓');
  }
}
