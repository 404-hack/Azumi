<script lang="ts">
	import { riderState } from '$lib/states/riderState.svelte';
	import { riderDispatchState } from '$lib/states/riderDispatchState.svelte';
	import { Button } from '$lib/components/ui/button';
	import { MapPin, Phone, DollarSign, Power, Navigation, CheckCircle, Clock } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { onMount } from 'svelte';
	const { data } = $props();
	// Static data using your existing ORDER_STATUS - only show active orders
	const allOrders = [
		{
			id: 'order-001',
			code: 'ORD-001',
			status: 'RIDER_ASSIGNED',
			totalAmount: 2500,
			pickupLocation: {
				name: 'KFC Victoria Island',
				address: '12 Ahmadu Bello Way, Victoria Island, Lagos',
				phone: '+234 813 456 7890'
			},
			deliveryLocation: {
				name: 'Sarah Johnson',
				address: '15 Banana Island Road, Ikoyi, Lagos',
				phone: '+234 901 234 5678'
			},
			estimatedTime: '15 mins',
			distance: '2.5 km'
		},
		{
			id: 'order-002',
			code: 'ORD-002',
			status: 'IN_TRANSIT',
			totalAmount: 1800,
			pickupLocation: {
				name: 'Chicken Republic',
				address: '25 Falomo Roundabout, Ikoyi, Lagos',
				phone: '+234 802 345 6789'
			},
			deliveryLocation: {
				name: 'David Chen',
				address: '8 Osborne Road, Ikoyi, Lagos',
				phone: '+234 708 901 2345'
			},
			estimatedTime: '8 mins',
			distance: '1.2 km'
		}
	];

	// Filter out completed/delivered orders for active orders display
	const activeOrders = $derived(
		allOrders.filter(
			(order) =>
				order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED'
		)
	);

	let selectedOrderId = $state(activeOrders[0]?.id || null);

	function startPickup(orderId: string) {
		// Opens navigation to pickup location
		const order = activeOrders.find((o) => o.id === orderId);
		if (order) {
			const mapsUrl = `https://maps.google.com?daddr=${encodeURIComponent(order.pickupLocation.address)}`;
			window.open(mapsUrl, '_blank');
		}
	}
	function markAsPickedUp(orderId: string) {
		// Update order status to IN_TRANSIT in the original array
		const orderIndex = allOrders.findIndex((o) => o.id === orderId);
		if (orderIndex !== -1) {
			allOrders[orderIndex].status = 'IN_TRANSIT';
		}
	}

	function markAsDelivered(orderId: string) {
		// Update order status to DELIVERED in the original array
		const orderIndex = allOrders.findIndex((o) => o.id === orderId);
		if (orderIndex !== -1) {
			allOrders[orderIndex].status = 'DELIVERED';
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

	onMount(() => {
		if (data?.profile?.id) {
			riderDispatchState.initialize(data.profile.id);
		} else {
			riderDispatchState.initialize();
		}
		return () => riderDispatchState.cleanup();
	});

	$effect(() => {
		if (data?.profile?.id) {
			riderDispatchState.setRiderId(data.profile.id);
		}
	});
</script>

<div class="min-h-screen bg-gray-50 p-4">
	<div class="mx-auto max-w-md space-y-4">
		<!-- Header with Online/Offline Toggle -->
		<div class="rounded-2xl bg-white p-6 shadow-sm">
			<div class="text-center">
				<div class="mb-4">
					<div
						class="mx-auto h-16 w-16 rounded-full {riderState.isActive
							? 'bg-green-500'
							: 'bg-gray-400'} flex items-center justify-center"
					>
						<Power class="h-8 w-8 text-white" />
					</div>
				</div>
				<h1 class="mb-2 text-xl font-bold">
					{riderState.isActive ? "You're Online" : "You're Offline"}
				</h1>
				<p class="mb-6 text-sm text-gray-600">
					{riderState.isActive ? 'Ready to receive orders' : 'Tap to go online and start earning'}
				</p>
				<Button
					onclick={() => {
						riderState.toggleActive();
						if (riderState.isActive) {
							riderDispatchState.goOnline();
						} else {
							riderDispatchState.goOffline();
						}
					}}
					class="h-12 w-full rounded-xl text-lg {riderState.isActive
						? 'bg-red-500 hover:bg-red-600'
						: 'bg-green-500 hover:bg-green-600'}"
				>
					{riderState.isActive ? 'Go Offline' : 'Go Online'}
				</Button>
			</div>
		</div>

		<!-- Today's Earnings -->
		<div class="rounded-2xl bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">Today's Earnings</p>
					<p class="text-2xl font-bold text-green-600">
						{formatCurrency(riderState.earnings.today)}
					</p>
				</div>
				<DollarSign class="h-8 w-8 text-green-500" />
			</div>
		</div>
		<!-- Active Orders or Waiting State -->
		{#if activeOrders.length > 0 && riderState.isActive}
			<!-- Multiple Orders -->
			<div class="space-y-4">
				<!-- Orders Summary -->
				<div class="rounded-2xl bg-white p-4 shadow-sm">
					<div class="mb-3 flex items-center justify-between">
						<h2 class="text-lg font-bold">Active Orders</h2>
						<span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
							{activeOrders.length} orders
						</span>
					</div>
					<!-- Order Tabs -->
					<div class="flex gap-2 overflow-x-auto pb-2">
						{#each activeOrders as order}
							<div class="flex-shrink-0">
								<button
									onclick={() => (selectedOrderId = order.id)}
									class="rounded-lg px-3 py-2 text-sm font-medium transition-colors
										{selectedOrderId === order.id
										? 'bg-blue-500 text-white'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
								>
									{order.code}
								</button>
								{#if selectedOrderId === order.id}
									<button
										onclick={() => (window.location.href = `/rider/orders/${order.id}`)}
										class="mt-1 block w-full rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
									>
										View Details
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>
				<!-- Selected Order Details -->
				{#each activeOrders as order}
					{#if selectedOrderId === order.id}
						<div
							class="cursor-pointer rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
							onclick={() => (window.location.href = `/rider/orders/${order.id}`)}
							role="button"
							tabindex="0"
							onkeydown={(e) =>
								e.key === 'Enter' && (window.location.href = `/rider/orders/${order.id}`)}
						>
							<div class="mb-4 text-center">
								<div class="mb-2 flex items-center justify-center gap-2">
									<h3 class="text-lg font-bold text-blue-900">{order.code}</h3>
									<span
										class="rounded-full px-2 py-1 text-xs font-medium text-white {getStatusColor(
											order.status
										)}"
									>
										{getStatusText(order.status)}
									</span>
								</div>
								<p class="text-sm text-blue-700">{formatCurrency(order.totalAmount)}</p>
								<p class="mt-1 text-xs text-blue-600">Tap for more details</p>
							</div>

							<!-- Pickup Location -->
							<div class="mb-4 rounded-xl bg-white p-4">
								<div class="flex items-start gap-3">
									<div
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100"
									>
										<MapPin class="h-4 w-4 text-orange-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium">Pickup from {order.pickupLocation.name}</p>
										<p class="text-sm text-gray-600">{order.pickupLocation.address}</p>
										<p class="mt-1 text-xs text-gray-500">
											{order.distance} • {order.estimatedTime}
										</p>
										<div class="mt-2 flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												class="h-8"
												onclick={() => window.open(`tel:${order.pickupLocation.phone}`)}
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
														`https://maps.google.com?daddr=${encodeURIComponent(order.pickupLocation.address)}`
													)}
											>
												<Navigation class="mr-1 h-3 w-3" />
												Navigate
											</Button>
										</div>
									</div>
								</div>
							</div>

							<!-- Delivery Location -->
							<div class="mb-4 rounded-xl bg-white p-4">
								<div class="flex items-start gap-3">
									<div
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
									>
										<MapPin class="h-4 w-4 text-green-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium">Deliver to {order.deliveryLocation.name}</p>
										<p class="text-sm text-gray-600">{order.deliveryLocation.address}</p>
										<div class="mt-2 flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												class="h-8"
												onclick={() => window.open(`tel:${order.deliveryLocation.phone}`)}
											>
												<Phone class="mr-1 h-3 w-3" />
												Call Customer
											</Button>
											<Button
												variant="outline"
												size="sm"
												class="h-8"
												onclick={() =>
													window.open(
														`https://maps.google.com?daddr=${encodeURIComponent(order.deliveryLocation.address)}`
													)}
											>
												<Navigation class="mr-1 h-3 w-3" />
												Navigate
											</Button>
										</div>
									</div>
								</div>
							</div>
							<!-- Action Buttons -->
							<div class="space-y-2">
								{#if order.status === 'RIDER_ASSIGNED'}
									<Button
										onclick={() => startPickup(order.id)}
										class="h-12 w-full rounded-xl bg-blue-500 text-white hover:bg-blue-600"
									>
										<Navigation class="mr-2 h-5 w-5" />
										Start Pickup
									</Button>
								{:else if order.status === 'IN_TRANSIT'}
									<Button
										onclick={() => markAsDelivered(order.id)}
										class="h-12 w-full rounded-xl bg-green-500 text-white hover:bg-green-600"
									>
										<CheckCircle class="mr-2 h-5 w-5" />
										Mark as Delivered
									</Button>
								{:else if order.status === 'DELIVERED'}
									<div class="flex h-12 w-full items-center justify-center rounded-xl bg-gray-100">
										<CheckCircle class="mr-2 h-5 w-5 text-green-600" />
										<span class="font-medium text-gray-600">Order Completed</span>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{:else if riderState.isActive}
			<!-- Waiting for Orders -->
			<div class="rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center shadow-sm">
				<div class="animate-pulse">
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-200"
					>
						<Clock class="h-6 w-6 text-green-600" />
					</div>
				</div>
				<h2 class="mb-2 text-lg font-bold text-green-900">Waiting for Orders</h2>
				<p class="text-sm text-green-700">Stay nearby, new orders will appear here</p>
			</div>
		{:else}
			<!-- Offline State -->
			<div class="rounded-2xl bg-gray-100 p-8 text-center shadow-sm">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-300"
				>
					<Power class="h-6 w-6 text-gray-600" />
				</div>
				<h2 class="mb-2 text-lg font-bold text-gray-900">You're Offline</h2>
				<p class="text-sm text-gray-600">Go online to start receiving orders</p>
			</div>
		{/if}
	</div>
</div>
