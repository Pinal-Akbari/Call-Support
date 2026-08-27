<?php
session_start();
if (!isset($_SESSION['agent']) || empty($_SESSION['agent']['session_token'])) {
    header('Location: login.php');
    exit;
}

$agentSession = $_SESSION['agent'];
$agentInfo = $agentSession['info'] ?? [];
$agentName = $agentInfo['full_name'] ?? 'Support Agent';
$agentCode = $agentInfo['agent_code'] ?? '1001';
$status = $agentInfo['status'] ?? 'offline';
$queue = $agentSession['queue'] ?? 'root-support';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RootTech Telephony System</title>
  <meta name="description" content="RootTech Telephony System Management Dashboard">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <div class="app-wrapper">
    
    <!-- LEFT SIDEBAR NAVIGATION MENU -->
    <aside class="app-sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <i class="fa-solid fa-headset"></i>
        </div>
        <div>
          <div class="brand-name">RootTech</div>
          <div class="brand-sub">Telephony Portal</div>
        </div>
      </div>

      <div class="sidebar-menu">
        <div class="menu-category">Main Menu</div>
        
        <div class="menu-item active" data-module="module-dashboard">
          <i class="fa-solid fa-chart-pie"></i>
          <span>Dashboard Overview</span>
        </div>

        <div class="menu-item" data-module="module-call">
          <i class="fa-solid fa-phone-volume"></i>
          <span>Click-to-Call</span>
        </div>

        <div class="menu-item" data-module="module-agents">
          <i class="fa-solid fa-users"></i>
          <span>Agents Directory</span>
        </div>

        <div class="menu-item" data-module="module-mapping">
          <i class="fa-solid fa-mask"></i>
          <span>DID Masking</span>
        </div>

        <div class="menu-item" data-module="module-recordings">
          <i class="fa-solid fa-file-audio"></i>
          <span>Call Recordings</span>
        </div>
      </div>

      <!-- SIDEBAR BOTTOM USER & LOGOUT BUTTON -->
      <div class="sidebar-user">
        <div class="user-card" style="display:flex; flex-direction:column; gap:12px; padding:14px; background:rgba(15,23,42,0.8); border:1px solid var(--border-glass); border-radius:var(--radius-md);">
          <div class="user-details" style="display:flex; align-items:center; gap:10px;">
            <div class="user-avatar" style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #6366f1, #a855f7); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; position:relative;">
              <i class="fa-solid fa-user-gear"></i>
              <span id="sidebarStatusDot" class="status-indicator <?php echo strtolower($status) === 'offline' ? 'offline' : ''; ?>" style="position:absolute; bottom:0; right:0; width:10px; height:10px; border-radius:50%; border:2px solid #0f172a;"></span>
            </div>
            <div>
              <div class="user-title" style="font-weight:600; color:var(--text-bright); font-size:13px;"><?php echo htmlspecialchars($agentName); ?></div>
              <div class="user-role" style="font-size:11px; color:var(--text-muted);">Ext: <?php echo htmlspecialchars($agentCode); ?> | <?php echo htmlspecialchars($queue); ?></div>
            </div>
          </div>

          <a href="logout.php" class="btn btn-danger" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:8px 12px; font-size:13px; font-weight:600; border-radius:var(--radius-sm); text-decoration:none;">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Sign Out / Logout</span>
          </a>
        </div>
      </div>
    </aside>

    <!-- RIGHT MAIN CONTENT AREA -->
    <main class="app-main">
      
      <!-- TOP HEADER BAR -->
      <header class="main-header">
        <div>
          <h1 id="moduleTitle" class="page-title">Dashboard Overview</h1>
          <p id="moduleSubtitle" class="page-sub">Live Telephony status, quick call actions, and recent call activity</p>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          <!-- Agent Status Selector -->
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(20,28,45,0.7); padding: 6px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Status:</span>
            <select id="statusSelect" class="form-input" style="padding: 4px 8px; font-size: 13px; border: none; background: transparent; width: auto;">
              <option value="available" <?php echo strtolower($status)==='available'?'selected':''; ?>>🟢 Available</option>
              <option value="break" <?php echo strtolower($status)==='break'?'selected':''; ?>>🟡 On Break</option>
              <option value="wrapup" <?php echo strtolower($status)==='wrapup'?'selected':''; ?>>🔵 Wrapup</option>
              <option value="offline" <?php echo strtolower($status)==='offline'?'selected':''; ?>>🔴 Offline</option>
            </select>
          </div>
        </div>
      </header>

      <!-- MODULE 1: DASHBOARD OVERVIEW -->
      <section id="module-dashboard" class="module-section active">
        
        <!-- Summary Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon emerald">
              <i class="fa-solid fa-signal"></i>
            </div>
            <div>
              <div class="stat-label">Agent Status</div>
              <div class="stat-value" id="statAgentStatus" style="text-transform: capitalize; color: #6ee7b7;"><?php echo htmlspecialchars($status); ?></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon blue">
              <i class="fa-solid fa-phone-volume"></i>
            </div>
            <div>
              <div class="stat-label">Today's Total Calls</div>
              <div class="stat-value" id="statTodayCalls">--</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon cyan">
              <i class="fa-solid fa-users"></i>
            </div>
            <div>
              <div class="stat-label">Active Support Agents</div>
              <div class="stat-value" id="statActiveAgents">--</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon purple">
              <i class="fa-solid fa-headset"></i>
            </div>
            <div>
              <div class="stat-label">SIP Extension</div>
              <div class="stat-value"><?php echo htmlspecialchars($agentCode); ?></div>
            </div>
          </div>
        </div>

        <!-- Quick Call Action Bar -->
        <div class="glass-panel" style="margin-bottom: 24px;">
          <h3 class="card-title" style="margin-bottom: 16px;">
            <i class="fa-solid fa-bolt"></i>
            Quick Call Actions
          </h3>

          <div style="display: flex; gap: 14px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" onclick="switchModule('module-call')">
              <i class="fa-solid fa-phone"></i>
              <span>Initiate Click-to-Call</span>
            </button>

            <button type="button" class="btn btn-secondary" onclick="switchModule('module-mapping')">
              <i class="fa-solid fa-mask"></i>
              <span>Create Number Masking</span>
            </button>

            <button type="button" class="btn btn-secondary" onclick="refreshDashboardOverview()">
              <i class="fa-solid fa-rotate"></i>
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        <!-- Recent Call Activity Table -->
        <div class="glass-panel">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fa-solid fa-clock-rotate-left"></i>
              Recent Call Activity
            </h3>
            <button type="button" class="btn btn-secondary btn-sm" onclick="loadRecentActivity()">
              <i class="fa-solid fa-rotate"></i>
              <span>Refresh</span>
            </button>
          </div>

          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Call Type</th>
                  <th>Caller Phone</th>
                  <th>Destination Phone</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Recording</th>
                </tr>
              </thead>
              <tbody id="overviewTableBody">
                <tr>
                  <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
                    <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Call Activity...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>


      <!-- MODULE 2: CLICK TO CALL -->
      <section id="module-call" class="module-section">
        <div class="glass-panel">
          <h3 class="card-title" style="margin-bottom: 8px;">
            <i class="fa-solid fa-phone-volume"></i>
            Click-To-Call Services
          </h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">Rings agent extension (<?php echo htmlspecialchars($agentCode); ?>) and connects the mapped Customer or Maid securely via Universal BSNL DID masking (912612385555) for all calls.</p>

          <form id="moduleCallForm">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Booking ID</label>
                <input type="text" id="callBookingId" class="form-input" value="BK202600123" placeholder="e.g. BK202600123" required>
              </div>

              <div class="form-group">
                <label class="form-label">Agent Extension</label>
                <input type="text" id="callExtension" class="form-input" value="<?php echo htmlspecialchars($agentCode); ?>" readonly>
              </div>

              <div class="form-group">
                <label class="form-label">Request ID</label>
                <input type="text" id="callRequestId" class="form-input" value="REQ<?php echo time(); ?>" required>
              </div>
            </div>

            <div style="display: flex; gap: 14px; flex-wrap: wrap; margin-top: 10px;">
              <button type="button" id="btnCallCustomer" class="btn btn-primary active" onclick="triggerCallTarget('customer')">
                <i class="fa-solid fa-user-phone"></i>
                <span>Call Customer</span>
              </button>

              <button type="button" id="btnCallMaid" class="btn btn-secondary" onclick="triggerCallTarget('maid')">
                <i class="fa-solid fa-headset"></i>
                <span>Call Maid / Helper</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Call Status Result Card -->
        <div id="callResultCard" class="glass-panel" style="display: none;">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fa-solid fa-circle-nodes"></i>
              Call Origination Status
            </h3>
            <div id="callStatusBadge"></div>
          </div>

          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="callResultTableBody">
                <!-- Dynamically filled -->
              </tbody>
            </table>
          </div>
        </div>
      </section>


      <!-- MODULE 3: AGENTS MANAGEMENT -->
      <section id="module-agents" class="module-section">
        <div class="glass-panel">
          <div class="card-header">
            <div>
              <h3 class="card-title" style="margin-bottom: 4px;">
                <i class="fa-solid fa-users"></i>
                Agents & Extension Directory
              </h3>
              <p style="font-size: 13px; color: var(--text-muted);">Manage support agent extensions and SIP configuration</p>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="loadAgentsModule()">
                <i class="fa-solid fa-rotate"></i>
                <span>Refresh</span>
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="openCreateAgentModal()">
                <i class="fa-solid fa-plus"></i>
                <span>Add Agent</span>
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Agent Code</th>
                  <th>Full Name</th>
                  <th>SIP Peer</th>
                  <th>Queue Status</th>
                  <th>Active State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="agentsModuleTableBody">
                <tr>
                  <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
                    <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Directory...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>


      <!-- MODULE 4: DID MASKING -->
      <section id="module-mapping" class="module-section">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 24px;">
          
          <!-- Create Mapping -->
          <div class="glass-panel">
            <h3 class="card-title" style="margin-bottom: 6px;">
              <i class="fa-solid fa-mask"></i>
              Universal Number Masking
            </h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Central BSNL DID masking configured for all Customers & Maids across all bookings.</p>

            <form id="moduleMapForm">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label"><i class="fa-solid fa-hashtag" style="color:#a855f7;"></i> Booking ID</label>
                  <input type="text" id="mMapBookingId" class="form-input" value="BK202600123" placeholder="Enter Booking ID (e.g. BK202600123)" required>
                </div>
                <div class="form-group">
                  <label class="form-label"><i class="fa-solid fa-phone-volume" style="color:#10b981;"></i> Universal Mask DID <span style="font-size:10px; color:var(--text-dim);">(Central Gateway)</span></label>
                  <input type="text" id="mMapMaskDid" class="form-input" value="912612385555" readonly style="opacity:0.85; background:rgba(99,102,241,0.06);" title="Universal Company BSNL DID" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label"><i class="fa-solid fa-id-card" style="color:#6366f1;"></i> Customer ID</label>
                  <input type="text" id="mMapCustomerId" class="form-input" value="CUST10001" placeholder="e.g. CUST10001" required>
                </div>
                <div class="form-group">
                  <label class="form-label"><i class="fa-solid fa-phone" style="color:#6366f1;"></i> Customer Phone</label>
                  <input type="text" id="mMapCustomerNumber" class="form-input" value="9227231501" placeholder="e.g. 9227231501" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label"><i class="fa-solid fa-id-badge" style="color:#ec4899;"></i> Maid ID</label>
                  <input type="text" id="mMapMaidId" class="form-input" value="MAID501" placeholder="e.g. MAID501" required>
                </div>
                <div class="form-group">
                  <label class="form-label"><i class="fa-solid fa-headset" style="color:#ec4899;"></i> Maid Phone</label>
                  <input type="text" id="mMapMaidNumber" class="form-input" value="9227233035" placeholder="e.g. 9227233035" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label"><i class="fa-regular fa-calendar-check" style="color:#06b6d4;"></i> Valid From</label>
                  <input type="text" id="mMapValidFrom" class="form-input" value="<?php echo date('Y-m-d H:i:s'); ?>" required>
                </div>
                <div class="form-group">
                  <label class="form-label"><i class="fa-regular fa-calendar-xmark" style="color:#f59e0b;"></i> Valid Until</label>
                  <input type="text" id="mMapValidUntil" class="form-input" value="<?php echo date('Y-m-d H:i:s', strtotime('+1 year')); ?>" required>
                </div>
              </div>

              <button type="submit" id="btnSubmitMapping" class="btn btn-primary" style="margin-top: 10px;">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Save & Activate Masking (POST mapping)</span>
              </button>
            </form>
          </div>

          <!-- Deactivate Mapping -->
          <div class="glass-panel">
            <h3 class="card-title" style="margin-bottom: 16px;">
              <i class="fa-solid fa-ban"></i>
              Deactivate Masking
            </h3>

            <form id="moduleDeactForm">
              <div class="form-group">
                <label class="form-label">Booking ID</label>
                <input type="text" id="mDeactBookingId" class="form-input" value="BK202600123" required>
              </div>

              <div class="form-group">
                <label class="form-label">Status Reason</label>
                <select id="mDeactStatus" class="form-input">
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <button type="submit" id="btnSubmitDeact" class="btn btn-danger" style="margin-top: 10px; width: 100%;">
                <i class="fa-solid fa-circle-xmark"></i>
                <span>Deactivate Masking (POST mapping/deactivate)</span>
              </button>
            </form>
          </div>

        </div>

        <!-- DID Masking Live Status Card -->
        <div id="mappingStatusCard" class="glass-panel" style="margin-top: 24px; display: none;">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fa-solid fa-shield-check"></i>
              Live Masking Status & Data
            </h3>
            <div id="mappingStatusBadge"></div>
          </div>

          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Mapping Field</th>
                  <th>Configured Value</th>
                  <th>Routing Details</th>
                </tr>
              </thead>
              <tbody id="mappingStatusTableBody">
                <!-- Dynamically filled -->
              </tbody>
            </table>
          </div>
        </div>
      </section>


      <!-- MODULE 5: CALL RECORDINGS WITH INSTANT SEARCH -->
      <section id="module-recordings" class="module-section">
        <div class="glass-panel">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fa-solid fa-file-audio"></i>
              Call Recordings & Instant Search
            </h3>
            <span id="recordingsCountBadge" class="badge badge-purple">Showing All Call Recordings</span>
          </div>

          <!-- Search & Filter Controls -->
          <form id="moduleRecFilterForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 18px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Date From</label>
              <input type="date" id="mRecFromDate" class="form-input" value="<?php echo date('Y-m-d'); ?>">
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Date To</label>
              <input type="date" id="mRecToDate" class="form-input" value="<?php echo date('Y-m-d'); ?>">
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Instant Live Filter (Phone / Booking / Status)</label>
              <div style="position:relative;">
                <input type="text" id="mRecSearch" class="form-input" placeholder="Type Phone, Booking ID, Status..." style="padding-left:36px;">
                <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-dim);"></i>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:0; display:flex; gap:10px; align-items:flex-end;">
              <button type="submit" class="btn btn-primary" style="flex:1;">
                <i class="fa-solid fa-filter"></i>
                <span>Fetch Date Range</span>
              </button>

              <button type="button" class="btn btn-secondary" onclick="resetRecordingsFilter()" title="Clear & Reset Filters">
                <i class="fa-solid fa-rotate-left"></i>
                <span>Reset Filter</span>
              </button>
            </div>
          </form>

          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Call Type</th>
                  <th>Caller Phone</th>
                  <th>Destination Phone</th>
                  <th>Start Time</th>
                  <th>Duration</th>
                  <th>Disposition</th>
                  <th>Audio Playback</th>
                </tr>
              </thead>
              <tbody id="moduleRecordingsTableBody">
                <tr>
                  <td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">
                    <div class="spinner" style="margin: 0 auto 10px;"></div> Loading Call Recordings...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </main>

  </div>

  <!-- Create Agent Modal -->
  <div id="createAgentModal" class="glass-panel" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1000; width:100%; max-width:480px; box-shadow:0 20px 50px rgba(0,0,0,0.8);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h3 class="card-title" style="margin:0;">Create Support Agent</h3>
      <button type="button" class="btn btn-secondary btn-sm" onclick="closeCreateAgentModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <form id="createAgentForm">
      <div class="form-group">
        <label class="form-label">Agent Code</label>
        <input type="text" id="newAgentCode" class="form-input" placeholder="e.g. 1003" required>
      </div>

      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" id="newFullName" class="form-input" placeholder="e.g. Support Agent Three" required>
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="newPassword" class="form-input" value="Agent@123" required>
      </div>

      <div style="display:flex; gap:10px; margin-top:16px;">
        <button type="submit" class="btn btn-primary" style="width:100%;">Create Agent</button>
        <button type="button" class="btn btn-secondary" onclick="closeCreateAgentModal()" style="width:100%;">Cancel</button>
      </div>
    </form>
  </div>

  <div id="toastContainer" class="toast-container"></div>

  <script src="assets/js/app.js"></script>
</body>
</html>
