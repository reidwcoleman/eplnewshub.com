// Service Worker for EPL News Hub
// Implements caching strategies for improved performance and offline functionality

const CACHE_NAME = 'eplnewshub-v1.2';
const STATIC_CACHE = 'eplnewshub-static-v1.2';
const DYNAMIC_CACHE = 'eplnewshub-dynamic-v1.2';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/enhanced-homepage-v2.html',
    '/styles.css',
    '/enhanced-homepage-v2.css',
    '/index.js',
    '/enhanced-homepage-v2.js',
    '/scripts.js',
    '/seo-enhancer.js',
    '/header.html',
    '/footer.html',
    '/main_headline.html',
    '/reidsnbest.webp',
    '/upscalemedia-transformed.png',
    '/fpl.html',
    '/transfer-hub.html',
    '/manifest.json'
];

// Cache strategies for different types of content
const CACHE_STRATEGIES = {
    // Static assets - Cache First
    static: /\.(css|js|webp|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
    
    // HTML pages - Network First with cache fallback
    pages: /\.html$/,
    
    // API calls - Network First
    api: /\/api\//,
    
    // External resources - Stale While Revalidate
    external: /^https?:\/\//
};

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Old caches cleaned up');
                return self.clients.claim();
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Skip FPL API requests and CORS proxy requests - let them go through normally
    if (url.hostname === 'fantasy.premierleague.com' || 
        url.hostname === 'corsproxy.io' || 
        url.hostname === 'api.allorigins.win' ||
        url.href.includes('corsproxy.io') ||
        url.href.includes('allorigins.win')) {
        return;
    }
    
    // Apply caching strategy based on request type
    if (CACHE_STRATEGIES.static.test(url.pathname)) {
        // Static assets - Cache First
        event.respondWith(cacheFirst(request));
    } else if (CACHE_STRATEGIES.pages.test(url.pathname) || url.pathname === '/') {
        // HTML pages - Network First
        event.respondWith(networkFirst(request));
    } else if (url.origin !== location.origin) {
        // External resources - Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request));
    } else {
        // Default strategy - Network First
        event.respondWith(networkFirst(request));
    }
});

// Cache First strategy - for static assets
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache First strategy failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

// Network First strategy - for HTML pages
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
            const offlinePage = await caches.match('/offline.html');
            if (offlinePage) {
                return offlinePage;
            }
        }
        
        return new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Stale While Revalidate strategy - for external resources
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then(networkResponse => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(error => {
            console.error('Network request failed:', error);
            // Return cached response if available, otherwise return error response
            if (cachedResponse) {
                return cachedResponse;
            }
            // Return a proper error response instead of undefined
            return new Response(JSON.stringify({ error: 'Network request failed' }), {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            });
        });
    
    return cachedResponse || fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    console.log('Performing background sync...');
    // Implement background sync logic here
    // e.g., sync newsletter subscriptions, comments, etc.
}

// Push notifications
self.addEventListener('push', event => {
    if (!event.data) {
        return;
    }
    
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/reidsnbest.webp',
        badge: '/reidsnbest.webp',
        data: data.url,
        actions: [
            {
                action: 'open',
                title: 'Read Article'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data || '/')
        );
    }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Periodic background fetch for article updates
self.addEventListener('periodicsync', event => {
    if (event.tag === 'article-updates') {
        event.waitUntil(updateArticles());
    }
});

async function updateArticles() {
    try {
        const response = await fetch('/api/latest-articles');
        if (response.ok) {
            const articles = await response.json();
            // Cache new articles
            const cache = await caches.open(DYNAMIC_CACHE);
            articles.forEach(article => {
                cache.add(article.url);
            });
        }
    } catch (error) {
        console.error('Failed to update articles:', error);
    }
}

console.log('Service Worker loaded successfully');