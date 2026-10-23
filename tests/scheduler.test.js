'use strict';
/* Lógica de temporización del metrónomo (planificador normal y modo Pro), con reloj falso. */
const test = require('node:test');
const assert = require('node:assert');
const { schedulerFactory } = require('./helpers');

const near = (a, b, m, tol = 1e-9) => assert(Math.abs(a - b) < tol, `${m}: ${a} vs ${b}`);
const R = x => +x.toFixed(3);

/* ---------- Planificador normal ---------- */
const makeScheduler = schedulerFactory('makeScheduler');

function simulate({ bpm, frac, seconds, changes = [], lookahead = 0.2 }) {
  let now = 0;
  const p = { bpm, frac };
  const starts = [], ends = [];
  const s = makeScheduler({ now: () => now, params: () => p, lookahead: () => lookahead, start: t => starts.push(t), end: t => ends.push(t) });
  s.begin(0.12);
  const pending = changes.slice().sort((a, b) => a.at - b.at);
  while (now < seconds) {
    while (pending.length && pending[0].at <= now) Object.assign(p, pending.shift().set);
    s.tick();
    now += 0.025;
  }
  return { starts, ends };
}

test('30 BPM / 50 %: inicios cada 2 s y fin justo en medio de dos inicios', () => {
  const { starts, ends } = simulate({ bpm: 30, frac: 0.5, seconds: 20 });
  assert(starts.length >= 9 && ends.length >= 9);
  starts.forEach((t, i) => near(t, 0.12 + 2 * i, 'inicio ' + i));
  ends.forEach((t, i) => near(t, starts[i] + 1.0, 'fin ' + i));
  ends.forEach((t, i) => i < starts.length - 1 && near(t, (starts[i] + starts[i + 1]) / 2, 'punto medio ' + i));
});

test('30 BPM / 25 %: fin 0,5 s después del inicio', () => {
  const { starts, ends } = simulate({ bpm: 30, frac: 0.25, seconds: 20 });
  ends.forEach((t, i) => near(t, starts[i] + 0.5, 'fin ' + i));
});

test('60 BPM / 90 %: periodo constante y sin solapes', () => {
  const { starts, ends } = simulate({ bpm: 60, frac: 0.9, seconds: 15 });
  ends.forEach((t, i) => near(t, starts[i] + 0.9, 'fin ' + i));
  for (let i = 1; i < starts.length; i++) near(starts[i] - starts[i - 1], 1.0, 'periodo ' + i);
});

test('cambio en caliente de BPM y %: eventos ordenados y sin saltos raros', () => {
  const { starts, ends } = simulate({ bpm: 30, frac: 0.5, seconds: 20, changes: [{ at: 7, set: { bpm: 60, frac: 0.25 } }] });
  const all = [...starts.map(t => ['s', t]), ...ends.map(t => ['e', t])].sort((a, b) => a[1] - b[1]);
  for (let i = 1; i < all.length; i++) assert(all[i][1] - all[i - 1][1] >= 0.039, 'eventos demasiado juntos en ' + all[i][1]);
  const late = starts.filter(t => t > 10);
  for (let i = 1; i < late.length; i++) near(late[i] - late[i - 1], 1.0, 'periodo tras el cambio');
});

test('temporizador lento (segundo plano: tick 1 s, lookahead 1,2 s): sin huecos', () => {
  let now = 0; const starts = [];
  const p = { bpm: 30, frac: 0.5 };
  const s = makeScheduler({ now: () => now, params: () => p, lookahead: () => 1.2, start: t => starts.push(t), end: () => {} });
  s.begin(0.12);
  while (now < 30) { s.tick(); now += 1.0; }
  for (let i = 1; i < starts.length; i++) near(starts[i] - starts[i - 1], 2.0, 'periodo en segundo plano');
});

/* ---------- Planificador del modo Pro ---------- */
const makeProScheduler = schedulerFactory('makeProScheduler');

