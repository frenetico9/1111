
// This is a basic service worker for PWA functionality

const CACHE_NAME = 'navalha-digital-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx', // This might not be directly fetchable depending on the build setup, but we list it.
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined',
  'https://i.imgur.com/OViX73g.png' // Logo
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // AddAll will fail if any of the requests fail.
        // It's better to add them individually and not fail the entire install.
        return Promise.all(
            urlsToCache.map(url => {
                return cache.add(url).catch(reason => {
                    console.log(`Failed to cache ${url}: ${reason}`);
                });
            })
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              if (response && response.type === 'opaque') {
                  // Opaque responses can't be introspected but should be served.
                  return response;
              }
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                 // We don't cache POST/PUT/DELETE etc.
                 if (event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                 }
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
