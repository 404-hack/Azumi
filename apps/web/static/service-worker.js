// This is a minimal service worker that should work with SvelteKit
// Basic caching strategy that works offline

const cacheName = 'azumi-cache-v1';
const assetsToCache = ['/', '/offline', '/restaurants'];

// Install event - cache basic assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(cacheName)
			.then((cache) => cache.addAll(assetsToCache))
			.then(() => self.skipWaiting())
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.filter((name) => name !== cacheName).map((name) => caches.delete(name))
				);
			})
			.then(() => self.clients.claim())
	);
});

// Fetch event - respond with cached content when available
self.addEventListener('fetch', (event) => {
	// Skip cross-origin requests
	if (event.request.url.startsWith(self.location.origin)) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					// Cache successful responses
					if (response.status === 200) {
						const responseClone = response.clone();
						caches.open(cacheName).then((cache) => {
							cache.put(event.request, responseClone);
						});
					}
					return response;
				})
				.catch(() => {
					// If network fails, try the cache
					return caches.match(event.request).then((cachedResponse) => {
						if (cachedResponse) {
							return cachedResponse;
						}

						// If it's a navigation request, show the offline page
						if (event.request.mode === 'navigate') {
							return caches.match('/offline');
						}

						// Return a basic error for assets that aren't cached
						return new Response('Network error', {
							status: 503,
							headers: { 'Content-Type': 'text/plain' }
						});
					});
				})
		);
	}
});
