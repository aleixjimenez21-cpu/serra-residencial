// =================================================================
// SERRA RESIDENCIAL — showroom 360 · LÓGICA
// -----------------------------------------------------------------
// Aquí NO hay contenido: estancias, enlaces, ángulos y textos viven
// en tour.config.js. Este archivo solo monta el visor, la interfaz y
// el modo picker.
//
// API pública:  initShowroom(containerEl, viviendaId) -> { viewer, tour, destroy }
// =================================================================
import { Viewer } from '@photo-sphere-viewer/core';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';

import { VIVIENDAS, ZONES, SETTINGS, DEFAULT_VIVIENDA } from './tour.config.js';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const deg = (d) => d * D2R;
const toDeg = (r) => r * R2D;

// Normaliza a -180..180 para que los valores del picker se puedan
// pegar tal cual en la configuración.
function normDeg(d) {
  let v = ((d + 180) % 360 + 360) % 360 - 180;
  return Math.round(v * 10) / 10;
}

// Flecha de suelo. Deliberadamente tenue: un chevrón de trazo fino
// sobre un disco casi imperceptible, sin aro marcado ni punta maciza.
// Se dibuja como textura sobre el plano del suelo, así que la opacidad
// va horneada en el SVG (no se puede aplicar por CSS).
function arrowImage() {
  const c = SETTINGS.arrowColor || '#ffffff';
  const o = SETTINGS.arrowOpacity != null ? SETTINGS.arrowOpacity : 0.32;
  // Tres capas: sombra de contacto difuminada, contorno oscuro fino y
  // chevrón claro encima. El contorno es lo que hace que se lea igual
  // sobre un suelo de roble claro que sobre uno oscuro, sin tener que
  // subir la opacidad y volverlas llamativas.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="s">
        <stop offset="0%" stop-color="#000" stop-opacity="${(o * 0.55).toFixed(3)}"/>
        <stop offset="65%" stop-color="#000" stop-opacity="${(o * 0.16).toFixed(3)}"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="50" cy="54" rx="36" ry="32" fill="url(#s)"/>
    <path d="M35 61 L50 44 L65 61" fill="none" stroke="#000" stroke-opacity="${(o * 0.5).toFixed(3)}"
          stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M35 61 L50 44 L65 61" fill="none" stroke="${c}" stroke-opacity="${Math.min(1, o * 1.9).toFixed(3)}"
          stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

// -----------------------------------------------------------------
// Config -> nodos de VirtualTourPlugin
// -----------------------------------------------------------------
function buildNodes(vivienda) {
  return vivienda.nodes.map((n) => ({
    id: n.id,
    panorama: vivienda.panoramaDir + n.file,
    thumbnail: vivienda.thumbDir ? vivienda.thumbDir + n.file : undefined,
    name: n.name,
    links: (n.links || []).map((l) => ({
      nodeId: l.to,
      position: { yaw: deg(l.yaw), pitch: deg(l.pitch != null ? l.pitch : SETTINGS.arrowPitchDeg) },
      // `data` viaja intacto en el evento node-changed -> es donde
      // guardamos hacia dónde debe mirar la cámara al cruzar ESTA
      // puerta concreta (dos correderas al mismo sitio, dos llegadas).
      data: { arrivalYaw: l.arrivalYaw != null ? deg(l.arrivalYaw) : null, label: l.label },
    })),
  }));
}

// Aviso en consola si un enlace no tiene su recíproco: el grafo se
// declara en los dos sentidos a mano (cada sentido tiene su propia
// posición y su propia llegada), así que es fácil olvidarse de uno.
function validateGraph(vivienda) {
  const ids = new Set(vivienda.nodes.map((n) => n.id));
  const problems = [];
  vivienda.nodes.forEach((n) => {
    (n.links || []).forEach((l) => {
      if (!ids.has(l.to)) {
        problems.push(`"${n.id}" enlaza con "${l.to}", que no existe`);
        return;
      }
      const back = vivienda.nodes.find((x) => x.id === l.to);
      if (!(back.links || []).some((bl) => bl.to === n.id)) {
        problems.push(`"${n.id}" -> "${l.to}" no tiene vuelta ("${l.to}" -> "${n.id}")`);
      }
    });
  });
  if (problems.length) {
    console.warn('[showroom] Revisa el grafo en tour.config.js:\n  - ' + problems.join('\n  - '));
  }
}

// -----------------------------------------------------------------
// INTERFAZ — se construye dentro del contenedor para que el showroom
// sea embebible en cualquier página, no solo en index.html.
// -----------------------------------------------------------------
function buildUI(root, vivienda, zones) {
  root.classList.add('showroom');
  root.innerHTML = `
    <div class="sr-stage" aria-label="Vista panorámica de la vivienda"></div>

    <div class="sr-loading" role="status" aria-live="polite">
      <div class="sr-loading-bg"></div>
      <div class="sr-loading-inner">
        <p class="sr-loading-eyebrow">Serra Residencial</p>
        <h1 class="sr-loading-title">${vivienda.nombre}</h1>
        <p class="sr-loading-sub">${vivienda.subtitulo || ''}</p>
        <div class="sr-progress"><span></span></div>
      </div>
    </div>

    <div class="sr-room-label" aria-hidden="true"><span></span></div>

    <div class="sr-topbar">
      <button class="sr-btn sr-back" type="button" aria-label="Volver al selector de viviendas">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Viviendas</span>
      </button>
      <div class="sr-topbar-right">
        <button class="sr-btn sr-icon sr-gyro" type="button" aria-label="Activar giroscopio" aria-pressed="false" hidden>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="3.4" ry="8.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.8 12h16.4" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button class="sr-btn sr-icon sr-fs" type="button" aria-label="Pantalla completa">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>

    <button class="sr-rooms-toggle" type="button" aria-expanded="false" aria-controls="sr-rooms">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span>Estancias</span>
    </button>

    <nav class="sr-rooms" id="sr-rooms" aria-label="Estancias de la vivienda">
      <div class="sr-rooms-head">
        <span>Estancias</span>
        <button class="sr-rooms-close" type="button" aria-label="Cerrar lista de estancias">✕</button>
      </div>
      <div class="sr-rooms-list"></div>
    </nav>
  `;

  const list = root.querySelector('.sr-rooms-list');
  zones.forEach((zone) => {
    const inZone = vivienda.nodes.filter((n) => n.zone === zone.id);
    if (!inZone.length) return;
    const group = document.createElement('div');
    group.className = 'sr-zone';
    group.innerHTML = `<p class="sr-zone-name">${zone.name}</p>`;
    inZone.forEach((n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sr-room';
      b.dataset.node = n.id;
      b.textContent = n.name;
      group.appendChild(b);
    });
    list.appendChild(group);
  });

  return {
    stage: root.querySelector('.sr-stage'),
    loading: root.querySelector('.sr-loading'),
    loadingBg: root.querySelector('.sr-loading-bg'),
    progress: root.querySelector('.sr-progress span'),
    label: root.querySelector('.sr-room-label'),
    labelText: root.querySelector('.sr-room-label span'),
    rooms: root.querySelector('.sr-rooms'),
    roomsToggle: root.querySelector('.sr-rooms-toggle'),
    roomsClose: root.querySelector('.sr-rooms-close'),
    roomButtons: () => root.querySelectorAll('.sr-room'),
    back: root.querySelector('.sr-back'),
    gyro: root.querySelector('.sr-gyro'),
    fs: root.querySelector('.sr-fs'),
  };
}

// -----------------------------------------------------------------
// MODO PICKER (?debug=1) — imprime yaw/pitch listos para pegar.
// -----------------------------------------------------------------
function initPicker(root, viewer, getNodeId) {
  const box = document.createElement('div');
  box.className = 'sr-picker';
  box.innerHTML = `
    <p class="sr-picker-title">PICKER · clica el suelo donde quieras la flecha</p>
    <p class="sr-picker-row"><span>Nodo actual</span><code class="sr-picker-node">—</code></p>
    <p class="sr-picker-row"><span>Punto clicado <em>(para <b>yaw/pitch</b> del enlace)</em></span></p>
    <code class="sr-picker-out sr-picker-click">— clica sobre la panorámica —</code>
    <p class="sr-picker-row"><span>Vista actual <em>(para <b>arrivalYaw</b> / <b>defaultYaw</b>)</em></span></p>
    <code class="sr-picker-out sr-picker-view">—</code>
    <button class="sr-picker-copy" type="button">Copiar línea de enlace</button>
  `;
  root.appendChild(box);

  const nodeEl = box.querySelector('.sr-picker-node');
  const clickEl = box.querySelector('.sr-picker-click');
  const viewEl = box.querySelector('.sr-picker-view');
  const copyBtn = box.querySelector('.sr-picker-copy');
  let lastLine = '';

  viewer.addEventListener('click', ({ data }) => {
    const yaw = normDeg(toDeg(data.yaw));
    const pitch = normDeg(toDeg(data.pitch));
    lastLine = `{ to: 'DESTINO', yaw: ${yaw}, pitch: ${pitch}, arrivalYaw: 0 },`;
    clickEl.textContent = lastLine;
    console.log(`[picker] ${getNodeId()} → ${lastLine}`);
  });

  const refreshView = () => {
    const p = viewer.getPosition();
    const yaw = normDeg(toDeg(p.yaw));
    viewEl.textContent = `defaultYaw: ${yaw}   /   arrivalYaw: ${yaw}`;
    nodeEl.textContent = getNodeId();
  };
  viewer.addEventListener('position-updated', refreshView);
  viewer.addEventListener('ready', refreshView);

  copyBtn.addEventListener('click', () => {
    if (!lastLine) return;
    navigator.clipboard?.writeText(lastLine);
    copyBtn.textContent = 'Copiado ✓';
    setTimeout(() => (copyBtn.textContent = 'Copiar línea de enlace'), 1200);
  });

  return { refresh: refreshView };
}

// =================================================================
// PUNTO DE ENTRADA
// =================================================================
export function initShowroom(containerEl, viviendaId) {
  const id = viviendaId || DEFAULT_VIVIENDA;
  const vivienda = VIVIENDAS[id];
  if (!vivienda) {
    throw new Error(`[showroom] La vivienda "${id}" no existe en tour.config.js`);
  }
  validateGraph(vivienda);

  const zones = ZONES;
  const ui = buildUI(containerEl, vivienda, zones);
  const nodes = buildNodes(vivienda);
  const startId = vivienda.startNodeId || vivienda.nodes[0].id;

  // Mientras carga, el fondo de la pantalla de entrada es la miniatura
  // de la primera estancia, desenfocada: color y ambiente desde el
  // primer instante en vez de un negro plano.
  const startNode = vivienda.nodes.find((n) => n.id === startId);
  if (vivienda.thumbDir && startNode) {
    ui.loadingBg.style.backgroundImage = `url("${vivienda.thumbDir + startNode.file}")`;
  }

  const defaultYawById = {};
  vivienda.nodes.forEach((n) => { defaultYawById[n.id] = deg(n.defaultYaw || 0); });

  const MIN_PITCH = deg(SETTINGS.minPitchDeg);

  const viewer = new Viewer({
    container: ui.stage,
    navbar: false,                       // interfaz propia, ver buildUI()
    defaultZoomLvl: SETTINGS.defaultZoomLvl,
    minFov: SETTINGS.minFov,
    maxFov: SETTINGS.maxFov,
    moveInertia: true,
    loadingImg: null,
    canvasBackground: '#efeae1',
    keyboard: 'always',
    plugins: [
      MarkersPlugin,
      [AutorotatePlugin, {
        autostartDelay: SETTINGS.autorotateDelayMs,
        autostartOnIdle: true,
        autorotateSpeed: SETTINGS.autorotateSpeed,
      }],
      GyroscopePlugin,
      [VirtualTourPlugin, {
        dataMode: 'client',
        positionMode: 'manual',
        renderMode: '3d',                // flechas apoyadas en el suelo
        nodes,
        startNodeId: startId,
        preload: !!SETTINGS.preloadNeighbours,
        linksOnCompass: false,
        showLinkTooltip: true,
        getLinkTooltip: (tooltip, link) => (link.data && link.data.label) || tooltip,
        arrowStyle: {
          image: arrowImage(),
          size: { width: SETTINGS.arrowSizePx, height: SETTINGS.arrowSizePx },
          className: 'sr-arrow',
        },
        // Las flechas 3d se dibujan en una escena aparte cuya cámara copia
        // el yaw del visor pero lleva el pitch forzado a este rango. Es
        // ESTE ángulo -- no el pitch de cada enlace, que en modo 3d se
        // ignora -- el que decide si las flechas se ven repartidas por el
        // suelo o amontonadas a los pies.
        arrowsPosition: {
          minPitch: deg(Math.abs(SETTINGS.arrowCameraPitchDeg || 30)),
          maxPitch: Math.PI / 2,
          linkOverlapAngle: deg(SETTINGS.arrowOverlapAngleDeg || 45),
        },
        // Fundido hacia la siguiente estancia. El zoom de llegada es
        // SIEMPRE el mismo (no se suma al que trajera el usuario: si se
        // acumulara, cada salto acercaría un poco más la cámara).
        transitionOptions: () => ({
          showLoader: false,
          effect: SETTINGS.transitionEffect,
          speed: SETTINGS.transitionMs,
          rotation: true,
          zoomTo: Math.min(100, (SETTINGS.defaultZoomLvl || 0) + (SETTINGS.transitionZoomPush || 0)),
        }),
      }],
    ],
  });

  const tour = viewer.getPlugin(VirtualTourPlugin);
  const autorotate = viewer.getPlugin(AutorotatePlugin);
  const gyro = viewer.getPlugin(GyroscopePlugin);

  let currentNodeId = startId;

  // ---------------------------------------------------------------
  // Llegada por puerta: cada enlace decide hacia dónde se mira al
  // entrar. Sin enlace (salto desde el selector) se usa defaultYaw.
  // ---------------------------------------------------------------
  tour.addEventListener('node-changed', (e) => {
    const node = e.node || (e.data && e.data.node);
    if (!node) return;
    currentNodeId = node.id;

    const fromLink = e.data && e.data.fromLink;
    const arrival = fromLink && fromLink.data ? fromLink.data.arrivalYaw : null;
    const yaw = arrival != null ? arrival : defaultYawById[node.id];
    if (yaw != null) viewer.rotate({ yaw, pitch: 0 });

    showRoomLabel(node.id);
    markActiveRoom(node.id);
  });

  // ---------------------------------------------------------------
  // Tope inferior de la cámara: no mirar al suelo bajo los pies
  // (tapa los artefactos del nadir de las panorámicas generadas).
  // ---------------------------------------------------------------
  let clamping = false;
  viewer.addEventListener('position-updated', ({ position }) => {
    if (clamping || position.pitch >= MIN_PITCH) return;
    clamping = true;
    viewer.rotate({ yaw: position.yaw, pitch: MIN_PITCH });
    requestAnimationFrame(() => { clamping = false; });
  });

  // ---------------------------------------------------------------
  // Rótulo de estancia
  // ---------------------------------------------------------------
  let labelTimer = null;
  function showRoomLabel(nodeId) {
    const n = vivienda.nodes.find((x) => x.id === nodeId);
    if (!n) return;
    ui.labelText.textContent = n.name;
    ui.label.classList.add('is-visible');
    clearTimeout(labelTimer);
    labelTimer = setTimeout(() => ui.label.classList.remove('is-visible'), SETTINGS.roomLabelMs);
  }

  function markActiveRoom(nodeId) {
    ui.roomButtons().forEach((b) => {
      const active = b.dataset.node === nodeId;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  // ---------------------------------------------------------------
  // Selector de estancias
  // ---------------------------------------------------------------
  const isCompact = () => window.matchMedia('(max-width: 820px)').matches;
  function setRoomsOpen(open) {
    containerEl.classList.toggle('rooms-open', open);
    ui.roomsToggle.setAttribute('aria-expanded', String(open));
  }
  ui.roomsToggle.addEventListener('click', () => setRoomsOpen(!containerEl.classList.contains('rooms-open')));
  ui.roomsClose.addEventListener('click', () => setRoomsOpen(false));
  ui.roomButtons().forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.node !== currentNodeId) tour.setCurrentNode(b.dataset.node);
      if (isCompact()) { b.blur(); setRoomsOpen(false); }
    });
  });

  // Red de seguridad: el contenedor es overflow:hidden, pero el navegador
  // aún puede desplazarlo por dentro al perseguir un elemento enfocado.
  // Si pasa, la escena se descuadra entera -- así que nunca se desplaza.
  containerEl.addEventListener('scroll', () => {
    if (containerEl.scrollTop || containerEl.scrollLeft) {
      containerEl.scrollTop = 0;
      containerEl.scrollLeft = 0;
    }
  }, { passive: true });
  // En escritorio arranca abierto; en móvil, plegado. Al cruzar el
  // umbral con la ventana se recoloca, para no dejar el panel ocupando
  // media pantalla en vertical.
  setRoomsOpen(!isCompact());
  let wasCompact = isCompact();
  window.addEventListener('resize', () => {
    const now = isCompact();
    if (now !== wasCompact) {
      wasCompact = now;
      setRoomsOpen(!now);
    }
  });

  // ---------------------------------------------------------------
  // Controles
  // ---------------------------------------------------------------
  ui.fs.addEventListener('click', () => viewer.toggleFullscreen());
  ui.back.addEventListener('click', () => {
    window.location.href = SETTINGS.backUrl || '../index.html';
  });

  // El giroscopio solo tiene sentido si el dispositivo lo soporta.
  const gyroSupported = typeof DeviceOrientationEvent !== 'undefined'
    && (window.isSecureContext || location.hostname === 'localhost');
  if (gyroSupported && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    ui.gyro.hidden = false;
    ui.gyro.addEventListener('click', async () => {
      await gyro.toggle();
      const on = gyro.isEnabled();
      ui.gyro.setAttribute('aria-pressed', String(on));
      ui.gyro.classList.toggle('is-on', on);
    });
  }

  // ---------------------------------------------------------------
  // Pantalla de carga: no se revela nada hasta que la primera
  // panorámica está realmente cargada.
  // ---------------------------------------------------------------
  let progress = 0;
  const progressTimer = setInterval(() => {
    progress = Math.min(progress + Math.random() * 18 + 6, 90);
    ui.progress.style.width = progress + '%';
  }, 220);

  viewer.addEventListener('ready', () => {
    clearInterval(progressTimer);
    ui.progress.style.width = '100%';
    setTimeout(() => {
      containerEl.classList.add('is-ready');
      showRoomLabel(currentNodeId);
      markActiveRoom(currentNodeId);
    }, 320);
  }, { once: true });

  // ---------------------------------------------------------------
  // Picker
  // ---------------------------------------------------------------
  if (new URLSearchParams(location.search).get('debug') === '1') {
    containerEl.classList.add('is-debug');
    initPicker(containerEl, viewer, () => currentNodeId);
  }

  return {
    viewer,
    tour,
    autorotate,
    goTo: (nodeId) => tour.setCurrentNode(nodeId),
    destroy: () => { clearInterval(progressTimer); viewer.destroy(); containerEl.innerHTML = ''; },
  };
}
