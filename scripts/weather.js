// Système météorologique pour la page d'accueil
class WeatherSystem {
    constructor() {
      console.log("🌤️ Initialisation du système météo")
  
      this.apiKey = null // Pour une vraie API, ajouter la clé ici
      this.location = { lat: 48.8566, lon: 2.3522 } // Paris, France
      this.currentWeather = null
      this.forecast = null
  
      this.init()
    }
  
    async init() {
      try {
        // Essayer de récupérer la position de l'utilisateur
        await this.getUserLocation()
  
        // Charger les données météo
        await this.loadWeatherData()
  
        // Mettre à jour l'affichage
        this.updateWeatherDisplay()
  
        // Analyser l'impact sur la culture
        this.analyzeWeatherImpact()
  
        // Mise à jour automatique toutes les 30 minutes
        setInterval(() => {
          this.loadWeatherData()
        }, 1800000)
  
        console.log("✅ Système météo initialisé")
      } catch (error) {
        console.error("❌ Erreur initialisation météo:", error)
        this.loadDemoWeatherData()
      }
    }
  
    async getUserLocation() {
      // Forcer l'utilisation de Paris
      this.location = {
        lat: 48.8566,
        lon: 2.3522,
      }
      console.log("📍 Position fixée sur Paris:", this.location)
      return Promise.resolve()
    }
  
    async loadWeatherData() {
      try {
        // Utiliser l'API Open-Meteo (gratuite)
        await this.loadRealWeatherData()
        console.log("✅ Données météo réelles chargées")
      } catch (error) {
        console.error("❌ Erreur API météo, basculement sur données de démonstration:", error)
        // En cas d'erreur, utiliser des données simulées
        this.loadDemoWeatherData()
      }
    }
  
    async loadRealWeatherData() {
      try {
        console.log("🌐 Chargement des données météo via Open-Meteo API")
  
        // API Open-Meteo - Gratuite et sans clé API
        const baseUrl = "https://api.open-meteo.com/v1"
  
        // Météo actuelle et prévisions en une seule requête
        const response = await fetch(
          `${baseUrl}/forecast?latitude=${this.location.lat}&longitude=${this.location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe/Paris&forecast_days=6`,
        )
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
  
        const data = await response.json()
        console.log("📡 Données Open-Meteo reçues:", data)
  
        // Traiter les données actuelles
        this.currentWeather = this.processOpenMeteoCurrentData(data)
  
        // Traiter les prévisions (exclure aujourd'hui, prendre les 5 prochains jours)
        this.forecast = this.processOpenMeteoForecastData(data)
  
        console.log("✅ Données météo réelles chargées avec succès")
      } catch (error) {
        console.error("❌ Erreur API Open-Meteo:", error)
        throw error
      }
    }
  
