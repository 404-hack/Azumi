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
			description:
				"Get instant notifications when you receive new orders and when they're ready for pickup."
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
			description:
				'Get notified when your order is confirmed, being prepared, and out for delivery.'
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
	<!-- Fixed position side popup -->
	<div
		class="fixed bottom-4 right-4 z-50 max-w-sm duration-300 animate-in fade-in slide-in-from-right-5"
	>
		<Card class="border border-border bg-card text-card-foreground shadow-lg">
			<CardContent class="p-4">
				<div class="mb-3 flex items-start gap-3">
					<Bell class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
					<div class="flex-1">
						<h3 class="text-sm font-medium text-foreground">
							{contextMessages[context].title}
						</h3>
						<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
							{contextMessages[context].description}
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onclick={handleDismiss}
						class="h-6 w-6 p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<X class="h-3 w-3" />
					</Button>
				</div>
				<div class="flex gap-2">
					<Button
						size="sm"
						onclick={handleEnableNotifications}
						disabled={isLoading}
						class="h-auto flex-1 bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
					>
						{#if isLoading}
							<div
								class="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
							></div>
						{:else}
							Enable
						{/if}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onclick={handleDismiss}
						class="h-auto px-3 py-1.5 text-xs text-muted-foreground"
					>
						Later
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
