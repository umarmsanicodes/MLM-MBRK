const CACHE_NAME = 'mubarak-academy-v11'; // Incremented to force cache refresh

const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',

  // External assets (safe cache)
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://meet.jit.si/external_api.js'
];

// INSTALL EVENT
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(urlsToCache);
      } catch (err) {
        console.log('Cache addAll failed:', err);
      }
      return self.skipWaiting();
    })
  );
});

// ACTIVATE EVENT (clean old cache)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH EVENT
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Allow only same-origin + trusted external assets
  const allowedExternal =
    url.origin === self.location.origin ||
    url.href.includes('fonts.googleapis.com') ||
    url.href.includes('cdnjs.cloudflare.com') ||
    url.href.includes('meet.jit.si');

  if (!allowedExternal) return;

  // HTML NAVIGATION (important for GitHub Pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // STATIC FILES CACHE FIRST
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });

          return response;
        })
        .catch(() => {
          if (request.destination === 'document') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});