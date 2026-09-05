// =================================================================
// SERRA RESIDENCIAL — ai-concierge.js
// Asistente flotante. Sin backend ni API real (a propósito, tal y
// como se pidió): un intérprete de intenciones por palabras clave
// que además EJECUTA acciones en la interfaz (filtra, compara,
// resalta el edificio, abre la calculadora). Un único punto de
// integración -- getAIResponse() -- para poder enchufar una IA real
// más adelante sin tocar el resto de la app.
// =================================================================
const aiWidget       = document.getElementById('ai-widget');
const aiWidgetBtn   = document.getElementById('ai-widget-btn');
const aiWindow       = document.getElementById('ai-window');
const aiClose         = document.getElementById('ai-close');
const aiMessages      = document.getElementById('ai-messages');
const aiForm          = document.getElementById('ai-form');
const aiInput         = document.getElementById('ai-input');
const aiSuggestions   = document.getElementById('ai-suggestions');

function openAIConcierge() {
  if (typeof closeDrawer === 'function') closeDrawer();
  aiWindow.classList.add('open');
  aiWidget.classList.add('hidden');
  renderSuggestions();
  aiInput.focus();
}
function closeAIConcierge() {
  aiWindow.classList.remove('open');
  aiWidget.classList.remove('hidden');
}
aiWidgetBtn.addEventListener('click', openAIConcierge);
aiClose.addEventListener('click', closeAIConcierge);

