// =================================================================
// SERRA RESIDENCIAL — onboarding.js
// Tarjetas tipo tutorial de videojuego en vez de texto fijo en la
// página. Se lanza sola la primera vez que se llega a la fachada;
// después queda disponible desde el botón "?". El texto y el icono
// hacen un crossfade entre pasos en vez de saltar de golpe.
// =================================================================
const ICON_WELCOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-7h6v7"/></svg>';
const ICON_TAP     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 12V5a1.5 1.5 0 0 1 3 0v6"/><path d="M12 11V4a1.5 1.5 0 0 1 3 0v7"/><path d="M15 11.5V6a1.5 1.5 0 0 1 3 0v9c0 3.5-2.5 6-6 6h-1c-2.5 0-3.5-1-5-3l-2.7-4.2c-.5-.8.1-1.8 1-1.8.4 0 .8.2 1 .5L9 15"/></svg>';
const ICON_KEY      = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="15" r="3.2"/><path d="M10.3 12.7 18 5"/><path d="M15 8l2 2"/><path d="M17.5 5.5l2 2"/></svg>';

const ONBOARDING_STEPS = [
  { icon: ICON_WELCOME, text: 'Bienvenido a Serra Residencial. Este es el edificio real, planta a planta.' },
  { icon: ICON_TAP,     text: 'Toca una planta del edificio para desplegarla.' },
  { icon: ICON_KEY,     text: 'Elige la vivienda (A, B, C o D) que más te interese para ver sus detalles.' },
];

const onboarding      = document.getElementById('onboarding');
const onboardingCard  = onboarding.querySelector('.onboarding-card');
const onboardingIcon  = document.getElementById('onboarding-icon');
const onboardingText  = document.getElementById('onboarding-text');
const onboardingDots  = document.getElementById('onboarding-dots');
const onboardingNext  = document.getElementById('onboarding-next');
const onboardingSkip  = document.getElementById('onboarding-skip');
const helpBtn         = document.getElementById('help-btn');

ONBOARDING_STEPS.forEach(() => {
  const dot = document.createElement('span');
  onboardingDots.appendChild(dot);
});

let onboardingStep = 0;

function renderOnboardingStep() {
  const step = ONBOARDING_STEPS[onboardingStep];
  onboardingIcon.innerHTML = step.icon;
  onboardingText.textContent = step.text;
  [...onboardingDots.children].forEach((dot, i) => {
    dot.classList.toggle('active', i === onboardingStep);
  });
  onboardingNext.textContent = onboardingStep === ONBOARDING_STEPS.length - 1 ? 'Entendido' : 'Siguiente';
}

// Crossfade entre pasos: atenúa icono+texto, cambia el contenido, y
// vuelve a mostrarlo -> más "animado" que un salto seco.
function goToStep(next) {
  onboardingCard.classList.add('onboarding-fade');
  setTimeout(() => {
    onboardingStep = next;
    renderOnboardingStep();
    onboardingCard.classList.remove('onboarding-fade');
  }, 200);
}

let onboardingFirstRun = true;

function startOnboarding() {
  onboardingStep = 0;
  renderOnboardingStep();
  onboarding.classList.remove('hidden');
  helpBtn.classList.add('hidden');
  triggerBuildingGlowOnce();
}

// La 1ª vez (recién llegados, fondo fachada.webp) cerrar la guía
// continúa la secuencia hacia el vídeo de frente. Si se reabre más
// tarde desde el botón "?" (ya en la vista interactiva final), cerrar
// solo la oculta y hace el barrido de pista de siempre.
function closeOnboarding() {
  onboarding.classList.add('hidden');
  if (onboardingFirstRun) {
    onboardingFirstRun = false;
    startFrenteVideo();
  } else {
    helpBtn.classList.remove('hidden');
    hintSweep();
  }
}

onboardingNext.addEventListener('click', () => {
  if (onboardingStep >= ONBOARDING_STEPS.length - 1) {
    closeOnboarding();
  } else {
    goToStep(onboardingStep + 1);
  }
});
onboardingSkip.addEventListener('click', closeOnboarding);
helpBtn.addEventListener('click', startOnboarding);

// -----------------------------------------------------------------
// BARRIDO DE PISTA AMBIENTE — cada planta se ilumina un instante en
// cadena (sin texto) para dejar claro que todo el edificio es
// interactivo, estilo configurador 3D.
// -----------------------------------------------------------------
function hintSweep() {
  const zones = [...fachadaWrap.querySelectorAll('.planta-zone')];
  zones.forEach((zone, i) => {
    setTimeout(() => {
      zone.classList.add('hint-active');
      setTimeout(() => zone.classList.remove('hint-active'), 550);
    }, i * 320);
  });
}

// -----------------------------------------------------------------
// BRILLO DE BIENVENIDA — todo el edificio se ilumina una sola vez,
// sincronizado con el primer popup de la guía (no planta a planta,
// el edificio entero de golpe). Solo una vez en toda la sesión.
// -----------------------------------------------------------------
const buildingGlow = document.getElementById('building-glow');
let buildingGlowShown = false;

function triggerBuildingGlowOnce() {
  if (buildingGlowShown) return;
  buildingGlowShown = true;
  requestAnimationFrame(() => buildingGlow.classList.add('active'));
  setTimeout(() => {
    buildingGlow.classList.remove('active');
    buildingGlow.classList.add('fade-out');
  }, 1700);
}
