/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

// TypeScript type declaration for service worker global scope
declare const self: ServiceWorkerGlobalScope;

// Cache names
const CACHE_NAME = `cache-${version}`;

// List of all files to cache from SvelteKit build
const ASSETS = [...build, ...files];

// Add additional paths that should be cached
const ADDITIONAL_OFFLINE_URLS = ['/', '/restaurants', '/offline'];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			// Cache both SvelteKit assets and additional URLs
			return cache.addAll([...ASSETS, ...ADDITIONAL_OFFLINE_URLS]);
		})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => {
				return Promise.all(
					keys
						.map((key) => {
							if (key !== CACHE_NAME && key.startsWith('cache-')) {
								return caches.delete(key);
							}
						})
						.filter(Boolean)
				);
			})
			.then(() => {
				self.clients.claim();
			})
	);
});

// Fetch event - respond with cached content when available
self.addEventListener('fetch', (event) => {
	// Skip cross-origin requests
	if (event.request.url.startsWith(self.location.origin)) {
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				// Return cached response if available
				if (cachedResponse) {
					return cachedResponse;
				}

				// Otherwise fetch from network
				return fetch(event.request)
					.then((response) => {
						// Don't cache responses that aren't successful
						if (!response || response.status !== 200 || response.type !== 'basic') {
							return response;
						}

						// Clone the response - one to return, one to cache
						const responseToCache = response.clone();

						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseToCache);
						});

						return response;
					})
					.catch(() => {
						// If fetch fails (offline), try to return the offline page
						if (event.request.mode === 'navigate') {
							return caches.match('/offline');
						}

						// Return a basic error response if nothing else works
						return new Response('Network error occurred', {
							status: 503,
							headers: { 'Content-Type': 'text/plain' }
						});
					});
			})
		);
	}
});

self.addEventListener('fetch', (event) => {
	const { request } = event;

	// Skip non-GET requests
	if (request.method !== 'GET') {
		return;
	}

	const url = new URL(request.url);

	// Handle API requests
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache successful API responses
					if (response.ok) {
						const clonedResponse = response.clone();
						caches.open(DATA_CACHE_NAME).then((cache) => {
							cache.put(request, clonedResponse);
						});
					}
					return response;
				})
				.catch(() => {
					// If network request fails, try to serve from cache
					return (
						caches.match(request) ||
						new Response(JSON.stringify({ error: 'Network error' }), {
							status: 503,
							headers: { 'Content-Type': 'application/json' }
						})
					);
				})
		);
		return;
	}
	// Assets (JS, CSS, images)
	const isAsset = ASSETS.some((file) => url.pathname === file);
	if (isAsset) {
		// For assets, use cache-first strategy
		event.respondWith(
			caches.match(request).then((cachedResponse) => {
				return (
					cachedResponse ||
					fetch(request).then((networkResponse) => {
						if (networkResponse.ok) {
							const clonedResponse = networkResponse.clone();
							caches.open(CACHE_NAME).then((cache) => {
								cache.put(request, clonedResponse);
							});
						}
						return networkResponse;
					})
				);
			})
		);
		return;
	}

	// For HTML navigation requests (app routes)
	// Use network-first, fallback to cache, then offline page
	event.respondWith(
		fetch(request)
			.then((response) => {
				// Cache successful navigation responses in the app cache
				if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
					const clonedResponse = response.clone();
					caches.open(APP_CACHE_NAME).then((cache) => {
						cache.put(request, clonedResponse);
					});
				}
				return response;
			})
			.catch(async () => {
				// Network failed, try cache
				const cachedResponse = await caches.match(request);
				if (cachedResponse) {
					return cachedResponse;
				}

				// If no cached version, return the offline page
				const offlineResponse = await caches.match('/offline');
				return (
					offlineResponse ||
					new Response('No internet connection. Try again later.', {
						status: 503,
						headers: { 'Content-Type': 'text/plain' }
					})
				);
			})
	);
});

self.addEventListener('push', (event) => {
	if (event.data) {
		let data;
		try {
			data = event.data.json();
		} catch (e) {
			data = {
				title: 'New Notification',
				body: event.data.text()
			};
		}
		const options: NotificationOptions = {
			body: data.body || 'New notification from Azumi',
			icon: '/favicon/android-chrome-192x192.png',
			badge: '/favicon/favicon-32x32.png',
			data: {
				url: data.url || '/'
			},
			tag: data.tag || 'default'
		};

		event.waitUntil(
			self.registration.showNotification(data.title || 'Azumi Notification', options)
		);
	}
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	if (event.notification.data && event.notification.data.url) {
		event.waitUntil(
			(async () => {
				const clientList = await self.clients.matchAll({ type: 'window' });

				// If a window client is already open, focus it
				for (const client of clientList) {
					if (client.url === event.notification.data.url && 'focus' in client) {
						return client.focus();
					}
				}

				// Otherwise open a new window
				if (self.clients.openWindow) {
					return self.clients.openWindow(event.notification.data.url);
				}
			})()
		);
	}
});
