let loadedRecordingsList = [];

document.addEventListener('DOMContentLoaded', () => {

  // LOGIN PAGE HANDLER
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const agentCode = document.getElementById('agentCode').value.trim();
      const password = document.getElementById('password').value.trim();
      const btnLogin = document.getElementById('btnLogin');
      const alertBox = document.getElementById('alertBox');
      const alertMessage = document.getElementById('alertMessage');

      if (alertBox) alertBox.style.display = 'none';
      
      const origBtnContent = btnLogin.innerHTML;
      btnLogin.disabled = true;
      btnLogin.innerHTML = `<div class="spinner"></div> <span>Authenticating...</span>`;

      try {
        const response = await fetch('api.php?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_code: agentCode, password: password })
        });

        const data = await response.json();

        if (data.success) {
          showToast('Login successful! Loading dashboard...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.php';
          }, 500);
        } else {
          if (alertMessage) alertMessage.textContent = data.message || 'Login failed.';
          if (alertBox) alertBox.style.display = 'flex';
          showToast(data.message || 'Login failed', 'error');
          btnLogin.disabled = false;
          btnLogin.innerHTML = origBtnContent;
        }
      } catch (err) {
        if (alertMessage) alertMessage.textContent = 'Server connection error during login.';
        if (alertBox) alertBox.style.display = 'flex';
        showToast('Server error', 'error');
        btnLogin.disabled = false;
        btnLogin.innerHTML = origBtnContent;
      }
    });
    return;
  }

  // SIDEBAR NAVIGATION MODULE SWITCHER
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const moduleTarget = item.getAttribute('data-module');
      if (moduleTarget) {
        switchModule(moduleTarget);
      }
    });
  });

  // AGENT STATUS SELECT LISTENER
  const statusSelect = document.getElementById('statusSelect');
  if (statusSelect) {
    statusSelect.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      const statAgentStatus = document.getElementById('statAgentStatus');
      const sidebarStatusDot = document.getElementById('sidebarStatusDot');

      try {
        const response = await fetch('api.php?action=status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (data.success) {
          showToast(`Status updated: ${newStatus.toUpperCase()}`, 'success');
          if (statAgentStatus) statAgentStatus.textContent = newStatus;
          if (sidebarStatusDot) {
            if (newStatus === 'offline') {
              sidebarStatusDot.classList.add('offline');
            } else {
              sidebarStatusDot.classList.remove('offline');
            }
          }
        } else {
          showToast(data.message || 'Status update failed', 'error');
        }
      } catch (err) {
        showToast('Error updating status', 'error');
      }
    });
  }

  // CREATE AGENT FORM
  const createAgentForm = document.getElementById('createAgentForm');
  if (createAgentForm) {
    createAgentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('newAgentCode').value.trim();
      const name = document.getElementById('newFullName').value.trim();
      const pass = document.getElementById('newPassword').value.trim();

      try {
        const res = await fetch('api.php?action=agent_create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_code: code, full_name: name, password: pass, sip_peer: code })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Agent '${code}' created!`, 'success');
          closeCreateAgentModal();
          createAgentForm.reset();
          loadAgentsModule();
        } else {
          showToast(data.message || 'Creation failed', 'error');
        }
      } catch (err) {
        showToast('Error creating agent', 'error');
      }
    });
  }

  // DID MASKING FORMS (POST mapping & POST mapping/deactivate)
  const moduleMapForm = document.getElementById('moduleMapForm');
  if (moduleMapForm) {
    moduleMapForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const getVal = (id, defaultVal = '') => {
        const elem = document.getElementById(id);
        return elem && elem.value ? elem.value.trim() : defaultVal;
      };

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const bookingId = getVal('mMapBookingId', 'BK202600123');
      const customerId = getVal('mMapCustomerId', 'CUST10001');
      const customerNumber = getVal('mMapCustomerNumber', '9227231501');
      const maidId = getVal('mMapMaidId', 'MAID501');
      const maidNumber = getVal('mMapMaidNumber', '9227233035');
      const maskDid = getVal('mMapMaskDid', '912612385555');
      const validFrom = getVal('mMapValidFrom', nowStr);
      const validUntil = getVal('mMapValidUntil', '2026-12-31 23:59:59');

      const btnSubmit = document.getElementById('btnSubmitMapping');
      const cardStatus = document.getElementById('mappingStatusCard');
      const badgeStatus = document.getElementById('mappingStatusBadge');
      const tbodyStatus = document.getElementById('mappingStatusTableBody');

      let origBtn = '';
      if (btnSubmit) {
        origBtn = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<div class="spinner"></div> <span>Saving Mapping (POST mapping)...</span>`;
      }

      if (cardStatus) cardStatus.style.display = 'block';

      try {
        const payload = {
          booking_id: bookingId,
          customer_id: customerId,
          customer_number: customerNumber,
          maid_id: maidId,
          maid_number: maidNumber,
          mask_did: maskDid,
          valid_from: validFrom,
          valid_until: validUntil
        };

        const res = await fetch('api.php?action=mapping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
          showToast(`DID Masking Active for Booking '${bookingId}'!`, 'success');
          if (badgeStatus) badgeStatus.innerHTML = `<span class="badge badge-emerald"><i class="fa-solid fa-circle-check"></i> MASKING ACTIVE</span>`;

          if (tbodyStatus) {
            tbodyStatus.innerHTML = `
              <tr><td><strong>Booking ID</strong></td><td><strong>${escapeHtml(bookingId)}</strong></td><td><span class="badge badge-cyan">Primary Key</span></td></tr>
              <tr><td><strong>Customer Number</strong></td><td><strong style="color:#6ee7b7;">${escapeHtml(customerNumber)}</strong></td><td><span class="badge badge-purple">Customer Leg</span></td></tr>
              <tr><td><strong>Maid / Helper Number</strong></td><td><strong style="color:#6ee7b7;">${escapeHtml(maidNumber)}</strong></td><td><span class="badge badge-purple">Maid Leg</span></td></tr>
              <tr><td><strong>Mask BSNL DID</strong></td><td><strong style="color:#67e8f9;">${escapeHtml(maskDid)}</strong></td><td><span class="badge badge-emerald">DID Mask Active</span></td></tr>
              <tr><td><strong>Masking Status</strong></td><td><strong style="color:#6ee7b7;">${escapeHtml(data.status || 'ACTIVE')}</strong></td><td><span class="badge badge-emerald">Live Routing</span></td></tr>
              <tr><td><strong>Validity Period</strong></td><td>${escapeHtml(validFrom)} &rarr; ${escapeHtml(validUntil)}</td><td><span class="badge badge-cyan">Active Window</span></td></tr>
            `;
          }
        } else {
          showToast(data.message || 'DID Masking failed', 'error');
          if (badgeStatus) badgeStatus.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-circle-xmark"></i> ${data.error_code || 'FAILED'}</span>`;
          if (tbodyStatus) {
            tbodyStatus.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:16px; color:#fca5a5;">Error: ${escapeHtml(data.message || 'Failed')} (Code: ${escapeHtml(data.error_code || 'N/A')})</td></tr>`;
          }
        }
      } catch (err) {
        showToast('Server error executing mapping', 'error');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = origBtn;
        }
      }
    });
  }

  const moduleDeactForm = document.getElementById('moduleDeactForm');
  if (moduleDeactForm) {
    moduleDeactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bookingId = document.getElementById('mDeactBookingId').value.trim() || 'BK202600123';
      const status = document.getElementById('mDeactStatus').value;

      const btnDeact = document.getElementById('btnSubmitDeact');
      const cardStatus = document.getElementById('mappingStatusCard');
      const badgeStatus = document.getElementById('mappingStatusBadge');
      const tbodyStatus = document.getElementById('mappingStatusTableBody');

      if (cardStatus) cardStatus.style.display = 'block';

      let origBtn = '';
      if (btnDeact) {
        origBtn = btnDeact.innerHTML;
        btnDeact.disabled = true;
        btnDeact.innerHTML = `<div class="spinner"></div> <span>Deactivating (POST mapping/deactivate)...</span>`;
      }

      try {
        const res = await fetch('api.php?action=mapping_deactivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId, status: status })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`DID Masking deactivated for '${bookingId}'`, 'success');
          if (badgeStatus) badgeStatus.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-ban"></i> DEACTIVATED</span>`;

          if (tbodyStatus) {
            tbodyStatus.innerHTML = `
              <tr><td><strong>Booking ID</strong></td><td><strong>${escapeHtml(bookingId)}</strong></td><td><span class="badge badge-rose">Deactivated</span></td></tr>
              <tr><td><strong>Deactivation Status</strong></td><td><strong style="color:#fca5a5;">${escapeHtml(data.status || status)}</strong></td><td><span class="badge badge-rose">Stopped</span></td></tr>
            `;
          }
        } else {
          showToast(data.message || 'Deactivation failed', 'error');
          if (badgeStatus) badgeStatus.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-circle-xmark"></i> ${data.error_code || 'FAILED'}</span>`;
        }
      } catch (err) {
        showToast('Server error deactivating mapping', 'error');
      } finally {
        if (btnDeact) {
          btnDeact.disabled = false;
          btnDeact.innerHTML = origBtn;
        }
      }
    });
  }

  // RECORDINGS FILTER FORM
  const moduleRecFilterForm = document.getElementById('moduleRecFilterForm');
  if (moduleRecFilterForm) {
    moduleRecFilterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadRecordingsModule();
    });
  }

  const mRecSearch = document.getElementById('mRecSearch');
  if (mRecSearch) {
    mRecSearch.addEventListener('input', filterRecordingsLocally);
    mRecSearch.addEventListener('keyup', filterRecordingsLocally);
  }

  // ─── INITIAL DASHBOARD LOAD & URL ROUTING ─────────────────────────────────
  const initialHash = window.location.hash;
  if (initialHash) {
    const initialMod = getModuleIdFromSlug(initialHash);
    switchModule(initialMod, false);
  } else {
    refreshDashboardOverview();
  }

  // Handle Browser Back / Forward buttons
  window.addEventListener('popstate', () => {
    const activeMod = getModuleIdFromSlug(window.location.hash);
    switchModule(activeMod, false);
  });

});

