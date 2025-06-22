<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { MapPin, Clock, DollarSign, Package, Search, ChevronRight } from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';
	import type { OrderDetails } from '$lib/services/riderOrderService';

	const { data } = $props();
	const orderHistory: OrderDetails[] = data.orderHistory || [];
	let selectedFilter = $state('all');
	let searchQuery = $state('');

	const totalEarnings = $derived(
		orderHistory.reduce((sum, order) => sum + (order.deliveryFee || 0), 0)
	);
	const totalOrders = $derived(orderHistory.length);

	function getStatusColor(status: string) {
		switch (status) {
			case 'COMPLETED':
				return 'bg-green-100 text-green-800';
			case 'DELIVERED':
				return 'bg-blue-100 text-blue-800';
			case 'CANCELLED':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Order History</h1>
			<p class="text-gray-600">View all your completed deliveries</p>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-2">
		<div class="rounded-lg bg-white p-6 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
					<DollarSign class="h-5 w-5 text-green-600" />
				</div>
				<div>
					<p class="text-sm text-gray-600">Total Earnings</p>
					<p class="text-xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
					<Package class="h-5 w-5 text-blue-600" />
				</div>
				<div>
					<p class="text-sm text-gray-600">Total Orders</p>
					<p class="text-xl font-bold text-blue-600">{totalOrders}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex gap-2">
				<Button
					variant={selectedFilter === 'all' ? 'default' : 'outline'}
					size="sm"
					onclick={() => (selectedFilter = 'all')}
				>
					All Orders
				</Button>
				<Button
					variant={selectedFilter === 'today' ? 'default' : 'outline'}
					size="sm"
					onclick={() => (selectedFilter = 'today')}
				>
					Today
				</Button>
				<Button
					variant={selectedFilter === 'week' ? 'default' : 'outline'}
					size="sm"
					onclick={() => (selectedFilter = 'week')}
				>
					This Week
				</Button>
			</div>

			<div class="relative">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					placeholder="Search orders..."
					bind:value={searchQuery}
					class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64"
				/>
			</div>
		</div>
	</div>

	<!-- Order List -->
	<div class="space-y-4">
		{#each orderHistory as order}
			<div class="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<!-- Order Header -->
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<h3 class="font-semibold text-gray-900">
									{order.code || `Order #${order.id.slice(-6)}`}
								</h3>
								<Badge class={getStatusColor(order.status)}>
									{order.status}
								</Badge>
							</div>
							<div class="text-right">
								<p class="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
								<p class="text-sm text-green-600">Fee: {formatCurrency(order.deliveryFee || 0)}</p>
							</div>
						</div>

						<!-- Order Details -->
						<div class="grid gap-4 md:grid-cols-2">
							<!-- Pickup & Delivery -->
							<div class="space-y-3">
								<div class="flex items-start gap-3">
									<div class="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">
										<MapPin class="h-3 w-3 text-orange-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">{order.shop.name}</p>
										<p class="text-xs text-gray-600">{order.shop.address || 'Pickup location'}</p>
									</div>
								</div>

								<div class="flex items-start gap-3">
									<div class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
										<MapPin class="h-3 w-3 text-green-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">Customer</p>
										<p class="text-xs text-gray-600">Delivery location</p>
									</div>
								</div>
							</div>

							<!-- Order Info -->
							<div class="space-y-2">
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<Clock class="h-4 w-4" />
									<span>
										{#if order.createdAt}
											Order: {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
										{:else}
											Order date unavailable
										{/if}
									</span>
								</div>
								{#if order.estimatedDistance}
									<div class="flex items-center gap-2 text-sm text-gray-600">
										<MapPin class="h-4 w-4" />
										<span>{order.estimatedDistance.toFixed(1)} km</span>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- View Details Button -->
					<div class="ml-4">
						<Button variant="outline" size="sm" href="/rider/orders/{order.id}">
							<span class="sr-only">View details</span>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Empty State -->
	{#if orderHistory.length === 0}
		<div class="rounded-lg bg-white p-12 text-center shadow-sm">
			<Package class="mx-auto h-12 w-12 text-gray-400" />
			<h3 class="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
			<p class="mt-2 text-gray-600">Your completed deliveries will appear here</p>
		</div>
	{/if}
</div>
