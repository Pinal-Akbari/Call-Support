<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function index(Request $request): View|RedirectResponse
    {
        if (!session()->has('agent') || empty(session('agent.session_token'))) {
            return redirect()->route('login');
        }

        $agentCode = strtolower(trim((string) session('agent.agent_code', '')));
        $isAdmin = session('agent.is_admin', false) 
                || $agentCode === 'admin'
                || in_array(strtolower(session('agent.info.role', '')), ['admin', 'superadmin']);

        if (!$isAdmin) {
            return redirect()->route('dashboard')->with('error', 'Access denied: Administrator privileges required.');
        }

        return view('admin');
    }
}
