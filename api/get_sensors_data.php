<?php
// Activer CORS pour permettre les requêtes depuis le frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Inclure le fichier de configuration de la base de données avec chemin absolu
$configPath = dirname(__DIR__) . '/config/database.php';
if (!file_exists($configPath)) {
    // Fallback : essayer un chemin relatif simple
    $configPath = '../config/database.php';
    if (!file_exists($configPath)) {
        // Dernier recours : configuration directe
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
    } else {
        require_once $configPath;
    }
} else {
    require_once $configPath;
}

// Fonction pour récupérer les dernières données d'un capteur
function getLatestSensorData($pdo, $table) {
    try {
        $stmt = $pdo->prepare("SELECT id, val, created_at FROM `$table` ORDER BY created_at DESC LIMIT 1");
        $stmt->execute();
        $result = $stmt->fetch();
        
        if ($result) {
            return [
                'id' => intval($result['id']),
                'val' => floatval($result['val']),
                'created_at' => $result['created_at'],
                'timestamp' => strtotime($result['created_at'])
            ];
        } else {
            return ['error' => 'Aucune donnée trouvée'];
        }
    } catch(PDOException $e) {
        return ['error' => "Erreur lors de la récupération des données: " . $e->getMessage()];
    }
}

// Fonction pour récupérer l'historique des données d'un capteur sur 7 jours
function getSensorHistory($pdo, $table, $days = 7) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, val, created_at 
            FROM `$table` 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
            ORDER BY created_at ASC
        ");
        $stmt->bindValue(':days', (int)$days, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        return array_map(function($row) {
            return [
                'id' => intval($row['id']),
                'val' => floatval($row['val']),
                'created_at' => $row['created_at'],
                'timestamp' => strtotime($row['created_at'])
            ];
        }, $results);
    } catch(PDOException $e) {
        return ['error' => "Erreur lors de la récupération de l'historique: " . $e->getMessage()];
    }
}

// Fonction pour récupérer les données agrégées par heure sur 7 jours
function getSensorHistoryAggregated($pdo, $table, $days = 7) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour_group,
                AVG(val) as avg_val,
                MIN(val) as min_val,
                MAX(val) as max_val,
                COUNT(*) as count_measurements
            FROM `$table` 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H')
            ORDER BY hour_group ASC
        ");
        $stmt->bindValue(':days', (int)$days, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        return array_map(function($row) {
            return [
                'hour_group' => $row['hour_group'],
                'avg_val' => round(floatval($row['avg_val']), 2),
                'min_val' => floatval($row['min_val']),
                'max_val' => floatval($row['max_val']),
                'count_measurements' => intval($row['count_measurements']),
                'timestamp' => strtotime($row['hour_group'])
            ];
        }, $results);
    } catch(PDOException $e) {
        return ['error' => "Erreur lors de la récupération de l'historique agrégé: " . $e->getMessage()];
    }
}

// Fonction pour vérifier si une table existe
function tableExists($pdo, $tableName) {
    try {
        $stmt = $pdo->prepare("SHOW TABLES LIKE :tableName");
        $stmt->bindValue(':tableName', $tableName, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    } catch(PDOException $e) {
        return false;
    }
}

// Récupérer le type de requête
$request = isset($_GET['request']) ? $_GET['request'] : 'latest';
$sensor = isset($_GET['sensor']) ? $_GET['sensor'] : 'all';
$days = isset($_GET['days']) ? min(30, max(1, intval($_GET['days']))) : 7;

// Préparer la réponse
$response = [];

// Vérifier que les tables existent
$validTables = ['temperature', 'humidity', 'light'];
$availableTables = [];

foreach ($validTables as $table) {
    if (tableExists($pdo, $table)) {
        $availableTables[] = $table;
    }
}

if (empty($availableTables)) {
    $response['error'] = 'Aucune table de capteur trouvée';
    echo json_encode($response);
    exit;
}

try {
    if ($request === 'latest') {
        if ($sensor === 'all') {
            foreach ($availableTables as $table) {
                $response[$table] = getLatestSensorData($pdo, $table);
            }
        } else if (in_array($sensor, $availableTables)) {
            $response[$sensor] = getLatestSensorData($pdo, $sensor);
        } else {
            $response['error'] = 'Capteur non valide ou table inexistante';
        }
    } elseif ($request === 'history') {
        if ($sensor === 'all') {
            foreach ($availableTables as $table) {
                $response[$table] = getSensorHistory($pdo, $table, $days);
            }
        } else if (in_array($sensor, $availableTables)) {
            $response[$sensor] = getSensorHistory($pdo, $sensor, $days);
        } else {
            $response['error'] = 'Capteur non valide ou table inexistante';
        }
    } elseif ($request === 'history_aggregated') {
        if ($sensor === 'all') {
            foreach ($availableTables as $table) {
                $response[$table] = getSensorHistoryAggregated($pdo, $table, $days);
            }
        } else if (in_array($sensor, $availableTables)) {
            $response[$sensor] = getSensorHistoryAggregated($pdo, $sensor, $days);
        } else {
            $response['error'] = 'Capteur non valide ou table inexistante';
        }
    } elseif ($request === 'stats') {
        foreach ($availableTables as $table) {
            try {
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as count,
                        AVG(val) as average,
                        MIN(val) as minimum,
                        MAX(val) as maximum,
                        STDDEV(val) as std_deviation
                    FROM `$table` 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
                ");
                $stmt->bindValue(':days', (int)$days, PDO::PARAM_INT);
                $stmt->execute();
                $stats = $stmt->fetch();
                
                $response[$table . '_stats'] = [
                    'period_days' => $days,
                    'total_measurements' => intval($stats['count']),
                    'average' => round(floatval($stats['average']), 2),
                    'minimum' => floatval($stats['minimum']),
                    'maximum' => floatval($stats['maximum']),
                    'std_deviation' => round(floatval($stats['std_deviation'] ?? 0), 2)
                ];
            } catch(PDOException $e) {
                $response[$table . '_stats'] = ['error' => $e->getMessage()];
            }
        }
    } else {
        $response['error'] = 'Type de requête non valide';
    }
} catch (Exception $e) {
    $response['error'] = 'Erreur générale: ' . $e->getMessage();
}

// Ajouter des métadonnées
$response['metadata'] = [
    'timestamp' => date('Y-m-d H:i:s'),
    'available_tables' => $availableTables,
    'request_type' => $request,
    'sensor_requested' => $sensor,
    'period_days' => $days,
    'timezone' => date_default_timezone_get(),
    'server_time' => time()
];

// Envoyer la réponse JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
