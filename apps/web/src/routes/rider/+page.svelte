<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		MapPin,
		Phone,
		DollarSign,
		Navigation,
		CheckCircle,
		Clock,
		RefreshCw,
		Eye
	} from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { riderOrderService } from '$lib/services/riderOrderService';
	import { client } from '$lib/hc';
	import type { OrderDetails } from '$lib/services/riderOrderService';

	const { data } = $props();
	let orders = $state(data.orders || []);
	let selectedOrderId = $state<string | null>(null);
	let isLoading = $state(false);
	let confirmationCode = $state('');
	let showConfirmationDialog = $state(false);
	let orderToDeliver = $state<string | null>(null);

	$effect(() => {
		if (orders.length > 0 && !selectedOrderId) {
			selectedOrderId = orders[0].id;
		}
	});
	const activeOrders = $derived(
		orders.filter((order) => order.status === 'RIDER_ASSIGNED' || order.status === 'IN_TRANSIT')
	);
	async function refreshOrders() {
		isLoading = true;
		try {
			const response = await client.rider.orders.actives.$get();
			if (response.ok) {
				const result = await response.json();
				orders = result.data || [];
				if (orders.length > 0 && !selectedOrderId) {
					selectedOrderId = orders[0].id;
				}
			}
		} catch (error) {
			console.error('Error refreshing orders:', error);
		} finally {
			isLoading = false;
		}
	}

	async function markAsPickedUp(orderId: string) {
		isLoading = true;
		try {
			const success = await riderOrderService.markOrderPickedUp(orderId);
			if (success) {
				await refreshOrders();
			}
		} catch (error) {
			console.error('Error marking order as picked up:', error);
		} finally {
			isLoading = false;
		}
	}

	async function handleMarkAsDelivered(orderId: string) {
		orderToDeliver = orderId;
		showConfirmationDialog = true;
	}

	async function confirmDelivery() {
		if (!orderToDeliver) return;

		isLoading = true;
		try {
			const code = confirmationCode ? parseInt(confirmationCode) : undefined;
			const success = await riderOrderService.markOrderDelivered(orderToDeliver, code);
			if (success) {
				await refreshOrders();
				showConfirmationDialog = false;
				confirmationCode = '';
				orderToDeliver = null;
			}
		} catch (error) {
			console.error('Error marking order as delivered:', error);
		} finally {
			isLoading = false;
		}
	}
	function getStatusColor(status: string) {
		switch (status) {
			case 'RIDER_ASSIGNED':
				return 'bg-blue-500';
			case 'IN_TRANSIT':
				return 'bg-orange-500';
			case 'DELIVERED':
				return 'bg-green-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'RIDER_ASSIGNED':
				return 'Assigned';
			case 'IN_TRANSIT':
				return 'In Transit';
			case 'DELIVERED':
				return 'Delivered';
			default:
				return status;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 p-4">
	<div class="mx-auto max-w-md space-y-4">
		<div class="rounded-2xl bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-xl font-bold">Rider Dashboard</h1>
					<p class="text-sm text-gray-600">Welcome, {data.profile?.firstName || 'Rider'}</p>
				</div>
				<Button onclick={refreshOrders} variant="outline" size="sm" disabled={isLoading}>
					<RefreshCw class="h-4 w-4 {isLoading ? 'animate-spin' : ''}" />
				</Button>
			</div>
		</div>

		{#if activeOrders.length > 0}
			<div class="space-y-4">
				<div class="rounded-2xl bg-white p-4 shadow-sm">
					<div class="mb-3 flex items-center justify-between">
						<h2 class="text-lg font-bold">Active Orders</h2>
						<span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
							{activeOrders.length} orders
						</span>
					</div>
					<div class="flex gap-2 overflow-x-auto pb-2">
						{#each activeOrders as order}
							<button
								onclick={() => (selectedOrderId = order.id)}
								class="flex-shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors
									{selectedOrderId === order.id
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
							>
								{order.code || `Order ${order.id.slice(-6)}`}
							</button>
						{/each}
					</div>
				</div>

				{#each activeOrders as order}
					{#if selectedOrderId === order.id}
						<div class="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 shadow-sm">
							<div class="mb-4 text-center">
								<div class="mb-2 flex items-center justify-center gap-2">
									<h3 class="text-lg font-bold text-blue-900">
										{order.code || `Order ${order.id.slice(-6)}`}
									</h3>
									<span
										class="rounded-full px-2 py-1 text-xs font-medium text-white {getStatusColor(
											order.status
										)}"
									>
										{getStatusText(order.status)}
									</span>
								</div>
								<p class="text-sm text-blue-700">{formatCurrency(order.total)}</p>
							</div>
							<div class="mb-4 rounded-xl bg-white p-4">
								<div class="flex items-start gap-3">
									<div
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100"
									>
										<MapPin class="h-4 w-4 text-orange-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium">Pickup from {order.shop?.name}</p>
										<p class="text-sm text-gray-600">{order.shop?.address}</p>
										<p class="mt-1 text-xs text-gray-500">
											{order.estimatedDistance || 0}km • {Math.round(
												(order.estimatedDuration || 900) / 60
											)}min
										</p>
										<div class="mt-2 flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												class="h-8"
												onclick={() => window.open(`tel:${order.shop?.phoneNumber}`)}
											>
												<Phone class="mr-1 h-3 w-3" />
												Call Store
											</Button>
											<Button
												variant="outline"
												size="sm"
												class="h-8"
												onclick={() =>
													window.open(
														`https://maps.google.com?daddr=${encodeURIComponent(order.shop?.address || '')}`
													)}
											>
												<Navigation class="mr-1 h-3 w-3" />
												Navigate
											</Button>
										</div>
									</div>
								</div>
							</div>
							<div class="mb-4 rounded-xl bg-white p-4">
								<div class="flex items-start gap-3">
									<div
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
									>
										<MapPin class="h-4 w-4 text-green-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium">
											Deliver to {order.customer?.name || 'Customer'}
										</p>
										<p class="text-sm text-gray-600">
											{order.addressName || `${order.latitude}, ${order.longitude}`}
										</p>
										<div class="mt-2 flex items-center gap-2">
											{#if order.customer?.phoneNumber}
												<Button
													variant="outline"
													size="sm"
													class="h-8"
													onclick={() => window.open(`tel:${order.customer?.phoneNumber}`)}
												>
													<Phone class="mr-1 h-3 w-3" />
													Call Customer
												</Button>
											{/if}
											<Button
												variant="outline"
												size="sm"
												class="h-8"
												onclick={() =>
													window.open(
														`https://maps.google.com?daddr=${order.latitude},${order.longitude}`
													)}
											>
												<Navigation class="mr-1 h-3 w-3" />
												Navigate
											</Button>
										</div>
									</div>
								</div>
							</div>
							<div class="space-y-2">
								<Button
									href="/rider/orders/{order.id}"
									variant="outline"
									class="h-10 w-full rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
								>
									<Eye class="mr-2 h-4 w-4" />
									View Details
								</Button>
								{#if order.status === 'RIDER_ASSIGNED'}
									<Button
										onclick={() => markAsPickedUp(order.id)}
										class="h-12 w-full rounded-xl bg-blue-500 text-white hover:bg-blue-600"
										disabled={isLoading}
									>
										<CheckCircle class="mr-2 h-5 w-5" />
										Mark as Picked Up
									</Button>
								{:else if order.status === 'IN_TRANSIT'}
									<Button
										onclick={() => handleMarkAsDelivered(order.id)}
										class="h-12 w-full rounded-xl bg-green-500 text-white hover:bg-green-600"
										disabled={isLoading}
									>
										<CheckCircle class="mr-2 h-5 w-5" />
										Mark as Delivered
									</Button>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<div class="rounded-2xl bg-gray-100 p-8 text-center shadow-sm">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-300"
				>
					<Clock class="h-6 w-6 text-gray-600" />
				</div>
				<h2 class="mb-2 text-lg font-bold text-gray-900">No Active Orders</h2>
				<p class="text-sm text-gray-600">New orders will appear here when assigned by admin</p>
			</div>
		{/if}
	</div>
</div>

{#if showConfirmationDialog}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
			<h3 class="mb-4 text-lg font-bold">Confirm Delivery</h3>
			<p class="mb-4 text-sm text-gray-600">
				Enter the confirmation code if provided by the customer:
			</p>
			<Input
				bind:value={confirmationCode}
				placeholder="Confirmation code (optional)"
				class="mb-4"
				type="number"
			/>
			<div class="flex gap-2">
				<Button
					onclick={() => {
						showConfirmationDialog = false;
						confirmationCode = '';
						orderToDeliver = null;
					}}
					variant="outline"
					class="flex-1"
				>
					Cancel
				</Button>
				<Button onclick={confirmDelivery} class="flex-1" disabled={isLoading}>Confirm</Button>
			</div>
		</div>
	</div>
{/if}
