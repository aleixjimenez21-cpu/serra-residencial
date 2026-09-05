# Showroom 360 — Serra Residencial

Tour virtual del interior de la vivienda. Se entra desde el selector de pisos y
se recorre estancia por estancia con puntos de salto apoyados en el suelo.

Construido sobre [Photo Sphere Viewer 5](https://photo-sphere-viewer.js.org/)
(`VirtualTourPlugin`, `MarkersPlugin`, `AutorotatePlugin`, `GyroscopePlugin`),
cargado por CDN. HTML + CSS + JS vanilla, sin framework y sin build step.

---

## Cómo arrancarlo

**Esta página necesita `http://`. No funciona con doble clic sobre el archivo.**

No es una decisión de diseño, son dos límites del navegador:

1. Photo Sphere Viewer 5 solo se publica como módulos ES (no existe build UMD),
   y los módulos no se cargan desde `file://`.
2. Aunque se cargaran, WebGL no acepta como textura una imagen local abierta
   desde `file://`.

El resto de la web (`web/index.html`) sí sigue funcionando con doble clic; solo
el tour necesita servidor. Va incluido uno mínimo, sin dependencias:

```bash
node showroom/serve.js
```

- Web:      http://localhost:8080/
- Showroom: http://localhost:8080/showroom/
- Picker:   http://localhost:8080/showroom/?debug=1

Sirve la carpeta `web/` entera, así que el botón **Viviendas** del tour vuelve
correctamente al selector de pisos.

---

## Archivos

```
showroom/
  index.html          Shell: importmap de las dependencias + arranque
  tour.config.js      ← LO ÚNICO QUE HAY QUE TOCAR (estancias, enlaces, ángulos, textos)
  tour.js             Lógica: visor, interfaz, llegadas por puerta, picker
  tour.css            Estilos
  serve.js            Servidor estático mínimo para desarrollo
  assets/panoramas/         Panorámicas equirectangulares 2:1
  assets/panoramas/thumbs/  Versión de 1024px (fondo de la pantalla de carga)
```

`initShowroom(containerEl, viviendaId)` está exportada desde `tour.js`, así que
el tour se puede embeber en cualquier página, no solo en este `index.html`.

---

## Colocar los hotspots con el picker

Los ángulos iniciales del repositorio son **aproximados**. Para afinarlos:

1. Abre **http://localhost:8080/showroom/?debug=1**
2. Ve a la estancia que quieras ajustar.
3. **Clica el suelo** donde quieras que aparezca la flecha. El panel te da la
   línea ya formateada:
   ```js
   { to: 'DESTINO', yaw: 102.2, pitch: -16.1, arrivalYaw: 0 },
   ```
4. Pégala en el array `links` de esa estancia en `tour.config.js` y cambia
   `'DESTINO'` por el id del nodo al que lleva.
5. Para el **ángulo de llegada**: colócate mirando hacia donde quieres que mire
   la cámara al entrar por esa puerta y copia el valor de **Vista actual**
   (`arrivalYaw`). El mismo valor sirve como `defaultYaw` de la estancia.

Notas:

- Los ángulos de la configuración están en **grados**, no en radianes.
- En modo picker, si clicas justo encima de una flecha saltarás de estancia
  (la flecha sigue siendo un botón). Clica sobre suelo libre.
- El `pitch` de cada enlace solo se usa en modo de render `2d`. Con las flechas
  de suelo (`3d`, el modo actual) la altura la manda `arrowCameraPitchDeg`
  en `SETTINGS` — ver más abajo.

---

## El grafo de estancias

Cada nodo declara **sus propios enlaces de salida**. Las conexiones son
bidireccionales, pero cada sentido se escribe a mano porque cada uno tiene su
posición y su ángulo de llegada distintos. Si te dejas una vuelta, la consola
te avisa al cargar:

```
[showroom] Revisa el grafo en tour.config.js:
  - "dorm1" -> "bano1" no tiene vuelta ("bano1" -> "dorm1")
```

Grafo actual:

```
recibidor ↔ salon, dorm1, dorm2, dorm3, lavadero, bano2
salon     ↔ balcon  (corredera del comedor)
salon     ↔ balcon  (corredera del salón — segundo enlace al mismo nodo)
dorm1     ↔ bano1   (en suite)
dorm2     ↔ bano2
```

**Las dos correderas** son el caso interesante: dos enlaces distintos al mismo
nodo `balcon`, cada uno con su `arrivalYaw`, de modo que entrar por una te deja
mirando a la mesa y por la otra a las butacas. Funciona igual en la vuelta.

---

## Añadir una vivienda nueva

1. Copia las panorámicas (equirectangulares, ratio 2:1) a
   `assets/panoramas/<vivienda>/` con nombres ASCII, sin acentos ni espacios.
2. Genera las miniaturas de 1024px en `assets/panoramas/<vivienda>/thumbs/`.
3. En `tour.config.js`, duplica el bloque `demo` dentro de `VIVIENDAS`:

```js
export const VIVIENDAS = {
  demo: { ... },

  'piso-3a': {
    nombre: 'Vivienda 3ºA',
    subtitulo: '2 dormitorios · 98 m²',
    panoramaDir: 'assets/panoramas/piso-3a/',
    thumbDir: 'assets/panoramas/piso-3a/thumbs/',
    startNodeId: 'recibidor',
    nodes: [ /* ... */ ],
  },
};
```

4. Se abre con `showroom/?vivienda=piso-3a`.

Desde el selector de pisos basta con enlazar a esa URL.

---

## Ajustes (`SETTINGS` en `tour.config.js`)

| Ajuste | Qué hace |
|---|---|
| `minPitchDeg` | Tope inferior de la cámara (`-35`): no se puede mirar al suelo bajo los pies. Tapa los artefactos del nadir. |
| `arrowCameraPitchDeg` | **El ángulo importante de las flechas.** Desde qué altura se ve el plano donde se apoyan. Poco (15-20) las amontona a los pies; mucho (45+) las abre en círculo. |
| `arrowOverlapAngleDeg` | Separación mínima entre dos flechas contiguas. |
| `arrowColor` / `arrowOpacity` / `arrowSizePx` | Aspecto de la flecha. La opacidad va horneada en el SVG porque es una textura, no un elemento con CSS. El dibujo lleva sombra de contacto y contorno oscuro para leerse igual sobre suelo claro que oscuro. |
| `defaultZoomLvl` | Zoom con el que se entra a **todas** las estancias (`0` = máxima apertura). Se reaplica en cada salto, así que nunca se acumula acercamiento de una estancia a la siguiente. |
| `transitionMs` / `transitionEffect` / `transitionZoomPush` | Fundido entre estancias y, si lo subes, llegada algo más cerca que `defaultZoomLvl`. |
| `autorotateDelayMs` / `autorotateSpeed` | Autorrotación tras inactividad. |
| `roomLabelMs` | Cuánto dura el rótulo de estancia. |
| `backUrl` | A dónde vuelve el botón **Viviendas**. |

---

## Notas sobre los assets

- Las 9 panorámicas son **1774×887**. Es una resolución baja para un 360: se ve
  correcta en móvil y aceptable en escritorio, pero pierde nitidez al acercar el
  zoom. Si en algún momento se regeneran a 4096×2048, entran sin tocar el código
  (mismos nombres de archivo).
- `cocina.png` del juego original **no está en el tour**: es 16:9, un render
  normal, no una panorámica equirectangular. El salón, el comedor y la cocina
  son un espacio abierto y ya se recorren desde el nodo `salon`.
- Las miniaturas de `thumbs/` se usan como fondo desenfocado de la pantalla de
  carga (color y ambiente desde el primer fotograma en vez de un negro plano).
  La precarga de las estancias vecinas la hace el propio plugin (`preload`).
