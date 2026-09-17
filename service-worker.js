const CACHE_NAME = 'pwa-cache-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
  // Nếu có file offline riêng thì mở comment dòng dưới:
  // './offline.html'
];

// 1. Cài đặt Service Worker và lưu cache an toàn
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Dùng map để nếu thiếu 1 file thì các file khác vẫn được cache thành công
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn(`[SW] Bỏ qua file: ${url}`, err))
        )
      );
    })
  );
});

// 2. Dọn dẹp cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Phục vụ dữ liệu (Cache First, Network Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Bỏ qua các extension của trình duyệt (chrome-extension://, ...)
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
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(async () => {
          // Khi mất mạng và người dùng đang chuyển trang (navigation)
          if (event.request.mode === 'navigate') {
            const offlinePage = await caches.match('./offline.html');
            if (offlinePage) return offlinePage;
            return caches.match('./index.html') || caches.match('./');
          }
        });
    })
  );
});
