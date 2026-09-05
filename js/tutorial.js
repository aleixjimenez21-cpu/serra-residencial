// =================================================================
// SERRA RESIDENCIAL — tutorial.js
// Tutorial interactivo estilo videojuego SOBRE la interfaz real (no
// una pantalla aparte). Cuando existe una acción real equivalente
// (pasar el cursor por una planta, hacer clic, pasar el cursor por
// una vivienda) el paso detecta esa acción -- escucha los mismos
// eventos que ya dispara building.js, no duplica su lógica ni simula
// clics -- y confirma con un check; el resto de pasos son
// informativos. En ningún caso avanza solo: siempre hace falta un
// clic del usuario (Continuar / Entendido / su propio botón).
//
// El fondo se atenúa de forma puramente VISUAL: el overlay y el
// spotlight son pointer-events:none siempre, así que un paso que
// pide "haz clic en la planta" nunca bloquea ese clic real -- solo
// la tarjeta y el botón "Saltar" son clicables.
//
// Depende de utils.js (isMobileDevice), building.js (fachadaWrap,
// zonas), nav-shell.js (appSidebar), ai-concierge.js
// (openAIConcierge) -- todos cargados antes.
// =================================================================
const TUTORIAL_STORAGE_KEY = 'serra_tutorial_completed';

const tutorialOverlay   = document.getElementById('tutorial-overlay');
const tutorialSpotlight = document.getElementById('tutorial-spotlight');
const tutorialSkipBtn   = document.getElementById('tutorial-skip');
const tutorialCard      = document.getElementById('tutorial-card');
const sidebarRestartBtn = document.getElementById('sidebar-restart-tutorial');

