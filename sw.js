const CACHE_NAME = 'thuoc-pwa-v2';
const STATIC_ASSETS = [
  '/Thuoc/',
  '/Thuoc/index.html',
  '/Thuoc/manifest.json',
  '/Thuoc/icons/icon-192.png',
  '/Thuoc/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch((err) => console.warn(err)))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((res) => {
      return res || fetch(event.request).catch(() => caches.match('/Thuoc/index.html'));
    })
  );
});
