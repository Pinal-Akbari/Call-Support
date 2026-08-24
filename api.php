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
        $_SESSION['agent'] = [
            'session_token' => $response['session_token'] ?? DEFAULT_API_TOKEN,
            'api_token' => DEFAULT_API_TOKEN,
            'expires_at' => $response['expires_at'] ?? '',
            'info' => $response['agent'] ?? [],
            'queue' => $response['queue'] ?? ''
        ];
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
    echo json_encode($response);
    exit;
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

echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
