<?php

namespace App\Http\Controllers;

use App\Services\RootTechApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AuthController extends Controller
{
    protected RootTechApiService $apiService;

    public function __construct(RootTechApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    public function showLogin(): View|RedirectResponse
    {
        if (session()->has('agent') && !empty(session('agent.session_token'))) {
            $agentCode = strtolower(trim((string) session('agent.agent_code', '')));
            $isAdmin = session('agent.is_admin', false) || $agentCode === 'admin';
            return redirect()->route($isAdmin ? 'admin' : 'dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'agent_code' => 'required|string',
            'password'   => 'required|string',
        ]);

        $inputCode = trim((string) $request->input('agent_code'));
        $password  = (string) $request->input('password');

        $result = $this->apiService->agentLogin($inputCode, $password);

        if (!empty($result['success']) && !empty($result['session_token'])) {
            $resolvedCode = $result['agent_code'] ?? $inputCode;
            $isAdmin = strtolower($resolvedCode) === 'admin'
                    || (!empty($result['agent']['role']) && in_array(strtolower($result['agent']['role']), ['admin', 'superadmin']));

            session([
                'agent' => [
                    'session_token' => $result['session_token'],
                    'agent_code'    => $resolvedCode,
                    'info'          => $result['agent'] ?? [],
                    'queue'         => $result['queue'] ?? 'root-support',
                    'is_admin'      => $isAdmin,
                ]
            ]);

            $targetRoute = $isAdmin ? route('admin') : route('dashboard');
            $welcomeMsg  = $isAdmin ? 'Admin authentication successful! Opening Admin Console...' : 'Agent login successful! Opening Dashboard...';

            return response()->json([
                'success'       => true,
                'message'       => $welcomeMsg,
                'redirect'      => $targetRoute,
                'session_token' => $result['session_token'],
                'is_admin'      => $isAdmin,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'] ?? 'Invalid ID or Password. Please try again.',
        ], 401);
    }

    public function logout(Request $request): RedirectResponse
    {
        $sessionToken = session('agent.session_token', '');
        if (!empty($sessionToken)) {
            $this->apiService->agentLogout($sessionToken);
        }

        $request->session()->forget('agent');
        $request->session()->flush();

        return redirect()->route('login');
    }

    public function updateStatus(Request $request): JsonResponse
    {
        $status = $request->input('status', 'available');
        $sessionToken = session('agent.session_token', '');

        if (empty($sessionToken)) {
            return response()->json(['success' => false, 'message' => 'Agent session expired'], 401);
        }

        $res = $this->apiService->updateAgentStatus($status, $sessionToken);

        if (!empty($res['success'])) {
            session(['agent.info.status' => $status]);
        }

        return response()->json($res);
    }
}
