<?php
session_start();
if (isset($_SESSION['agent']) && !empty($_SESSION['agent']['session_token'])) {
    header('Location: dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Portal | Login</title>
  <meta name="description" content="RootTech Agent Portal Login Interface">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <div class="login-container">
    <div class="glass-panel login-box fade-in">
      <div class="brand-header">
        <div class="brand-logo">
          <i class="fa-solid fa-headset"></i>
        </div>
        <h1 class="brand-title gradient-text">RootTech Agent Portal</h1>
        <p class="brand-subtitle">Enter your agent credentials to access call dashboard</p>
      </div>

      <div id="alertBox" class="alert alert-danger" style="display: none;">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span id="alertMessage">Invalid agent credentials</span>
      </div>

      <form id="loginForm" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="agentCode">Agent Code</label>
          <div class="input-wrapper">
            <input type="text" id="agentCode" class="form-input" placeholder="e.g. 1001" value="1001" required>
            <i class="fa-solid fa-id-badge input-icon"></i>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <div class="input-wrapper">
            <input type="password" id="password" class="form-input" placeholder="Enter password" value="Agent@123" required>
            <i class="fa-solid fa-lock input-icon"></i>
          </div>
        </div>

        <button type="submit" id="btnLogin" class="btn btn-primary" style="margin-top: 12px;">
          <span>Sign In to Dashboard</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </form>
    </div>
  </div>

  <div id="toastContainer" class="toast-container"></div>

  <script src="assets/js/app.js"></script>
</body>
</html>
