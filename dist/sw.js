const CACHE_NAME = 'wallpaper-gallery-static-v2';
const API_CACHE = 'wallpaper-gallery-api-v2';
const IMAGE_CACHE = 'wallpaper-gallery-images-v2';

const APP_SHELL = [
  './',
  './index.html',
  './css/components.css',
  './js/utils.js',
  './js/storage.js',
  './js/ui.js',
  './js/api.js',
  './js/gallery.js',
  './js/search.js',
  './js/favorites.js',
  './js/downloads.js',
  './js/settings.js',
  './js/app.js'
];

/**
 * Recursively removes the oldest cache entries until the size is under maxItems.
 */
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(() => limitCacheSize(name, size));
      }
    });
  });
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Backend API Requests (Stale-While-Revalidate)
  if (requestUrl.origin === 'https://abo-wallpapers.onrender.com') {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            if (!cachedResponse) {
              return new Response(JSON.stringify({ error: "Offline mode", offline: true }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. Image Requests (Strict Cache-First with Limiting)
  if (requestUrl.origin === 'https://images.unsplash.com') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Strict Cache-First: Do not fetch from network if we already have it!
          if (cachedResponse) return cachedResponse;
          
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone()).then(() => {
                limitCacheSize(IMAGE_CACHE, 150); // Increased cache limit slightly
              });
            }
            return networkResponse;
          }).catch(() => {
            // Ignore failure gracefully if offline
            return new Response('', { status: 404, statusText: 'Not Found Offline' });
          });
        });
      })
    );
    return;
  }

  // 3. App Shell (Cache First, Network Fallback)
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found, else fetch from network
      return response || fetch(event.request).catch(() => {
        // Fallback for navigation requests if completely offline and not in cache
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
