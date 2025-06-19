<?php
// API simplifiée pour récupérer les moyennes des capteurs
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Configuration de la base de données
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

// Récupérer les paramètres
$period = isset($_GET['period']) ? (int)$_GET['period'] : 7;
$sensor = isset($_GET['sensor']) ? $_GET['sensor'] : 'all';

$response = [];
$validTables = ['temperature', 'humidity', 'light'];

try {
    foreach ($validTables as $table) {
        if ($sensor === 'all' || $sensor === $table) {
            
            // Moyennes globales simples
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_measurements,
                    AVG(val) as average,
                    MIN(val) as minimum,
                    MAX(val) as maximum,
                    STDDEV(val) as std_deviation
                FROM `$table` 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$period]);
            $averages = $stmt->fetch();
            
            // Données par jour (requête simplifiée)
            $stmt = $pdo->prepare("
                SELECT 
                    DATE(created_at) as day,
                    COUNT(*) as daily_count,
                    AVG(val) as daily_average,
                    MIN(val) as daily_min,
                    MAX(val) as daily_max
                FROM `$table` 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY day DESC
            ");
            $stmt->execute([$period]);
            $dailyAverages = $stmt->fetchAll();
            
            // Données par heure pour les dernières 24h (requête simplifiée)
            $stmt = $pdo->prepare("
                SELECT 
                    HOUR(created_at) as hour,
                    COUNT(*) as hourly_count,
                    AVG(val) as hourly_average,
                    MIN(val) as hourly_min,
                    MAX(val) as hourly_max
                FROM `$table` 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY HOUR(created_at)
                ORDER BY hour ASC
            ");
            $stmt->execute();
            $hourlyAverages = $stmt->fetchAll();
            
            $response[$table] = [
                'global_stats' => [
                    'period_days' => $period,
                    'total_measurements' => (int)$averages['total_measurements'],
                    'average' => round((float)$averages['average'], 2),
                    'minimum' => (float)$averages['minimum'],
                    'maximum' => (float)$averages['maximum'],
                    'std_deviation' => round((float)($averages['std_deviation'] ?? 0), 2)
                ],
                'daily_averages' => array_map(function($row) {
                    return [
                        'day' => $row['day'],
                        'count' => (int)$row['daily_count'],
                        'average' => round((float)$row['daily_average'], 2),
                        'minimum' => (float)$row['daily_min'],
                        'maximum' => (float)$row['daily_max']
                    ];
                }, $dailyAverages),
                'hourly_averages' => array_map(function($row) {
                    return [
                        'hour' => (int)$row['hour'],
                        'count' => (int)$row['hourly_count'],
                        'average' => round((float)$row['hourly_average'], 2),
                        'minimum' => (float)$row['hourly_min'],
                        'maximum' => (float)$row['hourly_max']
                    ];
                }, $hourlyAverages)
            ];
        }
    }
    
    // Ajouter des métadonnées
    $response['metadata'] = [
        'timestamp' => date('Y-m-d H:i:s'),
        'period_days' => $period,
        'sensor_requested' => $sensor,
        'timezone' => date_default_timezone_get(),
        'server_time' => time(),
        'api_version' => 'simple'
    ];
    
} catch (Exception $e) {
    $response['error'] = 'Erreur lors du calcul des moyennes: ' . $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
