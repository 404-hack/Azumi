<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Clock, Phone, MapPin, AlertCircle } from 'lucide-svelte';
	import type { Order } from '../types';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';

	let { order, onStatusChange, showActions = true } = $props();

	let statusColor = $derived(
		{
			new: 'default',
			preparing: 'warning',
			ready: 'success',
			completed: 'secondary',
			cancelled: 'destructive'
		}[order.status]
	);

	let paymentStatusColor = $derived(
		{
			pending: 'warning',
			paid: 'success',
			failed: 'destructive'
		}[order.paymentStatus]
	);

	// Simplified status change actions
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
	};
</script>

<Card.Root class="relative overflow-hidden">
	<!-- Status Badge - Always visible at the top right -->
	<div class="absolute right-4 top-4 flex gap-2">
		<Badge variant={statusColor}>{order.status}</Badge>
		<Badge variant={paymentStatusColor}>{order.paymentStatus}</Badge>
	</div>

	<Card.Header>
		<div class="space-y-1">
			<Card.Title class="flex items-center gap-2">
				Order #{order.orderNumber}
				{#if order.estimatedReadyTime}
					<div class="flex items-center gap-1 text-sm font-normal text-muted-foreground">
						<Clock class="h-4 w-4" />
						<span>Ready by {formatTime(order.estimatedReadyTime)}</span>
					</div>
				{/if}
			</Card.Title>
			<Card.Description
				>{formatDate(order.createdAt)} at {formatTime(order.createdAt)}</Card.Description
			>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		<!-- Customer Info - Simplified -->
		<div class="flex items-center justify-between">
			<div>
				<span class="font-medium">{order.customerName}</span>
				<div class="text-sm text-muted-foreground">{order.customerPhone}</div>
			</div>
			<Button variant="ghost" size="icon" class="h-8 w-8">
				<Phone class="h-4 w-4" />
			</Button>
		</div>

		<!-- Order Items - Simplified -->
		<div class="space-y-2">
			{#each order.items as item}
				<div class="flex justify-between text-sm">
					<div>
						<span class="font-medium">{item.quantity}x</span>
						{item.name}
					</div>
					<span class="font-medium">{formatCurrency(item.price * item.quantity)}</span>
				</div>
			{/each}
			<div class="flex justify-between border-t pt-2 font-medium">
				<span>Total</span>
				<span>{formatCurrency(order.total)}</span>
			</div>
		</div>

		<!-- Delivery Info - If exists -->
		{#if order.deliveryAddress}
			<div class="rounded-md bg-muted/50 p-2 text-sm">
				<div class="flex gap-2">
					<MapPin class="h-4 w-4 shrink-0" />
					<span>{order.deliveryAddress}</span>
				</div>
				{#if order.deliveryInstructions}
					<div class="mt-1 flex gap-2 text-muted-foreground">
						<AlertCircle class="h-4 w-4 shrink-0" />
						<span>{order.deliveryInstructions}</span>
					</div>
				{/if}
			</div>
		{/if}
	</Card.Content>

	<!-- Status Change Actions - Simplified -->
	{#if showActions && statusActions[order.status]}
		<Card.Footer class="flex justify-end gap-2">
			{#each statusActions[order.status] as action}
				<Button
					variant={action.variant}
					class={action.class}
					onclick={() => onStatusChange(order.id, action.action)}
				>
					{action.label}
				</Button>
			{/each}
		</Card.Footer>
	{/if}
</Card.Root>
