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
  'module-pbx': {
    title: 'PBX, Queues & IVR Routing',
    sub: 'Manage call queues, IVR auto-attendant menus, inbound DID routes, and reload Asterisk dialplans'
  },
  'module-auth': {
    title: 'System Health & Auth',
    sub: 'Validates the Bearer API Token against the remote PBX server endpoint'
  }
};

const hashModuleMap = {
  'dashboard': 'module-dashboard',
  'agents': 'module-agents',
  'recordings': 'module-recordings',
  'mapping': 'module-mapping',
  'tester': 'module-tester',
  'clicktocall': 'module-tester',
  'reports': 'module-reports',
  'logs': 'module-reports',
  'pbx': 'module-pbx',
  'queues': 'module-pbx',
  'ivr': 'module-pbx',
  'auth': 'module-auth'
};

function switchModule(targetId, updateHash = true) {
  if (!targetId || !document.getElementById(targetId)) {
    targetId = 'module-dashboard';
  }

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

  // Save active tab preference so it persists across refreshes
  try {
    localStorage.setItem('admin_active_tab', targetId);
  } catch (e) {}

  // Update URL hash without forcing scroll jump
  const slug = targetId.replace(/^module-/, '').toLowerCase();
  if (updateHash) {
    if (history.pushState) {
      history.pushState(null, '', '#' + slug);
    } else {
      window.location.hash = '#' + slug;
    }
  }

  // Trigger targeted data loads for the active view
  if (targetId === 'module-dashboard') {
    loadAgentsList();
    loadRecordings();
  } else if (targetId === 'module-agents') {
    loadAgentsList();
  } else if (targetId === 'module-recordings' || targetId === 'module-reports') {
    loadRecordings();
  } else if (targetId === 'module-pbx') {
    loadPbxOverview();
  } else if (targetId === 'module-auth') {
    checkSystemAuth();
  }
}

