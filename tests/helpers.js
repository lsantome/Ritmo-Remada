'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = f => fs.existsSync(path.join(ROOT, f));

/* Último <script> de index.html (la lógica de la app). */
function pageScript() {
  const m = read('index.html').match(/<script>([\s\S]*?)<\/script>/g);
  if (!m) throw new Error('index.html no tiene <script>');
  return m[m.length - 1].replace(/^<script>|<\/script>$/g, '');
}

/* Bloque de planificadores de audio (normal y Pro) delimitado en index.html. */
function schedulerFactory(name) {
  const m = read('index.html').match(/\/\*SCHED-START\*\/([\s\S]*?)\/\*SCHED-END\*\//);
  if (!m) throw new Error('No se encuentra el bloque SCHED-START/SCHED-END en index.html');
  return new Function(m[1] + '; return ' + name + ';')();
}

module.exports = { ROOT, read, exists, pageScript, schedulerFactory };
