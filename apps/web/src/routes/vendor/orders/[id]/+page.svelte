<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Phone, MapPin, AlertCircle, Clock } from 'lucide-svelte';
	import type { Order } from '../types';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';
	import { goto } from '$app/navigation';

	const order: Order = {
		id: '1',
		orderNumber: 'ORD-001',
		customerName: 'John Doe',
		customerPhone: '+234 123 456 7890',
		items: [
			{
				id: '1',
				name: 'Jollof Rice',
				quantity: 2,
				price: 15.99,
				options: [{ name: 'Extra Chicken', price: 5.99 }]
			},
			{
				id: '2',
				name: 'Suya',
				quantity: 1,
				price: 12.99
			}
		],
		status: 'preparing',
		total: 50.96,
		createdAt: new Date(),
		updatedAt: new Date(),
		estimatedReadyTime: new Date(),
		paymentStatus: 'paid',
		paymentMethod: 'card',
		deliveryAddress: '123 Main St, Lagos',
		deliveryInstructions: 'Ring doorbell twice'
	};

	type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
	type PaymentStatus = 'pending' | 'paid' | 'failed';

	const statusColors: Record<OrderStatus, string> = {
		new: 'default',
		preparing: 'warning',
		ready: 'success',
		completed: 'secondary',
		cancelled: 'destructive'
	} as const;

	const paymentStatusColors: Record<PaymentStatus, string> = {
		pending: 'warning',
		paid: 'success',
		failed: 'destructive'
	} as const;

	type StatusAction = {
		label: string;
		action: OrderStatus;
		variant: 'default' | 'outline';
		primary?: boolean;
		class?: string;
	};

	const statusActions: Partial<Record<OrderStatus, StatusAction[]>> = {
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
				class: 'text-destructive hover:bg-destructive hover:text-destructive-foreground'
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
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto('/vendor/orders')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold">Order #{order.orderNumber}</h1>
				<p class="text-sm text-muted-foreground">
					{formatDate(order.createdAt)} at {formatTime(order.createdAt)}
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
							<div class="font-medium">{order.customerName}</div>
							<div class="text-sm text-muted-foreground">{order.customerPhone}</div>
						</div>
						<Button variant="ghost" size="icon" class="h-8 w-8">
							<Phone class="h-4 w-4" />
						</Button>
					</div>
					{#if order.deliveryAddress}
						<div class="mt-4 rounded-md bg-muted/50 p-3 text-sm">
							<div class="flex gap-2">
								<MapPin class="h-4 w-4 shrink-0" />
								<span>{order.deliveryAddress}</span>
							</div>
							{#if order.deliveryInstructions}
								<div class="mt-2 flex gap-2 text-muted-foreground">
									<AlertCircle class="h-4 w-4 shrink-0" />
									<span>{order.deliveryInstructions}</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Order Timeline -->
			{#if order.estimatedReadyTime}
				<div class="rounded-lg border p-4">
					<h2 class="mb-4 font-semibold">Estimated Ready Time</h2>
					<div class="flex items-center gap-2 text-sm">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span>{formatTime(order.estimatedReadyTime)}</span>
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
						<div>
							<div class="flex justify-between">
								<div>
									<span class="font-medium">{item.quantity}x</span>
									{item.name}
								</div>
								<span class="font-medium">{formatCurrency(item.price * item.quantity)}</span>
							</div>
							{#if item.options && item.options.length > 0}
								<div class="ml-6 space-y-1 text-sm text-muted-foreground">
									{#each item.options as option}
										<div>+ {option.name} ({formatCurrency(option.price)})</div>
									{/each}
								</div>
							{/if}
							{#if item.specialInstructions}
								<div class="ml-6 mt-1 text-xs text-muted-foreground">
									Note: {item.specialInstructions}
								</div>
							{/if}
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
							<Button variant={action.variant} class={action.class} onclick={() => {}}>
								{action.label}
							</Button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
