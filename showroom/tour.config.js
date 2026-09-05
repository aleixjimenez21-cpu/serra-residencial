// =================================================================
// SERRA RESIDENCIAL — showroom 360 · CONFIGURACIÓN
// -----------------------------------------------------------------
// ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS TOCAR para cambiar textos,
// estancias, enlaces y ángulos. tour.js no contiene contenido.
//
// TODOS LOS ÁNGULOS ESTÁN EN GRADOS (no radianes):
//   yaw   =  giro horizontal.  0° = centro de la panorámica,
//            positivo hacia la derecha, negativo hacia la izquierda.
//            Rango útil: -180° .. 180°
//   pitch =  inclinación. 0° = horizonte, negativo = hacia el suelo.
//
// Para colocar los puntos: abre el tour con ?debug=1 y clica el
// suelo donde quieras la flecha. Ver README.md.
// =================================================================

export const ZONES = [
  { id: 'entrada',  name: 'Entrada' },
  { id: 'dia',      name: 'Zona de día' },
  { id: 'noche',    name: 'Zona de noche' },
  { id: 'servicio', name: 'Servicio' },
];

// -----------------------------------------------------------------
// AJUSTES GLOBALES DE LA EXPERIENCIA
// -----------------------------------------------------------------
export const SETTINGS = {
  // No dejar mirar en vertical hacia el suelo: tapa los artefactos del
  // nadir propios de panorámicas generadas. Es un mínimo, no un máximo:
  // la cámara no baja de aquí.
  minPitchDeg: -35,

  // Transición entre estancias.
  transitionMs: 800,
  transitionEffect: 'fade',      // 'fade' | 'black' | 'white' | 'none'
  // Autorrotación tras inactividad.
  autorotateDelayMs: 15000,
  autorotateSpeed: '0.3rpm',     // muy lenta, ambiental

  // Al llegar a una estancia SIEMPRE se vuelve a este zoom, aunque el
  // usuario viniera acercado. Así ninguna estancia aparece ampliada y
  // todas encuadran lo máximo posible de entrada.
  defaultZoomLvl: 0,             // 0 = máxima apertura, 100 = máximo acercamiento
  transitionZoomPush: 0,         // súbelo si quieres llegar algo más cerca
  minFov: 35,
  maxFov: 95,                    // apertura real del nivel 0

  roomLabelMs: 3000,             // cuánto dura el rótulo de estancia
  preloadNeighbours: true,

  // Aspecto de las flechas de suelo. La opacidad va horneada en el SVG
  // (es una textura sobre el plano del suelo, no se puede aplicar CSS).
  arrowSizePx: 52,
  arrowColor: '#ffffff',
  arrowOpacity: 0.32,            // en reposo; el plugin las agranda al pasar por encima
  // ESTE es el ángulo que importa para las flechas de suelo: desde qué
  // altura se mira el plano donde se apoyan. Poco ángulo (15-20) las
  // amontona a los pies; mucho (45+) las abre en círculo alrededor.
  arrowCameraPitchDeg: 45,
  arrowOverlapAngleDeg: 45,      // separación mínima entre dos flechas contiguas
  arrowPitchDeg: -20,            // pitch de un enlace (solo se usa en modo 2d)

  // A dónde vuelve el botón "Viviendas" (el selector de pisos).
  backUrl: '../index.html',
};

