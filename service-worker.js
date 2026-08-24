const CACHE_VERSION = 'hangic-demo-v2.11-pwa-1';
const CORE_ASSETS = [
  './',
  './index.html',
  './demo.html',
  './manifest.webmanifest',
  './icons/app-icon-192.png',
  './icons/app-icon-512.png',
  './icons/app-icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('hangic-demo-') && key !== CACHE_VERSION)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 導覽頁採網路優先，確保玩家優先拿到最新版；離線才退回已安裝內容。
  if (request.mode === 'navigate'){
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request,copy));
        return response;
      }).catch(async () => {
        const cached = await caches.match(request,{ ignoreSearch:true });
        return cached || caches.match('./index.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_VERSION).then(cache => cache.put(request,response.clone()));
      return response;
    }))
  );
});
