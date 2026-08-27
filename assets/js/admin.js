function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : '';
}

function getAdminApiUrl(action, queryParams = '') {
  const isLaravel = document.querySelector('meta[name="csrf-token"]') !== null || window.location.pathname.includes('/admin');
  if (isLaravel) {
    return `/api/telephony/${action}${queryParams ? '?' + queryParams : ''}`;
  }
  return `api.php?action=${action}${queryParams ? '&' + queryParams : ''}`;
}

const adminModuleTitles = {
  'module-dashboard': {
    title: 'Admin Overview',
    sub: 'Telephony PBX administration, agent extensions, DID routing, and call auditing'
  },
  'module-agents': {
    title: 'Agents & Extensions',
    sub: 'Manage support agent extensions, SIP passwords, and monitor real-time registered peers on PBX'
  },
  'module-recordings': {
    title: 'Call Recordings & CDR',
    sub: 'Audit call recordings across all agents, filter by date, and stream audio directly'
  },
  'module-mapping': {
    title: 'DID Number Masking',
    sub: 'Universal BSNL DID masking configuration for Customers and Maids'
  },
  'module-tester': {
    title: 'Click-to-Call Tester',
    sub: 'Directly trigger and inspect outbound click-to-call routes on the PBX server'
  },
  'module-reports': {
    title: 'API Telephony Logs',
    sub: 'Historical records of all telephony API transactions, request latencies, and responses'
  },
  'module-auth': {
    title: 'System Health & Auth',
    sub: 'Validates the Bearer API Token against the remote PBX server endpoint'
  }
};

function switchModule(targetId) {
  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));

  const activeBtn = document.querySelector(`.menu-item[data-module="${targetId}"]`);
  const activeSec = document.getElementById(targetId);

  if (activeBtn) activeBtn.classList.add('active');
  if (activeSec) activeSec.classList.add('active');

  const titleEl = document.getElementById('moduleTitle');
  const subEl = document.getElementById('moduleSubtitle');

  if (adminModuleTitles[targetId]) {
    if (titleEl) titleEl.textContent = adminModuleTitles[targetId].title;
    if (subEl) subEl.textContent = adminModuleTitles[targetId].sub;
  }

  // Update URL hash without jumping
  const slug = targetId.replace(/^module-/, '').toLowerCase();
  if (history.pushState) {
    history.pushState(null, '', '#' + slug);
  } else {
    window.location.hash = '#' + slug;
  }

  // Trigger data loads
  if (targetId === 'module-dashboard' || targetId === 'module-agents') {
    loadAgentsList();
  }
  if (targetId === 'module-dashboard' || targetId === 'module-recordings' || targetId === 'module-reports') {
    loadRecordings();
  }
  if (targetId === 'module-auth') {
    checkSystemAuth();
  }
}

function refreshAdminDashboard() {
  loadAgentsList();
  loadRecordings();
  checkSystemAuth();
  showToast('Refreshing all PBX data...', 'info');
}

