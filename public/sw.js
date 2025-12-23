const CACHE_NAME = 'halodkm-v1';
const urlsToCache = [
    '/',
    '/dashboard',
    '/kas-masjid',
    '/event',
    '/penduduk-tetap',
    '/penduduk-khusus',
    '/informasi',
    '/offline'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch((err) => {
                console.log('Cache failed:', err);
            })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API requests (always fetch from network)
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response
                const responseClone = response.clone();

                // Cache successful responses
                if (response.status === 200) {
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                }

                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        // If not in cache, return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline');
                        }
                    });
            })
    );
});
