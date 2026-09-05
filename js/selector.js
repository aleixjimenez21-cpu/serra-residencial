// =================================================================
// SERRA RESIDENCIAL — selector.js
// Drawer "02 · Viviendas": listado filtrable de las 15 viviendas
// reales (ALL_UNITS, definido en data.js). Se registra en
// SECTION_RENDERERS para que nav-shell.js lo muestre al pulsar el
// punto 02 del sidebar.
// =================================================================
const selectorState = {
  planta: 'all',
  dorm: 'all',
  precioMax: 'all',
  estado: 'all',
};

function unitMatchesFilters(u) {
  if (selectorState.planta !== 'all' && u.planta.id !== selectorState.planta) return false;
  if (selectorState.dorm !== 'all' && String(u.dorm) !== selectorState.dorm) return false;
  if (selectorState.estado !== 'all' && u.estado !== selectorState.estado) return false;
  if (selectorState.precioMax !== 'all' && parseEUR(u.precio) > Number(selectorState.precioMax)) return false;
  return true;
}

function plantaBadge(planta) {
  return planta.numero === 'Baja' ? 'PB' : `P${planta.numero}`;
}

function selectorCardHTML(u) {
  return `
    <article class="sel-card" data-unit-id="${u.id}">
      <div class="sel-card-head">
        <span class="sel-card-title">${plantaBadge(u.planta)} · ${u.letra}</span>
        <span class="estado-badge estado-badge--${u.estado}">${ESTADO_LABEL[u.estado]}</span>
      </div>
      <div class="sel-card-specs">
        <span>${u.dorm} dorm.</span>
        <span>${u.m2} m²</span>
        <span>Terraza ${u.terraza_m2} m²</span>
      </div>
      <p class="sel-card-price">Desde ${u.precio}</p>
      <div class="sel-card-actions">
        <button type="button" class="btn-view" data-unit-id="${u.id}">Ver vivienda</button>
        <button type="button" class="btn-compare-mini" data-unit-id="${u.id}">${typeof isInCompare === 'function' && isInCompare(u.id) ? 'Quitar' : 'Comparar'}</button>
      </div>
    </article>
  `;
}

function renderSelectorResults(container) {
  const results = ALL_UNITS.filter(unitMatchesFilters);
  container.innerHTML = results.length
    ? `<div class="sel-count">${results.length} vivienda${results.length === 1 ? '' : 's'}</div>
       <div class="sel-grid">${results.map(selectorCardHTML).join('')}</div>`
    : `<p class="drawer-placeholder">Ninguna vivienda coincide con estos filtros.</p>`;
}

function renderSelector(root) {
  root.innerHTML = `
    <h2 class="drawer-title">Viviendas</h2>
    <p class="drawer-subtitle">${ALL_UNITS.length} viviendas · 4 plantas</p>
    <div class="sel-filters">
      <label>Planta
        <select id="sel-planta">
          <option value="all">Todas</option>
          ${PLANTAS.map((p) => `<option value="${p.id}">${p.label}</option>`).join('')}
        </select>
      </label>
      <label>Dormitorios
        <select id="sel-dorm">
          <option value="all">Todos</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </label>
      <label>Precio máx.
        <select id="sel-precio">
          <option value="all">Sin límite</option>
          <option value="400000">400.000 €</option>
          <option value="450000">450.000 €</option>
          <option value="500000">500.000 €</option>
        </select>
      </label>
      <label>Disponibilidad
        <select id="sel-estado">
          <option value="all">Todas</option>
          <option value="disponible">Disponible</option>
          <option value="reservado">Reservado</option>
          <option value="vendido">Vendido</option>
        </select>
      </label>
    </div>
    <div id="sel-results"></div>
  `;

  const resultsEl = root.querySelector('#sel-results');
  renderSelectorResults(resultsEl);

  root.querySelectorAll('.sel-filters select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const key = sel.id.replace('sel-', '');
      selectorState[key === 'precio' ? 'precioMax' : key] = sel.value;
      renderSelectorResults(resultsEl);
    });
  });

  resultsEl.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.btn-view');
    if (viewBtn) {
      const u = findUnitById(viewBtn.dataset.unitId);
      closeDrawer();
      openPanel(u.planta, u.letra);
      if (typeof highlightZone === 'function') highlightZone(u.planta.id);
      return;
    }
    const compareBtn = e.target.closest('.btn-compare-mini');
    if (compareBtn && typeof toggleCompare === 'function') {
      toggleCompare(compareBtn.dataset.unitId);
      compareBtn.textContent = isInCompare(compareBtn.dataset.unitId) ? 'Quitar' : 'Comparar';
    }
  });
}

SECTION_RENDERERS.viviendas = renderSelector;