document.addEventListener('DOMContentLoaded', () => {

  // Sidebar Menu Click Handlers
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetModule = item.getAttribute('data-module');
      if (targetModule) {
        switchModule(targetModule);
      }
    });
  });

  // Handle URL Hash on Load
  const initialHash = window.location.hash.replace(/^#/, '').toLowerCase();
  const hashModuleMap = {
    'dashboard': 'module-dashboard',
    'agents': 'module-agents',
    'recordings': 'module-recordings',
    'mapping': 'module-mapping',
    'tester': 'module-tester',
    'clicktocall': 'module-tester',
    'reports': 'module-reports',
    'logs': 'module-reports',
    'auth': 'module-auth'
  };

  if (initialHash && hashModuleMap[initialHash]) {
    switchModule(hashModuleMap[initialHash]);
  } else {
    loadAgentsList();
    loadRecordings();
  }

  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace(/^#/, '').toLowerCase();
    if (hash && hashModuleMap[hash]) {
      switchModule(hashModuleMap[hash]);
    }
  });

  // Theme Toggle Button
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }

    themeToggleBtn.addEventListener('click', () => {
      const currentlyDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
      if (currentlyDark) {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (icon) icon.className = 'fa-solid fa-moon';
      } else {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (icon) icon.className = 'fa-solid fa-sun';
      }
    });
  }

  // Create Agent Form Handler
  const createAgentForm = document.getElementById('createAgentForm');
  if (createAgentForm) {
    createAgentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const agentCode = document.getElementById('newAgentCode').value.trim();
      const fullName = document.getElementById('newFullName').value.trim();
      const password = document.getElementById('newPassword').value.trim();
      const sipPeer = document.getElementById('newSipPeer').value.trim() || agentCode;
      const sipSecret = document.getElementById('newSipSecret').value.trim();

      try {
        const res = await fetch(getAdminApiUrl('agent_create'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify({
            agent_code: agentCode,
            full_name: fullName,
            password: password,
            sip_peer: sipPeer,
            sip_secret: sipSecret
          })
        });

        const data = await res.json();
        if (data.success) {
          showToast(`Agent '${agentCode}' created successfully!`, 'success');
          closeCreateAgentModal();
          createAgentForm.reset();
          loadAgentsList();
        } else {
          showToast(data.message || 'Failed to create agent', 'error');
        }
      } catch (err) {
        showToast('Error creating agent', 'error');
      }
    });
  }

  // Recordings filter form
  const recForm = document.getElementById('recordingsFilterForm');
  if (recForm) {
    recForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadRecordings();
    });
  }

  // Mapping Form
  const mapForm = document.getElementById('mappingForm');
  if (mapForm) {
    mapForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        booking_id: document.getElementById('mapBookingId').value.trim(),
        customer_id: document.getElementById('mapCustomerId').value.trim(),
        customer_number: document.getElementById('mapCustomerNumber').value.trim(),
        maid_id: document.getElementById('mapMaidId').value.trim(),
        maid_number: document.getElementById('mapMaidNumber').value.trim(),
        mask_did: document.getElementById('mapMaskDid').value.trim(),
        valid_from: document.getElementById('mapValidFrom').value.trim(),
        valid_until: document.getElementById('mapValidUntil').value.trim()
      };

      try {
        const res = await fetch(getAdminApiUrl('mapping'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        document.getElementById('mappingResponseJson').textContent = JSON.stringify(data, null, 2);
        if (data.success) {
          showToast(`Mapping active for Booking '${payload.booking_id}'!`, 'success');
        } else {
          showToast(data.message || 'Mapping failed', 'error');
        }
      } catch (err) {
        showToast('Server error executing mapping', 'error');
      }
    });
  }

  // Deactivate Mapping Form
  const deactForm = document.getElementById('deactivateForm');
  if (deactForm) {
    deactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bookingId = document.getElementById('deactBookingId').value.trim();
      const status = document.getElementById('deactStatus').value;

      try {
        const res = await fetch(getAdminApiUrl('mapping_deactivate'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify({ booking_id: bookingId, status: status })
        });
        const data = await res.json();
        document.getElementById('mappingResponseJson').textContent = JSON.stringify(data, null, 2);
        if (data.success) {
          showToast(`Mapping deactivated for Booking '${bookingId}'`, 'success');
        } else {
          showToast(data.message || 'Deactivation failed', 'error');
        }
      } catch (err) {
        showToast('Server error deactivating mapping', 'error');
      }
    });
  }

});

