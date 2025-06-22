<script lang="ts">
	import { onMount } from 'svelte';
	import { createFCMStore } from '$lib/stores/fcm.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Bell, BellOff, CheckCircle, AlertTriangle, Loader2, Send, Users } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	const fcmStore = createFCMStore();

	let demoTitle = $state('Demo Notification');
	let demoBody = $state('This is a test notification from your Azumi app!');
	let topicName = $state('general');
	let isSubscribedToTopic = $state(false);
	let tokenData = $state(null);
	let showTokenDebug = $state(false);

	onMount(() => {
		fcmStore.initialize();
		return () => fcmStore.destroy();
	});
	async function handleEnableNotifications() {
		console.log('Enable notifications clicked');
		try {
			console.log('Requesting notification token...');
			const token = await fcmStore.requestNotificationAndGetToken();
			console.log('Token received:', token);
			if (token) {
				toast.success('Notifications enabled successfully!');
			} else {
				toast.error('Failed to enable notifications');
			}
		} catch (error) {
			toast.error('Error enabling notifications');
			console.error('Error:', error);
		}
	}

	async function handleSendDemo() {
		try {
			const success = await fcmStore.sendDemoNotification({
				title: demoTitle,
				body: demoBody,
				data: {
					demo: 'true',
					timestamp: new Date().toISOString()
				}
			});

			if (success) {
				toast.success('Demo notification sent!');
			} else {
				toast.error('Failed to send demo notification');
			}
		} catch (error) {
			toast.error('Error sending demo notification');
			console.error('Error:', error);
		}
	}

	async function handleTopicSubscription() {
		try {
			let success;
			if (isSubscribedToTopic) {
				success = await fcmStore.unsubscribeFromTopic(topicName);
				if (success) {
					isSubscribedToTopic = false;
					toast.success(`Unsubscribed from ${topicName}`);
				}
			} else {
				success = await fcmStore.subscribeToTopic(topicName);
				if (success) {
					isSubscribedToTopic = true;
					toast.success(`Subscribed to ${topicName}`);
				}
			}

			if (!success) {
				toast.error('Failed to update topic subscription');
			}
		} catch (error) {
			toast.error('Error managing topic subscription');
			console.error('Error:', error);
		}
	}

	async function fetchTokenDebugInfo() {
		try {
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/push-notifications/tokens`, {
				credentials: 'include'
			});

			if (response.ok) {
				tokenData = await response.json();
				showTokenDebug = true;
			} else {
				toast.error('Failed to fetch token info');
			}
		} catch (error) {
			toast.error('Error fetching token info');
			console.error('Error:', error);
		}
	}
	async function testBrowserNotification() {
		try {
			console.log('🔥 Testing browser notification...');
			console.log('🔥 Notification permission:', Notification.permission);

			if (Notification.permission === 'granted') {
				const notification = new Notification('Browser Test', {
					body: 'This is a direct browser notification test',
					icon: '/favicon.png',
					tag: 'browser-test'
				});

				notification.onclick = () => {
					console.log('🔥 Browser notification clicked');
					notification.close();
				};

				toast.success('Browser notification sent!');
			} else {
				toast.error('Need notification permission first');
			}
		} catch (error) {
			toast.error('Browser notification failed');
			console.error('Error:', error);
		}
	}
	async function testServiceWorkerNotification() {
		try {
			console.log('🔥 Testing service worker notification...');

			if ('serviceWorker' in navigator) {
				const registration = await navigator.serviceWorker.ready;
				console.log('🔥 Service worker ready:', registration);

				await registration.showNotification('Service Worker Test', {
					body: 'This is a direct service worker notification test',
					icon: '/favicon.png',
					badge: '/favicon.png',
					tag: 'sw-direct-test',
					requireInteraction: true,
					timestamp: Date.now()
				});

				console.log('✅ Service worker notification sent');
				toast.success('Service worker notification sent!');
			} else {
				toast.error('Service worker not supported');
			}
		} catch (error) {
			toast.error('Service worker notification failed');
			console.error('Error:', error);
		}
	}
	async function testVendorOrderNotification() {
		try {
			console.log('🚨 Testing vendor order notification with siren...');
			const success = await fcmStore.sendVendorOrderDemo();

			if (success) {
				toast.success('Vendor order notification sent! Check for siren sound.');
			} else {
				toast.error('Failed to send vendor order notification');
			}
		} catch (error) {
			toast.error('Error sending vendor order notification');
			console.error('Error:', error);
		}
	}

	async function testAdminAlertNotification() {
		try {
			console.log('🔊 Testing admin alert notification with alert sound...');
			const success = await fcmStore.sendAdminAlertDemo();

			if (success) {
				toast.success('Admin alert notification sent! Check for alert sound.');
			} else {
				toast.error('Failed to send admin alert notification');
			}
		} catch (error) {
			toast.error('Error sending admin alert notification');
			console.error('Error:', error);
		}
	}

	function getStatusInfo() {
		if (!fcmStore.isSupported) {
			return {
				icon: AlertTriangle,
				text: 'Not Supported',
				description: 'Push notifications are not supported in this browser',
				variant: 'destructive' as const
			};
		}

		if (fcmStore.isBlocked) {
			return {
				icon: BellOff,
				text: 'Blocked',
				description: 'Notifications are blocked. Please enable them in browser settings',
				variant: 'destructive' as const
			};
		}

		if (fcmStore.hasPermission && fcmStore.token) {
			return {
				icon: CheckCircle,
				text: 'Enabled',
				description: 'Push notifications are enabled and ready',
				variant: 'default' as const
			};
		}

		if (fcmStore.canRequestPermission) {
			return {
				icon: Bell,
				text: 'Available',
				description: 'Push notifications are available but not enabled',
				variant: 'secondary' as const
			};
		}

		return {
			icon: Bell,
			text: 'Checking...',
			description: 'Checking notification permissions',
			variant: 'secondary' as const
		};
	}

	const statusInfo = $derived(getStatusInfo());
</script>

<div class="space-y-6">
	<Card class="w-full">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<svelte:component this={statusInfo.icon} class="h-5 w-5" />
				Push Notifications
			</CardTitle>
			<CardDescription>
				{statusInfo.description}
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="font-medium">Status</p>
					<Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
				</div>
				<Button onclick={handleEnableNotifications}>
					<Bell class="mr-2 h-4 w-4" />
					Enable Notifications
				</Button>
				<p class="text-sm text-gray-500">
					Permission: {fcmStore.notificationPermissionStatus || 'null'} | Can Request: {fcmStore.canRequestPermission}
				</p>
			</div>

			{#if fcmStore.token}
				<div class="space-y-2">
					<Label>FCM Token</Label>
					<div class="flex gap-2">
						<Input
							value={fcmStore.token}
							readonly
							class="font-mono text-xs"
							onclick={(e) => e.currentTarget.select()}
						/>
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								navigator.clipboard.writeText(fcmStore.token!);
								toast.success('Token copied to clipboard');
							}}
						>
							Copy
						</Button>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>

	{#if fcmStore.hasPermission && fcmStore.token}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Send class="h-5 w-5" />
					Test Notifications
				</CardTitle>
				<CardDescription>Send a demo notification to test the FCM integration</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="demo-title">Title</Label>
						<Input id="demo-title" bind:value={demoTitle} placeholder="Notification title" />
					</div>
					<div class="space-y-2">
						<Label for="demo-body">Body</Label>
						<Input id="demo-body" bind:value={demoBody} placeholder="Notification body" />
					</div>
				</div>
				<div class="space-y-3">
					<Button
						onclick={() => {
							setTimeout(() => {
								handleSendDemo();
							}, 5000); // Delay to ensure UI updates before sending
							// handleSendDemo
						}}
						disabled={fcmStore.isLoading}
						class="w-full"
					>
						{#if fcmStore.isLoading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{:else}
							<Send class="mr-2 h-4 w-4" />
						{/if}
						Send Demo Notification (5s delay)
					</Button>
					<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
						<Button onclick={testBrowserNotification} variant="outline" class="w-full">
							<Bell class="mr-2 h-4 w-4" />
							Test Browser Notification
						</Button>

						<Button onclick={testServiceWorkerNotification} variant="outline" class="w-full">
							<Bell class="mr-2 h-4 w-4" />
							Test Service Worker Notification
						</Button>
					</div>
					<Button onclick={testVendorOrderNotification} variant="destructive" class="w-full">
						🚨 Test Vendor Order Siren
					</Button>

					<Button onclick={testAdminAlertNotification} variant="secondary" class="w-full">
						🔊 Test Admin Alert Sound
					</Button>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Users class="h-5 w-5" />
					Topic Subscriptions
				</CardTitle>
				<CardDescription>Manage your subscription to notification topics</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex gap-2">
					<Input
						bind:value={topicName}
						placeholder="Topic name (e.g., general, updates)"
						class="flex-1"
					/>
					<Button
						onclick={handleTopicSubscription}
						disabled={fcmStore.isLoading}
						variant={isSubscribedToTopic ? 'destructive' : 'default'}
					>
						{#if fcmStore.isLoading}
							<Loader2 class="h-4 w-4 animate-spin" />
						{:else}
							{isSubscribedToTopic ? 'Unsubscribe' : 'Subscribe'}
						{/if}
					</Button>
				</div>
				<div class="text-muted-foreground text-sm">
					Topics allow you to receive notifications for specific categories or groups. Popular
					topics: <Badge variant="outline">general</Badge>, <Badge variant="outline">orders</Badge>, <Badge
						variant="outline">promotions</Badge
					>
				</div>
			</CardContent>
		</Card>

		<!-- Token Debug Section -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<AlertTriangle class="h-5 w-5" />
					Token Debug Info
				</CardTitle>
				<CardDescription>
					Understand why notifications sometimes work and sometimes don't
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<Button onclick={fetchTokenDebugInfo} variant="outline" class="w-full">
					View My FCM Tokens
				</Button>

				{#if showTokenDebug && tokenData}
					<div class="space-y-4">
						<div class="rounded-lg bg-gray-50 p-4">
							<h4 class="mb-2 font-semibold">📊 Token Summary</h4>
							<div class="grid grid-cols-2 gap-2 text-sm">
								<div>Total Tokens: <Badge>{tokenData.summary.total}</Badge></div>
								<div>Active: <Badge variant="default">{tokenData.summary.active}</Badge></div>
								<div>
									Inactive: <Badge variant="destructive">{tokenData.summary.inactive}</Badge>
								</div>
								<div>
									Current: <Badge variant="secondary"
										>{fcmStore.token ? fcmStore.token.substring(0, 20) + '...' : 'None'}</Badge
									>
								</div>
							</div>
						</div>

						<div class="space-y-2">
							<h4 class="font-semibold">📱 All Your Tokens:</h4>
							{#each tokenData.tokens as token}
								<div
									class="rounded-lg border p-3 {token.isActive
										? 'border-green-200 bg-green-50'
										: 'border-red-200 bg-red-50'}"
								>
									<div class="flex items-center justify-between">
										<div>
											<div class="font-mono text-sm">{token.token}</div>
											<div class="text-xs text-gray-500">
												Created: {new Date(token.createdAt).toLocaleString()}
												{#if token.lastUsedAt}
													| Last used: {new Date(token.lastUsedAt).toLocaleString()}
												{/if}
											</div>
										</div>
										<Badge variant={token.isActive ? 'default' : 'destructive'}>
											{token.isActive ? 'Active' : 'Inactive'}
										</Badge>
									</div>
								</div>
							{/each}
						</div>

						<div class="rounded-lg bg-blue-50 p-4 text-sm">
							<h4 class="mb-2 font-semibold">💡 Why Multiple Tokens?</h4>
							<ul class="space-y-1 text-gray-700">
								<li>• Each browser session creates a new token</li>
								<li>• Clearing browser data invalidates old tokens</li>
								<li>• Firebase auto-rotates tokens for security</li>
								<li>• Old tokens become "invalid" over time</li>
							</ul>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
