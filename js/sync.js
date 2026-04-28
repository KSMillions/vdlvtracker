/**
 * VDLV Site Tracker — Cloud Sync Module
 * 
 * Handles:
 * - Saving daily log data to Supabase (site info persists in projects table)
 * - Loading data back from Supabase when a project is selected
 * - Realtime subscription so other users' changes appear instantly
 * - Auto-save every 6 hours (~twice per working day) + on page hide
 * - Graceful offline fallback to localStorage
 */

let _realtimeChannel = null;
let _autoSaveTimer = null;
let _isSaving = false;

// ── Loading Overlay ─────────────────────────────────

function showLoadingOverlay(show) {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = show ? 'flex' : 'none';
}

// ── Save to Cloud ───────────────────────────────────

async function saveToCloud() {
  if (_isSaving) return;
  const projectId = getActiveProjectId();

  if (!projectId) {
    saveToLocalStorage();
    showToast('Saved locally — no project selected');
    return;
  }

  _isSaving = true;
  const saveBtn = document.getElementById('mainSaveBtn');
  if (saveBtn) { saveBtn.textContent = 'Saving...'; saveBtn.disabled = true; }

  try {
    const user = await getCurrentUser();
    const state = gatherFormState();
    const today = new Date().toISOString().split('T')[0];

    // 1. Persist site info in the project record (survives day resets)
    await updateProjectSiteInfo(projectId, {
      projectName: state.siteInfo.projectName,
      siteAgent:   state.siteInfo.siteAgent,
      contractNo:  state.siteInfo.contractNo,
      employer:    state.siteInfo.employer,
      contractForm: state.siteInfo.contractForm
    });

    // 2. Upsert daily data — one row per project, overwritten each day
    const { error } = await supabaseClient
      .from('daily_logs')
      .upsert({
        project_id:  projectId,
        log_date:    today,
        data: {
          weather:    state.weather,
          labour:     state.labour,
          plant:      state.plant,
          materials:  state.materials,
          toolHire:   state.toolHire,
          activities: state.activities,
          delays:     state.delays
        },
        updated_by:  user?.id,
        updated_at:  new Date().toISOString()
      }, { onConflict: 'project_id' });

    if (error) throw error;

    saveToLocalStorage(); // Keep local cache in sync
    showToast('Saved to cloud ✓');

  } catch (err) {
    console.error('Cloud save failed:', err);
    saveToLocalStorage();
    showToast('⚠️ Cloud save failed — saved locally');
  } finally {
    _isSaving = false;
    if (saveBtn) { saveBtn.textContent = 'Save Report'; saveBtn.disabled = false; }
  }
}

// ── Load from Cloud ─────────────────────────────────

async function loadFromCloud(projectId) {
  // -- Restore persistent site info from the project record
  const project = getAllProjects().find(p => p.id === projectId);
  if (project?.site_info && Object.keys(project.site_info).length > 0) {
    const si = project.site_info;
    document.getElementById('projectName').value  = si.projectName  || '';
    document.getElementById('siteAgent').value    = si.siteAgent    || '';
    document.getElementById('contractNo').value   = si.contractNo   || '';
    document.getElementById('employer').value     = si.employer     || '';
    if (document.getElementById('contractForm') && si.contractForm) {
      document.getElementById('contractForm').value = si.contractForm;
    }
    updateSidebar();
  }

  // -- Load today's daily log data
  const { data, error } = await supabaseClient
    .from('daily_logs')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle(); // returns null if no row, not an error

  if (error) {
    console.error('loadFromCloud error:', error);
    return false;
  }

  if (data?.data) {
    restoreFormState(data.data);
    return true;
  }

  return false; // No log yet for this project
}

// ── Realtime Subscription ───────────────────────────

function subscribeToProject(projectId) {
  // Tear down previous subscription
  if (_realtimeChannel) {
    supabaseClient.removeChannel(_realtimeChannel);
    _realtimeChannel = null;
  }

  setRealtimeDot('connecting');

  _realtimeChannel = supabaseClient
    .channel('vdlv_log_' + projectId)
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'daily_logs',
        filter: `project_id=eq.${projectId}`
      },
      async (payload) => {
        const user = await getCurrentUser();
        // Ignore our own saves to avoid UI flicker
        if (payload.new.updated_by === user?.id) return;

        showToast('🔄 Updated by another team member');
        restoreFormState(payload.new.data);
      }
    )
    .subscribe((status) => {
      setRealtimeDot(status === 'SUBSCRIBED' ? 'live' : 'connecting');
    });
}

