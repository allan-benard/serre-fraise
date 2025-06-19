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
    <title>Tableau de bord - FraiseConnect Pro</title>
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/dashboard.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                <li><a href="dashboard.php" class="active">Tableau de bord</a></li>
                <li><a href="sensors.php">Capteurs</a></li>
                <li><a href="api/logout.php">Déconnexion</a></li>
            </ul>
        </div>
    </nav>

    <main class="dashboard-main">
        <div class="container">
            <div class="dashboard-header">
                <h1>🍓 Tableau de bord - Culture de Fraises</h1>
                <div class="weather-widget" id="weatherWidget">
                    <i class="fas fa-cloud-sun"></i>
                    <span>Chargement météo...</span>
                </div>
            </div>

            <!-- Panneau de statut des conditions de culture -->
            <div class="cultivation-status" style="background: var(--white); border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: var(--shadow);">
                <h3 style="margin-bottom: 15px; color: var(--text-color);">🍓 Conditions de culture des fraises</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="condition-indicator" id="tempCondition">
                        <span style="font-weight: bold;">Température:</span> <span>Évaluation...</span>
                    </div>
                    <div class="condition-indicator" id="humidityCondition">
                        <span style="font-weight: bold;">Humidité:</span> <span>Évaluation...</span>
                    </div>
                    <div class="condition-indicator" id="lightCondition">
                        <span style="font-weight: bold;">Luminosité:</span> <span>Évaluation...</span>
                    </div>
                </div>
                <div id="overallCondition" style="margin-top: 15px; padding: 10px; border-radius: 8px; text-align: center; font-weight: bold;">
                    Évaluation globale en cours...
                </div>
            </div>

            <div class="sensors-overview">
                <div class="sensor-card temperature">
                    <div class="sensor-icon">
                        <i class="fas fa-thermometer-half"></i>
                    </div>
                    <div class="sensor-info">
                        <h3>Température</h3>
                        <span class="sensor-value" id="tempValue">--°C</span>
                        <span class="sensor-status normal" id="tempStatus">Normal</span>
                        <div style="font-size: 0.8em; color: var(--text-light); margin-top: 5px;">
                            Optimal: 18-24°C
                        </div>
                    </div>
                </div>

                <div class="sensor-card humidity">
                    <div class="sensor-icon">
                        <i class="fas fa-tint"></i>
                    </div>
                    <div class="sensor-info">
                        <h3>Humidité</h3>
                        <span class="sensor-value" id="humidityValue">--%</span>
                        <span class="sensor-status normal" id="humidityStatus">Normal</span>
                        <div style="font-size: 0.8em; color: var(--text-light); margin-top: 5px;">
                            Optimal: 60-80%
                        </div>
                    </div>
                </div>

                <div class="sensor-card light">
                    <div class="sensor-icon">
                        <i class="fas fa-sun"></i>
                    </div>
                    <div class="sensor-info">
                        <h3>Luminosité</h3>
                        <span class="sensor-value" id="lightValue">-- lux</span>
                        <span class="sensor-status normal" id="lightStatus">Normal</span>
                        <div style="font-size: 0.8em; color: var(--text-light); margin-top: 5px;">
                            Optimal: 800-2000 lux
                        </div>
                    </div>
                </div>
            </div>

            <div class="charts-section">
                <div class="chart-container">
                    <h3>Évolution des capteurs (7 jours)</h3>
                    <canvas id="sensorsChart"></canvas>
                </div>
            </div>

            <div class="alerts-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>🍓 Alertes de culture</h3>
                    <div style="display: flex; gap: 10px;">
                        <button id="clearAlertsBtn" style="background: var(--warning-color); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
                            Nettoyer anciennes
                        </button>
                        <button id="toggleMonitoringBtn" style="background: var(--success-color); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
                            Surveillance ON
                        </button>
                    </div>
                </div>
                <div class="alerts-list" id="alertsList">
                    <!-- Les alertes seront ajoutées dynamiquement -->
                </div>
            </div>
        </div>
    </main>

    <!-- Scripts dans l'ordre correct -->
    <script src="scripts/main.js"></script>
    <script src="scripts/strawberry-alerts.js"></script>
    <script>
