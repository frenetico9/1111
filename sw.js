// This is a robust service worker for PWA functionality (v3)

const CACHE_NAME = 'navalha-digital-cache-v3'; // Bump version to force update
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json', // Add manifest to cache
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined',
  'https://i.imgur.com/83wwvV2.png' // New Logo with blue background
];

// Install: Open cache and add app shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        // Use addAll for atomic caching of essential shell files
        return cache.addAll(urlsToCache);
      }).catch(err => {
        console.error("Service Worker: Failed to cache app shell.", err);
      })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Serve from cache, fallback to network, and provide offline fallback for navigation
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache, go to network
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response to cache.
            // We don't cache non-GET requests or responses from chrome-extension://
            if (
              !response || 
              response.status !== 200 || 
              (response.type !== 'basic' && response.type !== 'opaque') || // Opaque for CDN
              event.request.method !== 'GET'
            ) {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Network request failed, probably offline
          // If it's a navigation request, serve the main app shell page as a fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          // For other failed requests (e.g., images), we don't have a specific fallback,
          // so the browser's default error will show.
        });
      })
  );
});
