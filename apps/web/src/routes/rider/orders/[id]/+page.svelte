<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import {
		MapPin,
		Phone,
		Clock,
		Package,
		Navigation,
		Car,
		CheckCircle,
		AlertCircle
	} from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { riderOrderService, type OrderDetails } from '$lib/services/riderOrderService';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	let order = $state<OrderDetails>(data.order);
	let isLoading = $state(false);

	function getStatusColor(status: string) {
		switch (status) {
			case 'READY':
				return 'bg-blue-100 text-blue-800';
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
			case 'READY':
				return 'Ready for Pickup';
			case 'RIDER_ASSIGNED':
				return 'Assigned to You';
			case 'PICKED_UP':
				return 'Picked Up';
			case 'IN_TRANSIT':
				return 'In Transit';
			case 'DELIVERED':
				return 'Delivered';
			default:
				return status;
		}
	}

	async function markPickedUp() {
		if (isLoading) return;

		isLoading = true;
		try {
			const success = await riderOrderService.markOrderPickedUp(order.id);

			if (success) {
				order.status = 'PICKED_UP';
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
		if (isLoading) return;

		isLoading = true;
		try {
			const success = await riderOrderService.markOrderDelivered(order.id);

			if (success) {
				order.status = 'DELIVERED';
				toast.success('Order marked as delivered');
				setTimeout(() => {
					goto('/rider/deliveries');
				}, 1500);
			} else {
				toast.error('Failed to mark order as delivered');
			}
		} catch (error) {
			toast.error('Error updating order status');
		} finally {
			isLoading = false;
		}
	}

	function startNavigation() {
		const { latitude, longitude } = order.pickupLocation;
		const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
		window.open(url, '_blank');
	}

	function navigateToCustomer() {
		const { latitude, longitude } = order.deliveryLocation;
		const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
		window.open(url, '_blank');
	}

	function callShop() {
		window.open(`tel:${order.shop.phone}`, '_self');
	}

	function callCustomer() {
		window.open(`tel:${order.customer.phone}`, '_self');
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Order Details</h1>
		<Badge class={getStatusColor(order.status)}>
			{getStatusText(order.status)}
		</Badge>
	</div>

	<Card class="p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">Order #{order.orderNumber}</h2>
			<div class="text-right">
				<div class="text-muted-foreground text-sm">Total</div>
				<div class="text-lg font-bold">{formatCurrency(order.total)}</div>
			</div>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<div class="space-y-3">
				<div class="flex items-start gap-3">
					<MapPin class="text-muted-foreground mt-1 h-4 w-4" />
					<div class="space-y-1">
						<div class="font-medium">Pickup Location</div>
						<div class="text-muted-foreground text-sm">{order.pickupLocation.address}</div>
						<div class="flex gap-2">
							<Button size="sm" variant="outline" onclick={startNavigation}>
								<Navigation class="mr-1 h-3 w-3" />
								Navigate
							</Button>
							<Button size="sm" variant="outline" onclick={callShop}>
								<Phone class="mr-1 h-3 w-3" />
								Call Shop
							</Button>
						</div>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<MapPin class="mt-1 h-4 w-4 text-orange-500" />
					<div class="space-y-1">
						<div class="font-medium">Delivery Location</div>
						<div class="text-muted-foreground text-sm">{order.deliveryLocation.address}</div>
						<div class="flex gap-2">
							<Button size="sm" variant="outline" onclick={navigateToCustomer}>
								<Navigation class="mr-1 h-3 w-3" />
								Navigate
							</Button>
							<Button size="sm" variant="outline" onclick={callCustomer}>
								<Phone class="mr-1 h-3 w-3" />
								Call Customer
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<Clock class="text-muted-foreground h-4 w-4" />
					<span class="text-sm">{order.estimatedDuration} mins estimated</span>
				</div>
				<div class="flex items-center gap-2">
					<Car class="text-muted-foreground h-4 w-4" />
					<span class="text-sm">{order.estimatedDistance.toFixed(1)} km total distance</span>
				</div>
				<div class="flex items-center gap-2">
					<Package class="text-muted-foreground h-4 w-4" />
					<span class="text-sm">{order.items.length} items</span>
				</div>
			</div>
		</div>
	</Card>

	<Card class="p-6">
		<h3 class="mb-4 font-semibold">Shop Information</h3>
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<span class="font-medium">{order.shop.name}</span>
				<Button size="sm" variant="outline" onclick={callShop}>
					<Phone class="mr-1 h-3 w-3" />
					Call
				</Button>
			</div>
			<div class="text-muted-foreground text-sm">{order.shop.address}</div>
		</div>
	</Card>

	<Card class="p-6">
		<h3 class="mb-4 font-semibold">Customer Information</h3>
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<span class="font-medium">{order.customer.name}</span>
				<Button size="sm" variant="outline" onclick={callCustomer}>
					<Phone class="mr-1 h-3 w-3" />
					Call
				</Button>
			</div>
		</div>
	</Card>

	<Card class="p-6">
		<h3 class="mb-4 font-semibold">Order Items</h3>
		<div class="space-y-3">
			{#each order.items as item}
				<div class="flex items-center justify-between">
					<div>
						<div class="font-medium">{item.name}</div>
						{#if item.specialInstructions}
							<div class="text-muted-foreground text-sm">{item.specialInstructions}</div>
						{/if}
					</div>
					<div class="text-right">
						<div>{item.quantity}x</div>
						<div class="text-muted-foreground text-sm">{formatCurrency(item.price)}</div>
					</div>
				</div>
				{#if item !== order.items[order.items.length - 1]}
					<Separator />
				{/if}
			{/each}
		</div>

		{#if order.specialInstructions}
			<div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
				<div class="flex items-start gap-2">
					<AlertCircle class="mt-0.5 h-4 w-4 text-amber-600" />
					<div>
						<div class="font-medium text-amber-800">Special Instructions</div>
						<div class="text-sm text-amber-700">{order.specialInstructions}</div>
					</div>
				</div>
			</div>
		{/if}
	</Card>

	<Card class="p-6">
		<h3 class="mb-4 font-semibold">Payment Summary</h3>
		<div class="space-y-2">
			<div class="flex justify-between">
				<span>Order Total</span>
				<span>{formatCurrency(order.total - order.deliveryFee)}</span>
			</div>
			<div class="flex justify-between">
				<span>Delivery Fee</span>
				<span class="font-medium text-green-600">{formatCurrency(order.deliveryFee)}</span>
			</div>
			<Separator />
			<div class="flex justify-between font-semibold">
				<span>Total</span>
				<span>{formatCurrency(order.total)}</span>
			</div>
		</div>
	</Card>

	{#if order.status === 'RIDER_ASSIGNED'}
		<div class="bg-background sticky bottom-4 rounded-lg border p-4 shadow-lg">
			<Button class="w-full" size="lg" onclick={markPickedUp} disabled={isLoading}>
				{#if isLoading}
					<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
				{:else}
					<CheckCircle class="mr-2 h-4 w-4" />
				{/if}
				Mark as Picked Up
			</Button>
		</div>
	{:else if order.status === 'PICKED_UP' || order.status === 'IN_TRANSIT'}
		<div class="bg-background sticky bottom-4 rounded-lg border p-4 shadow-lg">
			<Button class="w-full" size="lg" onclick={markDelivered} disabled={isLoading}>
				{#if isLoading}
					<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
				{:else}
					<CheckCircle class="mr-2 h-4 w-4" />
				{/if}
				Mark as Delivered
			</Button>
		</div>
	{/if}
</div>
