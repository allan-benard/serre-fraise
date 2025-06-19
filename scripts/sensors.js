

document.addEventListener("DOMContentLoaded", () => {
  // --- Suppression du guard d'authentification pour accès libre ---

  // Initialiser la page des capteurs
  initSensorsPage()
  setupToggleButtons()
  setupThresholdInputs()

  // Écouter les mises à jour des capteurs
  window.addEventListener("sensorDataUpdated", updateSensorValues)
  
  

  function initSensorsPage() {
    updateSensorValues()
    updateTimestamps()
  }

  function updateSensorValues() {
    const data = window.sensorData

    // Mettre à jour les valeurs affichées
    document.getElementById("tempSensorValue")?.textContent = `${data.temperature}°C`
    document.getElementById("humiditySensorValue")?.textContent = `${data.humidity}%`
    document.getElementById("lightSensorValue")?.textContent = `${data.light} lux`

    updateTimestamps()
  }

  function updateTimestamps() {
    const timeString = window.utils.formatTime(new Date())
    document.getElementById("tempTimestamp")?.textContent = timeString
    document.getElementById("humidityTimestamp")?.textContent = timeString
    document.getElementById("lightTimestamp")?.textContent = timeString
  }

  function setupToggleButtons() {
    document.querySelectorAll(".toggle-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const currentState = this.getAttribute("data-state")
        const newState = currentState === "on" ? "off" : "on"
        this.setAttribute("data-state", newState)

        const actuatorName = this.id.replace("Toggle", "")
        handleActuatorToggle(actuatorName, newState)
      })
    })
  }

  function handleActuatorToggle(actuator, state) {
    const actuatorNames = {
      heating: "Chauffage",
      ventilation: "Ventilation",
      watering: "Arrosage",
      humidifier: "Humidificateur",
      led: "Éclairage LED",
      blinds: "Store automatique",
      autoMode: "Mode automatique",
      emailNotif: "Notifications email",
    }
    const name = actuatorNames[actuator] || actuator
    const action = state === "on" ? "activé" : "désactivé"
    window.utils.showNotification(`${name} ${action}`, "success")
    saveActuatorState(actuator, state)

    if (actuator === "emailNotif") {
      localStorage.setItem("emailNotifications", state === "on" ? "true" : "false")
    }

    if (state === "on") {
      simulateActuatorEffect(actuator)
    }
  }

  function saveActuatorState(actuator, state) {
    const states = JSON.parse(localStorage.getItem("actuatorStates") || "{}")
    states[actuator] = state
    localStorage.setItem("actuatorStates", JSON.stringify(states))
  }

  function simulateActuatorEffect(actuator) {
    setTimeout(() => {
      let sensorType, newValue
      switch (actuator) {
        case "heating":
          sensorType = "temperature"; newValue = window.sensorData.temperature + 1; break
        case "ventilation":
          sensorType = "temperature"; newValue = window.sensorData.temperature - 0.5; break
        case "watering": case "humidifier":
          sensorType = "humidity"; newValue = window.sensorData.humidity + 3; break
        case "led":
          sensorType = "light"; newValue = window.sensorData.light + 200; break
        case "blinds":
          sensorType = "light"; newValue = window.sensorData.light - 100; break
        default:
          return
      }

      if (sensorType) {
        fetch("/api/insert_sensor_data.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sensor: sensorType, value: newValue }),
        })
        .then(res => res.json())
        .then(data => {
          if (data.message === "Données insérées avec succès") {
            window.sensorData[sensorType] = newValue
            updateSensorValues()
            window.dispatchEvent(new CustomEvent("sensorDataUpdated"))
          }
        })
      }
    }, 2000)
  }

  function setupThresholdInputs() {
    document.querySelectorAll('input[type="number"]').forEach((input) => {
      input.addEventListener("change", () => {
        const val = parseFloat(input.value)
        localStorage.setItem(`threshold_${input.id}`, val)
        window.utils.showNotification("Seuil mis à jour", "success")
      })
    })
    loadSavedThresholds()
  }

  function loadSavedThresholds() {
    document.querySelectorAll('input[type="number"]').forEach((input) => {
      const saved = localStorage.getItem(`threshold_${input.id}`)
      if (saved) input.value = saved
    })
  }

  function loadActuatorStates() {
    const states = JSON.parse(localStorage.getItem("actuatorStates") || "{}")
    Object.entries(states).forEach(([actuator, state]) => {
      document.getElementById(`${actuator}Toggle`)?.setAttribute("data-state", state)
    })
    const en = localStorage.getItem("emailNotifications")
    document.getElementById("emailNotifToggle")?.setAttribute("data-state", en === "true" ? "on" : "off")
  }
  loadActuatorStates()

  // Automatisme toutes les minutes si autoMode = on
  setInterval(() => {
    if (document.getElementById("autoModeToggle")?.getAttribute("data-state") === "on") {
      checkAndActivateActuators()
    }
  }, 60000)

  function checkAndActivateActuators() {
    const d = window.sensorData
    const getNum = (id, def) => parseFloat(document.getElementById(id)?.value ?? localStorage.getItem(`threshold_${id}`) ?? def)
    const [tMin, tMax] = [getNum("tempMin",18), getNum("tempMax",28)]
    const [hMin, hMax] = [getNum("humidityMin",60), getNum("humidityMax",80)]
    const [lMin, lMax] = [getNum("lightMin",800), getNum("lightMax",2000)]

    if (d.temperature < tMin) activateActuator("heating","on"), deactivateActuator("ventilation","off")
    else if (d.temperature > tMax) activateActuator("ventilation","on"), deactivateActuator("heating","off")

    if (d.humidity < hMin) activateActuator("humidifier","on")
    else if (d.humidity > hMax) activateActuator("ventilation","on"), deactivateActuator("humidifier","off")

    if (d.light < lMin) activateActuator("led","on"), deactivateActuator("blinds","off")
    else if (d.light > lMax) activateActuator("blinds","on"), deactivateActuator("led","off")
  }

  function activateActuator(a, s) {
    const btn = document.getElementById(`${a}Toggle`)
    if (btn?.getAttribute("data-state") !== s) {
      btn.setAttribute("data-state", s)
      handleActuatorToggle(a, s)
    }
  }
  function deactivateActuator(a, s) {
    const btn = document.getElementById(`${a}Toggle`)
    if (btn && btn.getAttribute("data-state") !== s) {
      btn.setAttribute("data-state", s)
    }
  }
  
})
