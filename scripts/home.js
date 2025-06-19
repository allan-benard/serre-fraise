// Animation des statistiques sur la page d'accueil
document.addEventListener("DOMContentLoaded", () => {
  const statNumbers = document.querySelectorAll(".stat-number")

  const animateStats = () => {
    statNumbers.forEach((stat) => {
      const target = Number.parseInt(stat.getAttribute("data-target"))
      const increment = target / 50
      let current = 0

      const updateStat = () => {
        if (current < target) {
          current += increment
          stat.textContent = Math.ceil(current)
          requestAnimationFrame(updateStat)
        } else {
          stat.textContent = target
        }
      }

      updateStat()
    })
  }

  // Observer pour déclencher l'animation quand la section est visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateStats()
        observer.unobserve(entry.target)
      }
    })
  })

  const statsSection = document.querySelector(".stats")
  if (statsSection) {
    observer.observe(statsSection)
  }
})