function refreshAdminDashboard() {
  const activeSec = document.querySelector('.module-section.active');
  const currentId = activeSec ? activeSec.id : 'module-dashboard';

  if (currentId === 'module-dashboard') {
    loadAgentsList();
    loadRecordings();
    showToast('Refreshed Dashboard overview data', 'info');
  } else if (currentId === 'module-agents') {
    loadAgentsList();
    showToast('Refreshed Agents & Extensions list', 'info');
  } else if (currentId === 'module-recordings' || currentId === 'module-reports') {
    loadRecordings();
    showToast('Refreshed Call Recordings & Activity', 'info');
  } else if (currentId === 'module-pbx') {
    loadPbxOverview();
    showToast('Refreshed PBX Queues, IVRs & Inbound routes', 'info');
  } else if (currentId === 'module-auth') {
    checkSystemAuth();
    showToast('Running System Auth Health Check...', 'info');
  } else {
    showToast('Data refreshed', 'info');
  }
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

document.addEventListener('DOMContentLoaded', () => {

  // Sidebar Menu Click Handlers
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetModule = item.getAttribute('data-module');
      if (targetModule) {
        switchModule(targetModule, true);
        toggleMobileSidebar(true); // Auto close sidebar on mobile after selection
      }
    });
  });

  // Resolve initial active tab on page refresh
  const initialHash = window.location.hash.replace(/^#/, '').toLowerCase();
  let savedTab = null;
  try {
    savedTab = localStorage.getItem('admin_active_tab');
  } catch (e) {}

  let resolvedModule = 'module-dashboard';
  if (initialHash && hashModuleMap[initialHash]) {
    resolvedModule = hashModuleMap[initialHash];
  } else if (savedTab && document.getElementById(savedTab)) {
    resolvedModule = savedTab;
  }

  // Activate the resolved tab immediately
  switchModule(resolvedModule, false);

  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace(/^#/, '').toLowerCase();
    if (hash && hashModuleMap[hash]) {
      switchModule(hashModuleMap[hash], false);
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

  // Create Queue Form
  const createQueueForm = document.getElementById('createQueueForm');
  if (createQueueForm) {
    createQueueForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selectedAgentIds = Array.from(document.querySelectorAll('.queue-agent-chk:checked')).map(chk => parseInt(chk.value));
      const payload = {
        name: document.getElementById('newQueueName').value.trim(),
        display_name: document.getElementById('newQueueDisplayName').value.trim(),
        strategy: document.getElementById('newQueueStrategy').value,
        wait_seconds: parseInt(document.getElementById('newQueueWaitSec').value || 120),
        agent_ids: selectedAgentIds
      };

      try {
        const res = await fetch(getAdminApiUrl('pbx_queue'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Queue '${payload.name}' saved successfully!`, 'success');
          closeCreateQueueModal();
          createQueueForm.reset();
          loadPbxOverview();
        } else {
          showToast(data.message || 'Failed to save queue', 'error');
        }
      } catch (err) {
        showToast('Error saving queue', 'error');
      }
    });
  }

  // Create IVR Form
  const createIvrForm = document.getElementById('createIvrForm');
  if (createIvrForm) {
    createIvrForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const options = [];
      const d1 = document.getElementById('ivrOptDigit1').value.trim();
      if (d1) options.push({ digit: d1, dest_type: document.getElementById('ivrOptType1').value, dest_value: document.getElementById('ivrOptValue1').value.trim() });

      const d2 = document.getElementById('ivrOptDigit2').value.trim();
      if (d2) options.push({ digit: d2, dest_type: document.getElementById('ivrOptType2').value, dest_value: document.getElementById('ivrOptValue2').value.trim() });

      const d3 = document.getElementById('ivrOptDigit3').value.trim();
      if (d3) options.push({ digit: d3, dest_type: document.getElementById('ivrOptType3').value, dest_value: document.getElementById('ivrOptValue3').value.trim() });

      const payload = {
        name: document.getElementById('newIvrName').value.trim(),
        feature_exten: document.getElementById('newIvrExten').value.trim(),
        greeting: document.getElementById('newIvrGreeting').value,
        timeout_sec: parseInt(document.getElementById('newIvrTimeout').value || 8),
        options: options
      };

      try {
        const res = await fetch(getAdminApiUrl('pbx_ivr'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`IVR '${payload.name}' created successfully!`, 'success');
          closeCreateIvrModal();
          createIvrForm.reset();
          loadPbxOverview();
        } else {
          showToast(data.message || 'Failed to create IVR', 'error');
        }
      } catch (err) {
        showToast('Error creating IVR', 'error');
      }
    });
  }

  // Upload Greeting Form
  const uploadGreetingForm = document.getElementById('uploadGreetingForm');
  if (uploadGreetingForm) {
    uploadGreetingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('greetingAudioFile');
      const slugInput = document.getElementById('greetingSlugName');

      if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please select an audio file', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      if (slugInput.value.trim()) {
        formData.append('name', slugInput.value.trim());
      }

      try {
        const isLaravel = document.querySelector('meta[name="csrf-token"]') !== null || window.location.pathname.includes('/admin');
        const uploadUrl = isLaravel ? '/api/telephony/pbx_ivr_greeting' : 'api.php?action=pbx_ivr_greeting';

        const headers = {};
        const csrf = getCsrfToken();
        if (csrf) headers['X-CSRF-TOKEN'] = csrf;

        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: headers,
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          showToast(`Greeting audio '${data.slug || ''}' uploaded successfully!`, 'success');
          closeUploadGreetingModal();
          uploadGreetingForm.reset();
          loadPbxOverview();
        } else {
          showToast(data.message || 'Upload failed', 'error');
        }
      } catch (err) {
        showToast('Error uploading greeting', 'error');
      }
    });
  }

  // Create Inbound Route Form
  const createInboundForm = document.getElementById('createInboundForm');
  if (createInboundForm) {
    createInboundForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        did: document.getElementById('newInboundDid').value.trim(),
        dest_type: document.getElementById('newInboundType').value,
        dest_value: document.getElementById('newInboundValue').value.trim()
      };

      try {
        const res = await fetch(getAdminApiUrl('pbx_inbound'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Inbound route saved!`, 'success');
          closeCreateInboundModal();
          createInboundForm.reset();
          loadPbxOverview();
        } else {
          showToast(data.message || 'Failed to save inbound route', 'error');
        }
      } catch (err) {
        showToast('Error saving inbound route', 'error');
      }
    });
  }

});

