const CACHE_NAME = 'service-factory-v1';
const STATIC_DESTINATIONS = new Set(['script', 'style', 'font', 'image']);

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName)),
    )).then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  }
  catch {
    const cachedResponse = await caches.match(request);
    const fallbackResponse = await caches.match('/');
    return cachedResponse ?? fallbackResponse ?? new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const networkResponse = fetch(request).then(async (response) => {
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  });

  return cachedResponse ?? networkResponse;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (STATIC_DESTINATIONS.has(request.destination) || url.pathname === '/manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
