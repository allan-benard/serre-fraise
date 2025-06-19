// control.js — Volet & Pompe : même moteur, UI indépendantes (SANS section vitesse)
document.addEventListener('DOMContentLoaded', () => {
  
 

  /*─────────────────────────────────────────────────────────────
    1) Sélecteurs DOM – Pompe
  ─────────────────────────────────────────────────────────────*/
  const motorBtn  = document.getElementById('motorToggleButton');
  const motorIcon = document.getElementById('motorIcon');
  const motorTxt  = document.getElementById('motorStatusText');
  const lastSpan  = document.getElementById('lastActivation');
  const logDiv    = document.querySelector('.log-entries');

  /*─────────────────────────────────────────────────────────────
    2) Sélecteurs DOM – Volet
  ─────────────────────────────────────────────────────────────*/
  const shutBtn  = document.getElementById('shutterToggleButton');
  const shutIcon = document.getElementById('shutterIcon');
  const shutTxt  = document.getElementById('shutterStatusText');

  /*─────────────────────────────────────────────────────────────
    3) États
  ─────────────────────────────────────────────────────────────*/
  let isMotorOn     = false;  // pompe
  let isShutterOpen = false;  // volet

  /*─────────────────────────────────────────────────────────────
    4) API physique – même relais
  ─────────────────────────────────────────────────────────────*/
  function callMotorEndpoint(stateBool) {
    const url = `${location.protocol}//${location.hostname}:5000/motor?state=${stateBool ? 'on' : 'off'}`;
    fetch(url).catch(e => console.error('API /motor KO :', e));
  }

  /*─────────────────────────────────────────────────────────────
    5) Helpers
  ─────────────────────────────────────────────────────────────*/
  function addLog(label) {
    const stamp = new Date().toLocaleString('fr-FR', { hour12: false }).replace(',', '');
    const div   = document.createElement('div');
    div.className = 'log-item';
    div.innerHTML = `<span class="log-time">${stamp}</span> – ${label}`;
    logDiv.prepend(div);
    while (logDiv.children.length > 10) logDiv.lastChild.remove();
  }

  function updateLast() {
    lastSpan.textContent = new Date()
      .toLocaleString('fr-FR', { hour12: false })
      .replace(',', ' –');
  }

  /*─────────────────────────────────────────────────────────────
    6) Rendu UI – Pompe
  ─────────────────────────────────────────────────────────────*/
  function renderMotor() {
    if (isMotorOn) {
      motorBtn.textContent                     = 'Éteindre';
      motorBtn.classList.add('on');  motorBtn.classList.remove('off');
      motorBtn.querySelector('i').className    = 'fas fa-toggle-on';
      motorIcon. classList.add('on'); motorIcon.classList.remove('off');
      motorTxt  .textContent                   = 'ON';
      motorTxt  .classList.add('on'); motorTxt.classList.remove('off');

      updateLast();
      addLog('Moteur ALLUMÉ');
    } else {
      motorBtn.textContent                     = 'Allumer';
      motorBtn.classList.add('off'); motorBtn.classList.remove('on');
      motorBtn.querySelector('i').className    = 'fas fa-toggle-off';
      motorIcon. classList.add('off'); motorIcon.classList.remove('on');
      motorTxt  .textContent                   = 'OFF';
      motorTxt  .classList.add('off'); motorTxt.classList.remove('on');

      addLog('Moteur ÉTEINT');
    }
  }

  /*─────────────────────────────────────────────────────────────
    7) Rendu UI – Volet
  ─────────────────────────────────────────────────────────────*/
  function renderShutter() {
    if (isShutterOpen) {
      shutBtn.textContent                     = 'Fermer';
      shutBtn.classList.add('on');  shutBtn.classList.remove('off');
      shutBtn.querySelector('i').className    = 'fas fa-toggle-on';
      shutIcon.classList.add('on'); shutIcon.classList.remove('off');
      shutTxt.textContent                     = 'OUVERT';
      shutTxt.classList.add('on'); shutTxt.classList.remove('off');

      addLog('Volet OUVERT');
    } else {
      shutBtn.textContent                     = 'Ouvrir';
      shutBtn.classList.add('off'); shutBtn.classList.remove('on');
      shutBtn.querySelector('i').className    = 'fas fa-toggle-off';
      shutIcon.classList.add('off'); shutIcon.classList.remove('on');
      shutTxt.textContent                     = 'FERMÉ';
      shutTxt.classList.add('off'); shutTxt.classList.remove('on');

      addLog('Volet FERMÉ');
    }
  }

  /*─────────────────────────────────────────────────────────────
    8) Handlers
  ─────────────────────────────────────────────────────────────*/
  motorBtn.addEventListener('click', () => {
    isMotorOn = !isMotorOn;
    callMotorEndpoint(isMotorOn);
    renderMotor();              // met à jour la carte pompe
  });

  shutBtn.addEventListener('click', () => {
    isShutterOpen = !isShutterOpen;
    callMotorEndpoint(isShutterOpen); // même relais physique
    renderShutter();           // met à jour la carte volet
  });

  /*─────────────────────────────────────────────────────────────
    9) Init
  ─────────────────────────────────────────────────────────────*/
  renderMotor();
  renderShutter();
});
