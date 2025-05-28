import { fcmService, type FCMTokenState } from '$lib/fcm';

export function createFCMStore() {
	let state = $state<FCMTokenState>({
		token: null,
		permission: 'default',
		isSupported: false,
		isLoading: false,
		error: null
	});

	let unsubscribe: (() => void) | null = null;

	function initialize() {
		if (typeof window !== 'undefined') {
			unsubscribe = fcmService.subscribe((newState) => {
				state = newState;
			});
		}
	}

	function destroy() {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
	}

	async function requestPermission() {
		state.isLoading = true;
		try {
			const permission = await fcmService.requestPermission();
			state.permission = permission;
			return permission;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Unknown error';
			return 'denied' as NotificationPermission;
		} finally {
			state.isLoading = false;
		}
	}

	async function getToken() {
		state.isLoading = true;
		try {
			const token = await fcmService.getRegistrationToken();
			state.token = token;
			return token;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Unknown error';
			return null;
		} finally {
			state.isLoading = false;
		}
	}
	async function requestNotificationAndGetToken() {
		state.isLoading = true;
		try {
			const token = await fcmService.requestNotificationAndGetToken();
			state.token = token;

			if (token) {
				const registered = await fcmService.registerTokenWithServer({
					token,
					deviceId: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
					deviceType: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
					userAgent: navigator.userAgent
				});

				if (!registered) {
					console.warn('Failed to register token with server');
				}
			}

			return token;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Unknown error';
			return null;
		} finally {
			state.isLoading = false;
		}
	}

	async function sendDemoNotification(data?: {
		title?: string;
		body?: string;
		data?: Record<string, string>;
	}) {
		state.isLoading = true;
		try {
			const success = await fcmService.sendDemoNotification(data);
			if (!success) {
				state.error = 'Failed to send demo notification';
			}
			return success;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Unknown error';
			return false;
		} finally {
			state.isLoading = false;
		}
	}

	async function subscribeToTopic(topic: string) {
		state.isLoading = true;
		try {
			const success = await fcmService.subscribeToTopic(topic);
			if (!success) {
				state.error = 'Failed to subscribe to topic';
			}
			return success;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Unknown error';
			return false;
		} finally {
			state.isLoading = false;
		}
	}

	async function unsubscribeFromTopic(topic: string) {
		state.isLoading = true;
		try {
			const success = await fcmService.unsubscribeFromTopic(topic);
			if (!success) {
				state.error = 'Failed to unsubscribe from topic';
			}
			return success;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Unknown error';
			return false;
		} finally {
			state.isLoading = false;
		}
	}

	return {
		get token() {
			return state.token;
		},
		get permission() {
			return state.permission;
		},
		get isSupported() {
			return state.isSupported;
		},
		get isLoading() {
			return state.isLoading;
		},
		get error() {
			return state.error;
		},
		get canRequestPermission() {
			return state.isSupported && state.permission === 'default';
		},
		get hasPermission() {
			return state.permission === 'granted';
		},
		get isBlocked() {
			return state.permission === 'denied';
		},
		initialize,
		destroy,
		requestPermission,
		getToken,
		requestNotificationAndGetToken,
		sendDemoNotification,
		subscribeToTopic,
		unsubscribeFromTopic,
		clearError: () => {
			state.error = null;
		}
	};
}
