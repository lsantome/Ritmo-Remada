'use strict';
/* Lógica común de los dos builds: copia los archivos de la app a una carpeta de salida y sella la versión. */
const fs = require('fs');
const path = require('path');
const { ROOT, info, stampIndex, stampSw } = require('./version');

const DIRS = ['icons', 'fonts'];

/* withSw=true  → PWA (dist/site): incluye el service worker.
   withSw=false → APK (dist/app): los archivos ya van dentro de la app, no hay service worker. */
function build(outName, withSw) {
  const out = path.join(ROOT, 'dist', outName);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const v = info();

  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  fs.writeFileSync(path.join(out, 'index.html'), stampIndex(read('index.html'), v));
  fs.copyFileSync(path.join(ROOT, 'manifest.webmanifest'), path.join(out, 'manifest.webmanifest'));
  if (withSw) {
    fs.writeFileSync(path.join(out, 'sw.js'), stampSw(read('sw.js'), v));
    /* Política de privacidad: solo en el sitio web (Google Play pide una URL pública). No va en el APK. */
    fs.copyFileSync(path.join(ROOT, 'privacidad.html'), path.join(out, 'privacidad.html'));
  }
  for (const d of DIRS) fs.cpSync(path.join(ROOT, d), path.join(out, d), { recursive: true });

  /* Todo lo que precachea el service worker debe existir y no estar vacío. */
  const required = ['index.html', 'manifest.webmanifest'];
  if (withSw) {
    const m = read('sw.js').match(/const ASSETS = \[([\s\S]*?)\];/);
    if (!m) throw new Error('No se encontró ASSETS en sw.js');
    for (const s of m[1].match(/'[^']+'/g) || []) {
      const f = s.slice(1, -1);
      if (f !== './') required.push(f);
    }
    required.push('sw.js', 'privacidad.html');
  }
  for (const f of required) {
    const p = path.join(out, f);
    if (!fs.existsSync(p) || fs.statSync(p).size === 0) throw new Error('Falta o está vacío en la salida: ' + f);
  }
  console.log('OK dist/' + outName + ' → v' + v.version + ' · build ' + v.build);
  return { out, version: v };
}

module.exports = { build };
