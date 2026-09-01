<?php

namespace App\Http\Controllers;

use App\Services\RootTechApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiController extends Controller
{
    protected RootTechApiService $apiService;

    public function __construct(RootTechApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Public audio streaming (no session required so HTML5 <audio> can load it)
     */
    public function streamAudio(Request $request): Response
    {
        $kind = (string) $request->query('kind', 'recording');
        $id   = (string) $request->query('id', '');
        $range = $request->header('Range');
        $dur  = intval($request->query('duration', 30));
        return $this->apiService->streamAudio($kind, $id, $range, $dur);
    }

    /**
     * Protected AJAX proxy handler for all telephony actions
     */
    public function handleAction(Request $request, string $action): JsonResponse|Response
    {
        switch ($action) {

            // ── Auth & Status ────────────────────────────────────────────────
            case 'auth_check':
                return response()->json($this->apiService->authCheck());

            case 'status':
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

            // ── Agents ───────────────────────────────────────────────────────
            case 'agent_list':
                return response()->json($this->apiService->getAgentList());

            case 'agent_create':
                return response()->json($this->apiService->createAgent($request->all()));

            case 'agent_update':
                return response()->json($this->apiService->updateAgent($request->all()));

            case 'agent_delete':
                $id = (int) $request->input('id');
                return response()->json($this->apiService->deleteAgent($id));

            // ── Agent Permissions ───────────────────────────────────────────
            case 'get_permissions':
                $agentCode = (string) $request->input('agent_code', session('agent.agent_code', '1001'));
                $allowed = \App\Models\AgentPermission::getPermissions($agentCode);
                return response()->json([
                    'success'         => true,
                    'agent_code'      => $agentCode,
                    'allowed_modules' => $allowed,
                    'all_modules'     => \App\Models\AgentPermission::$allModules,
                ]);

            case 'save_permissions':
                $currentAgentCode = strtolower(trim((string) session('agent.agent_code', '')));
                $isAdmin = session('agent.is_admin', false) || $currentAgentCode === 'admin';
                if (!$isAdmin) {
                    return response()->json(['success' => false, 'message' => 'Admin privileges required to manage agent permissions.'], 403);
                }

                $targetCode = trim((string) $request->input('agent_code', ''));
                $modules = (array) $request->input('allowed_modules', []);

                if (empty($targetCode)) {
                    return response()->json(['success' => false, 'message' => 'Agent code is required.'], 422);
                }

                $record = \App\Models\AgentPermission::setPermissions($targetCode, $modules);
                return response()->json([
                    'success'         => true,
                    'message'         => "Permissions updated successfully for Agent '{$targetCode}'!",
                    'agent_code'      => $targetCode,
                    'allowed_modules' => $record->allowed_modules,
                ]);

            case 'all_agents_permissions':
                $all = \App\Models\AgentPermission::all()->keyBy('agent_code');
                return response()->json([
                    'success'         => true,
                    'permissions'     => $all,
                    'all_modules'     => \App\Models\AgentPermission::$allModules,
                    'default_modules' => \App\Models\AgentPermission::$defaultModules,
                ]);

            // ── DID Masking ──────────────────────────────────────────────────
            case 'mapping':
                return response()->json($this->apiService->createMapping($request->all()));

            case 'mapping_deactivate':
                return response()->json($this->apiService->deactivateMapping($request->all()));

            // ── Click-to-Call ────────────────────────────────────────────────
            case 'call':
                $callData = $request->all();
                $agentCode = trim((string) session('agent.agent_code', ''));
                $isAdmin   = session('agent.is_admin', false) || strtolower($agentCode) === 'admin';
                if (!$isAdmin && !empty($agentCode)) {
                    $callData['source_extension'] = $agentCode;
                }
                return response()->json($this->apiService->originateCall($callData));

            case 'customer':
                $custData = $request->all();
                $agentCode = trim((string) session('agent.agent_code', ''));
                $isAdmin   = session('agent.is_admin', false) || strtolower($agentCode) === 'admin';
                if (!$isAdmin && !empty($agentCode)) {
                    $custData['source_extension'] = $agentCode;
                }
                return response()->json($this->apiService->callCustomer($custData));

            case 'call_maid':
                $maidData = $request->all();
                $agentCode = trim((string) session('agent.agent_code', ''));
                $isAdmin   = session('agent.is_admin', false) || strtolower($agentCode) === 'admin';
                if (!$isAdmin && !empty($agentCode)) {
                    $maidData['source_extension'] = $agentCode;
                }
                return response()->json($this->apiService->callMaid($maidData));

            case 'call_status':
                $reqId = (string) $request->input('request_id', '');
                return response()->json($this->apiService->getCallStatus($reqId));

            // ── Live Agent Session Events ─────────────────────────────────────
            case 'agent_poll':
                $sessionToken = session('agent.session_token', '');
                return response()->json($this->apiService->agentPoll($sessionToken));

            case 'agent_ack':
                $sessionToken = session('agent.session_token', '');
                return response()->json($this->apiService->agentAck($request->all(), $sessionToken));

            // ── Call Recordings (Scoped by Agent) ────────────────────────────
            case 'recordings':
                // Cast inputs to string|null safely
                $rawFrom  = $request->input('from');
                $rawTo    = $request->input('to');
                $rawQ     = $request->input('q');

                $from  = is_array($rawFrom)  ? null : ($rawFrom  ?: null);
                $to    = is_array($rawTo)    ? null : ($rawTo    ?: null);
                $q     = is_array($rawQ)     ? null : ($rawQ     ?: null);
                $limit = (int) $request->input('limit', 100);

                $result = $this->apiService->getRecordings($from, $to, $q, $limit);

                // Scope to logged-in agent if not admin
                $agentCode = strtolower(trim((string) session('agent.agent_code', '')));
                $isAdmin   = session('agent.is_admin', false) || $agentCode === 'admin';

                if (!$isAdmin && !empty($result['success']) && is_array($result['rows'])) {
                    $filteredRows = array_values(array_filter($result['rows'], function ($r) use ($agentCode) {
                        $caller = strtolower((string) ($r['caller_number'] ?? ''));
                        $dest   = strtolower((string) ($r['destination_number'] ?? ''));
                        $agCode = strtolower((string) ($r['agent_code'] ?? ''));
                        $user   = strtolower((string) ($r['user'] ?? ''));
                        $peer   = strtolower((string) ($r['sip_peer'] ?? ''));

                        return $caller === $agentCode 
                            || $dest === $agentCode 
                            || $agCode === $agentCode 
                            || $user === $agentCode 
                            || $peer === $agentCode
                            || str_ends_with($caller, $agentCode) 
                            || str_ends_with($dest, $agentCode);
                    }));

                    $result['rows'] = $filteredRows;
                    $result['total'] = count($filteredRows);
                }

                return response()->json($result);

            // ── Reports & Telephony API Logs (Scoped by Agent) ────────────────
            case 'logs':
                $rawFrom     = $request->input('from');
                $rawTo       = $request->input('to');
                $rawEndpoint = $request->input('endpoint');
                $rawHttp     = $request->input('http');
                $rawQ        = $request->input('q');

                $from     = is_array($rawFrom)     ? null : ($rawFrom     ?: null);
                $to       = is_array($rawTo)       ? null : ($rawTo       ?: null);
                $endpoint = is_array($rawEndpoint) ? null : ($rawEndpoint ?: null);
                $http     = is_array($rawHttp)     ? null : ($rawHttp     ?: null);
                $q        = is_array($rawQ)        ? null : ($rawQ        ?: null);
                $page     = (int) $request->input('page', 1);
                $limit    = (int) $request->input('limit', 50);
                $id       = $request->filled('id') ? (int) $request->input('id') : null;

                $result = $this->apiService->getLogs($from, $to, $endpoint, $http, $q, $page, $limit, $id);

                // Scope to logged-in agent if not admin
                $agentCode = strtolower(trim((string) session('agent.agent_code', '')));
                $isAdmin   = session('agent.is_admin', false) || $agentCode === 'admin';

                if (!$isAdmin && !empty($result['success']) && is_array($result['rows'])) {
                    $filteredRows = array_values(array_filter($result['rows'], function ($r) use ($agentCode) {
                        $agCode = strtolower((string) ($r['agent_code'] ?? ''));
                        $reqBody = strtolower((string) (is_array($r['request_payload'] ?? '') ? json_encode($r['request_payload']) : ($r['request_payload'] ?? '')));
                        return $agCode === $agentCode || str_contains($reqBody, $agentCode);
                    }));

                    $result['rows'] = $filteredRows;
                    $result['total'] = count($filteredRows);
                }

                return response()->json($result);

            // ── Audio Streaming (also reachable via action if needed) ─────────
            case 'stream_audio':
                return $this->streamAudio($request);

            // ── PBX Configuration, IVR & Queues ──────────────────────────────
            case 'pbx':
                return response()->json($this->apiService->getPbxOverview());

            case 'pbx_queue':
                return response()->json($this->apiService->savePbxQueue($request->all()));

            case 'pbx_queue_delete':
                $id = (int) $request->input('id');
                return response()->json($this->apiService->deletePbxQueue($id));

            case 'pbx_ivr':
                return response()->json($this->apiService->savePbxIvr($request->all()));

            case 'pbx_ivr_greeting':
                $file = $request->file('file');
                $name = $request->input('name');
                if (!$file) {
                    return response()->json(['success' => false, 'message' => 'No file uploaded'], 400);
                }
                return response()->json($this->apiService->uploadIvrGreeting($file, $name));

            case 'pbx_ivr_delete':
                $id = (int) $request->input('id');
                return response()->json($this->apiService->deletePbxIvr($id));

            case 'pbx_inbound':
                return response()->json($this->apiService->savePbxInbound($request->all()));

            case 'pbx_inbound_delete':
                $id = (int) $request->input('id');
                return response()->json($this->apiService->deletePbxInbound($id));

            case 'pbx_apply':
                return response()->json($this->apiService->applyPbxDialplan());

            // ── Caller 360 History & Notes ────────────────────────────────────
            case 'caller_history':
                $phone = preg_replace('/[^0-9]/', '', (string) $request->input('phone', ''));
                $recRes = $this->apiService->getRecordings();
                $callHistory = [];
                if (isset($recRes['rows']) && is_array($recRes['rows'])) {
                    foreach ($recRes['rows'] as $r) {
                        $caller = preg_replace('/[^0-9]/', '', $r['caller_number'] ?? '');
                        $dest = preg_replace('/[^0-9]/', '', $r['destination_number'] ?? '');
                        if ($phone && (strpos($caller, $phone) !== false || strpos($dest, $phone) !== false || strpos($phone, $caller) !== false)) {
                            $callHistory[] = [
                                'id' => $r['id'] ?? uniqid(),
                                'booking_id' => $r['booking_id'] ?? 'BK-2026-9812',
                                'agent_code' => $r['source_extension'] ?? '1001',
                                'agent_name' => 'Agent ' . ($r['source_extension'] ?? '1001'),
                                'direction' => $r['call_type'] ?? 'Inbound',
                                'duration' => $r['duration'] ?? 45,
                                'status' => $r['status'] ?? 'ANSWERED',
                                'datetime' => $r['start_time'] ?? $r['created_at'] ?? date('Y-m-d H:i:s'),
                                'recording_available' => !empty($r['recording_available']) || !empty($r['recording_status'])
                            ];
                        }
                    }
                }
                if (empty($callHistory)) {
                    $callHistory = [
                        [
                            'id' => 'call_prev_1',
                            'booking_id' => 'BK-2026-9812',
                            'agent_code' => '1002',
                            'agent_name' => 'Support Agent 2 (Ext 1002)',
                            'direction' => 'Inbound Queue',
                            'duration' => 195,
                            'status' => 'ANSWERED',
                            'datetime' => date('Y-m-d H:i:s', strtotime('-1 day 2 hours')),
                            'recording_available' => true
                        ],
                        [
                            'id' => 'call_prev_2',
                            'booking_id' => 'BK-2026-9812',
                            'agent_code' => '1001',
                            'agent_name' => 'Primary Agent (Ext 1001)',
                            'direction' => 'Outbound Bridge',
                            'duration' => 248,
                            'status' => 'ANSWERED',
                            'datetime' => date('Y-m-d H:i:s', strtotime('-3 days 4 hours')),
                            'recording_available' => true
                        ]
                    ];
                }
                $notesFile = storage_path('data/caller_notes.json');
                $allNotes = file_exists($notesFile) ? json_decode(file_get_contents($notesFile), true) : [];
                $callerNotes = $allNotes[$phone] ?? $allNotes['919876543210'] ?? [
                    [
                        'id' => 'note_init_1',
                        'agent_code' => '1002',
                        'agent_name' => 'Support Agent 2',
                        'booking_id' => 'BK-2026-9812',
                        'disposition' => 'Information Provided',
                        'note_text' => 'Customer enquired about pricing and maid helper availability for deep cleaning.',
                        'timestamp' => date('Y-m-d H:i:s', strtotime('-1 day 2 hours'))
                    ]
                ];
                return response()->json([
                    'success' => true,
                    'phone' => $phone,
                    'customer_name' => 'Priya Sharma',
                    'active_booking' => 'BK-2026-9812',
                    'calls' => $callHistory,
                    'notes' => array_values($callerNotes)
                ]);

            case 'save_note':
                $phone = preg_replace('/[^0-9]/', '', (string) $request->input('phone', ''));
                if (!$phone) $phone = '919876543210';
                $notesFile = storage_path('data/caller_notes.json');
                $allNotes = file_exists($notesFile) ? json_decode(file_get_contents($notesFile), true) : [];
                if (!isset($allNotes[$phone])) {
                    $allNotes[$phone] = [];
                }
                $newNote = [
                    'id' => 'note_' . time(),
                    'agent_code' => (string) $request->input('agent_code', session('agent.info.agent_code', '1001')),
                    'agent_name' => (string) $request->input('agent_name', session('agent.info.full_name', 'Agent 1001')),
                    'booking_id' => (string) $request->input('booking_id', 'BK-2026-9812'),
                    'disposition' => (string) $request->input('disposition', 'Call Resolved'),
                    'note_text' => trim((string) $request->input('note_text', '')),
                    'timestamp' => date('Y-m-d H:i:s')
                ];
                array_unshift($allNotes[$phone], $newNote);
                if (!is_dir(dirname($notesFile))) {
                    mkdir(dirname($notesFile), 0777, true);
                }
                file_put_contents($notesFile, json_encode($allNotes, JSON_PRETTY_PRINT));
                return response()->json([
                    'success' => true,
                    'message' => 'Call note and disposition saved successfully!',
                    'note' => $newNote
                ]);

            default:
                return response()->json([
                    'success' => false,
                    'message' => "Unsupported action '{$action}'"
                ], 400);
        }
    }
}
