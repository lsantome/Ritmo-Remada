'use strict';
/* PWA: manifest, service worker con prefijo propio, sellado de versión y salidas de build. */
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, read, exists } = require('./helpers');
const { stampIndex, stampSw, info } = require('../scripts/version');
const { build } = require('../scripts/build-lib');

const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('manifest.webmanifest'));
const sw = read('sw.js');

test('manifest: campos obligatorios', () => {
  for (const k of ['name', 'short_name', 'id', 'start_url', 'scope', 'display', 'icons']) assert(manifest[k], 'falta ' + k);
  assert.strictEqual(manifest.start_url, './');
  assert.strictEqual(manifest.scope, './');
});

test('manifest: id propio y estable (nunca «./» ni «/», que colisionan con otras PWA del mismo origen)', () => {
  assert(!['./', '/', '.'].includes(manifest.id), 'id genérico: ' + manifest.id);
  assert.strictEqual(manifest.id, 'ritmo-remada');
});

test('manifest: los iconos existen', () => {
  for (const i of manifest.icons) assert(exists(i.src), 'falta ' + i.src);
});

test('sw.js: sintaxis correcta', () => {
  new vm.Script(sw);
});

test('sw.js: la caché lleva el prefijo propio y al activarse solo borra cachés con ese prefijo', () => {
  assert(sw.includes(`const PREFIX = '${pkg.name}-';`), 'PREFIX debe ser «' + pkg.name + '-»');
  const m = sw.match(/^const VERSION = '([^']*)';/m);
  assert(m && m[1].startsWith(pkg.name + '-'), 'VERSION debe empezar por el prefijo');
  assert(/keys\.filter\(k => k\.startsWith\(PREFIX\) && k !== VERSION\)/.test(sw), 'el borrado debe filtrar por PREFIX');
  assert(!/keys\.filter\(k => k !== VERSION\)/.test(sw), 'no puede borrar cachés ajenas');
});

test('sw.js: todo lo que precachea existe', () => {
  const m = sw.match(/const ASSETS = \[([\s\S]*?)\];/);
  const files = (m[1].match(/'[^']+'/g) || []).map(s => s.slice(1, -1)).filter(f => f !== './');
  assert(files.length > 5);
  for (const f of files) assert(exists(f), 'precacheado pero no existe: ' + f);
});

test('sellado: pone versión, hash y fecha; y falla si no encuentra dónde', () => {
  const v = { name: pkg.name, version: '9.8.7', hash: 'abc1234', date: '2026-01-02', build: 'abc1234 · 2026-01-02' };
  const html = stampIndex(read('index.html'), v);
  assert(html.includes("const APP_VERSION = '9.8.7';") && html.includes("const APP_BUILD = 'abc1234 · 2026-01-02';"));
  assert(stampSw(sw, v).includes("const VERSION = 'ritmo-remada-abc1234';"));
  assert.throws(() => stampIndex('<script></script>', v), /APP_VERSION/);
  assert.throws(() => stampSw('// nada', v), /VERSION/);
});

test('sellado: la versión de package.json es semver y el hash tiene 7 caracteres (o «local»)', () => {
  const v = info();
  assert(/^\d+\.\d+\.\d+$/.test(v.version));
  assert(/^[0-9a-f]{7}$|^local$/.test(v.hash));
});

test('build:pwa: genera dist/site con service worker y versión sellada', () => {
  const { out, version } = build('site', true);
  assert(fs.existsSync(path.join(out, 'sw.js')));
  assert(fs.readFileSync(path.join(out, 'index.html'), 'utf8').includes(`const APP_VERSION = '${version.version}';`));
  assert(fs.readFileSync(path.join(out, 'sw.js'), 'utf8').includes(`const VERSION = '${pkg.name}-${version.hash}';`));
});

test('build:android-web: genera dist/app sin service worker', () => {
  const { out } = build('app', false);
  assert(!fs.existsSync(path.join(out, 'sw.js')));
  assert(fs.existsSync(path.join(out, 'index.html')));
});