// Load Agents List & Overview Table
let cachedAgentPermissions = {};

async function loadAgentsList() {
  const tbody = document.getElementById('agentsTableBody');
  const overviewTbody = document.getElementById('overviewAgentsTableBody');

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Agents & Permissions...
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
    // Parallel fetch agents and their permissions
    const [agentsRes, permsRes] = await Promise.all([
      fetch(getAdminApiUrl('agent_list')),
      fetch(getAdminApiUrl('all_agents_permissions'))
    ]);

    const data = await agentsRes.json();
    let permsData = {};
    try {
      permsData = await permsRes.json();
      if (permsData.success && permsData.permissions) {
        cachedAgentPermissions = permsData.permissions;
      }
    } catch (pe) {}

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
        fullHtml = `<tr><td colspan="8" style="text-align:center; padding: 20px; color:var(--text-muted);">No agents found.</td></tr>`;
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

          // Compute Allowed Modules Badges
          const agentPermRecord = cachedAgentPermissions[ag.agent_code];
          const allowedList = agentPermRecord && Array.isArray(agentPermRecord.allowed_modules)
            ? agentPermRecord.allowed_modules
            : (ag.agent_code === 'admin' ? ['dashboard', 'call', 'agents', 'mapping', 'recordings', 'reports'] : ['dashboard', 'call', 'agents', 'recordings']);

          let permBadgesHtml = '<div style="display:flex; flex-wrap:wrap; gap:4px; max-width:220px;">';
          if (allowedList.includes('call')) permBadgesHtml += `<span class="badge badge-emerald" style="font-size:10px; padding:2px 6px;">Call</span>`;
          if (allowedList.includes('recordings')) permBadgesHtml += `<span class="badge badge-cyan" style="font-size:10px; padding:2px 6px;">Recordings</span>`;
          if (allowedList.includes('agents')) permBadgesHtml += `<span class="badge badge-purple" style="font-size:10px; padding:2px 6px;">Directory</span>`;
          if (allowedList.includes('mapping')) permBadgesHtml += `<span class="badge badge-amber" style="font-size:10px; padding:2px 6px;">Masking</span>`;
          if (allowedList.includes('reports')) permBadgesHtml += `<span class="badge badge-rose" style="font-size:10px; padding:2px 6px;">Reports</span>`;
          permBadgesHtml += '</div>';

          fullHtml += `
            <tr>
              <td><strong style="color:var(--primary); font-weight:600;">${escapeHtml(ag.agent_code)}</strong></td>
              <td style="font-weight:500; color:var(--text-bright);">${escapeHtml(ag.full_name)}</td>
              <td><span class="token-code">${escapeHtml(ag.sip_tech || 'SIP')}/${escapeHtml(ag.sip_peer || ag.agent_code)}</span></td>
              <td><span class="token-code">${escapeHtml(ag.sip_secret || 'N/A')}</span></td>
              <td>${statusBadge}</td>
              <td>${regBadge}</td>
              <td>${permBadgesHtml}</td>
              <td style="white-space:nowrap;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="openAgentPermissionsModal('${escapeHtml(ag.agent_code)}', '${escapeHtml(ag.full_name)}')" title="Set Allowed Modules & Permissions" style="margin-right: 6px; padding: 4px 8px; font-size: 11px;">
                  <i class="fa-solid fa-shield-halved" style="color:var(--primary);"></i> Permissions
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="deleteAgent(${ag.id}, '${escapeHtml(ag.agent_code)}')" title="Delete Agent" style="padding: 4px 8px; font-size: 11px;">
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
                <button type="button" class="btn btn-secondary btn-sm" onclick="openAgentPermissionsModal('${escapeHtml(ag.agent_code)}', '${escapeHtml(ag.full_name)}')" title="Permissions" style="margin-right:4px; padding:3px 7px; font-size:11px;">
                  <i class="fa-solid fa-shield-halved"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="deleteAgent(${ag.id}, '${escapeHtml(ag.agent_code)}')" title="Delete Agent" style="padding:3px 7px; font-size:11px;">
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
      const errorMsg = `<tr><td colspan="8" style="text-align:center; padding: 20px; color:var(--accent-rose);">Failed to load agents: ${escapeHtml(data.message || 'Error')}</td></tr>`;
      if (tbody) tbody.innerHTML = errorMsg;
      if (overviewTbody) overviewTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px; color:var(--accent-rose);">Error loading agents</td></tr>`;
    }
  } catch (err) {
    console.error('Agents list error:', err);
    const connError = `<tr><td colspan="8" style="text-align:center; padding: 20px; color:var(--accent-rose);">Server connection error.</td></tr>`;
    if (tbody) tbody.innerHTML = connError;
    if (overviewTbody) overviewTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px; color:var(--accent-rose);">Connection error</td></tr>`;
  }
}

