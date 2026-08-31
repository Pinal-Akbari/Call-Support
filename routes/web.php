<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Middleware\EnsureAdminAuthenticated;
use App\Http\Middleware\EnsureAgentAuthenticated;
use Illuminate\Support\Facades\Route;

// Redirect Root to appropriate portal based on role
Route::get('/', function () {
    if (session()->has('agent') && !empty(session('agent.session_token'))) {
        $agentCode = strtolower(trim((string) session('agent.agent_code', '')));
        $isAdmin = session('agent.is_admin', false) || $agentCode === 'admin';
        return redirect()->route($isAdmin ? 'admin' : 'dashboard');
    }
    return redirect()->route('login');
});

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/logout', [AuthController::class, 'logout'])->name('logout');
Route::post('/status', [AuthController::class, 'updateStatus'])->name('agent.status');

// Public Audio Streaming Route for HTML5 Audio Player
Route::get('/api/telephony/stream_audio', [ApiController::class, 'streamAudio'])->name('api.telephony.stream');

// Protected Routes requiring Agent/Admin Authentication
Route::middleware(['agent.auth'])->group(function () {
    // Support Agent Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // AJAX Proxy API Endpoint
    Route::match(['get', 'post'], '/api/telephony/{action}', [ApiController::class, 'handleAction'])->name('api.telephony');
});

// Admin Control Center (Strictly protected for Admin role only)
Route::middleware(['admin.auth'])->group(function () {
    Route::get('/admin', [AdminController::class, 'index'])->name('admin');
});
