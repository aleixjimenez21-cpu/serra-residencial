// =================================================================
// SERRA RESIDENCIAL — guided-tour.js
// Visita guiada corta y opcional (botón "Iniciar visita" bajo el
// titular). Reutiliza el look de las tarjetas de onboarding pero es
// un componente propio: cerrarla no encadena nada (a diferencia de
// la guía de llegada), se puede saltar en cualquier momento.
// =================================================================
const TOUR_STEPS = [
  { text: 'Serra Residencial: 15 viviendas reales, en planta baja y las plantas 1 a 3.', highlight: null },
  { text: 'Toca cualquier planta del edificio para ver sus viviendas.', highlight: null, action: () => { if (typeof hintSweep === 'function') hintSweep(); } },
  { text: 'Cada vivienda tiene su ficha: superficie, precio, terraza y disponibilidad.', highlight: 'viviendas' },
  { text: 'Compara hasta 3 viviendas a la vez, lado a lado.', highlight: 'comparador' },
  { text: 'Y si tienes dudas, pregúntale al Asistente Serra.', highlight: 'asistente' },
];

const guidedTour     = document.getElementById('guided-tour');
const tourCard       = guidedTour.querySelector('.onboarding-card');
const tourText       = document.getElementById('tour-text');
const tourDots       = document.getElementById('tour-dots');
const tourNext       = document.getElementById('tour-next');
const tourSkip       = document.getElementById('tour-skip');
const tourStartBtn   = document.getElementById('explore-hint');

TOUR_STEPS.forEach(() => tourDots.appendChild(document.createElement('span')));

let tourStep = 0;

function renderTourStep() {
  const step = TOUR_STEPS[tourStep];
  tourText.textContent = step.text;
  [...tourDots.children].forEach((dot, i) => dot.classList.toggle('active', i === tourStep));
  tourNext.textContent = tourStep === TOUR_STEPS.length - 1 ? 'Terminar' : 'Siguiente';
  appSidebar.querySelectorAll('.sidebar-item').forEach((btn) => {
    btn.classList.toggle('tour-highlight', step.highlight && btn.dataset.section === step.highlight);
  });
  if (step.action) step.action();
}

function startTour() {
  tourStep = 0;
  renderTourStep();
  guidedTour.classList.remove('hidden');
}

function closeTour() {
  guidedTour.classList.add('hidden');
  appSidebar.querySelectorAll('.sidebar-item').forEach((btn) => btn.classList.remove('tour-highlight'));
}

tourNext.addEventListener('click', () => {
  if (tourStep >= TOUR_STEPS.length - 1) { closeTour(); return; }
  tourCard.classList.add('onboarding-fade');
  setTimeout(() => { tourStep += 1; renderTourStep(); tourCard.classList.remove('onboarding-fade'); }, 200);
});
tourSkip.addEventListener('click', closeTour);
tourStartBtn.addEventListener('click', startTour);
