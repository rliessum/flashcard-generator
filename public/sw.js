// Flashcard Generator — Service Worker
// Navigation network-first, static assets stale-while-revalidate

const CACHE_NAME = 'flashcards-vBUILD_HASH';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
];

// Install — pre-cache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Google Fonts: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((cached) => {
          const fetched = fetch(e.request).then((response) => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // HTML shell: network-first to avoid stale app shell after deployments.
  if (
    e.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // App assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fetched = fetch(e.request)
          .then((response) => {
            if (response.ok && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }
});
