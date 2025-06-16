<script lang="ts">
	import { riderState } from '$lib/states/riderState.svelte';
	import { riderDispatchState } from '$lib/states/riderDispatchState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { MapPin, Clock, Navigation, DollarSign, Package, Wifi, WifiOff } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	async function acceptOrder(orderId: string) {
		try {
			await riderDispatchState.acceptOrder(orderId);
			console.log('Order accepted from deliveries page');
		} catch (error) {
			console.error('Failed to accept order:', error);
		}
	}

	function formatTimeLeft(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getUrgencyClass(timeLeft: number): string {
		if (timeLeft <= 10) return 'border-red-500 bg-red-50';
		if (timeLeft <= 15) return 'border-orange-500 bg-orange-50';
		return 'border-green-500 bg-green-50';
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Available Orders</h2>
		<div class="flex items-center gap-2">
			<Badge
				variant={riderDispatchState.isConnected ? 'default' : 'destructive'}
				class="flex items-center gap-1"
			>
				{#if riderDispatchState.isConnected}
					<Wifi class="h-3 w-3" />
					Connected
				{:else}
					<WifiOff class="h-3 w-3" />
					{riderDispatchState.connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
				{/if}
			</Badge>
			<Badge variant={riderState.isActive ? 'default' : 'destructive'}>
				{riderState.isActive ? 'Online' : 'Offline'}
			</Badge>
		</div>
	</div>

	{#if !riderState.isActive}
		<Card class="flex min-h-[200px] items-center justify-center p-6">
			<div class="text-center">
				<h3 class="text-lg font-medium">You're Offline</h3>
				<p class="text-muted-foreground mt-1 text-sm">Go online to view available orders</p>
			</div>
		</Card>
	{:else if !riderDispatchState.isConnected}
		<Card class="flex min-h-[200px] items-center justify-center p-6">
			<div class="text-center">
				<WifiOff class="text-muted-foreground mx-auto h-12 w-12" />
				<h3 class="mt-4 text-lg font-medium">Connection Issue</h3>
				<p class="text-muted-foreground text-sm">
					{riderDispatchState.connectionError || 'Trying to connect to dispatch system...'}
				</p>
			</div>
		</Card>
	{:else if riderDispatchState.availableOrders.length === 0}
		<Card class="flex min-h-[200px] items-center justify-center p-6">
			<div class="text-center">
				<Package class="text-muted-foreground mx-auto h-12 w-12" />
				<h3 class="mt-4 text-lg font-medium">No Orders Available</h3>
				<p class="text-muted-foreground text-sm">New order requests will appear here</p>
			</div>
		</Card>
	{:else}
		<div class="grid gap-6 md:grid-cols-2">
			{#each riderDispatchState.availableOrders as order (order.id)}
				<Card class="p-6 {getUrgencyClass(order.timeLeftSeconds || 30)}" data-order-id={order.id}>
					<div class="flex items-center justify-between">
						<h3 class="font-semibold">Order #{order.id.slice(-6)}</h3>
						<div class="flex items-center gap-2">
							{#if order.timeLeftSeconds}
								<Badge variant="outline" class="font-mono text-xs">
									{formatTimeLeft(order.timeLeftSeconds)}
								</Badge>
							{/if}
							<DollarSign class="h-4 w-4 text-green-500" />
							<span class="font-medium">{formatCurrency(order.deliveryFee)}</span>
						</div>
					</div>

					<div class="mt-4 space-y-4">
						<div class="space-y-2">
							<div class="flex items-start gap-2">
								<MapPin class="text-muted-foreground mt-1 h-4 w-4" />
								<div>
									<div class="text-sm font-medium">Pickup</div>
									<div class="text-muted-foreground text-sm">{order.pickupLocation.address}</div>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<MapPin class="text-muted-foreground mt-1 h-4 w-4" />
								<div>
									<div class="text-sm font-medium">Dropoff</div>
									<div class="text-muted-foreground text-sm">
										{order.deliveryLocation.address}
									</div>
								</div>
							</div>
						</div>

						<div class="bg-muted rounded-lg p-3">
							<div class="text-sm font-medium">Order Details</div>
							<div class="text-muted-foreground mt-1 space-y-1 text-sm">
								<div>{order.itemCount} item{order.itemCount > 1 ? 's' : ''}</div>
								<div>Order value: {formatCurrency(order.orderValue)}</div>
							</div>
						</div>

						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<div class="flex items-center gap-1">
									<Clock class="text-muted-foreground h-4 w-4" />
									<span class="text-sm">{order.estimatedDuration} mins</span>
								</div>
								<div class="flex items-center gap-1">
									<Navigation class="text-muted-foreground h-4 w-4" />
									<span class="text-sm">{order.estimatedDistance.toFixed(1)} km</span>
								</div>
							</div>
							<Button onclick={() => acceptOrder(order.id)}>Accept</Button>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
