<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import {
		ChevronLeft,
		Package,
		User,
		Clock,
		Truck,
		Map,
		CheckCircle2,
		Phone
	} from 'lucide-svelte';

	let { data } = $props<{ data: PageData }>();

	let order = $derived(data.order);

	function getStatusColor(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'CONFIRMED':
			case 'PAYMENT_CONFIRMED':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'READY':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'RIDER_ASSIGNED':
			case 'IN_TRANSIT':
				return 'bg-orange-100 text-orange-800 border-orange-200';
			case 'DELIVERED':
			case 'COMPLETED':
				return 'bg-green-100 text-green-800 border-green-200';
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
				return 'Payment Confirmed';
			case 'CONFIRMED':
				return 'Being Prepared';
			case 'READY':
				return 'Ready for Pickup';
			case 'RIDER_ASSIGNED':
				return 'Rider Assigned';
			case 'IN_TRANSIT':
				return 'Out for Delivery';
			case 'DELIVERED':
				return 'Delivered';
			case 'COMPLETED':
				return 'Completed';
			case 'CANCELLED':
				return 'Cancelled';
			default:
				return status;
		}
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
				title: 'Order Placed',
				description: 'Your order has been received',
				icon: CheckCircle2
			},
			{
				key: 'PAYMENT_CONFIRMED',
				title: 'Payment Confirmed',
				description: 'Payment verified, waiting for restaurant confirmation',
				icon: CheckCircle2
			},
			{
				key: 'CONFIRMED',
				title: 'Restaurant Confirmed',
				description: 'Restaurant confirmed and is preparing your food',
				icon: Package
			},
			{
				key: 'READY',
				title: 'Ready for Pickup',
				description: 'Your food is ready and waiting for delivery',
				icon: Clock
			},
			{
				key: 'RIDER_ASSIGNED',
				title: 'Rider Assigned',
				description: 'Your order has been assigned to a rider',
				icon: User
			},
			{
				key: 'IN_TRANSIT',
				title: 'Out for Delivery',
				description: 'Your order is on the way to you',
				icon: Truck
			},
			{
				key: 'DELIVERED',
				title: 'Delivered',
				description: 'Your order has been delivered. Enjoy your meal!',
				icon: CheckCircle2
			}
		];

		const statusOrder = [
			'PENDING',
			'PAYMENT_CONFIRMED',
			'CONFIRMED',
			'READY',
			'RIDER_ASSIGNED',
			'IN_TRANSIT',
			'DELIVERED',
			'COMPLETED'
		];

		const currentIndex = statusOrder.findIndex((status) => status === currentStatus);

		return allSteps.map((step, index) => ({
			...step,
			status: index <= currentIndex
		}));
	}

	let timelineSteps = $derived(getTimelineSteps(order.status));

	function handleReorder() {
		goto(`/shop/${order.shopId}`);
	}
</script>

<svelte:head>
	<title>Order #{order.code} - Azumi</title>
</svelte:head>