// -----------------------------------------------------------------
// VIVIENDAS
// -----------------------------------------------------------------
// initShowroom(el, viviendaId) usa la clave de este objeto. Para añadir
// una vivienda nueva: duplica el bloque, cambia `panoramaDir` y ajusta
// los enlaces. Ver README.md.
//
// Estructura de cada nodo:
//   id        identificador interno (no se muestra)
//   name      nombre visible en el selector y en el rótulo
//   zone      una de las ZONES de arriba
//   file      archivo dentro de panoramaDir
//   defaultYaw   hacia dónde mira la cámara al llegar SIN usar una
//                flecha (al abrir el tour o al saltar desde el selector)
//   links[]   flechas de salida:
//     to          nodo destino
//     yaw/pitch   DÓNDE se dibuja la flecha en esta estancia
//     arrivalYaw  hacia DÓNDE mira la cámara al llegar al destino
//                 por esta puerta concreta
//     label       texto del tooltip al pasar por encima (opcional)
// -----------------------------------------------------------------
export const VIVIENDAS = {
  // ---------------------------------------------------------------
  // Vivienda de demostración (el juego de panorámicas actual)
  // ---------------------------------------------------------------
  demo: {
    nombre: 'Vivienda tipo',
    subtitulo: '3 dormitorios · 2 baños · terraza',
    panoramaDir: 'assets/panoramas/',
    thumbDir: 'assets/panoramas/thumbs/',
    startNodeId: 'recibidor',

    nodes: [
      // -----------------------------------------------------------
      {
        id: 'recibidor',
        name: 'Recibidor',
        zone: 'entrada',
        file: 'recibidor.webp',
        defaultYaw: 100,                    // AJUSTAR CON EL PICKER
        links: [
          // El salón se ve por el hueco ancho de la derecha.
          { to: 'salon',    yaw: 100,  arrivalYaw: 0, label: 'Salón' },      // AJUSTAR CON EL PICKER
          // Las puertas del pasillo. Repartidas a lo largo del corredor:
          // afina cuál es cuál con el picker.
          { to: 'bano2',    yaw: -30,  arrivalYaw: 0, label: 'Baño secundario' }, // AJUSTAR CON EL PICKER
          { to: 'dorm3',    yaw: -78,  arrivalYaw: 0, label: 'Dormitorio 3' },    // AJUSTAR CON EL PICKER
          { to: 'dorm2',    yaw: -108, arrivalYaw: 0, label: 'Dormitorio 2' },    // AJUSTAR CON EL PICKER
          { to: 'dorm1',    yaw: -140, arrivalYaw: 0, label: 'Dormitorio principal' }, // AJUSTAR CON EL PICKER
          { to: 'lavadero', yaw: -170, arrivalYaw: 0, label: 'Lavadero' },        // AJUSTAR CON EL PICKER
        ],
      },

      // -----------------------------------------------------------
      {
        id: 'salon',
        name: 'Salón · Comedor · Cocina',
        zone: 'dia',
        file: 'salon.webp',
        defaultYaw: 0,                      // AJUSTAR CON EL PICKER
        links: [
          { to: 'recibidor', yaw: -162, arrivalYaw: 0, label: 'Recibidor' }, // AJUSTAR CON EL PICKER
          // LAS DOS CORREDERAS: dos enlaces distintos al MISMO nodo.
          // Cada una entra a la terraza por un punto distinto, así que
          // su arrivalYaw es diferente a propósito (si los dejas iguales
          // las dos puertas se sienten idénticas).
          { to: 'balcon', yaw: -11, arrivalYaw: 160,  label: 'Terraza · comedor' }, // aprox. mira a la mesa — AJUSTAR CON EL PICKER
          { to: 'balcon', yaw:  43, arrivalYaw: -150, label: 'Terraza · estar' },   // aprox. mira a las butacas — AJUSTAR CON EL PICKER
        ],
      },

      // -----------------------------------------------------------
      {
        id: 'balcon',
        name: 'Terraza',
        zone: 'dia',
        file: 'balcon.webp',
        defaultYaw: 0,                      // AJUSTAR CON EL PICKER
        links: [
          // Vuelta al salón por cada corredera, con llegada distinta.
          { to: 'salon', yaw: 158,  arrivalYaw: -20, label: 'Comedor' }, // aprox. entra por la zona de comedor — AJUSTAR CON EL PICKER
          { to: 'salon', yaw: -155, arrivalYaw: 70,  label: 'Salón' },   // aprox. entra por la zona de estar — AJUSTAR CON EL PICKER
        ],
      },

      // -----------------------------------------------------------
      {
        id: 'dorm1',
        name: 'Dormitorio principal',
        zone: 'noche',
        file: 'dorm1.webp',
        defaultYaw: 0,                      // AJUSTAR CON EL PICKER
        links: [
          { to: 'recibidor', yaw: -162, arrivalYaw: 0, label: 'Recibidor' },   // AJUSTAR CON EL PICKER
          { to: 'bano1',     yaw: -138, arrivalYaw: 0, label: 'Baño en suite' }, // AJUSTAR CON EL PICKER
        ],
      },

      // -----------------------------------------------------------
      {
        id: 'dorm2',
        name: 'Dormitorio 2',
        zone: 'noche',
        file: 'dorm2.webp',
        defaultYaw: 0,                      // AJUSTAR CON EL PICKER
        links: [
          { to: 'recibidor', yaw: -148, arrivalYaw: 0, label: 'Recibidor' }, // AJUSTAR CON EL PICKER
          { to: 'bano2',     yaw: -118, arrivalYaw: 0, label: 'Baño' },      // AJUSTAR CON EL PICKER
        ],
      },

      // -----------------------------------------------------------
      {
        id: 'dorm3',
        name: 'Dormitorio 3',
        zone: 'noche',
        file: 'dorm3.webp',
        defaultYaw: 0,                      // AJUSTAR CON EL PICKER
        links: [
          { to: 'recibidor', yaw: 145, arrivalYaw: 0, label: 'Recibidor' }, // AJUSTAR CON EL PICKER
        ],
      },

      // -----------------------------------------------------------
      {
        id: 'bano1',
        name: 'Baño principal',
        zone: 'noche',
        file: 'bano1.webp',
        defaultYaw: 55,                     // mira al lavabo/espejo, no a la puerta — AJUSTAR CON EL PICKER
        links: [
          { to: 'dorm1', yaw: -29, arrivalYaw: 0, label: 'Dormitorio principal' }, // AJUSTAR CON EL PICKER
        ],
      },

      // -----------------------------------------------------------
      {
        id: 'bano2',
        name: 'Baño secundario',
        zone: 'noche',
        file: 'bano2.webp',
        defaultYaw: 0,                      // AJUSTAR CON EL PICKER
        links: [
          // Este baño tiene dos puertas, una a cada lado de la panorámica.
          { to: 'recibidor', yaw: -170, arrivalYaw: 0, label: 'Recibidor' },   // AJUSTAR CON EL PICKER
          { to: 'dorm2',     yaw:  170, arrivalYaw: 0, label: 'Dormitorio 2' }, // AJUSTAR CON EL PICKER
        ],
      },

      // -----------------------------------------------------------
      {
        id: 'lavadero',
        name: 'Lavadero',
        zone: 'servicio',
        file: 'lavadero.webp',
        defaultYaw: 15,                     // mira a la lavadora, no a la puerta — AJUSTAR CON EL PICKER
        links: [
          { to: 'recibidor', yaw: 133, arrivalYaw: 0, label: 'Recibidor' }, // AJUSTAR CON EL PICKER
        ],
      },
    ],
  },
};

// Vivienda que se carga si no se indica ninguna en la URL (?vivienda=)
export const DEFAULT_VIVIENDA = 'demo';
