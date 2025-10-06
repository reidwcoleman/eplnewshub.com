// EPL News Hub - Optimized Service Worker
const CACHE_NAME = 'epl-news-v1';
const RUNTIME_CACHE = 'epl-runtime-v1';

// Critical files to cache immediately
const CRITICAL_CACHE = [
  '/',
  '/index-optimized.html',
  '/optimized-styles.css',
  '/optimized-loader.js',
  '/eplnewshubnewlogo.png',
  '/manifest.json'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CRITICAL_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and non-http(s)
  if (!url.protocol.startsWith('http')) return;
  
  // HTML requests - network first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // Static assets - cache first
  if (request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        
        return fetch(request).then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }
  
  // Default - network first with timeout
  event.respondWith(
    Promise.race([
      fetch(request),
      new Promise(resolve => setTimeout(() => resolve(caches.match(request)), 3000))
    ]).then(response => response || fetch(request))
  );
});