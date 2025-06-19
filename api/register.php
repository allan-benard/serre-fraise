<?php
// api/register.php
header('Content-Type: application/json');
require_once __DIR__.'/../config/bootstrap.php';

try {
    $input = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    http_response_code(400);
    exit(json_encode(['error' => 'JSON invalide']));
}

if (!isset($input['username'],$input['email'],$input['password'])) {
    http_response_code(422);
    exit(json_encode(['error' => 'Champs manquants']));
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO users (username,email,password_hash) VALUES (?,?,?)'
    );
    $stmt->execute([
        $input['username'],
        $input['email'],
        password_hash($input['password'], PASSWORD_BCRYPT)
    ]);
    $_SESSION['uid'] = $pdo->lastInsertId();
    echo json_encode(['status' => 'ok']);
} catch (PDOException $e) {
    if ($e->errorInfo[1] == 1062) {            // duplicate
        http_response_code(409);
        exit(json_encode(['error' => 'Email déjà enregistré']));
    }
    error_log($e);                             // log complet serveur
    http_response_code(500);
    exit(json_encode(['error' => 'Erreur SQL']));
}

