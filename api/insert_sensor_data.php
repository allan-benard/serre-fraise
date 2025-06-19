<?php
// Activer CORS pour permettre les requêtes depuis le frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Configuration de la base de données directement dans le fichier
$host = '185.216.26.53';
$dbname = 'app_g1';
$user = 'g1b';
$pwd = 'azertyg1b';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pwd);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la base de données: ' . $e->getMessage()]);
    exit;
}

// Vérifier si la requête est une méthode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée", "allowed_methods" => ["POST"]]);
    exit;
}

// Récupérer les données envoyées
$input = file_get_contents("php://input");
$data = json_decode($input);

// Vérifier si les données JSON sont valides
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["message" => "JSON invalide", "error" => json_last_error_msg()]);
    exit;
}

// Vérifier si les données sont complètes
if (!isset($data->sensor) || !isset($data->value)) {
    http_response_code(400);
    echo json_encode([
        "message" => "Données incomplètes", 
        "required_fields" => ["sensor", "value"],
        "received" => $data
    ]);
    exit;
}

// Valider le type de capteur
$validSensors = ['temperature', 'humidity', 'light'];
if (!in_array($data->sensor, $validSensors)) {
    http_response_code(400);
    echo json_encode([
        "message" => "Type de capteur invalide", 
        "valid_sensors" => $validSensors,
        "received" => $data->sensor
    ]);
    exit;
}

// Valider la valeur (doit être numérique)
if (!is_numeric($data->value)) {
    http_response_code(400);
    echo json_encode([
        "message" => "La valeur doit être numérique",
        "received" => $data->value,
        "type" => gettype($data->value)
    ]);
    exit;
}

$value = floatval($data->value);

try {
    // Préparer la requête d'insertion
    $stmt = $pdo->prepare("INSERT INTO `{$data->sensor}` (val) VALUES (:value)");
    
    // Exécuter la requête
    $stmt->execute([':value' => $value]);
    
    // Vérifier si l'insertion a réussi
    if ($stmt->rowCount() > 0) {
        $insertId = $pdo->lastInsertId();
        
        // Récupérer l'enregistrement inséré pour confirmation
        $confirmStmt = $pdo->prepare("SELECT id, val, created_at FROM `{$data->sensor}` WHERE id = :id");
        $confirmStmt->execute([':id' => $insertId]);
        $insertedRecord = $confirmStmt->fetch();
        
        http_response_code(201);
        echo json_encode([
            "message" => "Données insérées avec succès",
            "sensor" => $data->sensor,
            "inserted_record" => [
                "id" => intval($insertedRecord['id']),
                "val" => floatval($insertedRecord['val']),
                "created_at" => $insertedRecord['created_at']
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Erreur lors de l'insertion des données"]);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Erreur de base de données", 
        "error" => $e->getMessage(),
        "code" => $e->getCode()
    ]);
}
?>
