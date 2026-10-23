/* Service worker de Ritmo de Remada: guarda la app completa para usarla sin conexión.
   Todas las apps de lsantome.github.io comparten el origen, y con él el almacén de cachés:
   por eso las cachés llevan el prefijo propio (PREFIX) y este worker SOLO borra las que lo tienen.
   VERSION se sella al construir (npm run build:pwa): scripts/version.js sustituye el sufijo por el
   hash del commit, así que cada despliegue renueva la caché sin tocar este archivo a mano. */
const PREFIX = 'ritmo-remada-';
const VERSION = 'ritmo-remada-dev'; // @build
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  'fonts/barlow-latin-500-normal.woff2', 'fonts/barlow-latin-600-normal.woff2',
  'fonts/barlow-condensed-latin-600-normal.woff2', 'fonts/barlow-condensed-latin-700-normal.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Responde desde caché al instante y actualiza en segundo plano (la versión nueva se ve en la siguiente apertura). */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net.then(res => res || (req.mode === 'navigate' ? cache.match('index.html') : res));
    })
  );
});
