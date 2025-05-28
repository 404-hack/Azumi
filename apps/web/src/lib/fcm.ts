import { messaging } from '$lib/firebaseConfig';
import { getToken, onMessage } from 'firebase/messaging';
import { PUBLIC_FIREBASE_VAPID_KEY } from '$env/static/public';

export interface FCMNotification {
	title?: string;
	body?: string;
	icon?: string;
	data?: Record<string, string>;
}

export interface FCMTokenState {
	token: string | null;
	permission: NotificationPermission;
	isSupported: boolean;
	isLoading: boolean;
	error: string | null;
}

export interface FCMTokenRegistration {
	token: string;
	deviceId?: string;
	deviceType?: string;
	userAgent?: string;
}

class FCMService {
	private token: string | null = null;
	private isSupported: boolean = false;
	private callbacks: ((state: FCMTokenState) => void)[] = [];

	constructor() {
		this.isSupported = this.checkSupport();
		this.setupForegroundMessaging();
	}

	private checkSupport(): boolean {
		return (
			typeof window !== 'undefined' &&
			'serviceWorker' in navigator &&
			'Notification' in window &&
			navigator.serviceWorker !== undefined
		);
	}

	private notifyStateChange() {
		const state: FCMTokenState = {
			token: this.token,
			permission: this.isSupported ? Notification.permission : 'denied',
			isSupported: this.isSupported,
			isLoading: false,
			error: null
		};
		this.callbacks.forEach((callback) => callback(state));
	}

	private setupForegroundMessaging() {
		if (!this.isSupported) return;

		onMessage(messaging, (payload) => {
			console.log('Message received in foreground: ', payload);

			if (payload.notification) {
				this.showNotification({
					title: payload.notification.title,
					body: payload.notification.body,
					icon: payload.notification.icon || '/favicon.png',
					data: payload.data
				});
			}
		});
	}

	private async showNotification(notification: FCMNotification) {
		if (Notification.permission === 'granted') {
			const notif = new Notification(notification.title || 'Notification', {
				body: notification.body,
				icon: notification.icon,
				data: notification.data,
				tag: 'fcm-notification',
				requireInteraction: false
			});

			notif.onclick = () => {
				window.focus();
				notif.close();
				if (notification.data?.click_action) {
					window.location.href = notification.data.click_action;
				}
			};

			setTimeout(() => notif.close(), 5000);
		}
	}

	async requestPermission(): Promise<NotificationPermission> {
		if (!this.isSupported) {
			return 'denied';
		}

		try {
			const permission = await Notification.requestPermission();
			this.notifyStateChange();
			return permission;
		} catch (error) {
			console.error('Error requesting notification permission:', error);
			return 'denied';
		}
	}

	async getRegistrationToken(): Promise<string | null> {
		if (!this.isSupported) {
			console.warn('FCM is not supported in this browser');
			return null;
		}

		try {
			const permission = await this.requestPermission();
			if (permission !== 'granted') {
				console.log('Permission not granted for notifications');
				return null;
			}

			await navigator.serviceWorker.register('/firebase-messaging-sw.js');

			const currentToken = await getToken(messaging, {
				vapidKey: PUBLIC_FIREBASE_VAPID_KEY
			});

			if (currentToken) {
				this.token = currentToken;
				this.notifyStateChange();
				return currentToken;
			} else {
				console.log('No registration token available.');
				return null;
			}
		} catch (err) {
			console.error('An error occurred while retrieving token:', err);
			return null;
		}
	}

	async requestNotificationAndGetToken(): Promise<string | null> {
		const permission = await this.requestPermission();
		if (permission === 'granted') {
			return await this.getRegistrationToken();
		}
		return null;
	}

	async registerTokenWithServer(tokenData: FCMTokenRegistration): Promise<boolean> {
		try {
			const response = await fetch('/api/fcm/register-token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify(tokenData)
			});

			return response.ok;
		} catch (error) {
			console.error('Error registering token with server:', error);
			return false;
		}
	}

	async sendDemoNotification(data?: {
		title?: string;
		body?: string;
		data?: Record<string, string>;
	}): Promise<boolean> {
		try {
			const response = await fetch('/api/fcm/demo-notification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify(data || {})
			});

			return response.ok;
		} catch (error) {
			console.error('Error sending demo notification:', error);
			return false;
		}
	}

	async subscribeToTopic(topic: string): Promise<boolean> {
		try {
			const response = await fetch('/api/fcm/subscribe-topic', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ topic, subscribe: true })
			});

			return response.ok;
		} catch (error) {
			console.error('Error subscribing to topic:', error);
			return false;
		}
	}

	async unsubscribeFromTopic(topic: string): Promise<boolean> {
		try {
			const response = await fetch('/api/fcm/subscribe-topic', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ topic, subscribe: false })
			});

			return response.ok;
		} catch (error) {
			console.error('Error unsubscribing from topic:', error);
			return false;
		}
	}

	subscribe(callback: (state: FCMTokenState) => void) {
		this.callbacks.push(callback);

		// Call immediately with current state
		this.notifyStateChange();

		// Return unsubscribe function
		return () => {
			const index = this.callbacks.indexOf(callback);
			if (index > -1) {
				this.callbacks.splice(index, 1);
			}
		};
	}

	getToken(): string | null {
		return this.token;
	}

	isNotificationSupported(): boolean {
		return this.isSupported;
	}

	getCurrentPermission(): NotificationPermission {
		return this.isSupported ? Notification.permission : 'denied';
	}
}

export const fcmService = new FCMService();
