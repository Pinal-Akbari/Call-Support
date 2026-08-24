@extends('layouts.app')

@section('title', 'Agent Login - RootTech Telephony')

@section('content')
<div class="login-wrapper">
  <div class="glass-card login-card">
    
    <div class="login-header">
      <div class="brand-logo">
        <i class="fa-solid fa-headset"></i>
      </div>
      <h1 class="brand-title">RootTech Telephony</h1>
      <p class="brand-subtitle">Support Agent Authentication Console</p>
    </div>

    <!-- Alert Message Box -->
    <div id="alertBox" class="alert alert-danger" style="display: none;">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span id="alertMessage">Invalid Agent Credentials</span>
    </div>

    <!-- Agent Login Form -->
    <form id="loginForm" class="login-form">
      @csrf
      
      <div class="form-group">
        <label for="agentCode" class="form-label">
          <i class="fa-solid fa-user-gear"></i> Agent Code / Extension
        </label>
        <input 
          type="text" 
          id="agentCode" 
          name="agent_code" 
          class="form-input" 
          placeholder="e.g. 1001" 
          value="1001" 
          required 
          autofocus
        >
      </div>

      <div class="form-group">
        <label for="password" class="form-label">
          <i class="fa-solid fa-lock"></i> Password
        </label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          class="form-input" 
          placeholder="••••••••" 
          value="Agent@123" 
          required
        >
      </div>

      <button type="submit" id="btnLogin" class="btn btn-primary btn-block" style="margin-top: 10px;">
        <i class="fa-solid fa-right-to-bracket"></i>
        <span>Sign In to Telephony Console</span>
      </button>
    </form>

    <div class="login-footer">
      <span>Protected by BSNL RootTech Infrastructure &bull; Bearer Auth Enabled</span>
    </div>

  </div>
</div>
@endsection