function setRealtimeDot(state) {
  const dot = document.getElementById('realtimeDot');
  const label = document.getElementById('realtimeLabel');
  if (!dot) return;
  if (state === 'live') {
    dot.style.background = 'var(--green)';
    dot.style.boxShadow  = '0 0 6px rgba(82,201,122,0.6)';
    if (label) label.textContent = 'Live';
  } else {
    dot.style.background = 'var(--amber)';
    dot.style.boxShadow  = 'none';
    if (label) label.textContent = 'Syncing…';
  }
}

// ── Auto-Save (twice per day) ───────────────────────

function startAutoSave() {
  if (_autoSaveTimer) clearInterval(_autoSaveTimer);

  // 6-hour interval (~twice per full working day)
  _autoSaveTimer = setInterval(saveToCloud, 6 * 60 * 60 * 1000);

  // Also save when the tab loses focus or is closed
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveToCloud();
  });
}

// ── Load Project Data ───────────────────────────────

async function loadProjectData(projectId) {
  document.getElementById('reportPreview').textContent =
    'Click "Generate Report" to compile today\'s entries into a structured daily site report.';

  const loaded = await loadFromCloud(projectId);
  if (!loaded) {
    clearFormForNewProject();
  }

  subscribeToProject(projectId);
  recalcLabour(); recalcPlant(); recalcMat(); recalcToolHire();
  recalcDelays(); updateDash(); updateActivitySummary();
}

// ── State Gatherer ──────────────────────────────────

function gatherFormState() {
  return {
    siteInfo: {
      projectName:  document.getElementById('projectName')?.value  || '',
      siteAgent:    document.getElementById('siteAgent')?.value    || '',
      contractNo:   document.getElementById('contractNo')?.value   || '',
      employer:     document.getElementById('employer')?.value     || '',
      contractForm: document.getElementById('contractForm')?.value || ''
    },
    weather: {
      AM:            weatherState.AM,
      PM:            weatherState.PM,
      workPossible:  document.getElementById('workPossible')?.value  || '',
      rainfall:      document.getElementById('rainfall')?.value      || '',
      temperature:   document.getElementById('temperature')?.value   || ''
    },
    labour: Array.from(document.querySelectorAll('#labourBody tr')).map(tr => {
      const i = tr.querySelectorAll('input, select');
      return { trade: i[0]?.value, name: i[1]?.value, count: i[2]?.value, hrs: i[3]?.value, status: i[4]?.value };
    }),
    plant: Array.from(document.querySelectorAll('#plantBody tr')).map(tr => {
      const i = tr.querySelectorAll('input, select');
      return { name: i[0]?.value, id: i[1]?.value, operator: i[2]?.value, hrs: i[3]?.value, status: i[4]?.value };
    }),
    materials: Array.from(document.querySelectorAll('#materialsBody tr')).map(tr => {
      const i = tr.querySelectorAll('input, select');
      return { desc: i[0]?.value, supplier: i[1]?.value, docket: i[2]?.value, qty: i[3]?.value, unit: i[4]?.value, time: i[5]?.value };
    }),
    toolHire: Array.from(document.querySelectorAll('#toolHireBody tr')).map(tr => {
      const i = tr.querySelectorAll('input, select');
      return { desc: i[0]?.value, qty: i[1]?.value, supplier: i[2]?.value, in: i[3]?.value, out: i[4]?.value, actual: i[5]?.value, reason: i[6]?.value, notes: i[7]?.value };
    }),
    activities: Array.from(document.querySelectorAll('.activity-item')).map(act => ({
      name:   act.querySelector('input[type="text"]')?.value,
      code:   act.querySelectorAll('input[type="text"]')[1]?.value,
      status: act.querySelector('.act-status')?.value,
      desc:   act.querySelector('.act-desc')?.value,
      note:   act.querySelector('.act-note')?.value
    })),
    delays: Array.from(document.querySelectorAll('.delay-item')).map(del => {
      const i = del.querySelectorAll('input, select');
      return { category: i[0]?.value, hrs: i[1]?.value, clause: i[2]?.value, desc: i[3]?.value };
    })
  };
}

// ── State Restorer ──────────────────────────────────

