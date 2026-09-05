// =================================================================
// SERRA RESIDENCIAL — building.js
// Zonas sobre la fachada (plantas delineadas + rooftop) y el layout
// "cover con foco" que recorta frente.webp a pantalla completa en
// cualquier dispositivo sin perder la alineación de los hotspots.
// Depende de data.js (PLANTAS, ROOFTOP), cargado antes.
// =================================================================

// -----------------------------------------------------------------
// ZONAS: plantas delineadas + rooftop
// -----------------------------------------------------------------
// Interacción: cada planta queda SIEMPRE delineada (borde + número de
// planta), nada de caja negra. Un clic la despega del edificio
// ("pop out") y revela sus viviendas (crujías) como franjas
// seleccionables una a una. El rooftop no tiene viviendas: un clic
// abre directamente su ficha de zona común.
const fachadaWrap = document.getElementById('fachada-wrap');
let poppedZone = null;

// El titular mínimo ("Explora el edificio / Selecciona una planta")
// se apaga en cuanto el edificio recibe la primera interacción real
// (hover o clic) -- es la arquitectura la que enseña, no un texto
// permanente en pantalla.
const exploreHintEl = document.getElementById('explore-hint');
let exploreHintDismissed = false;
function hideExploreHint() {
  if (exploreHintDismissed) return;
  exploreHintDismissed = true;
  exploreHintEl.classList.add('dimmed');
}

function updateFloorSelectorActive() {
  const activeId = poppedZone ? poppedZone.dataset.planta : null;
  document.querySelectorAll('.floor-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.planta === activeId);
  });
}

function collapsePopped() {
  if (poppedZone) {
    poppedZone.classList.remove('popped');
    poppedZone = null;
  }
  if (typeof hideContextPanel === 'function') hideContextPanel();
  updateFloorSelectorActive();
}

PLANTAS.forEach((planta) => {
  const zone = document.createElement('div');
  zone.className = 'planta-zone';
  zone.dataset.planta = planta.id;
  zone.dataset.pos = JSON.stringify(planta.pos); // % sobre la imagen NATURAL; layoutFachada() los reproyecta
  zone.setAttribute('role', 'button');
  zone.setAttribute('tabindex', '0');
  zone.setAttribute('aria-label', `${planta.label} · ${planta.units.length} viviendas`);

  const badge = document.createElement('span');
  badge.className = 'zone-badge';
  badge.textContent = planta.numero === 'Baja' ? 'PB' : `P${planta.numero}`;
  zone.appendChild(badge);

  const label = document.createElement('span');
  label.className = 'zone-label';
  label.textContent = `${planta.label} · ${planta.units.length} viviendas`;
  zone.appendChild(label);

  // Las crujías estructurales de esta planta, de izquierda a derecha:
  // por defecto una vivienda por crujía, pero una planta puede marcar
  // alguna como 'entrada' (portal, no vivienda) vía `planta.bays`.
  const bays = planta.bays || planta.units.map((u) => u.letra);
  const slices = document.createElement('div');
  slices.className = 'unit-slices';
  bays.forEach((bay) => {
    const slice = document.createElement('button');
    slice.type = 'button';
    slice.className = 'unit-slice';

    if (bay === 'entrada') {
      slice.classList.add('unit-slice--entrada');
      slice.setAttribute('aria-label', `Portal de entrada, ${planta.label}`);
      slice.innerHTML = `<span class="slice-label"><span class="slice-label-main">Entrada</span></span>`;
      // Sin panel: es el portal del edificio, no una vivienda que elegir.
    } else {
      const u = planta.units.find((x) => x.letra === bay);
      slice.dataset.unitId = `${planta.id}-${u.letra}`;
      slice.classList.add(`estado-${u.estado}`);
      slice.setAttribute('aria-label', `Vivienda ${bay}, ${planta.label}`);
      slice.innerHTML = `
        <span class="slice-label">
          <span class="slice-label-main">${floorItemLabel(planta)} ${u.letra}</span>
          <span class="slice-label-sub">${u.dorm} dorm. · ${u.m2} m²</span>
          <span class="slice-label-estado">${ESTADO_LABEL[u.estado]}</span>
        </span>
      `.trim();
      // Los eventos serra:unit-* no disparan ninguna lógica propia --
      // solo avisan a quien quiera escuchar (hoy, tutorial.js) de que
      // la acción real ya ha ocurrido, sin duplicarla.
      slice.addEventListener('mouseenter', () => {
        document.dispatchEvent(new CustomEvent('serra:unit-hover', { detail: { unitId: slice.dataset.unitId } }));
      });
      slice.addEventListener('click', (e) => {
        e.stopPropagation(); // no relanzar el toggle de pop-out del padre
        document.dispatchEvent(new CustomEvent('serra:unit-select', { detail: { unitId: slice.dataset.unitId } }));
        openPanel(planta, u.letra);
      });
    }
    slices.appendChild(slice);
  });
  zone.appendChild(slices);

  const togglePop = () => {
    hideExploreHint();
    if (zone.classList.contains('popped')) {
      collapsePopped();
    } else {
      collapsePopped();
      zone.classList.add('popped');
      poppedZone = zone;
      updateFloorSelectorActive();
      if (typeof openFloorSummary === 'function') openFloorSummary(planta);
      document.dispatchEvent(new CustomEvent('serra:floor-select', { detail: { plantaId: planta.id } }));
    }
  };
  zone.addEventListener('click', togglePop);
  zone.addEventListener('mouseenter', () => {
    hideExploreHint();
    document.dispatchEvent(new CustomEvent('serra:floor-hover', { detail: { plantaId: planta.id } }));
  });
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePop(); }
  });

  fachadaWrap.appendChild(zone);
});

