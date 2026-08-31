<?php

namespace App\Http\Controllers;

use App\Models\AgentPermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionApiController extends Controller
{
    /**
     * Get all agents' permissions.
     * GET /api/permissions
     */
    public function index(): JsonResponse
    {
        $allRecords = AgentPermission::all()->keyBy('agent_code');
        
        return response()->json([
            'success'         => true,
            'message'         => 'Agent permissions retrieved successfully.',
            'total'           => $allRecords->count(),
            'permissions'     => $allRecords,
            'all_modules'     => AgentPermission::$allModules,
            'default_modules' => AgentPermission::$defaultModules,
        ]);
    }

    /**
     * Get permissions for a specific agent.
     * GET /api/permissions/{agentCode}
     */
    public function show(string $agentCode): JsonResponse
    {
        $agentCode = trim($agentCode);
        if (empty($agentCode)) {
            return response()->json([
                'success' => false,
                'message' => 'Agent code parameter is required.',
            ], 400);
        }

        $allowedModules = AgentPermission::getPermissions($agentCode);

        return response()->json([
            'success'         => true,
            'agent_code'      => $agentCode,
            'is_admin'        => strtolower($agentCode) === 'admin',
            'allowed_modules' => $allowedModules,
            'all_modules'     => AgentPermission::$allModules,
            'default_modules' => AgentPermission::$defaultModules,
        ]);
    }

    /**
     * Save / Update permissions for an agent.
     * POST /api/permissions/{agentCode} or POST /api/permissions
     * Payload: { "modules": ["dashboard", "call", "agents", "recordings"] }
     */
    public function store(Request $request, ?string $agentCode = null): JsonResponse
    {
        $code = trim((string) ($agentCode ?: $request->input('agent_code', '')));
        if (empty($code)) {
            return response()->json([
                'success' => false,
                'message' => 'Agent code is required to save permissions.',
            ], 422);
        }

        $rawModules = $request->input('modules', $request->input('allowed_modules', []));
        if (is_string($rawModules)) {
            $rawModules = json_decode($rawModules, true) ?: explode(',', $rawModules);
        }

        if (!is_array($rawModules)) {
            $rawModules = AgentPermission::$defaultModules;
        }

        // Filter valid modules
        $validKeys = array_keys(AgentPermission::$allModules);
        $cleanModules = array_values(array_intersect(array_map('trim', $rawModules), $validKeys));

        if (empty($cleanModules)) {
            $cleanModules = AgentPermission::$defaultModules;
        }

        $record = AgentPermission::setPermissions($code, $cleanModules);

        return response()->json([
            'success'         => true,
            'message'         => "Permissions updated successfully for Agent '{$code}'!",
            'agent_code'      => $code,
            'allowed_modules' => $record->allowed_modules,
            'updated_at'      => $record->updated_at,
        ]);
    }

    /**
     * Reset / Delete custom permissions for an agent.
     * DELETE /api/permissions/{agentCode}
     */
    public function destroy(string $agentCode): JsonResponse
    {
        $agentCode = trim($agentCode);
        AgentPermission::where('agent_code', $agentCode)->delete();

        return response()->json([
            'success'         => true,
            'message'         => "Permissions for Agent '{$agentCode}' reset to system default.",
            'agent_code'      => $agentCode,
            'allowed_modules' => AgentPermission::$defaultModules,
        ]);
    }
}
