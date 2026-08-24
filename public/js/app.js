let loadedRecordingsList = [];

function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : '';
}

document.addEventListener('DOMContentLoaded', () => {

  // ─── LOGIN PAGE HANDLER ────────────────────────────────────────────────────
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const agentCode  = document.getElementById('agentCode').value.trim();
      const password   = document.getElementById('password').value.trim();
      const btnLogin   = document.getElementById('btnLogin');
      const alertBox   = document.getElementById('alertBox');
      const alertMsg   = document.getElementById('alertMessage');

      if (alertBox) alertBox.style.display = 'none';
      const origBtnContent = btnLogin.innerHTML;
      btnLogin.disabled = true;
      btnLogin.innerHTML = `<div class="spinner"></div><span>Authenticating...</span>`;

      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          credentials: 'same-origin',
          body: JSON.stringify({ agent_code: agentCode, password: password })
        });

        const data = await response.json();

        if (data.success) {
          showToast('Login successful! Loading dashboard...', 'success');
          setTimeout(() => { window.location.href = data.redirect || '/dashboard'; }, 500);
        } else {
          if (alertMsg)  alertMsg.textContent = data.message || 'Login failed.';
          if (alertBox)  alertBox.style.display = 'flex';
          btnLogin.disabled = false;
          btnLogin.innerHTML = origBtnContent;
        }
      } catch (err) {
        if (alertMsg)  alertMsg.textContent = 'Server connection error. Please try again.';
        if (alertBox)  alertBox.style.display = 'flex';
        btnLogin.disabled = false;
        btnLogin.innerHTML = origBtnContent;
      }
    });
    return; // stop here for login page
  }

  // ─── SIDEBAR NAVIGATION ────────────────────────────────────────────────────
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const mod = item.getAttribute('data-module');
      if (mod) switchModule(mod);
    });
  });

  // ─── AGENT STATUS SELECTOR ─────────────────────────────────────────────────
  const statusSelect = document.getElementById('statusSelect');
  if (statusSelect) {
    statusSelect.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      try {
        const response = await fetch('/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
          credentials: 'same-origin',
          body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if (data.success) {
          showToast(`Status: ${newStatus.toUpperCase()}`, 'success');
          const dot = document.getElementById('sidebarStatusDot');
          if (dot) dot.classList.toggle('offline', newStatus === 'offline');
          const statStatus = document.getElementById('statAgentStatus');
          if (statStatus) statStatus.textContent = newStatus;
        } else {
          showToast(data.message || 'Status update failed', 'error');
        }
      } catch (err) { showToast('Error updating status', 'error'); }
    });
  }
  // ─── THEME TOGGLE LOGIC ─────────────────────────────────────────────────────
  const themeToggleBtn  = document.getElementById('themeToggleBtn');
  const themeToggleText = document.getElementById('themeToggleText');
  const savedTheme      = localStorage.getItem('theme');
  const isDarkInitial   = savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDarkInitial) {
    document.body.classList.add('dark');
    document.documentElement.classList.add('dark');
    if (themeToggleBtn) {
      const icon = themeToggleBtn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-sun';
      if (themeToggleText) themeToggleText.textContent = 'Light';
    }
  } else {
    document.body.classList.remove('dark');
    document.documentElement.classList.remove('dark');
    if (themeToggleBtn) {
      const icon = themeToggleBtn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-moon';
      if (themeToggleText) themeToggleText.textContent = 'Dark';
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      document.documentElement.classList.toggle('dark', isDark);
      const newTheme = isDark ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      const icon = themeToggleBtn.querySelector('i');
      if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      if (themeToggleText) themeToggleText.textContent = isDark ? 'Light' : 'Dark';
      showToast(`Switched to ${newTheme.toUpperCase()} theme`, 'info');
    });
  }


  // ─── CREATE AGENT FORM ─────────────────────────────────────────────────────
  const createAgentForm = document.getElementById('createAgentForm');
  if (createAgentForm) {
    createAgentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('newAgentCode').value.trim();
      const name = document.getElementById('newFullName').value.trim();
      const pass = document.getElementById('newPassword').value.trim();

      try {
        const res  = await apiPost('agent_create', { agent_code: code, full_name: name, password: pass, sip_peer: code });
        const data = await res.json();
        if (data.success) {
          showToast(`Agent '${code}' created!`, 'success');
          closeCreateAgentModal();
          createAgentForm.reset();
          loadAgentsModule();
        } else {
          showToast(data.message || 'Creation failed', 'error');
        }
      } catch (err) { showToast('Error creating agent', 'error'); }
    });
  }

  // ─── EDIT AGENT FORM ───────────────────────────────────────────────────────
  const editAgentForm = document.getElementById('editAgentForm');
  if (editAgentForm) {
    editAgentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id        = parseInt(document.getElementById('editAgentId').value, 10);
      const code      = document.getElementById('editAgentCode').value;
      const fullName  = document.getElementById('editFullName').value.trim();
      const password  = document.getElementById('editPassword').value.trim();
      const sipSecret = document.getElementById('editSipSecret').value.trim();
      const btnSubmit = document.getElementById('btnSubmitEditAgent');
      const origBtn   = btnSubmit ? btnSubmit.innerHTML : '';

      if (!id || !fullName) {
        showToast('Please fill in required fields', 'error');
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<div class="spinner"></div><span>Saving Updates…</span>`;
      }

      try {
        const payload = {
          id:         id,
          full_name:  fullName,
          password:   password,
          sip_secret: sipSecret
        };

        const res  = await apiPost('agent_update', payload);
        const data = await res.json();

        if (data.success) {
          showToast(`Agent '${data.agent?.agent_code || code}' updated successfully!`, 'success');
          closeEditAgentModal();
          // Real-time table refresh
          loadAgentsModule();
        } else {
          showToast(data.message || 'Update failed', 'error');
        }
      } catch (err) {
        showToast('Server error updating agent', 'error');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = origBtn;
        }
      }
    });
  }

  // ─── DID MASKING FORM ──────────────────────────────────────────────────────
  const moduleMapForm = document.getElementById('moduleMapForm');
  if (moduleMapForm) {
    moduleMapForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const getVal = (id, def = '') => {
        const el = document.getElementById(id);
        return el && el.value ? el.value.trim() : def;
      };
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const payload = {
        booking_id:       getVal('mMapBookingId',      'BK202600123'),
        customer_id:      getVal('mMapCustomerId',     'CUST10001'),
        customer_number:  getVal('mMapCustomerNumber', '9227231501'),
        maid_id:          getVal('mMapMaidId',         'MAID501'),
        maid_number:      getVal('mMapMaidNumber',     '9227233035'),
        mask_did:         getVal('mMapMaskDid',        '912612385555'),
        valid_from:       getVal('mMapValidFrom',      nowStr),
        valid_until:      getVal('mMapValidUntil',     '2026-12-31 23:59:59'),
      };

      const btnSubmit  = document.getElementById('btnSubmitMapping');
      const cardStatus = document.getElementById('mappingStatusCard');
      const badgeStat  = document.getElementById('mappingStatusBadge');
      const tbody      = document.getElementById('mappingStatusTableBody');
      const origBtn    = btnSubmit ? btnSubmit.innerHTML : '';

      if (cardStatus) cardStatus.style.display = 'block';
      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerHTML = `<div class="spinner"></div><span>Saving…</span>`; }

      try {
        const res  = await apiPost('mapping', payload);
        const data = await res.json();

        if (data.success) {
          showToast(`DID Masking Active for '${payload.booking_id}'!`, 'success');
          if (badgeStat) badgeStat.innerHTML = `<span class="badge badge-emerald"><i class="fa-solid fa-circle-check"></i> MASKING ACTIVE</span>`;
          if (tbody) tbody.innerHTML = `
            <tr><td><strong>Booking ID</strong></td><td>${escH(payload.booking_id)}</td><td><span class="badge badge-cyan">Primary Key</span></td></tr>
            <tr><td><strong>Customer Number</strong></td><td style="color:#6ee7b7;">${escH(payload.customer_number)}</td><td><span class="badge badge-purple">Customer Leg</span></td></tr>
            <tr><td><strong>Maid / Helper Number</strong></td><td style="color:#6ee7b7;">${escH(payload.maid_number)}</td><td><span class="badge badge-purple">Maid Leg</span></td></tr>
            <tr><td><strong>Mask BSNL DID</strong></td><td style="color:#67e8f9;">${escH(payload.mask_did)}</td><td><span class="badge badge-emerald">DID Mask Active</span></td></tr>
            <tr><td><strong>Status</strong></td><td style="color:#6ee7b7;">${escH(data.status || 'ACTIVE')}</td><td><span class="badge badge-emerald">Live Routing</span></td></tr>
            <tr><td><strong>Validity</strong></td><td>${escH(payload.valid_from)} → ${escH(payload.valid_until)}</td><td><span class="badge badge-cyan">Active Window</span></td></tr>
          `;
        } else {
          showToast(data.message || 'DID Masking failed', 'error');
          if (badgeStat) badgeStat.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-circle-xmark"></i> ${escH(data.error_code || 'FAILED')}</span>`;
          if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:16px;color:#fca5a5;">Error: ${escH(data.message || 'Failed')}</td></tr>`;
        }
      } catch (err) {
        showToast('Server error executing mapping', 'error');
      } finally {
        if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = origBtn; }
      }
    });
  }

  // ─── DID DEACTIVATE FORM ───────────────────────────────────────────────────
  const moduleDeactForm = document.getElementById('moduleDeactForm');
  if (moduleDeactForm) {
    moduleDeactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bookingId  = document.getElementById('mDeactBookingId').value.trim() || 'BK202600123';
      const status     = document.getElementById('mDeactStatus').value;

      const btnDeact   = document.getElementById('btnSubmitDeact');
      const cardStatus = document.getElementById('mappingStatusCard');
      const badgeStat  = document.getElementById('mappingStatusBadge');
      const tbody      = document.getElementById('mappingStatusTableBody');
      const origBtn    = btnDeact ? btnDeact.innerHTML : '';

      if (cardStatus) cardStatus.style.display = 'block';
      if (btnDeact)  { btnDeact.disabled = true; btnDeact.innerHTML = `<div class="spinner"></div><span>Deactivating…</span>`; }

      try {
        const res  = await apiPost('mapping_deactivate', { booking_id: bookingId, status: status });
        const data = await res.json();

        if (data.success) {
          showToast(`DID Masking deactivated for '${bookingId}'`, 'success');
          if (badgeStat) badgeStat.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-ban"></i> DEACTIVATED</span>`;
          if (tbody) tbody.innerHTML = `
            <tr><td><strong>Booking ID</strong></td><td>${escH(bookingId)}</td><td><span class="badge badge-rose">Deactivated</span></td></tr>
            <tr><td><strong>Status</strong></td><td style="color:#fca5a5;">${escH(data.status || status)}</td><td><span class="badge badge-rose">Stopped</span></td></tr>
          `;
        } else {
          showToast(data.message || 'Deactivation failed', 'error');
          if (badgeStat) badgeStat.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-circle-xmark"></i> FAILED</span>`;
        }
      } catch (err) {
        showToast('Server error deactivating mapping', 'error');
      } finally {
        if (btnDeact)  { btnDeact.disabled = false; btnDeact.innerHTML = origBtn; }
      }
    });
  }

  // ─── REPORTS FILTER FORM ──────────────────────────────────────────────────
  const reportsFilterForm = document.getElementById('moduleReportsFilterForm');
  if (reportsFilterForm) {
    reportsFilterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadReportsModule(1);
    });
  }

  // ─── RECORDINGS FILTER FORM ────────────────────────────────────────────────
  const recFilterForm = document.getElementById('moduleRecFilterForm');
  if (recFilterForm) {
    recFilterForm.addEventListener('submit', (e) => { e.preventDefault(); loadRecordingsModule(); });
  }

  const mRecSearch = document.getElementById('mRecSearch');
  if (mRecSearch) {
    mRecSearch.addEventListener('input', filterRecordingsLocally);
  }

  // ─── INITIAL DASHBOARD LOAD ────────────────────────────────────────────────
  refreshDashboardOverview();
  startAgentLivePoll();
});

