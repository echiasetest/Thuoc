// Tăng phiên bản mỗi khi bạn sửa code (v6, v7, v8...)
const CACHE_NAME = 'thuoc-pwa-v7';
const STATIC_ASSETS = [
  '/Thuoc/',
  '/Thuoc/index.html',
  '/Thuoc/manifest.json',
  '/Thuoc/icon-192.png',
  '/Thuoc/icon-512.png'
];

// 1. Cài đặt và nạp tài nguyên tĩnh
self.addEventListener('install', (event) => {
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

// 2. Kích hoạt và dọn dẹp các cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Phục vụ dữ liệu cache/network
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

// 4. Lắng nghe lệnh cập nhật từ giao diện người dùng
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
