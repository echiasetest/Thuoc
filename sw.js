// Auto-generated Service Worker by HTML to PWA Converter (Optimized)
const CACHE_NAME = 'pwa-cache-v95537';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static files');
      // Từng file tự cache độc lập, tránh lỗi 1 file 404 làm hỏng cả tiến trình cài đặt PWA
      return Promise.allSettled(
        FILES_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => console.warn(`[ServiceWorker] Skip: ${url}`, err))
        )
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
  if (!event.request.url.startsWith('http')) return; // Bỏ qua tiện ích mở rộng trình duyệt

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
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
          // Xử lý đúng Promise cho trang offline
          const offlinePage = await caches.match('./offline.html');
          if (offlinePage) return offlinePage;
          return (await caches.match('./index.html')) || (await caches.match('./'));
        });
    })
  );
});