// ─── SHARED FETCH HELPERS ──────────────────────────────────────────────────────
async function apiGet(action, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `/api/telephony/${action}${qs ? '?' + qs : ''}`;
  return fetch(url, { credentials: 'same-origin' });
}

async function apiPost(action, body = {}) {
  return fetch(`/api/telephony/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
    credentials: 'same-origin',
    body: JSON.stringify(body)
  });
}

// ─── MODULE SWITCHER ──────────────────────────────────────────────────────────
function switchModule(moduleId) {
  document.querySelectorAll('.menu-item').forEach(item =>
    item.classList.toggle('active', item.getAttribute('data-module') === moduleId)
  );
  document.querySelectorAll('.module-section').forEach(sec =>
    sec.classList.toggle('active', sec.id === moduleId)
  );

  const titles = {
    'module-dashboard':  { t: 'Dashboard Overview',                  s: 'Live Telephony status and recent call activity' },
    'module-call':       { t: 'Click-to-Call Services',              s: 'Initiate outbound masked calls to Customers or Maids' },
    'module-agents':     { t: 'Agents & Extension Directory',        s: 'Manage support agent SIP extensions and active status' },
    'module-mapping':    { t: 'DID Number Masking',                  s: 'Configure BSNL DID number masking for active bookings' },
    'module-recordings': { t: 'Call Recordings & Instant Search',    s: 'Search call history and listen to recorded audio' },
    'module-reports':    { t: 'API Reports & Audit Logs',            s: 'Telephony HTTP telemetry, Asterisk PBX logs, and payload inspection' },
  };

  if (titles[moduleId]) {
    const el = document.getElementById('moduleTitle');
    const sl = document.getElementById('moduleSubtitle');
    if (el) el.textContent  = titles[moduleId].t;
    if (sl) sl.textContent  = titles[moduleId].s;
  }

  if (moduleId === 'module-dashboard')        refreshDashboardOverview();
  else if (moduleId === 'module-agents')     loadAgentsModule();
  else if (moduleId === 'module-recordings') loadRecordingsModule();
  else if (moduleId === 'module-reports')    loadReportsModule(1);
}

// ─── DASHBOARD OVERVIEW ───────────────────────────────────────────────────────
async function refreshDashboardOverview() {
  loadRecentActivity();
  loadAgentsStats();
}

async function loadAgentsStats() {
  try {
    const res  = await apiGet('agent_list');
    const data = await res.json();
    const el   = document.getElementById('statActiveAgents');
    if (data.success && el) el.textContent = data.count || (data.agents ? data.agents.length : '--');
  } catch (e) {}
}

async function loadRecentActivity() {
  const tbody = document.getElementById('overviewTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);"><div class="spinner" style="margin:0 auto 10px;"></div> Loading Call Activity...</td></tr>`;

  try {
    // Load without date filter to get all recent calls
    const res  = await apiGet('recordings', { limit: 15 });
    const data = await res.json();

    if (data.success && Array.isArray(data.rows)) {
      const totalEl = document.getElementById('statTodayCalls');
      if (totalEl) totalEl.textContent = data.total || data.rows.length;

      if (data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted);">No call activity recorded yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      data.rows.slice(0, 8).forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escH(r.booking_id || 'N/A')}</strong></td>
          <td><span class="badge badge-purple">${escH(r.call_type || 'Call')}</span></td>
          <td style="color:#a5b4fc;">${escH(r.caller_number || '—')}</td>
          <td style="color:#a5b4fc;">${escH(r.destination_number || '—')}</td>
          <td style="font-size:12px;">${escH(r.start_time || '')}</td>
          <td>${dispositionBadge(r.disposition)}</td>
          <td>${audioPlayer(r)}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#fca5a5;">Failed to load: ${escH(data.message || 'Error')}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#fca5a5;">Server connection error.</td></tr>`;
  }
}

// ─── CLICK-TO-CALL ────────────────────────────────────────────────────────────
let callHistoryLog    = [];       // Per-session call history entries
let callStatusPoller  = null;     // Active setInterval handle
let lastPollRequestId = '';       // Track which request_id is being polled
let pollCount         = 0;        // Current poll attempt counter
const MAX_POLL        = 10;       // Max auto-poll attempts

/** Generate a fresh REQ + timestamp request ID */
function regenRequestId() {
  const el = document.getElementById('callRequestId');
  if (el) el.value = 'REQ' + Date.now();
}

/** Initiate a Click-to-Call and begin live status polling */
async function triggerCallTarget(target) {
  const bookingId = (document.getElementById('callBookingId')?.value || '').trim();
  const extension = (document.getElementById('callExtension')?.value || '').trim();
  const requestId = (document.getElementById('callRequestId')?.value || '').trim();

  if (!bookingId) { showToast('Please enter a Booking ID', 'error'); return; }
  if (!requestId)  { showToast('Please enter a Request ID', 'error'); return; }

  const resultCard = document.getElementById('callResultCard');
  const badge      = document.getElementById('callStatusBadge');
  const dataGrid   = document.getElementById('callDataGrid');
  const progressW  = document.getElementById('pollingProgressWrap');
  const pulse      = document.getElementById('callLivePulse');
  const btnCust    = document.getElementById('btnCallCustomer');
  const btnMaid    = document.getElementById('btnCallMaid');
  const btn        = target === 'customer' ? btnCust : btnMaid;
  const origBtn    = btn ? btn.innerHTML : '';

  // Stop any existing poller
  stopCallPoller();

  // Show result card
  if (resultCard) resultCard.style.display = 'block';
  if (progressW)  progressW.style.display  = 'none';
  if (pulse)      pulse.className = 'call-pulse-ring pulse-dialing';
  if (badge)      badge.innerHTML = `<span class="badge badge-cyan"><i class="fa-solid fa-spinner fa-spin"></i> DIALING…</span>`;
  if (dataGrid)   dataGrid.innerHTML = '';
  if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner"></div><div style="text-align:left;"><div style="font-weight:700;">Dialing ${target === 'customer' ? 'Customer' : 'Maid'}…</div><div style="font-size:11px;opacity:0.75;">Please wait</div></div>`; }

  try {
    const action = target === 'customer' ? 'customer' : 'call_maid';
    const res  = await apiPost(action, {
      booking_id:       bookingId,
      source_extension: extension,
      request_id:       requestId
    });
    const data = await res.json();

    if (data.success) {
      showToast(`✅ Call initiated to ${target.toUpperCase()}!`, 'success');

      // Render live data grid
      renderCallDataGrid(data, bookingId, target, requestId);

      // Set badge to ORIGINATING
      if (badge) badge.innerHTML = `<span class="badge badge-emerald call-status-live"><i class="fa-solid fa-phone"></i> ${escH(data.status || 'ORIGINATING')}</span>`;
      if (pulse) pulse.className = 'call-pulse-ring pulse-active';

      // Save to call history log
      const historyEntry = {
        id:              callHistoryLog.length + 1,
        booking_id:      data.booking_id    || bookingId,
        target:          target,
        dialed_number:   data.dialed_number  || '—',
        customer_number: data.customer_number || '—',
        maid_number:     data.maid_number     || '—',
        request_id:      data.request_id      || requestId,
        time:            new Date().toLocaleTimeString(),
        status:          data.status          || 'ORIGINATING',
        call_uuid:       data.call_uuid        || '',
      };
      callHistoryLog.unshift(historyEntry);
      renderCallHistory();

      // Auto-generate new request ID for next call
      regenRequestId();

      // Start live status poller
      lastPollRequestId = historyEntry.request_id;
      startCallStatusPoller(historyEntry.request_id, historyEntry.id);

    } else {
      showToast(data.message || 'Call failed', 'error');
      if (badge) badge.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-circle-xmark"></i> FAILED</span>`;
      if (pulse) pulse.className = 'call-pulse-ring pulse-failed';
      
      // Render data grid with failure details
      renderCallDataGrid(data, bookingId, target, requestId, data.message || 'Failed');

      // Also log failed attempt to Call History
      const historyEntry = {
        id:              callHistoryLog.length + 1,
        booking_id:      data.booking_id    || bookingId,
        target:          target,
        dialed_number:   data.dialed_number  || '—',
        customer_number: data.customer_number || '—',
        maid_number:     data.maid_number     || '—',
        request_id:      data.request_id      || requestId,
        time:            new Date().toLocaleTimeString(),
        status:          'FAILED',
        call_uuid:       data.call_uuid        || '',
        message:         data.message          || ''
      };
      callHistoryLog.unshift(historyEntry);
      renderCallHistory();
      regenRequestId();
    }
  } catch (err) {
    showToast('Network error — could not initiate call', 'error');
    if (badge) badge.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-wifi"></i> NETWORK ERROR</span>`;
    if (pulse) pulse.className = 'call-pulse-ring pulse-failed';

    const historyEntry = {
      id:              callHistoryLog.length + 1,
      booking_id:      bookingId,
      target:          target,
      dialed_number:   '—',
      customer_number: '—',
      maid_number:     '—',
      request_id:      requestId,
      time:            new Date().toLocaleTimeString(),
      status:          'FAILED',
      call_uuid:       '',
      message:         'Network connection failed'
    };
    callHistoryLog.unshift(historyEntry);
    renderCallHistory();
    regenRequestId();
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origBtn; }
  }
}

/** Render the live call data grid */
function renderCallDataGrid(data, bookingId, target, requestId, errorMsg = '') {
  const grid = document.getElementById('callDataGrid');
  if (!grid) return;

  const fields = [
    { icon: 'fa-hashtag',              color: '#a855f7', label: 'Booking ID',       value: data.booking_id      || bookingId },
    { icon: 'fa-bullseye',             color: '#6366f1', label: 'Call Target',       value: target.toUpperCase() },
    { icon: 'fa-phone-arrow-up-right', color: '#10b981', label: 'Dialed Number',  value: data.dialed_number   || '—' },
    { icon: 'fa-user',                 color: '#06b6d4', label: 'Customer Number',   value: data.customer_number  || '—' },
    { icon: 'fa-user-nurse',           color: '#f59e0b', label: 'Maid Number',       value: data.maid_number      || '—' },
    { icon: 'fa-fingerprint',          color: '#64748b', label: 'Request ID',        value: data.request_id       || requestId },
    { icon: 'fa-signal',               color: errorMsg ? '#f43f5e' : '#10b981', label: 'Call Status', value: data.status || (errorMsg ? 'FAILED' : 'ORIGINATING') },
    { icon: 'fa-key',                  color: '#94a3b8', label: 'Call UUID',         value: data.call_uuid        || '—' },
  ];

  let html = fields.map(f => `
    <div class="call-data-item">
      <div class="call-data-icon" style="background:${f.color}22; color:${f.color};">
        <i class="fa-solid ${f.icon}"></i>
      </div>
      <div>
        <div class="call-data-label">${f.label}</div>
        <div class="call-data-value">${escH(String(f.value))}</div>
      </div>
    </div>
  `).join('');

  if (errorMsg) {
    html += `
      <div class="call-data-item call-data-error">
        <div class="call-data-icon" style="background:rgba(244,63,94,0.2); color:#f43f5e;">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <div>
          <div class="call-data-label" style="color:#fb7185;">Telephony Server Notice</div>
          <div style="font-size:12px; color:var(--text-bright); margin-top:2px;">${escH(errorMsg)}</div>
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;
}

/** Start auto-polling call status */
function startCallStatusPoller(requestId, historyEntryId) {
  const progressW  = document.getElementById('pollingProgressWrap');
  const progressB  = document.getElementById('pollingProgressBar');
  const countLabel = document.getElementById('pollCountLabel');
  const badge      = document.getElementById('callStatusBadge');
  const pulse      = document.getElementById('callLivePulse');

  pollCount = 0;
  if (progressW)  progressW.style.display = 'block';

  callStatusPoller = setInterval(async () => {
    pollCount++;
    const pct = (pollCount / MAX_POLL) * 100;
    if (progressB)  progressB.style.width   = pct + '%';
    if (countLabel) countLabel.textContent   = `${pollCount}/${MAX_POLL}`;

    try {
      const res  = await apiGet('call_status', { request_id: requestId });
      const data = await res.json();

      if (data.success) {
        const status = (data.status || 'ORIGINATING').toUpperCase();

        // Update live status badge
        const statusColor = { ANSWERED: 'badge-emerald', ORIGINATING: 'badge-cyan', 'NO ANSWER': 'badge-rose', FAILED: 'badge-rose', BUSY: 'badge-purple' };
        const color = statusColor[status] || 'badge-cyan';
        const icon  = status === 'ANSWERED' ? 'fa-check' : status === 'ORIGINATING' ? 'fa-spinner fa-spin' : 'fa-xmark';
        if (badge) badge.innerHTML = `<span class="badge ${color} call-status-live"><i class="fa-solid ${icon}"></i> ${status}</span>`;

        // Update history log entry
        updateHistoryRowStatus(historyEntryId, status);

        // Update pulse ring
        if (pulse) {
          pulse.className = status === 'ANSWERED' ? 'call-pulse-ring pulse-answered'
            : (status === 'FAILED' || status === 'NO ANSWER' || status === 'BUSY') ? 'call-pulse-ring pulse-failed'
            : 'call-pulse-ring pulse-active';
        }

        // Stop polling on terminal status
        const terminal = ['ANSWERED', 'FAILED', 'NO ANSWER', 'BUSY'];
        if (terminal.includes(status) || pollCount >= MAX_POLL) {
          stopCallPoller();
          if (progressW) progressW.style.display = 'none';
          if (status === 'ANSWERED') showToast('📞 Call ANSWERED!', 'success');
          else if (pollCount >= MAX_POLL) showToast('Polling complete — check status manually', 'info');
        }
      }
    } catch (e) {
      // Silent fail — keep polling
    }
  }, 3000);
}

/** Stop the active status poller */
function stopCallPoller() {
  if (callStatusPoller) {
    clearInterval(callStatusPoller);
    callStatusPoller = null;
  }
}

/** Manual poll triggered by button */
async function manualPollStatus() {
  if (!lastPollRequestId) { showToast('No active call to poll', 'error'); return; }
  const btn = document.getElementById('btnPollStatus');
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Polling…</span>`; }

  try {
    const res  = await apiGet('call_status', { request_id: lastPollRequestId });
    const data = await res.json();
    if (data.success) {
      const status = (data.status || '').toUpperCase();
      const badge  = document.getElementById('callStatusBadge');
      const statusColor = { ANSWERED: 'badge-emerald', ORIGINATING: 'badge-cyan', 'NO ANSWER': 'badge-rose', FAILED: 'badge-rose', BUSY: 'badge-purple' };
      const color = statusColor[status] || 'badge-cyan';
      if (badge) badge.innerHTML = `<span class="badge ${color}"><i class="fa-solid fa-check"></i> ${status}</span>`;
      showToast(`Call Status: ${status}`, status === 'ANSWERED' ? 'success' : 'info');
    } else {
      showToast(data.message || 'Status check failed', 'error');
    }
  } catch (e) {
    showToast('Network error polling status', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-rotate"></i><span>Poll Status</span>`; }
  }
}

/** Poll status for a specific history entry */
async function pollHistoryEntryStatus(requestId, entryId) {
  const btn = document.getElementById(`poll-btn-${entryId}`);
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`; }

  try {
    const res  = await apiGet('call_status', { request_id: requestId });
    const data = await res.json();
    if (data.success) {
      const status = (data.status || '').toUpperCase();
      updateHistoryRowStatus(entryId, status);
      showToast(`Call ${requestId}: ${status}`, 'info');
    } else {
      showToast(data.message || 'Status check failed', 'error');
    }
  } catch (e) {
    showToast('Network error', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-satellite-dish"></i>`; }
  }
}