<div class="mx-auto max-w-xl bg-white pb-8">
	<!-- Header with back button -->
	<header class="sticky top-0 z-50 flex items-center border-b border-gray-100 bg-white px-4 py-4">
		<button onclick={() => goto('/me/order-history')} class="flex items-center">
			<ChevronLeft class="h-5 w-5" />
		</button>
		<h1 class="flex-1 text-center text-lg font-semibold">Order #{order.code}</h1>
		<span class={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
			{getStatusText(order.status)}
		</span>
	</header>

	<!-- Status message -->
	<div class="flex items-center justify-between px-4 pb-5 pt-6">
		<p class="text-sm text-gray-600">
			{#if order.status === 'PENDING'}
				Your order has been placed and is being processed
			{:else if order.status === 'PAYMENT_CONFIRMED'}
				Payment confirmed, waiting for restaurant confirmation
			{:else if order.status === 'CONFIRMED'}
				Restaurant confirmed - your order is being prepared
			{:else if order.status === 'READY'}
				Your order is ready for pickup
			{:else if order.status === 'RIDER_ASSIGNED'}
				A rider has been assigned to your order
			{:else if order.status === 'IN_TRANSIT'}
				Your order is on the way
			{:else if order.status === 'DELIVERED'}
				Your order has been delivered
			{:else if order.status === 'COMPLETED'}
				Your order is complete
			{:else}
				Order status: {getStatusText(order.status)}
			{/if}
		</p>
		<div class="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
			<Phone class="text-primary h-6 w-6" />
		</div>
	</div>

	<!-- Delivery PIN -->
	{#if order.riderConfirmationCode}
		<div class="border-b border-gray-100 px-4 pb-5">
			<p class="mb-2 text-sm text-gray-500">Delivery confirmation code</p>
			<div class="flex flex-col gap-1">
				<p class="mb-2 font-medium">Share this code with your rider</p>
				<div class="flex gap-2">
					{#each order.riderConfirmationCode.toString().split('') as digit}
						<div
							class="flex h-12 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl font-semibold"
						>
							{digit}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Order timeline -->
	<div class="px-4 py-5">
		<div class="relative">
			<!-- Timeline line -->
			<div class="absolute bottom-0 left-5 top-2 w-0.5 bg-gray-200" />

			{#each timelineSteps as step, index}
				<div class="relative mb-8 flex last:mb-0">
					<div
						class="z-10 flex h-10 w-10 items-center justify-center rounded-full {step.status
							? 'bg-primary/10'
							: 'bg-gray-200'}"
					>
						<svelte:component
							this={step.icon}
							class="h-6 w-6 {step.status ? 'text-primary' : 'text-gray-400'}"
						/>
					</div>
					<div class="ml-4 flex-grow">
						<h3 class="font-medium {step.status ? 'text-primary' : 'text-gray-700'}">
							{step.title}
						</h3>
						<p class="text-sm text-gray-600">{step.description}</p>
						{#if step.status}
							<div class="flex justify-between">
								<p class="text-xs font-medium text-blue-600">
									{#if step.key === 'PENDING'}
										{formatTime(order.createdAt)}
									{:else if step.key === 'PAYMENT_CONFIRMED' && order.paymentConfirmedAt}
										{formatTime(order.paymentConfirmedAt)}
									{:else if step.key === 'CONFIRMED' && order.acceptedAt}
										{formatTime(order.acceptedAt)}
									{:else if step.key === 'READY' && order.preparedAt}
										{formatTime(order.preparedAt)}
									{:else if step.key === 'RIDER_ASSIGNED' && order.riderAssignedAt}
										{formatTime(order.riderAssignedAt)}
									{:else if step.key === 'IN_TRANSIT' && order.pickedUpAt}
										{formatTime(order.pickedUpAt)}
									{:else if step.key === 'DELIVERED' && order.deliveredAt}
										{formatTime(order.deliveredAt)}
									{/if}
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Delivery Details -->
	{#if order.addressName}
		<div class="border-t border-gray-100 px-4 py-4">
			<h2 class="mb-4 font-medium">Delivery details</h2>
			<div class="mb-4 flex gap-3">
				<Map class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
				<div class="w-full">
					<p class="text-sm text-gray-800">{order.addressName}</p>
				</div>
			</div>
			{#if order.deliveryNotes}
				<div class="flex gap-3">
					<Truck class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
					<div class="w-full">
						<p class="text-sm text-gray-500">Delivery instructions</p>
						<p class="mb-1 text-sm text-gray-800">{order.deliveryNotes}</p>
					</div>
				</div>
			{/if}
			{#if order.vendorInstructions}
				<div class="mt-4 flex gap-3">
					<Package class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
					<div class="w-full">
						<p class="text-sm text-gray-500">Vendor instructions</p>
						<p class="mb-1 text-sm text-gray-800">{order.vendorInstructions}</p>
					</div>
				</div>
			{/if}
			{#if order.riderInstructions}
				<div class="mt-4 flex gap-3">
					<User class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
					<div class="w-full">
						<p class="text-sm text-gray-500">Rider instructions</p>
						<p class="mb-1 text-sm text-gray-800">{order.riderInstructions}</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Your Order -->
	<div class="border-t border-gray-100 px-4 py-4">
		<div class="mb-2 flex items-center justify-between">
			<h2 class="font-medium">Your order</h2>
			{#if order.riderId && (order.status === 'IN_TRANSIT' || order.status === 'RIDER_ASSIGNED')}
				<a
					href="tel:{order.rider?.phone || ''}"
					class="h-8 rounded border border-gray-200 bg-gray-100 px-3 text-sm text-gray-600 hover:bg-gray-200"
				>
					CALL RIDER
				</a>
			{/if}
		</div>

		<p class="mb-2 text-sm font-medium text-gray-800">{order.shop?.name || 'Restaurant'}</p>
		<div class="mb-6">
			{#each order.items as item}
				<div class="mb-2">
					<div class="flex justify-between">
						<p class="text-sm text-gray-800">{item.menuItemName} x {item.quantity}</p>
						<p class="text-sm text-gray-800">{formatCurrency(item.totalPrice)}</p>
					</div>
					{#if item.specialInstructions}
						<p class="text-xs text-gray-500">Note: {item.specialInstructions}</p>
					{/if}
					{#if item.options && item.options.length > 0}
						{@const groupedOptions = item.options.reduce<Record<string, typeof item.options>>(
							(acc, opt) => {
								const groupName = opt.optionGroup?.name || 'Other';
								if (!acc[groupName]) acc[groupName] = [];
								acc[groupName].push(opt);
								return acc;
							},
							{}
						)}

						{#each Object.entries(groupedOptions) as [groupName, options]}
							<div class="ml-4 mt-2 rounded-md bg-gray-50/50 p-2">
								<p class="text-xs font-semibold text-gray-700">{groupName}</p>
								<div class="mt-1.5 space-y-1">
									{#each options as option}
										<div class="flex justify-between rounded bg-white px-2 py-1 text-xs">
											<span class="text-gray-600">
												<span class="text-gray-400">•</span>
												{option.optionName}
												<span class="ml-1 text-gray-400">×{option.quantity}</span>
											</span>
											{#if option.price && option.price > 0}
												<span class="font-medium text-gray-700"
													>+{formatCurrency(option.price)}</span
												>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/each}
		</div>

		<!-- Order Summary -->
		<div class="space-y-2">
			<div class="flex justify-between">
				<p class="text-sm text-gray-500">Subtotal</p>
				<p class="text-sm text-gray-600">{formatCurrency(order.subtotal)}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm text-gray-500">Delivery fee</p>
				<p class="text-sm text-gray-600">{formatCurrency(order.deliveryFee)}</p>
			</div>
			{#if order.serviceFee > 0}
				<div class="flex justify-between">
					<p class="text-sm text-gray-500">Service fee</p>
					<p class="text-sm text-gray-600">{formatCurrency(order.serviceFee)}</p>
				</div>
			{/if}
			{#if order.discount > 0}
				<div class="flex justify-between">
					<p class="text-sm text-gray-500">Discount</p>
					<p class="text-primary text-sm">-{formatCurrency(order.discount)}</p>
				</div>
			{/if}
			<div class="flex justify-between border-t border-gray-100 pt-2">
				<p class="font-medium">Total</p>
				<p class="font-medium">{formatCurrency(order.total)}</p>
			</div>
		</div>

		{#if order.status === 'DELIVERED' || order.status === 'COMPLETED'}
			<div class="mt-6">
				<button
					onclick={() => goto('/me/order-history')}
					class="border-primary/20 text-primary hover:bg-primary/5 h-12 w-full rounded-lg border bg-white"
				>
					See Order Again
				</button>
			</div>
		{/if}
	</div>

	<!-- Action Buttons -->
	<div class="border-t border-gray-100 px-4 py-4">
		<div class="flex gap-3">
			<button
				onclick={() => goto('/me/order-history')}
				class="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
			>
				Back to Orders
			</button>
			{#if order.status === 'DELIVERED' || order.status === 'COMPLETED'}
				<button
					onclick={handleReorder}
					class="bg-primary hover:bg-primary/90 flex-1 rounded-lg px-4 py-3 text-sm font-medium text-white"
				>
					Reorder
				</button>
			{/if}
		</div>
	</div>
</div>
