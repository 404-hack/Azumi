import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { PUBLIC_FIREBASE_VAPID_KEY } from '$env/static/public';

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

let analytics: any = null;
let messaging: any = null;

if (typeof window !== 'undefined') {
	analytics = getAnalytics(app);
	messaging = getMessaging(app);
}

export async function fetchToken(): Promise<string | null> {
	if (!messaging) {
		console.warn('Messaging not initialized');
		return null;
	}
	try {
		// Check for existing Firebase service worker first
		console.log('🔥 Checking for existing Firebase service worker...');
		const registrations = await navigator.serviceWorker.getRegistrations();
		console.log(`🔥 Found ${registrations.length} existing service worker(s)`);

		let firebaseRegistration = null;

		// Look for existing Firebase service worker
		for (const registration of registrations) {
			if (registration.active?.scriptURL?.includes('firebase-messaging-sw.js')) {
				console.log('🔥 Found existing Firebase service worker:', registration.scope);
				firebaseRegistration = registration;
				break;
			}
		}

		// Register Firebase service worker if not found
		if (!firebaseRegistration) {
			console.log('🔥 Registering new Firebase service worker...');
			firebaseRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
				updateViaCache: 'none',
				scope: '/'
			});
		} else {
			console.log('🔥 Using existing Firebase service worker');
		}

		// Force update if there's a waiting service worker
		if (firebaseRegistration.waiting) {
			console.log('🔥 Updating service worker...');
			firebaseRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}

		// Wait for the service worker to be ready and active
		await navigator.serviceWorker.ready;

		// Ensure the service worker is actually active
		if (!firebaseRegistration.active) {
			console.log('🔥 Waiting for service worker to activate...');
			await new Promise((resolve) => {
				if (firebaseRegistration.installing) {
					firebaseRegistration.installing.addEventListener('statechange', function handler() {
						if (this.state === 'activated') {
							this.removeEventListener('statechange', handler);
							resolve(undefined);
						}
					});
				} else {
					resolve(undefined);
				}
			});
		}

		console.log('🔥 Firebase service worker is ready and active');

		const token = await getToken(messaging, {
			vapidKey: PUBLIC_FIREBASE_VAPID_KEY,
			serviceWorkerRegistration: firebaseRegistration
		});

		console.log('🔥 FCM Token obtained:', token ? 'Success' : 'Failed');
		return token;
	} catch (error) {
		console.error('Error fetching token:', error);
		return null;
	}
}

export { messaging };
