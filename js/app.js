// =================================================================
// SERRA RESIDENCIAL — app.js
// Pantalla de carga inicial. Se solapa con la carga real de
// intro.mp4 (no es una barra falsa desconectada de la página: se
// cierra en cuanto el vídeo puede reproducirse sin cortes, con un
// tope de seguridad para no dejar a nadie atrapado en conexiones
// lentas).
// =================================================================
const loadingScreen  = document.getElementById('loading-screen');
const loadingPercent = document.getElementById('loading-percent');

let loadingPct = 0;
const loadingInterval = setInterval(() => {
  loadingPct = Math.min(loadingPct + Math.random() * 16 + 6, 92);
  loadingPercent.textContent = Math.round(loadingPct) + '%';
}, 180);

function finishLoading() {
  clearInterval(loadingInterval);
  loadingPercent.textContent = '100%';
  setTimeout(() => loadingScreen.classList.add('hidden'), 220);
}

// -----------------------------------------------------------------
// VUELTA DESDE EL TOUR 360
// -----------------------------------------------------------------
// El botón "Viviendas" del showroom vuelve con ?vista=edificio. Sin
// esto se caía en la secuencia completa otra vez (carga, vídeo, botón
// Ingresar, descenso, guía...) solo por volver de una vivienda, que no
// tiene ningún sentido: se entra directo al edificio interactivo.
//
// Va aquí, en el último script, porque necesita cosas definidas en
// utils.js, intro-sequence.js y onboarding.js.
function entrarDirectoAlEdificio() {
  finishLoading();
  introScreen.classList.add('hidden');

  // Ninguno de los vídeos se va a usar: se liberan para no gastar
  // datos ni memoria descargándolos de fondo.
  [introVideo, descensoVideo].forEach((v) => {
    v.pause();
    v.removeAttribute('src');
    v.load();
  });

  // La guía de llegada ya no es "primera vez": si no, al abrirla desde
  // el botón "?" y cerrarla, encadenaría con el vídeo de frente, que
  // es lo que hace en la primera visita.
  onboardingFirstRun = false;

  // En móvil sigue haciendo falta pasar por la puerta de rotación.
  if (isMobileDevice()) armRotationGate();
  else revealFrenteInteractive();

  // La URL se limpia: así al recargar o al compartir el enlace se ve
  // la experiencia completa desde el principio.
  history.replaceState(null, '', location.pathname);
}

if (new URLSearchParams(location.search).get('vista') === 'edificio') {
  entrarDirectoAlEdificio();
} else if (introVideo.readyState >= 3) {
  finishLoading();
} else {
  introVideo.addEventListener('canplaythrough', finishLoading, { once: true });
  // Red de seguridad: conexión lenta no debe atrapar al usuario aquí.
  setTimeout(finishLoading, 4000);
}