// ─── URL SLUG HELPERS ────────────────────────────────────────────────────────
function getSlugFromModuleId(moduleId) {
  return moduleId ? moduleId.replace(/^module-/, '') : 'dashboard';
}

function getModuleIdFromSlug(slug) {
  if (!slug) return 'module-dashboard';
  slug = slug.replace(/^#/, '').toLowerCase().trim();
  const valid = ['dashboard', 'call', 'agents', 'mapping', 'recordings'];
  if (valid.includes(slug)) {
    return 'module-' + slug;
  }
  return 'module-dashboard';
}

// SWITCH SIDEBAR MODULES & URL ROUTER
function switchModule(moduleId, updateUrl = true) {
  const targetId = moduleId.startsWith('module-') ? moduleId : ('module-' + moduleId);
  const slug = getSlugFromModuleId(targetId);
  const menuItems = document.querySelectorAll('.menu-item');
  const sections = document.querySelectorAll('.module-section');

  menuItems.forEach(item => {
    if (item.getAttribute('data-module') === targetId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  sections.forEach(sec => {
    if (sec.id === targetId) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  const titles = {
    'module-dashboard': { title: 'Dashboard Overview', sub: 'Live Telephony status, quick call actions, and recent call activity' },
    'module-call': { title: 'Click-to-Call Services', sub: 'Initiate outbound masked calls to Customers or Maid/Helpers with Universal BSNL DID' },
    'module-agents': { title: 'Agents & Extension Directory', sub: 'Manage support agent SIP extensions and active status' },
    'module-mapping': { title: 'Universal DID Masking', sub: 'Configure Universal BSNL DID number masking for all Customers & Maids' },
    'module-recordings': { title: 'Call Recordings & Instant Search', sub: 'Search call history instantly and listen to recorded call audio' }
  };

  if (titles[targetId]) {
    document.getElementById('moduleTitle').textContent = titles[targetId].title;
    document.getElementById('moduleSubtitle').textContent = titles[targetId].sub;
  }

  // Update browser URL hash
  if (updateUrl) {
    const targetHash = '#' + slug;
    if (window.location.hash !== targetHash) {
      if (history.pushState) {
        history.pushState(null, '', targetHash);
      } else {
        window.location.hash = targetHash;
      }
    }
  }

  if (targetId === 'module-dashboard') {
    refreshDashboardOverview();
  } else if (targetId === 'module-agents') {
    loadAgentsModule();
  } else if (targetId === 'module-recordings') {
    loadRecordingsModule();
  }
}

// DASHBOARD OVERVIEW AUTO FETCH
async function refreshDashboardOverview() {
  loadRecentActivity();
  loadAgentsStats();
}

async function loadAgentsStats() {
  try {
    const res = await fetch('api.php?action=agent_list');
    const data = await res.json();
    if (data.success && Array.isArray(data.agents)) {
      const activeCount = document.getElementById('statActiveAgents');
      if (activeCount) activeCount.textContent = data.count || data.agents.length;
    }
  } catch (e) {}
}

async function loadRecentActivity() {
  const tbody = document.getElementById('overviewTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
        <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Call Activity...
      </td>
    </tr>
  `;

  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`api.php?action=recordings&from=${today}&to=${today}&limit=10`);
    const data = await res.json();

    if (data.success && Array.isArray(data.rows)) {
      const totalCallsElem = document.getElementById('statTodayCalls');
      if (totalCallsElem) totalCallsElem.textContent = data.total || data.rows.length;

      tbody.innerHTML = '';
      if (data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color:var(--text-muted);">No call activity recorded today.</td></tr>`;
        return;
      }

      data.rows.slice(0, 8).forEach(r => {
        const tr = document.createElement('tr');
        
        let statusBadge = `<span class="badge badge-cyan">${escapeHtml(r.disposition || 'COMPLETED')}</span>`;
        if (r.disposition === 'ANSWERED') {
          statusBadge = `<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> ANSWERED</span>`;
        } else if (r.disposition === 'FAILED' || r.disposition === 'NO ANSWER') {
          statusBadge = `<span class="badge badge-rose"><i class="fa-solid fa-xmark"></i> ${r.disposition}</span>`;
        }

        let audioControl = '<span style="color:var(--text-dim); font-size:12px;">No Audio</span>';
        if (r.play_id) {
          const audioUrl = `http://117.217.126.149:880/roottech/index.php?r=recording/play&kind=${r.play_kind || 'recording'}&id=${r.play_id}&token=11af5c25470d1306970a9175df8a1213da7435960305169f`;
          audioControl = `<audio controls src="${audioUrl}" style="height:30px; width:160px;"></audio>`;
        }

        tr.innerHTML = `
          <td><strong>${escapeHtml(r.booking_id || 'N/A')}</strong></td>
          <td><span class="badge badge-purple">${escapeHtml(r.call_type || 'Call')}</span></td>
          <td><strong style="color:#a5b4fc;">${escapeHtml(r.caller_number || 'Internal')}</strong></td>
          <td><strong style="color:#a5b4fc;">${escapeHtml(r.destination_number || 'Internal')}</strong></td>
          <td style="font-size:12px;">${escapeHtml(r.start_time || '')}</td>
          <td>${statusBadge}</td>
          <td>${audioControl}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('Error loading activity:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#fca5a5;">Server connection error.</td></tr>`;
  }
}

// TRIGGER CLICK TO CALL (CUSTOMER / MAID)
async function triggerCallTarget(target) {
  const bookingId = document.getElementById('callBookingId').value.trim();
  const extension = document.getElementById('callExtension').value.trim();
  const requestId = document.getElementById('callRequestId').value.trim();
  
  const btnCust = document.getElementById('btnCallCustomer');
  const btnMaid = document.getElementById('btnCallMaid');

  // Toggle active button state
  if (btnCust && btnMaid) {
    if (target === 'customer') {
      btnCust.classList.remove('btn-secondary');
      btnCust.classList.add('btn-primary', 'active');
      btnMaid.classList.remove('btn-primary', 'active');
      btnMaid.classList.add('btn-secondary');
    } else {
      btnMaid.classList.remove('btn-secondary');
      btnMaid.classList.add('btn-primary', 'active');
      btnCust.classList.remove('btn-primary', 'active');
      btnCust.classList.add('btn-secondary');
    }
  }

  const btn = target === 'customer' ? btnCust : btnMaid;

  if (resultCard) resultCard.style.display = 'block';
  
  let origBtn = '';
  if (btn) {
    origBtn = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div> <span>Dialing ${target}...</span>`;
  }

  try {
    const action = target === 'customer' ? 'customer' : 'call_maid';
    const res = await fetch(`api.php?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        source_extension: extension,
        request_id: requestId
      })
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Call initiated to ${target.toUpperCase()}!`, 'success');
      if (badge) badge.innerHTML = `<span class="badge badge-emerald"><i class="fa-solid fa-phone"></i> ORIGINATING</span>`;
      
      tbody.innerHTML = `
        <tr><td><strong>Booking ID</strong></td><td>${escapeHtml(data.booking_id || bookingId)}</td><td><span class="badge badge-cyan">Active Booking</span></td></tr>
        <tr><td><strong>Call Target</strong></td><td><span class="badge badge-purple">${escapeHtml(target.toUpperCase())}</span></td><td><span class="badge badge-cyan">Target Type</span></td></tr>
        <tr><td><strong>Dialed Phone</strong></td><td><strong style="color:#6ee7b7;">${escapeHtml(data.dialed_number || data.customer_number || data.maid_number || 'N/A')}</strong></td><td><a href="tel:${data.dialed_number}" class="badge badge-emerald"><i class="fa-solid fa-phone"></i> Dialing</a></td></tr>
        <tr><td><strong>Request ID</strong></td><td>${escapeHtml(data.request_id || requestId)}</td><td><span class="badge badge-cyan">Tracker ID</span></td></tr>
        <tr><td><strong>Call Status</strong></td><td><strong style="color:#6ee7b7;">${escapeHtml(data.status || 'ORIGINATING')}</strong></td><td><span class="badge badge-emerald">Ringing Extension</span></td></tr>
      `;

      document.getElementById('callRequestId').value = 'REQ' + Date.now();

    } else {
      showToast(data.message || 'Call failed', 'error');
      if (badge) badge.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-circle-xmark"></i> ${data.error_code || 'FAILED'}</span>`;
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:16px; color:#fca5a5;">Call failed: ${escapeHtml(data.message || 'Error')}</td></tr>`;
    }

  } catch (err) {
    showToast('Network error triggering call', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtn;
    }
  }
}

// LOAD AGENTS MODULE
async function loadAgentsModule() {
  const tbody = document.getElementById('agentsModuleTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
        <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Directory...
      </td>
    </tr>
  `;

  try {
    const res = await fetch('api.php?action=agent_list');
    const data = await res.json();

    if (data.success && Array.isArray(data.agents)) {
      tbody.innerHTML = '';
      if (data.agents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No agents found.</td></tr>`;
        return;
      }

      data.agents.forEach(ag => {
        const tr = document.createElement('tr');
        
        let statusBadge = '<span class="badge badge-rose">offline</span>';
        if (ag.status === 'available') {
          statusBadge = '<span class="badge badge-emerald">available</span>';
        } else if (ag.status === 'break') {
          statusBadge = '<span class="badge badge-cyan">on break</span>';
        }

        tr.innerHTML = `
          <td><strong style="color:#a5b4fc;">${escapeHtml(ag.agent_code)}</strong></td>
          <td>${escapeHtml(ag.full_name)}</td>
          <td><span class="badge badge-purple">${escapeHtml(ag.sip_peer || ag.agent_code)}</span></td>
          <td>${statusBadge}</td>
          <td>${ag.is_active ? '<span class="badge badge-emerald">Active</span>' : '<span class="badge badge-rose">Inactive</span>'}</td>
          <td>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteAgentModule(${ag.id}, '${ag.agent_code}')" title="Delete">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#fca5a5;">Failed to load agents.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#fca5a5;">Server error.</td></tr>`;
  }
}

async function deleteAgentModule(agentId, agentCode) {
  if (!confirm(`Delete agent extension '${agentCode}'?`)) return;

  try {
    const res = await fetch('api.php?action=agent_delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: agentId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Agent '${agentCode}' deleted`, 'success');
      loadAgentsModule();
    } else {
      showToast(data.message || 'Deletion failed', 'error');
    }
  } catch (e) {
    showToast('Delete error', 'error');
  }
}

// LOAD RECORDINGS MODULE WITH SEARCH & FILTER
async function loadRecordingsModule() {
  const tbody = document.getElementById('moduleRecordingsTableBody');
  const countBadge = document.getElementById('recordingsCountBadge');
  if (!tbody) return;

  const fromDate = document.getElementById('mRecFromDate').value;
  const toDate = document.getElementById('mRecToDate').value;

  tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">
        <div class="spinner" style="margin: 0 auto 10px;"></div> Fetching Call Recordings...
      </td>
    </tr>
  `;

  try {
    const url = `api.php?action=recordings&from=${fromDate}&to=${toDate}&limit=100`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success && Array.isArray(data.rows)) {
      loadedRecordingsList = data.rows;
      filterRecordingsLocally();
    } else {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#fca5a5;">Failed to load recordings: ${escapeHtml(data.message || 'Error')}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#fca5a5;">Server error loading recordings.</td></tr>`;
  }
}

// INSTANT REAL-TIME CLIENT-SIDE SEARCH FILTER
function filterRecordingsLocally() {
  const queryElem = document.getElementById('mRecSearch');
  const countBadge = document.getElementById('recordingsCountBadge');
  const query = queryElem ? queryElem.value.trim().toLowerCase() : '';

  if (!query) {
    renderRecordingsRows(loadedRecordingsList);
    if (countBadge) countBadge.textContent = `Showing All ${loadedRecordingsList.length} Recordings`;
    return;
  }

  const filtered = loadedRecordingsList.filter(r => {
    const booking = (r.booking_id || '').toLowerCase();
    const caller = (r.caller_number || '').toLowerCase();
    const dest = (r.destination_number || '').toLowerCase();
    const type = (r.call_type || '').toLowerCase();
    const disp = (r.disposition || '').toLowerCase();
    const time = (r.start_time || '').toLowerCase();

    return booking.includes(query) || 
           caller.includes(query) || 
           dest.includes(query) || 
           type.includes(query) || 
           disp.includes(query) ||
           time.includes(query);
  });

  renderRecordingsRows(filtered);
  if (countBadge) {
    countBadge.textContent = `Filtered: ${filtered.length} of ${loadedRecordingsList.length} Recordings`;
  }
}

// RENDER RECORDINGS ROWS WITH AUDIO PLAYBACK
function renderRecordingsRows(rows) {
  const tbody = document.getElementById('moduleRecordingsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No matching call recordings found.</td></tr>`;
    return;
  }

  rows.forEach(r => {
    const tr = document.createElement('tr');
    
    let dispBadge = `<span class="badge badge-cyan">${escapeHtml(r.disposition || 'COMPLETED')}</span>`;
    if (r.disposition === 'ANSWERED') {
      dispBadge = `<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> ANSWERED</span>`;
    } else if (r.disposition === 'FAILED' || r.disposition === 'NO ANSWER') {
      dispBadge = `<span class="badge badge-rose"><i class="fa-solid fa-xmark"></i> ${r.disposition}</span>`;
    }

    let audioControl = '<span style="color:var(--text-dim); font-size:12px;">No Audio</span>';
    if (r.play_id) {
      const streamUrl = `http://117.217.126.149:880/roottech/index.php?r=recording/play&kind=${r.play_kind || 'recording'}&id=${r.play_id}&token=11af5c25470d1306970a9175df8a1213da7435960305169f`;
      audioControl = `<audio controls src="${streamUrl}" style="height:32px; width:180px;"></audio>`;
    }

    tr.innerHTML = `
      <td><strong>${escapeHtml(r.booking_id || 'N/A')}</strong></td>
      <td><span class="badge badge-purple">${escapeHtml(r.call_type || 'Call')}</span></td>
      <td><strong style="color:#a5b4fc;">${escapeHtml(r.caller_number || '-')}</strong></td>
      <td><strong style="color:#a5b4fc;">${escapeHtml(r.destination_number || '-')}</strong></td>
      <td style="font-size:12px;">${escapeHtml(r.start_time || '')}</td>
      <td>${r.duration || 0}s</td>
      <td>${dispBadge}</td>
      <td>${audioControl}</td>
    `;
    tbody.appendChild(tr);
  });
}

// RESET RECORDINGS FILTER
function resetRecordingsFilter() {
  const searchInput = document.getElementById('mRecSearch');
  if (searchInput) searchInput.value = '';

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('mRecFromDate').value = today;
  document.getElementById('mRecToDate').value = today;

  loadRecordingsModule();
  showToast('Recordings search filters reset!', 'info');
}

// MODALS & TOASTS
function openCreateAgentModal() {
  const modal = document.getElementById('createAgentModal');
  if (modal) modal.style.display = 'block';
}

function closeCreateAgentModal() {
  const modal = document.getElementById('createAgentModal');
  if (modal) modal.style.display = 'none';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = '<i class="fa-solid fa-circle-info" style="color: var(--accent-cyan)"></i>';
  if (type === 'success') {
    icon = '<i class="fa-solid fa-circle-check" style="color: var(--accent-emerald)"></i>';
  } else if (type === 'error') {
    icon = '<i class="fa-solid fa-circle-exclamation" style="color: var(--accent-rose)"></i>';
  }

  toast.innerHTML = `${icon} <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