// Rooftop: mismo delineado, pero sin pop-out (no hay viviendas que elegir).
const roofZone = document.createElement('button');
roofZone.type = 'button';
roofZone.className = 'planta-zone';
roofZone.dataset.planta = ROOFTOP.id;
roofZone.dataset.pos = JSON.stringify(ROOFTOP.pos);
roofZone.setAttribute('aria-label', `${ROOFTOP.label} · zona común`);
roofZone.innerHTML = `
  <span class="zone-badge">${ROOFTOP.label}</span>
  <span class="zone-label">${ROOFTOP.label} · zona común</span>
`;
roofZone.addEventListener('click', () => { hideExploreHint(); collapsePopped(); openRooftopPanel(); });
roofZone.addEventListener('mouseenter', hideExploreHint);
fachadaWrap.appendChild(roofZone);

// -----------------------------------------------------------------
// SELECTOR DE PLANTAS — flotante junto al edificio (#floor-selector),
// mecanismo secundario: el principal es el propio edificio (arriba).
// Se genera una vez, desde PLANTAS + ROOFTOP, y llamado por
// nav-shell.js (onAppReady) en cuanto la vista interactiva está lista.
// -----------------------------------------------------------------
function floorItemLabel(planta) {
  return planta.numero === 'Baja' ? 'PB' : `P${planta.numero}`;
}

function renderFloorSelector() {
  const list = document.getElementById('floor-selector-list');
  if (!list || list.children.length) return; // ya generado
  list.innerHTML = '';

  PLANTAS.forEach((planta) => {
    const disponibles = planta.units.filter((u) => u.estado === 'disponible').length;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'floor-item';
    item.dataset.planta = planta.id;
    item.innerHTML = `
      ${floorItemLabel(planta)}
      <span class="floor-item-tooltip">${planta.label} · ${disponibles} disponible${disponibles === 1 ? '' : 's'}</span>
    `;
    item.addEventListener('click', () => {
      const zone = fachadaWrap.querySelector(`.planta-zone[data-planta="${planta.id}"]`);
      zone?.click();
    });
    list.appendChild(item);
  });

  const roofItem = document.createElement('button');
  roofItem.type = 'button';
  roofItem.className = 'floor-item';
  roofItem.dataset.planta = ROOFTOP.id;
  roofItem.innerHTML = `
    RF
    <span class="floor-item-tooltip">${ROOFTOP.label} · zona común</span>
  `;
  roofItem.addEventListener('click', () => roofZone.click());
  list.appendChild(roofItem);
}

// Un clic fuera de cualquier planta recoge la que estuviera desplegada.
fachadaWrap.addEventListener('click', (e) => {
  if (!e.target.closest('.planta-zone')) collapsePopped();
});

// Resalta (pop-out) una planta por id desde fuera del módulo -- lo usa
// el asistente IA para "¿dónde está el ático?" / "muéstrame la planta 3".
function highlightZone(plantaId) {
  const zone = fachadaWrap.querySelector(`.planta-zone[data-planta="${plantaId}"]`);
  if (!zone) return;
  hideExploreHint();
  collapsePopped();
  if (zone.dataset.planta !== ROOFTOP.id) {
    zone.classList.add('popped');
    poppedZone = zone;
    updateFloorSelectorActive();
    const planta = PLANTAS.find((p) => p.id === plantaId);
    if (planta && typeof openFloorSummary === 'function') openFloorSummary(planta);
  } else {
    zone.classList.add('hint-active');
    setTimeout(() => zone.classList.remove('hint-active'), 1600);
    if (typeof openRooftopPanel === 'function') openRooftopPanel();
  }
  zone.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
}

