const CACHE_NAME = 'gym-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Install service worker and pre-cache resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Activate this version immediately
});

// Fetch from network first, update cache, fallback to cache if offline
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return fetch(event.request)
        .then(function(networkResponse) {
          // Update cache with fresh version
          if (
            event.request.method === 'GET' &&
            networkResponse &&
            networkResponse.status === 200 &&
            !event.request.url.includes('chrome-extension') // skip extensions
          ) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(function() {
          // Fallback to cache if offline or request fails
          return cache.match(event.request);
        });
    })
  );
});

// Clean up old caches during activation
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of pages immediately
});
