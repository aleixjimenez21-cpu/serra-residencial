// =================================================================
// SERRA RESIDENCIAL — unit-panel.js
// Panel contextual único, compacto y flotante (#context-panel): nada
// que mostrar hasta que hay una planta o vivienda seleccionada. Tres
// estados posibles: resumen de planta, ficha de vivienda, ficha del
// rooftop -- el mismo panel se transforma entre ellos.
// =================================================================
const contextPanel      = document.getElementById('context-panel');
const contextPanelBody  = document.getElementById('context-panel-body');
const contextPanelClose = document.getElementById('context-panel-close');

// Vivienda que el usuario está mirando ahora mismo (si ha entrado a
// una concreta, no solo al resumen de planta) -- calculator.js y
// contact-modal.js lo usan para autorellenar precio/vivienda.
let currentViewedUnitId = null;

// La ficha vive abajo en el centro, que es donde mejor queda. El
// problema es la planta baja: sus crujías caen justo ahí y quedaban
// debajo de la tarjeta, sin poder pulsarse. En vez de mover el
// edificio, se mueve la ficha: si en su sitio taparía alguna vivienda
// de la planta abierta, salta arriba. Es lo mismo que hace cualquier
// popover cuando no cabe: cambiar de lado.
function showContextPanel() {
  contextPanel.classList.add('open');
  contextPanel.setAttribute('aria-hidden', 'false');
}

// Solo oculta el panel -- no toca el estado de la planta desplegada
// en el edificio (la usa collapsePopped en building.js para no
// recursar sobre closePanel).
function hideContextPanel() {
  contextPanel.classList.remove('open');
  contextPanel.setAttribute('aria-hidden', 'true');
}

// Fila de dato: etiqueta a la izquierda, valor a la derecha. Es lo que
// hace que la ficha se lea de un vistazo en vez de como un párrafo.
function filaDato(etiqueta, valor) {
  return `<div class="ctx-fila"><span>${etiqueta}</span><b>${valor}</b></div>`;
}

function openFloorSummary(planta) {
  currentViewedUnitId = null;
  const disponibles = planta.units.filter((u) => u.estado === 'disponible').length;
  contextPanelBody.innerHTML = `
    <p class="ctx-titulo">${planta.label}</p>
    <div class="ctx-datos">
      ${filaDato('Viviendas', planta.units.length)}
      ${filaDato('Disponibles', disponibles)}
    </div>
    <p class="ctx-pie">Elige una vivienda sobre el edificio para ver su ficha.</p>
  `;
  showContextPanel();
}

// letraSeleccionada ausente -> resumen de planta (nivel 2). Con letra
// -> ficha compacta de la vivienda (nivel 3), con precio y acciones.
function openPanel(planta, letraSeleccionada) {
  if (!letraSeleccionada) { openFloorSummary(planta); return; }

  const u = planta.units.find((x) => x.letra === letraSeleccionada);
  currentViewedUnitId = `${planta.id}-${u.letra}`;
  const compared = typeof isInCompare === 'function' && isInCompare(currentViewedUnitId);

  contextPanelBody.innerHTML = `
    <div class="ctx-cabecera">
      <p class="ctx-titulo">Vivienda ${plantaBadge(planta)} ${u.letra}</p>
      <span class="ctx-estado ctx-estado--${u.estado}">${ESTADO_LABEL[u.estado]}</span>
    </div>
    <p class="ctx-price">${u.precio}</p>
    <button type="button" class="ctx-cta" id="ctx-request">Solicitar información</button>
    <div class="ctx-datos">
      ${filaDato('Superficie total', `${u.m2} m²`)}
      ${filaDato('Dormitorios', u.dorm)}
      ${filaDato('Baños', u.banos)}
      ${filaDato('Terraza', `${u.terraza_m2} m²`)}
      ${filaDato('Orientación', u.orientacion)}
      ${filaDato('Planta', planta.label)}
    </div>
    <div class="ctx-actions">
      <button type="button" class="ctx-btn ctx-btn--primary" id="ctx-360">Tour 360°</button>
      <button type="button" class="ctx-btn" id="ctx-compare">${compared ? 'Quitar' : 'Comparar'}</button>
    </div>
  `;
  showContextPanel();

  // El interior es un tour aparte (web/showroom/). Necesita http://,
  // no funciona abriendo el archivo con doble clic -- ver showroom/README.md.
  contextPanelBody.querySelector('#ctx-360').addEventListener('click', () => {
    window.location.href = 'showroom/index.html?vivienda=demo';
  });
  contextPanelBody.querySelector('#ctx-request').addEventListener('click', () => {
    if (typeof openContactModal === 'function') openContactModal(currentViewedUnitId);
  });
  contextPanelBody.querySelector('#ctx-compare').addEventListener('click', (e) => {
    if (typeof toggleCompare !== 'function') return;
    toggleCompare(currentViewedUnitId);
    e.currentTarget.textContent = isInCompare(currentViewedUnitId) ? '− Quitar de comparar' : '+ Comparar';
  });
}

function estadoDotHTML(estado) {
  return `<span class="estado-dot estado-dot--${estado}" title="${ESTADO_LABEL[estado]}"></span>`;
}

function openRooftopPanel() {
  currentViewedUnitId = null;
  contextPanelBody.innerHTML = `
    <div class="ctx-cabecera">
      <p class="ctx-titulo">${ROOFTOP.label}</p>
      <span class="ctx-estado ctx-estado--comun">Zona común</span>
    </div>
    <ul class="ctx-amenities">
      ${ROOFTOP.amenities.map((a) => `<li>${a}</li>`).join('')}
    </ul>
  `;
  showContextPanel();
}

function closePanel() {
  hideContextPanel();
  if (typeof collapsePopped === 'function') collapsePopped();
}

contextPanelClose.addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePanel();
});
