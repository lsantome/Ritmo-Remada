'use strict';
/* Idiomas (español / inglés): diccionarios completos y coherentes, detección del idioma del dispositivo y uso correcto de las claves. */
const test = require('node:test');
const assert = require('node:assert');
const { read, pageScript } = require('./helpers');

function bloque() {
  const m = read('index.html').match(/\/\*I18N-START\*\/([\s\S]*?)\/\*I18N-END\*\//);
  if (!m) throw new Error('No se encuentra el bloque I18N-START/I18N-END en index.html');
  return new Function(m[1] + '; return { I18N: I18N, pickLang: pickLang, fillTpl: fillTpl };')();
}
const { I18N, pickLang, fillTpl } = bloque();
const marcadores = s => (s.match(/\{\w+\}/g) || []).sort().join(',');

test('español e inglés tienen exactamente las mismas claves', () => {
  const es = Object.keys(I18N.es).sort(), en = Object.keys(I18N.en).sort();
  assert.deepStrictEqual(en.filter(k => !es.includes(k)), [], 'claves solo en inglés');
  assert.deepStrictEqual(es.filter(k => !en.includes(k)), [], 'claves solo en español (falta traducir)');
});

test('ninguna traducción está vacía y los marcadores {x} coinciden en los dos idiomas', () => {
  for (const k of Object.keys(I18N.es)) {
    assert(I18N.es[k].trim() && I18N.en[k].trim(), 'texto vacío en la clave ' + k);
    assert.strictEqual(marcadores(I18N.en[k]), marcadores(I18N.es[k]), 'marcadores distintos en la clave ' + k);
  }
});

test('el inglés está realmente traducido (no es una copia del español), salvo textos idénticos a propósito', () => {
  const iguales = Object.keys(I18N.es).filter(k => I18N.es[k] === I18N.en[k]).sort();
  /* «Total {d}» se escribe igual en ambos idiomas. Cualquier otra coincidencia es una traducción olvidada. */
  assert.deepStrictEqual(iguales, ['total']);
});

test('detección del idioma del dispositivo: español solo si el dispositivo lo prefiere; si no, inglés', () => {
  const casos = [
    [['es-ES'], 'es'], [['es'], 'es'], [['es-MX'], 'es'], [['es-419'], 'es'], [['ES'], 'es'], [['es_AR'], 'es'],
    [['en-US'], 'en'], [['en-GB'], 'en'], [['fr-FR'], 'en'], [['de'], 'en'], [['pt-BR'], 'en'], [['zh-CN'], 'en'],
    [[], 'en'], [[''], 'en'], [[undefined], 'en'], [['esperanto'], 'en'], [['eo'], 'en'],
    [['ca-ES', 'es-ES'], 'es'],            // catalán con español como segunda lengua → español
    [['fr-FR', 'en-US', 'es-ES'], 'en'],   // gana el primero de la lista que sea español o inglés
    [['es-ES', 'en-US'], 'es'], [['en-US', 'es-ES'], 'en'],
  ];
  for (const [lista, esperado] of casos) assert.strictEqual(pickLang(lista), esperado, JSON.stringify(lista));
});

test('fillTpl sustituye marcadores y deja intactos los desconocidos', () => {
  assert.strictEqual(fillTpl('Intervalo {k} de {n}', { k: 2, n: 5 }), 'Intervalo 2 de 5');
  assert.strictEqual(fillTpl('{v} s', { v: '1,25' }), '1,25 s');
  assert.strictEqual(fillTpl('Hola {x}', {}), 'Hola {x}');
  assert.strictEqual(fillTpl('Sin marcadores'), 'Sin marcadores');
});

test('todas las claves usadas en la página existen en los diccionarios', () => {
  const html = read('index.html'), js = pageScript();
  const usadas = new Set();
  for (const m of html.matchAll(/data-i18n(?:-aria)?="(\w+)"/g)) usadas.add(m[1]);
  for (const m of js.matchAll(/\bt\('(\w+)'/g)) usadas.add(m[1]);
  for (const m of js.matchAll(/t\(\w+\?'(\w+)':'(\w+)'/g)) { usadas.add(m[1]); usadas.add(m[2]); }
  for (const m of js.matchAll(/t\(field==='sec'\?'(\w+)':'(\w+)'/g)) { usadas.add(m[1]); usadas.add(m[2]); }
  assert(usadas.size > 40, 'se esperaban muchas claves en uso, hay ' + usadas.size);
  for (const k of usadas) assert(k in I18N.es, 'clave usada pero sin definir: ' + k);
});

test('toda clave definida se usa en alguna parte (sin textos huérfanos)', () => {
  const html = read('index.html'), js = pageScript();
  const huerfanas = Object.keys(I18N.es).filter(k => !new RegExp("data-i18n(?:-aria)?=\"" + k + "\"|'" + k + "'").test(html + js.replace(/var I18N=\{[\s\S]*?\n\};/, '')));
  assert.deepStrictEqual(huerfanas, []);
});

test('el selector de idioma guarda la preferencia en el ajuste existente, sin renombrar la clave histórica', () => {
  const js = pageScript();
  assert(/KEY='ritmo-remada-v1'/.test(js));
  assert(/lang:'auto'/.test(js), 'el valor por defecto debe ser «auto» (el idioma del dispositivo)');
  assert(/o\.lang==='es'\|\|o\.lang==='en'/.test(js), 'solo se aceptan «es» y «en» al leer lo guardado');
  for (const id of ['langAuto', 'langEs', 'langEn']) assert(new RegExp('id="' + id + '"').test(read('index.html')), 'falta el botón #' + id);
});

test('la ruta interna de Ajustes (#ajustes) no se traduce: la usan el botón Atrás y las pruebas', () => {
  assert(/location\.hash==='#ajustes'/.test(pageScript()));
});
