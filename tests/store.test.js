'use strict';
/* Material de Google Play (store/ y privacidad.html): límites de la ficha, tamaños de las imágenes y coherencia con la app. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { ROOT, read, exists } = require('./helpers');

const LIMITES = { nombre: 30, breve: 80, completa: 4000, novedades: 500 };

/* Lee los bloques ```text de cada sección «### …» de store/ficha-play-store.md, agrupados por idioma (## Español / ## English). */
function ficha() {
  const md = read('store/ficha-play-store.md');
  const idiomas = { es: md.match(/## Español[\s\S]*?(?=\n## English)/), en: md.match(/## English[\s\S]*?(?=\n## Datos de la app)/) };
  const salida = {};
  for (const [id, m] of Object.entries(idiomas)) {
    assert(m, 'falta la sección de ' + id + ' en store/ficha-play-store.md');
    const campos = [...m[0].matchAll(/### (.+)\n```text\n([\s\S]*?)\n```/g)].map(x => x[2]);
    assert.strictEqual(campos.length, 4, 'se esperaban 4 campos (nombre, breve, completa, novedades) en ' + id);
    salida[id] = { nombre: campos[0], breve: campos[1], completa: campos[2], novedades: campos[3] };
  }
  return salida;
}

function dimensionesPng(f) {
  const b = fs.readFileSync(path.join(ROOT, f));
  assert.strictEqual(b.subarray(1, 4).toString(), 'PNG', f + ' no es un PNG');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] };
}

test('la ficha respeta los límites de Google Play en español e inglés', () => {
  const f = ficha();
  for (const id of ['es', 'en']) {
    for (const [campo, max] of Object.entries(LIMITES)) {
      const n = [...f[id][campo]].length;
      assert(n > 0 && n <= max, `${id}/${campo}: ${n} caracteres (máximo ${max})`);
    }
  }
});

test('el nombre de la ficha es el de la app en los dos idiomas', () => {
  const f = ficha(), cap = JSON.parse(read('capacitor.config.json'));
  assert.strictEqual(f.es.nombre, cap.appName);
  assert.strictEqual(f.en.nombre, cap.appName);
});

test('la ficha nombra el botón «Borrar todos» / «Clear all» tal como aparece en la app', () => {
  const m = read('index.html').match(/\/\*I18N-START\*\/([\s\S]*?)\/\*I18N-END\*\//);
  const { I18N } = new Function(m[1] + '; return { I18N: I18N };')();
  const f = ficha();
  assert(f.es.completa.includes(I18N.es.clearAll), 'la ficha en español no menciona «' + I18N.es.clearAll + '»');
  assert(f.en.completa.includes(I18N.en.clearAll), 'la ficha en inglés no menciona «' + I18N.en.clearAll + '»');
  assert(f.es.completa.includes(I18N.es.undo) && f.en.completa.includes(I18N.en.undo));
});

test('la ficha no promete nada que la app no hace: sin anuncios ni cuentas, y avisa de la limitación del audio', () => {
  const f = ficha();
  assert(/sin anuncios/i.test(f.es.completa) && /no ads/i.test(f.en.completa));
  assert(/pantalla/i.test(f.es.completa) && /segundo plano/i.test(f.es.completa), 'falta el aviso del audio en segundo plano (es)');
  assert(/background/i.test(f.en.completa), 'falta el aviso del audio en segundo plano (en)');
});

test('imágenes de la ficha: icono 512×512, gráfico 1024×500 y capturas de móvil válidas', () => {
  const icono = dimensionesPng('store/icono-512.png');
  assert.deepStrictEqual([icono.w, icono.h], [512, 512]);
  assert(fs.statSync(path.join(ROOT, 'store/icono-512.png')).size <= 1024 * 1024, 'el icono supera 1 MB');
  const grafico = dimensionesPng('store/grafico-funciones-1024x500.png');
  assert.deepStrictEqual([grafico.w, grafico.h], [1024, 500]);
  assert.notStrictEqual(grafico.colorType, 6, 'el gráfico no debe tener canal alfa');
  const capturas = fs.readdirSync(path.join(ROOT, 'store')).filter(n => /^captura-(es|en)-.+\.png$/.test(n));
  assert(capturas.filter(n => n.startsWith('captura-es-')).length >= 2, 'Play pide al menos 2 capturas');
  assert(capturas.filter(n => n.startsWith('captura-en-')).length >= 2, 'la traducción al inglés necesita al menos 2 capturas');
  for (const n of capturas) {
    const d = dimensionesPng('store/' + n);
    assert(Math.min(d.w, d.h) >= 320 && Math.max(d.w, d.h) <= 3840, n + ': lados fuera de 320–3840 px');
    assert(Math.max(d.w, d.h) <= 2 * Math.min(d.w, d.h), n + ': proporción mayor de 2:1');
    assert.notStrictEqual(d.colorType, 6, n + ' tiene canal alfa');
  }
});

test('privacidad.html: bilingüe, sin recursos externos y coherente con la ficha', () => {
  const p = read('privacidad.html');
  assert(/<section id="es" lang="es">/.test(p) && /<section id="en" lang="en">/.test(p), 'faltan las dos secciones de idioma');
  assert(p.includes('es.trainera.ritmo'), 'debe nombrar el paquete');
  const externos = [...p.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map(m => m[1]).filter(u => !u.startsWith('https://lsantome.github.io/Ritmo-Remada/'));
  assert.deepStrictEqual(externos, [], 'la política no debe cargar ni enlazar recursos externos');
  assert(!/<script|<img|<link/i.test(p), 'la política es una página estática sin scripts ni imágenes');
  assert(read('store/ficha-play-store.md').includes('https://lsantome.github.io/Ritmo-Remada/privacidad.html'), 'la ficha debe citar la URL de la política');
});

test('si la app envía datos a algún sitio, la política y la declaración «no se recopilan datos» ya no valen', () => {
  const html = read('index.html');
  const red = html.match(/\b(fetch\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource)/g) || [];
  assert.deepStrictEqual(red, [], 'index.html usa red: actualiza privacidad.html y la declaración de seguridad de los datos de Play');
  assert(exists('privacidad.html'));
});
