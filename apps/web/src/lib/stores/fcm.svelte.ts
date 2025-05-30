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

export function createFCMStore() {
	let token = $state<string | null>(null);
	let notificationPermissionStatus = $state<NotificationPermission | null>(null);
	let retryLoadToken = 0;
	let isLoading = false;
	let messageUnsubscribe: Unsubscribe | null = null;

	async function loadToken(): Promise<void> {
		if (isLoading) return;

		isLoading = true;
		const fetchedToken = await getNotificationPermissionAndToken();

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
				toast.error('Unable to load token, refresh the browser');
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
		}

		notificationPermissionStatus = Notification.permission;
		token = fetchedToken;
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

			console.log('🔥 FOREGROUND notification received - showing toast only:', payload);
			const link = payload.fcmOptions?.link || payload.data?.link;

			// ONLY show toast notification for foreground - no browser notifications
			if (link) {
				toast.info(`${payload.notification?.title}: ${payload.notification?.body}`, {
					action: {
						label: 'Visit',
						onClick: () => {
							const notificationLink = payload.fcmOptions?.link || payload.data?.link;
							if (notificationLink) {
								goto(notificationLink);
							}
						}
					}
				});
			} else {
				toast.info(`${payload.notification?.title}: ${payload.notification?.body}`);
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
			if (!registered) {
				console.warn('Failed to register token with server');
			}

			// Don't setup listener here - it's handled by $effect
		}

		return fetchedToken;
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
		initialize,
		destroy,
		requestNotificationAndGetToken,
		sendDemoNotification,
		subscribeToTopic,
		unsubscribeFromTopic
	};
}
