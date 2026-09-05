// =================================================================
// Servidor estático mínimo (sin dependencias) para el showroom 360.
// -----------------------------------------------------------------
// Hace falta porque el tour usa módulos ES y texturas WebGL, y el
// navegador bloquea ambas cosas cuando la página se abre con doble
// clic (file://). El resto de la web sí funciona con doble clic.
//
//   node showroom/serve.js            -> http://localhost:8080
//   node showroom/serve.js 3000       -> otro puerto
//
// Sirve la carpeta web/ entera, así que el botón "Viviendas" del tour
// vuelve correctamente al selector de pisos.
// =================================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..'); // carpeta web/
const PORT = parseInt(process.argv[2], 10) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';

  // No dejar salir de web/ con ../
  const file = path.join(ROOT, path.normalize(rel).replace(/^([/\\])+/, ''));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 · no encontrado: ' + rel);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  Serra Residencial\n`);
  console.log(`  Web:      http://localhost:${PORT}/`);
  console.log(`  Showroom: http://localhost:${PORT}/showroom/`);
  console.log(`  Picker:   http://localhost:${PORT}/showroom/?debug=1\n`);
});
