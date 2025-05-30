<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createFCMStore } from '$lib/stores/fcm.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Bell, BellOff, AlertTriangle, CheckCircle, Loader2 } from 'lucide-svelte';

	const fcmStore = createFCMStore();

	onMount(() => {
		fcmStore.initialize();
	});

	onDestroy(() => {
		fcmStore.destroy();
	});

	async function handleEnableNotifications() {
		const token = await fcmStore.requestNotificationAndGetToken();
		if (token) {
			await sendTokenToServer(token);
		}
	}

	async function sendTokenToServer(token: string) {
		try {
			const response = await fetch('/api/push-notifications/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ token })
			});

			if (!response.ok) {
				throw new Error('Failed to register FCM token');
			}

			console.log('FCM token registered successfully');
		} catch (error) {
			console.error('Error registering FCM token:', error);
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
				description: 'Notifications are blocked. Please enable them in your browser settings',
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
			text: 'Requesting...',
			description: 'Checking notification permissions',
			variant: 'secondary' as const
		};
	}

	$: statusInfo = getStatusInfo();
</script>

<Card class="w-full max-w-md">
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
			<span class="text-sm font-medium">Status</span>
			<Badge variant={statusInfo.variant}>
				{statusInfo.text}
			</Badge>
		</div>

		{#if fcmStore.error}
			<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-4 w-4" />
					Error: {fcmStore.error}
				</div>
				<Button
					variant="ghost"
					size="sm"
					class="mt-2 h-auto p-0 text-destructive hover:text-destructive"
					onclick={fcmStore.clearError}
				>
					Dismiss
				</Button>
			</div>
		{/if}

		{#if fcmStore.token}
			<div class="space-y-2">
				<span class="text-sm font-medium">Registration Token</span>
				<div class="break-all rounded bg-muted p-2 font-mono text-xs">
					{fcmStore.token.substring(0, 50)}...
				</div>
			</div>
		{/if}

		<div class="flex gap-2">
			{#if fcmStore.canRequestPermission}
				<Button onclick={handleEnableNotifications} disabled={fcmStore.isLoading} class="flex-1">
					{#if fcmStore.isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<Bell class="mr-2 h-4 w-4" />
					{/if}
					Enable Notifications
				</Button>
			{:else if fcmStore.hasPermission && !fcmStore.token}
				<Button
					onclick={fcmStore.getToken}
					disabled={fcmStore.isLoading}
					variant="outline"
					class="flex-1"
				>
					{#if fcmStore.isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<Bell class="mr-2 h-4 w-4" />
					{/if}
					Get Token
				</Button>
			{/if}

			{#if fcmStore.token}
				<Button
					onclick={() => sendTokenToServer(fcmStore.token!)}
					variant="outline"
					disabled={fcmStore.isLoading}
				>
					{#if fcmStore.isLoading}
						<Loader2 class="h-4 w-4 animate-spin" />
					{:else}
						Sync
					{/if}
				</Button>
			{/if}
		</div>
	</CardContent>
</Card>
