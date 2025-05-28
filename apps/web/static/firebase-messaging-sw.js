import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

const firebaseConfig = {
	apiKey: 'AIzaSyA4c9-n0mDc0qih0BC33GbC_i9XmWH_2J0',
	authDomain: 'azumi-ed6f3.firebaseapp.com',
	projectId: 'azumi-ed6f3',
	storageBucket: 'azumi-ed6f3.firebasestorage.app',
	messagingSenderId: '716036974512',
	appId: '1:716036974512:web:5921d632f404a6fd465875',
	measurementId: 'G-9WFH0Z1HRG'
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
	console.log('[firebase-messaging-sw.js] Received background message ', payload);

	const notificationTitle = payload.notification?.title || 'Background Message Title';
	const notificationOptions = {
		body: payload.notification?.body || 'Background message body.',
		icon: '/favicon.png',
		badge: '/favicon.png',
		data: payload.data
	};

	self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
	console.log('[firebase-messaging-sw.js] Notification click received.');

	event.notification.close();

	event.waitUntil(clients.openWindow(event.notification.data?.link || '/'));
});
