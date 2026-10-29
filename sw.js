const CACHE = 'ash-studio-v3';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'js/app.js',
  'js/dom.js',
  'js/state.js',
  'js/sequence.js',
  'js/engine.js',
  'js/fileio.js',
  'js/stems.js',
  'js/stems-worker.js',
  'js/ui-rack.js',
  'js/ui-piano.js',
  'js/ui-playlist.js',
  'js/ui-mixer.js',
  'js/ui-stems.js',
  'js/ui-examples.js',
  'js/generator.js',
  'js/ui-guide.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Same-origin: network-first (fresh when online, cached when offline).
// Cross-origin (fonts): stale-while-revalidate.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
        .catch(() => cached);
      return cached || net;
    }),
  );
});
