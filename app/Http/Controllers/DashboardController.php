<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        $agentSession = session('agent', []);
        $agentInfo = $agentSession['info'] ?? [];

        return view('dashboard', [
            'agentSession' => $agentSession,
            'agentName'    => $agentInfo['full_name'] ?? 'Support Agent',
            'agentCode'    => $agentInfo['agent_code'] ?? ($agentSession['agent_code'] ?? '1001'),
            'status'       => $agentInfo['status'] ?? 'offline',
            'queue'        => $agentSession['queue'] ?? 'root-support',
        ]);
    }
}
