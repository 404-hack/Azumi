<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Eye, MoreVertical, Phone, ChevronDown, ChevronUp } from 'lucide-svelte';
	import type { Order } from '../types';
	import { formatCurrency, formatTime, formatDate } from '$lib/utils';
	import { goto } from '$app/navigation';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	let {
		orders,
		onStatusChange,
		showActions = true
	} = $props<{
		orders: Order[];
		onStatusChange: (orderId: string, status: string) => void;
		showActions?: boolean;
	}>();

	// Track expanded state for each order
	let expandedOrders = $state(new Set<string>());

	const statusColors = {
		new: 'default',
		preparing: 'warning',
		ready: 'success',
		completed: 'secondary',
		cancelled: 'destructive'
	} as const;

	const paymentStatusColors = {
		pending: 'warning',
		paid: 'success',
		failed: 'destructive'
	} as const;

	type OrderStatus = keyof typeof statusColors;
	type PaymentStatus = keyof typeof paymentStatusColors;

	const statusActions = {
		new: [
			{
				label: 'Start Preparing',
				action: 'preparing',
				variant: 'default',
				primary: true
			},
			{
				label: 'Reject',
				action: 'cancelled',
				variant: 'outline',
				customClass: 'text-destructive hover:bg-destructive hover:text-destructive-foreground'
			}
		],
		preparing: [
			{
				label: 'Mark Ready',
				action: 'ready',
				variant: 'default',
				primary: true
			}
		],
		ready: [
			{
				label: 'Complete Order',
				action: 'completed',
				variant: 'default',
				primary: true
			}
		]
	} as const;

	function viewOrderDetails(orderId: string) {
		goto(`/vendor/orders/${orderId}`);
	}

	function callCustomer(phone: string) {
		window.location.href = `tel:${phone}`;
	}

	function toggleExpand(orderId: string, e: Event) {
		e.stopPropagation();
		if (expandedOrders.has(orderId)) {
			expandedOrders.delete(orderId);
		} else {
			expandedOrders.add(orderId);
		}
		expandedOrders = expandedOrders; // Trigger reactivity
	}
</script>

