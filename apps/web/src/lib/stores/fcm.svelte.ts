import { onMessage, type Unsubscribe } from 'firebase/messaging';
import { fetchToken, messaging } from '$lib/firebaseConfig';
import { goto } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

interface ApiResponse {
	success: boolean;
	error?: string;
	message?: string;
}

async function getNotificationPermissionAndToken() {
	if (!('Notification' in window)) {
		console.info('This browser does not support desktop notification');
		return null;
	}

	if (Notification.permission === 'granted') {
		return await fetchToken();
	}

	if (Notification.permission !== 'denied') {
		const permission = await Notification.requestPermission();
		if (permission === 'granted') {
			return await fetchToken();
		}
	}
	console.log('Notification permission not granted.');
	return null;
}

async function getTokenIfPermissionGranted() {
	if (!('Notification' in window)) {
		console.info('This browser does not support desktop notification');
		return null;
	}

	if (Notification.permission === 'granted') {
		return await fetchToken();
	}

	console.log('Notification permission not yet granted.');
	return null;
}

function generateVendorSirenSound() {
	try {
		console.log('🚨 Generating loud siren sound for vendor order...');

		if (typeof window !== 'undefined' && 'AudioContext' in window) {
			const audioContext = new AudioContext();

			// Create multiple overlapping siren sounds for maximum attention
			for (let cycle = 0; cycle < 5; cycle++) {
				setTimeout(() => {
					const oscillator = audioContext.createOscillator();
					const gainNode = audioContext.createGain();

					oscillator.connect(gainNode);
					gainNode.connect(audioContext.destination);

					// Siren frequency sweep: 800Hz to 400Hz and back
					oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
					oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
					oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 1);

					// Very loud volume
					gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 1);

					oscillator.start(audioContext.currentTime);
					oscillator.stop(audioContext.currentTime + 1);
				}, cycle * 300);
			}
		}
	} catch (error) {
		console.warn('🚨 Error generating siren sound:', error);
	}
}

