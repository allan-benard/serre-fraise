<?php
header('Content-Type: application/json');
require_once __DIR__.'/../config/bootstrap.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email'], $input['password'])) {
    http_response_code(400);
    exit(json_encode(['error' => 'Champs manquants']));
}

$stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
$stmt->execute([$input['email']]);
$user = $stmt->fetch();

if (!$user || !password_verify($input['password'], $user['password_hash'])) {
    http_response_code(401);
    exit(json_encode(['error' => 'Identifiants invalides']));
}

$_SESSION['uid'] = $user['id'];
echo json_encode(['status' => 'ok']);
