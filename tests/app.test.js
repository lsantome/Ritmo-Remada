'use strict';
/* La app web: sintaxis, funcionamiento sin red, claves de almacenamiento con prefijo y puente nativo coherente. */
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const { read, pageScript } = require('./helpers');

test('el script de index.html compila', () => {
  new vm.Script(pageScript());
});

test('sin referencias a recursos externos (la app funciona sin red)', () => {
  const html = read('index.html');
  assert(!/(?:src|href)\s*=\s*["'](?:https?:)?\/\/[^"']+/i.test(html), 'src/href externo en index.html');
  assert(!/url\(\s*["']?(?:https?:)?\/\/[^)]+/i.test(html), 'url() externa en index.html');
  assert(!/@import\s+(?:url\()?["']?(?:https?:)?\/\//i.test(html), '@import externo en index.html');
});

test('las claves de almacenamiento llevan el prefijo propio (el origen lsantome.github.io se comparte con otras apps)', () => {
  const js = pageScript();
  const keys = new Set();
  for (const m of js.matchAll(/(?:local|session)Storage\.(?:get|set|remove)Item\(\s*['"]([^'"]+)['"]/g)) keys.add(m[1]);
  for (const m of js.matchAll(/\bKEY\s*=\s*['"]([^'"]+)['"]/g)) keys.add(m[1]);
  for (const m of js.matchAll(/indexedDB\.open\(\s*['"]([^'"]+)['"]/g)) keys.add(m[1]);
  assert(keys.size >= 1, 'no se encontró ninguna clave de almacenamiento');
  for (const k of keys) assert(k.startsWith('ritmo-remada'), 'clave sin prefijo propio: ' + k);
  /* La clave histórica no se renombra: hacerlo borraría los ajustes guardados de quien ya usa la app. */
  assert(keys.has('ritmo-remada-v1'));
});

test('el puente nativo de la página coincide con el plugin de Android', () => {
  const html = read('index.html');
  const java = read('android/app/src/main/java/es/trainera/ritmo/RitmoNativePlugin.java');
  assert(/Capacitor\.Plugins\.RitmoNative/.test(html));
  assert(/@CapacitorPlugin\(name\s*=\s*"RitmoNative"\)/.test(java));
  assert(/public void setTheme\(/.test(java));
  assert(/p\.setTheme\(\{dark:/.test(html));
});

test('dentro del APK no se registra el service worker', () => {
  const html = read('index.html');
  assert(/isNativePlatform/.test(html) && /RitmoRemadaApp/.test(html));
});

test('«Borrar todos» de los intervalos Pro: botón, bloqueo en sesión y red de seguridad (Deshacer)', () => {
  const html = read('index.html');
  const js = pageScript();
  assert(/<button[^>]*id="clearIv"/.test(html), 'falta el botón #clearIv');
  assert(/#proList\.locked[^{]*\.clr/.test(html), 'el botón no se bloquea con la sesión en marcha');
  assert(/function showUndo\(/.test(js) && /function hideUndo\(/.test(js), 'falta el «Deshacer»');
  assert(/getElementById|\$\('#clearIv'\)\.addEventListener\('click'/.test(js) && /if\(running\) return;/.test(js.slice(js.indexOf("$('#clearIv').addEventListener"))), 'el manejador no se protege con la sesión en marcha');
  /* la lista nunca queda vacía: el borrado deja un intervalo de partida, no un array vacío */
  assert(/S\.intervals=\[\{sec:IV_START\.sec,bpm:IV_START\.bpm\}\]/.test(js));
});