// -----------------------------------------------------------------
// LAYOUT "COVER" CON FOCO EN EL EDIFICIO
// -----------------------------------------------------------------
// Pantalla completa en cualquier dispositivo (sin márgenes) exige
// recortar la foto -- un móvil vertical no tiene la misma proporción
// que la fachada. En vez de un "object-fit: cover" a ciegas (que
// centraría el recorte en el CENTRO DE LA FOTO, no del edificio, y en
// vertical se lo comería), calculamos a mano el mismo cover pero con
// el foco puesto en el edificio, y reproyectamos cada hotspot (que
// están definidos en % sobre la imagen NATURAL) a su posición real
// dentro del recorte. Resultado: llena toda la pantalla siempre, y
// las plantas siguen cayendo pixel a pixel sobre la fachada real.
const fachadaImg = fachadaWrap.querySelector('.fachada-img');
const plantasSection = document.getElementById('plantas');

// Foco aproximado del centro del edificio dentro de frente.webp (foto
// recta/orto, el edificio ya sale bastante centrado -> foco ~50/50,
// a diferencia de la aérea que usábamos antes).
const FOCUS_X = 0.50;
const FOCUS_Y = 0.505;

function layoutFachada() {
  const NW = fachadaImg.naturalWidth;
  const NH = fachadaImg.naturalHeight;
  if (!NW || !NH) return;

  const CW = plantasSection.clientWidth;
  const CH = plantasSection.clientHeight;
  if (!CW || !CH) return;

  const scale = Math.max(CW / NW, CH / NH); // "cover"
  const RW = NW * scale;
  const RH = NH * scale;

  // Centra el foco en el contenedor, luego recorta (clamp) para que
  // la imagen siga cubriendo el 100% del contenedor sin huecos.
  let left = CW / 2 - FOCUS_X * RW;
  let top = CH / 2 - FOCUS_Y * RH;
  left = Math.min(0, Math.max(CW - RW, left));
  top = Math.min(0, Math.max(CH - RH, top));

  fachadaImg.style.width = RW + 'px';
  fachadaImg.style.height = RH + 'px';
  fachadaImg.style.left = left + 'px';
  fachadaImg.style.top = top + 'px';

  document.querySelectorAll('#fachada-wrap [data-pos]').forEach((el) => {
    const p = JSON.parse(el.dataset.pos);
    const px = (p.left / 100) * RW;
    const py = (p.top / 100) * RH;
    const pw = (p.width / 100) * RW;
    const ph = (p.height / 100) * RH;
    el.style.left = ((px + left) / CW) * 100 + '%';
    el.style.top = ((py + top) / CH) * 100 + '%';
    el.style.width = (pw / CW) * 100 + '%';
    el.style.height = (ph / CH) * 100 + '%';
  });
}

if (fachadaImg.complete) {
  layoutFachada();
} else {
  fachadaImg.addEventListener('load', layoutFachada, { once: true });
}

let resizeRaf = null;
function relayoutFachada() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(layoutFachada);
}

// El recorte depende del tamaño REAL del contenedor, así que se observa
// el contenedor en vez de fiarse del evento 'resize' de la ventana: al
// girar el móvil ese evento no siempre vuelve a dispararse con las
// medidas definitivas, y se quedaba aplicado el recorte calculado en
// vertical (que amplía muchísimo) estando ya en horizontal.
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(relayoutFachada).observe(plantasSection);
} else {
  window.addEventListener('resize', relayoutFachada);
}
window.addEventListener('orientationchange', () => {
  // Tras girar, las medidas tardan un poco en asentarse (barra del
  // navegador incluida): se recalcula varias veces por si acaso.
  [0, 120, 350, 700].forEach((ms) => setTimeout(relayoutFachada, ms));
});

// -----------------------------------------------------------------
// CONTROLES DE VISTA — reset / zoom / pantalla completa.
// -----------------------------------------------------------------
// No hay motor 3D real detrás de esta vista (es frente.webp + el
// recorte con foco de arriba), así que "zoom" es honesto: una escala
// extra sobre el recorte ya calculado, no una cámara 3D. No hay
// "rotar" porque no hay geometría que rotar.
let viewZoom = 1;
const ZOOM_MIN = 1;
const ZOOM_MAX = 2.2;

function applyViewZoom() {
  fachadaWrap.style.transform = viewZoom === 1 ? '' : `scale(${viewZoom})`;
}

document.getElementById('view-zoom-in').addEventListener('click', () => {
  viewZoom = Math.min(ZOOM_MAX, viewZoom + 0.25);
  applyViewZoom();
});
document.getElementById('view-zoom-out').addEventListener('click', () => {
  viewZoom = Math.max(ZOOM_MIN, viewZoom - 0.25);
  applyViewZoom();
});
document.getElementById('view-reset').addEventListener('click', () => {
  viewZoom = 1;
  applyViewZoom();
  collapsePopped();
});
document.getElementById('view-fullscreen').addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen?.();
  }
});
