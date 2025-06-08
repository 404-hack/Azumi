<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { MapPin, Phone, Clock, Package, Navigation, CheckCircle, AlertCircle, Timer } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { riderOrderService, type OrderDetails } from '$lib/services/riderOrderService';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	let { data } = $props();
	let currentDelivery = $state<OrderDetails | null>(data.currentDelivery);
	let isLoading = $state(false);
	let elapsedTime = $state(0);
	let timeInterval: NodeJS.Timeout;

	onMount(() => {
		if (currentDelivery) {
			startTimer();
		}
		
		return () => {
			if (timeInterval) {
				clearInterval(timeInterval);
			}
		};
	});

	function startTimer() {
		if (!currentDelivery) return;
		
		const startTime = new Date(currentDelivery.createdAt).getTime();
		
		timeInterval = setInterval(() => {
			elapsedTime = Math.floor((Date.now() - startTime) / 1000);
		}, 1000);
	}

	function formatTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;
		
		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function getProgressValue(status: string): number {
		switch (status) {
			case 'RIDER_ASSIGNED':
				return 25;
			case 'PICKED_UP':
				return 50;
			case 'IN_TRANSIT':
				return 75;
			case 'DELIVERED':
				return 100;
			default:
				return 0;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'RIDER_ASSIGNED':
				return 'bg-yellow-100 text-yellow-800';
			case 'PICKED_UP':
				return 'bg-orange-100 text-orange-800';
			case 'IN_TRANSIT':
				return 'bg-purple-100 text-purple-800';
			case 'DELIVERED':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'RIDER_ASSIGNED':
				return 'Head to Restaurant';
			case 'PICKED_UP':
				return 'Order Collected';
			case 'IN_TRANSIT':
				return 'Delivering to Customer';
			case 'DELIVERED':
				return 'Delivered Successfully';
			default:
				return status;
		}
	}

	async function markPickedUp() {
		if (!currentDelivery || isLoading) return;
		
		isLoading = true;
		try {
			const success = await riderOrderService.markOrderPickedUp(currentDelivery.id);
			
			if (success) {
				currentDelivery.status = 'PICKED_UP';
				toast.success('Order marked as picked up');
			} else {
				toast.error('Failed to mark order as picked up');
			}
		} catch (error) {
			toast.error('Error updating order status');
		} finally {
			isLoading = false;
		}
	}

	async function markDelivered() {
		if (!currentDelivery || isLoading) return;
		
		isLoading = true;
		try {
			const success = await riderOrderService.markOrderDelivered(currentDelivery.id);
			
			if (success) {
				currentDelivery.status = 'DELIVERED';
				toast.success('Order delivered successfully!');
				clearInterval(timeInterval);
				setTimeout(() => {
					goto('/rider/deliveries');
				}, 2000);
			} else {
				toast.error('Failed to mark order as delivered');
			}
		} catch (error) {
			toast.error('Error updating order status');
		} finally {
			isLoading = false;
		}
	}

	function navigateToPickup() {
		if (!currentDelivery) return;
		const { latitude, longitude } = currentDelivery.pickupLocation;
		const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
		window.open(url, '_blank');
	}

	function navigateToDelivery() {
		if (!currentDelivery) return;
		const { latitude, longitude } = currentDelivery.deliveryLocation;
		const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
		window.open(url, '_blank');
	}

	function callShop() {
		if (!currentDelivery) return;
		window.open(`tel:${currentDelivery.shop.phone}`, '_self');
	}

	function callCustomer() {
		if (!currentDelivery) return;
		window.open(`tel:${currentDelivery.customer.phone}`, '_self');
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Active Delivery</h1>
		{#if currentDelivery}
			<div class="flex items-center gap-2">
				<Timer class="h-4 w-4 text-muted-foreground" />
				<span class="font-mono text-sm">{formatTime(elapsedTime)}</span>
			</div>
		{/if}
	</div>

	{#if !currentDelivery}
		<Card class="flex min-h-[400px] items-center justify-center p-6">
			<div class="text-center">
				<Package class="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-medium">No Active Delivery</h3>
				<p class="text-sm text-muted-foreground">You don't have any active deliveries at the moment</p>
				<Button class="mt-4" onclick={() => goto('/rider/deliveries')}>
					View Available Orders
				</Button>
			</div>
		</Card>
	{:else}
		<Card class="p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold">Order #{currentDelivery.orderNumber}</h2>
				<Badge class={getStatusColor(currentDelivery.status)}>
					{getStatusText(currentDelivery.status)}
				</Badge>
			</div>

			<div class="mb-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-medium">Progress</span>
					<span class="text-sm text-muted-foreground">
						{getProgressValue(currentDelivery.status)}%
					</span>
				</div>
				<Progress value={getProgressValue(currentDelivery.status)} class="h-2" />
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-3">
					<div class="flex items-start gap-3">
						<MapPin class="mt-1 h-4 w-4 text-muted-foreground" />
						<div class="space-y-1">
							<div class="font-medium">Pickup from {currentDelivery.shop.name}</div>
							<div class="text-sm text-muted-foreground">{currentDelivery.pickupLocation.address}</div>
							<div class="flex gap-2">
								<Button size="sm" variant="outline" onclick={navigateToPickup}>
									<Navigation class="h-3 w-3 mr-1" />
									Navigate
								</Button>
								<Button size="sm" variant="outline" onclick={callShop}>
									<Phone class="h-3 w-3 mr-1" />
									Call
								</Button>
							</div>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<MapPin class="mt-1 h-4 w-4 text-orange-500" />
						<div class="space-y-1">
							<div class="font-medium">Deliver to {currentDelivery.customer.name}</div>
							<div class="text-sm text-muted-foreground">{currentDelivery.deliveryLocation.address}</div>
							<div class="flex gap-2">
								<Button size="sm" variant="outline" onclick={navigateToDelivery}>
									<Navigation class="h-3 w-3 mr-1" />
									Navigate
								</Button>
								<Button size="sm" variant="outline" onclick={callCustomer}>
									<Phone class="h-3 w-3 mr-1" />
									Call
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">Est. {currentDelivery.estimatedDuration} mins</span>
					</div>
					<div class="flex items-center gap-2">
						<Package class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{currentDelivery.items.length} items</span>
					</div>
					<div class="text-right">
						<div class="text-sm text-muted-foreground">Delivery Fee</div>
						<div class="text-lg font-bold text-green-600">
							{formatCurrency(currentDelivery.deliveryFee)}
						</div>
					</div>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<h3 class="font-semibold mb-4">Order Items</h3>
			<div class="space-y-3">
				{#each currentDelivery.items as item}
					<div class="flex items-center justify-between">
						<div>
							<div class="font-medium">{item.name}</div>
							{#if item.specialInstructions}
								<div class="text-sm text-muted-foreground">{item.specialInstructions}</div>
							{/if}
						</div>
						<div class="text-right">
							<div>{item.quantity}x</div>
						</div>
					</div>
				{/each}
			</div>

			{#if currentDelivery.specialInstructions}
				<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
					<div class="flex items-start gap-2">
						<AlertCircle class="h-4 w-4 text-amber-600 mt-0.5" />
						<div>
							<div class="font-medium text-amber-800">Special Instructions</div>
							<div class="text-sm text-amber-700">{currentDelivery.specialInstructions}</div>
						</div>
					</div>
				</div>
			{/if}
		</Card>

		{#if currentDelivery.status === 'RIDER_ASSIGNED'}
			<div class="sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
				<Button class="w-full" size="lg" onclick={markPickedUp} disabled={isLoading}>
					{#if isLoading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
					{:else}
						<CheckCircle class="h-4 w-4 mr-2" />
					{/if}
					Mark as Picked Up
				</Button>
			</div>
		{:else if currentDelivery.status === 'PICKED_UP' || currentDelivery.status === 'IN_TRANSIT'}
			<div class="sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
				<Button class="w-full" size="lg" onclick={markDelivered} disabled={isLoading}>
					{#if isLoading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
					{:else}
						<CheckCircle class="h-4 w-4 mr-2" />
					{/if}
					Mark as Delivered
				</Button>
			</div>
		{/if}
	{/if}
</div>
