// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
	apiKey: 'AIzaSyA4c9-n0mDc0qih0BC33GbC_i9XmWH_2J0',
	authDomain: 'azumi-ed6f3.firebaseapp.com',
	projectId: 'azumi-ed6f3',
	storageBucket: 'azumi-ed6f3.firebasestorage.app',
	messagingSenderId: '716036974512',
	appId: '1:716036974512:web:5921d632f404a6fd465875',
	measurementId: 'G-9WFH0Z1HRG'
};

console.log('🔥 [SW] Service Worker initializing - BACKGROUND ONLY...');

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Track recent notifications to prevent duplicates
const recentNotifications = new Set();

// ONLY handle background messages - when app is not in focus
messaging.onBackgroundMessage((payload) => {
	console.log('🔥 [SW] BACKGROUND message received (app not in focus):', payload);

	const notificationTitle = payload.notification?.title || 'New Message';
	const notificationBody = payload.notification?.body || 'You have a new message';

	// Create a unique ID for this notification to prevent duplicates
	const notificationId = `${notificationTitle}-${notificationBody}-${Date.now()}`;
	const shortId = `${notificationTitle}-${notificationBody}`;

	// Check if we've shown this notification recently (within last 2 seconds)
	if (recentNotifications.has(shortId)) {
		console.log('🔥 [SW] DUPLICATE notification detected, skipping:', shortId);
		return;
	}

	// Add to recent notifications and clean up after 2 seconds
	recentNotifications.add(shortId);
	setTimeout(() => {
		recentNotifications.delete(shortId);
	}, 2000);

	const notificationOptions = {
		body: notificationBody,
		icon: '/favicon.png',
		badge: '/favicon.png',
		image: payload.notification?.image,
		data: payload.data || {},
		tag: shortId, // Use consistent tag to prevent duplicates
		requireInteraction: false,
		silent: false,
		vibrate: [200, 100, 200],
		renotify: false
	};

	console.log('🔥 [SW] Showing BACKGROUND notification:', notificationTitle, 'ID:', shortId);

	return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
	console.log('🔥 [SW] Notification clicked:', event);

	event.notification.close();

	const clickAction = event.notification.data?.click_action || '/';
	const url = clickAction.startsWith('http')
		? clickAction
		: `${self.location.origin}${clickAction}`;

	event.waitUntil(
		clients.matchAll({ type: 'window' }).then(function (clientList) {
			for (let client of clientList) {
				if (client.url.startsWith(self.location.origin) && 'focus' in client) {
					console.log('🔥 [SW] Focusing existing window');
					return client.focus();
				}
			}
			if (clients.openWindow) {
				console.log('🔥 [SW] Opening new window');
				return clients.openWindow(url);
			}
		})
	);
});

// Service worker lifecycle events
self.addEventListener('install', function (event) {
	console.log('🔥 [SW] Service worker installing');
	// Take control immediately
	self.skipWaiting();
});

self.addEventListener('activate', function (event) {
	console.log('🔥 [SW] Service worker activated');
	// Take control of all clients immediately
	event.waitUntil(self.clients.claim());
});

// Handle messages from main app
self.addEventListener('message', function (event) {
	console.log('🔥 [SW] Received message:', event.data);
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

console.log('🔥 [SW] Service Worker ready - BACKGROUND ONLY');