// Script de forçage des moyennes avec intégration des alertes
setTimeout(() => {
    console.log("🔄 Forçage des moyennes avec alertes fraises - Début")
    
    // Test direct de l'API des moyennes
    fetch('api/get_simple_averages.php?period=7&sensor=all')
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        console.log("📊 Moyennes reçues:", data)
        
        // Forcer l'affichage des moyennes directement
        if (data.temperature && data.temperature.global_stats) {
          const tempElement = document.getElementById("tempValue")
          if (tempElement) {
            const avg = data.temperature.global_stats.average;
            const count = data.temperature.global_stats.total_measurements;
            tempElement.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <span style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${avg}°C</span>
                <span style="font-size: 0.8rem; color: var(--text-light);">Moyenne 7 jours</span>
                <span style="font-size: 0.7rem; color: var(--text-light);">${count} mesures</span>
              </div>
            `;
            console.log("✅ Température moyenne affichée:", avg)
          }
        }
        
        if (data.humidity && data.humidity.global_stats) {
          const humidityElement = document.getElementById("humidityValue")
          if (humidityElement) {
            const avg = data.humidity.global_stats.average;
            const count = data.humidity.global_stats.total_measurements;
            humidityElement.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <span style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${avg}%</span>
                <span style="font-size: 0.8rem; color: var(--text-light);">Moyenne 7 jours</span>
                <span style="font-size: 0.7rem; color: var(--text-light);">${count} mesures</span>
              </div>
            `;
            console.log("✅ Humidité moyenne affichée:", avg)
          }
        }
        
        if (data.light && data.light.global_stats) {
          const lightElement = document.getElementById("lightValue")
          if (lightElement) {
            const avg = data.light.global_stats.average;
            const count = data.light.global_stats.total_measurements;
            lightElement.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <span style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${avg} lux</span>
                <span style="font-size: 0.8rem; color: var(--text-light);">Moyenne 7 jours</span>
                <span style="font-size: 0.7rem; color: var(--text-light);">${count} mesures</span>
              </div>
            `;
            console.log("✅ Luminosité moyenne affichée:", avg)
          }
        }
        
        // Mettre à jour les indicateurs de conditions de culture
        updateCultivationStatus(data);
        
        // Créer un graphique simple avec les données quotidiennes
        createSimpleChart(data);
        
        // Déclencher les vérifications d'alertes
        if (window.strawberryAlerts) {
          window.strawberryAlerts.checkAverageValues(data);
        }
        
        // Notification de succès
        if (window.utils) {
          window.utils.showNotification("Moyennes mises à jour avec succès!", "success")
        }
      })
      .catch(error => {
        console.error("❌ Erreur lors du chargement des moyennes:", error)
        
        // En cas d'erreur, afficher un message d'erreur
        const tempElement = document.getElementById("tempValue")
        if (tempElement) {
          tempElement.innerHTML = `
            <div style="text-align: center; color: var(--error-color);">
              <span>Erreur de chargement</span><br>
              <small>Voir la console</small>
            </div>
          `;
        }
      })
}, 2000)

function updateCultivationStatus(data) {
  const thresholds = {
    temperature: { optimal_min: 18, optimal_max: 24 },
    humidity: { optimal_min: 60, optimal_max: 80 },
    light: { optimal_min: 800, optimal_max: 2000 }
  };
  
  let conditions = {};
  
  // Évaluer chaque condition
  if (data.temperature?.global_stats) {
    const temp = data.temperature.global_stats.average;
    if (temp >= thresholds.temperature.optimal_min && temp <= thresholds.temperature.optimal_max) {
      conditions.temperature = { status: 'optimal', text: '✅ Optimale' };
    } else if (temp < thresholds.temperature.optimal_min - 3 || temp > thresholds.temperature.optimal_max + 3) {
      conditions.temperature = { status: 'critical', text: '🚨 Critique' };
    } else {
      conditions.temperature = { status: 'warning', text: '⚠️ Attention' };
    }
  }
  
  if (data.humidity?.global_stats) {
    const humidity = data.humidity.global_stats.average;
    if (humidity >= thresholds.humidity.optimal_min && humidity <= thresholds.humidity.optimal_max) {
      conditions.humidity = { status: 'optimal', text: '✅ Optimale' };
    } else if (humidity < thresholds.humidity.optimal_min - 10 || humidity > thresholds.humidity.optimal_max + 10) {
      conditions.humidity = { status: 'critical', text: '🚨 Critique' };
    } else {
      conditions.humidity = { status: 'warning', text: '⚠️ Attention' };
    }
  }
  
  if (data.light?.global_stats) {
    const light = data.light.global_stats.average;
    if (light >= thresholds.light.optimal_min && light <= thresholds.light.optimal_max) {
      conditions.light = { status: 'optimal', text: '✅ Optimale' };
    } else if (light < thresholds.light.optimal_min - 300 || light > thresholds.light.optimal_max + 500) {
      conditions.light = { status: 'critical', text: '🚨 Critique' };
    } else {
      conditions.light = { status: 'warning', text: '⚠️ Attention' };
    }
  }
  
  // Mettre à jour l'affichage
  const tempCondition = document.getElementById('tempCondition');
  const humidityCondition = document.getElementById('humidityCondition');
  const lightCondition = document.getElementById('lightCondition');
  const overallCondition = document.getElementById('overallCondition');
  
  if (tempCondition && conditions.temperature) {
    tempCondition.innerHTML = `<span style="font-weight: bold;">Température:</span> ${conditions.temperature.text}`;
  }
  if (humidityCondition && conditions.humidity) {
    humidityCondition.innerHTML = `<span style="font-weight: bold;">Humidité:</span> ${conditions.humidity.text}`;
  }
  if (lightCondition && conditions.light) {
    lightCondition.innerHTML = `<span style="font-weight: bold;">Luminosité:</span> ${conditions.light.text}`;
  }
  
  // Évaluation globale
  const statuses = Object.values(conditions).map(c => c.status);
  let overallStatus, overallText, overallColor;
  
  if (statuses.includes('critical')) {
    overallStatus = 'critical';
    overallText = '🚨 Conditions critiques détectées - Action immédiate requise';
    overallColor = 'var(--error-color)';
  } else if (statuses.includes('warning')) {
    overallStatus = 'warning';
    overallText = '⚠️ Conditions sous-optimales - Surveillance recommandée';
    overallColor = 'var(--warning-color)';
  } else {
    overallStatus = 'optimal';
    overallText = '🍓 Conditions optimales pour la culture des fraises';
    overallColor = 'var(--success-color)';
  }
  
  if (overallCondition) {
    overallCondition.innerHTML = overallText;
    overallCondition.style.backgroundColor = overallColor;
    overallCondition.style.color = 'white';
  }
}

function createSimpleChart(data) {
  const canvas = document.getElementById("sensorsChart");
  if (!canvas || typeof Chart === "undefined") {
    console.log("⚠️ Canvas ou Chart.js non disponible");
    return;
  }
  
  // Utiliser les données quotidiennes si disponibles
  const tempDaily = data.temperature?.daily_averages || [];
  const humidityDaily = data.humidity?.daily_averages || [];
  const lightDaily = data.light?.daily_averages || [];
  
  if (tempDaily.length === 0) {
    console.log("⚠️ Pas de données quotidiennes, création de données de démonstration");
    
    // Créer des données de démonstration basées sur les moyennes
    const demoData = [];
    const tempAvg = data.temperature?.global_stats?.average || 23;
    const humidityAvg = data.humidity?.global_stats?.average || 65;
    const lightAvg = data.light?.global_stats?.average || 1200;
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      demoData.push({
        day: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        temp: tempAvg + (Math.random() - 0.5) * 4,
        humidity: humidityAvg + (Math.random() - 0.5) * 10,
        light: lightAvg + (Math.random() - 0.5) * 200
      });
    }
    
    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: demoData.map(item => item.day),
        datasets: [
          {
            label: 'Température moyenne (°C)',
            data: demoData.map(item => item.temp.toFixed(1)),
            borderColor: '#e53e3e',
            backgroundColor: 'rgba(229, 62, 62, 0.1)',
            tension: 0.4,
            fill: false,
            pointRadius: 4
          },
          {
            label: 'Humidité moyenne (%)',
            data: demoData.map(item => item.humidity.toFixed(1)),
            borderColor: '#3182ce',
            backgroundColor: 'rgba(49, 130, 206, 0.1)',
            tension: 0.4,
            fill: false,
            pointRadius: 4
          },
          {
            label: 'Luminosité moyenne (lux/10)',
            data: demoData.map(item => (item.light / 10).toFixed(1)),
            borderColor: '#ed8936',
            backgroundColor: 'rgba(237, 137, 54, 0.1)',
            tension: 0.4,
            fill: false,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '🍓 Évolution des conditions de culture (7 derniers jours)',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Jours' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Valeurs' }
          }
        }
      }
    });
  } else {
    // Utiliser les vraies données quotidiennes
    const labels = tempDaily.map(item => {
      const date = new Date(item.day);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    });
    
    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Température moyenne (°C)',
            data: tempDaily.map(item => item.average),
            borderColor: '#e53e3e',
            backgroundColor: 'rgba(229, 62, 62, 0.1)',
            tension: 0.4,
            fill: false,
            pointRadius: 4
          },
          {
            label: 'Humidité moyenne (%)',
            data: humidityDaily.map(item => item.average),
            borderColor: '#3182ce',
            backgroundColor: 'rgba(49, 130, 206, 0.1)',
            tension: 0.4,
            fill: false,
            pointRadius: 4
          },
          {
            label: 'Luminosité moyenne (lux/10)',
            data: lightDaily.map(item => item.average / 10),
            borderColor: '#ed8936',
            backgroundColor: 'rgba(237, 137, 54, 0.1)',
            tension: 0.4,
            fill: false,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '🍓 Évolution des moyennes quotidiennes (7 jours)',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (context) => {
                const dataIndex = context[0].dataIndex;
                const item = tempDaily[dataIndex];
                return `${new Date(item.day).toLocaleDateString('fr-FR')} (${item.count} mesures)`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Jours' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Valeurs' }
          }
        }
      }
    });
  }
  
  console.log("✅ Graphique des moyennes créé");
}

// Gestionnaires d'événements pour les boutons d'alertes
document.addEventListener('DOMContentLoaded', () => {
  const clearAlertsBtn = document.getElementById('clearAlertsBtn');
  const toggleMonitoringBtn = document.getElementById('toggleMonitoringBtn');
  
  if (clearAlertsBtn) {
    clearAlertsBtn.onclick = () => {
      if (window.strawberryAlerts) {
        window.strawberryAlerts.clearOldAlerts();
        if (window.utils) {
          window.utils.showNotification("Anciennes alertes supprimées", "info");
        }
      }
    };
  }
  
  if (toggleMonitoringBtn) {
    toggleMonitoringBtn.onclick = () => {
      if (window.strawberryAlerts) {
        const isActive = window.strawberryAlerts.toggleMonitoring();
        toggleMonitoringBtn.textContent = isActive ? 'Surveillance ON' : 'Surveillance OFF';
        toggleMonitoringBtn.style.backgroundColor = isActive ? 'var(--success-color)' : 'var(--error-color)';
        
        if (window.utils) {
          window.utils.showNotification(
            `Surveillance ${isActive ? 'activée' : 'désactivée'}`, 
            isActive ? 'success' : 'warning'
          );
        }
      }
    };
  }
});
</script>
<!-- Bouton de test des moyennes -->



    <script src="scripts/dashboard.js"></script>
</body>
</html>
