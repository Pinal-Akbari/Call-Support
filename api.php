<?php
session_start();

header('Content-Type: application/json');

define('DEFAULT_API_TOKEN', '11af5c25470d1306970a9175df8a1213da7435960305169f');
define('BASE_API_URL', 'http://117.217.126.149:880/roottech/index.php');

$action = $_GET['action'] ?? '';

// Helper function to send HTTP requests via cURL
function callRemoteApi($url, $method = 'POST', $payload = null, $bearerToken = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($payload !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }
    } else {
        curl_setopt($ch, CURLOPT_HTTPGET, true);
    }
    
    $tokenToUse = !empty($bearerToken) ? $bearerToken : DEFAULT_API_TOKEN;
    
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . trim($tokenToUse)
    ];
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($error) {
        return [
            'success' => false,
            'message' => 'Network error: ' . $error,
            'http_code' => $httpCode
        ];
    }
    
    $decoded = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'success' => false,
            'message' => 'Invalid JSON response from server',
            'raw_response' => $response
        ];
    }
    
    return $decoded;
}

// 1. LOGIN
if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $agentCode = trim($input['agent_code'] ?? '');
    $password = trim($input['password'] ?? '');
    
    if (empty($agentCode) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Agent code and password are required.']);
        exit;
    }
    
    $loginUrl = BASE_API_URL . '?r=agent/login';
    $response = callRemoteApi($loginUrl, 'POST', ['agent_code' => $agentCode, 'password' => $password]);
    
    if (isset($response['success']) && $response['success'] === true) {
        $resolvedCode = $response['agent_code'] ?? $agentCode;
        $isAdmin = strtolower($resolvedCode) === 'admin'
                || (!empty($response['agent']['role']) && in_array(strtolower($response['agent']['role']), ['admin', 'superadmin']));

        $_SESSION['agent'] = [
            'session_token' => $response['session_token'] ?? DEFAULT_API_TOKEN,
            'api_token' => DEFAULT_API_TOKEN,
            'agent_code' => $resolvedCode,
            'expires_at' => $response['expires_at'] ?? '',
            'info' => $response['agent'] ?? [],
            'queue' => $response['queue'] ?? '',
            'is_admin' => $isAdmin
        ];

        $response['is_admin'] = $isAdmin;
        $response['redirect'] = $isAdmin ? 'admin.php' : 'dashboard.php';
    }
    
    echo json_encode($response);
    exit;
}

// 2. CUSTOMER CALL
if ($action === 'customer') {
    $input = json_decode(file_get_contents('php://input'), true);
    $bookingId = trim($input['booking_id'] ?? 'BK202600123');
    $sourceExtension = trim($input['source_extension'] ?? '1001');
    $requestId = trim($input['request_id'] ?? 'REQ202600001');
    $customToken = trim($input['auth_token'] ?? '');
    
    $tokenToUse = !empty($customToken) ? $customToken : DEFAULT_API_TOKEN;
    $customerUrl = BASE_API_URL . '?r=call/customer';
    
    $response = callRemoteApi($customerUrl, 'POST', [
        'booking_id' => $bookingId,
        'source_extension' => $sourceExtension,
        'request_id' => $requestId
    ], $tokenToUse);
    
    echo json_encode($response);
    exit;
}

// 3. MAID CALL
if ($action === 'call_maid') {
    $input = json_decode(file_get_contents('php://input'), true);
    $bookingId = trim($input['booking_id'] ?? 'BK202600123');
    $sourceExtension = trim($input['source_extension'] ?? '1001');
    $requestId = trim($input['request_id'] ?? 'REQ202600002');
    
    $url = BASE_API_URL . '?r=call/maid';
    $response = callRemoteApi($url, 'POST', [
        'booking_id' => $bookingId,
        'source_extension' => $sourceExtension,
        'request_id' => $requestId
    ]);
    
    echo json_encode($response);
    exit;
}

// 4. CALL STATUS
if ($action === 'call_status') {
    $reqId = trim($_GET['request_id'] ?? 'REQ202600001');
    $url = BASE_API_URL . '?r=call/status/' . urlencode($reqId);
    $response = callRemoteApi($url, 'GET');
    echo json_encode($response);
    exit;
}

// 5. AGENT LIST
if ($action === 'agent_list') {
    $url = BASE_API_URL . '?r=agent/list';
    $response = callRemoteApi($url, 'GET');
    echo json_encode($response);
    exit;
}