function run({ intervals, frac = 0.5, tickMs = 25, look = 0.2, limit = 400, changes = [] }) {
  let now = 0; const p = { intervals, frac }; const L = { s: [], e: [], w: [] };
  const s = makeProScheduler({ now: () => now, lookahead: () => look, plan: () => p,
    start: (t, k) => L.s.push([t, k]), end: t => L.e.push(t), warn: t => L.w.push(t) });
  s.begin(0.12);
  const ch = changes.slice();
  while (now < limit && !(s.isFinished() && now > s.finishAt() + 1)) {
    while (ch.length && ch[0].at <= now) Object.assign(p, ch.shift().set);
    s.tick(); now += tickMs / 1000;
  }
  return { L, s };
}

test('Pro: caso mixto 15 s @60, 10 s @40, 5 s @30 (avisos, inicios, fines y final de sesión)', () => {
  const { L, s } = run({ intervals: [{ sec: 15, bpm: 60 }, { sec: 10, bpm: 40 }, { sec: 5, bpm: 30 }] });
  const o = 0.12;
  const rel = a => a.map(x => R(x - o));
  assert.deepStrictEqual(rel(L.w), [5, 10, 15, 20, 25, 30]);
  const st = k => L.s.filter(x => x[1] === k).map(x => R(x[0] - o));
  assert.deepStrictEqual(st(0), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  assert.deepStrictEqual(st(1), [15.45, 16.95, 18.45, 19.95, 21.45, 22.95, 24.45]);
  assert.deepStrictEqual(st(2), [25.45, 27.45, 29.45]);
  const en = rel(L.e);
  assert.deepStrictEqual(en.filter(t => t < 15), [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5]);
  assert.deepStrictEqual(en.filter(t => t >= 15 && t < 25), [16.2, 17.7, 19.2, 20.7, 22.2, 23.7]);
  assert.deepStrictEqual(en.filter(t => t >= 25), [26.45, 28.45]);
  assert(s.isFinished());
  near(s.finishAt() - o, 30.36, 'fin de sesión');
});

for (const [sec, exp] of [[5, [5]], [6, [1, 6]], [10, [5, 10]], [11, [1, 6, 11]], [60, [50, 55, 60]]]) {
  test(`Pro: intervalo de ${sec} s → avisos en ${exp.join(', ')}`, () => {
    const { L } = run({ intervals: [{ sec, bpm: 30 }] });
    assert.deepStrictEqual(L.w.map(x => R(x - 0.12)), exp);
  });
}

test('Pro: temporizador lento (tick 1 s, lookahead 1,2 s)', () => {
  const { L } = run({ intervals: [{ sec: 30, bpm: 30 }, { sec: 20, bpm: 24 }], tickMs: 1000, look: 1.2 });
  assert.deepStrictEqual(L.w.map(x => R(x - 0.12)), [20, 25, 30, 40, 45, 50]);
  const t = L.s.filter(x => x[1] === 0).map(x => x[0]);
  for (let k = 1; k < t.length; k++) near(t[k] - t[k - 1], 2, 'periodo');
});

test('Pro: cambiar el % de fin de remada en caliente no junta eventos', () => {
  const { L } = run({ intervals: [{ sec: 20, bpm: 60 }, { sec: 20, bpm: 30 }], changes: [{ at: 8, set: { frac: 0.3 } }] });
  const all = [...L.s.map(x => x[0]), ...L.e].sort((a, b) => a - b);
  for (let k = 1; k < all.length; k++) assert(all[k] - all[k - 1] >= 0.039, 'eventos pegados en ' + all[k]);
});

test('Pro: con cadencia lenta (10 BPM) ningún tono de ritmo cae después del final', () => {
  const { L } = run({ intervals: [{ sec: 20, bpm: 10 }] });
  assert(L.s.every(x => x[0] - 0.12 < 20) && L.e.every(x => x - 0.12 < 20));
});
