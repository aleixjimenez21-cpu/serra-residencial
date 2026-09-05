// =================================================================
// SERRA RESIDENCIAL — comparator.js
// Comparador de 2-3 viviendas. Barra persistente inferior en cuanto
// hay alguna seleccionada; overlay con tabla comparativa al pulsar
// "Comparar" (o el punto 03 del sidebar).
// =================================================================
const MAX_COMPARE = 3;
let compareIds = [];

function isInCompare(id) {
  return compareIds.includes(id);
}

function toggleCompare(id) {
  if (isInCompare(id)) {
    compareIds = compareIds.filter((x) => x !== id);
  } else if (compareIds.length < MAX_COMPARE) {
    compareIds = [...compareIds, id];
  }
  updateCompareIndicator();
  // Si el overlay de comparación está abierto, se refresca en vivo.
  if (comparatorOverlay.classList.contains('open')) renderComparatorTable();
}

function removeFromCompare(id) {
  compareIds = compareIds.filter((x) => x !== id);
  updateCompareIndicator();
  if (comparatorOverlay.classList.contains('open')) renderComparatorTable();
}

// Indicador discreto arriba a la derecha (#top-actions): solo un
// contador, nunca tarjetas permanentes. El overlay con la tabla es
// lo único que muestra el detalle, y solo al pulsarlo.
const compareIndicator = document.getElementById('compare-indicator');
const compareCount      = document.getElementById('compare-count');
const sidebarBadge      = document.getElementById('sidebar-badge');
const sidebarCompareBadge = document.getElementById('sidebar-compare-badge');

function updateCompareIndicator() {
  const n = compareIds.length;
  compareCount.textContent = n;
  compareIndicator.classList.toggle('hidden', n === 0);

  // Aviso en el botón de menú: en móvil el menú está cerrado y sin esto
  // el usuario guarda una vivienda y no ve que haya pasado nada, ni
  // sabe dónde ir a verla.
  [sidebarBadge, sidebarCompareBadge].forEach((b) => {
    if (!b) return;
    b.textContent = n;
    b.classList.toggle('hidden', n === 0);
  });
  if (n > 0 && sidebarBadge) {
    sidebarBadge.classList.remove('pulse');
    void sidebarBadge.offsetWidth; // reinicia la animación aunque ya estuviera puesta
    sidebarBadge.classList.add('pulse');
  }
}

compareIndicator.addEventListener('click', () => {
  if (compareIds.length >= 2) openComparator();
});

// -----------------------------------------------------------------
// Overlay de tabla comparativa
// -----------------------------------------------------------------
const comparatorOverlay = document.getElementById('comparator-overlay');
const comparatorBody = document.getElementById('comparator-body');
const comparatorClose = document.getElementById('comparator-close');

const COMPARE_ROWS = [
  { label: 'Precio', get: (u) => `Desde ${u.precio}` },
  { label: 'Precio / m²', get: (u) => formatEUR(Math.round(parseEUR(u.precio) / u.m2)) + '/m²' },
  { label: 'Planta', get: (u) => u.planta.label },
  { label: 'Tipología', get: (u) => u.tipologia },
  { label: 'Dormitorios', get: (u) => u.dorm },
  { label: 'Baños', get: (u) => u.banos },
  { label: 'Superficie construida', get: (u) => `${u.m2} m²` },
  { label: 'Superficie útil', get: (u) => u.superficie_util },
  { label: 'Terraza', get: (u) => `${u.terraza_m2} m²` },
  { label: 'Orientación', get: (u) => u.orientacion },
  { label: 'Disponibilidad', get: (u) => ESTADO_LABEL[u.estado] },
];

function renderComparatorTable() {
  if (compareIds.length < 2) {
    comparatorBody.innerHTML = '<p class="drawer-placeholder">Añade al menos 2 viviendas para compararlas (botón "Comparar" en cualquier ficha o tarjeta).</p>';
    return;
  }
  const units = compareIds.map(findUnitById);
  comparatorBody.innerHTML = `
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th></th>
            ${units.map((u) => `<th>${plantaBadge(u.planta)} · ${u.letra}<button type="button" class="compare-table-remove" data-remove="${u.id}" aria-label="Quitar">✕</button></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${COMPARE_ROWS.map((row) => `
            <tr>
              <th>${row.label}</th>
              ${units.map((u) => `<td>${row.get(u)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  comparatorBody.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => removeFromCompare(btn.dataset.remove));
  });
}

function openComparator() {
  if (typeof closeDrawer === 'function') closeDrawer();
  if (typeof closePanel === 'function') closePanel();
  renderComparatorTable();
  comparatorOverlay.classList.add('open');
  comparatorOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (typeof setActiveSidebarItem === 'function') setActiveSidebarItem('comparador');
}

function closeComparator() {
  comparatorOverlay.classList.remove('open');
  comparatorOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (typeof setActiveSidebarItem === 'function') setActiveSidebarItem(null);
}

comparatorClose.addEventListener('click', closeComparator);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeComparator();
});

// El punto 03 del sidebar abre el overlay directamente (necesita más
// ancho que un drawer lateral para la tabla).
SECTION_RENDERERS.comparador = null; // marcador: nav-shell.js lo trata como caso especial, ver más abajo
