<script lang="ts">
	import { onMount } from 'svelte';
	import { createFCMStore } from '$lib/stores/fcm.svelte.ts';
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

	const fcmStore = createFCMStore();

	let demoTitle = $state('Demo Notification');
	let demoBody = $state('This is a test notification from your Azumi app!');
	let topicName = $state('general');
	let isSubscribedToTopic = $state(false);

	onMount(() => {
		fcmStore.initialize();
		return () => fcmStore.destroy();
	});

	async function handleEnableNotifications() {
		try {
			const token = await fcmStore.requestNotificationAndGetToken();
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
				{#if fcmStore.canRequestPermission}
					<Button onclick={handleEnableNotifications} disabled={fcmStore.isLoading}>
						{#if fcmStore.isLoading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{:else}
							<Bell class="mr-2 h-4 w-4" />
						{/if}
						Enable Notifications
					</Button>
				{/if}
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

			{#if fcmStore.error}
				<div class="rounded-md bg-destructive/10 p-3 text-destructive">
					<p class="text-sm">{fcmStore.error}</p>
					<Button variant="ghost" size="sm" class="mt-2" onclick={() => fcmStore.clearError()}>
						Dismiss
					</Button>
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
				<Button onclick={handleSendDemo} disabled={fcmStore.isLoading} class="w-full">
					{#if fcmStore.isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<Send class="mr-2 h-4 w-4" />
					{/if}
					Send Demo Notification
				</Button>
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
				<div class="text-sm text-muted-foreground">
					Topics allow you to receive notifications for specific categories or groups. Popular
					topics: <Badge variant="outline">general</Badge>, <Badge variant="outline">orders</Badge>, <Badge
						variant="outline">promotions</Badge
					>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
