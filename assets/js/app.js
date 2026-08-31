// GLOBAL HELPER FUNCTIONS
function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : '';
}

function getApiUrl(action, queryParams = '') {
  const isLaravel = document.querySelector('meta[name="csrf-token"]') !== null || window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/admin');
  if (isLaravel) {
    return `/api/telephony/${action}${queryParams ? '?' + queryParams : ''}`;
  }
  return `api.php?action=${action}${queryParams ? '&' + queryParams : ''}`;
}

function getApiHeaders(contentType = 'application/json') {
  const headers = {};
  if (contentType) headers['Content-Type'] = contentType;
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-TOKEN'] = csrf;
  return headers;
}

function togglePasswordVisibility() {
  const passInput = document.getElementById('password');
  const passIcon = document.getElementById('togglePasswordIcon');
  if (!passInput) return;
  
  if (passInput.type === 'password') {
    passInput.type = 'text';
    if (passIcon) {
      passIcon.classList.remove('fa-eye');
      passIcon.classList.add('fa-eye-slash');
    }
  } else {
    passInput.type = 'password';
    if (passIcon) {
      passIcon.classList.remove('fa-eye-slash');
      passIcon.classList.add('fa-eye');
    }
  }
}

function fillDemoCredentials(code = '1001', pass = 'Agent@123') {
  const codeInput = document.getElementById('agentCode');
  const passInput = document.getElementById('password');
  if (codeInput) codeInput.value = code;
  if (passInput) passInput.value = pass;
  showToast('Demo credentials filled!', 'success');
  const btnLogin = document.getElementById('btnLogin');
  if (btnLogin) btnLogin.focus();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
  const nextTheme = isDark ? 'light' : 'dark';
  
  if (nextTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
  localStorage.setItem('theme', nextTheme);
  
  const icons = document.querySelectorAll('#themeToggleBtn i, .theme-toggle-btn i');
  icons.forEach(icon => {
    icon.className = nextTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  });
}

document.addEventListener('DOMContentLoaded', () => {

  // Sync theme toggle icon on load
  const currentDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
  const themeIcons = document.querySelectorAll('#themeToggleBtn i, .theme-toggle-btn i');
  themeIcons.forEach(icon => {
    icon.className = currentDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  });

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

      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      const endpoint = csrfMeta ? '/login' : 'api.php?action=login';
      const headers = { 'Content-Type': 'application/json' };
      if (csrfMeta) headers['X-CSRF-TOKEN'] = csrfMeta.getAttribute('content');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ agent_code: agentCode, password: password })
        });

        const data = await response.json();

        if (data.success) {
          showToast('Login successful! Loading dashboard...', 'success');
          setTimeout(() => {
            window.location.href = data.redirect || 'dashboard.php';
          }, 500);
        } else {
          if (alertMessage) alertMessage.textContent = data.message || 'Invalid agent credentials.';
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
        toggleMobileSidebar(true);
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
        const response = await fetch(getApiUrl('status'), {
          method: 'POST',
          headers: getApiHeaders(),
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
        const res = await fetch(getApiUrl('agent_create'), {
          method: 'POST',
          headers: getApiHeaders(),
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

        const res = await fetch(getApiUrl('mapping'), {
          method: 'POST',
          headers: getApiHeaders(),
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
        const res = await fetch(getApiUrl('mapping_deactivate'), {
          method: 'POST',
          headers: getApiHeaders(),
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

  // REPORTS FILTER FORM
  const moduleReportsFilterForm = document.getElementById('moduleReportsFilterForm');
  if (moduleReportsFilterForm) {
    moduleReportsFilterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadReportsModule(1);
    });
  }

  const mRepSearch = document.getElementById('mRepSearch');
  if (mRepSearch) {
    let repSearchTimer;
    mRepSearch.addEventListener('input', () => {
      clearTimeout(repSearchTimer);
      repSearchTimer = setTimeout(() => loadReportsModule(1), 350);
    });
  }

  // EDIT AGENT FORM LISTENER
  const editAgentForm = document.getElementById('editAgentForm');
  if (editAgentForm) {
    editAgentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editAgentId').value;
      const code = document.getElementById('editAgentCode').value;
      const name = document.getElementById('editFullName').value.trim();
      const pass = document.getElementById('editPassword').value.trim();
      const sipSecret = document.getElementById('editSipSecret').value.trim();

      const btnSubmit = document.getElementById('btnSubmitEditAgent');
      let origBtn = '';
      if (btnSubmit) {
        origBtn = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<div class="spinner"></div> <span>Updating...</span>`;
      }

      try {
        const payload = { id: parseInt(id, 10), agent_code: code, full_name: name };
        if (pass) payload.password = pass;
        if (sipSecret) payload.sip_secret = sipSecret;

        const res = await fetch(getApiUrl('agent_update'), {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Agent '${code}' updated successfully!`, 'success');
          closeEditAgentModal();
          loadAgentsModule();
        } else {
          showToast(data.message || 'Update failed', 'error');
        }
      } catch (err) {
        showToast('Error updating agent', 'error');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = origBtn;
        }
      }
    });
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
  const valid = ['dashboard', 'call', 'agents', 'mapping', 'recordings', 'reports', 'logs'];
  if (valid.includes(slug)) {
    if (slug === 'logs') return 'module-reports';
    return 'module-' + slug;
  }
  return 'module-dashboard';
}

// SWITCH SIDEBAR MODULES & URL ROUTER
function switchModule(moduleId, updateUrl = true) {
  let targetId = moduleId.startsWith('module-') ? moduleId : ('module-' + moduleId);
  let slug = getSlugFromModuleId(targetId);

  // Enforce Agent Permissions
  if (window.ALLOWED_MODULES && Array.isArray(window.ALLOWED_MODULES)) {
    if (slug !== 'dashboard' && !window.ALLOWED_MODULES.includes(slug)) {
      if (typeof showToast === 'function') {
        showToast(`Access Denied: You do not have permission to access the '${slug}' module.`, 'error');
      }
      targetId = 'module-dashboard';
      slug = 'dashboard';
    }
  }

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
    'module-recordings': { title: 'Call Recordings & Instant Search', sub: 'Search call history instantly and listen to recorded call audio' },
    'module-reports': { title: 'API Reports & Logs', sub: 'Telephony API telemetry, payload inspection, and transaction audit logs' }
  };

  if (titles[targetId]) {
    const titleEl = document.getElementById('moduleTitle');
    const subEl = document.getElementById('moduleSubtitle');
    if (titleEl) titleEl.textContent = titles[targetId].title;
    if (subEl) subEl.textContent = titles[targetId].sub;
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
  } else if (targetId === 'module-reports') {
    loadReportsModule(1);
  }
}

// DASHBOARD OVERVIEW AUTO FETCH
async function refreshDashboardOverview() {
  loadRecentActivity();
  loadAgentsStats();
}

async function loadAgentsStats() {
  try {
    const res = await fetch(getApiUrl('agent_list'));
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
    const res = await fetch(getApiUrl('recordings', `from=${encodeURIComponent(today)}&to=${encodeURIComponent(today)}&limit=10`));
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
          const isLaravel = document.querySelector('meta[name="csrf-token"]') !== null || window.location.pathname.includes('/dashboard');
          const audioUrl = isLaravel 
            ? `/api/telephony/stream_audio?kind=${encodeURIComponent(r.play_kind || 'recording')}&id=${encodeURIComponent(r.play_id)}`
            : `api.php?action=stream_audio&kind=${encodeURIComponent(r.play_kind || 'recording')}&id=${encodeURIComponent(r.play_id)}`;
          
          const safeCaller = escapeHtml(r.caller_number || '');
          const safeDest = escapeHtml(r.destination_number || '');
          const safeBooking = escapeHtml(r.booking_id || '');
          const safeTime = escapeHtml(r.start_time || '');
          const safeDur = r.duration || 0;

          audioControl = `
            <button type="button" class="audio-btn" onclick="openAudioPlayer('${audioUrl}', { id: '${r.play_id}', caller: '${safeCaller}', destination: '${safeDest}', bookingId: '${safeBooking}', time: '${safeTime}', duration: '${safeDur}' })">
              <i class="fa-solid fa-play"></i> Play
            </button>
          `;
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

  // Check if Browser Simulator Mode is active
  if (window.telephonySimulator && window.telephonySimulator.isSimulator()) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtn;
    }
    window.telephonySimulator.simulateOutboundCall(target, bookingId);
    return;
  }

  try {
    const action = target === 'customer' ? 'customer' : 'call_maid';
    const res = await fetch(getApiUrl(action), {
      method: 'POST',
      headers: getApiHeaders(),
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
        <tr><td><strong>Booking ID</strong></td><td>${escapeHtml(data.booking_id || bookingId)}</td><td><span class="badge badge-purple">Active Booking</span></td></tr>
        <tr><td><strong>Call Target</strong></td><td><span class="badge badge-purple">${escapeHtml(target.toUpperCase())}</span></td><td><span class="badge badge-cyan">Target Type</span></td></tr>
        <tr><td><strong>Dialed Phone</strong></td><td><strong style="color:#6ee7b7;">${escapeHtml(data.dialed_number || data.customer_number || data.maid_number || 'N/A')}</strong></td><td><a href="tel:${data.dialed_number}" class="badge badge-emerald"><i class="fa-solid fa-phone"></i> Dialing</a></td></tr>
        <tr><td><strong>Request ID</strong></td><td>${escapeHtml(data.request_id || requestId)}</td><td><span class="badge badge-cyan">Tracker ID</span></td></tr>
        <tr><td><strong>Call Status</strong></td><td><strong style="color:#6ee7b7;">${escapeHtml(data.status || 'ORIGINATING')}</strong></td><td><span class="badge badge-emerald">Ringing Extension</span></td></tr>
      `;

      document.getElementById('callRequestId').value = 'REQ' + Date.now();

    } else {
      showToast(data.message || 'Call failed', 'error');
      if (badge) badge.innerHTML = `<span class="badge badge-rose"><i class="fa-solid fa-circle-xmark"></i> ${data.error_code || 'FAILED'}</span>`;
      
      const isSipOffline = (data.error_code === 'AGENT_NOT_REGISTERED' || (data.message && data.message.includes('not registered')));
      
      let fallbackHtml = '';
      if (isSipOffline) {
        fallbackHtml = `
          <div style="margin-top: 14px; padding: 12px; background: rgba(245, 158, 11, 0.1); border-radius: var(--radius-sm); border: 1px solid rgba(245, 158, 11, 0.3);">
            <div style="font-weight: 600; color: var(--accent-amber); font-size: 13px; margin-bottom: 6px;">
              <i class="fa-solid fa-triangle-exclamation"></i> SIP Softphone 1001 is Offline
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
              In Production, open Zoiper/Linphone to receive live calls. For local testing without softphone, click below:
            </p>
            <button type="button" class="btn btn-sm btn-primary" onclick="telephonySimulator.simulateOutboundCall('${target}', '${bookingId}')" style="background: var(--accent-amber); border-color: var(--accent-amber); color: #000; font-weight: 600;">
              <i class="fa-solid fa-play"></i> Test via Browser Simulator
            </button>
          </div>
        `;
      }

      tbody.innerHTML = `
        <tr><td colspan="3" style="text-align:center; padding:16px; color:#fca5a5;">Call failed: ${escapeHtml(data.message || 'Error')}</td></tr>
        ${fallbackHtml ? `<tr><td colspan="3" style="padding:0 12px 12px 12px;">${fallbackHtml}</td></tr>` : ''}
      `;
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
    const res = await fetch(getApiUrl('agent_list'));
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
    const res = await fetch(getApiUrl('agent_delete'), {
      method: 'POST',
      headers: getApiHeaders(),
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
    const url = getApiUrl('recordings', `from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&limit=100`);
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
      const isLaravel = document.querySelector('meta[name="csrf-token"]') !== null || window.location.pathname.includes('/dashboard');
      const streamUrl = isLaravel 
        ? `/api/telephony/stream_audio?kind=${encodeURIComponent(r.play_kind || 'recording')}&id=${encodeURIComponent(r.play_id)}`
        : `api.php?action=stream_audio&kind=${encodeURIComponent(r.play_kind || 'recording')}&id=${encodeURIComponent(r.play_id)}`;
      
      const safeCaller = escapeHtml(r.caller_number || '');
      const safeDest = escapeHtml(r.destination_number || '');
      const safeBooking = escapeHtml(r.booking_id || '');
      const safeTime = escapeHtml(r.start_time || '');
      const safeDur = r.duration || 0;

      audioControl = `
        <button type="button" class="audio-btn" onclick="openAudioPlayer('${streamUrl}', { id: '${r.play_id}', caller: '${safeCaller}', destination: '${safeDest}', bookingId: '${safeBooking}', time: '${safeTime}', duration: '${safeDur}' })">
          <i class="fa-solid fa-play"></i> Play
        </button>
      `;
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

// ─── REPORTS & TELEPHONY API LOGS MODULE ─────────────────────────────────────
let currentReportsPage = 1;
let loadedReportsList = [];

async function loadReportsModule(page = 1) {
  currentReportsPage = page;
  const tbody = document.getElementById('moduleReportsTableBody');
  if (!tbody) return;

  const fromDate = document.getElementById('mRepFromDate') ? document.getElementById('mRepFromDate').value : '';
  const toDate = document.getElementById('mRepToDate') ? document.getElementById('mRepToDate').value : '';
  const endpoint = document.getElementById('mRepEndpoint') ? document.getElementById('mRepEndpoint').value : '';
  const httpStatus = document.getElementById('mRepHttpStatus') ? document.getElementById('mRepHttpStatus').value : '';
  const limit = document.getElementById('mRepLimit') ? document.getElementById('mRepLimit').value : 50;
  const query = document.getElementById('mRepSearch') ? document.getElementById('mRepSearch').value.trim() : '';

  tbody.innerHTML = `
    <tr>
      <td colspan="12" style="text-align: center; padding: 28px; color: var(--text-muted);">
        <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Telephony API Logs...
      </td>
    </tr>
  `;

  try {
    let params = `page=${page}&limit=${limit}`;
    if (fromDate) params += `&from=${encodeURIComponent(fromDate)}`;
    if (toDate) params += `&to=${encodeURIComponent(toDate)}`;
    if (endpoint) params += `&endpoint=${encodeURIComponent(endpoint)}`;
    if (httpStatus) params += `&http=${encodeURIComponent(httpStatus)}`;
    if (query) params += `&q=${encodeURIComponent(query)}`;

    const res = await fetch(getApiUrl('logs', params));
    const data = await res.json();

    if (data.success && Array.isArray(data.rows)) {
      loadedReportsList = data.rows;
      const total = data.total || data.rows.length;

      const statTotal = document.getElementById('statReportsTotal');
      const statOk = document.getElementById('statReportsOk');
      const statErrors = document.getElementById('statReportsErrors');
      const statPage = document.getElementById('statReportsPage');
      const countBadge = document.getElementById('reportsCountBadge');

      if (statTotal) statTotal.textContent = total;
      if (statPage) statPage.textContent = `Page ${page}`;
      if (countBadge) countBadge.textContent = `${total} Logs Found`;

      let okCount = 0;
      let errCount = 0;
      data.rows.forEach(r => {
        const code = parseInt(r.http_code || 200, 10);
        if (code >= 200 && code < 400) okCount++;
        else errCount++;
      });
      if (statOk) statOk.textContent = okCount;
      if (statErrors) statErrors.textContent = errCount;

      renderReportsRows(data.rows);
      renderReportsPagination(total, page, parseInt(limit, 10));
    } else {
      tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:24px; color:#fca5a5;">Failed to load logs: ${escapeHtml(data.message || 'Error')}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:24px; color:#fca5a5;">Server error loading logs.</td></tr>`;
  }
}

function renderReportsRows(rows) {
  const tbody = document.getElementById('moduleReportsTableBody');
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:24px; color:var(--text-muted);">No logs matching search criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    const code = parseInt(r.http_code || 200, 10);
    let httpBadge = `<span class="badge badge-emerald">${code} OK</span>`;
    if (code >= 400) {
      httpBadge = `<span class="badge badge-rose">${code} ERROR</span>`;
    }

    const method = escapeHtml(r.method || 'GET');
    const methodBadge = method === 'POST' ? '<span class="badge badge-purple">POST</span>' : '<span class="badge badge-cyan">GET</span>';

    tr.innerHTML = `
      <td><strong style="color:var(--text-bright);">#${r.id}</strong></td>
      <td style="font-size:11px; white-space:nowrap;">${escapeHtml(r.created_at || r.timestamp || '')}</td>
      <td>${methodBadge}</td>
      <td><span class="badge badge-purple" style="font-family:monospace; font-size:11px;">${escapeHtml(r.endpoint || '')}</span></td>
      <td>${httpBadge}</td>
      <td>${r.booking_id ? `<strong style="color:#a5b4fc;">${escapeHtml(r.booking_id)}</strong>` : '<span style="color:var(--text-dim);">-</span>'}</td>
      <td>${r.agent_code ? `<span class="badge badge-cyan">${escapeHtml(r.agent_code)}</span>` : '<span style="color:var(--text-dim);">-</span>'}</td>
      <td>${r.target ? `<span class="badge badge-purple">${escapeHtml(r.target)}</span>` : '<span style="color:var(--text-dim);">-</span>'}</td>
      <td><span style="font-size:11px; font-family:monospace;">${escapeHtml(r.request_id || '-')}</span></td>
      <td style="font-size:11px;">${escapeHtml(r.ip || '127.0.0.1')} / ${r.latency_ms || 12}ms</td>
      <td style="font-size:12px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(r.summary || r.response_summary || '')}">${escapeHtml(r.summary || r.response_summary || 'Success')}</td>
      <td style="text-align:center;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="openLogDetailsModal(${r.id})" style="padding:2px 8px; font-size:11px;" title="View Payloads">
          <i class="fa-solid fa-code"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderReportsPagination(total, page, limit) {
  const info = document.getElementById('reportsPaginationInfo');
  const btns = document.getElementById('reportsPaginationButtons');
  if (!info || !btns) return;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);

  info.textContent = `Showing ${total > 0 ? start : 0} to ${end} of ${total} logs`;

  let btnHtml = '';
  if (page > 1) {
    btnHtml += `<button type="button" class="btn btn-secondary btn-sm" onclick="loadReportsModule(${page - 1})"><i class="fa-solid fa-chevron-left"></i> Prev</button>`;
  }
  btnHtml += `<span style="font-size:12px; color:var(--text-muted); padding:0 8px;">Page ${page} of ${totalPages}</span>`;
  if (page < totalPages) {
    btnHtml += `<button type="button" class="btn btn-secondary btn-sm" onclick="loadReportsModule(${page + 1})">Next <i class="fa-solid fa-chevron-right"></i></button>`;
  }
  btns.innerHTML = btnHtml;
}

function resetReportsFilter() {
  const searchEl = document.getElementById('mRepSearch');
  if (searchEl) searchEl.value = '';
  const epEl = document.getElementById('mRepEndpoint');
  if (epEl) epEl.value = '';
  const httpEl = document.getElementById('mRepHttpStatus');
  if (httpEl) httpEl.value = '';
  loadReportsModule(1);
  showToast('Reports filter reset', 'info');
}

function exportReportsCSV() {
  if (!loadedReportsList || loadedReportsList.length === 0) {
    showToast('No logs to export', 'error');
    return;
  }
  const headers = ['ID', 'Timestamp', 'Method', 'Endpoint', 'HTTP_Code', 'Booking_ID', 'Agent_Ext', 'Request_ID', 'IP', 'Latency_ms'];
  const csvRows = [headers.join(',')];

  loadedReportsList.forEach(r => {
    csvRows.push([
      r.id || '',
      `"${r.created_at || r.timestamp || ''}"`,
      r.method || 'GET',
      `"${r.endpoint || ''}"`,
      r.http_code || 200,
      `"${r.booking_id || ''}"`,
      `"${r.agent_code || ''}"`,
      `"${r.request_id || ''}"`,
      r.ip || '',
      r.latency_ms || 0
    ].join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `telephony_logs_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV export started!', 'success');
}

function openLogDetailsModal(id) {
  const log = loadedReportsList.find(r => r.id === id);
  if (!log) return;

  const modal = document.getElementById('logDetailsModal');
  const backdrop = document.getElementById('modalBackdrop');
  const title = document.getElementById('logModalTitle');
  const reqJson = document.getElementById('logModalReqJson');
  const resJson = document.getElementById('logModalResJson');
  const overview = document.getElementById('logModalOverview');

  if (title) title.textContent = `Log #${log.id} Details - ${log.endpoint || ''}`;
  if (overview) {
    overview.innerHTML = `
      <div style="background:var(--bg-user-box); padding:8px 12px; border-radius:var(--radius-sm); font-size:12px;"><strong>Method:</strong> ${escapeHtml(log.method || 'GET')}</div>
      <div style="background:var(--bg-user-box); padding:8px 12px; border-radius:var(--radius-sm); font-size:12px;"><strong>HTTP Code:</strong> ${escapeHtml(log.http_code || 200)}</div>
      <div style="background:var(--bg-user-box); padding:8px 12px; border-radius:var(--radius-sm); font-size:12px;"><strong>Latency:</strong> ${escapeHtml(log.latency_ms || 12)}ms</div>
      <div style="background:var(--bg-user-box); padding:8px 12px; border-radius:var(--radius-sm); font-size:12px;"><strong>Timestamp:</strong> ${escapeHtml(log.created_at || '')}</div>
    `;
  }

  if (reqJson) {
    reqJson.textContent = typeof log.request_payload === 'object' ? JSON.stringify(log.request_payload, null, 2) : (log.request_payload || 'No request payload');
  }
  if (resJson) {
    resJson.textContent = typeof log.response_payload === 'object' ? JSON.stringify(log.response_payload, null, 2) : (log.response_payload || 'No response payload');
  }

  if (backdrop) backdrop.style.display = 'block';
  if (modal) modal.style.display = 'block';
}

function closeLogDetailsModal() {
  const modal = document.getElementById('logDetailsModal');
  const backdrop = document.getElementById('modalBackdrop');
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
}

function copyLogJson(elemId) {
  const elem = document.getElementById(elemId);
  if (!elem) return;
  navigator.clipboard.writeText(elem.textContent).then(() => {
    showToast('Payload copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// ─── AGENT MODALS ────────────────────────────────────────────────────────────
function openCreateAgentModal() {
  const modal = document.getElementById('createAgentModal');
  const backdrop = document.getElementById('modalBackdrop');
  if (modal) modal.style.display = 'block';
  if (backdrop) backdrop.style.display = 'block';
}

function closeCreateAgentModal() {
  const modal = document.getElementById('createAgentModal');
  const backdrop = document.getElementById('modalBackdrop');
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
}

function openEditAgentModal(agent) {
  const modal = document.getElementById('editAgentModal');
  const backdrop = document.getElementById('modalBackdrop');
  if (document.getElementById('editAgentId')) document.getElementById('editAgentId').value = agent.id || '';
  if (document.getElementById('editAgentCode')) document.getElementById('editAgentCode').value = agent.agent_code || '';
  if (document.getElementById('editFullName')) document.getElementById('editFullName').value = agent.full_name || '';
  if (document.getElementById('editPassword')) document.getElementById('editPassword').value = '';
  if (document.getElementById('editSipSecret')) document.getElementById('editSipSecret').value = agent.sip_secret || '';

  if (backdrop) backdrop.style.display = 'block';
  if (modal) modal.style.display = 'block';
}

function closeEditAgentModal() {
  const modal = document.getElementById('editAgentModal');
  const backdrop = document.getElementById('modalBackdrop');
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
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

function toggleMobileSidebar(forceClose = false) {
  const sidebar = document.querySelector('.app-sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar) return;

  if (forceClose || sidebar.classList.contains('show-mobile')) {
    sidebar.classList.remove('show-mobile');
    if (backdrop) backdrop.classList.remove('active');
  } else {
    sidebar.classList.add('show-mobile');
    if (backdrop) backdrop.classList.add('active');
  }
}

