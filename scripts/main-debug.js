// Version de debug du script principal
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initialisation FraiseConnect Pro - Version Debug")

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

// Classe de données des capteurs avec debug amélioré
class SensorDataDebug {
  constructor() {
    console.log("🔧 Initialisation SensorDataDebug")
    this.temperature = 0
    this.humidity = 0
    this.light = 0
    this.history = {
      temperature: [],
      humidity: [],
      light: [],
    }
    this.aggregatedHistory = {
      temperature: [],
      humidity: [],
      light: [],
    }
    this.apiBaseUrl = "api"
    this.periodD
