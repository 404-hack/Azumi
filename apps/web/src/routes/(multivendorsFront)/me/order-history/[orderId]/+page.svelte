<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props<{ data: PageData }>();

	let order = $derived(data.order);

	let timelineSteps = $derived(getTimelineSteps(order.status));
	function getStatusColor(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'CONFIRMED':
			case 'PAYMENT_CONFIRMED':
				return 'bg-primary/10 text-primary border-primary/20';
			case 'READY':
				return 'bg-primary/20 text-primary border-primary/30';
			case 'RIDER_ASSIGNED':
			case 'IN_TRANSIT':
				return 'bg-orange-100 text-orange-800 border-orange-200';
			case 'DELIVERED':
			case 'COMPLETED':
				return 'bg-primary/10 text-primary border-primary/20';
			case 'CANCELLED':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}
	function getStatusText(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'Order Placed';
			case 'PAYMENT_CONFIRMED':
			case 'CONFIRMED':
				return 'Being Prepared';
			case 'READY':
				return 'Ready for Pickup';
			case 'RIDER_ASSIGNED':
				return 'Rider Assigned';
			case 'IN_TRANSIT':
				return 'Out for Delivery';
			case 'DELIVERED':
			case 'COMPLETED':
				return 'Delivered';
			case 'CANCELLED':
				return 'Cancelled';
			default:
				return status;
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN'
		}).format(amount);
	}
	function getTimelineSteps(currentStatus: string) {
		const allSteps = [
			{
				key: 'PENDING',
				title: 'Order Received',
				description: 'We received your order',
				icon: '🛒'
			},
			{
				key: 'CONFIRMED',
				title: 'Being Prepared',
				description: 'Restaurant confirmed and is preparing your food',
				icon: '👨‍🍳'
			},
			{
				key: 'READY',
				title: 'Ready for Pickup',
				description: 'Your food is ready and waiting for delivery',
				icon: '✅'
			},
			{
				key: 'IN_TRANSIT',
				title: 'Out for Delivery',
				description: 'Your order is on the way',
				icon: '🚗'
			},
			{
				key: 'DELIVERED',
				title: 'Delivered',
				description: 'Enjoy your meal!',
				icon: '🎉'
			}
		];

		const statusOrder = [
			'PENDING',
			'CONFIRMED',
			'PAYMENT_CONFIRMED',
			'READY',
			'RIDER_ASSIGNED',
			'IN_TRANSIT',
			'DELIVERED',
			'COMPLETED'
		];
		const currentIndex = statusOrder.findIndex(
			(status) =>
				status === currentStatus ||
				(currentStatus === 'PAYMENT_CONFIRMED' && status === 'CONFIRMED') ||
				(currentStatus === 'RIDER_ASSIGNED' && status === 'IN_TRANSIT') ||
				(currentStatus === 'COMPLETED' && status === 'DELIVERED')
		);

		return allSteps.map((step, index) => ({
			...step,
			isCompleted: index <= Math.max(0, currentIndex),
			isCurrent: index === Math.max(0, currentIndex),
			isUpcoming: index > Math.max(0, currentIndex)
		}));
	}
</script>

<svelte:head>
	<title>Order #{order.code} - Zumi</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<div class="border-b bg-white">
		<div class="mx-auto max-w-4xl px-4 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<button
						onclick={() => goto('/me/order-history')}
						class="rounded-lg p-2 transition-colors hover:bg-gray-100"
					>
						<svg
							class="h-5 w-5 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							></path>
						</svg>
					</button>
					<h1 class="text-xl font-bold text-gray-900">Order #{order.code}</h1>
				</div>
				<span
					class={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}
				>
					{getStatusText(order.status)}
				</span>
			</div>
		</div>
	</div>
	<div class="mx-auto max-w-4xl px-4">
		{#if order.riderConfirmationCode}
			<div class="border-b py-6">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Delivery PIN</h2>
					<div class="flex space-x-2 text-2xl font-bold tracking-wider text-gray-900">
						{#each order.riderConfirmationCode.toString().split('') as digit}
							<span class="rounded bg-gray-100 px-3 py-2">{digit}</span>
						{/each}
					</div>
				</div>
			</div>
		{/if}
		<div class="border-b py-8">
			<h3 class="mb-6 text-lg font-semibold text-gray-900">Pack 1</h3>
			<div class="space-y-4">
				{#each order.items as item}
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<img
								src="/shop.avif"
								alt={item.menuItemName}
								class="h-12 w-12 rounded-lg object-cover"
							/>
							<span class="text-sm font-medium text-gray-900"
								>{item.menuItemName} x {item.quantity}</span
							>
						</div>
						<span class="text-sm font-medium text-gray-900">{formatCurrency(item.totalPrice)}</span>
					</div>
				{/each}
			</div>
		</div>
		<div class="border-b py-8">
			<div class="space-y-4">
				<div class="flex justify-between text-sm">
					<span class="text-gray-600">Sub total</span>
					<span class="text-gray-900">{formatCurrency(order.subtotal)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-gray-600">Delivery</span>
					<span class="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
				</div>
				{#if order.serviceFee > 0}
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Service fee</span>
						<span class="text-gray-900">{formatCurrency(order.serviceFee)}</span>
					</div>
				{/if}
				<div class="flex justify-between border-t pt-4 font-semibold">
					<span class="text-gray-900">Total</span>
					<span class="text-gray-900">{formatCurrency(order.total)}</span>
				</div>
			</div>
		</div>
		<div class="py-8">
			<button class="text-primary mb-6 font-medium">Hide order Timeline</button>
			<div class="space-y-6">
				{#each timelineSteps as step, index}
					<div class="flex items-start space-x-4">
						<div class="mt-1 flex-shrink-0">
							{#if step.isCompleted}
								<div class="bg-primary flex h-6 w-6 items-center justify-center rounded-full">
									<svg
										class="h-4 w-4 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										></path>
									</svg>
								</div>
							{:else}
								<div class="h-6 w-6 rounded-full border-2 border-gray-300"></div>
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between">
								<div>
									<h4 class="text-sm font-medium text-gray-900">{step.title}</h4>
									<p class="text-sm text-gray-500">{step.description}</p>
								</div>
								{#if step.isCompleted}
									<span class="text-primary text-xs">
										{#if step.key === 'PENDING'}
											{formatTime(order.createdAt)}
										{:else if step.key === 'CONFIRMED' && order.acceptedAt}
											{formatTime(order.acceptedAt)}
										{:else if step.key === 'READY' && order.preparedAt}
											{formatTime(order.preparedAt)}
										{:else if step.key === 'IN_TRANSIT' && order.pickedUpAt}
											{formatTime(order.pickedUpAt)}
										{:else if step.key === 'DELIVERED' && order.deliveredAt}
											{formatTime(order.deliveredAt)}
										{/if}
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
		<div class="border-t py-8">
			<div class="grid grid-cols-2 space-x-4">
				<Button variant="secondary" onclick={() => goto('/me/order-history')}>Back to Orders</Button
				>
				<Button>Reorder</Button>
			</div>
		</div>
	</div>
</div>
