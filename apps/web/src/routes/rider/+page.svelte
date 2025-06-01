<script lang="ts">
	import { riderState } from '$lib/states/riderState.svelte';
	import { riderDispatchState } from '$lib/states/riderDispatchState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		MapPin,
		Phone,
		Clock,
		DollarSign,
		Package,
		Star,
		Navigation,
		Power,
		Bell,
		Wifi,
		WifiOff,
		AlertCircle,
		CheckCircle
	} from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { onMount } from 'svelte';
	import OrderNotificationCard from '$lib/components/rider/OrderNotificationCard.svelte';
	import LocationTracker from '$lib/components/rider/LocationTracker.svelte';
	import NotificationPermissionBanner from '$lib/components/NotificationPermissionBanner.svelte';

	const { data } = $props();

	const stats = {
		rating: 4.8,
		totalDeliveries: 128,
		completionRate: '98%'
	};
	onMount(() => {
		console.log('Rider page data:', data);
		console.log('Profile:', data?.profile);

		if (data?.profile?.id) {
			console.log('Initializing with rider ID:', data.profile.id);
			riderDispatchState.initialize(data.profile.id);
		} else {
			console.log('No rider ID found, initializing without ID');
			riderDispatchState.initialize();
		}
		return () => riderDispatchState.cleanup();
	});

	$effect(() => {
		if (data?.profile?.id) {
			console.log('Setting rider ID via effect:', data.profile.id);
			riderDispatchState.setRiderId(data.profile.id);
		}
	});
</script>

<div class="space-y-8">
	<!-- Connection Status & Location Tracker -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2">
				{#if riderDispatchState.isConnected}
					<div class="flex items-center gap-2 text-green-600">
						<Wifi class="h-4 w-4" />
						<span class="text-sm font-medium">Connected</span>
					</div>
				{:else}
					<div class="flex items-center gap-2 text-red-600">
						<WifiOff class="h-4 w-4" />
						<span class="text-sm font-medium">Disconnected</span>
					</div>
				{/if}
			</div>

			{#if riderDispatchState.availableOrders.length > 0}
				<div class="flex items-center gap-2 text-blue-600">
					<Bell class="h-4 w-4" />
					<span class="text-sm font-medium"
						>{riderDispatchState.availableOrders.length} available orders</span
					>
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant={riderState.isActive ? 'default' : 'outline'}
				onclick={() => {
					riderState.toggleActive();
					if (riderState.isActive) {
						riderDispatchState.goOnline();
					} else {
						riderDispatchState.goOffline();
					}
				}}
				class="gap-2"
			>
				<Power class="h-4 w-4" />
				{riderState.isActive ? 'Go Offline' : 'Go Online'}
			</Button>
		</div>
	</div>

	<LocationTracker />

	<!-- Pending Order Notifications -->
	{#if riderDispatchState.availableOrders.length > 0}
		<div class="space-y-4">
			<h2 class="text-lg font-semibold">Available Orders</h2>
			{#each riderDispatchState.availableOrders as order (order.id)}
				<OrderNotificationCard {order} />
			{/each}
		</div>
	{/if}
	<!-- Stats Overview -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Today's Earnings</span>
				<div class="flex items-center gap-2">
					<DollarSign class="h-4 w-4 text-green-500" />
					<span class="text-2xl font-bold">{formatCurrency(riderState.earnings.today)}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Total Deliveries</span>
				<div class="flex items-center gap-2">
					<Package class="h-4 w-4 text-blue-500" />
					<span class="text-2xl font-bold">{stats.totalDeliveries}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Rating</span>
				<div class="flex items-center gap-2">
					<Star class="h-4 w-4 text-yellow-500" />
					<span class="text-2xl font-bold">{stats.rating}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Completion Rate</span>
				<div class="flex items-center gap-2">
					<Navigation class="h-4 w-4 text-purple-500" />
					<span class="text-2xl font-bold">{stats.completionRate}</span>
				</div>
			</div>
		</Card>
	</div>

	<!-- Current Delivery -->
	{#if riderState.currentDelivery}
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Current Delivery</h2>
				<Badge variant="outline">{riderState.currentDelivery.status}</Badge>
			</div>

			<div class="mt-6 grid gap-6 md:grid-cols-2">
				<!-- Pickup Details -->
				<div class="space-y-4">
					<h3 class="font-medium">Pickup Location</h3>
					<div class="rounded-lg border p-4">
						<div class="flex items-start gap-3">
							<MapPin class="mt-1 h-4 w-4 text-muted-foreground" />
							<div>
								<div class="font-medium">{riderState.currentDelivery.pickupLocation.address}</div>
								<div class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
									<Phone class="h-3 w-3" />
									{riderState.currentDelivery.vendorContact.phone}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Dropoff Details -->
				<div class="space-y-4">
					<h3 class="font-medium">Dropoff Location</h3>
					<div class="rounded-lg border p-4">
						<div class="flex items-start gap-3">
							<MapPin class="mt-1 h-4 w-4 text-muted-foreground" />
							<div>
								<div class="font-medium">{riderState.currentDelivery.dropoffLocation.address}</div>
								<div class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
									<Phone class="h-3 w-3" />
									{riderState.currentDelivery.customerContact.phone}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-6 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">Est. {riderState.currentDelivery.estimatedDuration} mins</span>
					</div>
					<div class="flex items-center gap-2">
						<Navigation class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{riderState.currentDelivery.distance} km</span>
					</div>
				</div>
				<div class="flex gap-2">
					<Button variant="outline">Navigate</Button>
					<Button onclick={() => riderState.completeDelivery()}>Complete Delivery</Button>
				</div>
			</div>
		</Card>
	{:else if riderState.isActive}
		<Card class="flex min-h-[200px] items-center justify-center p-6">
			<div class="text-center">
				<Package class="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-medium">No Active Delivery</h3>
				<p class="text-sm text-muted-foreground">New delivery requests will appear here</p>
			</div>
		</Card>
	{:else}
		<Card class="flex min-h-[200px] items-center justify-center p-6">
			<div class="text-center">
				<Power class="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-medium">You're Offline</h3>
				<p class="text-sm text-muted-foreground">Go to Settings to toggle your Online status</p>
			</div>
		</Card>
	{/if}
</div>

<!-- Notification Permission Banner for Push Notifications -->
<NotificationPermissionBanner context="rider" />
