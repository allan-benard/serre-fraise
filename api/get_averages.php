<?php
// API pour récupérer les moyennes des capteurs
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
$period = isset($_GET['period']) ? $_GET['period'] : '7'; // 7 jours par défaut
$sensor = isset($_GET['sensor']) ? $_GET['sensor'] : 'all';

$response = [];
$validTables = ['temperature', 'humidity', 'light'];

try {
    foreach ($validTables as $table) {
        if ($sensor === 'all' || $sensor === $table) {
            // Moyennes globales
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_measurements,
                    AVG(val) as average,
                    MIN(val) as minimum,
                    MAX(val) as maximum,
                    STDDEV(val) as std_deviation,
                    MIN(created_at) as first_measurement,
                    MAX(created_at) as last_measurement
                FROM `$table` 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL :period DAY)
            ");
            $stmt->bindValue(':period', (int)$period, PDO::PARAM_INT);
            $stmt->execute();
            $averages = $stmt->fetch();
            
            // Moyennes par jour
            $stmt = $pdo->prepare("
                SELECT 
                    DATE(created_at) as day,
                    COUNT(*) as daily_count,
                    AVG(val) as daily_average,
                    MIN(val) as daily_min,
                    MAX(val) as daily_max,
                    MIN(HOUR(created_at)) as first_hour,
                    MAX(HOUR(created_at)) as last_hour
                FROM `$table` 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL :period DAY)
                GROUP BY DATE(created_at)
                ORDER BY day DESC
            ");
            $stmt->bindValue(':period', (int)$period, PDO::PARAM_INT);
            $stmt->execute();
            $dailyAverages = $stmt->fetchAll();
            
            // Moyennes par heure (dernières 24h pour plus de détail)
            $stmt = $pdo->prepare("
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
                    COUNT(*) as hourly_count,
                    AVG(val) as hourly_average,
                    MIN(val) as hourly_min,
                    MAX(val) as hourly_max
                FROM `$table` 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H')
                ORDER BY hour ASC
            ");
            $stmt->execute();
            $hourlyAverages = $stmt->fetchAll();
            
            $response[$table] = [
                'global_stats' => [
                    'period_days' => (int)$period,
                    'total_measurements' => (int)$averages['total_measurements'],
                    'average' => round((float)$averages['average'], 2),
                    'minimum' => (float)$averages['minimum'],
                    'maximum' => (float)$averages['maximum'],
                    'std_deviation' => round((float)($averages['std_deviation'] ?? 0), 2),
                    'first_measurement' => $averages['first_measurement'],
                    'last_measurement' => $averages['last_measurement']
                ],
                'daily_averages' => array_map(function($row) {
                    return [
                        'day' => $row['day'],
                        'count' => (int)$row['daily_count'],
                        'average' => round((float)$row['daily_average'], 2),
                        'minimum' => (float)$row['daily_min'],
                        'maximum' => (float)$row['daily_max'],
                        'first_hour' => (int)$row['first_hour'],
                        'last_hour' => (int)$row['last_hour']
                    ];
                }, $dailyAverages),
                'hourly_averages' => array_map(function($row) {
                    return [
                        'hour' => $row['hour'],
                        'count' => (int)$row['hourly_count'],
                        'average' => round((float)$row['hourly_average'], 2),
                        'minimum' => (float)$row['hourly_min'],
                        'maximum' => (float)$row['hourly_max'],
                        'timestamp' => strtotime($row['hour'])
                    ];
                }, $hourlyAverages)
            ];
        }
    }
    
    // Ajouter des métadonnées
    $response['metadata'] = [
        'timestamp' => date('Y-m-d H:i:s'),
        'period_days' => (int)$period,
        'sensor_requested' => $sensor,
        'timezone' => date_default_timezone_get(),
        'server_time' => time()
    ];
    
} catch (Exception $e) {
    $response['error'] = 'Erreur lors du calcul des moyennes: ' . $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