// ─── AGENT PERMISSIONS MODAL HANDLERS ─────────────────────────────────────────
async function openAgentPermissionsModal(agentCode, agentName) {
  const modal = document.getElementById('agentPermissionsModal');
  const targetCodeEl = document.getElementById('permTargetAgentCode');
  const modalAgentNameEl = document.getElementById('permModalAgentName');
  const modalAgentCodeEl = document.getElementById('permModalAgentCode');

  if (targetCodeEl) targetCodeEl.value = agentCode;
  if (modalAgentNameEl) modalAgentNameEl.textContent = agentName || agentCode;
  if (modalAgentCodeEl) modalAgentCodeEl.textContent = agentCode;

  // Reset checkboxes
  const allCheckboxIds = ['perm_dashboard', 'perm_call', 'perm_agents', 'perm_mapping', 'perm_recordings', 'perm_reports'];
  allCheckboxIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  // Fetch current permissions
  try {
    const res = await fetch(getAdminApiUrl('get_permissions', `agent_code=${encodeURIComponent(agentCode)}`));
    const data = await res.json();
    if (data.success && Array.isArray(data.allowed_modules)) {
      data.allowed_modules.forEach(mod => {
        const cb = document.getElementById('perm_' + mod);
        if (cb) cb.checked = true;
      });
    } else {
      // Default: dashboard, call, agents, recordings
      ['perm_dashboard', 'perm_call', 'perm_agents', 'perm_recordings'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = true;
      });
    }
  } catch (e) {
    ['perm_dashboard', 'perm_call', 'perm_agents', 'perm_recordings'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = true;
    });
  }

  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
  }
}

function closeAgentPermissionsModal() {
  const modal = document.getElementById('agentPermissionsModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

function setPermissionPreset(preset) {
  const map = {
    'all': ['perm_dashboard', 'perm_call', 'perm_agents', 'perm_mapping', 'perm_recordings', 'perm_reports'],
    'default': ['perm_dashboard', 'perm_call', 'perm_agents', 'perm_recordings'],
    'readonly': ['perm_dashboard', 'perm_agents', 'perm_recordings']
  };

  const allIds = ['perm_dashboard', 'perm_call', 'perm_agents', 'perm_mapping', 'perm_recordings', 'perm_reports'];
  const toCheck = map[preset] || map['default'];

  allIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = toCheck.includes(id);
  });
}

