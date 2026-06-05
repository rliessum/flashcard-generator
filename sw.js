// Flashcard Generator — Service Worker (Offline-first)
// - Cache-first for all same-origin assets (strong offline support after first visit)
// - Stale-while-revalidate for Google Fonts
// - SPA navigation fallback to index.html when offline

// NOTE: The actual cache name is rewritten at build time by the sw-cache-bust plugin
// in vite.config.js to include a hash of the current assets.
const CACHE_NAME = 'flashcards-v4';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon-32.png',
  '/icons/favicon-16.png',
  '/icons/apple-touch-icon.png',
  // Sample data for offline use
  '/data/sample.csv',
  '/data/duits.csv',
  // Note: Vite hashed assets (JS/CSS in /assets/) are cached at runtime on first visit
  // for strong offline support after the initial load.
];
const EXTERNAL_URLS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
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

  // Same-origin requests: cache-first with fallback for SPA navigation
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(e.request)
          .then((response) => {
            // Only cache successful basic responses
            if (response.ok && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
            }
            return response;
          })
          .catch(() => {
            // Offline fallback for navigation requests (SPA)
            if (e.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            // For other requests (JS, CSS, images), just fail gracefully
            return new Response(null, { status: 504, statusText: 'Offline' });
          });
      })
    );
    return;
  }
});
