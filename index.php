<?php
session_start();

if (isset($_SESSION['agent']) && !empty($_SESSION['agent']['session_token'])) {
    header('Location: dashboard.php');
    exit;
} else {
    header('Location: login.php');
    exit;
}
