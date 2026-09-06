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
function colocarPanelSinTapar() {
  const crujias = [...document.querySelectorAll('.planta-zone.popped .unit-slice')];
  if (!crujias.length) { contextPanel.classList.remove('arriba'); return; }

  // Lo que decide si una vivienda se puede pulsar no es que la ficha
  // roce su rectángulo, sino que le tape el CENTRO, que es donde va el
  // dedo o el cursor. Con un margen de 6px para no dejarlo al filo.
  const tapadas = () => {
    const p = contextPanel.getBoundingClientRect();
    const m = 6;
    return crujias.filter((s) => {
      const r = s.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return cx > p.left - m && cx < p.right + m && cy > p.top - m && cy < p.bottom + m;
    }).length;
  };

  // Se prueban las dos posiciones y se elige la que tapa menos. Abajo
  // es la de siempre, así que gana en caso de empate.
  contextPanel.classList.remove('arriba');
  const abajo = tapadas();
  if (abajo === 0) return;

  contextPanel.classList.add('arriba');
  if (tapadas() >= abajo) contextPanel.classList.remove('arriba');
}

function showContextPanel() {
  contextPanel.classList.add('open');
  contextPanel.setAttribute('aria-hidden', 'false');
  colocarPanelSinTapar();
}

// Solo oculta el panel -- no toca el estado de la planta desplegada
// en el edificio (la usa collapsePopped en building.js para no
// recursar sobre closePanel).
function hideContextPanel() {
  contextPanel.classList.remove('open', 'arriba');
  contextPanel.setAttribute('aria-hidden', 'true');
}

// Al girar el móvil o redimensionar cambia qué tapa a qué.
window.addEventListener('resize', () => {
  if (contextPanel.classList.contains('open')) colocarPanelSinTapar();
});

function openFloorSummary(planta) {
  currentViewedUnitId = null;
  const disponibles = planta.units.filter((u) => u.estado === 'disponible').length;
  contextPanelBody.innerHTML = `
    <span class="ctx-eyebrow">${planta.label}</span>
    <p class="ctx-summary">${planta.units.length} vivienda${planta.units.length === 1 ? '' : 's'} · ${disponibles} disponible${disponibles === 1 ? '' : 's'}</p>
    <div class="ctx-actions">
      <button type="button" class="ctx-btn ctx-btn--primary" id="ctx-explore-floor">Explorar planta →</button>
    </div>
  `;
  showContextPanel();
  contextPanelBody.querySelector('#ctx-explore-floor').addEventListener('click', hideContextPanel);
}

// letraSeleccionada ausente -> resumen de planta (nivel 2). Con letra
// -> ficha compacta de la vivienda (nivel 3), con precio y acciones.
function openPanel(planta, letraSeleccionada) {
  if (!letraSeleccionada) { openFloorSummary(planta); return; }

  const u = planta.units.find((x) => x.letra === letraSeleccionada);
  currentViewedUnitId = `${planta.id}-${u.letra}`;
  const compared = typeof isInCompare === 'function' && isInCompare(currentViewedUnitId);

  contextPanelBody.innerHTML = `
    <span class="ctx-eyebrow">${plantaBadge(planta)} ${u.letra} ${estadoDotHTML(u.estado)}</span>
    <p class="ctx-specs">${u.tipologia} · ${u.m2} m²</p>
    <p class="ctx-specs-sub">Terraza ${u.terraza_m2} m² · Orientación ${u.orientacion}</p>
    <p class="ctx-price">${u.precio}</p>
    <div class="ctx-actions">
      <button type="button" class="ctx-btn ctx-btn--primary" id="ctx-360">Ver en 360°</button>
      <button type="button" class="ctx-btn" id="ctx-compare">${compared ? '− Quitar de comparar' : '+ Comparar'}</button>
      <button type="button" class="ctx-btn" id="ctx-request">Solicitar información</button>
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
    <span class="ctx-eyebrow">${ROOFTOP.label}</span>
    <p class="ctx-summary">Zona común, sin viviendas.</p>
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
