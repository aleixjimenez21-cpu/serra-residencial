// =================================================================
// SERRA RESIDENCIAL — promo-panels.js
// Drawers informativos: 04 Planos, 05 La promoción, 06 Ubicación,
// 07 Calidades. Todo lo que no es un dato real del proyecto se
// muestra como placeholder explícito (ver data.js).
// =================================================================

// --------------------- 05 · La promoción ---------------------
function renderPromoPanel(root) {
  root.innerHTML = `
    <h2 class="drawer-title">La promoción</h2>
    <p class="drawer-subtitle">Serra Residencial.</p>
    <div class="promo-stats">
      <div class="promo-stat"><span class="promo-stat-num">${PROMO.viviendas}</span><span class="promo-stat-label">Viviendas</span></div>
      <div class="promo-stat"><span class="promo-stat-num">${PROMO.plantas}</span><span class="promo-stat-label">Plantas con vivienda</span></div>
      <div class="promo-stat"><span class="promo-stat-num">${PROMO.dormitorios}</span><span class="promo-stat-label">Dormitorios</span></div>
    </div>
    <ul class="promo-list">
      <li><span>Rooftop</span><span>${PROMO.rooftop}</span></li>
      <li><span>Garaje</span><span>${PROMO.garaje}</span></li>
      <li><span>Trasteros</span><span>${PROMO.trasteros}</span></li>
      <li><span>Entrega prevista</span><span>${PROMO.entrega}</span></li>
    </ul>
  `;
}
SECTION_RENDERERS.promocion = renderPromoPanel;

// --------------------- 07 · Calidades ---------------------
function renderCalidadesPanel(root) {
  root.innerHTML = `
    <h2 class="drawer-title">Memoria de calidades</h2>
    <p class="drawer-subtitle">Materiales y acabados del proyecto.</p>
    <div class="calidades-accordion">
      ${CALIDADES.map((cat, i) => `
        <div class="calidad-item">
          <button type="button" class="calidad-head" data-idx="${i}">
            <span>${cat.categoria}</span><span class="calidad-chevron">＋</span>
          </button>
          <div class="calidad-body">
            <ul>${cat.items.map((it) => `<li>${it}</li>`).join('')}</ul>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  root.querySelectorAll('.calidad-head').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.calidad-item').classList.toggle('open'));
  });
}
SECTION_RENDERERS.calidades = renderCalidadesPanel;

// --------------------- 06 · Ubicación ---------------------
function renderUbicacionPanel(root) {
  root.innerHTML = `
    <h2 class="drawer-title">Entorno</h2>
    <p class="drawer-subtitle">${UBICACION.localidad}</p>
    <div class="ubicacion-map-placeholder">Mapa disponible próximamente</div>
    <div class="ubicacion-categorias">
      ${UBICACION.categorias.map((c) => `
        <div class="ubicacion-cat">
          <span class="ubicacion-cat-name">${c.nombre}</span>
          <span class="ubicacion-cat-items">${c.items.length ? c.items.join(', ') : 'Pendiente de definir'}</span>
        </div>
      `).join('')}
    </div>
  `;
}
SECTION_RENDERERS.ubicacion = renderUbicacionPanel;

// --------------------- 04 · Planos ---------------------
function renderPlanosPanel(root) {
  root.innerHTML = `
    <h2 class="drawer-title">Planos</h2>
    <p class="drawer-subtitle">Cada vivienda tiene su propio plano.</p>
    <div class="unit-plan-placeholder" style="height:160px;">Planos disponibles próximamente</div>
    <p class="drawer-note">Mientras tanto, explora las viviendas una a una desde el selector: cada ficha tiene su hueco de plano reservado.</p>
    <button type="button" class="btn-request" id="planos-goto-selector">Explorar viviendas</button>
  `;
  root.querySelector('#planos-goto-selector').addEventListener('click', () => openDrawer('viviendas'));
}
SECTION_RENDERERS.planos = renderPlanosPanel;
