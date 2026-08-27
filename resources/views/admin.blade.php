@extends('layouts.app')

@section('title', 'RootTech Telephony Admin Portal')

@section('content')
<div class="app-wrapper">
  
  <!-- LEFT SIDEBAR NAVIGATION MENU -->
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <div class="brand-icon">
        <i class="fa-solid fa-server"></i>
      </div>
      <div>
        <div class="brand-name">RootTech</div>
        <div class="brand-sub">Admin Console</div>
      </div>
    </div>

    <div class="sidebar-menu">
      <div class="menu-category">Admin Management</div>
      
      <div class="menu-item active" data-module="module-dashboard">
        <i class="fa-solid fa-chart-pie"></i>
        <span>Admin Overview</span>
      </div>

      <div class="menu-item" data-module="module-agents">
        <i class="fa-solid fa-users"></i>
        <span>Agents & Extensions</span>
      </div>

      <div class="menu-item" data-module="module-recordings">
        <i class="fa-solid fa-file-audio"></i>
        <span>Call Recordings</span>
      </div>

      <div class="menu-item" data-module="module-mapping">
        <i class="fa-solid fa-mask"></i>
        <span>DID Masking</span>
      </div>

      <div class="menu-item" data-module="module-tester">
        <i class="fa-solid fa-phone-volume"></i>
        <span>Click-to-Call Tester</span>
      </div>

      <div class="menu-item" data-module="module-reports">
        <i class="fa-solid fa-chart-line"></i>
        <span>API Telephony Logs</span>
      </div>

      <div class="menu-item" data-module="module-auth">
        <i class="fa-solid fa-shield-halved"></i>
        <span>System Auth Check</span>
      </div>
    </div>

    <!-- SIDEBAR BOTTOM USER & LOGOUT BUTTON -->
    <div class="sidebar-user">
      <div class="sidebar-user-card">
        <div class="user-details" style="display:flex; align-items:center; gap:10px;">
          <div class="user-avatar" style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, var(--accent-cyan), var(--primary)); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; position:relative; flex-shrink:0;">
            <i class="fa-solid fa-user-shield"></i>
            <span class="status-indicator" style="position:absolute; bottom:0; right:0; width:10px; height:10px; border-radius:50%; border:2px solid var(--bg-card); background: var(--accent-emerald);"></span>
          </div>
          <div style="overflow:hidden;">
            <div class="user-title" style="font-weight:600; color:var(--text-bright); font-size:13px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">Super Administrator</div>
            <div class="user-role" style="font-size:11px; color:var(--text-muted);">Root PBX Admin</div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <a href="{{ route('dashboard') }}" class="btn btn-secondary" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:7px 10px; font-size:12px; font-weight:600; border-radius:var(--radius-sm); text-decoration:none;">
            <i class="fa-solid fa-headset"></i>
            <span>Agent Portal</span>
          </a>

          <a href="{{ route('logout') }}" class="btn btn-danger" style="display:flex; align-items:center; justify-content:center; padding:7px 12px; font-size:12px; font-weight:600; border-radius:var(--radius-sm); text-decoration:none;" title="Sign Out">
            <i class="fa-solid fa-right-from-bracket"></i>
          </a>
        </div>
      </div>
    </div>
  </aside>

  <!-- RIGHT MAIN CONTENT AREA -->
  <main class="app-main">
    
    <!-- TOP HEADER BAR -->
    <header class="main-header">
      <div>
        <h1 id="moduleTitle" class="page-title">Admin Overview</h1>
        <p id="moduleSubtitle" class="page-sub">Telephony PBX administration, agent extensions, DID routing, and call auditing</p>
      </div>

      <div style="display: flex; align-items: center; gap: 14px;">
        <!-- PBX Connectivity Health Indicator -->
        <div class="header-status-box" id="adminHealthBadge" title="PBX Server API Status">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-emerald); box-shadow:0 0 6px var(--accent-emerald);"></span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">PBX Online</span>
        </div>

        <!-- Switch to Agent Console Button -->
        <a href="{{ route('dashboard') }}" class="btn btn-secondary btn-sm" style="display:flex; align-items:center; gap:6px; text-decoration:none;">
          <i class="fa-solid fa-headset"></i>
          <span>Agent Console</span>
        </a>

        <!-- Theme Toggle Button -->
        <button id="themeToggleBtn" class="btn btn-secondary btn-sm" style="display:flex; align-items:center; gap:6px;">
          <i class="fa-solid fa-moon"></i>
          <span id="themeToggleText">Theme</span>
        </button>
      </div>
    </header>

    <!-- MODULE 1: ADMIN DASHBOARD OVERVIEW -->
    <section id="module-dashboard" class="module-section active">
      
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon cyan">
            <i class="fa-solid fa-users"></i>
          </div>
          <div>
            <div class="stat-label">Total Support Agents</div>
            <div class="stat-value" id="statAdminTotalAgents">--</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon emerald">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div class="stat-label">Available / Ready</div>
            <div class="stat-value" id="statAdminAvailableAgents" style="color: var(--accent-emerald);">--</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon blue">
            <i class="fa-solid fa-phone-volume"></i>
          </div>
          <div>
            <div class="stat-label">Total Call Records</div>
            <div class="stat-value" id="statAdminTotalCalls">--</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon purple">
            <i class="fa-solid fa-mask"></i>
          </div>
          <div>
            <div class="stat-label">Universal DID Mask</div>
            <div class="stat-value" style="font-size: 16px;">{{ config('roottech.mask_did', '912612385555') }}</div>
          </div>
        </div>
      </div>

      <!-- Telephony Server Configuration & Health Strip -->
      <div class="glass-panel" style="margin-bottom: 24px; padding: 18px 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background: var(--badge-cyan-bg); display: flex; align-items: center; justify-content: center; color: var(--accent-cyan); font-size: 18px; border: 1px solid var(--badge-cyan-border);">
              <i class="fa-solid fa-network-wired"></i>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Remote PBX Gateway</div>
              <div style="font-family: monospace; font-size: 13px; color: var(--accent-cyan); font-weight: 600;">{{ config('roottech.base_url', 'http://117.217.126.149:880/roottech/index.php') }}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Master API Token</div>
              <div style="font-family: monospace; font-size: 12px; color: var(--primary); font-weight: 600;">
                {{ substr(config('roottech.bearer_token', '11af5c25470d1306970a9175df8a1213da7435960305169f'), 0, 16) }}...
              </div>
            </div>

            <button type="button" class="btn btn-secondary btn-sm" onclick="checkSystemAuth()" style="display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-heart-pulse" style="color: var(--accent-emerald);"></i>
              <span>Test Connection</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Action Controls -->
      <div class="glass-panel" style="margin-bottom: 24px;">
        <h3 class="card-title" style="margin-bottom: 16px;">
          <i class="fa-solid fa-bolt"></i>
          Admin Quick Actions
        </h3>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary" onclick="openCreateAgentModal()">
            <i class="fa-solid fa-user-plus"></i>
            <span>Create New Agent</span>
          </button>

          <button type="button" class="btn btn-secondary" onclick="switchModule('module-mapping')">
            <i class="fa-solid fa-mask"></i>
            <span>Manage DID Masking</span>
          </button>

          <button type="button" class="btn btn-secondary" onclick="switchModule('module-recordings')">
            <i class="fa-solid fa-file-audio"></i>
            <span>Browse Recordings</span>
          </button>

          <button type="button" class="btn btn-secondary" onclick="switchModule('module-tester')">
            <i class="fa-solid fa-phone-volume"></i>
            <span>Outbound Call Tester</span>
          </button>

          <button type="button" class="btn btn-secondary" onclick="refreshAdminDashboard()">
            <i class="fa-solid fa-rotate"></i>
            <span>Refresh All Data</span>
          </button>
        </div>
      </div>

      <!-- Live Dual Overview Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(480px, 1fr)); gap: 24px;">
        
        <!-- Column 1: Live Agents Table -->
        <div class="glass-panel" style="margin-bottom: 0;">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 class="card-title" style="margin:0;">
              <i class="fa-solid fa-users-gear"></i>
              Active Agents & SIP Peers
            </h3>
            <button type="button" class="btn btn-secondary btn-sm" onclick="loadAgentsList()">
              <i class="fa-solid fa-rotate"></i>
              <span>Refresh</span>
            </button>
          </div>

          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Extension</th>
                  <th>Presence</th>
                  <th>SIP Peer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="overviewAgentsTableBody">
                <tr>
                  <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
                    <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Agents List...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Column 2: Recent Call Activity Table -->
        <div class="glass-panel" style="margin-bottom: 0;">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 class="card-title" style="margin:0;">
              <i class="fa-solid fa-clock-rotate-left"></i>
              Recent Call Activity & Audio
            </h3>
            <button type="button" class="btn btn-secondary btn-sm" onclick="loadRecordings()">
              <i class="fa-solid fa-rotate"></i>
              <span>Refresh</span>
            </button>
          </div>

          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Caller</th>
                  <th>Destination</th>
                  <th>Duration</th>
                  <th>Audio</th>
                </tr>
              </thead>
              <tbody id="overviewCallsTableBody">
                <tr>
                  <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
                    <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Call Records...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </section>

    <!-- MODULE 2: AGENTS & EXTENSIONS -->
    <section id="module-agents" class="module-section">
      <div class="glass-panel card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 class="card-title" style="margin-bottom: 4px;">
              <i class="fa-solid fa-users"></i>
              Support Agents & SIP Peer Directory
            </h3>
            <p style="font-size: 13px; color: var(--text-muted);">Manage support agent extensions, SIP passwords, and monitor real-time registered peers on PBX.</p>
          </div>

          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="loadAgentsList()">
              <i class="fa-solid fa-rotate"></i>
              <span>Refresh List</span>
            </button>

            <button type="button" class="btn btn-primary btn-sm" onclick="openCreateAgentModal()">
              <i class="fa-solid fa-plus"></i>
              <span>Create New Agent</span>
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Agent Code</th>
                <th>Full Name</th>
                <th>SIP Tech & Peer</th>
                <th>SIP Secret</th>
                <th>Queue Status</th>
                <th>SIP Reg State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="agentsTableBody">
              <tr>
                <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
                  <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Agents List...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- MODULE 3: CALL RECORDINGS -->
    <section id="module-recordings" class="module-section">
      <div class="glass-panel card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 class="card-title" style="margin-bottom: 4px;">
              <i class="fa-solid fa-file-audio"></i>
              Call Recordings & Telephony CDR Archive
            </h3>
            <p style="font-size: 13px; color: var(--text-muted);">Audit call recordings across all agents, filter by date, and stream audio directly.</p>
          </div>
        </div>

        <!-- Filter Controls -->
        <form id="recordingsFilterForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Date From</label>
            <input type="date" id="recFromDate" class="form-input" value="{{ date('Y-m-d') }}">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Date To</label>
            <input type="date" id="recToDate" class="form-input" value="{{ date('Y-m-d') }}">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Search Query</label>
            <input type="text" id="recSearchQuery" class="form-input" placeholder="Phone or Booking ID">
          </div>

          <div class="form-group" style="margin-bottom: 0; display: flex; align-items: flex-end;">
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fa-solid fa-filter"></i>
              <span>Filter Logs</span>
            </button>
          </div>
        </form>

        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID & UUID</th>
                <th>Call Type</th>
                <th>Caller Number</th>
                <th>Destination Number</th>
                <th>Booking ID</th>
                <th>Start Time</th>
                <th>Duration</th>
                <th>Disposition</th>
                <th>Audio Recording</th>
              </tr>
            </thead>
            <tbody id="recordingsTableBody">
              <tr>
                <td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">
                  Select filters or click Filter Logs to fetch call recordings.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- MODULE 4: DID NUMBER MASKING -->
    <section id="module-mapping" class="module-section">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
        
        <!-- Create / Upsert Mapping Card -->
        <div class="glass-panel card">
          <h3 class="card-title">
            <i class="fa-solid fa-link"></i>
            Universal DID Mapping
          </h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Enables Universal BSNL DID number masking across the platform for Customers and Maids.</p>

          <form id="mappingForm">
            <div class="search-grid">
              <div class="form-group">
                <label class="form-label">Booking ID</label>
                <input type="text" id="mapBookingId" class="form-input" value="BK202600123" placeholder="e.g. BK202600123" required>
              </div>

              <div class="form-group">
                <label class="form-label">Universal Mask DID Number</label>
                <input type="text" id="mapMaskDid" class="form-input" value="{{ config('roottech.mask_did', '912612385555') }}" readonly style="opacity:0.9; font-weight:600; color:var(--primary);" required>
              </div>
            </div>

            <div class="search-grid">
              <div class="form-group">
                <label class="form-label">Customer ID</label>
                <input type="text" id="mapCustomerId" class="form-input" value="CUST10001" required>
              </div>

              <div class="form-group">
                <label class="form-label">Customer Phone</label>
                <input type="text" id="mapCustomerNumber" class="form-input" value="9227231501" required>
              </div>
            </div>

            <div class="search-grid">
              <div class="form-group">
                <label class="form-label">Maid ID</label>
                <input type="text" id="mapMaidId" class="form-input" value="MAID501" required>
              </div>

              <div class="form-group">
                <label class="form-label">Maid Phone</label>
                <input type="text" id="mapMaidNumber" class="form-input" value="9227233035" required>
              </div>
            </div>

            <div class="search-grid">
              <div class="form-group">
                <label class="form-label">Valid From</label>
                <input type="text" id="mapValidFrom" class="form-input" value="{{ date('Y-m-d H:i:s') }}">
              </div>

              <div class="form-group">
                <label class="form-label">Valid Until</label>
                <input type="text" id="mapValidUntil" class="form-input" value="2026-12-31 23:59:59">
              </div>
            </div>

            <button type="submit" id="btnSubmitMapping" class="btn btn-primary" style="margin-top: 10px;">
              <i class="fa-solid fa-floppy-disk"></i>
              <span>Save & Activate Mapping</span>
            </button>
          </form>
        </div>

        <!-- Deactivate Mapping Card -->
        <div class="glass-panel card">
          <h3 class="card-title">
            <i class="fa-solid fa-link-slash"></i>
            Deactivate Mapping
          </h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Stop masked calling when a booking is completed, cancelled, or expired.</p>

          <form id="deactivateForm">
            <div class="form-group">
              <label class="form-label">Booking ID</label>
              <input type="text" id="deactBookingId" class="form-input" value="BK202600123" required>
            </div>

            <div class="form-group">
              <label class="form-label">Deactivation Reason / Status</label>
              <select id="deactStatus" class="form-input">
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <button type="submit" id="btnSubmitDeact" class="btn btn-danger" style="margin-top: 10px; width: 100%;">
              <i class="fa-solid fa-ban"></i>
              <span>Deactivate Mapping</span>
            </button>
          </form>

          <!-- Response Debug Inspector -->
          <div style="margin-top: 24px;">
            <label class="form-label">Mapping Operation Response</label>
            <pre id="mappingResponseJson" class="json-code-viewer" style="max-height: 180px; overflow-y: auto;">Submit form to see output response...</pre>
          </div>
        </div>

      </div>
    </section>

    <!-- MODULE 5: CLICK TO CALL TESTER -->
    <section id="module-tester" class="module-section">
      <div class="glass-panel card">
        <h3 class="card-title">
          <i class="fa-solid fa-phone-volume"></i>
          Click-to-Call Endpoint Tester
        </h3>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Directly trigger and inspect outbound click-to-call routes on the PBX server.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin-top: 16px;">
          
          <div style="padding: 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
            <h4 style="font-family: var(--font-heading); margin-bottom: 10px; color: var(--accent-cyan);">Call Customer</h4>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">Triggers call to Agent SIP (1001), then connects mapped customer number.</p>
            
            <div class="form-group">
              <label class="form-label">Request ID</label>
              <input type="text" id="callCustReqId" class="form-input" value="REQ{{ time() }}">
            </div>

            <button type="button" id="adminBtnCallCustomer" class="btn btn-primary" onclick="triggerCallCustomer()" style="width: 100%;">
              <i class="fa-solid fa-phone"></i>
              <span>Call Customer (POST call/customer)</span>
            </button>
          </div>

          <div style="padding: 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
            <h4 style="font-family: var(--font-heading); margin-bottom: 10px; color: var(--secondary);">Call Maid / Helper</h4>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">Triggers call to Agent SIP (1001), then connects mapped maid number.</p>

            <div class="form-group">
              <label class="form-label">Request ID</label>
              <input type="text" id="callMaidReqId" class="form-input" value="REQ_MAID_{{ time() }}">
            </div>

            <button type="button" id="adminBtnCallMaid" class="btn btn-secondary" onclick="triggerCallMaid()" style="width: 100%;">
              <i class="fa-solid fa-phone"></i>
              <span>Call Maid (POST call/maid)</span>
            </button>
          </div>

        </div>

        <div style="margin-top: 24px;">
          <label class="form-label">Live Response & Call Status Poll Result</label>
          <pre id="callTesterResponse" class="json-code-viewer">Click a call button to test API...</pre>
        </div>
      </div>
    </section>

    <!-- MODULE 6: API REPORTS & LOGS -->
    <section id="module-reports" class="module-section">
      <div class="glass-panel card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 class="card-title" style="margin-bottom: 4px;">
              <i class="fa-solid fa-chart-line"></i>
              Telephony API Transaction Logs & CDR
            </h3>
            <p style="font-size: 13px; color: var(--text-muted);">Historical records of all telephony API transactions, request latencies, and responses.</p>
          </div>

          <button type="button" class="btn btn-secondary btn-sm" onclick="loadRecordings()">
            <i class="fa-solid fa-rotate"></i>
            <span>Refresh Records</span>
          </button>
        </div>

        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Endpoint Action</th>
                <th>Caller / Ext</th>
                <th>Destination</th>
                <th>HTTP Status</th>
                <th>Time & Latency</th>
              </tr>
            </thead>
            <tbody id="logsTableBody">
              <tr>
                <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
                  Loading Telephony Transaction Logs...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- MODULE 7: SYSTEM AUTH & HEALTH CHECK -->
    <section id="module-auth" class="module-section">
      <div class="glass-panel card">
        <h3 class="card-title">
          <i class="fa-solid fa-shield-check"></i>
          Telephony System Auth & Health Diagnostics
        </h3>
        <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px;">Validates the Bearer API Token against the remote PBX server endpoint: <code class="token-code">?r=auth/check</code>.</p>

        <button type="button" class="btn btn-primary" onclick="checkSystemAuth()" style="width: auto;">
          <i class="fa-solid fa-heart-pulse"></i>
          <span>Run System Auth Check</span>
        </button>

        <div style="margin-top: 20px;">
          <pre id="authCheckResult" class="json-code-viewer">Click 'Run System Auth Check' to test API token health.</pre>
        </div>
      </div>
    </section>

  </main>
