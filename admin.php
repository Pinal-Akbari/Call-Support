<?php
session_start();
$apiToken = '11af5c25470d1306970a9175df8a1213da7435960305169f';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RootTech Admin API Console</title>
  <meta name="description" content="Telephony Admin Dashboard & Multi-API Manager">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="assets/css/style.css">
  <style>
    .admin-nav-tabs {
      display: flex;
      gap: 10px;
      border-bottom: 1px solid var(--border-glass);
      margin-bottom: 24px;
      padding-bottom: 12px;
      overflow-x: auto;
    }
    .nav-tab-btn {
      padding: 10px 18px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-glass);
      color: var(--text-muted);
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .nav-tab-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
    }
    .nav-tab-btn.active {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: #fff;
      border-color: transparent;
      box-shadow: 0 4px 14px var(--primary-glow);
    }
    .tab-pane {
      display: none;
    }
    .tab-pane.active {
      display: block;
    }
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s ease;
    }
    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-box {
      width: 100%;
      max-width: 520px;
      padding: 28px;
    }
    .audio-btn {
      padding: 6px 12px;
      font-size: 12px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.4);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .audio-btn:hover {
      background: rgba(16, 185, 129, 0.35);
      color: #fff;
    }
  </style>
</head>
<body>

  <!-- Navigation Bar -->
  <nav class="navbar">
    <div class="nav-brand">
      <div class="nav-logo" style="background: linear-gradient(135deg, var(--accent-cyan), var(--primary));">
        <i class="fa-solid fa-server"></i>
      </div>
      <div>
        <div class="nav-title">RootTech Telephony Admin</div>
        <div style="font-size: 11px; color: var(--text-muted);">API Token: <span class="token-code" style="color: #67e8f9;"><?php echo htmlspecialchars(substr($apiToken, 0, 16) . '...'); ?></span></div>
      </div>
    </div>

    <div class="user-profile">
      <a href="dashboard.php" class="btn btn-secondary btn-sm">
        <i class="fa-solid fa-headset"></i>
        <span>Agent Console</span>
      </a>

      <a href="login.php" class="btn btn-secondary btn-sm">
        <i class="fa-solid fa-right-to-bracket"></i>
        <span>Login Page</span>
      </a>
    </div>
  </nav>

  <!-- Main Container -->
  <div style="max-width: 1320px; margin: 28px auto; padding: 0 24px;">
    
    <!-- Tab Controls -->
    <div class="admin-nav-tabs">
      <button class="nav-tab-btn active" data-tab="tabAgents">
        <i class="fa-solid fa-users"></i>
        <span>Agents & Extensions</span>
      </button>

      <button class="nav-tab-btn" data-tab="tabRecordings">
        <i class="fa-solid fa-waveform-lines"></i>
        <span>Call Recordings</span>
      </button>

      <button class="nav-tab-btn" data-tab="tabMapping">
        <i class="fa-solid fa-mask"></i>
        <span>DID Number Mapping</span>
      </button>

      <button class="nav-tab-btn" data-tab="tabClickToCall">
        <i class="fa-solid fa-phone-volume"></i>
        <span>Click-to-Call Tester</span>
      </button>

      <button class="nav-tab-btn" data-tab="tabAuth">
        <i class="fa-solid fa-shield-halved"></i>
        <span>System Auth Check</span>
      </button>
    </div>

    <!-- TAB 1: AGENTS MANAGEMENT -->
    <div id="tabAgents" class="tab-pane active fade-in">
      <div class="glass-panel card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 class="card-title" style="margin-bottom: 4px;">
              <i class="fa-solid fa-user-plus"></i>
              Support Agents & SIP Peers
            </h3>
            <p style="font-size: 13px; color: var(--text-muted);">Manage support agents, SIP passwords, and view live registered extensions.</p>
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
    </div>

    <!-- TAB 2: CALL RECORDINGS -->
    <div id="tabRecordings" class="tab-pane fade-in">
      <div class="glass-panel card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 class="card-title" style="margin-bottom: 4px;">
              <i class="fa-solid fa-file-audio"></i>
              Call Recordings & Telephony Log
            </h3>
            <p style="font-size: 13px; color: var(--text-muted);">Browse inbound and outbound call logs and listen to call audio recordings.</p>
          </div>
        </div>

        <!-- Filter Controls -->
        <form id="recordingsFilterForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Date From</label>
            <input type="date" id="recFromDate" class="form-input" value="<?php echo date('Y-m-d'); ?>">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Date To</label>
            <input type="date" id="recToDate" class="form-input" value="<?php echo date('Y-m-d'); ?>">
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
    </div>

    <!-- TAB 3: DID MAPPING -->
    <div id="tabMapping" class="tab-pane fade-in">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
        
        <!-- Create / Upsert Mapping Card -->
        <div class="glass-panel card">
          <h3 class="card-title">
            <i class="fa-solid fa-link"></i>
            Create / Upsert DID Mapping
          </h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Enables BSNL DID number masking both ways (Customer↔Maid).</p>

          <form id="mappingForm">
            <div class="search-grid">
              <div class="form-group">
                <label class="form-label">Booking ID</label>
                <input type="text" id="mapBookingId" class="form-input" value="BK202600123" required>
              </div>

              <div class="form-group">
                <label class="form-label">Mask DID Number</label>
                <input type="text" id="mapMaskDid" class="form-input" value="912612385555" required>
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
                <input type="text" id="mapValidFrom" class="form-input" value="<?php echo date('Y-m-d H:i:s'); ?>">
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
            <pre id="mappingResponseJson" style="background: rgba(10, 14, 26, 0.95); border: 1px solid var(--border-glass); padding: 14px; border-radius: var(--radius-md); font-family: monospace; font-size: 12px; color: #818cf8; max-height: 180px; overflow-y: auto;">Submit form to see output response...</pre>
          </div>
        </div>

      </div>
    </div>

    <!-- TAB 4: CLICK TO CALL TESTER -->
    <div id="tabClickToCall" class="tab-pane fade-in">
      <div class="glass-panel card">
        <h3 class="card-title">
          <i class="fa-solid fa-phone-volume"></i>
          Click-to-Call Endpoint Tester
        </h3>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin-top: 16px;">
          
          <div style="padding: 20px; background: rgba(15, 23, 42, 0.5); border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
            <h4 style="font-family: var(--font-heading); margin-bottom: 10px; color: var(--accent-cyan);">Call Customer</h4>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">Triggers call to Agent SIP (1001), then connects mapped customer number.</p>
            
            <div class="form-group">
              <label class="form-label">Request ID</label>
              <input type="text" id="callCustReqId" class="form-input" value="REQ<?php echo time(); ?>">
            </div>

            <button type="button" class="btn btn-primary" onclick="triggerCallCustomer()" style="width: 100%;">
              <i class="fa-solid fa-phone"></i>
              <span>Call Customer (POST call/customer)</span>
            </button>
          </div>

          <div style="padding: 20px; background: rgba(15, 23, 42, 0.5); border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
            <h4 style="font-family: var(--font-heading); margin-bottom: 10px; color: var(--secondary);">Call Maid / Helper</h4>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">Triggers call to Agent SIP (1001), then connects mapped maid number.</p>

            <div class="form-group">
              <label class="form-label">Request ID</label>
              <input type="text" id="callMaidReqId" class="form-input" value="REQ_MAID_<?php echo time(); ?>">
            </div>

            <button type="button" class="btn btn-secondary" onclick="triggerCallMaid()" style="width: 100%;">
              <i class="fa-solid fa-phone"></i>
              <span>Call Maid (POST call/maid)</span>
            </button>
          </div>

        </div>

        <div style="margin-top: 24px;">
          <label class="form-label">Live Response & Call Status Poll Result</label>
          <pre id="callTesterResponse" style="background: rgba(10, 14, 26, 0.95); border: 1px solid var(--border-glass); padding: 16px; border-radius: var(--radius-md); font-family: monospace; font-size: 13px; color: #818cf8;">Click a call button to test API...</pre>
        </div>
      </div>
    </div>

    <!-- TAB 5: SYSTEM AUTH CHECK -->
    <div id="tabAuth" class="tab-pane fade-in">
      <div class="glass-panel card">
        <h3 class="card-title">
          <i class="fa-solid fa-shield-check"></i>
          Telephony System Auth & Health Check
        </h3>
        <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px;">Validates the API Token against <code class="token-code">?r=auth/check</code> endpoint.</p>

        <button type="button" class="btn btn-primary" onclick="checkSystemAuth()" style="width: auto;">
          <i class="fa-solid fa-heart-pulse"></i>
          <span>Run System Auth Check</span>
        </button>

        <div style="margin-top: 20px;">
          <pre id="authCheckResult" style="background: rgba(10, 14, 26, 0.95); border: 1px solid var(--border-glass); padding: 16px; border-radius: var(--radius-md); font-family: monospace; font-size: 13px; color: #6ee7b7;">Click 'Run System Auth Check' to test API token health.</pre>
        </div>
      </div>
    </div>

  </div>

  <!-- Create Agent Modal -->
  <div id="createAgentModal" class="modal-overlay">
    <div class="glass-panel modal-box fade-in">
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

  <div id="toastContainer" class="toast-container"></div>

  <script src="assets/js/admin.js"></script>
</body>
</html>