async function saveAgentPermissions(e) {
  if (e) e.preventDefault();
  const agentCode = document.getElementById('permTargetAgentCode').value.trim();
  const btn = document.getElementById('btnSavePermissions');

  const allModules = ['dashboard', 'call', 'agents', 'mapping', 'recordings', 'reports'];
  const allowed = [];

  allModules.forEach(mod => {
    const cb = document.getElementById('perm_' + mod);
    if (cb && cb.checked) {
      allowed.push(mod);
    }
  });

  // Always ensure dashboard is included
  if (!allowed.includes('dashboard')) {
    allowed.unshift('dashboard');
  }

  let origBtn = '';
  if (btn) {
    origBtn = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div> <span>Saving...</span>`;
  }

  try {
    const res = await fetch(getAdminApiUrl('save_permissions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken()
      },
      body: JSON.stringify({
        agent_code: agentCode,
        allowed_modules: allowed
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message || `Permissions saved for agent '${agentCode}'!`, 'success');
      closeAgentPermissionsModal();
      loadAgentsList();
    } else {
      showToast(data.message || 'Failed to save permissions', 'error');
    }
  } catch (err) {
    showToast('Error saving permissions', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtn;
    }
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

  if (window.telephonySimulator && window.telephonySimulator.isSimulator()) {
    respElem.textContent = `[SIMULATOR ACTIVE] Initiating Outbound Call to Customer via Extension 1001...\nRequest ID: ${reqId}\nStatus: ORIGINATING -> CONNECTED`;
    window.telephonySimulator.simulateOutboundCall('customer', 'BK202600123');
    return;
  }

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
      if (data.error_code === 'AGENT_NOT_REGISTERED' || (data.message && data.message.includes('not registered'))) {
        respElem.textContent += '\n\n💡 TIP: SIP 1001 softphone is offline. Click "Test via Browser Simulator" in top header or quick action to test calling without Zoiper!';
      }
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

  if (window.telephonySimulator && window.telephonySimulator.isSimulator()) {
    respElem.textContent = `[SIMULATOR ACTIVE] Initiating Outbound Call to Maid via Extension 1001...\nRequest ID: ${reqId}\nStatus: ORIGINATING -> CONNECTED`;
    window.telephonySimulator.simulateOutboundCall('maid', 'BK202600123');
    return;
  }

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
      if (data.error_code === 'AGENT_NOT_REGISTERED' || (data.message && data.message.includes('not registered'))) {
        respElem.textContent += '\n\n💡 TIP: SIP 1001 softphone is offline. Click "Test via Browser Simulator" in top header or quick action to test calling without Zoiper!';
      }
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

// ── PBX Overview & Management ──────────────────────────────────────────────────
let pbxCache = null;

async function loadPbxOverview() {
  const queuesContainer = document.getElementById('pbxQueuesContainer');
  const ivrsContainer = document.getElementById('pbxIvrsContainer');
  const greetingsContainer = document.getElementById('pbxGreetingsContainer');
  const inboundContainer = document.getElementById('pbxInboundContainer');

  if (queuesContainer) queuesContainer.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted);"><div class="spinner" style="margin:0 auto 10px;"></div>Loading Queues...</div>';
  if (ivrsContainer) ivrsContainer.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted);"><div class="spinner" style="margin:0 auto 10px;"></div>Loading IVRs...</div>';

  try {
    const res = await fetch(getAdminApiUrl('pbx'));
    const data = await res.json();
    pbxCache = data;

    if (data.success) {
      const queues = data.queues || [];
      const ivrs = data.ivrs || [];
      const customGreetings = data.custom_greetings || [];
      const stockGreetings = data.greetings || [];
      const inbounds = data.inbound_routes || [];

      // Update Top Stats
      const elQ = document.getElementById('statPbxQueues');
      const elI = document.getElementById('statPbxIvrs');
      const elG = document.getElementById('statPbxGreetings');
      const elR = document.getElementById('statPbxInbound');

      if (elQ) elQ.textContent = queues.length;
      if (elI) elI.textContent = ivrs.length;
      if (elG) elG.textContent = stockGreetings.length + customGreetings.length;
      if (elR) elR.textContent = inbounds.length;

      renderPbxQueues(queues);
      renderPbxIvrs(ivrs);
      renderPbxGreetings(stockGreetings, customGreetings);
      renderPbxInbounds(inbounds);
    } else {
      showToast('Failed to load PBX overview', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error fetching PBX details', 'error');
  }
}

function renderPbxQueues(queues) {
  const container = document.getElementById('pbxQueuesContainer');
  if (!container) return;

  if (queues.length === 0) {
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);"><i class="fa-solid fa-inbox" style="font-size:24px; margin-bottom:8px; display:block; opacity:0.5;"></i>No call queues configured.</div>';
    return;
  }

  let html = `
    <div class="table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Queue Name</th>
            <th>Display Label</th>
            <th>Strategy</th>
            <th>Timeout</th>
            <th>Assigned Agents</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  queues.forEach(q => {
    const agentBadges = (q.agents || []).map(a => 
      `<span class="badge badge-cyan" style="margin:2px;"><i class="fa-solid fa-user" style="font-size:9px;"></i> ${escapeHtml(a.agent_code || a.sip_peer)} (${escapeHtml(a.full_name)})</span>`
    ).join('') || '<span style="color:var(--text-dim); font-size:12px;">No assigned agents</span>';

    const isDefault = (q.name === 'root-support');

    html += `
      <tr>
        <td><strong style="color:var(--text-bright);"><span class="badge badge-purple">${escapeHtml(q.name)}</span></strong></td>
        <td style="font-weight:500; color:var(--text-bright);">${escapeHtml(q.display_name || q.name)}</td>
        <td><span class="token-code">${escapeHtml(q.strategy || 'rrmemory')}</span></td>
        <td><span style="font-weight:600; color:var(--text-main);">${escapeHtml(q.wait_seconds || 120)}s</span></td>
        <td>${agentBadges}</td>
        <td style="text-align:right;">
          ${isDefault 
            ? '<span class="badge badge-emerald" title="System default queue cannot be deleted"><i class="fa-solid fa-lock"></i> Default</span>' 
            : `<button class="btn btn-sm btn-danger" onclick="deletePbxQueue(${q.id})" title="Delete Queue"><i class="fa-solid fa-trash-can"></i> Delete</button>`
          }
        </td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function renderPbxIvrs(ivrs) {
  const container = document.getElementById('pbxIvrsContainer');
  if (!container) return;

  if (ivrs.length === 0) {
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);"><i class="fa-solid fa-sitemap" style="font-size:24px; margin-bottom:8px; display:block; opacity:0.5;"></i>No IVR menus configured.</div>';
    return;
  }

  let html = `
    <div class="table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th>IVR Name</th>
            <th>Exten</th>
            <th>Greeting Audio</th>
            <th>DTMF Keypress Routing Options</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  ivrs.forEach(ivr => {
    const optionsList = (ivr.options || []).map(opt => {
      let bClass = 'badge-emerald';
      if (opt.dest_type === 'queue') bClass = 'badge-purple';
      if (opt.dest_type === 'hangup') bClass = 'badge-rose';

      return `<span class="badge ${bClass}" style="margin:2px;"><b>[${escapeHtml(opt.digit)}]</b> &rarr; ${escapeHtml(opt.dest_type)}: ${escapeHtml(opt.dest_value || '')}</span>`;
    }).join(' ') || '<span style="color:var(--text-dim); font-size:12px;">No options</span>';

    html += `
      <tr>
        <td><strong style="color:var(--text-bright);">${escapeHtml(ivr.name)}</strong></td>
        <td><span class="token-code"><i class="fa-solid fa-hashtag" style="font-size:10px;"></i> ${escapeHtml(ivr.feature_exten || '')}</span></td>
        <td><span class="token-code"><i class="fa-solid fa-volume-high" style="font-size:10px; color:var(--accent-cyan);"></i> ${escapeHtml(ivr.greeting || 'hello')}</span></td>
        <td>${optionsList}</td>
        <td style="text-align:right;">
          <button class="btn btn-sm btn-danger" onclick="deletePbxIvr(${ivr.id})" title="Delete IVR Menu">
            <i class="fa-solid fa-trash-can"></i> Delete
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function renderPbxGreetings(greetings, customGreetings) {
  const container = document.getElementById('pbxGreetingsContainer');
  if (!container) return;

  // Populate IVR dropdown with greetings if available
  const ivrGreetingSelect = document.getElementById('newIvrGreeting');
  if (ivrGreetingSelect && Array.isArray(greetings)) {
    ivrGreetingSelect.innerHTML = greetings.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">';

  if (customGreetings && customGreetings.length > 0) {
    customGreetings.forEach(cg => {
      const audioUrl = `http://117.217.126.149:880/roottech/index.php?r=pbx/ivr/greeting/play&name=${encodeURIComponent(cg.slug)}&token=11af5c25470d1306970a9175df8a1213da7435960305169f`;

      html += `
        <div class="glass-panel" style="padding: 12px 16px; margin:0; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-glass);">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:32px; height:32px; border-radius:var(--radius-sm); background:var(--badge-cyan-bg); display:flex; align-items:center; justify-content:center; color:var(--accent-cyan);">
              <i class="fa-solid fa-file-audio"></i>
            </div>
            <div>
              <div style="font-weight:600; color:var(--text-bright); font-size:13px;">${escapeHtml(cg.label || cg.slug)}</div>
              <div style="font-size:11px; color:var(--text-dim);">${cg.bytes || 0} bytes • WAV (8kHz)</div>
            </div>
          </div>
          <a href="${audioUrl}" target="_blank" class="btn btn-sm btn-secondary" style="display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
            <i class="fa-solid fa-play" style="color:var(--accent-emerald);"></i> Play
          </a>
        </div>
      `;
    });
  } else {
    html += `
      <div style="grid-column: 1 / -1; padding: 16px; background: var(--bg-card-hover); border-radius: var(--radius-md); border: 1px solid var(--border-glass); color: var(--text-muted); font-size: 13px;">
        <i class="fa-solid fa-circle-info" style="color: var(--accent-cyan); margin-right: 6px;"></i>
        Stock Asterisk prompts active (<code>hello</code>, <code>hello-world</code>, <code>one-moment-please</code>, <code>demo-thanks</code>, <code>goodbye</code>). Use <b>Upload Greeting Audio</b> to add custom business prompts.
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
}

function renderPbxInbounds(routes) {
  const container = document.getElementById('pbxInboundContainer');
  if (!container) return;

  if (routes.length === 0) {
    container.innerHTML = `
      <div style="padding:16px 20px; background:var(--bg-card-hover); border-radius:var(--radius-md); border:1px solid var(--border-glass); color:var(--text-muted); font-size:13px; display:flex; align-items:center; gap:10px;">
        <i class="fa-solid fa-circle-check" style="color:var(--accent-emerald); font-size:16px;"></i>
        <span>Default Inbound Flow active: Unmapped PSTN callers automatically ring the <b><span class="badge badge-purple">root-support</span></b> queue.</span>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th>DID Phone Number</th>
            <th>Destination Type</th>
            <th>Target Destination</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  routes.forEach(r => {
    html += `
      <tr>
        <td><strong><span class="token-code">${escapeHtml(r.did || 'Default / All')}</span></strong></td>
        <td><span class="badge badge-cyan">${escapeHtml(r.dest_type)}</span></td>
        <td><span class="badge badge-purple">${escapeHtml(r.dest_value)}</span></td>
        <td style="text-align:right;">
          <button class="btn btn-sm btn-danger" onclick="deletePbxInbound(${r.id})" title="Delete Inbound Route">
            <i class="fa-solid fa-trash-can"></i> Delete
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

async function applyPbxDialplan() {
  const btn = document.getElementById('btnApplyPbx');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Applying Dialplan...';
  }

  try {
    const res = await fetch(getAdminApiUrl('pbx_apply'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken()
      },
      body: JSON.stringify({})
    });
    const data = await res.json();

    if (data.success) {
      showToast('Asterisk Dialplan successfully regenerated & reloaded!', 'success');
      loadPbxOverview();
    } else {
      showToast(data.message || 'Failed to apply dialplan', 'error');
    }
  } catch (err) {
    showToast('Network error while applying dialplan', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Apply & Reload Asterisk Dialplan';
    }
  }
}

async function deletePbxQueue(id) {
  if (!confirm('Are you sure you want to delete this queue?')) return;
  try {
    const res = await fetch(getAdminApiUrl('pbx_queue_delete'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken()
      },
      body: JSON.stringify({ id: id })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Queue deleted successfully', 'success');
      loadPbxOverview();
    } else {
      showToast(data.message || 'Failed to delete queue', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function deletePbxIvr(id) {
  if (!confirm('Are you sure you want to delete this IVR menu?')) return;
  try {
    const res = await fetch(getAdminApiUrl('pbx_ivr_delete'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken()
      },
      body: JSON.stringify({ id: id })
    });
    const data = await res.json();
    if (data.success) {
      showToast('IVR menu deleted successfully', 'success');
      loadPbxOverview();
    } else {
      showToast(data.message || 'Failed to delete IVR menu', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function deletePbxInbound(id) {
  if (!confirm('Are you sure you want to delete this Inbound DID route?')) return;
  try {
    const res = await fetch(getAdminApiUrl('pbx_inbound_delete'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken()
      },
      body: JSON.stringify({ id: id })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Inbound route removed successfully', 'success');
      loadPbxOverview();
    } else {
      showToast(data.message || 'Failed to remove route', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

// ── Modal Controls ─────────────────────────────────────────────────────────────
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

function openCreateQueueModal() {
  const m = document.getElementById('createQueueModal');
  const chkContainer = document.getElementById('queueAgentsCheckboxContainer');
  if (chkContainer && pbxCache && pbxCache.agents) {
    chkContainer.innerHTML = pbxCache.agents.map(ag => `
      <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; color: var(--text-bright); cursor: pointer;">
        <input type="checkbox" class="queue-agent-chk" value="${ag.id}" checked>
        <span><b>${escapeHtml(ag.agent_code || ag.sip_peer)}</b> - ${escapeHtml(ag.full_name)}</span>
      </label>
    `).join('');
  }
  if (m) {
    m.classList.add('open');
    m.style.display = 'flex';
  }
}

function closeCreateQueueModal() {
  const m = document.getElementById('createQueueModal');
  if (m) {
    m.classList.remove('open');
    m.style.display = 'none';
  }
}

function openCreateIvrModal() {
  const m = document.getElementById('createIvrModal');
  if (m) {
    m.classList.add('open');
    m.style.display = 'flex';
  }
}

function closeCreateIvrModal() {
  const m = document.getElementById('createIvrModal');
  if (m) {
    m.classList.remove('open');
    m.style.display = 'none';
  }
}

function openUploadGreetingModal() {
  const m = document.getElementById('uploadGreetingModal');
  if (m) {
    m.classList.add('open');
    m.style.display = 'flex';
  }
}

function closeUploadGreetingModal() {
  const m = document.getElementById('uploadGreetingModal');
  if (m) {
    m.classList.remove('open');
    m.style.display = 'none';
  }
}

function openCreateInboundModal() {
  const m = document.getElementById('createInboundModal');
  if (m) {
    m.classList.add('open');
    m.style.display = 'flex';
  }
}

function closeCreateInboundModal() {
  const m = document.getElementById('createInboundModal');
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
