// =================================================================
// SERRA RESIDENCIAL — data.js
// -----------------------------------------------------------------
// Única fuente de datos de la app. Todo lo que no es un dato real
// del proyecto está marcado explícitamente como PLACEHOLDER en el
// propio dato (nunca se inventa un número o texto "a ojo").
//
// Dataset de viviendas confirmado con el usuario sobre las fotos
// reales: 15 viviendas · 4 plantas vendibles (PB, P1, P2, P3) +
// ROOFTOP (zona común, sin viviendas). NO son las "24 viviendas / 6
// niveles" de la biblia original (docs/Serra_Residencial_Master_
// Reference_DEFINITIVA.md) -- esa cifra quedó superada al validar
// el edificio contra las fotos reales durante esta sesión.
// =================================================================

// `pos` son porcentajes (left/top/width/height) relativos a la
// imagen NATURAL de frente.webp; layoutFachada() (building.js) los
// reproyecta según cómo quede recortada en cada pantalla -> funcionan
// igual en móvil y escritorio.
//
// Campos por vivienda:
//   letra, m2 (superficie construida), dorm, banos, precio, desc  -> datos reales, ya validados
//   terraza_m2      -> real, extraído del propio `desc` (balcón/jardín/patio)
//   orientacion     -> real: "Mar" para todas (biblia 0.b: la fachada principal, donde
//                      están estas plantas, mira al mar; no es un dato inventado)
//   tipologia       -> derivada de dorm (no inventada, solo formateada)
//   superficie_util -> PLACEHOLDER explícito: no existe ese dato todavía
//   estado          -> PLACEHOLDER explícito: 'disponible' por defecto (no hay datos de
//                      ventas reales); la estructura ya admite 'reservado' / 'vendido'
const PLANTAS = [
  {
    id: 'p3', numero: '3', label: 'PLANTA 3',
    pos: { left: 17.75, top: 25.94, width: 64.75, height: 11.88 },
    subtitulo: 'Última planta con vivienda, justo bajo el rooftop. Vistas despejadas.',
    units: [
      { letra: 'A', m2: 105, dorm: 3, banos: 2, precio: '525.000 €', desc: 'Balcón de 14 m², vistas despejadas al mar.', terraza_m2: 14, orientacion: 'Mar', tipologia: '3 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'B', m2: 100, dorm: 3, banos: 2, precio: '500.000 €', desc: 'Balcón de 12 m².', terraza_m2: 12, orientacion: 'Mar', tipologia: '3 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'C', m2: 100, dorm: 3, banos: 2, precio: '500.000 €', desc: 'Balcón de 12 m².', terraza_m2: 12, orientacion: 'Mar', tipologia: '3 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'D', m2: 105, dorm: 3, banos: 2, precio: '525.000 €', desc: 'Balcón de 14 m², vistas despejadas al mar.', terraza_m2: 14, orientacion: 'Mar', tipologia: '3 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
    ],
  },
  {
    id: 'p2', numero: '2', label: 'PLANTA 2',
    pos: { left: 17.75, top: 37.82, width: 64.75, height: 11.88 },
    subtitulo: 'Planta intermedia, balcones al mar.',
    units: [
      { letra: 'A', m2: 102, dorm: 3, banos: 2, precio: '470.000 €', desc: 'Balcón de 12 m² orientado al mar.', terraza_m2: 12, orientacion: 'Mar', tipologia: '3 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'B', m2: 98, dorm: 2, banos: 2, precio: '450.000 €', desc: 'Balcón de 10 m².', terraza_m2: 10, orientacion: 'Mar', tipologia: '2 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'C', m2: 98, dorm: 2, banos: 2, precio: '450.000 €', desc: 'Balcón de 10 m².', terraza_m2: 10, orientacion: 'Mar', tipologia: '2 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'D', m2: 102, dorm: 3, banos: 2, precio: '470.000 €', desc: 'Balcón de 12 m² orientado al mar.', terraza_m2: 12, orientacion: 'Mar', tipologia: '3 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
    ],
  },
  {
    id: 'p1', numero: '1', label: 'PLANTA 1',
    pos: { left: 17.75, top: 49.7, width: 64.75, height: 11.88 },
    subtitulo: 'Primera planta sobre el zócalo, balcones al mar.',
    units: [
      { letra: 'A', m2: 100, dorm: 3, banos: 2, precio: '445.000 €', desc: 'Balcón de 12 m² orientado al mar.', terraza_m2: 12, orientacion: 'Mar', tipologia: '3 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'B', m2: 96, dorm: 2, banos: 2, precio: '430.000 €', desc: 'Balcón de 10 m².', terraza_m2: 10, orientacion: 'Mar', tipologia: '2 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'C', m2: 96, dorm: 2, banos: 2, precio: '430.000 €', desc: 'Balcón de 10 m².', terraza_m2: 10, orientacion: 'Mar', tipologia: '2 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'D', m2: 100, dorm: 3, banos: 2, precio: '445.000 €', desc: 'Balcón de 12 m² orientado al mar.', terraza_m2: 12, orientacion: 'Mar', tipologia: '3 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
    ],
  },
  {
    id: 'pb', numero: 'Baja', label: 'PLANTA BAJA',
    pos: { left: 17.75, top: 61.65, width: 64.75, height: 24.81 },
    subtitulo: 'Acceso directo, jardín privado y plaza de parking en rampa lateral.',
    // Planta baja: solo 3 viviendas, no 4 -- la crujía central es el
    // portal de entrada, no una vivienda. `bays` describe las 4
    // franjas estructurales de izquierda a derecha; 'entrada' marca
    // cuál es el portal (sin panel, no seleccionable).
    bays: ['A', 'entrada', 'B', 'C'],
    units: [
      { letra: 'A', m2: 98, dorm: 2, banos: 2, precio: '410.000 €', desc: 'Jardín privado de 35 m², acceso directo.', terraza_m2: 35, orientacion: 'Mar', tipologia: '2 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'B', m2: 92, dorm: 2, banos: 2, precio: '395.000 €', desc: 'Patio privado de 18 m².', terraza_m2: 18, orientacion: 'Mar', tipologia: '2 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
      { letra: 'C', m2: 98, dorm: 2, banos: 2, precio: '410.000 €', desc: 'Jardín privado de 35 m², acceso directo.', terraza_m2: 35, orientacion: 'Mar', tipologia: '2 dormitorios', superficie_util: 'Pendiente de definir', estado: 'disponible' },
    ],
  },
];

// Nivel superior: solo zona común, sin viviendas -> panel distinto,
// sin "pop out" de crujías (no hay nada que elegir una a una).
const ROOFTOP = {
  id: 'rooftop', label: 'ROOFTOP',
  pos: { left: 19.5, top: 14.66, width: 60.5, height: 11.28 },
  desc: 'Zona común exclusiva de la comunidad, en la última planta del edificio. No incluye viviendas.',
  amenities: [
    'Piscina infinity en el borde marítimo',
    'Zona chill-out y solárium',
    'Jacuzzi',
    'Zona de barbacoa',
  ],
};

// -----------------------------------------------------------------
// Índice plano de todas las viviendas, con su planta ya resuelta --
// lo usan selector.js, comparator.js, ai-concierge.js y calculator.js
// para no tener que recorrer PLANTAS cada vez.
// -----------------------------------------------------------------
const ALL_UNITS = PLANTAS.flatMap((planta) =>
  planta.units.map((u) => ({ ...u, planta, id: `${planta.id}-${u.letra}` }))
);

function findUnitById(id) {
  return ALL_UNITS.find((u) => u.id === id);
}

// Etiquetas visibles para el campo `estado` -- una sola vez, para no
// repetir el texto en cada sitio que lo muestra (tarjetas, pop-out,
// panel, comparador).
const ESTADO_LABEL = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  vendido: 'Vendido',
};

// -----------------------------------------------------------------
// PROMOCIÓN — cifras reales del dataset ya validado. NO son las
// "24 viviendas / 6 plantas" del ejemplo de formato que dio el
// usuario (esa cifra es la de la biblia original, superada). Lo que
// no existe como dato real en el proyecto queda como placeholder
// explícito, con la estructura lista para rellenarlo.
// -----------------------------------------------------------------
const PROMO = {
  viviendas: ALL_UNITS.length, // 15, real (cuenta del propio dataset)
  plantas: PLANTAS.length,     // 4 plantas vendibles, real
  dormitorios: '2-3',          // real: rango real presente en ALL_UNITS
  rooftop: 'Piscina infinity, chill-out y jacuzzi', // real (ROOFTOP.amenities)
  garaje: 'Pendiente de definir',
  trasteros: 'Pendiente de definir',
  entrega: 'Pendiente de definir',
};

// -----------------------------------------------------------------
// CALIDADES — textos reales de la biblia (sección E: materiales y
// entorno). Donde la biblia no especifica la categoría, se deja el
// placeholder explícito en vez de inventar materiales/marcas.
// -----------------------------------------------------------------
const CALIDADES = [
  {
    categoria: 'Arquitectura',
    items: ['Prisma rectangular de líneas horizontales, sin curvas ni voladizos', 'Pilares de travertino claro de suelo a cubierta', 'Barandillas de vidrio transparente en balcones y rooftop'],
  },
  {
    categoria: 'Fachada y materiales',
    items: ['Blanco cálido mate', 'Travertino claro', 'Aluminio negro mate en carpinterías', 'Grandes ventanales de piedra clara'],
  },
  {
    categoria: 'Cocina',
    items: ['Pendiente de definir'],
  },
  {
    categoria: 'Baños',
    items: ['Pendiente de definir'],
  },
  {
    categoria: 'Climatización',
    items: ['Pendiente de definir'],
  },
  {
    categoria: 'Carpintería',
    items: ['Perfilería de aluminio negro mate', 'Grandes paños vidriados orientados al mar'],
  },
  {
    categoria: 'Eficiencia energética',
    items: ['Pendiente de definir'],
  },
  {
    categoria: 'Zonas comunes',
    items: ROOFTOP.amenities,
  },
];

// -----------------------------------------------------------------
// UBICACIÓN — único dato real disponible: la localidad (Reus, dada
// por el usuario). El resto queda con la interfaz preparada, sin
// inventar direcciones ni comercios concretos.
// -----------------------------------------------------------------
const UBICACION = {
  localidad: 'Reus',
  etiqueta: 'REUS · NUEVA PROMOCIÓN',
  categorias: [
    { nombre: 'Educación', items: [] },
    { nombre: 'Restauración', items: [] },
    { nombre: 'Transporte', items: [] },
    { nombre: 'Supermercados', items: [] },
    { nombre: 'Deporte', items: [] },
    { nombre: 'Salud', items: [] },
  ],
};