// Load Agents List & Overview Table
async function loadAgentsList() {
  const tbody = document.getElementById('agentsTableBody');
  const overviewTbody = document.getElementById('overviewAgentsTableBody');

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Agents...
        </td>
      </tr>
    `;
  }

  if (overviewTbody) {
    overviewTbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 8px;"></div> Loading Agents...
        </td>
      </tr>
    `;
  }

  try {
    const res = await fetch(getAdminApiUrl('agent_list'));
    const data = await res.json();

    if (data.success && Array.isArray(data.agents)) {
      let activeCount = 0;
      let totalCount = data.agents.length;

      // Update stat cards
      const totalStatEl = document.getElementById('statAdminTotalAgents');
      const availStatEl = document.getElementById('statAdminAvailableAgents');
      if (totalStatEl) totalStatEl.textContent = totalCount;

      let fullHtml = '';
      let overviewHtml = '';

      if (data.agents.length === 0) {
        fullHtml = `<tr><td colspan="7" style="text-align:center; padding: 20px; color:var(--text-muted);">No agents found.</td></tr>`;
        overviewHtml = `<tr><td colspan="5" style="text-align:center; padding: 16px; color:var(--text-muted);">No agents found.</td></tr>`;
      } else {
        data.agents.forEach(ag => {
          let statusBadge = '<span class="badge badge-purple"><i class="fa-solid fa-power-off" style="font-size:8px;"></i> offline</span>';
          if (ag.status === 'available') {
            statusBadge = '<span class="badge badge-emerald"><i class="fa-solid fa-circle" style="font-size:7px;"></i> available</span>';
            activeCount++;
          } else if (ag.status === 'break') {
            statusBadge = '<span class="badge badge-amber"><i class="fa-solid fa-pause" style="font-size:8px;"></i> on break</span>';
          }

          const isReg = ag.sip && ag.sip.registered;
          const regBadge = isReg 
            ? '<span class="badge badge-emerald"><i class="fa-solid fa-check" style="font-size:8px;"></i> Registered</span>' 
            : '<span class="badge" style="background:var(--bg-card-hover); color:var(--text-dim); border:1px solid var(--border-glass);">Unregistered</span>';

          fullHtml += `
            <tr>
              <td><strong style="color:var(--primary); font-weight:600;">${escapeHtml(ag.agent_code)}</strong></td>
              <td style="font-weight:500; color:var(--text-bright);">${escapeHtml(ag.full_name)}</td>
              <td><span class="token-code">${escapeHtml(ag.sip_tech || 'SIP')}/${escapeHtml(ag.sip_peer || ag.agent_code)}</span></td>
              <td><span class="token-code">${escapeHtml(ag.sip_secret || 'N/A')}</span></td>
              <td>${statusBadge}</td>
              <td>${regBadge}</td>
              <td>
                <button type="button" class="btn btn-danger btn-sm" onclick="deleteAgent(${ag.id}, '${escapeHtml(ag.agent_code)}')" title="Delete Agent">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;

          overviewHtml += `
            <tr>
              <td>
                <strong style="color:var(--text-bright); font-weight:600;">${escapeHtml(ag.full_name)}</strong>
                <div style="font-size: 11px; color: var(--text-dim);">Code: ${escapeHtml(ag.agent_code)}</div>
              </td>
              <td><span class="token-code">${escapeHtml(ag.sip_peer || ag.agent_code)}</span></td>
              <td>${statusBadge}</td>
              <td>${regBadge}</td>
              <td>
                <button type="button" class="btn btn-danger btn-sm" onclick="deleteAgent(${ag.id}, '${escapeHtml(ag.agent_code)}')" title="Delete Agent">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        });
      }

      if (availStatEl) availStatEl.textContent = activeCount;
      if (tbody) tbody.innerHTML = fullHtml;
      if (overviewTbody) overviewTbody.innerHTML = overviewHtml;

    } else {
      const errorMsg = `<tr><td colspan="7" style="text-align:center; padding: 20px; color:var(--accent-rose);">Failed to load agents: ${escapeHtml(data.message || 'Error')}</td></tr>`;
      if (tbody) tbody.innerHTML = errorMsg;
      if (overviewTbody) overviewTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px; color:var(--accent-rose);">Error loading agents</td></tr>`;
    }
  } catch (err) {
    console.error('Agents list error:', err);
    const connError = `<tr><td colspan="7" style="text-align:center; padding: 20px; color:var(--accent-rose);">Server connection error.</td></tr>`;
    if (tbody) tbody.innerHTML = connError;
    if (overviewTbody) overviewTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px; color:var(--accent-rose);">Connection error</td></tr>`;
  }
}

