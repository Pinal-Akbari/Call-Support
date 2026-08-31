<?php

namespace App\Http\Controllers;

use App\Models\AgentPermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionApiController extends Controller
{
    /**
     * List all agents and their configured permissions.
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
     * Get all available system modules and default permission sets.
     * GET /api/permissions/modules
     */
    public function modules(): JsonResponse
    {
        return response()->json([
            'success'         => true,
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
     * Create or update permissions for an agent.
     * POST /api/permissions or POST /api/permissions/{agentCode}
     * Payload: { "agent_code": "1001", "modules": ["dashboard", "call", "recordings"] }
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

        // Filter valid modules against system definitions
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
     * Update permissions for a specific agent.
     * PUT /api/permissions/{agentCode}
     */
    public function update(Request $request, string $agentCode): JsonResponse
    {
        return $this->store($request, $agentCode);
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
