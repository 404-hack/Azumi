<script lang="ts">
	import { page } from '$app/stores';
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import {
		ShoppingBag,
		Store,
		User,
		Bike,
		Clock,
		MapPin,
		MessageCircle,
		Phone,
		Mail
	} from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';
	import type { Order } from '$lib/types/order';

	// Get order ID from URL params
	const orderId = $page.params.id;

	// Mock order data (in real app, fetch from adminState or API)
	const order: Order = {
		id: orderId,
		orderNumber: 'ORD-001',
		customerId: 'CUST-001',
		customerName: 'John Doe',
		customerPhone: '+234 123 456 7890',
		vendorId: 'VEN-001',
		vendorName: 'Restaurant ABC',
		items: [
			{
				id: 'ITEM-001',
				name: 'Jollof Rice',
				quantity: 2,
				price: 15.99,
				options: [{ name: 'Extra Spicy', price: 1.0 }]
			},
			{
				id: 'ITEM-002',
				name: 'Chicken Suya',
				quantity: 1,
				price: 12.99
			}
		],
		status: 'preparing',
		total: 45.97,
		subtotal: 44.97,
		deliveryFee: 5.0,
		platformFee: 2.5,
		tax: 3.5,
		createdAt: new Date(),
		updatedAt: new Date(),
		estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000),
		paymentStatus: 'paid',
		paymentMethod: 'card',
		deliveryAddress: '123 Main St, Lagos',
		deliveryInstructions: 'Please call upon arrival',
		riderId: 'RID-001',
		riderName: 'Mike Johnson',
		deliveryStatus: 'assigned'
	};

	function getOrderStatusBadgeVariant(
		status: Order['status']
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'new':
				return 'default';
			case 'preparing':
				return 'secondary';
			case 'ready':
				return 'default';
			case 'completed':
				return 'outline';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getDeliveryStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'pending':
				return 'outline';
			case 'assigned':
				return 'secondary';
			case 'picked_up':
				return 'default';
			case 'delivered':
				return 'default';
			case 'failed':
				return 'destructive';
			default:
				return 'outline';
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Order Details</h2>
			<p class="text-muted-foreground">Order #{order.orderNumber}</p>
		</div>
		<div class="flex items-center gap-4">
			<Button variant="outline" onclick={() => history.back()}>Back</Button>
			{#if order.status !== 'completed' && order.status !== 'cancelled'}
				<Button variant="destructive">Cancel Order</Button>
			{/if}
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Order Status -->
		<Card class="p-6">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold">Order Status</h3>
					<Badge variant={getOrderStatusBadgeVariant(order.status)}>{order.status}</Badge>
				</div>
				<div class="grid gap-4">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Created</span>
						<span>{formatTime(order.createdAt)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Estimated Ready Time</span>
						<span>{order.estimatedReadyTime ? formatTime(order.estimatedReadyTime) : 'N/A'}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Payment Status</span>
						<Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
							{order.paymentStatus}
						</Badge>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Payment Method</span>
						<span class="capitalize">{order.paymentMethod}</span>
					</div>
				</div>
			</div>
		</Card>

		<!-- Delivery Status -->
		<Card class="p-6">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold">Delivery Status</h3>
					{#if order.deliveryStatus}
						<Badge variant={getDeliveryStatusBadgeVariant(order.deliveryStatus)}>
							{order.deliveryStatus}
						</Badge>
					{:else}
						<Badge variant="outline">Not Assigned</Badge>
					{/if}
				</div>
				<div class="grid gap-4">
					<div class="flex items-center gap-2">
						<MapPin class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{order.deliveryAddress}</span>
					</div>
					{#if order.deliveryInstructions}
						<div class="flex items-center gap-2">
							<MessageCircle class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm">{order.deliveryInstructions}</span>
						</div>
					{/if}
					{#if order.riderName}
						<div class="mt-2 rounded-lg border p-4">
							<div class="mb-2 font-medium">Assigned Rider</div>
							<div class="flex items-center gap-4">
								<div class="h-10 w-10 overflow-hidden rounded-full bg-muted">
									<img
										src="https://api.dicebear.com/7.x/avataaars/svg?seed={order.riderName}"
										alt="{order.riderName}'s avatar"
										class="h-full w-full"
									/>
								</div>
								<div>
									<div class="font-medium">{order.riderName}</div>
									<div class="text-sm text-muted-foreground">ID: {order.riderId}</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</Card>
	</div>

	<div class="grid gap-6 md:grid-cols-3">
		<!-- Customer Info -->
		<Card class="p-6">
			<div class="space-y-4">
				<h3 class="font-semibold">Customer</h3>
				<div class="flex items-center gap-4">
					<div class="h-10 w-10 overflow-hidden rounded-full bg-muted">
						<img
							src="https://api.dicebear.com/7.x/avataaars/svg?seed={order.customerName}"
							alt="{order.customerName}'s avatar"
							class="h-full w-full"
						/>
					</div>
					<div>
						<div class="font-medium">{order.customerName}</div>
						<div class="text-sm text-muted-foreground">ID: {order.customerId}</div>
					</div>
				</div>
				<div class="grid gap-2">
					<Button variant="outline" class="w-full">
						<Phone class="mr-2 h-4 w-4" />
						{order.customerPhone}
					</Button>
				</div>
			</div>
		</Card>

		<!-- Vendor Info -->
		<Card class="p-6">
			<div class="space-y-4">
				<h3 class="font-semibold">Vendor</h3>
				<div class="flex items-center gap-4">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Store class="h-6 w-6 text-primary" />
					</div>
					<div>
						<div class="font-medium">{order.vendorName}</div>
						<div class="text-sm text-muted-foreground">ID: {order.vendorId}</div>
					</div>
				</div>
				<div class="grid gap-2">
					<Button variant="outline" class="w-full">Contact Vendor</Button>
				</div>
			</div>
		</Card>

		<!-- Order Summary -->
		<Card class="p-6">
			<div class="space-y-4">
				<h3 class="font-semibold">Order Summary</h3>
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Subtotal</span>
						<span>{formatCurrency(order.subtotal)}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Delivery Fee</span>
						<span>{formatCurrency(order.deliveryFee)}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Platform Fee</span>
						<span>{formatCurrency(order.platformFee)}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Tax</span>
						<span>{formatCurrency(order.tax)}</span>
					</div>
					<div class="border-t pt-2">
						<div class="flex items-center justify-between font-medium">
							<span>Total</span>
							<span>{formatCurrency(order.total)}</span>
						</div>
					</div>
				</div>
			</div>
		</Card>
	</div>

	<!-- Order Items -->
	<Card class="p-6">
		<div class="space-y-4">
			<h3 class="font-semibold">Order Items</h3>
			<div class="rounded-lg border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Item</Table.Head>
							<Table.Head>Quantity</Table.Head>
							<Table.Head>Options</Table.Head>
							<Table.Head class="text-right">Price</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each order.items as item}
							<Table.Row>
								<Table.Cell>
									<div class="font-medium">{item.name}</div>
									{#if item.specialInstructions}
										<div class="text-sm text-muted-foreground">{item.specialInstructions}</div>
									{/if}
								</Table.Cell>
								<Table.Cell>{item.quantity}</Table.Cell>
								<Table.Cell>
									{#if item.options && item.options.length > 0}
										<div class="space-y-1">
											{#each item.options as option}
												<div class="text-sm">
													{option.name} (+{formatCurrency(option.price)})
												</div>
											{/each}
										</div>
									{:else}
										<span class="text-sm text-muted-foreground">No options</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									{formatCurrency(item.price * item.quantity)}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	</Card>
</div>
