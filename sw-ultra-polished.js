/* ================================================
   EPL News Hub - Ultra Polished Service Worker v2.0
   ================================================ */

const CACHE_NAME = 'epl-news-hub-v2.0';
const RUNTIME_CACHE = 'epl-runtime-v2.0';
const IMAGE_CACHE = 'epl-images-v2.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/ultra-polished-global.css',
  '/ultra-polished.js',
  '/manifest.json',
  '/offline.html',
  '/eplnewshubnewlogo.png'
];

// ==================== INSTALL EVENT ====================
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('Service Worker: Install failed', err))
  );
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE && 
                     cacheName !== IMAGE_CACHE;
            })
            .map(cacheName => {
              console.log('Service Worker: Clearing old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ==================== FETCH STRATEGIES ====================
const strategies = {
  // Network first, fallback to cache
  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      console.log('Service Worker: Network failed, trying cache');
    }
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a navigation request, return offline page
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  },
  
  // Cache first, fallback to network
  cacheFirst: async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      console.log('Service Worker: Fetch failed', error);
    }
    
    return new Response('Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  },
  
  // Stale while revalidate
  staleWhileRevalidate: async (request) => {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
      .catch(() => null);
    
    return cachedResponse || fetchPromise;
  },
  
  // Network only
  networkOnly: async (request) => {
    try {
      return await fetch(request);
    } catch (error) {
      return new Response('Network request failed', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  }
};

// ==================== FETCH EVENT ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Determine strategy based on request type
  let strategy;
  
  // API calls - network only
  if (url.pathname.startsWith('/api/')) {
    strategy = strategies.networkOnly;
  }
  // Images - cache first with separate cache
  else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }
  // Static assets - cache first
  else if (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff2')
  ) {
    strategy = strategies.cacheFirst;
  }
  // HTML pages - stale while revalidate
  else if (request.headers.get('accept').includes('text/html')) {
    strategy = strategies.staleWhileRevalidate;
  }
  // Default - network first
  else {
    strategy = strategies.networkFirst;
  }
  
  event.respondWith(strategy(request));
});

// ==================== IMAGE HANDLING ====================
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      // Clone the response before caching
      cache.put(request, networkResponse.clone());
      
      // Limit image cache size
      limitCacheSize(IMAGE_CACHE, 50);
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder image
    return new Response(
      `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect fill="#f3f4f6" width="100%" height="100%"/>
        <text fill="#9ca3af" font-family="sans-serif" font-size="20" x="50%" y="50%" text-anchor="middle">
          Image unavailable
        </text>
      </svg>`,
      {
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
}

// ==================== CACHE SIZE MANAGEMENT ====================
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Delete oldest items
    const itemsToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(
      itemsToDelete.map(key => cache.delete(key))
    );
  }
}

// ==================== BACKGROUND SYNC ====================
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'sync-articles') {
    event.waitUntil(syncArticles());
  }
});

async function syncArticles() {
  try {
    const response = await fetch('/api/articles/latest');
    const articles = await response.json();
    
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put('/api/articles/latest', new Response(JSON.stringify(articles)));
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'ARTICLES_SYNCED',
        articles
      });
    });
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}

// ==================== PUSH NOTIFICATIONS ====================
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: '/eplnewshubnewlogo.png',
    badge: '/eplnewshubnewlogo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Read More',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('EPL News Hub', options)
  );
});

// ==================== NOTIFICATION CLICK ====================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// ==================== MESSAGE HANDLING ====================
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// ==================== PERIODIC BACKGROUND SYNC ====================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-articles') {
    event.waitUntil(updateArticlesInBackground());
  }
});

async function updateArticlesInBackground() {
  try {
    const response = await fetch('/api/articles/check-updates');
    const hasUpdates = await response.json();
    
    if (hasUpdates) {
      // Clear old article cache
      const cache = await caches.open(RUNTIME_CACHE);
      const keys = await cache.keys();
      const articleKeys = keys.filter(key => key.url.includes('/articles/'));
      
      await Promise.all(
        articleKeys.map(key => cache.delete(key))
      );
      
      // Notify user of updates
      await self.registration.showNotification('EPL News Hub', {
        body: 'New articles available!',
        icon: '/eplnewshubnewlogo.png',
        tag: 'article-update'
      });
    }
  } catch (error) {
    console.error('Service Worker: Periodic sync failed', error);
  }
}