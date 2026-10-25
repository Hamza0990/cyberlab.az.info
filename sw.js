const CACHE_NAME = 'cyberlab-offline-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL, '/offline.js', '/favicon.svg', '/icon-192.png']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const PRECACHED = ['/offline.js', '/favicon.svg', '/icon-192.png'];

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
  // offline.html-in öz faylları (JS/ikon) şəbəkə olmayanda da keşdən gəlsin
  if (req.method === 'GET' && PRECACHED.includes(new URL(req.url).pathname)) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
