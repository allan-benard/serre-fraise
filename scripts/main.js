// Navigation mobile
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initialisation FraiseConnect Pro - Version Moyennes")

  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active")
    })

    document.querySelectorAll(".nav-menu a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active")
      })
    })
  }
})

// Gestion des données des capteurs avec moyennes
class SensorDataWithAverages {
  constructor() {
    console.log("🔧 Initialisation SensorData avec moyennes")
    this.averages = {
      temperature: 0,
      humidity: 0,
      light: 0,
    }
    this.dailyData = {
      temperature: [],
      humidity: [],
      light: [],
    }
    this.hourlyData = {
      temperature: [],
      humidity: [],
      light: [],
    }
    this.stats = {}
    this.apiBaseUrl = "api"
    this.periodDays = 7
    this.isLoading = false

    this.init()
  }

  async init() {
    console.log("🔄 Initialisation des moyennes...")
    await this.fetchAverages()
    await this.fetchLatestData() // Garder aussi les dernières valeurs pour comparaison
    console.log("✅ Moyennes initialisées")
  }

  async fetchAverages() {
    if (this.isLoading) return
    this.isLoading = true

    try {
      console.log("📊 Récupération des moyennes...")
      const response = await fetch(`${this.apiBaseUrl}/get_averages.php?period=${this.periodDays}&sensor=all`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📈 Moyennes reçues:", data)

      // Traiter les moyennes globales
      if (data.temperature && data.temperature.global_stats) {
        this.averages.temperature = data.temperature.global_stats.average
        this.dailyData.temperature = data.temperature.daily_averages || []
        this.hourlyData.temperature = data.temperature.hourly_averages || []
        console.log(`🌡️ Moyenne température: ${this.averages.temperature}°C`)
      }

      if (data.humidity && data.humidity.global_stats) {
        this.averages.humidity = data.humidity.global_stats.average
        this.dailyData.humidity = data.humidity.daily_averages || []
        this.hourlyData.humidity = data.humidity.hourly_averages || []
        console.log(`💧 Moyenne humidité: ${this.averages.humidity}%`)
      }

      if (data.light && data.light.global_stats) {
        this.averages.light = data.light.global_stats.average
        this.dailyData.light = data.light.daily_averages || []
        this.hourlyData.light = data.light.hourly_averages || []
        console.log(`☀️ Moyenne luminosité: ${this.averages.light} lux`)
      }

      // Sauvegarder les statistiques complètes
      this.stats = data

      // Déclencher un événement pour notifier les autres scripts
      window.dispatchEvent(new CustomEvent("averagesUpdated", { detail: data }))
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des moyennes:", error)
      // En cas d'erreur, utiliser des valeurs par défaut
      this.averages = {
        temperature: 23.5,
        humidity: 65,
        light: 1200,
      }
    } finally {
      this.isLoading = false
    }
  }

  async fetchLatestData() {
    try {
      console.log("📡 Récupération des dernières données...")
      const response = await fetch(`${this.apiBaseUrl}/get_sensors_data.php?request=latest&sensor=all`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Sauvegarder les dernières valeurs pour comparaison
      this.latest = {
        temperature: data.temperature ? Number.parseFloat(data.temperature.val) : 0,
        humidity: data.humidity ? Number.parseFloat(data.humidity.val) : 0,
        light: data.light ? Number.parseFloat(data.light.val) : 0,
      }

      console.log("📊 Dernières valeurs:", this.latest)

      // Déclencher un événement
      window.dispatchEvent(new CustomEvent("latestDataUpdated", { detail: data }))
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des dernières données:", error)
    }
  }

  getStatus(type, value) {
    const thresholds = {
      temperature: { min: 18, max: 28 },
      humidity: { min: 60, max: 80 },
      light: { min: 800, max: 2000 },
    }

    const threshold = thresholds[type]
    if (value < threshold.min || value > threshold.max) {
      return "critical"
    } else if (value < threshold.min + 2 || value > threshold.max - 2) {
      return "warning"
    }
    return "normal"
  }

  getTrend(type) {
    // Calculer la tendance basée sur les données quotidiennes
    const dailyData = this.dailyData[type]
    if (!dailyData || dailyData.length < 2) return "stable"

    const recent = dailyData.slice(0, 3) // 3 derniers jours
    const older = dailyData.slice(3, 6) // 3 jours précédents

    if (recent.length === 0 || older.length === 0) return "stable"

    const recentAvg = recent.reduce((sum, day) => sum + day.average, 0) / recent.length
    const olderAvg = older.reduce((sum, day) => sum + day.average, 0) / older.length

    const diff = recentAvg - olderAvg
    const threshold = type === "temperature" ? 1 : type === "humidity" ? 5 : 50

    if (diff > threshold) return "increasing"
    if (diff < -threshold) return "decreasing"
    return "stable"
  }

  async refresh() {
    console.log("🔄 Actualisation forcée des moyennes...")
    await this.fetchAverages()
    await this.fetchLatestData()
  }
}

// Instance globale des données des capteurs avec moyennes
window.sensorData = new SensorDataWithAverages()

// Mise à jour des moyennes toutes les 5 minutes
setInterval(() => {
  console.log("⏰ Mise à jour automatique des moyennes...")
  window.sensorData.fetchAverages()
}, 300000)

// Mise à jour des dernières données toutes les 2 minutes
setInterval(() => {
  console.log("⏰ Mise à jour des dernières données...")
  window.sensorData.fetchLatestData()
}, 120000)

// Utilitaires
window.utils = {
  formatTime: (date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  },

  formatDate: (date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    })
  },

  formatDateTime: (date) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  },

  getTrendIcon: (trend) => {
    switch (trend) {
      case "increasing":
        return "📈"
      case "decreasing":
        return "📉"
      default:
        return "➡️"
    }
  },

  getTrendText: (trend) => {
    switch (trend) {
      case "increasing":
        return "En hausse"
      case "decreasing":
        return "En baisse"
      default:
        return "Stable"
    }
  },

  showNotification: (message, type = "info") => {
    console.log(`📢 Notification ${type}: ${message}`)

    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.textContent = message
    notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: ${type === "error" ? "var(--error-color)" : type === "warning" ? "var(--warning-color)" : "var(--success-color)"};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease"
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 5000)
  },
}

// Ajouter les animations CSS
const style = document.createElement("style")
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`
document.head.appendChild(style)

console.log("✅ Système de moyennes initialisé")
