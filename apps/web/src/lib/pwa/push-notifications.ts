/**
 * Checks if push notifications are supported in the current browser
 */
export const isPushNotificationSupported = () => {
	return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Requests permission for push notifications
 * @returns Promise that resolves to the permission status: 'granted', 'denied', or 'default'
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
	if (!isPushNotificationSupported()) {
		throw new Error('Push notifications are not supported in this browser');
	}

	return await Notification.requestPermission();
};

/**
 * Subscribes the user to push notifications
 * @param serverPublicKey - The VAPID public key from your server
 * @returns Push subscription object or null if subscription failed
 */
export const subscribeToPushNotifications = async (serverPublicKey: string) => {
	if (!isPushNotificationSupported()) {
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.ready;

		// Get current subscription or create a new one
		let subscription = await registration.pushManager.getSubscription();

		if (!subscription) {
			// Create a new subscription
			subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(serverPublicKey)
			});
		}

		return subscription;
	} catch (error) {
		console.error('Failed to subscribe to push notifications:', error);
		return null;
	}
};

/**
 * Unsubscribes the user from push notifications
 * @returns boolean indicating if unsubscribe was successful
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
	if (!isPushNotificationSupported()) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (subscription) {
			return await subscription.unsubscribe();
		}

		return true;
	} catch (error) {
		console.error('Failed to unsubscribe from push notifications:', error);
		return false;
	}
};

/**
 * Helper function to convert base64 string to Uint8Array for push subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}

	return outputArray;
}
