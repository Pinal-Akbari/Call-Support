<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminAuthenticated
{
    /**
     * Handle an incoming request for Admin-only routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!session()->has('agent') || empty(session('agent.session_token'))) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['success' => false, 'message' => 'Admin session expired. Please log in.'], 401);
            }
            return redirect()->route('login');
        }

        $agentCode = strtolower(trim((string) session('agent.agent_code', '')));
        $isAdmin = session('agent.is_admin', false) 
                || $agentCode === 'admin' 
                || in_array(strtolower(session('agent.info.role', '')), ['admin', 'superadmin']);

        if (!$isAdmin) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['success' => false, 'message' => 'Access denied: Admin privileges required.'], 403);
            }
            return redirect()->route('dashboard')->with('error', 'Access denied: Administrator privileges required.');
        }

        return $next($request);
    }
}