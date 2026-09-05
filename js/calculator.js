// =================================================================
// SERRA RESIDENCIAL — calculator.js
// Drawer "08 · Financiación": calculadora de hipoteca orientativa.
// Si hay una vivienda activa (currentViewedUnitId, unit-panel.js), su
// precio se autorellena; si no, usa la vivienda más económica del
// dataset real (410.000 €) como valor de partida.
// =================================================================
function mortgagePayment(precio, entradaPct, anios, tipoInteresPct) {
  const capital = precio * (1 - entradaPct / 100);
  const r = tipoInteresPct / 100 / 12;
  const n = anios * 12;
  if (r === 0) return capital / n;
  return (capital * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function cheapestUnit() {
  return ALL_UNITS.reduce((min, u) => (parseEUR(u.precio) < parseEUR(min.precio) ? u : min), ALL_UNITS[0]);
}

function renderCalculator(root) {
  const activeUnit = (typeof currentViewedUnitId !== 'undefined' && currentViewedUnitId) ? findUnitById(currentViewedUnitId) : null;
  const startPrice = activeUnit ? parseEUR(activeUnit.precio) : parseEUR(cheapestUnit().precio);

  root.innerHTML = `
    <h2 class="drawer-title">Financiación</h2>
    <p class="drawer-subtitle">${activeUnit ? `Precio cargado de la vivienda ${plantaBadge(activeUnit.planta)} · ${activeUnit.letra}` : 'Cálculo orientativo de cuota mensual.'}</p>
    <div class="calc-form">
      <label>Precio de la vivienda
        <input type="number" id="calc-precio" value="${startPrice}" step="1000" min="0">
      </label>
      <label>Entrada (%)
        <input type="range" id="calc-entrada" min="10" max="50" step="5" value="20">
        <span id="calc-entrada-val" class="calc-range-val">20%</span>
      </label>
      <label>Años
        <input type="range" id="calc-anios" min="10" max="35" step="5" value="30">
        <span id="calc-anios-val" class="calc-range-val">30 años</span>
      </label>
      <label>Tipo de interés (%)
        <input type="range" id="calc-interes" min="1.5" max="6" step="0.1" value="3.5">
        <span id="calc-interes-val" class="calc-range-val">3,5%</span>
      </label>
    </div>
    <div class="calc-result">
      <span class="calc-result-label">Cuota estimada</span>
      <span class="calc-result-value" id="calc-result-value">— €/mes</span>
    </div>
    <p class="calc-disclaimer">Cálculo orientativo. Las condiciones finales dependerán de la entidad financiera.</p>
  `;

  const precioEl = root.querySelector('#calc-precio');
  const entradaEl = root.querySelector('#calc-entrada');
  const aniosEl = root.querySelector('#calc-anios');
  const interesEl = root.querySelector('#calc-interes');
  const resultEl = root.querySelector('#calc-result-value');

  function recalc() {
    root.querySelector('#calc-entrada-val').textContent = `${entradaEl.value}%`;
    root.querySelector('#calc-anios-val').textContent = `${aniosEl.value} años`;
    root.querySelector('#calc-interes-val').textContent = `${Number(interesEl.value).toLocaleString('es-ES')}%`;
    const cuota = mortgagePayment(Number(precioEl.value) || 0, Number(entradaEl.value), Number(aniosEl.value), Number(interesEl.value));
    resultEl.textContent = `${cuota.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €/mes`;
  }
  [precioEl, entradaEl, aniosEl, interesEl].forEach((el) => el.addEventListener('input', recalc));
  recalc();
}

SECTION_RENDERERS.financiacion = renderCalculator;

// Se puede abrir directamente para una vivienda concreta (lo usará
// el asistente IA: "calcula la hipoteca de la 3ºA").
function openCalculatorFor(unitId) {
  currentViewedUnitId = unitId;
  openDrawer('financiacion');
}
