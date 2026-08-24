document.addEventListener('DOMContentLoaded', () => {

  // Tab switching handler
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetTabId = btn.getAttribute('data-tab');
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) {
        targetPane.classList.add('active');
      }

      // Auto load tab data
      if (targetTabId === 'tabAgents') {
        loadAgentsList();
      } else if (targetTabId === 'tabRecordings') {
        loadRecordings();
      }
    });
  });

  // Load agents list on page load
  loadAgentsList();

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
        const res = await fetch('api.php?action=agent_create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        const res = await fetch('api.php?action=mapping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        const res = await fetch('api.php?action=mapping_deactivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

// Load Agents List
async function loadAgentsList() {
  const tbody = document.getElementById('agentsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
        <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Agents...
      </td>
    </tr>
  `;

  try {
    const res = await fetch('api.php?action=agent_list');
    const data = await res.json();

    if (data.success && Array.isArray(data.agents)) {
      tbody.innerHTML = '';
      if (data.agents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">No agents found.</td></tr>`;
        return;
      }

      data.agents.forEach(ag => {
        const tr = document.createElement('tr');
        
        let statusBadge = '<span class="badge badge-purple">offline</span>';
        if (ag.status === 'available') {
          statusBadge = '<span class="badge badge-emerald">available</span>';
        } else if (ag.status === 'break') {
          statusBadge = '<span class="badge badge-cyan" style="background:rgba(245,158,11,0.2); color:#fcd34d;">on break</span>';
        }

        const isReg = ag.sip && ag.sip.registered;
        const regBadge = isReg 
          ? '<span class="badge badge-emerald">REGISTERED</span>' 
          : '<span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-dim);">UNREGISTERED</span>';

        tr.innerHTML = `
          <td><strong style="color:#a5b4fc;">${escapeHtml(ag.agent_code)}</strong></td>
          <td>${escapeHtml(ag.full_name)}</td>
          <td><span class="token-code">${escapeHtml(ag.sip_tech || 'SIP')}/${escapeHtml(ag.sip_peer || ag.agent_code)}</span></td>
          <td><span class="token-code">${escapeHtml(ag.sip_secret || 'N/A')}</span></td>
          <td>${statusBadge}</td>
          <td>${regBadge}</td>
          <td>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteAgent(${ag.id}, '${ag.agent_code}')" title="Delete Agent">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color:#fca5a5;">Failed to load agents: ${escapeHtml(data.message || 'Error')}</td></tr>`;
    }
  } catch (err) {
    console.error('Agents list error:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color:#fca5a5;">Server connection error.</td></tr>`;
  }
}

// Delete Agent
async function deleteAgent(agentId, agentCode) {
  if (!confirm(`Are you sure you want to delete agent '${agentCode}'?`)) return;

  try {
    const res = await fetch('api.php?action=agent_delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

// Load Recordings
async function loadRecordings() {
  const tbody = document.getElementById('recordingsTableBody');
  if (!tbody) return;

  const fromDate = document.getElementById('recFromDate').value;
  const toDate = document.getElementById('recToDate').value;
  const query = document.getElementById('recSearchQuery').value.trim();

  tbody.innerHTML = `
    <tr>
      <td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">
        <div class="spinner" style="margin: 0 auto 10px;"></div> Fetching Call Recordings...
      </td>
    </tr>
  `;

  try {
    const url = `api.php?action=recordings&from=${fromDate}&to=${toDate}&q=${encodeURIComponent(query)}&limit=50`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success && Array.isArray(data.rows)) {
      tbody.innerHTML = '';
      if (data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px;">No call recordings found for selected date range.</td></tr>`;
        return;
      }

      data.rows.forEach(r => {
        const tr = document.createElement('tr');
        
        let dispBadge = `<span class="badge badge-cyan">${escapeHtml(r.disposition || 'N/A')}</span>`;
        if (r.disposition === 'ANSWERED') {
          dispBadge = `<span class="badge badge-emerald"><i class="fa-solid fa-check"></i> ANSWERED</span>`;
        } else if (r.disposition === 'FAILED' || r.disposition === 'NO ANSWER') {
          dispBadge = `<span class="badge" style="background:rgba(244,63,94,0.15); color:#fca5a5;"><i class="fa-solid fa-xmark"></i> ${r.disposition}</span>`;
        }

        let audioControl = '<span style="color:var(--text-dim); font-size:12px;">No Audio</span>';
        if (r.play_id) {
          const streamUrl = `http://117.217.126.149:880/roottech/index.php?r=recording/play&kind=${r.play_kind || 'recording'}&id=${r.play_id}&token=11af5c25470d1306970a9175df8a1213da7435960305169f`;
          audioControl = `
            <a href="${streamUrl}" target="_blank" class="audio-btn">
              <i class="fa-solid fa-play"></i> Play Audio
            </a>
          `;
        }

        tr.innerHTML = `
          <td><strong>#${r.id}</strong><br><span style="font-size:10px; color:var(--text-dim);">${escapeHtml(r.call_uuid || '')}</span></td>
          <td><span class="badge badge-purple">${escapeHtml(r.call_type || 'call')}</span></td>
          <td>${r.caller_number ? `<span class="token-code">${escapeHtml(r.caller_number)}</span>` : '<span style="color:var(--text-dim)">-</span>'}</td>
          <td>${r.destination_number ? `<span class="token-code">${escapeHtml(r.destination_number)}</span>` : '<span style="color:var(--text-dim)">-</span>'}</td>
          <td>${r.booking_id ? `<span class="badge badge-cyan">${escapeHtml(r.booking_id)}</span>` : '<span style="color:var(--text-dim)">-</span>'}</td>
          <td style="font-size:12px;">${escapeHtml(r.start_time || '')}</td>
          <td>${r.duration || 0}s</td>
          <td>${dispBadge}</td>
          <td>${audioControl}</td>
        `;
        tbody.appendChild(tr);
      });

    } else {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color:#fca5a5;">Failed to load recordings: ${escapeHtml(data.message || 'Error')}</td></tr>`;
    }
  } catch (err) {
    console.error('Recordings error:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color:#fca5a5;">Server error loading recordings.</td></tr>`;
  }
}

// Click to Call Customer
async function triggerCallCustomer() {
  const reqId = document.getElementById('callCustReqId').value.trim();
  const respElem = document.getElementById('callTesterResponse');
  respElem.textContent = 'Triggering POST call/customer...';

  try {
    const res = await fetch('api.php?action=customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  const reqId = document.getElementById('callMaidReqId').value.trim();
  const respElem = document.getElementById('callTesterResponse');
  respElem.textContent = 'Triggering POST call/maid...';

  try {
    const res = await fetch('api.php?action=call_maid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`api.php?action=call_status&request_id=${encodeURIComponent(reqId)}`);
    const data = await res.json();
    respElem.textContent = `=== LIVE STATUS FOR ${reqId} ===\n` + JSON.stringify(data, null, 2);
  } catch (e) {
    console.log('Status poll error', e);
  }
}

// Check System Auth
async function checkSystemAuth() {
  const elem = document.getElementById('authCheckResult');
  elem.textContent = 'Running GET auth/check...';

  try {
    const res = await fetch('api.php?action=auth_check');
    const data = await res.json();
    elem.textContent = JSON.stringify(data, null, 2);
    if (data.success) {
      showToast('System Auth Health Check OK!', 'success');
    } else {
      showToast('System Auth Check Failed!', 'error');
    }
  } catch (err) {
    elem.textContent = 'Error executing auth check.';
    showToast('Network error', 'error');
  }
}

// Modal controls
function openCreateAgentModal() {
  document.getElementById('createAgentModal').classList.add('open');
}

function closeCreateAgentModal() {
  document.getElementById('createAgentModal').classList.remove('open');
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