<!-- Desktop View -->
<div class="hidden overflow-x-auto md:block">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-[100px]">Order #</Table.Head>
				<Table.Head>Time</Table.Head>
				<Table.Head>Customer</Table.Head>
				<Table.Head class="text-right">Total</Table.Head>
				<Table.Head>Status</Table.Head>
				<Table.Head class="w-[100px] text-right">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each orders as order}
				<Table.Row>
					<Table.Cell class="font-medium">#{order.orderNumber}</Table.Cell>
					<Table.Cell class="text-muted-foreground">
						{formatTime(order.createdAt)}
					</Table.Cell>
					<Table.Cell>
						<div class="flex flex-col">
							<span class="font-medium">{order.customerName}</span>
							<span class="text-xs text-muted-foreground">{order.customerPhone}</span>
						</div>
					</Table.Cell>
					<Table.Cell class="text-right font-medium">{formatCurrency(order.total)}</Table.Cell>
					<Table.Cell>
						<div class="flex gap-2">
							<Badge variant={statusColors[order.status as OrderStatus]}>{order.status}</Badge>
							<Badge variant={paymentStatusColors[order.paymentStatus as PaymentStatus]}>
								{order.paymentStatus}
							</Badge>
						</div>
					</Table.Cell>
					<Table.Cell class="text-right">
						<div class="flex justify-end gap-2">
							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8"
								onclick={() => viewOrderDetails(order.id)}
							>
								<Eye class="h-4 w-4" />
								<span class="sr-only">View details</span>
							</Button>
							{#if showActions && statusActions[order.status as keyof typeof statusActions]}
								<ResponsiveDropdown>
									{#snippet trigger()}
										<Button variant="ghost" size="icon" class="h-8 w-8">
											<MoreVertical class="h-4 w-4" />
											<span class="sr-only">Open menu</span>
										</Button>
									{/snippet}
									{#snippet children()}
										<DropdownMenu.Group>
											{#each statusActions[order.status as keyof typeof statusActions] as action}
												<DropdownMenu.Item
													onclick={() => onStatusChange(order.id, action.action)}
													class={action.customClass}
												>
													{action.label}
												</DropdownMenu.Item>
											{/each}
										</DropdownMenu.Group>
									{/snippet}
								</ResponsiveDropdown>
							{/if}
						</div>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<!-- Mobile View -->
<div class="space-y-3 md:hidden">
	{#each orders as order}
		<div
			class="rounded-lg border bg-card"
			on:click={() => viewOrderDetails(order.id)}
			role="button"
			tabindex="0"
		>
			<!-- Main Info -->
			<div class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<div class="text-sm font-medium">#{order.orderNumber}</div>
						<div class="text-xs text-muted-foreground">
							{formatTime(order.createdAt)}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<Badge variant={statusColors[order.status as OrderStatus]} class="w-fit">
							{order.status}
						</Badge>
						{#if showActions && statusActions[order.status as keyof typeof statusActions]}
							<ResponsiveDropdown>
								{#snippet trigger()}
									<Button
										variant="ghost"
										size="sm"
										class="h-8 w-8"
										onclick={(e) => e.stopPropagation()}
									>
										<MoreVertical class="h-4 w-4" />
									</Button>
								{/snippet}
								{#snippet children()}
									<DropdownMenu.Group>
										{#each statusActions[order.status as keyof typeof statusActions] as action}
											<DropdownMenu.Item
												onclick={(e) => {
													e.stopPropagation();
													onStatusChange(order.id, action.action);
												}}
												class={action.customClass}
											>
												{action.label}
											</DropdownMenu.Item>
										{/each}
									</DropdownMenu.Group>
								{/snippet}
							</ResponsiveDropdown>
						{/if}
					</div>
				</div>

				<!-- Customer and Total -->
				<div class="mt-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="font-medium">{order.customerName}</div>
						<Button
							variant="ghost"
							size="icon"
							class="h-7 w-7"
							onclick={(e) => {
								e.stopPropagation();
								callCustomer(order.customerPhone);
							}}
						>
							<Phone class="h-4 w-4" />
						</Button>
					</div>
					<div class="font-medium">{formatCurrency(order.total)}</div>
				</div>
			</div>

			<!-- Expandable Section -->
			<div
				class="flex cursor-pointer items-center justify-center border-t bg-muted/40 py-2"
				on:click={(e) => toggleExpand(order.id, e)}
				role="button"
				tabindex="0"
			>
				{#if expandedOrders.has(order.id)}
					<div class="flex items-center gap-1 text-xs text-muted-foreground">
						<span>Show less</span>
						<ChevronUp class="h-4 w-4" />
					</div>
				{:else}
					<div class="flex items-center gap-1 text-xs text-muted-foreground">
						<span>Show more</span>
						<ChevronDown class="h-4 w-4" />
					</div>
				{/if}
			</div>

			{#if expandedOrders.has(order.id)}
				<div class="border-t p-4 text-sm" on:click={(e) => e.stopPropagation()}>
					<!-- Additional Info -->
					<div class="space-y-3">
						<div>
							<div class="text-muted-foreground">Phone</div>
							<div>{order.customerPhone}</div>
						</div>
						{#if order.deliveryAddress}
							<div>
								<div class="text-muted-foreground">Delivery Address</div>
								<div>{order.deliveryAddress}</div>
								{#if order.deliveryInstructions}
									<div class="mt-1 text-xs text-muted-foreground">
										Note: {order.deliveryInstructions}
									</div>
								{/if}
							</div>
						{/if}
						<div>
							<div class="text-muted-foreground">Order Items</div>
							<div class="mt-1 space-y-2">
								{#each order.items as item}
									<div class="flex justify-between">
										<div>
											<span class="font-medium">{item.quantity}x</span>
											{item.name}
											{#if item.options && item.options.length > 0}
												<div class="ml-4 text-xs text-muted-foreground">
													{#each item.options as option}
														<div>+ {option.name} ({formatCurrency(option.price)})</div>
													{/each}
												</div>
											{/if}
										</div>
										<div class="text-right">{formatCurrency(item.price * item.quantity)}</div>
									</div>
								{/each}
							</div>
						</div>
						<div class="flex justify-between border-t pt-2 text-sm font-medium">
							<div>Payment Status</div>
							<Badge
								variant={paymentStatusColors[order.paymentStatus as PaymentStatus]}
								class="w-fit"
							>
								{order.paymentStatus}
							</Badge>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/each}
</div>
