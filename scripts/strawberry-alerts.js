// Système d'alertes spécialisé pour la culture des fraises
class StrawberryAlertSystem {
    constructor() {
      console.log("🍓 Initialisation du système d'alertes pour fraises")
  
      // Seuils optimaux pour la culture des fraises
      this.thresholds = {
        temperature: {
          optimal_min: 18,
          optimal_max: 24,
          critical_min: 15,
          critical_max: 30,
          unit: "°C",
          name: "Température",
        },
        humidity: {
          optimal_min: 60,
          optimal_max: 80,
          critical_min: 50,
          critical_max: 90,
          unit: "%",
          name: "Humidité",
        },
        light: {
          optimal_min: 800,
          optimal_max: 2000,
          critical_min: 500,
          critical_max: 3000,
          unit: " lux",
          name: "Luminosité",
        },
      }
  
      this.lastAlerts = {}
      this.alertHistory = JSON.parse(localStorage.getItem("strawberryAlerts") || "[]")
      this.isMonitoring = true
  
      this.init()
    }
  
    init() {
      // Écouter les mises à jour des capteurs
      window.addEventListener("averagesUpdated", (event) => {
        this.checkAverageValues(event.detail)
      })
  
      window.addEventListener("latestDataUpdated", (event) => {
        this.checkLatestValues(event.detail)
      })
  
      // Vérification périodique toutes les 2 minutes
      setInterval(() => {
        if (this.isMonitoring) {
          this.performPeriodicCheck()
        }
      }, 120000)
  
      console.log("✅ Système d'alertes fraises initialisé")
    }
  
    checkAverageValues(data) {
      console.log("🔍 Vérification des moyennes pour alertes fraises")
  
      if (data.temperature?.global_stats) {
        this.checkValue("temperature", data.temperature.global_stats.average, "moyenne")
      }
  
      if (data.humidity?.global_stats) {
        this.checkValue("humidity", data.humidity.global_stats.average, "moyenne")
      }
  
      if (data.light?.global_stats) {
        this.checkValue("light", data.light.global_stats.average, "moyenne")
      }
    }
  
    checkLatestValues(data) {
      console.log("🔍 Vérification des valeurs actuelles pour alertes fraises")
  
      if (data.temperature?.val) {
        this.checkValue("temperature", Number.parseFloat(data.temperature.val), "actuelle")
      }
  
      if (data.humidity?.val) {
        this.checkValue("humidity", Number.parseFloat(data.humidity.val), "actuelle")
      }
  
      if (data.light?.val) {
        this.checkValue("light", Number.parseFloat(data.light.val), "actuelle")
      }
    }
  
    checkValue(sensorType, value, valueType = "actuelle") {
      const threshold = this.thresholds[sensorType]
      if (!threshold) return
  
      const alertKey = `${sensorType}_${valueType}`
      const now = Date.now()
  
      // Éviter les alertes répétitives (minimum 10 minutes entre les mêmes alertes)
      if (this.lastAlerts[alertKey] && now - this.lastAlerts[alertKey] < 600000) {
        return
      }
  
      let alertLevel = null
      let message = ""
      let recommendation = ""
  
      // Vérifier les seuils critiques
      if (value < threshold.critical_min) {
        alertLevel = "critical"
        message = `🚨 ${threshold.name} ${valueType} CRITIQUE : ${value}${threshold.unit}`
        recommendation = this.getRecommendation(sensorType, "too_low_critical")
      } else if (value > threshold.critical_max) {
        alertLevel = "critical"
        message = `🚨 ${threshold.name} ${valueType} CRITIQUE : ${value}${threshold.unit}`
        recommendation = this.getRecommendation(sensorType, "too_high_critical")
      }
      // Vérifier les seuils d'avertissement
      else if (value < threshold.optimal_min) {
        alertLevel = "warning"
        message = `⚠️ ${threshold.name} ${valueType} trop basse : ${value}${threshold.unit}`
        recommendation = this.getRecommendation(sensorType, "too_low")
      } else if (value > threshold.optimal_max) {
        alertLevel = "warning"
        message = `⚠️ ${threshold.name} ${valueType} trop élevée : ${value}${threshold.unit}`
        recommendation = this.getRecommendation(sensorType, "too_high")
      }
  
      // Si une alerte est nécessaire
      if (alertLevel) {
        this.createAlert(alertLevel, message, recommendation, sensorType, value, valueType)
        this.lastAlerts[alertKey] = now
      }
    }
  
