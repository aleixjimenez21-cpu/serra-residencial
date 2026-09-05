// =================================================================
// SERRA RESIDENCIAL — nav-shell.js
// Sidebar de navegación (app, no web tradicional) + drawer genérico
// reutilizable para las secciones que no son "ver una vivienda"
// (eso ya tiene su propio panel en unit-panel.js). Cada fase nueva
// registra su contenido en SECTION_RENDERERS sin tener que tocar
// este archivo.
// =================================================================
const sectionDrawer         = document.getElementById('section-drawer');
const sectionDrawerBody     = document.getElementById('section-drawer-body');
const sectionDrawerBackdrop = document.getElementById('section-drawer-backdrop');
const sectionDrawerClose    = document.getElementById('section-drawer-close');
const appSidebar            = document.getElementById('app-sidebar');
const sidebarToggle         = document.getElementById('sidebar-toggle');
const topActions            = document.getElementById('top-actions');
const topContactBtn         = document.getElementById('top-contact-btn');
const exploreHint           = document.getElementById('explore-hint');
const floorSelector         = document.getElementById('floor-selector');

// Cada módulo (selector.js, comparator.js, calculator.js...) registra
// aquí su función de render: SECTION_RENDERERS.viviendas = (el) => {...}
const SECTION_RENDERERS = {};

function setActiveSidebarItem(key) {
  appSidebar.querySelectorAll('.sidebar-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === key);
  });
}

function openDrawer(sectionKey) {
  if (typeof closePanel === 'function') closePanel(); // no dos paneles a la vez
  const renderer = SECTION_RENDERERS[sectionKey];
  sectionDrawerBody.innerHTML = '';
  if (renderer) {
    renderer(sectionDrawerBody);
  } else {
    sectionDrawerBody.innerHTML = '<p class="drawer-placeholder">Esta sección estará disponible en breve.</p>';
  }
  sectionDrawer.classList.add('open');
  sectionDrawerBackdrop.classList.add('open');
  sectionDrawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setActiveSidebarItem(sectionKey);
}

function closeDrawer() {
  sectionDrawer.classList.remove('open');
  sectionDrawerBackdrop.classList.remove('open');
  sectionDrawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setActiveSidebarItem(null);
}

sectionDrawerClose.addEventListener('click', closeDrawer);
sectionDrawerBackdrop.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});

sidebarToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  appSidebar.classList.toggle('expanded');
});

// En móvil el menú abierto es un panel que tapa media pantalla: se
// cierra al tocar fuera, como cualquier panel de móvil.
document.addEventListener('click', (e) => {
  if (!appSidebar.classList.contains('expanded')) return;
  if (appSidebar.contains(e.target)) return;
  appSidebar.classList.remove('expanded');
});
topContactBtn.addEventListener('click', () => { if (typeof openContactModal === 'function') openContactModal(); });

appSidebar.querySelectorAll('.sidebar-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.section;
    // Elegida una sección, el menú se recoge: en móvil ocupa media
    // pantalla y taparía justo lo que se acaba de abrir.
    appSidebar.classList.remove('expanded');

    if (key === 'explorar') {
      closeDrawer();
      if (typeof closePanel === 'function') closePanel();
      if (typeof collapsePopped === 'function') collapsePopped();
      return;
    }
    if (key === 'asistente') {
      closeDrawer();
      if (typeof openAIConcierge === 'function') openAIConcierge();
      return;
    }
    if (key === 'contacto') {
      closeDrawer();
      if (typeof openContactModal === 'function') openContactModal();
      return;
    }
    if (key === 'comparador') {
      // La tabla comparativa necesita más ancho que un drawer lateral
      // -> su propio overlay (comparator.js), no el genérico.
      if (typeof openComparator === 'function') openComparator();
      return;
    }
    openDrawer(key);
  });
});

// Llamado desde intro-sequence.js (revealFrenteInteractive) en cuanto
// la vista interactiva está lista -- solo entonces tiene sentido
// mostrar la navegación de la app.
function onAppReady() {
  appSidebar.classList.remove('hidden');
  document.getElementById('view-controls').classList.remove('hidden');
  topActions.classList.remove('hidden');
  exploreHint.classList.remove('hidden');
  floorSelector.classList.remove('hidden');
  if (typeof renderFloorSelector === 'function') renderFloorSelector();
}
