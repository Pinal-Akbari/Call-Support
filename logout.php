<?php
session_start();
$sessionToken = $_SESSION['agent']['session_token'] ?? '';
if (!empty($sessionToken)) {
    $baseUrl = 'http://117.217.126.149:880/roottech/index.php?r=agent/logout';
    $ch = curl_init($baseUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $sessionToken
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    @curl_exec($ch);
    @curl_close($ch);
}
$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
@session_destroy();
header('Location: login.php');
exit;