export function createFCMStore() {
	let token = $state<string | null>(null);
	let notificationPermissionStatus = $state<NotificationPermission | null>(null);
	let retryLoadToken = 0;
	let isLoading = false;
	let messageUnsubscribe: Unsubscribe | null = null;
	let isTokenRegisteredOnServer = $state<boolean | null>(null);
	async function loadToken(): Promise<void> {
		if (isLoading) return;

		isLoading = true;
		const fetchedToken = await getTokenIfPermissionGranted();

		if (Notification.permission === 'denied') {
			notificationPermissionStatus = 'denied';
			console.info(
				'%cPush Notifications issue - permission denied',
				'color: green; background: #c7c7c7; padding: 8px; font-size: 20px'
			);
			isLoading = false;
			return;
		}
		if (!fetchedToken) {
			if (retryLoadToken >= 3) {
				console.info(
					'%cPush Notifications issue - unable to load token after 3 retries',
					'color: green; background: #c7c7c7; padding: 8px; font-size: 20px'
				);
				isLoading = false;
				return;
			}

			retryLoadToken += 1;
			console.error('An error occurred while retrieving token. Retrying...');
			isLoading = false;
			await loadToken();
			return;
		} // Check if the token is registered on the server
		const isRegistered = await checkTokenRegistrationStatus(fetchedToken);

		notificationPermissionStatus = Notification.permission;
		token = fetchedToken;
		isTokenRegisteredOnServer = isRegistered;

		console.log('🔥 [FCM Store] Token loaded:', {
			token: fetchedToken.substring(0, 20) + '...',
			isRegisteredOnServer: isRegistered
		});

		// If token is not registered on server, auto-register it
		if (!isRegistered) {
			console.log('🔥 [FCM Store] Token not registered on server, auto-registering...');
			const registered = await registerTokenWithServer({
				token: fetchedToken,
				deviceId: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
				deviceType: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
				userAgent: navigator.userAgent
			});
			isTokenRegisteredOnServer = registered;

			if (registered) {
				console.log('✅ [FCM Store] Token auto-registered successfully');
			} else {
				console.warn('❌ [FCM Store] Auto-registration failed');
			}
		}

		isLoading = false;
	}
	async function setupMessageListener() {
		if (!token || !messaging) return;

		// Prevent duplicate listeners
		if (messageUnsubscribe) {
			messageUnsubscribe();
			messageUnsubscribe = null;
		}

		console.log(
			`🔥 Setting up FOREGROUND onMessage listener for token: ${token.substring(0, 20)}...`
		);
		messageUnsubscribe = onMessage(messaging, (payload) => {
			if (Notification.permission !== 'granted') return;

			console.log('🔥 FOREGROUND notification received - showing toast only:', payload); // Support both 'url' (vendor) and 'link' (rider) properties
			const notificationUrl = payload.data?.url || payload.data?.link;
			const notificationType = payload.data?.type;
			const action = payload.data?.action;
			const orderId = payload.data?.orderId;

			// Play loud siren sound for vendor order notifications
			if (notificationType === 'new_order' || notificationType === 'order_created') {
				const isVendorOrder =
					payload.data?.isVendorOrder === 'true' ||
					payload.data?.category === 'vendor' ||
					notificationType === 'new_order';

				if (isVendorOrder) {
					generateVendorSirenSound();
				}
			}

			// Create action button based on notification type
			let actionLabel = 'View';
			if (action === 'view_order') {
				actionLabel = 'View Order';
			} else if (action === 'accept_delivery') {
				actionLabel = 'Accept Delivery';
			} else if (action === 'view_available_orders') {
				actionLabel = 'View Orders';
			} // ONLY show toast notification for foreground - no browser notifications
			if (notificationUrl) {
				toast.info(`${payload.data?.title}: ${payload.data?.body}`, {
					action: {
						label: actionLabel,
						onClick: () => {
							console.log('🔥 Toast action clicked, navigating to:', notificationUrl);
							// Special handling for rider delivery notifications when already on rider page
							if (
								typeof window !== 'undefined' &&
								window.location.pathname === '/rider' &&
								notificationType === 'delivery_opportunity' &&
								orderId
							) {
								// Try to highlight the order card first, then navigate if needed
								const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
								if (orderCard) {
									orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
									orderCard.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
									setTimeout(() => {
										orderCard.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
									}, 3000);
									return; // Don't navigate, just highlight
								}
							}
							goto(notificationUrl);
						}
					}
				});
			} else {
				toast.info(`${payload.data?.title}: ${payload.data?.body}`);
			}

			// DO NOT create additional browser notifications in foreground
			// Service worker will handle background notifications only
		});
	}
	function initialize() {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			console.log('🔥 [FCM Store] Initializing FCM store...');
			console.log('🔥 [FCM Store] Current notification permission:', Notification.permission);
			console.log('🔥 [FCM Store] Service worker support:', 'serviceWorker' in navigator);

			notificationPermissionStatus = Notification.permission;

			console.log('🔥 [FCM Store] Permission status set to:', notificationPermissionStatus);
			console.log(
				'🔥 [FCM Store] isSupported:',
				typeof window !== 'undefined' && 'Notification' in window
			);
			console.log('🔥 [FCM Store] isBlocked:', notificationPermissionStatus === 'denied');

			// Listen for messages from service worker about vendor orders
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.addEventListener('message', (event) => {
					if (event.data && event.data.type === 'VENDOR_ORDER_NOTIFICATION') {
						console.log('🚨 [FCM Store] Received vendor order notification from service worker');
						generateVendorSirenSound();
					}
				});
			}

			// Debug service worker registrations
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.getRegistrations().then((registrations) => {
					console.log('🔥 [FCM Store] Active service workers:', registrations.length);
					registrations.forEach((reg, index) => {
						console.log(`🔥 [FCM Store] SW ${index + 1}:`, reg.scope, reg.active?.scriptURL);
					});
				});
			}

			loadToken();
		} else {
			console.warn('🔥 [FCM Store] Notifications not supported in this browser');
		}
	}
	function destroy() {
		if (messageUnsubscribe) {
			messageUnsubscribe();
			messageUnsubscribe = null;
		}
	}
	async function registerTokenWithServer(tokenData: {
		token: string;
		deviceId?: string;
		deviceType?: string;
		userAgent?: string;
	}) {
		try {
			console.log('Registering token with server:', tokenData);
			const response = await fetch(
				`${PUBLIC_API_BASE_URL}/api/push-notifications/demo-register-token`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify(tokenData)
				}
			);

			console.log('Response status:', response.status);
			console.log('Response ok:', response.ok);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Server response error:', response.status, errorText);
				return false;
			}

			const result = (await response.json()) as ApiResponse;
			console.log('Registration result:', result);
			return result.success;
		} catch (error) {
			console.error('Error registering token with server:', error);
			return false;
		}
	}
	async function sendDemoNotification(data?: {
		title?: string;
		body?: string;
		data?: Record<string, string>;
	}) {
		try {
			if (!token) {
				console.error('No FCM token available for demo notification');
				return false;
			}

			const response = await fetch(
				`${PUBLIC_API_BASE_URL}/api/push-notifications/demo-notification`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({
						...data,
						token: token
					})
				}
			);
			const result = (await response.json()) as ApiResponse;
			return result.success;
		} catch (error) {
			console.error('Error sending demo notification:', error);
			return false;
		}
	}

	async function sendVendorOrderDemo() {
		return await sendDemoNotification({
			title: 'New Vendor Order! 🚨',
			body: 'Order #12345 - Customer is waiting for your response',
			data: {
				type: 'new_order',
				isVendorOrder: 'true',
				category: 'vendor',
				orderId: '12345',
				url: '/vendor/orders/12345',
				action: 'view_order'
			}
		});
	}
	async function subscribeToTopic(topicName: string) {
		try {
			const response = await fetch(
				`${PUBLIC_API_BASE_URL}/api/push-notifications/subscribe-topic`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({ topic: topicName, subscribe: true })
				}
			);

			const result = (await response.json()) as ApiResponse;
			return result.success;
		} catch (error) {
			console.error('Error subscribing to topic:', error);
			return false;
		}
	}
	async function unsubscribeFromTopic(topicName: string) {
		try {
			const response = await fetch(
				`${PUBLIC_API_BASE_URL}/api/push-notifications/subscribe-topic`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({ topic: topicName, subscribe: false })
				}
			);

			const result = (await response.json()) as ApiResponse;
			return result.success;
		} catch (error) {
			console.error('Error unsubscribing from topic:', error);
			return false;
		}
	}
	async function requestNotificationAndGetToken() {
		const fetchedToken = await getNotificationPermissionAndToken();

		if (fetchedToken) {
			token = fetchedToken;
			notificationPermissionStatus = Notification.permission;

			const registered = await registerTokenWithServer({
				token: fetchedToken,
				deviceId: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
				deviceType: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
				userAgent: navigator.userAgent
			});

			isTokenRegisteredOnServer = registered;

			if (!registered) {
				console.warn('Failed to register token with server');
			}

			// Don't setup listener here - it's handled by $effect
		}

		return fetchedToken;
	}

	async function checkTokenRegistrationStatus(tokenToCheck: string): Promise<boolean> {
		try {
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/push-notifications/check-token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ token: tokenToCheck })
			});
			if (response.ok) {
				const result = (await response.json()) as { isRegistered?: boolean };
				return result.isRegistered || false;
			}
			return false;
		} catch (error) {
			console.error('Error checking token registration:', error);
			return false;
		}
	}

	$effect(() => {
		if (token) {
			setupMessageListener();
		}
	});
	return {
		get token() {
			return token;
		},
		get notificationPermissionStatus() {
			return notificationPermissionStatus;
		},
		get isSupported() {
			return typeof window !== 'undefined' && 'Notification' in window;
		},
		get hasPermission() {
			return notificationPermissionStatus === 'granted';
		},
		get canRequestPermission() {
			return notificationPermissionStatus === 'default' || notificationPermissionStatus === null;
		},
		get isBlocked() {
			return notificationPermissionStatus === 'denied';
		},
		get isLoading() {
			return isLoading;
		},
		get isTokenRegisteredOnServer() {
			return isTokenRegisteredOnServer;
		},
		get needsRegistration() {
			return token && isTokenRegisteredOnServer === false;
		},
		initialize,
		destroy,
		requestNotificationAndGetToken,
		sendDemoNotification,
		sendVendorOrderDemo,
		subscribeToTopic,
		unsubscribeFromTopic
	};
}
