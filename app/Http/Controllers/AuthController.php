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
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'agent_code' => 'required|string',
            'password'   => 'required|string',
        ]);

        $result = $this->apiService->agentLogin(
            $request->input('agent_code'),
            $request->input('password')
        );

        if (!empty($result['success']) && !empty($result['session_token'])) {
            session([
                'agent' => [
                    'session_token' => $result['session_token'],
                    'agent_code'    => $result['agent_code'] ?? $request->input('agent_code'),
                    'info'          => $result['agent'] ?? [],
                    'queue'         => $result['queue'] ?? 'root-support',
                ]
            ]);

            return response()->json([
                'success'       => true,
                'message'       => 'Login successful',
                'redirect'      => route('dashboard'),
                'session_token' => $result['session_token'],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'] ?? 'Authentication failed',
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
