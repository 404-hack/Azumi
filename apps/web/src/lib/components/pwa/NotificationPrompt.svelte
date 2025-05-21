<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import {
		isPushNotificationSupported,
		requestNotificationPermission,
		subscribeToPushNotifications
	} from '$lib/pwa/push-notifications';

	// This would normally come from your environment variables
	// or server-side API - using a placeholder for now
	const VAPID_PUBLIC_KEY =
		'BPGWVmFKRMRue-WlQ4_ztqIBd5Brw2xmWH_HFyu_Dgy0aJ5jC-NdowHaFJmWz_LQQ33bGAXZGQ4LdTHbkB1i0V8';

	let permissionStatus: NotificationPermission | null = null;
	let isSupported = false;

	onMount(async () => {
		isSupported = isPushNotificationSupported();

		if (isSupported) {
			permissionStatus = Notification.permission;

			if (permissionStatus === 'granted') {
				// Automatically subscribe if permission is already granted
				try {
					const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);
					if (subscription) {
						// Send subscription to your backend (not implemented here)
						console.log('User is subscribed to push notifications');
					}
				} catch (error) {
					console.error('Failed to subscribe:', error);
				}
			}
		}
	});

	const handleSubscribe = async () => {
		try {
			permissionStatus = await requestNotificationPermission();

			if (permissionStatus === 'granted') {
				const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);

				if (subscription) {
					// In a real app, you would send this subscription object to your server
					// for storage and later use when sending push notifications
					toast.success('Successfully subscribed to notifications!');
				} else {
					toast.error('Failed to subscribe to notifications');
				}
			} else if (permissionStatus === 'denied') {
				toast.error('Notification permission was denied');
			}
		} catch (error) {
			console.error('Error subscribing to notifications:', error);
			toast.error('Something went wrong. Please try again.');
		}
	};
</script>

{#if isSupported && permissionStatus !== 'granted'}
	<div class="fixed bottom-20 right-4 z-40 rounded-lg bg-white p-4 shadow-lg md:bottom-4">
		<h3 class="mb-2 text-sm font-medium text-gray-900">Get notified</h3>
		<p class="mb-3 text-xs text-gray-600">
			Enable push notifications to get updates on your orders and special offers.
		</p>
		<button
			on:click={handleSubscribe}
			class="w-full rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
		>
			Enable Notifications
		</button>
	</div>
{/if}
