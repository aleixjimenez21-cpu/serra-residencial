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

const esCompacto = () => window.matchMedia('(max-width: 820px)').matches;

// El panel no debe taparse nunca con el edificio: al abrirse, la
// fachada se aparta y se reduce un poco para seguir entera y clicable.
function reencuadrarEdificio(abierto) {
  if (typeof setFachadaPanelOffset !== 'function') return;
  if (!abierto) { setFachadaPanelOffset(null); return; }

  if (esCompacto()) {
    const alto = contextPanel.offsetHeight || Math.round(window.innerHeight * 0.4);
    setFachadaPanelOffset({ y: -Math.round(alto * 0.42), scale: 0.88 });
    return;
  }

  // Corredor libre entre el panel (izquierda) y los controles flotantes
  // de la derecha. El edificio se centra ahí y encoge SOLO lo necesario
  // para caber: en una pantalla ancha puede que no haga falta encoger.
  const vw = window.innerWidth;
  const panel = contextPanel.getBoundingClientRect();
  const derecha = document.getElementById('floor-selector');
  const bordeDerecho = derecha ? derecha.getBoundingClientRect().left : vw;

  const margen = 20;
  const izq = panel.right + margen;
  const der = Math.min(bordeDerecho - margen, vw - margen);
  const corredor = Math.max(120, der - izq);

  // offsetWidth NO lo afecta el transform: es el ancho real sin escalar.
  const zona = document.querySelector('.planta-zone[data-planta="pb"]');
  const anchoEdificio = zona ? zona.offsetWidth : corredor;

  const escala = Math.min(1, corredor / anchoEdificio);
  const centroCorredor = (izq + der) / 2;

  setFachadaPanelOffset({ x: Math.round(centroCorredor - vw / 2), scale: +escala.toFixed(3) });
}

function showContextPanel() {
  const yaAbierto = contextPanel.classList.contains('open');
  contextPanel.classList.add('open');
  contextPanel.setAttribute('aria-hidden', 'false');
  // Si ya estaba abierto no hace falta volver a mover el edificio:
  // solo ha cambiado el contenido. Sin requestAnimationFrame a
  // propósito: no se ejecuta en pestañas en segundo plano, y el ancho
  // del panel ya es correcto (abrirlo solo cambia opacidad y posición).
  if (!yaAbierto) reencuadrarEdificio(true);
}

// Cambia el contenido con un fundido corto, sin cerrar el panel: el
// usuario salta de una vivienda a otra sin reseleccionar la planta.
function setContextPanelBody(html) {
  if (!contextPanel.classList.contains('open')) {
    contextPanelBody.innerHTML = html;
    return Promise.resolve();
  }
  contextPanelBody.classList.add('swapping');
  return new Promise((resolve) => {
    setTimeout(() => {
      contextPanelBody.innerHTML = html;
      contextPanelBody.classList.remove('swapping');
      resolve();
    }, 180);
  });
}

// Solo oculta el panel -- no toca el estado de la planta desplegada
// en el edificio (la usa collapsePopped en building.js para no
// recursar sobre closePanel).
function hideContextPanel() {
  contextPanel.classList.remove('open');
  contextPanel.setAttribute('aria-hidden', 'true');
  contextPanel.style.transform = '';   // por si venía de un arrastre
  reencuadrarEdificio(false);
}

function openFloorSummary(planta) {
  currentViewedUnitId = null;
  const disponibles = planta.units.filter((u) => u.estado === 'disponible').length;
  showContextPanel();
  setContextPanelBody(`
    <span class="ctx-eyebrow">${planta.label}</span>
    <p class="ctx-summary">${planta.units.length} vivienda${planta.units.length === 1 ? '' : 's'} · ${disponibles} disponible${disponibles === 1 ? '' : 's'}</p>
    <p class="ctx-specs-sub">Elige una vivienda sobre el edificio para ver su ficha.</p>
  `);
}

// letraSeleccionada ausente -> resumen de planta (nivel 2). Con letra
// -> ficha compacta de la vivienda (nivel 3), con precio y acciones.
function openPanel(planta, letraSeleccionada) {
  if (!letraSeleccionada) { openFloorSummary(planta); return; }

  const u = planta.units.find((x) => x.letra === letraSeleccionada);
  currentViewedUnitId = `${planta.id}-${u.letra}`;
  const compared = typeof isInCompare === 'function' && isInCompare(currentViewedUnitId);

  showContextPanel();
  setContextPanelBody(`
    <span class="ctx-eyebrow">${plantaBadge(planta)} ${u.letra} ${estadoDotHTML(u.estado)}</span>
    <p class="ctx-specs">${u.tipologia} · ${u.m2} m²</p>
    <p class="ctx-specs-sub">Terraza ${u.terraza_m2} m² · Orientación ${u.orientacion}</p>
    <p class="ctx-price">${u.precio}</p>
    <div class="ctx-actions">
      <button type="button" class="ctx-btn ctx-btn--primary" id="ctx-360">Ver en 360°</button>
      <button type="button" class="ctx-btn" id="ctx-compare">${compared ? '− Quitar de comparar' : '+ Comparar'}</button>
      <button type="button" class="ctx-btn" id="ctx-request">Solicitar información</button>
    </div>
  `).then(() => {
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
  });
}

function estadoDotHTML(estado) {
  return `<span class="estado-dot estado-dot--${estado}" title="${ESTADO_LABEL[estado]}"></span>`;
}

function openRooftopPanel() {
  currentViewedUnitId = null;
  showContextPanel();
  setContextPanelBody(`
    <span class="ctx-eyebrow">${ROOFTOP.label}</span>
    <p class="ctx-summary">Zona común, sin viviendas.</p>
    <ul class="ctx-amenities">
      ${ROOFTOP.amenities.map((a) => `<li>${a}</li>`).join('')}
    </ul>
  `);
}

function closePanel() {
  hideContextPanel();
  if (typeof collapsePopped === 'function') collapsePopped();
}

contextPanelClose.addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePanel();
});

// -----------------------------------------------------------------
// Arrastrar hacia abajo para cerrar (bottom-sheet de móvil)
// -----------------------------------------------------------------
let arrastreY = null;
contextPanel.addEventListener('touchstart', (e) => {
  if (!esCompacto()) return;
  // Si el contenido está desplazado, el gesto es para seguir leyendo.
  if (contextPanel.scrollTop > 0) return;
  arrastreY = e.touches[0].clientY;
  contextPanel.style.transition = 'none';
}, { passive: true });

contextPanel.addEventListener('touchmove', (e) => {
  if (arrastreY === null) return;
  const dy = e.touches[0].clientY - arrastreY;
  if (dy > 0) contextPanel.style.transform = `translateY(${dy}px)`;
}, { passive: true });

contextPanel.addEventListener('touchend', () => {
  if (arrastreY === null) return;
  const movido = parseFloat((contextPanel.style.transform.match(/translateY\((\d+(?:\.\d+)?)px\)/) || [0, 0])[1]);
  contextPanel.style.transition = '';
  contextPanel.style.transform = '';
  arrastreY = null;
  // Más de 90px hacia abajo = cerrar; menos, vuelve a su sitio.
  if (movido > 90) closePanel();
});