// 6. AGENT CREATE
if ($action === 'agent_create') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=agent/create';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 7. AGENT UPDATE
if ($action === 'agent_update') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=agent/update';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 8. AGENT DELETE
if ($action === 'agent_delete') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=agent/delete';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 9. MAPPING CREATE / UPSERT
if ($action === 'mapping') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=mapping';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 10. MAPPING DEACTIVATE
if ($action === 'mapping_deactivate') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=mapping/deactivate';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 11. RECORDINGS LIST
if ($action === 'recordings') {
    $from = $_GET['from'] ?? date('Y-m-d');
    $to = $_GET['to'] ?? date('Y-m-d');
    $q = urlencode($_GET['q'] ?? '');
    $limit = intval($_GET['limit'] ?? 50);
    $page = intval($_GET['page'] ?? 1);
    
    $url = BASE_API_URL . "?r=recordings&from={$from}&to={$to}&q={$q}&page={$page}&limit={$limit}";
    $response = callRemoteApi($url, 'GET');

    $agentCode = strtolower(trim($_SESSION['agent']['agent_code'] ?? ''));
    $isAdmin   = !empty($_SESSION['agent']['is_admin']) || $agentCode === 'admin';

    if (!$isAdmin && !empty($response['success']) && is_array($response['rows'])) {
        $response['rows'] = array_values(array_filter($response['rows'], function ($r) use ($agentCode) {
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
        $response['total'] = count($response['rows']);
    }

    echo json_encode($response);
    exit;
}

// 11.1 STREAM AUDIO RECORDING
if ($action === 'stream_audio') {
    $kind = $_GET['kind'] ?? 'recording';
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing recording ID']);
        exit;
    }
    
    $url = BASE_API_URL . '?r=recording/play&kind=' . urlencode($kind) . '&id=' . urlencode($id);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . DEFAULT_API_TOKEN
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $audioData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'audio/wav';
    curl_close($ch);
    
    if ($httpCode === 200 && $audioData) {
        header('Content-Type: ' . $contentType);
        header('Content-Disposition: inline; filename="recording_' . preg_replace('/[^a-zA-Z0-9_-]/', '', $id) . '.wav"');
        header('Accept-Ranges: bytes');
        header('Content-Length: ' . strlen($audioData));
        echo $audioData;
        exit;
    } else {
        http_response_code($httpCode ?: 404);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Recording audio not found']);
        exit;
    }
}

// 12. AUTH CHECK
if ($action === 'auth_check') {
    $url = BASE_API_URL . '?r=auth/check';
    $response = callRemoteApi($url, 'GET');
    echo json_encode($response);
    exit;
}

// 13. AGENT STATUS UPDATE
if ($action === 'status') {
    $input = json_decode(file_get_contents('php://input'), true);
    $status = trim($input['status'] ?? 'available');
    
    $statusUrl = BASE_API_URL . '?r=agent/status';
    $response = callRemoteApi($statusUrl, 'POST', ['status' => $status], DEFAULT_API_TOKEN);
    
    if (isset($response['success']) && $response['success'] === true) {
        if (isset($_SESSION['agent']['info'])) {
            $_SESSION['agent']['info']['status'] = $status;
        }
    }
    
    echo json_encode($response);
    exit;
}

// 14. PBX OVERVIEW
if ($action === 'pbx') {
    $url = BASE_API_URL . '?r=pbx';
    $response = callRemoteApi($url, 'GET');
    echo json_encode($response);
    exit;
}

// 15. PBX QUEUE CREATE / UPDATE
if ($action === 'pbx_queue') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=pbx/queue';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 16. PBX QUEUE DELETE
if ($action === 'pbx_queue_delete') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=pbx/queue/delete';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 17. PBX IVR CREATE / UPDATE
if ($action === 'pbx_ivr') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=pbx/ivr';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 18. PBX IVR DELETE
if ($action === 'pbx_ivr_delete') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=pbx/ivr/delete';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 19. PBX INBOUND ROUTE CREATE / UPDATE
if ($action === 'pbx_inbound') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=pbx/inbound';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 20. PBX INBOUND ROUTE DELETE
if ($action === 'pbx_inbound_delete') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = BASE_API_URL . '?r=pbx/inbound/delete';
    $response = callRemoteApi($url, 'POST', $input);
    echo json_encode($response);
    exit;
}

// 21. PBX APPLY & RELOAD DIALPLAN
if ($action === 'pbx_apply') {
    $url = BASE_API_URL . '?r=pbx/apply';
    $response = callRemoteApi($url, 'POST', []);
    echo json_encode($response);
    exit;
}

// 22. CALLER 360 HISTORY & CDR
if ($action === 'caller_history') {
    $phone = preg_replace('/[^0-9]/', '', $_GET['phone'] ?? '');
    
    // Fetch PBX Call Recordings / CDR
    $recordingsUrl = BASE_API_URL . '?r=recordings';
    $pbxRes = callRemoteApi($recordingsUrl, 'GET');
    $callHistory = [];
    
    if (isset($pbxRes['rows']) && is_array($pbxRes['rows'])) {
        foreach ($pbxRes['rows'] as $r) {
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
    
    // If no specific PBX calls found for demo/new number, provide standard historical interaction data
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
    
    // Fetch Saved Caller Notes
    $notesFile = __DIR__ . '/storage/data/caller_notes.json';
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
    
    echo json_encode([
        'success' => true,
        'phone' => $phone,
        'customer_name' => 'Priya Sharma',
        'active_booking' => 'BK-2026-9812',
        'calls' => $callHistory,
        'notes' => array_values($callerNotes)
    ]);
    exit;
}

// 23. SAVE AGENT NOTE & DISPOSITION
if ($action === 'save_note') {
    $input = json_decode(file_get_contents('php://input'), true);
    $phone = preg_replace('/[^0-9]/', '', $input['phone'] ?? '');
    if (!$phone) $phone = '919876543210';
    
    $notesFile = __DIR__ . '/storage/data/caller_notes.json';
    $allNotes = file_exists($notesFile) ? json_decode(file_get_contents($notesFile), true) : [];
    if (!isset($allNotes[$phone])) {
        $allNotes[$phone] = [];
    }
    
    $newNote = [
        'id' => 'note_' . time(),
        'agent_code' => $input['agent_code'] ?? '1001',
        'agent_name' => $input['agent_name'] ?? ($_SESSION['agent']['info']['full_name'] ?? 'Agent 1001'),
        'booking_id' => $input['booking_id'] ?? 'BK-2026-9812',
        'disposition' => $input['disposition'] ?? 'Call Resolved',
        'note_text' => trim($input['note_text'] ?? ''),
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    array_unshift($allNotes[$phone], $newNote);
    
    $dataDir = __DIR__ . '/storage/data';
    if (!is_dir($dataDir)) mkdir($dataDir, 0777, true);
    file_put_contents($notesFile, json_encode($allNotes, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'message' => 'Call note and disposition saved successfully!',
        'note' => $newNote
    ]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
