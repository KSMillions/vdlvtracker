/**
 * VDLV Site Tracker — LocalStorage Persistence
 */

function saveToLocalStorage() {
  const state = {
    siteInfo: {
      projectName: document.getElementById('projectName').value,
      siteAgent: document.getElementById('siteAgent').value,
      contractNo: document.getElementById('contractNo').value,
      employer: document.getElementById('employer').value,
      contractForm: document.getElementById('contractForm')?.value || ''
    },
    weather: {
      AM: weatherState.AM, PM: weatherState.PM,
      workPossible: document.getElementById('workPossible').value,
      rainfall: document.getElementById('rainfall').value,
      temperature: document.getElementById('temperature').value
    },
    labour: Array.from(document.querySelectorAll('#labourBody tr')).map(tr => {
      const inputs = tr.querySelectorAll('input, select');
      return { trade: inputs[0].value, name: inputs[1].value, count: inputs[2].value, hrs: inputs[3].value, status: inputs[4].value };
    }),
    plant: Array.from(document.querySelectorAll('#plantBody tr')).map(tr => {
      const inputs = tr.querySelectorAll('input, select');
      return { name: inputs[0].value, id: inputs[1].value, operator: inputs[2].value, hrs: inputs[3].value, status: inputs[4].value };
    }),
    materials: Array.from(document.querySelectorAll('#materialsBody tr')).map(tr => {
      const inputs = tr.querySelectorAll('input, select');
      return { desc: inputs[0].value, supplier: inputs[1].value, docket: inputs[2].value, qty: inputs[3].value, unit: inputs[4].value, time: inputs[5].value };
    }),
    toolHire: Array.from(document.querySelectorAll('#toolHireBody tr')).map(tr => {
      const inputs = tr.querySelectorAll('input, select');
      return { desc: inputs[0].value, qty: inputs[1].value, supplier: inputs[2].value, in: inputs[3].value, out: inputs[4].value, actual: inputs[5].value, reason: inputs[6].value, notes: inputs[7].value };
    }),
    activities: Array.from(document.querySelectorAll('.activity-item')).map(act => {
      const name = act.querySelector('input[type="text"]').value;
      const code = act.querySelectorAll('input[type="text"]')[1].value;
      const status = act.querySelector('.act-status').value;
      const desc = act.querySelector('.act-desc').value;
      const note = act.querySelector('.act-note').value;
      return { name, code, status, desc, note };
    }),
    delays: Array.from(document.querySelectorAll('.delay-item')).map(del => {
      const inputs = del.querySelectorAll('input, select');
      return { category: inputs[0].value, hrs: inputs[1].value, clause: inputs[2].value, desc: inputs[3].value };
    })
  };
  localStorage.setItem('vdlv_tracker_state', JSON.stringify(state));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem('vdlv_tracker_state');
  if (!data) return false;
  try {
    const state = JSON.parse(data);

    if (state.siteInfo) {
      document.getElementById('projectName').value = state.siteInfo.projectName || '';
      document.getElementById('siteAgent').value = state.siteInfo.siteAgent || '';
      document.getElementById('contractNo').value = state.siteInfo.contractNo || '';
      document.getElementById('employer').value = state.siteInfo.employer || '';
      // Contract form — set after dropdown is populated
      if (document.getElementById('contractForm') && state.siteInfo.contractForm) {
        document.getElementById('contractForm').value = state.siteInfo.contractForm;
      }
    }

    if (state.weather) {
      setWeatherState(state.weather.AM || '', state.weather.PM || '');
      document.getElementById('workPossible').value = state.weather.workPossible || '';
      document.getElementById('rainfall').value = state.weather.rainfall || '';
      document.getElementById('temperature').value = state.weather.temperature || '';
      ['AM', 'PM'].forEach(period => {
        if (weatherState[period]) {
          document.querySelectorAll('#weather' + period + ' .weather-btn').forEach(btn => {
            if (btn.textContent.includes(weatherState[period])) btn.classList.add('selected');
          });
        }
      });
      document.getElementById('dashWeather').textContent = (weatherState.AM || '—') + ' / ' + (weatherState.PM || '—');
    }

    // Labour
    document.getElementById('labourBody').innerHTML = '';
    setLabourCounter(0);
    (state.labour || []).forEach(l => {
      addLabourRow(l.trade);
      const inputs = document.getElementById('lr-' + getLabourCounter()).querySelectorAll('input, select');
      inputs[1].value = l.name || '';
      inputs[2].value = l.count || '0';
      inputs[3].value = l.hrs || '9';
      inputs[4].value = l.status || 'Present';
    });

    // Plant
    document.getElementById('plantBody').innerHTML = '';
    setPlantCounter(0);
    (state.plant || []).forEach(p => {
      addPlantRow({ name: p.name, id: p.id });
      const inputs = document.getElementById('pr-' + getPlantCounter()).querySelectorAll('input, select');
      inputs[2].value = p.operator || '';
      inputs[3].value = p.hrs || '9';
      inputs[4].value = p.status || 'operational';
    });

    // Materials
    document.getElementById('materialsBody').innerHTML = '';
    setMaterialCounter(0);
    (state.materials || []).forEach(m => {
      addMaterialRow();
      const inputs = document.getElementById('mr-' + getMaterialCounter()).querySelectorAll('input, select');
      inputs[0].value = m.desc || '';
      inputs[1].value = m.supplier || '';
      inputs[2].value = m.docket || '';
      inputs[3].value = m.qty || '';
      inputs[4].value = m.unit || 'm³';
      inputs[5].value = m.time || '';
    });

    // Tool Hire
    document.getElementById('toolHireBody').innerHTML = '';
    setToolHireCounter(0);
    (state.toolHire || []).forEach(t => {
      addToolHireRow();
      const inputs = document.getElementById('thr-' + getToolHireCounter()).querySelectorAll('input, select');
      inputs[0].value = t.desc || '';
      inputs[1].value = t.qty || '1';
      inputs[2].value = t.supplier || '';
      inputs[3].value = t.in || '';
      inputs[4].value = t.out || '';
      inputs[5].value = t.actual || '';
      inputs[6].value = t.reason || '';
      inputs[7].value = t.notes || '';
    });

    // Activities
    document.getElementById('activitiesContainer').innerHTML = '';
    setActivityCounter(0);
    (state.activities || []).forEach(a => {
      addActivity({ name: a.name, code: a.code });
      const act = document.getElementById('act-' + getActivityCounter());
      act.querySelector('.act-status').value = a.status || 'In Progress';
      act.querySelector('.act-desc').value = a.desc || '';
      act.querySelector('.act-note').value = a.note || '';
      syncActStatus(getActivityCounter());
    });

    // Delays
    document.getElementById('delayContainer').innerHTML = '';
    setDelayCounter(0);
    (state.delays || []).forEach(d => {
      addDelay();
      const inputs = document.getElementById('del-' + getDelayCounter()).querySelectorAll('input, select');
      inputs[0].value = d.category || '';
      inputs[1].value = d.hrs || '';
      inputs[2].value = d.clause || '';
      inputs[3].value = d.desc || '';
    });

    recalcLabour(); recalcPlant(); recalcMat(); recalcToolHire(); recalcDelays(); updateDash();
    return true;
  } catch (e) {
    console.error('Failed to parse saved state', e);
    return false;
  }
}
