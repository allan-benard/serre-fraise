<?php
session_start();
if (!isset($_SESSION['id'])) {
    header('Location: api/PageConnection.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des capteurs - FraiseConnect Pro</title>
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/sensors.css">
    <link rel="stylesheet" href="styles/control.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">
                <i class="fas fa-seedling"></i>
                <span>FraiseConnect Pro</span>
            </div>
            <ul class="nav-menu">
                <li><a href="index2.php">Accueil</a></li>
                <li><a href="dashboard.php">Tableau de bord</a></li>
                <li><a href="sensors.php" class="active">Capteurs</a></li>
                <li><a href="api/logout.php">Déconnexion</a></li>
            </ul>
        </div>
    </nav>
    <main class="sensors-main">
        <div class="container">
            <h1>Gestion des capteurs et actionneurs</h1>

            <div class="sensors-grid">
                <div class="sensor-panel">
                    <div class="panel-header">
                        <i class="fas fa-thermometer-half"></i>
                        <h3>État du Moteur Pompe</h3>
                    </div>
                    <div class="panel-content">
                        <div class="current-value">
                            <span class="value" id="tempSensorValue">23.5°C</span>
                            <span class="timestamp">Dernière mise à jour: <span id="tempTimestamp">--:--</span></span>
                        </div>
                        
                        <div class="actuators">
                            <h4>Actionneurs</h4>
                            <div class="motor-status-section">
                                <i id="motorIcon" class="fas fa-power-off motor-status-icon off"></i>
                                <span id="motorStatusText" class="motor-status-text off">OFF</span>
                              </div>
                              <button id="motorToggleButton" class="motor-toggle-button off">
                                <i class="fas fa-toggle-off"></i> Allumer
                              </button>
                        </div>
                    </div>
                </div>

                <div class="sensor-panel">
                    <div class="panel-header">
                        <i class="fas fa-tint"></i>
                        <h3>État du Moteur Volet</h3>
                    </div>
                    <div class="panel-content">
                        <div class="current-value">
                            <span class="value" id="hSensorValue">500lux</span>
                            <span class="timestamp">Dernière mise à jour: <span id="humidityTimestamp">--:--</span></span>
                        </div>
                        
                        <div class="actuators">
                            <h4>Actionneurs</h4>
                            <div class="motor-status-section">
                                <i id="shutterIcon" class="fas fa-power-off motor-status-icon off"></i>
                                <span id="shutterStatusText" class="motor-status-text off">FERMÉ</span>
                              </div>
                              <button id="shutterToggleButton" class="motor-toggle-button off">
                                <i class="fas fa-toggle-off"></i> Ouvrir
                              </button>
                            </div>
                        </div>
                    </div>
                </div>

                
            </div>

            
            </div>
        </div>
    </main>

    <script src="scripts/main.js"></script>
    <script src="scripts/sensors.js"></script>
    <script src="scripts/control.js"></script>
</body>
</html>