/** Update a history row's status badge in the table */
function updateHistoryRowStatus(entryId, status) {
  // Update in array
  const entry = callHistoryLog.find(e => e.id === entryId);
  if (entry) entry.status = status;

  // Update specific cell in table
  const statusCell = document.getElementById(`hist-status-${entryId}`);
  if (statusCell) {
    statusCell.innerHTML = callHistoryStatusBadge(status);
  }

  // Update row class
  const row = document.getElementById(`hist-row-${entryId}`);
  if (row) {
    row.className = status === 'ANSWERED' ? 'history-row-answered'
      : (status === 'FAILED' || status === 'NO ANSWER' || status === 'BUSY') ? 'history-row-failed'
      : '';
  }
}

/** Render full call history table */
function renderCallHistory() {
  const tbody = document.getElementById('callHistoryTableBody');
  const count = document.getElementById('callHistoryCount');
  if (!tbody) return;

  if (count) count.textContent = `${callHistoryLog.length} call${callHistoryLog.length !== 1 ? 's' : ''}`;

  if (callHistoryLog.length === 0) {
    tbody.innerHTML = `<tr id="callHistoryEmptyRow"><td colspan="10" style="text-align:center;padding:28px;color:var(--text-muted);"><i class="fa-solid fa-phone-slash" style="font-size:24px;opacity:0.3;display:block;margin-bottom:8px;"></i>No calls initiated yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = callHistoryLog.map(e => `
    <tr id="hist-row-${e.id}" class="${e.status === 'ANSWERED' ? 'history-row-answered' : (e.status === 'FAILED' || e.status === 'NO ANSWER' || e.status === 'BUSY') ? 'history-row-failed' : ''}">
      <td style="color:var(--text-dim);font-size:12px;">${e.id}</td>
      <td><strong style="color:#a5b4fc;">${escH(e.booking_id)}</strong></td>
      <td><span class="badge ${e.target === 'customer' ? 'badge-purple' : 'badge-cyan'}">${e.target.toUpperCase()}</span></td>
      <td style="color:#6ee7b7;font-family:monospace;">${escH(e.dialed_number)}</td>
      <td style="font-size:12px;color:#a5b4fc;">${escH(e.customer_number)}</td>
      <td style="font-size:12px;color:#a5b4fc;">${escH(e.maid_number)}</td>
      <td style="font-size:11px;color:var(--text-dim);font-family:monospace;">${escH(e.request_id)}</td>
      <td style="font-size:12px;">${escH(e.time)}</td>
      <td id="hist-status-${e.id}">${callHistoryStatusBadge(e.status)}</td>
      <td>
        <button type="button" id="poll-btn-${e.id}" class="btn btn-secondary btn-sm" onclick="pollHistoryEntryStatus('${escH(e.request_id)}', ${e.id})" title="Poll status for this call">
          <i class="fa-solid fa-satellite-dish"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/** Filter call history by search query */
function filterCallHistory() {
  const query = (document.getElementById('callHistorySearch')?.value || '').toLowerCase().trim();
  if (!query) { renderCallHistory(); return; }

  const filtered = callHistoryLog.filter(e =>
    [e.booking_id, e.target, e.dialed_number, e.customer_number, e.maid_number, e.request_id, e.status]
      .some(v => (v || '').toLowerCase().includes(query))
  );

  const tbody = document.getElementById('callHistoryTableBody');
  const count = document.getElementById('callHistoryCount');
  if (!tbody) return;
  if (count) count.textContent = `${filtered.length} of ${callHistoryLog.length} calls`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted);">No matches for "<em>${escH(query)}</em>"</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => `
    <tr id="hist-row-${e.id}" class="${e.status === 'ANSWERED' ? 'history-row-answered' : (e.status === 'FAILED' || e.status === 'NO ANSWER' || e.status === 'BUSY') ? 'history-row-failed' : ''}">
      <td style="color:var(--text-dim);font-size:12px;">${e.id}</td>
      <td><strong style="color:#a5b4fc;">${escH(e.booking_id)}</strong></td>
      <td><span class="badge ${e.target === 'customer' ? 'badge-purple' : 'badge-cyan'}">${e.target.toUpperCase()}</span></td>
      <td style="color:#6ee7b7;font-family:monospace;">${escH(e.dialed_number)}</td>
      <td style="font-size:12px;color:#a5b4fc;">${escH(e.customer_number)}</td>
      <td style="font-size:12px;color:#a5b4fc;">${escH(e.maid_number)}</td>
      <td style="font-size:11px;color:var(--text-dim);font-family:monospace;">${escH(e.request_id)}</td>
      <td style="font-size:12px;">${escH(e.time)}</td>
      <td id="hist-status-${e.id}">${callHistoryStatusBadge(e.status)}</td>
      <td>
        <button type="button" id="poll-btn-${e.id}" class="btn btn-secondary btn-sm" onclick="pollHistoryEntryStatus('${escH(e.request_id)}', ${e.id})" title="Poll status">
          <i class="fa-solid fa-satellite-dish"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/** Clear all call history */
function clearCallHistory() {
  if (callHistoryLog.length === 0) { showToast('No history to clear', 'info'); return; }
  stopCallPoller();
  callHistoryLog = [];
  lastPollRequestId = '';
  renderCallHistory();
  showToast('Call history cleared', 'info');
}

/** Status badge for history rows */
function callHistoryStatusBadge(status) {
  if (!status) return `<span class="badge badge-cyan">—</span>`;
  const s = status.toUpperCase();
  if (s === 'ANSWERED')  return `<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> ANSWERED</span>`;
  if (s === 'ORIGINATING') return `<span class="badge badge-cyan"><i class="fa-solid fa-spinner fa-spin"></i> ORIGINATING</span>`;
  if (s === 'NO ANSWER') return `<span class="badge badge-rose"><i class="fa-solid fa-phone-slash"></i> NO ANSWER</span>`;
  if (s === 'FAILED')    return `<span class="badge badge-rose"><i class="fa-solid fa-xmark"></i> FAILED</span>`;
  if (s === 'BUSY')      return `<span class="badge badge-purple"><i class="fa-solid fa-phone-volume"></i> BUSY</span>`;
  return `<span class="badge badge-cyan">${escH(status)}</span>`;
}

// ─── AGENTS MODULE ────────────────────────────────────────────────────────────
let loadedAgentsList = [];

async function loadAgentsModule() {
  const tbody = document.getElementById('agentsModuleTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);"><div class="spinner" style="margin:0 auto 10px;"></div> Loading Directory...</td></tr>`;

  try {
    const res  = await apiGet('agent_list');
    const data = await res.json();

    if (data.success && Array.isArray(data.agents)) {
      loadedAgentsList = data.agents;
      tbody.innerHTML = '';
      if (data.agents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;">No agents found.</td></tr>`;
        return;
      }

      data.agents.forEach(ag => {
        const tr = document.createElement('tr');
        let statusBadge = `<span class="badge badge-rose">offline</span>`;
        if (ag.status === 'available') statusBadge = `<span class="badge badge-emerald">available</span>`;
        else if (ag.status === 'break') statusBadge = `<span class="badge badge-cyan">on break</span>`;

        tr.innerHTML = `
          <td style="color:#a5b4fc;"><strong>${escH(ag.agent_code)}</strong></td>
          <td>${escH(ag.full_name)}</td>
          <td><span class="badge badge-purple">${escH(ag.sip_peer || ag.agent_code)}</span></td>
          <td>${statusBadge}</td>
          <td>${ag.is_active ? '<span class="badge badge-emerald">Active</span>' : '<span class="badge badge-rose">Inactive</span>'}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openEditAgentModal(${ag.id})" title="Update Agent Profile">
                <i class="fa-solid fa-user-pen"></i>
                <span>Edit</span>
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="deleteAgentModule(${ag.id},'${escH(ag.agent_code)}')" title="Delete Extension">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#fca5a5;">Failed to load agents: ${escH(data.message || 'Error')}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#fca5a5;">Server error loading agents.</td></tr>`;
  }
}

function openEditAgentModal(agentId) {
  const ag = loadedAgentsList.find(a => a.id === agentId);
  if (!ag) {
    showToast('Agent not found', 'error');
    return;
  }

  const modal   = document.getElementById('editAgentModal');
  const idEl    = document.getElementById('editAgentId');
  const codeEl  = document.getElementById('editAgentCode');
  const nameEl  = document.getElementById('editFullName');
  const passEl  = document.getElementById('editPassword');
  const secEl   = document.getElementById('editSipSecret');

  if (idEl)   idEl.value   = ag.id;
  if (codeEl) codeEl.value = ag.agent_code || ag.sip_peer || '';
  if (nameEl) nameEl.value = ag.full_name || '';
  if (passEl) passEl.value = '';
  if (secEl)  secEl.value  = ag.sip_secret || '';

  if (modal) modal.style.display = 'block';
}

function closeEditAgentModal() {
  const modal = document.getElementById('editAgentModal');
  if (modal) modal.style.display = 'none';
}

async function deleteAgentModule(agentId, agentCode) {
  if (!confirm(`Delete agent extension '${agentCode}'?`)) return;
  try {
    const res  = await apiPost('agent_delete', { id: agentId });
    const data = await res.json();
    if (data.success) { showToast(`Agent '${agentCode}' deleted`, 'success'); loadAgentsModule(); }
    else               showToast(data.message || 'Delete failed', 'error');
  } catch (e) { showToast('Delete error', 'error'); }
}

// ─── CALL RECORDINGS MODULE ───────────────────────────────────────────────────
async function loadRecordingsModule() {
  const tbody      = document.getElementById('moduleRecordingsTableBody');
  const countBadge = document.getElementById('recordingsCountBadge');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);"><div class="spinner" style="margin:0 auto 10px;"></div> Fetching Call Recordings...</td></tr>`;

  const fromDateEl = document.getElementById('mRecFromDate');
  const toDateEl   = document.getElementById('mRecToDate');
  const fromDate   = fromDateEl ? fromDateEl.value : '';
  const toDate     = toDateEl   ? toDateEl.value   : '';

  // Build params — only add date keys if they actually have values
  const params = { limit: 100 };
  if (fromDate) params.from = fromDate;
  if (toDate)   params.to   = toDate;

  try {
    const res  = await apiGet('recordings', params);

    if (!res.ok) {
      const errText = await res.text();
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#fca5a5;">HTTP ${res.status}: ${escH(errText.substring(0, 200))}</td></tr>`;
      return;
    }

    const data = await res.json();

    if (data.success && Array.isArray(data.rows)) {
      loadedRecordingsList = data.rows;
      if (countBadge) countBadge.textContent = `Total ${data.total || data.rows.length} Recordings`;
      filterRecordingsLocally();
    } else {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#fca5a5;">Failed to load recordings: ${escH(data.message || 'API returned error')}</td></tr>`;
    }
  } catch (err) {
    console.error('Recordings error:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#fca5a5;">Network error: ${escH(err.message)}</td></tr>`;
  }
}

function filterRecordingsLocally() {
  const searchEl   = document.getElementById('mRecSearch');
  const countBadge = document.getElementById('recordingsCountBadge');
  const query      = searchEl ? searchEl.value.trim().toLowerCase() : '';

  if (!query) {
    renderRecordingsRows(loadedRecordingsList);
    if (countBadge) countBadge.textContent = `All ${loadedRecordingsList.length} Recordings`;
    return;
  }

  const filtered = loadedRecordingsList.filter(r => {
    return [r.booking_id, r.caller_number, r.destination_number, r.call_type, r.disposition, r.start_time]
      .some(v => (v || '').toLowerCase().includes(query));
  });

  renderRecordingsRows(filtered);
  if (countBadge) countBadge.textContent = `Filtered: ${filtered.length} of ${loadedRecordingsList.length} Recordings`;
}

function renderRecordingsRows(rows) {
  const tbody = document.getElementById('moduleRecordingsTableBody');
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">No matching call recordings found.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escH(r.booking_id || 'N/A')}</strong></td>
      <td><span class="badge badge-purple">${escH(r.call_type || 'Call')}</span></td>
      <td style="color:#a5b4fc;">${escH(r.caller_number || '—')}</td>
      <td style="color:#a5b4fc;">${escH(r.destination_number || '—')}</td>
      <td style="font-size:12px;">${escH(r.start_time || '')}</td>
      <td>${r.duration ? r.duration + 's' : '0s'}</td>
      <td>${dispositionBadge(r.disposition)}</td>
      <td>${audioPlayer(r)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function resetRecordingsFilter() {
  const s = document.getElementById('mRecSearch');
  const f = document.getElementById('mRecFromDate');
  const t = document.getElementById('mRecToDate');
  if (s) s.value = '';
  if (f) f.value = '';
  if (t) t.value = '';
  loadRecordingsModule();
  showToast('Filter reset — loading all recordings', 'info');
}

// ─── API REPORTS & TELEPHONY LOGS MODULE ─────────────────────────────────────
let loadedReportsList  = [];
let currentReportsPage = 1;
let reportsPageLimit   = 50;

/** Load Telephony API Logs with Filters and Pagination */
async function loadReportsModule(page = 1) {
  currentReportsPage = page;
  const tbody      = document.getElementById('moduleReportsTableBody');
  const countBadge = document.getElementById('reportsCountBadge');
  const pageLabel  = document.getElementById('statReportsPage');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:28px;color:var(--text-muted);"><div class="spinner" style="margin:0 auto 10px;"></div> Fetching Telephony API Logs...</td></tr>`;

  const fromDate = (document.getElementById('mRepFromDate')?.value || '').trim();
  const toDate   = (document.getElementById('mRepToDate')?.value || '').trim();
  const endpoint = (document.getElementById('mRepEndpoint')?.value || '').trim();
  const http     = (document.getElementById('mRepHttpStatus')?.value || '').trim();
  const query    = (document.getElementById('mRepSearch')?.value || '').trim();
  const limit    = parseInt(document.getElementById('mRepLimit')?.value || '50', 10);
  reportsPageLimit = limit;

  const params = {
    page:  page,
    limit: limit
  };
  if (fromDate) params.from     = fromDate;
  if (toDate)   params.to       = toDate;
  if (endpoint) params.endpoint = endpoint;
  if (http)     params.http     = http;
  if (query)    params.q        = query;

  try {
    const res  = await apiGet('logs', params);
    const data = await res.json();

    if (data.success && Array.isArray(data.rows)) {
      loadedReportsList = data.rows;

      // Update Stats
      const totalEl = document.getElementById('statReportsTotal');
      const okEl    = document.getElementById('statReportsOk');
      const errEl   = document.getElementById('statReportsErrors');

      if (totalEl) totalEl.textContent = data.total ?? data.rows.length;
      if (okEl)    okEl.textContent    = data.ok_count ?? '--';
      if (errEl)   errEl.textContent   = data.error_count ?? '--';
      if (pageLabel) {
        const totalPages = Math.ceil((data.total || data.rows.length) / limit) || 1;
        pageLabel.textContent = `Page ${page} of ${totalPages}`;
      }

      if (countBadge) countBadge.textContent = `${data.total ?? data.rows.length} Total Logs`;

      renderReportsTable(data.rows);
      renderReportsPagination(page, data.total || data.rows.length, limit);
    } else {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:#fca5a5;">Failed to load logs: ${escH(data.message || 'API error')}</td></tr>`;
    }
  } catch (err) {
    console.error('Reports logs fetch error:', err);
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:#fca5a5;">Network connection error.</td></tr>`;
  }
}

/** Render rows into the Reports Table */
function renderReportsTable(rows) {
  const tbody = document.getElementById('moduleReportsTableBody');
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:28px;color:var(--text-muted);"><i class="fa-solid fa-file-circle-xmark" style="font-size:24px;opacity:0.3;display:block;margin-bottom:8px;"></i>No API logs matching the selected filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.className = r.ok ? 'history-row-answered' : 'history-row-failed';

    const methodBadgeHtml = methodBadge(r.method);
    const httpBadgeHtml   = httpStatusBadge(r.http_status);
    
    // Extract required fields
    const bookingId = r.booking_id || r.request?.booking_id || '—';
    const agentExt  = r.request?.source_extension || r.request?.agent_code || (r.response?.agent?.agent_code) || '—';
    const reqId     = r.request_id || r.request?.request_id || '—';
    
    let targetOp = '—';
    if (r.request?.target) {
      targetOp = `<span class="badge ${r.request.target === 'customer' ? 'badge-purple' : 'badge-cyan'}">${escH(r.request.target.toUpperCase())}</span>`;
    } else if (r.request?.status) {
      targetOp = `<span class="badge badge-cyan">${escH(r.request.status.toUpperCase())}</span>`;
    } else if (r.request?.customer_number) {
      targetOp = `<span class="badge badge-purple">DID MASK</span>`;
    } else if (r.endpoint === '/agent/login') {
      targetOp = `<span class="badge badge-cyan">LOGIN</span>`;
    }

    const summaryText = r.summary || (r.response && (r.response.message || r.response.status)) || '—';
    const statusResultHtml = r.ok
      ? `<span class="badge badge-emerald" style="margin-right:6px;"><i class="fa-solid fa-check"></i> OK</span><span style="font-size:12px;color:var(--text-bright);">${escH(summaryText)}</span>`
      : `<span class="badge badge-rose" style="margin-right:6px;"><i class="fa-solid fa-triangle-exclamation"></i> ${escH(r.response?.error_code || 'FAILED')}</span><span style="font-size:11px;color:var(--text-muted);" title="${escH(summaryText)}">${escH(summaryText)}</span>`;

    tr.innerHTML = `
      <td style="color:var(--text-dim);font-size:12px;font-family:monospace;">${r.id}</td>
      <td style="font-size:12px;white-space:nowrap;">${escH(r.created_at || '—')}</td>
      <td>${methodBadgeHtml}</td>
      <td style="font-family:monospace;font-size:12px;color:var(--primary);font-weight:600;">${escH(r.endpoint || '—')}</td>
      <td>${httpBadgeHtml}</td>
      <td style="color:#a5b4fc;font-weight:600;">${escH(bookingId)}</td>
      <td><span class="badge badge-purple">${escH(agentExt)}</span></td>
      <td>${targetOp}</td>
      <td style="font-size:11px;font-family:monospace;color:var(--text-dim);">${escH(reqId)}</td>
      <td style="font-size:11px;white-space:nowrap;">
        <div style="font-family:monospace;color:var(--text-muted);">${escH(r.source_ip || '—')}</div>
        <div style="color:var(--text-dim);font-size:10px;">${r.processing_ms !== undefined ? r.processing_ms + 'ms latency' : ''}</div>
      </td>
      <td style="font-size:12px;max-width:260px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;">
        ${statusResultHtml}
      </td>
      <td style="text-align:center;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="viewLogDetails(${r.id})" title="Inspect JSON Request & Response">
          <i class="fa-solid fa-code"></i>
          <span>Details</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/** Render Pagination Controls Bar */
function renderReportsPagination(currentPage, totalItems, limit) {
  const container = document.getElementById('reportsPaginationButtons');
  const infoEl    = document.getElementById('reportsPaginationInfo');
  if (!container) return;

  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startItem  = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem    = Math.min(currentPage * limit, totalItems);

  if (infoEl) {
    infoEl.innerHTML = `Showing <strong>${startItem}</strong> to <strong>${endItem}</strong> of <strong>${totalItems}</strong> logs`;
  }

  container.innerHTML = '';

  // Prev Button
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = `<i class="fa-solid fa-chevron-left"></i>`;
  prevBtn.disabled = currentPage <= 1;
  prevBtn.onclick = () => loadReportsModule(currentPage - 1);
  container.appendChild(prevBtn);

  // Page Numbers
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage   = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.type = 'button';
    firstBtn.className = 'pagination-btn';
    firstBtn.textContent = '1';
    firstBtn.onclick = () => loadReportsModule(1);
    container.appendChild(firstBtn);
    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.style.cssText = 'color:var(--text-dim);padding:0 4px;';
      dots.textContent = '…';
      container.appendChild(dots);
    }
  }

  for (let p = startPage; p <= endPage; p++) {
    const pageBtn = document.createElement('button');
    pageBtn.type = 'button';
    pageBtn.className = `pagination-btn ${p === currentPage ? 'active' : ''}`;
    pageBtn.textContent = p;
    pageBtn.onclick = () => loadReportsModule(p);
    container.appendChild(pageBtn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span');
      dots.style.cssText = 'color:var(--text-dim);padding:0 4px;';
      dots.textContent = '…';
      container.appendChild(dots);
    }
    const lastBtn = document.createElement('button');
    lastBtn.type = 'button';
    lastBtn.className = 'pagination-btn';
    lastBtn.textContent = totalPages;
    lastBtn.onclick = () => loadReportsModule(totalPages);
    container.appendChild(lastBtn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = `<i class="fa-solid fa-chevron-right"></i>`;
  nextBtn.disabled = currentPage >= totalPages;
  nextBtn.onclick = () => loadReportsModule(currentPage + 1);
  container.appendChild(nextBtn);
}

/** Reset Reports filters to default */
function resetReportsFilter() {
  const fromEl = document.getElementById('mRepFromDate');
  const toEl   = document.getElementById('mRepToDate');
  const epEl   = document.getElementById('mRepEndpoint');
  const httpEl = document.getElementById('mRepHttpStatus');
  const qEl    = document.getElementById('mRepSearch');
  const limEl  = document.getElementById('mRepLimit');

  if (fromEl) fromEl.value = '2026-08-22';
  if (toEl)   toEl.value   = new Date().toISOString().substring(0, 10);
  if (epEl)   epEl.value   = '';
  if (httpEl) httpEl.value = '';
  if (qEl)    qEl.value    = '';
  if (limEl)  limEl.value  = '50';

  loadReportsModule(1);
  showToast('Reports filter reset', 'info');
}

/** View complete JSON payload for a single log */
function viewLogDetails(logId) {
  const log = loadedReportsList.find(l => l.id === logId);
  if (!log) { showToast('Log item not found', 'error'); return; }

  const modal     = document.getElementById('logDetailsModal');
  const titleEl   = document.getElementById('logModalTitle');
  const subEl     = document.getElementById('logModalSubtitle');
  const overview  = document.getElementById('logModalOverview');
  const reqJsonEl = document.getElementById('logModalReqJson');
  const resJsonEl = document.getElementById('logModalResJson');

  const bookingId = log.booking_id || log.request?.booking_id || '—';
  const agentExt  = log.request?.source_extension || log.request?.agent_code || (log.response?.agent?.agent_code) || '—';
  const reqId     = log.request_id || log.request?.request_id || '—';
  const target    = log.request?.target ? log.request.target.toUpperCase() : (log.request?.status ? log.request.status : (log.request?.customer_number ? log.request.customer_number : '—'));

  if (titleEl) titleEl.innerHTML = `Log #${log.id} — <span style="font-family:monospace;color:var(--primary);">${escH(log.endpoint)}</span>`;
  if (subEl)   subEl.textContent = `${log.created_at || ''} • Source IP: ${log.source_ip || 'N/A'} • Latency: ${log.processing_ms ?? 0}ms`;

  if (overview) {
    overview.innerHTML = `
      <div class="call-data-item">
        <div class="call-data-label">Method</div>
        <div class="call-data-value">${methodBadge(log.method)}</div>
      </div>
      <div class="call-data-item">
        <div class="call-data-label">HTTP Status</div>
        <div class="call-data-value">${httpStatusBadge(log.http_status)}</div>
      </div>
      <div class="call-data-item">
        <div class="call-data-label">Booking ID</div>
        <div class="call-data-value">${escH(bookingId)}</div>
      </div>
      <div class="call-data-item">
        <div class="call-data-label">Agent Extension</div>
        <div class="call-data-value">${escH(agentExt)}</div>
      </div>
      <div class="call-data-item">
        <div class="call-data-label">Target / Operation</div>
        <div class="call-data-value">${escH(target)}</div>
      </div>
      <div class="call-data-item">
        <div class="call-data-label">Request ID</div>
        <div class="call-data-value">${escH(reqId)}</div>
      </div>
    `;
  }

  if (reqJsonEl) {
    reqJsonEl.textContent = JSON.stringify(log.request || {}, null, 2);
  }
  if (resJsonEl) {
    resJsonEl.textContent = JSON.stringify(log.response || {}, null, 2);
  }

  if (modal) modal.style.display = 'block';
}

function closeLogDetailsModal() {
  const modal = document.getElementById('logDetailsModal');
  if (modal) modal.style.display = 'none';
}

function copyLogJson(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    showToast('JSON copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

function methodBadge(method) {
  if (!method) return '<span class="badge badge-cyan">—</span>';
  const m = method.toUpperCase();
  if (m === 'POST')   return `<span class="badge-method badge-method-post">POST</span>`;
  if (m === 'GET')    return `<span class="badge-method badge-method-get">GET</span>`;
  if (m === 'DELETE') return `<span class="badge-method badge-method-delete">DELETE</span>`;
  return `<span class="badge-method badge-method-post">${escH(m)}</span>`;
}

function httpStatusBadge(status) {
  if (!status) return '<span class="badge badge-cyan">—</span>';
  const s = parseInt(status, 10);
  if (s >= 200 && s < 300) return `<span class="badge badge-http-2xx">${s} OK</span>`;
  if (s >= 400 && s < 500) return `<span class="badge badge-http-4xx">${s}</span>`;
  if (s >= 500)            return `<span class="badge badge-http-5xx">${s} ERR</span>`;
  return `<span class="badge badge-cyan">${s}</span>`;
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
function dispositionBadge(disposition) {
  if (!disposition) return `<span class="badge badge-cyan">N/A</span>`;
  const d = disposition.toUpperCase();
  if (d === 'ANSWERED') return `<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> ANSWERED</span>`;
  if (d === 'NO ANSWER' || d === 'FAILED') return `<span class="badge badge-rose"><i class="fa-solid fa-xmark"></i> ${d}</span>`;
  return `<span class="badge badge-cyan">${escH(disposition)}</span>`;
}

function audioPlayer(r) {
  const playId = r.play_id || r.id;
  if (!playId) return `<span style="color:var(--text-dim);font-size:12px;"><i class="fa-solid fa-ban"></i> No Audio</span>`;
  const kind = r.play_kind || 'recording';
  const src  = `/api/telephony/stream_audio?kind=${kind}&id=${playId}`;
  return `<audio controls preload="none" src="${src}" style="height:30px;width:170px;"></audio>`;
}

function openCreateAgentModal()  { const m = document.getElementById('createAgentModal'); if (m) m.style.display = 'block'; }
function closeCreateAgentModal() { const m = document.getElementById('createAgentModal'); if (m) m.style.display = 'none'; }

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  const icons = { success: '#10b981', error: '#f43f5e', info: '#06b6d4' };
  const iClass = type === 'success' ? 'circle-check' : type === 'error' ? 'circle-exclamation' : 'circle-info';
  toast.innerHTML = `<i class="fa-solid fa-${iClass}" style="color:${icons[type] || icons.info}"></i> <span>${escH(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.cssText += 'opacity:0;transform:translateY(8px);transition:all 0.3s ease;';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escH(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ─── LIVE AGENT EVENT MONITOR & SCREEN-POP (r=agent/poll & r=agent/ack) ─────
let livePollTimer = null;
let currentEventId = null;

function startAgentLivePoll() {
  if (livePollTimer) clearInterval(livePollTimer);
  // Poll every 8 seconds in background
  livePollTimer = setInterval(pollAgentEvents, 8000);
}

async function pollAgentEvents() {
  try {
    const res = await apiGet('agent_poll');
    if (!res.ok) return;
    const data = await res.json();

    if (data.success && data.has_event && data.event) {
      showIncomingCallPopup(data.event);
    }
  } catch (e) {
    // Background poll error handled gracefully
  }
}

function showIncomingCallPopup(ev) {
  currentEventId = ev.id || ev.event_id || ev.request_id || null;
  const modal = document.getElementById('incomingCallPopupModal');
  const callerEl = document.getElementById('popupCallerNumber');
  const bookingEl = document.getElementById('popupBookingId');
  const queueEl = document.getElementById('popupQueue');
  const timeEl = document.getElementById('popupEventTime');

  if (callerEl) callerEl.textContent = ev.caller_number || ev.customer_number || ev.maid_number || 'Incoming Call';
  if (bookingEl) bookingEl.textContent = ev.booking_id || 'N/A';
  if (queueEl) queueEl.textContent = ev.queue || ev.target || 'root-support';
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();

  if (modal) modal.style.display = 'block';
  showToast('Incoming Call Event Received!', 'info');
}

async function acknowledgeCallPopup() {
  if (currentEventId) {
    try {
      await apiPost('agent_ack', { event_id: currentEventId, id: currentEventId });
      showToast('Call Event Acknowledged', 'success');
    } catch (e) {}
  }
  dismissCallPopup();
}

function dismissCallPopup() {
  const modal = document.getElementById('incomingCallPopupModal');
  if (modal) modal.style.display = 'none';
  currentEventId = null;
}

