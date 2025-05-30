<script lang="ts">
	import { onMount } from 'svelte';
	import { createFCMStore } from '$lib/stores/fcm.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Bell, X } from 'lucide-svelte';

    interface Props {
        context?: 'vendor' | 'rider' | 'admin' | 'customer';
        showOnlyIfNotGranted?: boolean;
    }

    let { context = 'customer', showOnlyIfNotGranted = true }: Props = $props();

	const fcmStore = createFCMStore();
	let showBanner = $state(false);
	let isLoading = $state(false);

	const contextMessages = {
		vendor: {
			title: 'Stay updated on your orders',
			description: 'Get instant notifications when you receive new orders and when they\'re ready for pickup.'
		},
		rider: {
			title: 'Never miss a delivery opportunity',
			description: 'Get notified instantly when new delivery jobs are available in your area.'
		},
		admin: {
			title: 'Stay on top of your business',
			description: 'Receive important notifications about orders, vendors, and system updates.'
		},
		customer: {
			title: 'Track your orders in real-time',
			description: 'Get notified when your order is confirmed, being prepared, and out for delivery.'
		}
	};

	onMount(() => {
		fcmStore.initialize();
		
		if (showOnlyIfNotGranted) {
			showBanner = !fcmStore.hasPermission && fcmStore.canRequestPermission;
		} else {
			showBanner = true;
		}
	});

	async function handleEnableNotifications() {
		isLoading = true;
		try {
			const token = await fcmStore.requestNotificationAndGetToken();
			if (token) {
				showBanner = false;
			}
		} catch (error) {
			console.error('Failed to enable notifications:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleDismiss() {
		showBanner = false;
	}
</script>

{#if showBanner}
	<Card class="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 mb-4">
		<CardContent class="flex items-center justify-between p-4">
			<div class="flex items-start gap-3">
				<Bell class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
				<div class="flex-1">
					<h3 class="font-medium text-blue-900 dark:text-blue-100">
						{contextMessages[context].title}
					</h3>
					<p class="text-sm text-blue-700 dark:text-blue-200 mt-1">
						{contextMessages[context].description}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2 ml-4">
				<Button
					size="sm"
					onclick={handleEnableNotifications}
					disabled={isLoading}
					class="bg-blue-600 hover:bg-blue-700 text-white"
				>
					{#if isLoading}
						<div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
					{:else}
						Enable Notifications
					{/if}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onclick={handleDismiss}
					class="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
				>
					<X class="h-4 w-4" />
				</Button>
			</div>
		</CardContent>
	</Card>
{/if}