</div>

<!-- Create Agent Modal -->
<div id="createAgentModal" class="modal-overlay" style="display: none;">
  <div class="glass-panel modal-box modal-animated">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
      <h3 class="card-title" style="margin-bottom: 0;">Create Support Agent</h3>
      <button type="button" class="btn btn-secondary btn-sm" onclick="closeCreateAgentModal()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <form id="createAgentForm">
      <div class="form-group">
        <label class="form-label">Agent Code (SIP Username)</label>
        <input type="text" id="newAgentCode" class="form-input" placeholder="e.g. 1003" required>
      </div>

      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" id="newFullName" class="form-input" placeholder="e.g. Support Agent Three" required>
      </div>

      <div class="form-group">
        <label class="form-label">Console Password</label>
        <input type="password" id="newPassword" class="form-input" value="Agent@123" required>
      </div>

      <div class="form-group">
        <label class="form-label">SIP Peer (Defaults to Agent Code)</label>
        <input type="text" id="newSipPeer" class="form-input" placeholder="e.g. 1003">
      </div>

      <div class="form-group">
        <label class="form-label">SIP Secret (Blank = Auto Generate)</label>
        <input type="text" id="newSipSecret" class="form-input" placeholder="Leave empty for auto password">
      </div>

      <div style="display: flex; gap: 12px; margin-top: 20px;">
        <button type="submit" class="btn btn-primary" style="width: 100%;">Create Agent</button>
        <button type="button" class="btn btn-secondary" onclick="closeCreateAgentModal()" style="width: 100%;">Cancel</button>
      </div>
    </form>
  </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('js/admin.js') }}"></script>
@endpush
