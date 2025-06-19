<?php
// Script de diagnostic pour identifier les problèmes
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔍 Diagnostic FraiseConnect Pro</h1>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .warning { color: orange; font-weight: bold; }
    .info { color: blue; }
    .section { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
    pre { background: #eee; padding: 10px; border-radius: 3px; overflow-x: auto; }
</style>";

// 1. Test de la configuration PHP
echo "<div class='section'>";
echo "<h2>1. Configuration PHP</h2>";
echo "<p><strong>Version PHP:</strong> " . phpversion() . "</p>";
echo "<p><strong>Extensions PDO:</strong> " . (extension_loaded('pdo') ? '<span class="success">✅ Activée</span>' : '<span class="error">❌ Manquante</span>') . "</p>";
echo "<p><strong>Extension PDO MySQL:</strong> " . (extension_loaded('pdo_mysql') ? '<span class="success">✅ Activée</span>' : '<span class="error">❌ Manquante</span>') . "</p>";
echo "</div>";

// 2. Test de connexion à la base de données
echo "<div class='section'>";
echo "<h2>2. Test de connexion à la base de données</h2>";

$host = '185.216.26.53';
$dbname = 'app_g1';
$user = 'g1b';
$pwd = 'azertyg1b';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pwd);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p class='success'>✅ Connexion à la base de données réussie</p>";
    
    // Test des tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "<p><strong>Tables trouvées:</strong> " . implode(', ', $tables) . "</p>";
    
    // Test des données dans chaque table
    $sensorTables = ['temperature', 'humidity', 'light'];
    foreach ($sensorTables as $table) {
        if (in_array($table, $tables)) {
            $countStmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $countStmt->fetch()['count'];
            echo "<p><strong>$table:</strong> $count enregistrements</p>";
            
            if ($count > 0) {
                $lastStmt = $pdo->query("SELECT * FROM $table ORDER BY created_at DESC LIMIT 1");
                $last = $lastStmt->fetch();
                echo "<p class='info'>Dernière valeur: {$last['val']} (ID: {$last['id']}, Date: {$last['created_at']})</p>";
            }
        } else {
            echo "<p class='error'>❌ Table $table non trouvée</p>";
        }
    }
    
} catch(PDOException $e) {
    echo "<p class='error'>❌ Erreur de connexion: " . $e->getMessage() . "</p>";
}
echo "</div>";

// 3. Test des fichiers API
echo "<div class='section'>";
echo "<h2>3. Test des fichiers API</h2>";

$apiFiles = [
    'config/database.php',
    'api/get_sensors_data.php',
    'api/insert_sensor_data.php'
];

foreach ($apiFiles as $file) {
    if (file_exists($file)) {
        echo "<p class='success'>✅ $file existe</p>";
        if (is_readable($file)) {
            echo "<p class='info'>   - Fichier lisible</p>";
        } else {
            echo "<p class='error'>   - Fichier non lisible</p>";
        }
    } else {
        echo "<p class='error'>❌ $file manquant</p>";
    }
}
echo "</div>";

// 4. Test direct de l'API
echo "<div class='section'>";
echo "<h2>4. Test direct de l'API</h2>";

if (file_exists('api/get_sensors_data.php')) {
    echo "<p><strong>Test de l'API get_sensors_data.php:</strong></p>";
    
    // Simuler une requête à l'API
    $_GET['request'] = 'latest';
    $_GET['sensor'] = 'all';
    
    ob_start();
    try {
        include 'api/get_sensors_data.php';
        $apiOutput = ob_get_contents();
        ob_end_clean();
        
        echo "<p class='success'>✅ API exécutée sans erreur</p>";
        echo "<p><strong>Réponse de l'API:</strong></p>";
        echo "<pre>" . htmlspecialchars($apiOutput) . "</pre>";
        
        // Vérifier si c'est du JSON valide
        $jsonData = json_decode($apiOutput, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "<p class='success'>✅ JSON valide</p>";
            if (isset($jsonData['temperature']) || isset($jsonData['humidity']) || isset($jsonData['light'])) {
                echo "<p class='success'>✅ Données de capteurs présentes</p>";
            } else {
                echo "<p class='warning'>⚠️ Aucune donnée de capteur dans la réponse</p>";
            }
        } else {
            echo "<p class='error'>❌ JSON invalide: " . json_last_error_msg() . "</p>";
        }
        
    } catch (Exception $e) {
        ob_end_clean();
        echo "<p class='error'>❌ Erreur lors de l'exécution de l'API: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p class='error'>❌ Fichier API non trouvé</p>";
}
echo "</div>";

// 5. Test des permissions
echo "<div class='section'>";
echo "<h2>5. Test des permissions</h2>";

$directories = ['api', 'config', 'scripts', 'styles'];
foreach ($directories as $dir) {
    if (is_dir($dir)) {
        echo "<p class='success'>✅ Dossier $dir existe</p>";
        if (is_readable($dir)) {
            echo "<p class='info'>   - Dossier lisible</p>";
        } else {
            echo "<p class='error'>   - Dossier non lisible</p>";
        }
    } else {
        echo "<p class='error'>❌ Dossier $dir manquant</p>";
    }
}
echo "</div>";

// 6. Informations serveur
echo "<div class='section'>";
echo "<h2>6. Informations serveur</h2>";
echo "<p><strong>Serveur:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p><strong>Document Root:</strong> " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p><strong>Script actuel:</strong> " . $_SERVER['SCRIPT_FILENAME'] . "</p>";
echo "<p><strong>URL actuelle:</strong> " . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] . "</p>";
echo "</div>";

// 7. Test CORS
echo "<div class='section'>";
echo "<h2>7. Test CORS</h2>";
echo "<p>Headers CORS actuels:</p>";
echo "<ul>";
$corsHeaders = [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
];

foreach ($corsHeaders as $header) {
    $value = '';
    foreach (headers_list() as $h) {
        if (stripos($h, $header) === 0) {
            $value = $h;
            break;
        }
    }
    echo "<li><strong>$header:</strong> " . ($value ? $value : 'Non défini') . "</li>";
}
echo "</ul>";
echo "</div>";

echo "<div class='section'>";
echo "<h2>🔧 Actions recommandées</h2>";
echo "<ol>";
echo "<li>Vérifiez que tous les fichiers sont bien uploadés sur le serveur</li>";
echo "<li>Vérifiez les permissions des dossiers (755) et fichiers (644)</li>";
echo "<li>Testez l'API directement: <a href='api/get_sensors_data.php?request=latest&sensor=all' target='_blank'>api/get_sensors_data.php?request=latest&sensor=all</a></li>";
echo "<li>Vérifiez la console JavaScript du navigateur pour les erreurs</li>";
echo "<li>Assurez-vous que la base de données contient des données récentes</li>";
echo "</ol>";
echo "</div>";
?>
