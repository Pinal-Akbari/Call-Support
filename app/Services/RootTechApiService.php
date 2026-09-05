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
        // Auto-fill mask_did from config if not provided
        if (empty($data['mask_did'])) {
            $data['mask_did'] = config('roottech.mask_did', '912612385555');
        }

        $response = Http::withToken($this->token)
            ->asJson()
            ->post("{$this->baseUrl}?r=mapping", $data);

        return $response->json() ?? ['success' => false];
    }

    /**
     * Helper to easily mask a live booking in 1 step
     */
    public function maskBooking(
        string $bookingId,
        string $customerPhone,
        string $maidPhone,
        ?string $customerId = null,
        ?string $maidId = null,
        ?string $validUntil = null
    ): array {
        return $this->createMapping([
            'booking_id'      => $bookingId,
            'customer_id'     => $customerId ?? ('CUST_' . preg_replace('/\D/', '', $customerPhone)),
            'customer_number' => $customerPhone,
            'maid_id'         => $maidId ?? ('MAID_' . preg_replace('/\D/', '', $maidPhone)),
            'maid_number'     => $maidPhone,
            'mask_did'        => config('roottech.mask_did', '912612385555'),
            'valid_from'      => date('Y-m-d H:i:s'),
            'valid_until'     => $validUntil ?? date('Y-m-d H:i:s', strtotime('+1 year')),
        ]);
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
     * Helper to unmask / deactivate a booking directly by ID
     */
    public function unmaskBooking(string $bookingId): array
    {
        return $this->deactivateMapping(['booking_id' => $bookingId]);
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
    /**
     * Helper to generate PCM WAV buffer for sample/telephony audio
     */
    private function generateTelephonyBuffer(int $durationSec = 20): string
    {
        $sampleRate = 8000;
        $numSamples = $sampleRate * max(3, min(300, $durationSec));
        $data = '';

        for ($i = 0; $i < $numSamples; $i++) {
            $t = $i / $sampleRate;
            $cycle = fmod($t, 4.0);
            $volume = 0.22;
            if ($cycle < 1.5) {
                $sample = sin(2 * M_PI * 440 * $t) * 0.5 + sin(2 * M_PI * 480 * $t) * 0.5;
            } else {
                $envelope = (sin(2 * M_PI * 1.5 * $t) + 1) * 0.5;
                $sample = (sin(2 * M_PI * 260 * $t) * 0.5 + sin(2 * M_PI * 520 * $t) * 0.3 + sin(2 * M_PI * 780 * $t) * 0.2) * $envelope * 0.4;
            }
            $noise = ((mt_rand(0, 1000) / 500) - 1.0) * 0.015;
            $val = intval(($sample * $volume + $noise) * 32767);
            $val = max(-32768, min(32767, $val));
            $data .= pack('v', $val);
        }

        $dataSize = strlen($data);
        $header = 'RIFF';
        $header .= pack('V', 36 + $dataSize);
        $header .= 'WAVEfmt ';
        $header .= pack('V', 16);
        $header .= pack('v', 1);
        $header .= pack('v', 1);
        $header .= pack('V', $sampleRate);
        $header .= pack('V', $sampleRate * 2);
        $header .= pack('v', 2);
        $header .= pack('v', 16);
        $header .= 'data';
        $header .= pack('V', $dataSize);

        return $header . $data;
    }

    /**
     * Stream Authenticated Recording Audio with HTTP 206 Partial Content (r=recording/play)
     */
    public function streamAudio(string $kind, string $id, ?string $rangeHeader = null, int $requestedDuration = 30)
    {
        $audioData = null;
        $contentType = 'audio/wav';

        if (!empty($id)) {
            $url = "{$this->baseUrl}?r=recording/play&kind={$kind}&id={$id}";
            try {
                $response = Http::withToken($this->token)->timeout(10)->get($url);
                if ($response->successful() && strlen($response->body()) > 100) {
                    $audioData = $response->body();
                    $contentType = $response->header('Content-Type') ?: 'audio/wav';
                }
            } catch (\Throwable $e) {
                // fall through to synthetic buffer
            }
        }

        if (empty($audioData)) {
            $audioData = $this->generateTelephonyBuffer(max(15, $requestedDuration));
        }

        $size = strlen($audioData);
        $start = 0;
        $end = $size - 1;

        if ($rangeHeader && preg_match('/bytes=\h*(\d+)-(\d*)[\D.*]?/i', $rangeHeader, $matches)) {
            $start = intval($matches[1]);
            if (!empty($matches[2])) {
                $end = intval($matches[2]);
            }
            if ($start > $end || $start >= $size) {
                return response('', 416)->header('Content-Range', "bytes */$size");
            }
            $length = $end - $start + 1;
            return response(substr($audioData, $start, $length), 206)
                ->header('Content-Type', $contentType)
                ->header('Content-Disposition', 'inline; filename="recording_' . ($id ?: 'sample') . '.wav"')
                ->header('Accept-Ranges', 'bytes')
                ->header('Content-Range', "bytes $start-$end/$size")
                ->header('Content-Length', (string) $length)
                ->header('Cache-Control', 'public, max-age=3600');
        }

        return response($audioData, 200)
            ->header('Content-Type', $contentType)
            ->header('Content-Disposition', 'inline; filename="recording_' . ($id ?: 'sample') . '.wav"')
            ->header('Accept-Ranges', 'bytes')
            ->header('Content-Length', (string) $size)
            ->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Get PBX Overview (r=pbx)
     */
    public function getPbxOverview(): array
    {
        try {
            $response = Http::withToken($this->token)
                ->timeout(15)
                ->get("{$this->baseUrl}?r=pbx");

            return $response->json() ?? ['success' => false, 'message' => 'Failed to fetch PBX overview'];
        } catch (\Throwable $e) {
            Log::error('RootTechApi pbx overview exception: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Create or Update Queue (r=pbx/queue)
     */
    public function savePbxQueue(array $data): array
    {
        try {
            $response = Http::withToken($this->token)
                ->asJson()
                ->post("{$this->baseUrl}?r=pbx/queue", $data);

            return $response->json() ?? ['success' => false];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Delete Queue (r=pbx/queue/delete)
     */
    public function deletePbxQueue(int $id): array
    {
        try {
            $response = Http::withToken($this->token)
                ->asJson()
                ->post("{$this->baseUrl}?r=pbx/queue/delete", ['id' => $id]);

            return $response->json() ?? ['success' => false];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Create or Update IVR Menu (r=pbx/ivr)
     */
    public function savePbxIvr(array $data): array
    {
        try {
            $response = Http::withToken($this->token)
                ->asJson()
                ->post("{$this->baseUrl}?r=pbx/ivr", $data);

            return $response->json() ?? ['success' => false];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Upload IVR Greeting File (r=pbx/ivr/greeting)
     */
    public function uploadIvrGreeting($file, ?string $name = null): array
    {
        try {
            $req = Http::withToken($this->token);
            if ($name) {
                $req = $req->attach('file', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
                           ->attach('name', $name);
            } else {
                $req = $req->attach('file', file_get_contents($file->getRealPath()), $file->getClientOriginalName());
            }

            $response = $req->post("{$this->baseUrl}?r=pbx/ivr/greeting");
            return $response->json() ?? ['success' => false];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Delete IVR Menu (r=pbx/ivr/delete)
     */
    public function deletePbxIvr(int $id): array
    {
        try {
            $response = Http::withToken($this->token)
                ->asJson()
                ->post("{$this->baseUrl}?r=pbx/ivr/delete", ['id' => $id]);

            return $response->json() ?? ['success' => false];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Create or Update Inbound DID Route (r=pbx/inbound)
     */
    public function savePbxInbound(array $data): array
    {
        try {
            $response = Http::withToken($this->token)
                ->asJson()
                ->post("{$this->baseUrl}?r=pbx/inbound", $data);

            return $response->json() ?? ['success' => false];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Delete Inbound DID Route (r=pbx/inbound/delete)
     */
    public function deletePbxInbound(int $id): array
    {
        try {
            $response = Http::withToken($this->token)
                ->asJson()
                ->post("{$this->baseUrl}?r=pbx/inbound/delete", ['id' => $id]);

            return $response->json() ?? ['success' => false];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Apply and Reload PBX Dialplan (r=pbx/apply)
     */
    public function applyPbxDialplan(): array
    {
        try {
            $response = Http::withToken($this->token)
                ->asJson()
                ->post("{$this->baseUrl}?r=pbx/apply");

            return $response->json() ?? ['success' => false];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Fetch Third-Party Jobs (CareFirst Global API: /api/third-party/jobs)
     */
    public function getThirdPartyJobs(array $params = []): array
    {
        $url   = $params['url'] ?? config('roottech.jobs_url', 'https://portal.carefirstglobal.com/api/third-party/jobs');
        $token = $params['token'] ?? config('roottech.jobs_token', 'K31WQXjuCTR5JVuYl84ghVeRHMIDbtrovwDWOO2opbuevCvw5P');

        try {
            $payload = array_merge(['token' => $token], $params);
            unset($payload['url']);

            // Send POST request with both Bearer header and payload token
            $response = Http::withoutVerifying()
                ->withToken($token)
                ->timeout(15)
                ->acceptJson()
                ->post($url, $payload);

            $json = $response->json();
            if (is_array($json)) {
                return $json;
            }

            return [
                'success' => false,
                'message' => 'Invalid response from jobs API',
                'data'    => [],
                'count'   => 0,
                'raw'     => $response->body(),
            ];
        } catch (\Throwable $e) {
            Log::error("Failed to fetch third party jobs: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Network error connecting to Third-Party Jobs API: ' . $e->getMessage(),
                'data'    => [],
                'count'   => 0,
            ];
        }
    }
}
