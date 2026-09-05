<?php
session_start();
if (isset($_SESSION['agent']) && !empty($_SESSION['agent']['session_token'])) {
    $agentCode = strtolower(trim((string)($_SESSION['agent']['agent_code'] ?? '')));
    $isAdmin = !empty($_SESSION['agent']['is_admin']) || ($agentCode === 'admin');
    header('Location: ' . ($isAdmin ? 'admin.php' : 'dashboard.php'));
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Portal | Login - RootTech Telephony</title>
  <meta name="description" content="RootTech Agent Portal Login Interface">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="assets/css/style.css">
  <script>
    (function() {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.addEventListener('DOMContentLoaded', () => document.body.classList.add('dark'));
      }
    })();
  </script>
</head>
<body>

  <!-- Floating Theme Switcher Button -->
  <div class="theme-toggle-corner">
    <button type="button" id="themeToggleBtn" class="btn-theme-circle" onclick="toggleTheme()" title="Toggle Dark/Light Theme">
      <i class="fa-solid fa-moon"></i>
    </button>
  </div>

  <div class="login-container">
    <div class="glass-panel login-box fade-in">
      
      <!-- Brand & Header -->
      <div class="brand-header">
        <div class="brand-logo">
          <i class="fa-solid fa-headset"></i>
        </div>
        <h1 class="brand-title gradient-text">RootTech Telephony Portal</h1>
        <p class="brand-subtitle">Enter Agent Extension or Admin ID to sign in</p>
      </div>

      <!-- Alert Box -->
      <div id="alertBox" class="alert alert-danger" style="display: none;">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span id="alertMessage">Invalid Credentials</span>
      </div>

      <!-- Login Form -->
      <form id="loginForm" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="agentCode">Agent Extension / Admin ID</label>
          <div class="input-wrapper">
            <i class="fa-solid fa-id-badge input-icon"></i>
            <input 
              type="text" 
              id="agentCode" 
              class="form-input" 
              placeholder="e.g. 1001 or admin" 
              value="1001" 
              required 
              autofocus
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <div class="input-wrapper">
            <i class="fa-solid fa-lock input-icon"></i>
            <input 
              type="password" 
              id="password" 
              class="form-input" 
              placeholder="Enter password" 
              value="Agent@123" 
              required
            >
            <button 
              type="button" 
              id="togglePasswordBtn" 
              class="password-toggle-btn" 
              onclick="togglePasswordVisibility()" 
              title="Show/Hide Password"
            >
              <i class="fa-regular fa-eye" id="togglePasswordIcon"></i>
            </button>
          </div>
        </div>

        <button type="submit" id="btnLogin" class="btn btn-primary btn-block" style="margin-top: 18px;">
          <span>Sign In to Portal</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </form>

      <!-- Demo Credentials Helper -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
        <div class="demo-credentials-card" style="margin: 0;">
          <div class="demo-text">
            <span><strong style="color:var(--accent-emerald);"><i class="fa-solid fa-user-shield"></i> Admin:</strong> ID <span class="demo-code">admin</span> | Pass <span class="demo-code">Admin@123</span></span>
          </div>
          <button type="button" class="btn-fill-demo" onclick="fillDemoCredentials('admin', 'Admin@123')" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.3);">
            <i class="fa-solid fa-shield-check"></i> Fill Admin
          </button>
        </div>

        <div class="demo-credentials-card" style="margin: 0;">
          <div class="demo-text">
            <span><strong style="color:var(--accent-cyan);"><i class="fa-solid fa-headset"></i> Agent:</strong> Ext <span class="demo-code">1001</span> | Pass <span class="demo-code">Agent@123</span></span>
          </div>
          <button type="button" class="btn-fill-demo" onclick="fillDemoCredentials('1001', 'Agent@123')">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Fill Agent
          </button>
        </div>
      </div>

      <!-- Security / Footer Info -->
      <div class="login-footer">
        <i class="fa-solid fa-shield-halved"></i>
        <span>RootTech Cloud PBX &bull; 256-bit Encrypted Session</span>
      </div>

    </div>
  </div>

  <div id="toastContainer" class="toast-container"></div>

  <script src="assets/js/app.js"></script>
</body>
</html>