    getRecommendation(sensorType, condition) {
      const recommendations = {
        temperature: {
          too_low: "Activez le chauffage. Température optimale pour fraises : 18-24°C",
          too_high: "Activez la ventilation ou l'ombrage. Risque de stress thermique",
          too_low_critical: "URGENT : Chauffage immédiat requis ! Risque de gel des plants",
          too_high_critical: "URGENT : Refroidissement immédiat ! Risque de flétrissement",
        },
        humidity: {
          too_low: "Activez l'humidificateur ou l'arrosage. Humidité optimale : 60-80%",
          too_high: "Activez la ventilation. Risque de maladies fongiques",
          too_low_critical: "URGENT : Humidification immédiate ! Risque de dessèchement",
          too_high_critical: "URGENT : Ventilation maximale ! Risque élevé de pourriture",
        },
        light: {
          too_low: "Activez l'éclairage LED. Luminosité optimale : 800-2000 lux",
          too_high: "Activez l'ombrage ou réduisez l'éclairage artificiel",
          too_low_critical: "URGENT : Éclairage immédiat ! Photosynthèse insuffisante",
          too_high_critical: "URGENT : Protection solaire ! Risque de brûlure des feuilles",
        },
      }
  
      return recommendations[sensorType]?.[condition] || "Vérifiez les paramètres du capteur"
    }
  
    createAlert(level, message, recommendation, sensorType, value, valueType) {
      const alert = {
        id: Date.now(),
        level: level,
        type: "strawberry_cultivation",
        sensor: sensorType,
        value: value,
        valueType: valueType,
        title: message,
        message: recommendation,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      }
  
      // Ajouter à l'historique
      this.alertHistory.unshift(alert)
  
      // Garder seulement les 50 dernières alertes
      if (this.alertHistory.length > 50) {
        this.alertHistory = this.alertHistory.slice(0, 50)
      }
  
      // Sauvegarder dans localStorage
      localStorage.setItem("strawberryAlerts", JSON.stringify(this.alertHistory))
  
      // Afficher la notification
      this.showNotification(alert)
  
      // Mettre à jour l'affichage des alertes
      this.updateAlertsDisplay()
  
      // Log pour debug
      console.log(`🍓 Alerte fraise ${level}:`, message, recommendation)
  
      // Déclencher un événement personnalisé
      window.dispatchEvent(new CustomEvent("strawberryAlert", { detail: alert }))
    }
  
