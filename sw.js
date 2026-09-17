const CACHE_NAME = 'thuoc-pwa-v3';
const STATIC_ASSETS = [
  '/Thuoc/',
  '/Thuoc/index.html',
  '/Thuoc/manifest.json',
  '/Thuoc/icons/icon-192.png',
  '/Thuoc/icons/icon-512.png'
];

// Cài đặt và cache các tài nguyên tĩnh
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn(`[SW] Skip: ${url}`, err))
        )
      );
    })
  );
});

// Xóa sạch các bản cache cũ khi cập nhật code mới
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Phục vụ dữ liệu offline và mạng
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        })
        .catch(async () => {
          if (event.request.mode === 'navigate') {
            return (await caches.match('/Thuoc/index.html')) || (await caches.match('/Thuoc/'));
          }
        });
    })
  );
});