// Delete Agent
async function deleteAgent(agentId, agentCode) {
  if (!confirm(`Are you sure you want to delete agent '${agentCode}'?`)) return;

  try {
    const res = await fetch(getAdminApiUrl('agent_delete'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken()
      },
      body: JSON.stringify({ id: agentId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Agent '${agentCode}' deleted!`, 'success');
      loadAgentsList();
    } else {
      showToast(data.message || 'Failed to delete agent', 'error');
    }
  } catch (err) {
    showToast('Error deleting agent', 'error');
  }
}

// Load Recordings & Overview Call Activity
async function loadRecordings() {
  const tbody = document.getElementById('recordingsTableBody');
  const overviewCallsTbody = document.getElementById('overviewCallsTableBody');
  const logsTbody = document.getElementById('logsTableBody');

  const fromDateEl = document.getElementById('recFromDate');
  const toDateEl = document.getElementById('recToDate');
  const queryEl = document.getElementById('recSearchQuery');

  const fromDate = fromDateEl ? fromDateEl.value : '';
  const toDate = toDateEl ? toDateEl.value : '';
  const query = queryEl ? queryEl.value.trim() : '';

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 10px;"></div> Fetching Call Recordings...
        </td>
      </tr>
    `;
  }

  if (overviewCallsTbody) {
    overviewCallsTbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 8px;"></div> Fetching Call Activity...
        </td>
      </tr>
    `;
  }

  try {
    const queryParams = `from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&q=${encodeURIComponent(query)}&limit=50`;
    const res = await fetch(getAdminApiUrl('recordings', queryParams));
    const data = await res.json();

    if (data.success && Array.isArray(data.rows)) {
      const statCallsEl = document.getElementById('statAdminTotalCalls');
      if (statCallsEl) statCallsEl.textContent = data.rows.length;

      if (data.rows.length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color:var(--text-muted);">No call recordings found for selected date range.</td></tr>`;
        if (overviewCallsTbody) overviewCallsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px; color:var(--text-muted);">No recent call activity found.</td></tr>`;
        if (logsTbody) logsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color:var(--text-muted);">No transaction logs found.</td></tr>`;
        return;
      }

      let recHtml = '';
      let overviewCallsHtml = '';
      let logsHtml = '';

      data.rows.forEach((r, idx) => {
        let dispBadge = `<span class="badge badge-cyan">${escapeHtml(r.disposition || 'N/A')}</span>`;
        if (r.disposition === 'ANSWERED') {
          dispBadge = `<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> ANSWERED</span>`;
        } else if (r.disposition === 'FAILED' || r.disposition === 'NO ANSWER' || r.disposition === 'BUSY') {
          dispBadge = `<span class="badge badge-rose"><i class="fa-solid fa-xmark"></i> ${escapeHtml(r.disposition)}</span>`;
        }

        let audioControl = '<span style="color:var(--text-dim); font-size:12px;">No Audio</span>';
        if (r.play_id) {
          const isLaravel = document.querySelector('meta[name="csrf-token"]') !== null || window.location.pathname.includes('/admin');
          const streamUrl = isLaravel 
            ? `/api/telephony/stream_audio?kind=${encodeURIComponent(r.play_kind || 'recording')}&id=${encodeURIComponent(r.play_id)}`
            : `http://117.217.126.149:880/roottech/index.php?r=recording/play&kind=${r.play_kind || 'recording'}&id=${r.play_id}&token=11af5c25470d1306970a9175df8a1213da7435960305169f`;
          
          audioControl = `
            <a href="${streamUrl}" target="_blank" class="audio-btn">
              <i class="fa-solid fa-play"></i> Play
            </a>
          `;
        }

        recHtml += `
          <tr>
            <td><strong style="color:var(--text-bright);">#${r.id}</strong><br><span style="font-size:10px; color:var(--text-dim);">${escapeHtml(r.call_uuid || '')}</span></td>
            <td><span class="badge badge-purple">${escapeHtml(r.call_type || 'call')}</span></td>
            <td>${r.caller_number ? `<span class="token-code">${escapeHtml(r.caller_number)}</span>` : '<span style="color:var(--text-dim)">-</span>'}</td>
            <td>${r.destination_number ? `<span class="token-code">${escapeHtml(r.destination_number)}</span>` : '<span style="color:var(--text-dim)">-</span>'}</td>
            <td>${r.booking_id ? `<span class="badge badge-cyan">${escapeHtml(r.booking_id)}</span>` : '<span style="color:var(--text-dim)">-</span>'}</td>
            <td style="font-size:12px; color:var(--text-muted);">${escapeHtml(r.start_time || '')}</td>
            <td style="font-weight:600;">${r.duration || 0}s</td>
            <td>${dispBadge}</td>
            <td>${audioControl}</td>
          </tr>
        `;

        if (idx < 8) {
          overviewCallsHtml += `
            <tr>
              <td>
                <span class="badge badge-cyan">${escapeHtml(r.booking_id || ('#' + r.id))}</span>
                <div style="font-size: 10px; color: var(--text-dim); margin-top: 2px;">${escapeHtml(r.start_time || '')}</div>
              </td>
              <td><span class="token-code" style="font-size:11px;">${r.caller_number ? escapeHtml(r.caller_number) : '-'}</span></td>
              <td><span class="token-code" style="font-size:11px;">${r.destination_number ? escapeHtml(r.destination_number) : '-'}</span></td>
              <td><span style="font-weight:600;">${r.duration || 0}s</span><br>${dispBadge}</td>
              <td>${audioControl}</td>
            </tr>
          `;
        }

        logsHtml += `
          <tr>
            <td><strong style="color:var(--text-bright);">#${r.id}</strong></td>
            <td><span class="token-code">call/${escapeHtml(r.call_type || 'route')}</span></td>
            <td>${r.caller_number ? escapeHtml(r.caller_number) : '-'}</td>
            <td>${r.destination_number ? escapeHtml(r.destination_number) : '-'}</td>
            <td><span class="badge badge-emerald">200 OK</span></td>
            <td style="font-size:12px; color:var(--text-muted);">${escapeHtml(r.start_time || '')} (${r.duration || 0}s)</td>
          </tr>
        `;
      });

      if (tbody) tbody.innerHTML = recHtml;
      if (overviewCallsTbody) overviewCallsTbody.innerHTML = overviewCallsHtml;
      if (logsTbody) logsTbody.innerHTML = logsHtml;

    } else {
      if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color:var(--accent-rose);">Failed to load recordings: ${escapeHtml(data.message || 'Error')}</td></tr>`;
      if (overviewCallsTbody) overviewCallsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px; color:var(--accent-rose);">Failed to load recordings</td></tr>`;
      if (logsTbody) logsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color:var(--accent-rose);">Failed to load logs.</td></tr>`;
    }
  } catch (err) {
    console.error('Recordings error:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color:var(--accent-rose);">Server error loading recordings.</td></tr>`;
    if (overviewCallsTbody) overviewCallsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px; color:var(--accent-rose);">Server error</td></tr>`;
  }
}

// Click to Call Customer
async function triggerCallCustomer() {
  const btnCust = document.getElementById('adminBtnCallCustomer');
  const btnMaid = document.getElementById('adminBtnCallMaid');
  if (btnCust && btnMaid) {
    btnCust.classList.remove('btn-secondary');
    btnCust.classList.add('btn-primary', 'active');
    btnMaid.classList.remove('btn-primary', 'active');
    btnMaid.classList.add('btn-secondary');
  }

  const reqId = document.getElementById('callCustReqId').value.trim();
  const respElem = document.getElementById('callTesterResponse');
  respElem.textContent = 'Triggering POST call/customer...';

  try {
    const res = await fetch(getAdminApiUrl('customer'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken()
      },
      body: JSON.stringify({
        booking_id: 'BK202600123',
        source_extension: '1001',
        request_id: reqId
      })
    });
    const data = await res.json();
    respElem.textContent = JSON.stringify(data, null, 2);
    if (data.success) {
      showToast('Call Customer initiated!', 'success');
      pollCallStatus(reqId);
    } else {
      showToast(data.message || 'Call failed', 'error');
    }
  } catch (err) {
    respElem.textContent = 'Network / Server error triggering call.';
  }
}

// Click to Call Maid
async function triggerCallMaid() {
  const btnCust = document.getElementById('adminBtnCallCustomer');
  const btnMaid = document.getElementById('adminBtnCallMaid');
  if (btnCust && btnMaid) {
    btnMaid.classList.remove('btn-secondary');
    btnMaid.classList.add('btn-primary', 'active');
    btnCust.classList.remove('btn-primary', 'active');
    btnCust.classList.add('btn-secondary');
  }

  const reqId = document.getElementById('callMaidReqId').value.trim();
  const respElem = document.getElementById('callTesterResponse');
  respElem.textContent = 'Triggering POST call/maid...';

  try {
    const res = await fetch(getAdminApiUrl('call_maid'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken()
      },
      body: JSON.stringify({
        booking_id: 'BK202600123',
        source_extension: '1001',
        request_id: reqId
      })
    });
    const data = await res.json();
    respElem.textContent = JSON.stringify(data, null, 2);
    if (data.success) {
      showToast('Call Maid initiated!', 'success');
      pollCallStatus(reqId);
    } else {
      showToast(data.message || 'Call Maid failed', 'error');
    }
  } catch (err) {
    respElem.textContent = 'Network / Server error triggering call.';
  }
}

