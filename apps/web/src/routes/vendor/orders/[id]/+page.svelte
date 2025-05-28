<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Phone, MapPin, AlertCircle, Clock } from 'lucide-svelte';

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

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto('/vendor/orders')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold">Order #{order.code || order.id}</h1>
				<p class="text-sm text-muted-foreground">
					{order.createdAt ? formatDate(order.createdAt) : ''}
					{order.createdAt ? `at ${formatTime(order.createdAt)}` : ''}
				</p>
			</div>
		</div>
		<div class="flex gap-2">
			<Badge variant={statusColors[order.status as OrderStatus]}>{order.status}</Badge>
			<Badge variant={paymentStatusColors[order.paymentStatus as PaymentStatus]}
				>{order.paymentStatus}</Badge
			>
		</div>
	</div>
	<div class="grid gap-6 md:grid-cols-2">
		<!-- Left Column -->
		<div class="space-y-6">
			<!-- Customer Info -->
			<div class="rounded-lg border p-4">
				<h2 class="mb-4 font-semibold">Customer Information</h2>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<div>
							<div class="font-medium">{order.customer?.name || 'Customer'}</div>
							<div class="text-sm text-muted-foreground">
								{order.customer?.phoneNumber || 'N/A'}
							</div>
						</div>
						{#if order.customer?.phoneNumber}
							<Button variant="ghost" size="icon" class="h-8 w-8">
								<Phone class="h-4 w-4" />
							</Button>
						{/if}
					</div>
					{#if order.addressName}
						<div class="mt-4 rounded-md bg-muted/50 p-3 text-sm">
							<div class="flex gap-2">
								<MapPin class="h-4 w-4 shrink-0" />
								<span>{order.addressName}</span>
							</div>
							{#if order.deliveryNotes}
								<div class="mt-2 flex gap-2 text-muted-foreground">
									<AlertCircle class="h-4 w-4 shrink-0" />
									<span>{order.deliveryNotes}</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Order Timeline -->
			{#if order.acceptedAt}
				<div class="rounded-lg border p-4">
					<h2 class="mb-4 font-semibold">Order Timeline</h2>
					<div class="flex items-center gap-2 text-sm">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span>Accepted at: {order.acceptedAt ? formatTime(order.acceptedAt) : 'N/A'}</span>
					</div>
				</div>
			{/if}
		</div>
		<!-- Right Column -->
		<div class="space-y-6">
			<!-- Order Items -->
			<div class="rounded-lg border p-4">
				<h2 class="mb-4 font-semibold">Order Items</h2>
				<div class="space-y-4">
					{#each order.items as item}
						<div class="flex gap-3">
							{#if item.menuItem?.imageUrl}
								<div class="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
									<img
										src={item.menuItem.imageUrl}
										alt={item.menuItemName}
										class="h-full w-full object-cover"
									/>
								</div>
							{:else}
								<div
									class="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted"
								>
									<span class="text-xs text-muted-foreground">No image</span>
								</div>
							{/if}

							<div class="flex-1">
								<div class="flex justify-between">
									<div>
										<span class="font-medium">{item.quantity}x</span>
										{item.menuItemName}
									</div>
									<span class="font-medium">{formatCurrency(item.totalPrice)}</span>
								</div>
								{#if item.options && item.options.length > 0}
									<div class="mt-1 space-y-1 text-sm text-muted-foreground">
										{#each item.options as option}
											<div>+ {option.optionName} ({formatCurrency(option.price)})</div>
										{/each}
									</div>
								{/if}
								{#if item.specialInstructions}
									<div class="mt-1 text-xs text-muted-foreground">
										Note: {item.specialInstructions}
									</div>
								{/if}
							</div>
						</div>
					{/each}

					<div class="mt-4 flex justify-between border-t pt-4 text-lg font-medium">
						<span>Total</span>
						<span>{formatCurrency(order.total)}</span>
					</div>
				</div>
			</div>
			<!-- Actions -->
			{#if statusActions[order.status as OrderStatus]}
				<div class="rounded-lg border p-4">
					<h2 class="mb-4 font-semibold">Actions</h2>
					<div class="flex gap-2">
						{#each statusActions[order.status as OrderStatus] || [] as action}
							<Button
								variant={action.variant}
								class={action.class}
								onclick={() => handleStatusAction(action)}
								disabled={isUpdatingStatus}
							>
								{isUpdatingStatus ? 'Updating...' : action.label}
							</Button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
