// =================================================================
// SERRA RESIDENCIAL — utils.js
// Helpers compartidos por el resto de módulos. Se carga PRIMERO
// (antes que intro-sequence.js, que llama a isMobileDevice() nada
// más cargar la página para elegir el vídeo correcto).
// =================================================================

function isMobileDevice() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  const smallish = Math.min(window.innerWidth, window.innerHeight) <= 900;
  return (coarse || noHover) && smallish;
}

function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

// Formatea un número de euros al estilo "410.000 €" a partir de un
// entero (410000) -- para que los nuevos módulos (selector, comparador,
// calculadora) puedan mostrar precios sin repetir el string ya
// formateado que usa PLANTAS.
function formatEUR(n) {
  return n.toLocaleString('es-ES') + ' €';
}

// Extrae el número de euros de un string tipo "410.000 €" -> 410000.
// Los precios en PLANTAS están guardados como texto ya formateado
// (dato real, no se toca); esto permite ordenar/filtrar por precio
// sin duplicar el dato en dos formatos distintos.
function parseEUR(str) {
  return parseInt(String(str).replace(/[^\d]/g, ''), 10);
}
