<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		ArrowLeft,
		Phone,
		MapPin,
		AlertCircle,
		Clock,
		Package,
		User,
		Receipt,
		Bike
	} from 'lucide-svelte';

	import { formatCurrency, formatDate, formatTime } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { client } from '$lib/hc';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	let order = $state(data.order);
	let isUpdatingStatus = $state(false);

	type OrderStatus =
		| 'PENDING'
		| 'PAYMENT_CONFIRMED'
		| 'CONFIRMED'
		| 'READY'
		| 'RIDER_ASSIGNED'
		| 'IN_TRANSIT'
		| 'DELIVERED'
		| 'COMPLETED'
		| 'CANCELLED';
	type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

	const statusColors: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		PENDING: 'outline',
		PAYMENT_CONFIRMED: 'default',
		CONFIRMED: 'default',
		READY: 'secondary',
		RIDER_ASSIGNED: 'default',
		IN_TRANSIT: 'default',
		DELIVERED: 'secondary',
		COMPLETED: 'secondary',
		CANCELLED: 'destructive'
	} as const;

	const paymentStatusColors: Record<
		PaymentStatus,
		'default' | 'secondary' | 'destructive' | 'outline'
	> = {
		PENDING: 'outline',
		COMPLETED: 'secondary',
		FAILED: 'destructive'
	} as const;
	type StatusAction = {
		label: string;
		action: string;
		variant: 'default' | 'outline';
		primary?: boolean;
		class?: string;
	};
	const statusActions: Partial<Record<OrderStatus, StatusAction[]>> = {
		PAYMENT_CONFIRMED: [
			{
				label: 'Confirm Order',
				action: 'CONFIRMED',
				variant: 'default',
				primary: true
			},
			{
				label: 'Cancel Order',
				action: 'CANCELLED',
				variant: 'outline',
				class: 'text-destructive hover:bg-destructive hover:text-destructive-foreground'
			}
		],
		CONFIRMED: [
			{
				label: 'Mark Ready',
				action: 'READY',
				variant: 'default',
				primary: true
			},
			{
				label: 'Cancel Order',
				action: 'CANCELLED',
				variant: 'outline',
				class: 'text-destructive hover:bg-destructive hover:text-destructive-foreground'
			}
		]
	} as const;

	async function updateOrderStatus(newStatus: OrderStatus, cancelReason?: string) {
		if (isUpdatingStatus) return;

		try {
			isUpdatingStatus = true;

			const response = await client.order[':id'].status.$patch({
				param: { id: order.id },
				json: {
					status: newStatus,
					...(cancelReason && { cancelReason })
				}
			});
			if (!response.ok) {
				const errorData = await response.json();
				const errorMessage =
					'error' in errorData ? errorData.error : 'Failed to update order status';
				throw new Error(errorMessage);
			}

			const result = await response.json();

			// Update the local order state
			order = { ...order, status: newStatus };

			// Show success message (you can replace this with a toast notification)
			console.log(`Order status updated to ${newStatus}`);
		} catch (error) {
			console.error('Error updating order status:', error);
			// Show error message (you can replace this with a toast notification)
			alert('Failed to update order status. Please try again.');
		} finally {
			isUpdatingStatus = false;
		}
	}

	function handleStatusAction(action: StatusAction) {
		const newStatus = action.action as OrderStatus;

		if (newStatus === 'CANCELLED') {
			// For cancellation, you might want to show a confirmation dialog
			const reason = prompt('Please provide a reason for cancellation (optional):');
			updateOrderStatus(newStatus, reason || undefined);
		} else {
			updateOrderStatus(newStatus);
		}
	}
</script>

