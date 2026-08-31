<?php

namespace App\Http\Controllers;

use App\Models\AgentPermission;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        $agentSession = session('agent', []);
        $agentInfo = $agentSession['info'] ?? [];
        $agentCode = $agentInfo['agent_code'] ?? ($agentSession['agent_code'] ?? '1001');

        $allowedModules = AgentPermission::getPermissions($agentCode);

        return view('dashboard', [
            'agentSession'   => $agentSession,
            'agentName'      => $agentInfo['full_name'] ?? 'Support Agent',
            'agentCode'      => $agentCode,
            'status'         => $agentInfo['status'] ?? 'offline',
            'queue'          => $agentSession['queue'] ?? 'root-support',
            'allowedModules' => $allowedModules,
        ]);
    }
}