// Poll Call Status
async function pollCallStatus(reqId) {
  const respElem = document.getElementById('callTesterResponse');
  try {
    const res = await fetch(getAdminApiUrl('call_status', `request_id=${encodeURIComponent(reqId)}`));
    const data = await res.json();
    respElem.textContent = `=== LIVE STATUS FOR ${reqId} ===\n` + JSON.stringify(data, null, 2);
  } catch (e) {
    console.log('Status poll error', e);
  }
}

// Check System Auth
async function checkSystemAuth() {
  const elem = document.getElementById('authCheckResult');
  if (elem) elem.textContent = 'Running GET auth/check...';

  try {
    const res = await fetch(getAdminApiUrl('auth_check'));
    const data = await res.json();
    if (elem) elem.textContent = JSON.stringify(data, null, 2);
    
    const badge = document.getElementById('adminHealthBadge');
    if (data.success) {
      if (badge) {
        badge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-emerald); box-shadow:0 0 6px var(--accent-emerald);"></span><span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">PBX Online</span>`;
      }
      showToast('System Auth Health Check OK!', 'success');
    } else {
      if (badge) {
        badge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-rose); box-shadow:0 0 6px var(--accent-rose);"></span><span style="font-size: 11px; color: var(--accent-rose); font-weight: 600;">PBX Error</span>`;
      }
      showToast('System Auth Check Failed!', 'error');
    }
  } catch (err) {
    if (elem) elem.textContent = 'Error executing auth check.';
    showToast('Network error', 'error');
  }
}

// Modal controls
function openCreateAgentModal() {
  const m = document.getElementById('createAgentModal');
  if (m) {
    m.classList.add('open');
    m.style.display = 'flex';
  }
}

function closeCreateAgentModal() {
  const m = document.getElementById('createAgentModal');
  if (m) {
    m.classList.remove('open');
    m.style.display = 'none';
  }
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
