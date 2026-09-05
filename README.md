# Serra Residencial

Showroom web de una promoción de obra nueva. El visitante entra por una
secuencia cinematográfica, llega al edificio y lo explora planta a planta:
elige una vivienda, compara opciones, calcula la hipoteca y recorre el
interior en un tour 360.

Sitio estático: HTML, CSS y JavaScript sin framework, sin dependencias y sin
paso de compilación.

---

## Qué hay dentro

| Zona | Descripción |
|---|---|
| Entrada | Carga → vídeo intro → descenso → guía de llegada → fachada interactiva |
| Edificio | 4 plantas con vivienda + rooftop. Hover y clic sobre la fachada real |
| Viviendas | 15 viviendas con superficie, tipología, terraza, precio y disponibilidad |
| Comparador | Hasta 3 viviendas lado a lado |
| Financiación | Calculadora de cuota hipotecaria |
| Asistente | Consultas en lenguaje natural (por palabras clave, sin backend) |
| Tour 360 | Visita del interior, estancia por estancia — ver [`showroom/`](showroom/) |

---

## Verlo en local

La web principal se abre con doble clic en `index.html`.

**El tour 360 (`showroom/`) necesita un servidor**, porque usa módulos ES y
texturas WebGL, y el navegador bloquea ambas cosas desde `file://`. Va incluido
uno mínimo, sin dependencias:

```bash
node showroom/serve.js
```

- Web: http://localhost:8080/
- Tour 360: http://localhost:8080/showroom/
- Colocar hotspots del tour: http://localhost:8080/showroom/?debug=1

Detalles del tour en [`showroom/README.md`](showroom/README.md).

---

## Estructura

```
index.html          Página principal
style.css           Estilos de la web
js/                 Un archivo por módulo, cargados en orden por <script>
  data.js             Datos de viviendas, promoción y calidades
  intro-sequence.js   Secuencia de entrada (vídeos y fundidos)
  building.js         Zonas interactivas sobre la fachada
  unit-panel.js       Panel contextual de planta y vivienda
  nav-shell.js        Navegación lateral y drawer de secciones
  selector.js         Listado filtrable de viviendas
  comparator.js       Comparador
  calculator.js       Hipoteca
  ai-concierge.js     Asistente
  tutorial.js         Onboarding interactivo
showroom/           Tour 360 del interior (Photo Sphere Viewer)
netlify.toml        Configuración de publicación y caché
```

Los archivos `js/*.js` son scripts clásicos, no módulos: comparten ámbito
global y **el orden de carga en `index.html` importa**.

---

## Publicación

Cada `git push` a `main` despliega automáticamente en Netlify. No hay comando
de build: se publica el contenido del repositorio tal cual.