    showNotification(alert) {
      const notificationColors = {
        critical: "#f56565",
        warning: "#ed8936",
        info: "#4299e1",
      }
  
      const notification = document.createElement("div")
      notification.className = `strawberry-notification ${alert.level}`
      notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${notificationColors[alert.level]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1002;
        max-width: 350px;
        word-wrap: break-word;
        animation: slideInAlert 0.3s ease;
        border-left: 4px solid rgba(255,255,255,0.8);
      `
  
      notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <div style="font-size: 1.2em;">🍓</div>
          <div style="flex: 1;">
            <div style="font-weight: bold; margin-bottom: 5px;">${alert.title}</div>
            <div style="font-size: 0.9em; opacity: 0.9;">${alert.message}</div>
            <div style="font-size: 0.8em; margin-top: 5px; opacity: 0.8;">
              ${new Date().toLocaleTimeString("fr-FR")}
            </div>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="background: none; border: none; color: white; font-size: 1.2em; cursor: pointer; opacity: 0.7;">×</button>
        </div>
      `
  
      document.body.appendChild(notification)
  
      // Auto-suppression après 10 secondes pour les avertissements, 15 pour les critiques
      const autoRemoveTime = alert.level === "critical" ? 15000 : 10000
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.animation = "slideOutAlert 0.3s ease"
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 300)
        }
      }, autoRemoveTime)
    }
  
    updateAlertsDisplay() {
      const alertsList = document.getElementById("alertsList")
      if (!alertsList) return
  
      const recentAlerts = this.alertHistory.slice(0, 5)
  
      if (recentAlerts.length === 0) {
        alertsList.innerHTML = `
          <div class="alert-item info">
            <div class="alert-content">
              <div class="alert-title">🍓 Système de surveillance actif</div>
              <div class="alert-message">Surveillance continue des conditions optimales pour fraises</div>
              <div class="alert-time">${new Date().toLocaleString("fr-FR")}</div>
            </div>
          </div>
        `
        return
      }
  
      alertsList.innerHTML = recentAlerts
        .map(
          (alert) => `
        <div class="alert-item ${alert.level}" data-alert-id="${alert.id}">
          <div class="alert-content">
            <div class="alert-title">🍓 ${alert.title}</div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-time">${new Date(alert.timestamp).toLocaleString("fr-FR")}</div>
          </div>
          <button class="acknowledge-btn" onclick="strawberryAlerts.acknowledgeAlert(${alert.id})" 
                  style="background: none; border: 1px solid currentColor; color: inherit; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
            ${alert.acknowledged ? "✓" : "Vu"}
          </button>
        </div>
      `,
        )
        .join("")
    }
  
    acknowledgeAlert(alertId) {
      const alert = this.alertHistory.find((a) => a.id === alertId)
      if (alert) {
        alert.acknowledged = true
        localStorage.setItem("strawberryAlerts", JSON.stringify(this.alertHistory))
        this.updateAlertsDisplay()
      }
    }
  
    performPeriodicCheck() {
      console.log("🔄 Vérification périodique des conditions fraises")
  
      // Vérifier les données actuelles si disponibles
      if (window.sensorData) {
        if (window.sensorData.latest) {
          this.checkLatestValues({
            temperature: { val: window.sensorData.latest.temperature },
            humidity: { val: window.sensorData.latest.humidity },
            light: { val: window.sensorData.latest.light },
          })
        }
  
        if (window.sensorData.averages) {
          this.checkAverageValues({
            temperature: { global_stats: { average: window.sensorData.averages.temperature } },
            humidity: { global_stats: { average: window.sensorData.averages.humidity } },
            light: { global_stats: { average: window.sensorData.averages.light } },
          })
        }
      }
    }
  
    getAlertSummary() {
      const summary = {
        total: this.alertHistory.length,
        critical: this.alertHistory.filter((a) => a.level === "critical").length,
        warning: this.alertHistory.filter((a) => a.level === "warning").length,
        unacknowledged: this.alertHistory.filter((a) => !a.acknowledged).length,
        last24h: this.alertHistory.filter((a) => Date.now() - new Date(a.timestamp).getTime() < 86400000).length,
      }
  
      return summary
    }
  
    clearOldAlerts() {
      // Supprimer les alertes de plus de 7 jours
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      this.alertHistory = this.alertHistory.filter((alert) => new Date(alert.timestamp).getTime() > weekAgo)
      localStorage.setItem("strawberryAlerts", JSON.stringify(this.alertHistory))
      this.updateAlertsDisplay()
    }
  
    toggleMonitoring() {
      this.isMonitoring = !this.isMonitoring
      console.log(`🍓 Surveillance fraises ${this.isMonitoring ? "activée" : "désactivée"}`)
      return this.isMonitoring
    }
  }
  
  // Ajouter les styles CSS pour les animations
  const alertStyles = document.createElement("style")
  alertStyles.textContent = `
    @keyframes slideInAlert {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutAlert {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .strawberry-notification {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .acknowledge-btn:hover {
      background: rgba(255,255,255,0.1) !important;
    }
    
    .alert-item[data-alert-id] {
      position: relative;
    }
    
    .alert-item .acknowledge-btn {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  `
  document.head.appendChild(alertStyles)
  
  // Initialiser le système d'alertes
  window.strawberryAlerts = new StrawberryAlertSystem()
  
  console.log("🍓 Système d'alertes pour culture de fraises chargé")
  