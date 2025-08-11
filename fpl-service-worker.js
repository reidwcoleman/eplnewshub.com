// FPL Service Worker for offline caching and fast loading
const CACHE_NAME = 'fpl-cache-v1';
const API_CACHE_NAME = 'fpl-api-cache-v1';

// Files to cache immediately
const STATIC_CACHE_URLS = [
    '/',
    '/styles.css',
    '/fpl-api.js',
    '/fpl-fast-loader.js',
    '/team-analyzer.html',
    '/player-predictor.html',
    '/transfer-simulator-pro.html',
    '/fpl-ai-assistant.html',
    '/stats.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, {mode: 'no-cors'})));
            })
            .catch(error => {
                console.error('Cache installation failed:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Handle FPL API requests
    if (url.hostname === 'fantasy.premierleague.com') {
        event.respondWith(
            caches.open(API_CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    // Return cached response if less than 5 minutes old
                    if (cachedResponse) {
                        const cachedTime = cachedResponse.headers.get('sw-cache-time');
                        if (cachedTime && Date.now() - parseInt(cachedTime) < 5 * 60 * 1000) {
                            console.log('Serving from API cache:', url.pathname);
                            return cachedResponse;
                        }
                    }
                    
                    // Fetch from network
                    return fetch(event.request)
                        .then(response => {
                            // Cache successful responses
                            if (response && response.status === 200) {
                                const responseToCache = response.clone();
                                const headers = new Headers(responseToCache.headers);
                                headers.set('sw-cache-time', Date.now().toString());
                                
                                cache.put(event.request, new Response(responseToCache.body, {
                                    status: responseToCache.status,
                                    statusText: responseToCache.statusText,
                                    headers: headers
                                }));
                            }
                            return response;
                        })
                        .catch(() => {
                            // Return cached response even if expired
                            return cachedResponse || new Response('[]', {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                });
            })
        );
        return;
    }
    
    // Handle static assets
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request).then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    // Cache HTML, CSS, JS files
                    if (event.request.url.match(/\.(html|css|js)$/)) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    
                    return response;
                }).catch(() => {
                    // Offline fallback
                    if (event.request.destination === 'document') {
                        return caches.match('/');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
        );
    }
});

// Background sync for data updates
self.addEventListener('sync', event => {
    if (event.tag === 'fpl-data-sync') {
        event.waitUntil(
            fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
                .then(response => response.json())
                .then(data => {
                    // Cache the fresh data
                    return caches.open(API_CACHE_NAME).then(cache => {
                        const response = new Response(JSON.stringify(data), {
                            headers: {
                                'Content-Type': 'application/json',
                                'sw-cache-time': Date.now().toString()
                            }
                        });
                        return cache.put('https://fantasy.premierleague.com/api/bootstrap-static/', response);
                    });
                })
                .catch(error => {
                    console.error('Background sync failed:', error);
                })
        );
    }
});

// Message handler for cache control
self.addEventListener('message', event => {
    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                event.ports[0].postMessage({ status: 'Cache cleared' });
            })
        );
    }
});