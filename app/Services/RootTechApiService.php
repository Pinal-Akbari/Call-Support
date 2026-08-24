<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RootTechApiService
{
    protected string $baseUrl;
    protected string $token;

    public function __construct()
    {
        $this->baseUrl = config('roottech.base_url', 'http://117.217.126.149:880/roottech/index.php');
        $this->token = config('roottech.bearer_token', '11af5c25470d1306970a9175df8a1213da7435960305169f');
    }

    /**
     * Agent Login (r=agent/login)
     */
    public function agentLogin(string $agentCode, string $password): array
    {
        $response = Http::asJson()
            ->post("{$this->baseUrl}?r=agent/login", [
                'agent_code' => $agentCode,
                'password'   => $password,
            ]);

        return $response->json() ?? ['success' => false, 'message' => 'HTTP request failed'];
    }

    /**
     * Agent Status Update (r=agent/status)
     */
    public function updateAgentStatus(string $status, string $sessionToken): array
    {
        $response = Http::withToken($sessionToken)
            ->asJson()
            ->post("{$this->baseUrl}?r=agent/status", [
                'status' => $status,
            ]);

        return $response->json() ?? ['success' => false, 'message' => 'Status update failed'];
    }

    /**
     * Agent Logout on PBX (r=agent/logout)
     */
    public function agentLogout(string $sessionToken): array
    {
        try {
            $response = Http::withToken($sessionToken)
                ->asJson()
                ->post("{$this->baseUrl}?r=agent/logout");

            return $response->json() ?? ['success' => true];
        } catch (\Throwable $e) {
            return ['success' => true];
        }
    }

    /**
     * Agent Live Event Poll (r=agent/poll)
     */
    public function agentPoll(string $sessionToken): array
    {
        try {
            $response = Http::withToken($sessionToken)
                ->timeout(6)
                ->get("{$this->baseUrl}?r=agent/poll");

            return $response->json() ?? ['success' => false, 'has_event' => false];
        } catch (\Throwable $e) {
            return ['success' => false, 'has_event' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Agent Acknowledge Event (r=agent/ack)
     */
    public function agentAck(array $data, string $sessionToken): array
    {
        try {
            $response = Http::withToken($sessionToken)
                ->asJson()
                ->post("{$this->baseUrl}?r=agent/ack", $data);

            return $response->json() ?? ['success' => false];
        } catch (\Throwable $e) {
            return ['success' => false];
        }
    }

    /**
     * Generic Click-to-Call Originate (r=call)
     */
    public function originateCall(array $data): array
    {
        $response = Http::withToken($this->token)
            ->asJson()
            ->post("{$this->baseUrl}?r=call", $data);

        return $response->json() ?? ['success' => false];
    }

    /**
     * System Auth Check (r=auth/check)
     */
    public function authCheck(): array
    {
        $response = Http::withToken($this->token)->get("{$this->baseUrl}?r=auth/check");
        return $response->json() ?? ['success' => false];
    }

    /**
     * Get Agents Directory (r=agent/list)
     */
    public function getAgentList(): array
    {
        $response = Http::withToken($this->token)->get("{$this->baseUrl}?r=agent/list");
        return $response->json() ?? ['success' => false, 'agents' => []];
    }

    /**
     * Create Support Agent (r=agent/create)
     */
    public function createAgent(array $data): array
    {
        $response = Http::withToken($this->token)
            ->asJson()
            ->post("{$this->baseUrl}?r=agent/create", $data);

        return $response->json() ?? ['success' => false];
    }

    /**
     * Update Support Agent (r=agent/update)
     */
    public function updateAgent(array $data): array
    {
        $response = Http::withToken($this->token)
            ->asJson()
            ->post("{$this->baseUrl}?r=agent/update", $data);

        return $response->json() ?? ['success' => false, 'message' => 'Update failed'];
    }

    /**
     * Delete Support Agent (r=agent/delete)
     */
    public function deleteAgent(int $id): array
    {
        $response = Http::withToken($this->token)
            ->asJson()
            ->post("{$this->baseUrl}?r=agent/delete", ['id' => $id]);

        return $response->json() ?? ['success' => false];
    }

    /**
     * Save / Upsert DID Masking (r=mapping)
     */
    public function createMapping(array $data): array
    {
        $response = Http::withToken($this->token)
            ->asJson()
            ->post("{$this->baseUrl}?r=mapping", $data);

        return $response->json() ?? ['success' => false];
    }

    /**
     * Deactivate DID Masking (r=mapping/deactivate)
     */
    public function deactivateMapping(array $data): array
    {
        $response = Http::withToken($this->token)
            ->asJson()
            ->post("{$this->baseUrl}?r=mapping/deactivate", $data);

        return $response->json() ?? ['success' => false];
    }

    /**
     * Click-to-Call Customer (r=call/customer)
     */
    public function callCustomer(array $data): array
    {
        $response = Http::withToken($this->token)
            ->asJson()
            ->post("{$this->baseUrl}?r=call/customer", $data);

        return $response->json() ?? ['success' => false];
    }

    /**
     * Click-to-Call Maid (r=call/maid)
     */
    public function callMaid(array $data): array
    {
        $response = Http::withToken($this->token)
            ->asJson()
            ->post("{$this->baseUrl}?r=call/maid", $data);

        return $response->json() ?? ['success' => false];
    }

    /**
     * Check Call Status (r=call/status/{id})
     */
    public function getCallStatus(string $requestId): array
    {
        $response = Http::withToken($this->token)->get("{$this->baseUrl}?r=call/status/{$requestId}");
        return $response->json() ?? ['success' => false];
    }

    /**
     * Get Call Recordings List (r=recordings)
     */
    public function getRecordings(?string $from = null, ?string $to = null, ?string $q = null, int $limit = 100): array
    {
        // Build full URL manually to avoid Guzzle merging issues with existing query string
        $params = ['r' => 'recordings', 'limit' => $limit];
        if (!empty($from)) $params['from'] = $from;
        if (!empty($to))   $params['to']   = $to;
        if (!empty($q))    $params['q']    = $q;

        $baseWithoutQuery = strtok($this->baseUrl, '?');
        $url = $baseWithoutQuery . '?' . http_build_query($params);

        try {
            $response = Http::withToken($this->token)
                ->timeout(15)
                ->get($url);

            if ($response->successful()) {
                $json = $response->json();
                if ($json !== null) {
                    return $json;
                }
                Log::warning('RootTechApi recordings: response is not valid JSON', ['body' => $response->body()]);
            } else {
                Log::error('RootTechApi recordings: HTTP ' . $response->status(), ['url' => $url, 'body' => $response->body()]);
            }
        } catch (\Throwable $e) {
            Log::error('RootTechApi recordings exception: ' . $e->getMessage());
        }

        return ['success' => false, 'rows' => [], 'message' => 'Failed to fetch recordings from API'];
    }

    /**
     * Get API Telephony Logs & Reports (r=logs)
     */
    public function getLogs(
        ?string $from = null,
        ?string $to = null,
        ?string $endpoint = null,
        ?string $http = null,
        ?string $q = null,
        int $page = 1,
        int $limit = 50,
        ?int $id = null
    ): array {
        $params = [
            'r'     => 'logs',
            'page'  => $page,
            'limit' => $limit,
        ];

        if (!empty($from))     $params['from']     = $from;
        if (!empty($to))       $params['to']       = $to;
        if (!empty($endpoint)) $params['endpoint'] = $endpoint;
        if (!empty($http))     $params['http']     = $http;
        if (!empty($q))        $params['q']        = $q;
        if (!empty($id))       $params['id']       = $id;

        $baseWithoutQuery = strtok($this->baseUrl, '?');
        $url = $baseWithoutQuery . '?' . http_build_query($params);

        try {
            $response = Http::withToken($this->token)
                ->timeout(15)
                ->get($url);

            if ($response->successful()) {
                $json = $response->json();
                if ($json !== null) {
                    return $json;
                }
                Log::warning('RootTechApi logs: response is not valid JSON', ['body' => $response->body()]);
            } else {
                Log::error('RootTechApi logs: HTTP ' . $response->status(), ['url' => $url, 'body' => $response->body()]);
            }
        } catch (\Throwable $e) {
            Log::error('RootTechApi logs exception: ' . $e->getMessage());
        }

        return ['success' => false, 'rows' => [], 'total' => 0, 'message' => 'Failed to fetch logs from API'];
    }

    /**
     * Stream Authenticated Recording Audio (r=recording/play)
     */
    public function streamAudio(string $kind, string $id)
    {
        $url = "{$this->baseUrl}?r=recording/play&kind={$kind}&id={$id}";

        $response = Http::withToken($this->token)->get($url);

        if ($response->successful()) {
            $contentType = $response->header('Content-Type') ?: 'audio/wav';
            return response($response->body(), 200)
                ->header('Content-Type', $contentType)
                ->header('Content-Disposition', 'inline; filename="recording_' . $id . '.wav"')
                ->header('Accept-Ranges', 'bytes');
        }

        return response()->json([
            'success' => false,
            'message' => 'Audio recording not found or unavailable'
        ], 404);
    }
}
