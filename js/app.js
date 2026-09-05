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

if (introVideo.readyState >= 3) {
  finishLoading();
} else {
  introVideo.addEventListener('canplaythrough', finishLoading, { once: true });
  // Red de seguridad: conexión lenta no debe atrapar al usuario aquí.
  setTimeout(finishLoading, 4000);
}
