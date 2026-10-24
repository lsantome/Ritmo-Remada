'use strict';
/* Versión única de la app: package.json (semver) + hash corto del commit + fecha de la construcción.
   Se sella en index.html (APP_VERSION / APP_BUILD) y en sw.js (nombre de la caché). */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

function info() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  let hash = (process.env.GITHUB_SHA || '').slice(0, 7);
  if (!hash) {
    try { hash = execSync('git rev-parse --short=7 HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { /* sin git */ }
  }
  if (!/^[0-9a-f]{7}$/.test(hash)) hash = 'local';
  const date = new Date().toISOString().slice(0, 10);
  return { name: pkg.name, version: pkg.version, hash, date, build: hash + ' · ' + date };
}

/* Sustituye una vez; si el patrón no existe se detiene: publicar sin versión haría imposible saber qué se ejecuta. */
function replaceOnce(text, re, make, what) {
  if (!re.test(text)) throw new Error('No se pudo sellar la versión: falta ' + what);
  return text.replace(re, make);
}

function stampIndex(html, v) {
  html = replaceOnce(html, /^const APP_VERSION = '[^']*';/m, () => "const APP_VERSION = '" + v.version + "';", 'APP_VERSION en index.html');
  html = replaceOnce(html, /^const APP_BUILD = '[^']*';/m, () => "const APP_BUILD = '" + v.build + "';", 'APP_BUILD en index.html');
  return html;
}

function stampSw(js, v) {
  return replaceOnce(js, /^const VERSION = '[^']*';.*$/m, () => "const VERSION = '" + v.name + '-' + v.hash + "';", 'VERSION en sw.js');
}

module.exports = { ROOT, info, stampIndex, stampSw };

if (require.main === module) console.log(JSON.stringify(info()));
