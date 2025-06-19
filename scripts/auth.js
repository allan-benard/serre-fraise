/*
 * auth.js – Gestion de l'inscription / connexion
 * Remplace l'ancienne simulation LocalStorage par de vrais appels API.
 * Nécessite :
 *   – ./api/register.php   (POST {username,email,password})
 *   – ./api/login.php      (POST {email,password})
 * Les deux scripts PHP doivent renvoyer un JSON {status:"ok"} et gérer
 * les erreurs avec http status appropriés + message JSON {error:"..."}.
 * Le cookie de session PHP est transmis grâce à `credentials: "include"`.
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ----------------------------------
   *  Onglets (login / register)
   * ---------------------------------- */
  const tabBtns      = document.querySelectorAll(".tab-btn")
  const tabContents  = document.querySelectorAll(".tab-content")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab")

      // Reset classes
      tabBtns.forEach(b => b.classList.remove("active"))
      tabContents.forEach(c => c.classList.remove("active"))

      // Activate current
      btn.classList.add("active")
      document.getElementById(target).classList.add("active")
    })
  })

  /* ----------------------------------
   *  Helpers
   * ---------------------------------- */
  const notify = (msg, type = "info") => window.utils?.showNotification
    ? window.utils.showNotification(msg, type)
    : alert(`${type.toUpperCase()}: ${msg}`)

  const redirect = (url, delay = 800) => setTimeout(() => {
    window.location.href = url
  }, delay)

  const apiPost = async (endpoint, payload) => {
    const res = await fetch(`api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",           // transmet le cookie PHPSESSID
      body: JSON.stringify(payload)
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Erreur serveur")
    return data
  }

  /* ----------------------------------
   *  Formulaire LOGIN
   * ---------------------------------- */
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const email    = document.getElementById("loginEmail").value.trim()
      const password = document.getElementById("loginPassword").value

      if (!email || !password) {
        notify("Veuillez remplir tous les champs", "error")
        return
      }

      try {
        await apiPost("login.php", { email, password })
        notify("Connexion réussie !", "success")
        redirect("dashboard.html")
      } catch (err) {
        notify(err.message, "error")
      }
    })
  }

  /* ----------------------------------
   *  Formulaire REGISTER
   * ---------------------------------- */
  const registerForm = document.getElementById("registerForm")
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const name            = document.getElementById("registerName").value.trim()
      const email           = document.getElementById("registerEmail").value.trim()
      const password        = document.getElementById("registerPassword").value
      const confirmPassword = document.getElementById("confirmPassword").value

      // --- validations de base ---
      if (!name || !email || !password || !confirmPassword) {
        notify("Veuillez remplir tous les champs", "error")
        return
      }
      if (password !== confirmPassword) {
        notify("Les mots de passe ne correspondent pas", "error")
        return
      }
      if (password.length < 6) {
        notify("Le mot de passe doit contenir au moins 6 caractères", "error")
        return
      }

      try {
        await apiPost("register.php", { username: name, email, password })
        notify("Inscription réussie !", "success")
        redirect("dashboard.html")
      } catch (err) {
        notify(err.message, "error")
      }
    })
  }
})
