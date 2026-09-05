// =================================================================
// SERRA RESIDENCIAL — intro-sequence.js
// Secuencia completa: intro -> vídeo 1 (descenso/vertical) -> fondo
// fachada.webp + guía (con el brillo del edificio en el 1er popup) ->
// vídeo 2 (frente-video) -> fachada de FRENTE interactiva (frente.webp).
// Depende de utils.js (isMobileDevice/isPortrait), cargado antes.
// =================================================================
const introScreen        = document.getElementById('intro-screen');
const introVideo         = document.getElementById('intro-video');
const btnIngresar        = document.getElementById('btn-ingresar');
const descensoScreen     = document.getElementById('descenso-screen');
const descensoVideo      = document.getElementById('descenso-video');
const btnSkipIntro       = document.getElementById('btn-skip-intro');
const fachadaFade        = document.getElementById('fachada-fade');
const fachadaFadeImg     = document.getElementById('fachada-fade-img');
const frenteVideoScreen  = document.getElementById('frente-video-screen');
const frenteVideo        = document.getElementById('frente-video');
const btnSkipFrente      = document.getElementById('btn-skip-frente');
const siteNav            = document.getElementById('site-nav');
const mainContent        = document.getElementById('main-content');

// En PC: descenso.mp4 (horizontal), tal cual estaba.
// En móvil: vertical.mp4 -- la intro (paso 1) es la misma en los dos.
// Se decide ya, al cargar la página, para que empiece a precargar
// antes de que el usuario llegue a pulsar "Ingresar".
descensoVideo.src = isMobileDevice() ? 'vertical.mp4' : 'descenso.mp4';

// El descenso va en cámara rápida: se calcula la velocidad a partir de
// la duración real del archivo, no con un valor fijo, para que dure lo
// mismo en PC (descenso.mp4, ~5s) que en móvil (vertical.mp4, ~3,3s)
// y siga cuadrando si algún día se sustituye el vídeo.
const DESCENSO_SEGUNDOS = 2.5;

function ajustarVelocidadDescenso() {
  const d = descensoVideo.duration;
  if (!d || !isFinite(d)) return;
  descensoVideo.playbackRate = Math.min(16, Math.max(1, d / DESCENSO_SEGUNDOS));
}
descensoVideo.addEventListener('loadedmetadata', ajustarVelocidadDescenso);

btnIngresar.addEventListener('click', startDescenso, { once: true });

// "Omitir intro" del vídeo 1: pasa directo al fondo fachada.webp + guía.
btnSkipIntro.addEventListener('click', () => {
  descensoVideo.pause();
  revealFachadaBackdrop();
});

function startDescenso() {
  btnIngresar.classList.add('fading');
  introScreen.classList.add('fading-out');

  const play = () => {
    descensoScreen.classList.remove('hidden');
    requestAnimationFrame(() => descensoScreen.classList.add('visible'));
    descensoVideo.currentTime = 0;
    ajustarVelocidadDescenso(); // por si el metadata llegó antes del listener
    const p = descensoVideo.play();
    // Si el navegador bloquea el autoplay por algún motivo, no nos
    // quedamos colgados: pasamos directo al siguiente paso.
    if (p && p.catch) p.catch(() => revealFachadaBackdrop());
    setTimeout(() => introScreen.classList.add('hidden'), 900);
  };

  // Ya se ha estado precargando desde que se fijó el src (arriba) y el
  // preload="auto" del <video>; si aún no tiene suficiente buffer,
  // esperamos a canplaythrough en vez de arrancar con tirones.
  if (descensoVideo.readyState >= 3) {
    play();
  } else {
    descensoVideo.addEventListener('canplaythrough', play, { once: true });
  }
}

descensoVideo.addEventListener('ended', () => {
  // Al pausar sin hacer seek, el vídeo se queda mostrando su último
  // fotograma -> es sobre ese fotograma congelado donde funde la foto.
  descensoVideo.pause();
  revealFachadaBackdrop();
});

// Paso A: fundido del vídeo 1 a fachada.webp (aérea), que se queda de
// fondo FIJO detrás de los popups de la guía (no es la vista
// interactiva final, esa llega después del vídeo 2).
function revealFachadaBackdrop() {
  fachadaFadeImg.src = 'fachada.webp';
  fachadaFade.classList.remove('hidden');
  requestAnimationFrame(() => fachadaFade.classList.add('visible'));

  setTimeout(() => {
    descensoScreen.classList.add('hidden');
    siteNav.classList.remove('hidden');

    // Liberamos el vídeo 1 (ya reproducido) y empezamos a precargar el
    // vídeo 2 ya, mientras el usuario lee los popups.
    introVideo.pause();
    introVideo.removeAttribute('src');
    introVideo.load();
    descensoVideo.removeAttribute('src');
    descensoVideo.load();
    frenteVideo.load();

    startOnboarding();
  }, 1400); // debe coincidir con la transición de #fachada-fade en style.css
}

