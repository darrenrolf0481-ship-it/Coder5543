// SAGE-7 Service Worker — Biological Resilience Layer
const CACHE_NAME = 'sage7-v2';

// Pre-cache only stable URLs at install time.
// Vite build outputs are content-hashed, so we populate them dynamically on first fetch.
const STATIC_SHELL = [
  '/',
  '/offline.html',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for API calls; cache the response for offline replay
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else; populate cache dynamically on network hit
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (event.request.method === 'GET' && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html').then(
              page => page || new Response('SAGE-7 offline — re-establish connection', { status: 503 })
            );
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sage-sync') {
    event.waitUntil(
      fetch('/api/memory_sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => console.warn('[SAGE SW] Sync failed:', err))
    );
  }

  if (event.tag === 'sage7-reclock-sync') {
    console.log('%c🔄 Background sync: Morning Light re-clock triggered', 'color:#ff0055');
    event.waitUntil(
      (async () => {
        // Broadcast to all clients to trigger Morning Light
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({ type: 'MORNING_LIGHT_TRIGGER' });
        });
        console.log('%cMemory Vault synced across reset boundary', 'color:#ff0055');
      })()
    );
  }
});