<div class="min-h-screen bg-gray-50 p-3 sm:p-6">
	<div class="mx-auto max-w-2xl space-y-4">
		<!-- Header -->
		<div class="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
			<Button variant="ghost" size="sm" onclick={() => goto('/vendor/orders')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div class="flex-1">
				<h1 class="text-lg font-bold sm:text-xl">Order #{order.code || order.id.slice(-6)}</h1>
				<p class="text-sm text-gray-500">
					{order.createdAt ? formatDate(order.createdAt) : ''}
					{order.createdAt ? `at ${formatTime(order.createdAt)}` : ''}
				</p>
			</div>
		</div>
		<!-- Status & Actions (Most Important) -->
		<div class="rounded-lg bg-white p-4 shadow-sm">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="font-semibold text-gray-900">Order Status</h2>
					<div class="mt-2 flex gap-2">
						<Badge variant={statusColors[order.status as OrderStatus]} class="text-sm">
							{order.status.replace('_', ' ')}
						</Badge>
						<Badge
							variant={paymentStatusColors[order.paymentStatus as PaymentStatus]}
							class="text-sm"
						>
							{order.paymentStatus}
						</Badge>
					</div>
				</div>

				<!-- Action Buttons -->
				{#if statusActions[order.status as OrderStatus]}
					<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						{#each statusActions[order.status as OrderStatus] || [] as action}
							<Button
								variant={action.variant}
								class="w-full sm:w-auto {action.class || ''}"
								onclick={() => handleStatusAction(action)}
								disabled={isUpdatingStatus}
								size="sm"
							>
								{isUpdatingStatus ? 'Updating...' : action.label}
							</Button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		<!-- Order Items (What to Prepare) -->
		<div class="rounded-lg bg-white p-4 shadow-sm">
			<h2 class="mb-4 flex items-center gap-2 font-semibold text-gray-900">
				<Package class="h-4 w-4 text-gray-500" />
				Items to Prepare
			</h2>
			<div class="space-y-4">
				{#each order.items as item}
					<div class="flex gap-3 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
						{#if item.menuItem?.imageUrl}
							<div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
								<img
									src={item.menuItem.imageUrl}
									alt={item.menuItemName}
									class="h-full w-full object-cover"
								/>
							</div>
						{:else}
							<div
								class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100"
							>
								<Package class="h-6 w-6 text-gray-400" />
							</div>
						{/if}

						<div class="min-w-0 flex-1">
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1">
									<div class="font-medium text-gray-900">
										<span
											class="mr-2 inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-gray-700 text-sm font-bold text-white"
										>
											{item.quantity}
										</span>
										{item.menuItemName}
									</div>
									{#if item.options && item.options.length > 0}
										<div class="mt-1 space-y-1">
											{#each item.options as option}
												<div class="text-sm text-gray-600">
													+ {option.optionName} ({formatCurrency(option.price)})
												</div>
											{/each}
										</div>
									{/if}
									{#if item.specialInstructions}
										<div
											class="mt-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
										>
											<strong>⚠️ Special Instructions:</strong>
											{item.specialInstructions}
										</div>
									{/if}
								</div>
								<div class="shrink-0 font-semibold text-gray-900">
									{formatCurrency(item.totalPrice)}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Rider Information (shown when rider is assigned) -->
		{#if order.rider && (order.status === 'RIDER_ASSIGNED' || order.status === 'IN_TRANSIT')}
			<div class="rounded-lg bg-white p-4 shadow-sm">
				<h2 class="mb-3 flex items-center gap-2 font-semibold text-gray-900">
					<Bike class="text-primary h-4 w-4" />
					Assigned Rider
				</h2>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<div class="font-medium text-gray-900">{order.rider?.name || 'Rider'}</div>
							<div class="text-sm text-gray-500">
								{order.rider?.phoneNumber || 'No phone number'}
							</div>
							{#if order.riderAssignedAt}
								<div class="text-sm text-blue-600">
									Assigned at: {formatTime(order.riderAssignedAt)}
								</div>
							{/if}
						</div>
						{#if order.rider?.phoneNumber}
							<Button
								variant="outline"
								size="sm"
								onclick={() => window.open(`tel:${order.rider.phoneNumber}`)}
								class="shrink-0"
							>
								<Phone class="mr-1 h-4 w-4" />
								Call Rider
							</Button>
						{/if}
					</div>
					{#if order.status === 'IN_TRANSIT'}
						<div class="border-primary/20 bg-primary/5 rounded-md border p-3">
							<div class="flex items-start gap-2">
								<Bike class="text-primary mt-0.5 h-4 w-4 shrink-0" />
								<div class="flex-1">
									<div class="text-primary text-sm font-medium">Order is on the way!</div>
									<div class="mt-1 text-sm text-gray-700">
										The rider has picked up the order and is heading to the customer.
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Customer & Delivery Info -->
		<div class="rounded-lg bg-white p-4 shadow-sm">
			<h2 class="mb-3 flex items-center gap-2 font-semibold text-gray-900">
				<User class="h-4 w-4 text-gray-500" />
				Customer & Delivery
			</h2>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<div class="font-medium text-gray-900">{order.customer?.name || 'Customer'}</div>
						<div class="text-sm text-gray-500">
							{order.customer?.phoneNumber || 'No phone number'}
						</div>
					</div>
					{#if order.customer?.phoneNumber}
						<Button
							variant="outline"
							size="sm"
							onclick={() => window.open(`tel:${order.customer.phoneNumber}`)}
							class="shrink-0"
						>
							<Phone class="mr-1 h-4 w-4" />
							Call Customer
						</Button>
					{/if}
				</div>
				{#if order.addressName}
					<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
						<div class="flex items-start gap-2">
							<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
							<div class="flex-1">
								<div class="text-sm font-medium text-gray-900">Delivery Address</div>
								<div class="mt-1 text-sm text-gray-700">{order.addressName}</div>
								{#if order.deliveryNotes}
									<div class="mt-2 flex gap-2 text-sm text-gray-700">
										<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
										<span><strong>Note:</strong> {order.deliveryNotes}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
		<!-- Order Summary -->
		<div class="rounded-lg bg-white p-4 shadow-sm">
			<h2 class="mb-3 flex items-center gap-2 font-semibold text-gray-900">
				<Receipt class="h-4 w-4 text-gray-500" />
				Payment Details
			</h2>
			<div class="space-y-2">
				<div class="flex justify-between text-sm">
					<span class="text-gray-600">Subtotal</span>
					<span class="text-gray-900">{formatCurrency(order.subtotal || 0)}</span>
				</div>
				{#if order.deliveryFee && order.deliveryFee > 0}
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Delivery Fee</span>
						<span class="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
					</div>
				{/if}
				{#if order.serviceFee && order.serviceFee > 0}
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Service Fee</span>
						<span class="text-gray-900">{formatCurrency(order.serviceFee)}</span>
					</div>
				{/if}
				<hr class="my-3" />
				<div class="flex justify-between text-lg font-bold">
					<span>Total</span>
					<span>{formatCurrency(order.total)}</span>
				</div>
				<div class="mt-2 text-center text-sm text-gray-500">
					Payment Method: {order.paymentMethod || 'Not specified'}
				</div>
			</div>
		</div>
		<!-- Timeline (Historical Info) -->
		{#if order.acceptedAt || order.riderAssignedAt}
			<div class="rounded-lg bg-white p-4 shadow-sm">
				<h2 class="mb-3 flex items-center gap-2 font-semibold text-gray-900">
					<Clock class="h-4 w-4 text-gray-500" />
					Timeline
				</h2>
				<div class="space-y-2">
					{#if order.acceptedAt}
						<div class="flex items-center gap-2 text-sm text-gray-600">
							<div class="h-2 w-2 rounded-full bg-gray-400"></div>
							<span>Order accepted at: {formatTime(order.acceptedAt)}</span>
						</div>
					{/if}
					{#if order.riderAssignedAt}
						<div class="flex items-center gap-2 text-sm text-gray-600">
							<div class="bg-primary h-2 w-2 rounded-full"></div>
							<span>Rider assigned at: {formatTime(order.riderAssignedAt)}</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