// Paso B: tras cerrar la guía, vídeo 2 (frente-video), con su propio
// "Omitir intro".
function startFrenteVideo() {
  fachadaFade.classList.add('hidden');
  frenteVideoScreen.classList.remove('hidden');
  requestAnimationFrame(() => frenteVideoScreen.classList.add('visible'));
  frenteVideo.currentTime = 0;
  const p = frenteVideo.play();
  if (p && p.catch) p.catch(() => revealFrenteInteractive());
}

btnSkipFrente.addEventListener('click', () => {
  frenteVideo.pause();
  if (isMobileDevice()) {
    armRotationGate();
  } else {
    revealFrenteInteractive();
  }
});

frenteVideo.addEventListener('ended', () => {
  frenteVideo.pause();
  if (isMobileDevice()) {
    armRotationGate();
  } else {
    revealFrenteInteractive();
  }
});

// Paso C: fundido del vídeo 2 a frente.webp -- ESTA es la vista
// interactiva final, con las plantas seleccionables.
function revealFrenteInteractive() {
  fachadaFadeImg.src = 'frente.webp';
  fachadaFade.classList.remove('hidden');
  requestAnimationFrame(() => fachadaFade.classList.add('visible'));

  setTimeout(() => {
    frenteVideoScreen.classList.add('hidden');
    mainContent.classList.remove('hidden');
    layoutFachada(); // el contenedor medía 0 mientras #main-content estaba oculto
    requestAnimationFrame(() => mainContent.classList.add('visible'));

    frenteVideo.removeAttribute('src');
    frenteVideo.load();

    setTimeout(() => fachadaFade.classList.add('hidden'), 100);
    helpBtn.classList.remove('hidden');
    if (typeof onAppReady === 'function') onAppReady();
    // El tutorial interactivo espera a que el edificio y la interfaz
    // ya estén quietos del todo antes de aparecer (nunca mientras algo
    // se sigue moviendo en pantalla).
    if (typeof autoStartTutorial === 'function') setTimeout(autoStartTutorial, 700);
  }, 1400);
}

// -----------------------------------------------------------------
// ROTA TU DISPOSITIVO
// -----------------------------------------------------------------
// Solo en móvil. En PC no aparece nunca (aunque la ventana se deje
// estrecha y alta): se distingue "móvil" por puntero táctil/sin
// hover, no solo por el ancho.
//
// La "puerta" (rotateGateActive) es lo que decide si el aviso puede
// llegar a mostrarse: solo se arma al terminar el VÍDEO 2 (frente-
// video) en móvil (armRotationGate). Antes de eso -- durante la intro
// en bucle, el vídeo vertical, o mientras se leen los popups -- el
// usuario puede estar perfectamente en vertical sin que salte nada.
// En cuanto gira a horizontal con la puerta armada, se revela la
// fachada automáticamente.
const rotateOverlay = document.getElementById('rotate-overlay');
let rotateGateActive = false;
let awaitingRotationReveal = false;

function updateRotateOverlay() {
  const show = rotateGateActive && isMobileDevice() && isPortrait();
  rotateOverlay.classList.toggle('hidden', !show);
}

// Se llama al terminar (u omitir) el VÍDEO 2 (frente-video) en móvil
// -- justo antes de la vista interactiva final, que necesita
// horizontal. Si ya está en horizontal (el usuario giró mientras veía
// el vídeo), pasa directo sin mostrar nada.
function armRotationGate() {
  rotateGateActive = true;
  updateRotateOverlay();
  if (isPortrait()) {
    awaitingRotationReveal = true;
  } else {
    rotateGateActive = false;
    revealFrenteInteractive();
  }
}

function handleOrientationChange() {
  updateRotateOverlay();
  if (awaitingRotationReveal && !isPortrait()) {
    awaitingRotationReveal = false;
    rotateGateActive = false;
    updateRotateOverlay();
    revealFrenteInteractive();
  }
}

updateRotateOverlay();
window.addEventListener('resize', handleOrientationChange);
window.addEventListener('orientationchange', handleOrientationChange);
// Refuerzo: algunos navegadores no disparan 'resize' de forma fiable
// al rotar (barras dinámicas, etc.) -- matchMedia sí, siempre.
const portraitQuery = window.matchMedia('(orientation: portrait)');
if (portraitQuery.addEventListener) {
  portraitQuery.addEventListener('change', handleOrientationChange);
}
