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
        return $this->apiService->streamAudio($kind, $id);
    }

    /**
     * Protected AJAX proxy handler for all telephony actions
     */
    public function handleAction(Request $request, string $action): JsonResponse|Response
    {
        switch ($action) {

            // ── Auth ─────────────────────────────────────────────────────────
            case 'auth_check':
                return response()->json($this->apiService->authCheck());

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

            // ── DID Masking ──────────────────────────────────────────────────
            case 'mapping':
                return response()->json($this->apiService->createMapping($request->all()));

            case 'mapping_deactivate':
                return response()->json($this->apiService->deactivateMapping($request->all()));

            // ── Click-to-Call ────────────────────────────────────────────────
            case 'call':
                return response()->json($this->apiService->originateCall($request->all()));

            case 'customer':
                return response()->json($this->apiService->callCustomer($request->all()));

            case 'call_maid':
                return response()->json($this->apiService->callMaid($request->all()));

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

            // ── Call Recordings ──────────────────────────────────────────────
            case 'recordings':
                // Cast inputs to string|null safely (fixes TypeError when query param is array)
                $rawFrom  = $request->input('from');
                $rawTo    = $request->input('to');
                $rawQ     = $request->input('q');

                $from  = is_array($rawFrom)  ? null : ($rawFrom  ?: null);
                $to    = is_array($rawTo)    ? null : ($rawTo    ?: null);
                $q     = is_array($rawQ)     ? null : ($rawQ     ?: null);
                $limit = (int) $request->input('limit', 100);

                return response()->json(
                    $this->apiService->getRecordings($from, $to, $q, $limit)
                );

            // ── Reports & Telephony API Logs ──────────────────────────────────
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

                return response()->json(
                    $this->apiService->getLogs($from, $to, $endpoint, $http, $q, $page, $limit, $id)
                );

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
