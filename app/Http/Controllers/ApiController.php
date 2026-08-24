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

            default:
                return response()->json([
                    'success' => false,
                    'message' => "Unsupported action '{$action}'"
                ], 400);
        }
    }
}
