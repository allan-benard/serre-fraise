import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Dashboard avec Moyennes et Graphiques")
  let dailyChart, hourlyChart, comparisonChart

  // Vérifier si l'utilisateur est connecté
  if (!localStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html"
    return
  }

  // Attendre que tout soit chargé
  function waitForDependencies() {
    if (typeof Chart !== "undefined" && window.sensorData) {
      console.log("✅ Dépendances disponibles")
      initDashboard()
    } else {
      console.log("⏳ Attente des dépendances...")
      setTimeout(waitForDependencies, 100)
    }
  }

  waitForDependencies()

  function initDashboard() {
    console.log("🔧 Initialisation du dashboard avec moyennes...")

    // Attendre que les moyennes soient chargées
    const checkAverages = setInterval(() => {
      if (window.sensorData && window.sensorData.averages && window.sensorData.averages.temperature > 0) {
        console.log("✅ Moyennes disponibles")
        updateAverageValues()
        createAllCharts()
        loadAlerts()
        clearInterval(checkAverages)
      }
    }, 100)

    // Timeout de sécurité
    setTimeout(() => {
      clearInterval(checkAverages)
      updateAverageValues()
      createAllCharts()
    }, 5000)

    loadWeatherData()
  }

  // Écouter les mises à jour
  window.addEventListener("averagesUpdated", (event) => {
    console.log("📊 Moyennes mises à jour:", event.detail)
    updateAverageValues()
    createAllCharts()
  })

  window.addEventListener("latestDataUpdated", (event) => {
    console.log("📡 Dernières données mises à jour:", event.detail)
    updateComparisonInfo()
  })

  function updateAverageValues() {
    if (!window.sensorData || !window.sensorData.averages) {
      console.warn("⚠️ Moyennes non disponibles")
      return
    }

    const averages = window.sensorData.averages
    const latest = window.sensorData.latest || {}

    console.log("📊 Mise à jour des moyennes:", averages)

    // Température
    updateSensorCard("temp", averages.temperature, "°C", "temperature", latest.temperature)

    // Humidité
    updateSensorCard("humidity", averages.humidity, "%", "humidity", latest.humidity)

    // Luminosité
    updateSensorCard("light", averages.light, " lux", "light", latest.light)

    updateLastUpdateTime()
  }

  function updateSensorCard(prefix, average, unit, type, latestValue) {
    const valueElement = document.getElementById(`${prefix}Value`)
    const statusElement = document.getElementById(`${prefix}Status`)

    if (valueElement && statusElement) {
      // Afficher la moyenne
      valueElement.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <span style="font-size: 2rem; font-weight: bold;">${average}${unit}</span>
          <span style="font-size: 0.8rem; color: var(--text-light);">Moyenne ${window.sensorData.periodDays} jours</span>
        </div>
      `

      // Calculer le statut basé sur la moyenne
      const status = window.sensorData.getStatus(type, average)
      const trend = window.sensorData.getTrend(type)

      statusElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 5px;">
          <span>${getStatusText(status)}</span>
          <span title="${window.utils.getTrendText(trend)}">${window.utils.getTrendIcon(trend)}</span>
        </div>
      `
      statusElement.className = `sensor-status ${status}`

      // Ajouter info de comparaison si disponible
      if (latestValue && latestValue !== average) {
        const diff = latestValue - average
        const diffText = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
        const diffColor = diff > 0 ? "var(--warning-color)" : "var(--success-color)"

        valueElement.innerHTML += `
          <div style="font-size: 0.7rem; color: ${diffColor}; margin-top: 5px;">
            Actuel: ${latestValue}${unit} (${diffText})
          </div>
        `
      }

      // Animation
      valueElement.style.transform = "scale(1.02)"
      setTimeout(() => {
        valueElement.style.transform = "scale(1)"
      }, 200)
    }
  }

  function updateLastUpdateTime() {
    let lastUpdateElement = document.getElementById("lastUpdate")
    if (!lastUpdateElement) {
      lastUpdateElement = document.createElement("div")
      lastUpdateElement.id = "lastUpdate"
      lastUpdateElement.style.cssText = `
        text-align: center;
        color: var(--text-light);
        font-size: 0.9rem;
        margin-top: 15px;
        padding: 10px;
        background: rgba(56, 161, 105, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(56, 161, 105, 0.2);
      `

      const sensorsOverview = document.querySelector(".sensors-overview")
      if (sensorsOverview) {
        sensorsOverview.parentNode.insertBefore(lastUpdateElement, sensorsOverview.nextSibling)
      }
    }

    const stats = window.sensorData.stats
    let measurementInfo = ""

    if (stats && stats.temperature && stats.temperature.global_stats) {
      const totalMeasurements =
        stats.temperature.global_stats.total_measurements +
        stats.humidity.global_stats.total_measurements +
        stats.light.global_stats.total_measurements

      measurementInfo = ` • ${totalMeasurements} mesures analysées`
    }

    lastUpdateElement.innerHTML = `
      <i class="fas fa-chart-line" style="color: var(--success-color); margin-right: 5px;"></i>
      Moyennes calculées: ${new Date().toLocaleTimeString("fr-FR")}${measurementInfo}
    `
  }

  function createAllCharts() {
    console.log("📈 Création de tous les graphiques...")
    createDailyChart()
    createHourlyChart()
    createComparisonChart()
  }

  function createDailyChart() {
    const ctx = document.getElementById("sensorsChart")
    if (!ctx || !window.sensorData.dailyData) return

    if (dailyChart) dailyChart.destroy()

    const tempData = window.sensorData.dailyData.temperature || []
    const humidityData = window.sensorData.dailyData.humidity || []
    const lightData = window.sensorData.dailyData.light || []

    console.log(`📊 Graphique quotidien: ${tempData.length} jours de données`)

    if (tempData.length === 0) {
      ctx.getContext("2d").fillText("Aucune donnée disponible", 50, 50)
      return
    }

    const labels = tempData.map((item) => window.utils.formatDate(item.day))

    dailyChart = new Chart(ctx.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Température moyenne (°C)",
            data: tempData.map((item) => item.average),
            borderColor: "#e53e3e",
            backgroundColor: "rgba(229, 62, 62, 0.1)",
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Humidité moyenne (%)",
            data: humidityData.map((item) => item.average),
            borderColor: "#3182ce",
            backgroundColor: "rgba(49, 130, 206, 0.1)",
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Luminosité moyenne (lux/10)",
            data: lightData.map((item) => item.average / 10),
            borderColor: "#ed8936",
            backgroundColor: "rgba(237, 137, 54, 0.1)",
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Évolution des moyennes quotidiennes (${window.sensorData.periodDays} derniers jours)`,
            font: { size: 16, weight: "bold" },
          },
          legend: {
            position: "top",
            labels: { usePointStyle: true, padding: 20 },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: (context) => {
                const dataIndex = context[0].dataIndex
                const item = tempData[dataIndex]
                return `${window.utils.formatDate(item.day)} (${item.count} mesures)`
              },
              afterBody: (context) => {
                const dataIndex = context[0].dataIndex
                const tempItem = tempData[dataIndex]
                const humidityItem = humidityData[dataIndex]
                const lightItem = lightData[dataIndex]

                return [
                  `Temp: ${tempItem.minimum}°C - ${tempItem.maximum}°C`,
                  `Humidité: ${humidityItem.minimum}% - ${humidityItem.maximum}%`,
                  `Lumière: ${lightItem.minimum} - ${lightItem.maximum} lux`,
                ]
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Jours", font: { weight: "bold" } },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Valeurs", font: { weight: "bold" } },
          },
        },
      },
    })
  }

  function createHourlyChart() {
    // Créer un nouveau canvas pour le graphique horaire
    let hourlyCanvas = document.getElementById("hourlyChart")
    if (!hourlyCanvas) {
      const chartsSection = document.querySelector(".charts-section")
      if (chartsSection) {
        const hourlyContainer = document.createElement("div")
        hourlyContainer.className = "chart-container"
        hourlyContainer.style.marginTop = "30px"
        hourlyContainer.innerHTML = `
          <h3>Évolution horaire (dernières 24h)</h3>
          <canvas id="hourlyChart"></canvas>
        `
        chartsSection.appendChild(hourlyContainer)
        hourlyCanvas = document.getElementById("hourlyChart")
      }
    }

    if (!hourlyCanvas || !window.sensorData.hourlyData) return

    if (hourlyChart) hourlyChart.destroy()

    const tempData = window.sensorData.hourlyData.temperature || []
    const humidityData = window.sensorData.hourlyData.humidity || []
    const lightData = window.sensorData.hourlyData.light || []

    console.log(`⏰ Graphique horaire: ${tempData.length} heures de données`)

    if (tempData.length === 0) return

    const labels = tempData.map((item) => {
      const date = new Date(item.hour)
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    })

    hourlyChart = new Chart(hourlyCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Température (°C)",
            data: tempData.map((item) => item.average),
            borderColor: "#e53e3e",
            backgroundColor: "rgba(229, 62, 62, 0.2)",
            tension: 0.3,
            fill: true,
            pointRadius: 2,
          },
          {
            label: "Humidité (%)",
            data: humidityData.map((item) => item.average),
            borderColor: "#3182ce",
            backgroundColor: "rgba(49, 130, 206, 0.2)",
            tension: 0.3,
            fill: true,
            pointRadius: 2,
          },
          {
            label: "Luminosité (lux/10)",
            data: lightData.map((item) => item.average / 10),
            borderColor: "#ed8936",
            backgroundColor: "rgba(237, 137, 54, 0.2)",
            tension: 0.3,
            fill: true,
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: (context) => {
                const dataIndex = context[0].dataIndex
                const item = tempData[dataIndex]
                return new Date(item.hour).toLocaleString("fr-FR")
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Heures" },
            ticks: { maxTicksLimit: 12 },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Valeurs" },
          },
        },
      },
    })
  }

  function createComparisonChart() {
    // Créer un graphique de comparaison moyenne vs actuel
    let comparisonCanvas = document.getElementById("comparisonChart")
    if (!comparisonCanvas) {
      const chartsSection = document.querySelector(".charts-section")
      if (chartsSection) {
        const comparisonContainer = document.createElement("div")
        comparisonContainer.className = "chart-container"
        comparisonContainer.style.marginTop = "30px"
        comparisonContainer.innerHTML = `
          <h3>Comparaison: Moyennes vs Valeurs actuelles</h3>
          <canvas id="comparisonChart"></canvas>
        `
        chartsSection.appendChild(comparisonContainer)
        comparisonCanvas = document.getElementById("comparisonChart")
      }
    }

    if (!comparisonCanvas) return

    if (comparisonChart) comparisonChart.destroy()

    const averages = window.sensorData.averages
    const latest = window.sensorData.latest || averages

    comparisonChart = new Chart(comparisonCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Température", "Humidité", "Luminosité"],
        datasets: [
          {
            label: "Moyenne 7 jours",
            data: [averages.temperature, averages.humidity, averages.light / 10],
            backgroundColor: ["rgba(229, 62, 62, 0.6)", "rgba(49, 130, 206, 0.6)", "rgba(237, 137, 54, 0.6)"],
            borderColor: ["#e53e3e", "#3182ce", "#ed8936"],
            borderWidth: 2,
          },
          {
            label: "Valeur actuelle",
            data: [latest.temperature, latest.humidity, latest.light / 10],
            backgroundColor: ["rgba(229, 62, 62, 0.3)", "rgba(49, 130, 206, 0.3)", "rgba(237, 137, 54, 0.3)"],
            borderColor: ["#e53e3e", "#3182ce", "#ed8936"],
            borderWidth: 2,
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label
                const value = context.parsed.y
                const units = ["°C", "%", " lux"][context.dataIndex]
                const actualValue = context.dataIndex === 2 ? value * 10 : value
                return `${label}: ${actualValue}${units}`
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Valeurs (Luminosité ÷ 10)" },
          },
        },
      },
    })
  }

  function getStatusText(status) {
    const statusTexts = {
      normal: "Normal",
      warning: "Attention",
      critical: "Critique",
    }
    return statusTexts[status] || "Normal"
  }

  function loadWeatherData() {
    const weatherWidget = document.getElementById("weatherWidget")
    if (weatherWidget) {
      weatherWidget.innerHTML = `
        <i class="fas fa-cloud-sun"></i>
        <span>Extérieur: 18°C - nuageux</span>
      `
    }
  }

  function loadAlerts() {
    const alertsList = document.getElementById("alertsList")
    if (!alertsList) return

    const savedAlerts = JSON.parse(localStorage.getItem("sensorAlerts") || "[]")

    if (savedAlerts.length === 0) {
      savedAlerts.push({
        type: "info",
        title: "Système de moyennes actif",
        message: "Analyse des tendances sur 7 jours en cours",
        time: new Date().toISOString(),
      })
      localStorage.setItem("sensorAlerts", JSON.stringify(savedAlerts))
    }

    alertsList.innerHTML = savedAlerts
      .slice(0, 5)
      .map(
        (alert) => `
          <div class="alert-item ${alert.type}">
            <div class="alert-content">
              <div class="alert-title">${alert.title}</div>
              <div class="alert-message">${alert.message}</div>
              <div class="alert-time">${window.utils.formatDateTime(alert.time)}</div>
            </div>
          </div>
        `,
      )
      .join("")
  }

  // Bouton de debug pour les moyennes
  function addDebugButton() {
    const debugButton = document.createElement("button")
    debugButton.textContent = "📊 Debug Moyennes"
    debugButton.style.cssText = `
      position: fixed;
      bottom: 70px;
      right: 20px;
      background: var(--secondary-color);
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      z-index: 1000;
      font-weight: bold;
    `
    debugButton.onclick = () => {
      console.log("📊 État des moyennes:")
      console.log("- Moyennes:", window.sensorData.averages)
      console.log("- Données quotidiennes:", window.sensorData.dailyData)
      console.log("- Données horaires:", window.sensorData.hourlyData)
      console.log("- Statistiques:", window.sensorData.stats)

      window.utils.showNotification("Voir la console pour les détails des moyennes", "info")
    }
    document.body.appendChild(debugButton)
  }

  addDebugButton()

  console.log("✅ Dashboard avec moyennes et graphiques initialisé")

  function updateComparisonInfo() {
    // This function is intentionally empty.
    // It serves as a placeholder to prevent errors.
  }
})