function restoreFormState(state) {
  if (!state) return;

  // Weather
  if (state.weather) {
    setWeatherState(state.weather.AM || '', state.weather.PM || '');
    document.getElementById('workPossible').value = state.weather.workPossible || '';
    document.getElementById('rainfall').value     = state.weather.rainfall     || '';
    document.getElementById('temperature').value  = state.weather.temperature  || '';
    ['AM', 'PM'].forEach(period => {
      document.querySelectorAll('#weather' + period + ' .weather-btn').forEach(btn => {
        btn.classList.toggle('selected', weatherState[period] && btn.textContent.includes(weatherState[period]));
      });
    });
    document.getElementById('dashWeather').textContent =
      (weatherState.AM || '—') + ' / ' + (weatherState.PM || '—');
  }

  // Labour
  document.getElementById('labourBody').innerHTML = '';
  setLabourCounter(0);
  (state.labour || []).forEach(l => {
    addLabourRow(l.trade);
    const el = document.getElementById('lr-' + getLabourCounter());
    const i = el.querySelectorAll('input, select');
    i[1].value = l.name || ''; i[2].value = l.count || '0';
    i[3].value = l.hrs  || '9'; i[4].value = l.status || 'Present';
  });

  // Plant
  document.getElementById('plantBody').innerHTML = '';
  setPlantCounter(0);
  (state.plant || []).forEach(p => {
    addPlantRow({ name: p.name, id: p.id });
    const el = document.getElementById('pr-' + getPlantCounter());
    const i = el.querySelectorAll('input, select');
    i[2].value = p.operator || ''; i[3].value = p.hrs || '9'; i[4].value = p.status || 'operational';
  });

  // Materials
  document.getElementById('materialsBody').innerHTML = '';
  setMaterialCounter(0);
  (state.materials || []).forEach(m => {
    addMaterialRow();
    const el = document.getElementById('mr-' + getMaterialCounter());
    const i = el.querySelectorAll('input, select');
    i[0].value = m.desc || ''; i[1].value = m.supplier || ''; i[2].value = m.docket || '';
    i[3].value = m.qty  || ''; i[4].value = m.unit || 'm³'; i[5].value = m.time || '';
  });

  // Tool Hire
  document.getElementById('toolHireBody').innerHTML = '';
  setToolHireCounter(0);
  (state.toolHire || []).forEach(t => {
    addToolHireRow();
    const el = document.getElementById('thr-' + getToolHireCounter());
    const i = el.querySelectorAll('input, select');
    i[0].value = t.desc || ''; i[1].value = t.qty || '1'; i[2].value = t.supplier || '';
    i[3].value = t.in   || ''; i[4].value = t.out || ''; i[5].value = t.actual || '';
    i[6].value = t.reason || ''; i[7].value = t.notes || '';
  });

  // Activities
  document.getElementById('activitiesContainer').innerHTML = '';
  setActivityCounter(0);
  (state.activities || []).forEach(a => {
    addActivity({ name: a.name, code: a.code });
    const act = document.getElementById('act-' + getActivityCounter());
    act.querySelector('.act-status').value = a.status || 'In Progress';
    act.querySelector('.act-desc').value   = a.desc   || '';
    act.querySelector('.act-note').value   = a.note   || '';
    syncActStatus(getActivityCounter());
  });

  // Delays
  document.getElementById('delayContainer').innerHTML = '';
  setDelayCounter(0);
  (state.delays || []).forEach(d => {
    addDelay();
    const el = document.getElementById('del-' + getDelayCounter());
    const i = el.querySelectorAll('input, select');
    i[0].value = d.category || ''; i[1].value = d.hrs || '';
    i[2].value = d.clause   || ''; i[3].value = d.desc || '';
  });
}

// ── Clear for New Day ───────────────────────────────
// Clears daily data only; site info stays in project record and is NOT cleared

function clearFormForNewProject() {
  ['labourBody', 'plantBody', 'materialsBody', 'toolHireBody'].forEach(id =>
    document.getElementById(id).innerHTML = ''
  );
  document.getElementById('activitiesContainer').innerHTML = '';
  document.getElementById('delayContainer').innerHTML = '';
  setLabourCounter(0); setPlantCounter(0); setMaterialCounter(0);
  setActivityCounter(0); setDelayCounter(0); setToolHireCounter(0);
  setWeatherState('', '');
  document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('selected'));
  ['workPossible', 'rainfall', 'temperature'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}
