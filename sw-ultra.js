// Ultra Performance Service Worker for EPL News Hub
// Aggressive caching and performance optimization

const CACHE_VERSION = 'v2.0-ultra';
const CACHE_NAMES = {
    static: `static-${CACHE_VERSION}`,
    dynamic: `dynamic-${CACHE_VERSION}`,
    images: `images-${CACHE_VERSION}`,
    articles: `articles-${CACHE_VERSION}`
};

// Critical assets to precache
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/index.js',
    '/ultra-performance.js',
    '/performance-boost.js',
    '/header.html',
    '/footer.html',
    '/main_headline.html',
    '/saka.png'
];

// Cache duration settings (in seconds)
const CACHE_DURATION = {
    images: 7 * 24 * 60 * 60, // 7 days
    articles: 24 * 60 * 60,    // 1 day
    static: 30 * 24 * 60 * 60, // 30 days
    dynamic: 60 * 60           // 1 hour
};

// Install Event - Precache critical assets
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installing Ultra Performance SW');
    
    event.waitUntil(
        caches.open(CACHE_NAMES.static)
            .then(cache => {
                console.log('[ServiceWorker] Precaching critical assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activating Ultra Performance SW');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => {
                        // Delete old caches
                        return !Object.values(CACHE_NAMES).includes(cacheName);
                    })
                    .map(cacheName => {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch Event - Intelligent caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip Chrome extensions and dev tools
    if (url.protocol === 'chrome-extension:' || url.hostname === 'localhost') {
        return;
    }
    
    // Determine caching strategy based on request type
    if (isImage(request)) {
        event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
    } else if (isArticle(request)) {
        event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.articles));
    } else if (isStaticAsset(request)) {
        event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
    } else if (isHTML(request)) {
        event.respondWith(networkFirstStrategy(request, CACHE_NAMES.dynamic));
    } else {
        event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.dynamic));
    }
});

// Caching Strategies

// 1. Cache First - For static assets
async function cacheFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
        // Check if cache is still fresh
        const cacheTime = cached.headers.get('sw-cache-time');
        if (cacheTime && isCacheFresh(cacheTime, getCacheDuration(cacheName))) {
            return cached;
        }
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            const responseToCache = response.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', Date.now().toString());
            
            const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, modifiedResponse);
        }
        return response;
    } catch (error) {
        if (cached) return cached;
        throw error;
    }
}

// 2. Network First - For HTML pages
async function networkFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    
    try {
        const response = await fetchWithTimeout(request, 3000); // 3 second timeout
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
            console.log('[ServiceWorker] Serving from cache (network failed):', request.url);
            return cached;
        }
        
        // Return offline page if available
        const offlinePage = await cache.match('/offline.html');
        if (offlinePage) return offlinePage;
        
        throw error;
    }
}

// 3. Stale While Revalidate - Best of both worlds
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached);
    
    return cached || fetchPromise;
}

// Helper Functions

function fetchWithTimeout(request, timeout = 5000) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), timeout)
        )
    ]);
}

function isImage(request) {
    return request.destination === 'image' || 
           /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url);
}

function isArticle(request) {
    return request.url.includes('/articles/');
}

function isStaticAsset(request) {
    return /\.(css|js|woff|woff2|ttf|eot)$/i.test(request.url);
}

function isHTML(request) {
    return request.headers.get('accept')?.includes('text/html') ||
           request.url.endsWith('.html');
}

function isCacheFresh(cacheTime, maxAge) {
    const age = (Date.now() - parseInt(cacheTime)) / 1000;
    return age < maxAge;
}

function getCacheDuration(cacheName) {
    if (cacheName.includes('images')) return CACHE_DURATION.images;
    if (cacheName.includes('articles')) return CACHE_DURATION.articles;
    if (cacheName.includes('static')) return CACHE_DURATION.static;
    return CACHE_DURATION.dynamic;
}

// Background Sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-articles') {
        event.waitUntil(syncArticles());
    }
});

async function syncArticles() {
    // Prefetch top articles in background
    const cache = await caches.open(CACHE_NAMES.articles);
    const articlesToPrefetch = [
        '/articles/arsenal-premier-league-title-2025-26.html',
        '/articles/transfer-deadline-day-2025-premier-league-analysis.html'
    ];
    
    return Promise.all(
        articlesToPrefetch.map(url => 
            fetch(url).then(response => {
                if (response.ok) {
                    return cache.put(url, response);
                }
            }).catch(() => {})
        )
    );
}

// Message handler for cache management
self.addEventListener('message', event => {
    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.keys().then(cacheNames => 
                Promise.all(cacheNames.map(cache => caches.delete(cache)))
            ).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    } else if (event.data.action === 'getCacheSize') {
        event.waitUntil(
            calculateCacheSize().then(size => {
                event.ports[0].postMessage({ size });
            })
        );
    }
});

async function calculateCacheSize() {
    if (!navigator.storage || !navigator.storage.estimate) {
        return 'Unknown';
    }
    
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    return `${(usage / 1024 / 1024).toFixed(2)} MB`;
}

console.log('[ServiceWorker] Ultra Performance SW loaded');