function tutorialAlreadyDone() {
  try { return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true'; } catch (e) { return false; }
}
function markTutorialDone() {
  try { localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true'); } catch (e) { /* localStorage no disponible */ }
}

// Consola (desarrollo): SERRA_TUTORIAL.reset() vuelve a activar el
// arranque automático sin tocar el resto de localStorage a mano.
window.SERRA_TUTORIAL = {
  reset() { try { localStorage.removeItem(TUTORIAL_STORAGE_KEY); } catch (e) {} },
  restart: () => restartTutorial(),
};

// -----------------------------------------------------------------
// PASOS — configuración declarativa. Cada paso: título + una frase
// corta, el elemento real a destacar, y cómo avanza -- nunca solo.
// Los pasos con `event` detectan la acción real (hover/clic sobre el
// edificio) y muestran "Continuar" tras confirmarla; el resto pide
// pulsar "Entendido" (`advance: 'manual'`) o sus propios botones.
// -----------------------------------------------------------------
// Tres pasos, no ocho: enseñar lo justo para que el edificio deje de
// ser una foto y el resto se descubra solo. Los pasos de acción avanzan
// en cuanto el usuario hace lo que se le pide -- no se le pide además
// que pulse "Continuar" para algo que acaba de hacer.
const TUTORIAL_STEPS = [
  {
    id: 'select-floor',
    title: 'EXPLORA EL EDIFICIO',
    text: 'Haz clic en cualquier planta.',
    mobileText: 'Toca cualquier planta.',
    getTarget: () => document.querySelector('.planta-zone[data-planta="p2"]'),
    event: 'serra:floor-select',
    position: 'right',
    postDelay: 400, // deja terminar el "pop out" antes de avanzar
  },
  {
    id: 'pick-unit',
    title: 'ELIGE UNA VIVIENDA',
    text: 'Superficie, precio y disponibilidad de cada una.',
    mobileText: 'Toca una vivienda para ver sus datos.',
    getTarget: () => document.querySelector('.planta-zone.popped .unit-slice:not(.unit-slice--entrada)'),
    event: 'serra:unit-hover',
    mobileEvent: 'serra:unit-select',
    position: 'right',
  },
  {
    id: 'menu',
    title: 'TODO LO DEMÁS, AQUÍ',
    text: 'Desde el menú lateral llegas al resto de la promoción.',
    hint: ['Listado y comparador de viviendas', 'Planos, calidades y financiación', 'Asistente para resolver dudas'],
    getTarget: () => document.querySelector('[data-tutorial="sidebar"]'),
    advance: 'manual',
    position: 'right',
    onEnter: () => appSidebar.classList.add('expanded'),
    onExit: () => appSidebar.classList.remove('expanded'),
  },
];

// -----------------------------------------------------------------
// ESTADO + LIMPIEZA ENTRE PASOS
// -----------------------------------------------------------------
let tutorialSteps = [];
let tutorialIndex = -1;
let currentStepOnExit = null;
let tutorialEventCleanup = null;
let tutorialConfirmDelayId = null;
let tutorialResizeHandler = null;

function clearStepRuntime() {
  if (tutorialEventCleanup) { tutorialEventCleanup(); tutorialEventCleanup = null; }
  if (tutorialConfirmDelayId) { clearTimeout(tutorialConfirmDelayId); tutorialConfirmDelayId = null; }
  if (tutorialResizeHandler) { window.removeEventListener('resize', tutorialResizeHandler); tutorialResizeHandler = null; }
  document.querySelectorAll('.tutorial-target-pulse').forEach((el) => el.classList.remove('tutorial-target-pulse'));
  if (currentStepOnExit) { currentStepOnExit(); currentStepOnExit = null; }
}

// -----------------------------------------------------------------
// SPOTLIGHT — sigue el boundingClientRect real del elemento (DOM o
// franja del edificio, da igual): nunca coordenadas fijas de pantalla,
// así que funciona igual en cualquier resolución.
// -----------------------------------------------------------------
function showSpotlightOn(el) {
  tutorialSpotlight.classList.remove('full');
  const r = el.getBoundingClientRect();
  const pad = 12;
  tutorialSpotlight.style.left = (r.left - pad) + 'px';
  tutorialSpotlight.style.top = (r.top - pad) + 'px';
  tutorialSpotlight.style.width = (r.width + pad * 2) + 'px';
  tutorialSpotlight.style.height = (r.height + pad * 2) + 'px';
  const radius = parseFloat(getComputedStyle(el).borderRadius) || 8;
  tutorialSpotlight.style.borderRadius = Math.max(radius + pad * 0.4, 8) + 'px';
  tutorialSpotlight.classList.add('visible');
}
function hideSpotlightHole() {
  tutorialSpotlight.classList.remove('visible', 'full');
}
function showSpotlightFull() {
  tutorialSpotlight.classList.remove('visible');
  tutorialSpotlight.classList.add('full');
}

// -----------------------------------------------------------------
// POSICIÓN DE LA TARJETA — junto al elemento en escritorio; en móvil
// la fija el CSS (.tutorial-card--sheet, bottom-sheet).
// -----------------------------------------------------------------
function positionCardCenter() {
  tutorialCard.style.left = '';
  tutorialCard.style.top = '';
}
function positionCardNear(target, position, mobile) {
  if (mobile || !target) return;
  const r = target.getBoundingClientRect();
  const gap = 18;
  const cw = tutorialCard.offsetWidth;
  const ch = tutorialCard.offsetHeight;
  let left, top;
  if (position === 'right') { left = r.right + gap; top = r.top + r.height / 2 - ch / 2; }
  else if (position === 'left') { left = r.left - gap - cw; top = r.top + r.height / 2 - ch / 2; }
  else if (position === 'top') { left = r.left + r.width / 2 - cw / 2; top = r.top - gap - ch; }
  else { left = r.left + r.width / 2 - cw / 2; top = r.bottom + gap; }
  left = Math.min(Math.max(16, left), window.innerWidth - cw - 16);
  top = Math.min(Math.max(16, top), window.innerHeight - ch - 16);
  tutorialCard.style.left = left + 'px';
  tutorialCard.style.top = top + 'px';
}

// Crossfade de contenido (mismo patrón que onboarding.js): atenúa,
// cambia el HTML, vuelve a mostrar -- nunca un salto seco entre pasos.
function renderCard(innerHTML, opts) {
  const { center, sheet } = opts || {};
  tutorialCard.classList.add('tutorial-card--fade');
  setTimeout(() => {
    tutorialCard.className = 'tutorial-card tutorial-card--fade' + (center ? ' tutorial-card--center' : '') + (sheet ? ' tutorial-card--sheet' : '');
    tutorialCard.innerHTML = innerHTML;
    requestAnimationFrame(() => requestAnimationFrame(() => tutorialCard.classList.remove('tutorial-card--fade')));
  }, 150);
}

// -----------------------------------------------------------------
// UN PASO
// -----------------------------------------------------------------
function tutorialShowStep(step) {
  if (step.onEnter) step.onEnter();
  currentStepOnExit = step.onExit || null;

  const mobile = isMobileDevice();
  const target = step.getTarget ? step.getTarget() : null;
  const text = (mobile && step.mobileText) ? step.mobileText : step.text;

  if (target) { showSpotlightOn(target); target.classList.add('tutorial-target-pulse'); }
  else { showSpotlightFull(); }

  const dots = tutorialSteps.map((_, i) => `<span class="${i === tutorialIndex ? 'active' : ''}"></span>`).join('');
  const actions = typeof step.actions === 'function' ? step.actions() : step.actions;

  let actionsHTML = '';
  if (actions) {
    actionsHTML = actions.map((a, i) => `<button type="button" class="tutorial-btn${a.primary ? ' tutorial-btn--primary' : ''}" data-idx="${i}">${a.label}</button>`).join('');
  } else if (step.advance === 'manual') {
    actionsHTML = `<button type="button" class="tutorial-btn tutorial-btn--primary" data-understood="1">Entendido</button>`;
  }
  const hintHTML = step.hint ? `<ul class="tutorial-hint">${step.hint.map((h) => `<li>${h}</li>`).join('')}</ul>` : '';

  const html = `
    <div class="tutorial-progress">${dots}</div>
    <h3 class="tutorial-title">${step.title}</h3>
    <p class="tutorial-text">${text}</p>
    ${hintHTML}
    <div class="tutorial-actions">${actionsHTML}</div>
  `;

  renderCard(html, { sheet: mobile });

  setTimeout(() => {
    if (actions) {
      actions.forEach((a, i) => tutorialCard.querySelector(`[data-idx="${i}"]`)?.addEventListener('click', a.onClick));
    }
    tutorialCard.querySelector('[data-understood]')?.addEventListener('click', () => goToNextStep());
    positionCardNear(target, step.position, mobile);
  }, 170);

  tutorialResizeHandler = () => {
    if (target) showSpotlightOn(target);
    positionCardNear(target, step.position, mobile);
  };
  window.addEventListener('resize', tutorialResizeHandler);

  const evtName = (mobile && step.mobileEvent !== undefined) ? step.mobileEvent : step.event;
  if (evtName) {
    const handler = () => showConfirmThenAdvance(step.postDelay || 0);
    tutorialEventCleanup = () => document.removeEventListener(evtName, handler);
    document.addEventListener(evtName, handler);
  }
}

// Confirmación breve al completar la acción pedida y a seguir. Aquí NO
// se pide un clic extra: el usuario acaba de hacer lo que se le pedía,
// obligarle a pulsar "Continuar" encima solo estorba. Los pasos que son
// solo texto sí esperan a que pulse, para no quitárselo de delante
// antes de leerlo.
function showConfirmThenAdvance(delay) {
  if (tutorialEventCleanup) { tutorialEventCleanup(); tutorialEventCleanup = null; }
  tutorialConfirmDelayId = setTimeout(() => {
    renderCard(`<div class="tutorial-confirm">✓</div>`, { sheet: isMobileDevice() });
    tutorialConfirmDelayId = setTimeout(() => goToNextStep(), 700);
  }, delay);
}

function goToNextStep() {
  clearStepRuntime();
  tutorialIndex += 1;
  if (tutorialIndex >= tutorialSteps.length) { showFinal(); return; }
  tutorialShowStep(tutorialSteps[tutorialIndex]);
}

// -----------------------------------------------------------------
// BIENVENIDA / CIERRE — sin elemento que señalar: oscurecimiento
// uniforme y muy sutil, tarjeta centrada.
// -----------------------------------------------------------------
function showWelcome() {
  clearStepRuntime();
  tutorialOverlay.classList.remove('hidden');
  tutorialOverlay.setAttribute('aria-hidden', 'false');
  showSpotlightFull();
  const html = `
    <span class="tutorial-eyebrow">BIENVENIDO A SERRA</span>
    <p class="tutorial-text">Explora el edificio de forma interactiva y encuentra la vivienda que mejor encaja contigo.</p>
    <div class="tutorial-actions">
      <button type="button" class="tutorial-btn tutorial-btn--primary" data-start="1">Iniciar visita</button>
      <button type="button" class="tutorial-btn" data-skip="1">Saltar</button>
    </div>
  `;
  renderCard(html, { center: true });
  setTimeout(() => {
    tutorialCard.querySelector('[data-start]')?.addEventListener('click', beginSteps);
    tutorialCard.querySelector('[data-skip]')?.addEventListener('click', () => endTutorial(true));
    positionCardCenter();
  }, 170);
}

function beginSteps() {
  tutorialSteps = TUTORIAL_STEPS.filter((s) => !(isMobileDevice() && s.skipOnMobile));
  tutorialIndex = -1;
  goToNextStep();
}

function showFinal() {
  clearStepRuntime();
  showSpotlightFull();
  const html = `
    <span class="tutorial-eyebrow">TODO LISTO</span>
    <p class="tutorial-text">Ya puedes explorar Serra Residencial a tu manera.</p>
    <p class="tutorial-note">Siempre puedes repetir esta visita desde el menú lateral.</p>
    <div class="tutorial-actions">
      <button type="button" class="tutorial-btn tutorial-btn--primary" data-finish="1">Empezar a explorar</button>
    </div>
  `;
  renderCard(html, { center: true });
  setTimeout(() => {
    tutorialCard.querySelector('[data-finish]')?.addEventListener('click', () => endTutorial(true));
    positionCardCenter();
  }, 170);
}

function endTutorial(persist) {
  clearStepRuntime();
  hideSpotlightHole();
  tutorialOverlay.classList.add('hidden');
  tutorialOverlay.setAttribute('aria-hidden', 'true');
  if (persist) markTutorialDone();
}

// -----------------------------------------------------------------
// ARRANQUE AUTOMÁTICO Y REINICIO MANUAL
// -----------------------------------------------------------------
function autoStartTutorial() {
  if (tutorialAlreadyDone()) return;
  showWelcome();
}

function restartTutorial() {
  endTutorial(false);
  showWelcome();
}

tutorialSkipBtn.addEventListener('click', () => endTutorial(true));

sidebarRestartBtn?.addEventListener('click', () => {
  appSidebar.classList.remove('expanded');
  restartTutorial();
});

// El hint mínimo ("Explora el edificio / Selecciona una planta") es
// además el disparador manual, como pedía la versión anterior.
document.getElementById('explore-hint')?.addEventListener('click', restartTutorial);
