<script lang="ts">
	import { riderState } from '$lib/states/riderState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { MapPin, Clock, Navigation, DollarSign, Package } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';

	// Mock data for demonstration
	let availableDeliveries = $state([
		{
			id: '1',
			order: {
				id: 'ORD-001',
				orderNumber: 'ORD-001',
				items: [
					{ name: 'Jollof Rice', quantity: 2 },
					{ name: 'Chicken Suya', quantity: 1 }
				],
				total: 45.99
			},
			status: 'pending',
			assignedAt: new Date(),
			deliveryFee: 8.99,
			pickupLocation: {
				address: '123 Restaurant Street, Lagos',
				lat: 6.5244,
				lng: 3.3792
			},
			dropoffLocation: {
				address: '456 Customer Road, Lagos',
				lat: 6.5143,
				lng: 3.3654
			},
			distance: 3.2,
			estimatedDuration: 15,
			customerContact: {
				name: 'John Doe',
				phone: '+234 123 456 7890'
			},
			vendorContact: {
				name: 'Restaurant Name',
				phone: '+234 123 456 7891'
			}
		}
	]);

	function acceptDelivery(delivery: (typeof availableDeliveries)[0]) {
		riderState.acceptDelivery(delivery);
		availableDeliveries = availableDeliveries.filter((d) => d.id !== delivery.id);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Available Deliveries</h2>
		<Badge variant={riderState.isOnline ? 'success' : 'destructive'}>
			{riderState.isOnline ? 'Online' : 'Offline'}
		</Badge>
	</div>

	{#if !riderState.isOnline}
		<Card class="flex min-h-[200px] items-center justify-center p-6">
			<div class="text-center">
				<h3 class="text-lg font-medium">You're Offline</h3>
				<p class="mt-1 text-sm text-muted-foreground">Go online to view available deliveries</p>
			</div>
		</Card>
	{:else if availableDeliveries.length === 0}
		<Card class="flex min-h-[200px] items-center justify-center p-6">
			<div class="text-center">
				<Package class="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-medium">No Deliveries Available</h3>
				<p class="text-sm text-muted-foreground">New delivery requests will appear here</p>
			</div>
		</Card>
	{:else}
		<div class="grid gap-6 md:grid-cols-2">
			{#each availableDeliveries as delivery}
				<Card class="p-6">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold">Order #{delivery.order.orderNumber}</h3>
						<div class="flex items-center gap-2">
							<DollarSign class="h-4 w-4 text-green-500" />
							<span class="font-medium">{formatCurrency(delivery.deliveryFee)}</span>
						</div>
					</div>

					<div class="mt-4 space-y-4">
						<!-- Locations -->
						<div class="space-y-2">
							<div class="flex items-start gap-2">
								<MapPin class="mt-1 h-4 w-4 text-muted-foreground" />
								<div>
									<div class="text-sm font-medium">Pickup</div>
									<div class="text-sm text-muted-foreground">{delivery.pickupLocation.address}</div>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<MapPin class="mt-1 h-4 w-4 text-muted-foreground" />
								<div>
									<div class="text-sm font-medium">Dropoff</div>
									<div class="text-sm text-muted-foreground">
										{delivery.dropoffLocation.address}
									</div>
								</div>
							</div>
						</div>

						<!-- Order Items -->
						<div class="rounded-lg bg-muted p-3">
							<div class="text-sm font-medium">Order Items</div>
							<div class="mt-1 space-y-1 text-sm text-muted-foreground">
								{#each delivery.order.items as item}
									<div>{item.quantity}x {item.name}</div>
								{/each}
							</div>
						</div>

						<!-- Details -->
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<div class="flex items-center gap-1">
									<Clock class="h-4 w-4 text-muted-foreground" />
									<span class="text-sm">{delivery.estimatedDuration} mins</span>
								</div>
								<div class="flex items-center gap-1">
									<Navigation class="h-4 w-4 text-muted-foreground" />
									<span class="text-sm">{delivery.distance} km</span>
								</div>
							</div>
							<Button onclick={() => acceptDelivery(delivery)}>Accept</Button>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