function addMessage(text, from) {
  const msg = document.createElement('div');
  msg.className = `ai-msg ai-msg--${from}`;
  msg.textContent = text;
  aiMessages.appendChild(msg);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

// -----------------------------------------------------------------
// Contexto: qué está mirando el usuario ahora mismo -> cambia las
// preguntas sugeridas (pedido explícito del brief).
// -----------------------------------------------------------------
function getAIContext() {
  if (comparatorOverlay.classList.contains('open')) return 'comparador';
  if (contextPanel.classList.contains('open') && currentViewedUnitId) return 'unit';
  if (sectionDrawer.classList.contains('open')) return 'selector';
  return 'building';
}

const SUGGESTIONS_BY_CONTEXT = {
  building: ['¿Qué viviendas quedan disponibles?', '¿Cuál es la más económica?', 'Ver viviendas con terraza grande', '¿Dónde está el rooftop?'],
  selector: ['Viviendas con 3 dormitorios', 'Opciones por menos de 400.000 €', '¿Cuál tiene la terraza más grande?'],
  unit: ['¿Qué incluye esta vivienda?', 'Compárala con otra', 'Calcular su hipoteca'],
  comparador: ['¿Cuál de estas tiene mejor terraza?', '¿Cuál recomiendas?'],
};

function renderSuggestions() {
  const list = SUGGESTIONS_BY_CONTEXT[getAIContext()] || SUGGESTIONS_BY_CONTEXT.building;
  aiSuggestions.innerHTML = list.map((s) => `<button type="button" class="ai-suggestion">${s}</button>`).join('');
  aiSuggestions.querySelectorAll('.ai-suggestion').forEach((btn) => {
    btn.addEventListener('click', () => handleQuery(btn.textContent));
  });
}

// -----------------------------------------------------------------
// Utilidades de interpretación
// -----------------------------------------------------------------
function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Encuentra menciones tipo "3A", "3ºA", "planta 3 A", "PB A" en el
// texto y las resuelve contra ALL_UNITS.
function findMentionedUnits(text) {
  const t = normalize(text);
  const found = [];
  const re = /(pb|baja|\d)\s*(?:planta)?\s*[ºª°.]?\s*([abcd])/gi;
  let m;
  while ((m = re.exec(t))) {
    const floorPart = m[1];
    const letra = m[2].toUpperCase();
    const planta = PLANTAS.find((p) => (floorPart === 'pb' || floorPart === 'baja') ? p.numero === 'Baja' : p.numero === floorPart);
    if (planta) {
      const u = planta.units.find((x) => x.letra === letra);
      if (u) found.push(`${planta.id}-${letra}`);
    }
  }
  return [...new Set(found)];
}

function cheapest() { return cheapestUnit(); }
function mostExpensive() { return ALL_UNITS.reduce((max, u) => (parseEUR(u.precio) > parseEUR(max.precio) ? u : max), ALL_UNITS[0]); }
function biggestTerrace() { return ALL_UNITS.reduce((max, u) => (u.terraza_m2 > max.terraza_m2 ? u : max), ALL_UNITS[0]); }

// -----------------------------------------------------------------
// getAIResponse(query) -- ÚNICO punto de integración. Hoy es un mock
// por palabras clave; el día que haya una API real, esta es la única
// función a sustituir (misma forma: recibe texto, devuelve
// { text, action? }).
// -----------------------------------------------------------------
function getAIResponse(query) {
  const t = normalize(query);

  // Comparar dos viviendas mencionadas explícitamente.
  const mentioned = findMentionedUnits(query);
  if (t.includes('compar') && mentioned.length >= 2) {
    mentioned.slice(0, 3).forEach((id) => { if (!isInCompare(id)) toggleCompare(id); });
    return { text: `He añadido ${mentioned.length} viviendas al comparador y lo abro ahora.`, action: () => openComparator() };
  }

  // Dónde está el ático / rooftop.
  if (/(atico|rooftop)/.test(t) && /(donde|ubicacion|situa)/.test(t)) {
    return { text: 'El rooftop está en la última planta, retranqueado: piscina infinity, chill-out y jacuzzi. Te lo señalo en el edificio.', action: () => highlightZone('rooftop') };
  }

  // Habitaciones / dormitorios concretos.
  const domMatch = t.match(/(\d)\s*(dormitorio|habitacion)/);
  if (domMatch) {
    const n = domMatch[1];
    selectorState.dorm = n;
    return { text: `Te muestro las viviendas de ${n} dormitorios.`, action: () => { openDrawer('viviendas'); const sel = document.getElementById('sel-dorm'); if (sel) sel.value = n; } };
  }

  // Terraza más grande.
  if (/terraza/.test(t) && /(grande|mayor|mas grande)/.test(t)) {
    const u = biggestTerrace();
    return { text: `La vivienda con más terraza es ${plantaBadge(u.planta)} · ${u.letra}, con ${u.terraza_m2} m².`, action: () => { closeAIConcierge(); openPanel(u.planta, u.letra); highlightZone(u.planta.id); } };
  }

  // Disponibles.
  if (/disponible/.test(t)) {
    selectorState.estado = 'disponible';
    return { text: 'Estas son las viviendas disponibles ahora mismo.', action: () => { openDrawer('viviendas'); const sel = document.getElementById('sel-estado'); if (sel) sel.value = 'disponible'; } };
  }

  // Más económica.
  if (/(econom|barat)/.test(t)) {
    const u = cheapest();
    return { text: `La opción más económica es ${plantaBadge(u.planta)} · ${u.letra}, desde ${u.precio}.`, action: () => { closeAIConcierge(); openPanel(u.planta, u.letra); highlightZone(u.planta.id); } };
  }

  // Por debajo de X €.
  const priceMatch = t.match(/(?:menos de|por debajo de|hasta)\s*([\d.,]+)/);
  if (priceMatch) {
    const limit = parseInt(priceMatch[1].replace(/[.,]/g, ''), 10) * (priceMatch[1].length <= 3 ? 1000 : 1); // "400" -> 400.000
    const realLimit = limit < 10000 ? limit * 1000 : limit;
    selectorState.precioMax = String(realLimit);
    return { text: `Viviendas por debajo de ${formatEUR(realLimit)}.`, action: () => { openDrawer('viviendas'); const sel = document.getElementById('sel-precio'); if (sel) { const opt = [...sel.options].find((o) => Number(o.value) >= realLimit); if (opt) sel.value = opt.value; } } };
  }

  // Mejor orientación.
  if (/orientacion/.test(t)) {
    return { text: 'Las 15 viviendas de Serra Residencial están en la fachada principal, orientadas al mar.' };
  }

  // Hipoteca / cuota.
  if (/(hipoteca|cuota)/.test(t)) {
    const unitId = mentioned[0] || currentViewedUnitId;
    return { text: unitId ? 'Abro la calculadora con el precio de esa vivienda.' : 'Abro la calculadora de hipoteca.', action: () => openCalculatorFor(unitId) };
  }

  // Recomendación para familia.
  if (/recomien/.test(t) && /famil/.test(t)) {
    const u = ALL_UNITS.filter((x) => x.dorm >= 3).sort((a, b) => b.terraza_m2 - a.terraza_m2)[0] || ALL_UNITS[0];
    return { text: `Para una familia recomendaría ${plantaBadge(u.planta)} · ${u.letra}: ${u.dorm} dormitorios y ${u.terraza_m2} m² de terraza.`, action: () => { closeAIConcierge(); openPanel(u.planta, u.letra); highlightZone(u.planta.id); } };
  }

  // ¿Qué incluye esta vivienda? (contexto: viendo una vivienda)
  if (/que incluye/.test(t) && currentViewedUnitId) {
    const u = findUnitById(currentViewedUnitId);
    return { text: `${plantaBadge(u.planta)} · ${u.letra}: ${u.dorm} dormitorios, ${u.banos} baños, ${u.m2} m² construidos y ${u.desc.toLowerCase()}` };
  }

  return {
    text: 'Puedo ayudarte a explorar viviendas por dormitorios, precio, terraza o disponibilidad, comparar dos viviendas, o calcular una hipoteca. ¿Qué te interesa?',
  };
}

function handleQuery(text) {
  if (!text.trim()) return;
  addMessage(text, 'user');
  aiInput.value = '';
  const { text: reply, action } = getAIResponse(text);
  setTimeout(() => {
    addMessage(reply, 'ai');
    if (action) action();
    renderSuggestions();
  }, 260); // pequeña pausa -> se siente "pensado", no instantáneo/falso
}

aiForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleQuery(aiInput.value);
});