    processOpenMeteoCurrentData(data) {
      const current = data.current
      const weatherCode = current.weather_code
      const weatherInfo = this.getWeatherInfoFromCode(weatherCode)
  
      return {
        date: new Date(),
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m * 3.6), // Conversion m/s vers km/h
        visibility: Math.round(current.visibility / 1000), // Conversion m vers km
        condition: weatherInfo.condition,
        description: weatherInfo.description,
        icon: weatherInfo.icon,
        iconClass: weatherInfo.iconClass,
        weatherCode: weatherCode,
      }
    }
  
    processOpenMeteoForecastData(data) {
      const daily = data.daily
      const forecast = []
  
      // Commencer à partir de demain (index 1)
      for (let i = 1; i <= 5; i++) {
        if (i < daily.time.length) {
          const date = new Date(daily.time[i])
          const weatherCode = daily.weather_code[i]
          const weatherInfo = this.getWeatherInfoFromCode(weatherCode)
  
          forecast.push({
            date: date,
            temperature: Math.round((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2),
            temperatureMax: Math.round(daily.temperature_2m_max[i]),
            temperatureMin: Math.round(daily.temperature_2m_min[i]),
            condition: weatherInfo.condition,
            description: weatherInfo.description,
            icon: weatherInfo.icon,
            iconClass: weatherInfo.iconClass,
            weatherCode: weatherCode,
          })
        }
      }
  
      return forecast
    }
  
    // Convertir les codes météo Open-Meteo en informations lisibles
    getWeatherInfoFromCode(code) {
      const weatherCodes = {
        0: { condition: "clear", description: "ciel dégagé", icon: "fas fa-sun", iconClass: "sunny" },
        1: { condition: "clear", description: "principalement dégagé", icon: "fas fa-sun", iconClass: "sunny" },
        2: { condition: "clouds", description: "partiellement nuageux", icon: "fas fa-cloud-sun", iconClass: "cloudy" },
        3: { condition: "clouds", description: "couvert", icon: "fas fa-cloud", iconClass: "cloudy" },
        45: { condition: "fog", description: "brouillard", icon: "fas fa-smog", iconClass: "cloudy" },
        48: { condition: "fog", description: "brouillard givrant", icon: "fas fa-smog", iconClass: "cloudy" },
        51: { condition: "drizzle", description: "bruine légère", icon: "fas fa-cloud-drizzle", iconClass: "rainy" },
        53: { condition: "drizzle", description: "bruine modérée", icon: "fas fa-cloud-drizzle", iconClass: "rainy" },
        55: { condition: "drizzle", description: "bruine dense", icon: "fas fa-cloud-drizzle", iconClass: "rainy" },
        61: { condition: "rain", description: "pluie légère", icon: "fas fa-cloud-rain", iconClass: "rainy" },
        63: { condition: "rain", description: "pluie modérée", icon: "fas fa-cloud-rain", iconClass: "rainy" },
        65: { condition: "rain", description: "pluie forte", icon: "fas fa-cloud-showers-heavy", iconClass: "rainy" },
        71: { condition: "snow", description: "neige légère", icon: "fas fa-snowflake", iconClass: "snowy" },
        73: { condition: "snow", description: "neige modérée", icon: "fas fa-snowflake", iconClass: "snowy" },
        75: { condition: "snow", description: "neige forte", icon: "fas fa-snowflake", iconClass: "snowy" },
        80: { condition: "rain", description: "averses légères", icon: "fas fa-cloud-rain", iconClass: "rainy" },
        81: { condition: "rain", description: "averses modérées", icon: "fas fa-cloud-rain", iconClass: "rainy" },
        82: {
          condition: "rain",
          description: "averses violentes",
          icon: "fas fa-cloud-showers-heavy",
          iconClass: "rainy",
        },
        95: { condition: "thunderstorm", description: "orage", icon: "fas fa-bolt", iconClass: "stormy" },
        96: {
          condition: "thunderstorm",
          description: "orage avec grêle légère",
          icon: "fas fa-bolt",
          iconClass: "stormy",
        },
        99: {
          condition: "thunderstorm",
          description: "orage avec grêle forte",
          icon: "fas fa-bolt",
          iconClass: "stormy",
        },
      }
  
      return (
        weatherCodes[code] || {
          condition: "unknown",
          description: "conditions inconnues",
          icon: "fas fa-question",
          iconClass: "cloudy",
        }
      )
    }
  
    loadDemoWeatherData() {
      console.log("🎭 Chargement des données météo de démonstration")
  
      // Générer des données météo réalistes basées sur la saison
      const now = new Date()
      const month = now.getMonth() // 0-11
      const isWinter = month >= 11 || month <= 2
      const isSpring = month >= 3 && month <= 5
      const isSummer = month >= 6 && month <= 8
      const isAutumn = month >= 9 && month <= 10
  
      // Météo actuelle simulée
      this.currentWeather = this.generateRealisticWeather(now, isWinter, isSpring, isSummer, isAutumn)
  
      // Prévisions 5 jours
      this.forecast = []
      for (let i = 1; i <= 5; i++) {
        const futureDate = new Date(now)
        futureDate.setDate(now.getDate() + i)
        this.forecast.push(this.generateRealisticWeather(futureDate, isWinter, isSpring, isSummer, isAutumn))
      }
    }
  
    generateRealisticWeather(date, isWinter, isSpring, isSummer, isAutumn) {
      const hour = date.getHours()
      const isDay = hour >= 6 && hour <= 18
  
      // Températures saisonnières réalistes pour la Suisse
      let baseTemp, tempVariation
      if (isWinter) {
        baseTemp = 2
        tempVariation = 8
      } else if (isSpring) {
        baseTemp = 15
        tempVariation = 10
      } else if (isSummer) {
        baseTemp = 25
        tempVariation = 8
      } else {
        // automne
        baseTemp = 12
        tempVariation = 10
      }
  
      // Variation jour/nuit
      const dayNightVariation = isDay ? 3 : -3
      const randomVariation = (Math.random() - 0.5) * tempVariation
      const temperature = Math.round(baseTemp + dayNightVariation + randomVariation)
  
      // Ajustements spécifiques au climat parisien
      if (isWinter) {
        // Hiver parisien : plus doux, plus humide
        baseTemp = 5
        tempVariation = 6
      } else if (isSpring) {
        // Printemps parisien : variable
        baseTemp = 14
        tempVariation = 8
      } else if (isSummer) {
        // Été parisien : chaud mais pas excessif
        baseTemp = 23
        tempVariation = 7
      } else {
        // Automne parisien : doux et humide
        baseTemp = 11
        tempVariation = 8
      }
  
      // Conditions météo probables selon la saison
      const weatherConditions = this.getSeasonalWeatherConditions(isWinter, isSpring, isSummer, isAutumn)
      const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
  
      return {
        date: date,
        temperature: temperature,
        feelsLike: temperature + Math.round((Math.random() - 0.5) * 4),
        humidity: Math.round(65 + (Math.random() - 0.5) * 30),
        windSpeed: Math.round(5 + Math.random() * 15),
        visibility: Math.round(8 + Math.random() * 7),
        condition: condition.name,
        description: condition.description,
        icon: condition.icon,
        iconClass: condition.iconClass,
      }
    }
  
    getSeasonalWeatherConditions(isWinter, isSpring, isSummer, isAutumn) {
      if (isWinter) {
        return [
          { name: "clear", description: "ensoleillé", icon: "fas fa-sun", iconClass: "sunny" },
          { name: "clouds", description: "nuageux", icon: "fas fa-cloud", iconClass: "cloudy" },
          { name: "snow", description: "neige", icon: "fas fa-snowflake", iconClass: "snowy" },
          { name: "rain", description: "pluie", icon: "fas fa-cloud-rain", iconClass: "rainy" },
        ]
      } else if (isSpring) {
        return [
          { name: "clear", description: "ensoleillé", icon: "fas fa-sun", iconClass: "sunny" },
          { name: "clouds", description: "partiellement nuageux", icon: "fas fa-cloud-sun", iconClass: "cloudy" },
          { name: "rain", description: "averses", icon: "fas fa-cloud-rain", iconClass: "rainy" },
        ]
      } else if (isSummer) {
        return [
          { name: "clear", description: "ensoleillé", icon: "fas fa-sun", iconClass: "sunny" },
          { name: "clouds", description: "quelques nuages", icon: "fas fa-cloud-sun", iconClass: "cloudy" },
          { name: "thunderstorm", description: "orages", icon: "fas fa-bolt", iconClass: "stormy" },
        ]
      } else {
        // automne
        return [
          { name: "clouds", description: "nuageux", icon: "fas fa-cloud", iconClass: "cloudy" },
          { name: "rain", description: "pluie", icon: "fas fa-cloud-rain", iconClass: "rainy" },
          { name: "clear", description: "éclaircies", icon: "fas fa-cloud-sun", iconClass: "cloudy" },
        ]
      }
    }
  
    updateWeatherDisplay() {
      if (!this.currentWeather) return
  
      // Météo actuelle
      const currentTemp = document.getElementById("currentTemp")
      const weatherDescription = document.getElementById("weatherDescription")
      const weatherLocation = document.getElementById("weatherLocation")
      const currentWeatherIcon = document.getElementById("currentWeatherIcon")
      const currentHumidity = document.getElementById("currentHumidity")
      const currentWind = document.getElementById("currentWind")
      const currentVisibility = document.getElementById("currentVisibility")
      const feelsLike = document.getElementById("feelsLike")
  
      if (currentTemp) currentTemp.textContent = `${this.currentWeather.temperature}°C`
      if (weatherDescription) weatherDescription.textContent = this.currentWeather.description
      if (weatherLocation) weatherLocation.textContent = "📍 Paris, France"
  
      if (currentWeatherIcon) {
        currentWeatherIcon.innerHTML = `<i class="${this.currentWeather.icon}"></i>`
        currentWeatherIcon.className = `weather-icon ${this.currentWeather.iconClass}`
      }
  
      if (currentHumidity) currentHumidity.textContent = `${this.currentWeather.humidity}%`
      if (currentWind) currentWind.textContent = `${this.currentWeather.windSpeed} km/h`
      if (currentVisibility) currentVisibility.textContent = `${this.currentWeather.visibility} km`
      if (feelsLike) feelsLike.textContent = `${this.currentWeather.feelsLike}°C`
  
      // Prévisions
      this.updateForecastDisplay()
    }
  
    updateForecastDisplay() {
      const forecastContainer = document.getElementById("forecastContainer")
      if (!forecastContainer || !this.forecast) return
  
      forecastContainer.innerHTML = this.forecast
        .map((day, index) => {
          const date = day.date
          const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" })
          const dateNum = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
  
          // Utiliser les vraies températures min/max si disponibles
          const tempHigh = day.temperatureMax || day.temperature + Math.round(Math.random() * 5)
          const tempLow = day.temperatureMin || day.temperature - Math.round(Math.random() * 5 + 3)
  
          return `
          <div class="forecast-day">
            <div class="forecast-date">
              <div class="forecast-day-name">${dayName}</div>
              <div class="forecast-date-num">${dateNum}</div>
            </div>
            <div class="forecast-icon ${day.iconClass}">
              <i class="${day.icon}"></i>
            </div>
            <div class="forecast-desc">${day.description}</div>
            <div class="forecast-temps">
              <span class="forecast-high">${tempHigh}°</span>
              <span class="forecast-low">${tempLow}°</span>
            </div>
          </div>
        `
        })
        .join("")
    }
  
    analyzeWeatherImpact() {
      if (!this.currentWeather) return
  
      const impactAlerts = document.getElementById("weatherImpactAlerts")
      if (!impactAlerts) return
  
      const alerts = []
      const temp = this.currentWeather.temperature
      const humidity = this.currentWeather.humidity
      const condition = this.currentWeather.condition
  
      // Analyse de la température
      if (temp < 5) {
        alerts.push({
          type: "danger",
          icon: "fas fa-exclamation-triangle",
          message: "Risque de gel ! Protégez vos plants de fraises avec un voile d'hivernage.",
        })
      } else if (temp < 10) {
        alerts.push({
          type: "warning",
          icon: "fas fa-thermometer-empty",
          message: "Températures fraîches. Surveillez la croissance des fraises.",
        })
      } else if (temp > 30) {
        alerts.push({
          type: "warning",
          icon: "fas fa-thermometer-full",
          message: "Forte chaleur. Augmentez l'arrosage et prévoyez de l'ombrage.",
        })
      } else if (temp >= 18 && temp <= 24) {
        alerts.push({
          type: "success",
          icon: "fas fa-check-circle",
          message: "Température idéale pour la culture des fraises !",
        })
      }
  
      // Analyse de l'humidité
      if (humidity > 85) {
        alerts.push({
          type: "warning",
          icon: "fas fa-tint",
          message: "Humidité élevée. Risque de maladies fongiques, améliorez la ventilation.",
        })
      } else if (humidity < 40) {
        alerts.push({
          type: "warning",
          icon: "fas fa-fire",
          message: "Air sec. Augmentez l'humidification pour vos fraises.",
        })
      }
  
      // Analyse des conditions météo
      if (condition === "rain") {
        alerts.push({
          type: "info",
          icon: "fas fa-umbrella",
          message: "Pluie prévue. Réduisez l'arrosage automatique.",
        })
      } else if (condition === "snow") {
        alerts.push({
          type: "danger",
          icon: "fas fa-snowflake",
          message: "Neige ! Protection hivernale obligatoire pour les fraises.",
        })
      } else if (condition === "clear" && temp > 25) {
        alerts.push({
          type: "info",
          icon: "fas fa-sun",
          message: "Temps ensoleillé et chaud. Surveillez l'hydratation des plants.",
        })
      }
  
      // Conseils généraux selon la saison
      const month = new Date().getMonth()
      if (month >= 2 && month <= 4) {
        // Printemps
        alerts.push({
          type: "info",
          icon: "fas fa-seedling",
          message: "Printemps : période de plantation et de croissance active des fraises.",
        })
      } else if (month >= 5 && month <= 7) {
        // Été
        alerts.push({
          type: "success",
          icon: "fas fa-apple-alt",
          message: "Saison de récolte des fraises ! Surveillez la maturité des fruits.",
        })
      }
  
      // Afficher les alertes
      if (alerts.length === 0) {
        alerts.push({
          type: "info",
          icon: "fas fa-info-circle",
          message: "Conditions météorologiques normales pour la culture des fraises.",
        })
      }
  
      impactAlerts.innerHTML = alerts
        .map(
          (alert) => `
        <div class="impact-alert ${alert.type}">
          <i class="${alert.icon}"></i>
          <span>${alert.message}</span>
        </div>
      `,
        )
        .join("")
    }
  
    // Méthode publique pour forcer la mise à jour
    async refresh() {
      console.log("🔄 Actualisation météo forcée")
      await this.loadWeatherData()
      this.updateWeatherDisplay()
      this.analyzeWeatherImpact()
    }
  
    // Obtenir un résumé météo pour d'autres composants
    getWeatherSummary() {
      if (!this.currentWeather) return null
  
      return {
        temperature: this.currentWeather.temperature,
        condition: this.currentWeather.condition,
        description: this.currentWeather.description,
        humidity: this.currentWeather.humidity,
        windSpeed: this.currentWeather.windSpeed,
        isGoodForStrawberries: this.isGoodWeatherForStrawberries(),
      }
    }
  
    isGoodWeatherForStrawberries() {
      if (!this.currentWeather) return false
  
      const temp = this.currentWeather.temperature
      const humidity = this.currentWeather.humidity
  
      return (
        temp >= 15 &&
        temp <= 25 &&
        humidity >= 50 &&
        humidity <= 80 &&
        !["snow", "thunderstorm"].includes(this.currentWeather.condition)
      )
    }
  }
  
  // Initialiser le système météo sur la page d'accueil
  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".weather-section")) {
      window.weatherSystem = new WeatherSystem()
  
      // Bouton de test pour la météo
      
      testWeatherBtn.onclick = () => {
        if (window.weatherSystem) {
          window.weatherSystem.refresh()
          if (window.utils) {
            window.utils.showNotification("Météo actualisée !", "success")
          }
        }
      }
      document.body.appendChild(testWeatherBtn)
    }
  })
  
  console.log("🌤️ Module météo chargé")
  