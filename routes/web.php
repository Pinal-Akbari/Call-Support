<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Middleware\EnsureAgentAuthenticated;
use Illuminate\Support\Facades\Route;

// Redirect Root to Login or Dashboard
Route::get('/', function () {
    if (session()->has('agent') && !empty(session('agent.session_token'))) {
        return redirect()->route('dashboard');
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

// Protected Routes requiring Agent Authentication
Route::middleware([EnsureAgentAuthenticated::class])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/admin', [AdminController::class, 'index'])->name('admin');

    // AJAX Proxy API Endpoint
    Route::match(['get', 'post'], '/api/telephony/{action}', [ApiController::class, 'handleAction'])->name('api.telephony');
});
