<!-- filepath: c:\Users\HP\Documents\program\african-martket-monorepo\apps\web\src\routes\(multivendorsFront)\me\order-history\+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let orderList = data.orderList;

	function handleOrderClick(orderId: string) {
		goto(`/me/order-history/${orderId}`);
	}

	function formatDate(dateString: string): string {
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return 'Date unavailable';
			}
			return new Intl.DateTimeFormat('en-US', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}).format(date);
		} catch (error) {
			return 'Date unavailable';
		}
	}

	function getStatusText(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'Order Placed';
			case 'PAYMENT_CONFIRMED':
			case 'CONFIRMED':
				return 'Confirmed';
			case 'READY':
				return 'Ready';
			case 'RIDER_ASSIGNED':
				return 'Rider Assigned';
			case 'IN_TRANSIT':
				return 'On the way';
			case 'DELIVERED':
			case 'COMPLETED':
				return 'Delivered';
			case 'CANCELLED':
				return 'Cancelled';
			default:
				return status;
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'text-yellow-600';
			case 'CONFIRMED':
			case 'PAYMENT_CONFIRMED':
				return 'text-blue-600';
			case 'READY':
				return 'text-purple-600';
			case 'RIDER_ASSIGNED':
			case 'IN_TRANSIT':
				return 'text-orange-600';
			case 'DELIVERED':
			case 'COMPLETED':
				return 'text-green-600';
			case 'CANCELLED':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl px-4 py-6">
		<h1 class="mb-6 text-2xl font-bold text-gray-900">Orders</h1>

		{#if orderList && orderList.length > 0}
			<div class="space-y-3">
				{#each orderList as order}
					<div
						class="cursor-pointer border-b border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
						onclick={() => handleOrderClick(order.id)}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleOrderClick(order.id);
							}
						}}
					>
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-semibold text-gray-900">
									{order.shop?.name || 'Restaurant'}
								</h3>
								<p class="mt-1 text-sm text-gray-500">
									{formatDate(order.createdAt)}
								</p>
								<div class="mt-2">
									<span class="text-sm {getStatusColor(order.status)}">
										{getStatusText(order.status)}
									</span>
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm text-gray-500">Order {order.code}</p>
								<button class="mt-1 text-sm text-blue-600 hover:text-blue-800">
									View timeline
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="py-16 text-center">
				<h2 class="mb-2 text-xl font-semibold text-gray-900">No orders yet</h2>
				<p class="mb-6 text-gray-600">When you place your first order, it will appear here</p>
			</div>
		{/if}
	</div>
</div>
