// =================================================================
// SERRA RESIDENCIAL — contact-modal.js
// Modal corto de contacto (no formulario largo). Si el usuario venía
// de una vivienda concreta, se preselecciona sola. Sin backend: el
// envío es un placeholder que confirma visualmente el envío -- el
// punto de conexión real está marcado abajo.
// =================================================================
const contactModal        = document.getElementById('contact-modal');
const contactModalBackdrop = document.getElementById('contact-modal-backdrop');
const contactForm          = document.getElementById('contact-form');
const contactUnitSelect    = document.getElementById('contact-unit');
const contactSuccess       = document.getElementById('contact-success');
const contactClose         = document.getElementById('contact-modal-close');

// Rellena el <select> una sola vez con las 15 viviendas reales.
contactUnitSelect.innerHTML = `
  <option value="">Sin especificar</option>
  ${ALL_UNITS.map((u) => `<option value="${u.id}">${plantaBadge(u.planta)} · ${u.letra} — ${u.precio}</option>`).join('')}
`;

function openContactModal(unitId) {
  if (typeof closeDrawer === 'function') closeDrawer();
  if (typeof closePanel === 'function') closePanel();
  contactForm.reset();
  contactSuccess.classList.add('hidden');
  contactForm.classList.remove('hidden');
  contactUnitSelect.value = unitId || currentViewedUnitId || '';
  contactModal.classList.add('open');
  contactModalBackdrop.classList.add('open');
  contactModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeContactModal() {
  contactModal.classList.remove('open');
  contactModalBackdrop.classList.remove('open');
  contactModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

contactClose.addEventListener('click', closeContactModal);
contactModalBackdrop.addEventListener('click', closeContactModal);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeContactModal(); });

function submitContact(successText) {
  // TODO: sustituir por el envío real (fetch a backend / CRM / email).
  // De momento confirma visualmente para no bloquear la demo.
  contactForm.classList.add('hidden');
  contactSuccess.textContent = successText;
  contactSuccess.classList.remove('hidden');
}

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  submitContact('Gracias — te contactaremos en breve.');
});

document.getElementById('contact-call-btn').addEventListener('click', () => {
  submitContact('Gracias — te llamaremos en breve.');
});
