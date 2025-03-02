<script lang="ts">
	import OrderTable from './order-table.svelte';
	import type { Order } from '../types';
	import * as Select from '$lib/components/ui/select';

	const { searchQuery } = $props();

	let selectedReason = $state<string>('all');

	let orders = $state<Order[]>([
		{
			id: '5',
			orderNumber: 'ORD-005',
			customerName: 'David Okonjo',
			customerPhone: '+234 123 456 7894',
			items: [
				{
					id: '6',
					name: 'Fried Rice Special',
					quantity: 3,
					price: 16.99,
					options: [{ name: 'Extra Chicken', price: 5.99 }]
				}
			],
			status: 'cancelled',
			total: 68.94,
			createdAt: new Date(Date.now() - 7200000), // 2 hours ago
			updatedAt: new Date(),
			paymentStatus: 'failed',
			paymentMethod: 'card',
			deliveryAddress: '202 Ikeja GRA, Lagos',
			deliveryInstructions: 'Office complex'
		}
	]);

	async function handleStatusChange(orderId: string, newStatus: Order['status']) {
		try {
			const response = await fetch(`/api/orders/${orderId}/status`, {
				method: 'PATCH',
				body: JSON.stringify({ status: newStatus }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) throw new Error('Failed to update order status');

			// Update local state
			orders = orders.map((order) =>
				order.id === orderId ? { ...order, status: newStatus } : order
			);
		} catch (error) {
			console.error('Error updating order status:', error);
			// TODO: Show error toast
		}
	}

	let filteredOrders = $derived(
		orders.filter((order) => {
			if (!searchQuery) return true;
			const searchLower = searchQuery.toLowerCase();
			return (
				order.orderNumber.toLowerCase().includes(searchLower) ||
				order.customerName.toLowerCase().includes(searchLower)
			);
		})
	);
</script>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<Select.Root bind:value={selectedReason}>
			<Select.Trigger class="w-[180px]">
				{selectedReason === 'all' ? 'All Reasons' : selectedReason}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">All Reasons</Select.Item>
				<Select.Item value="out_of_stock">Out of Stock</Select.Item>
				<Select.Item value="customer_request">Customer Request</Select.Item>
				<Select.Item value="payment_failed">Payment Failed</Select.Item>
				<Select.Item value="other">Other</Select.Item>
			</Select.Content>
		</Select.Root>
	</div>

	{#if filteredOrders.length === 0}
		<div class="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
			<div class="text-center">
				<h3 class="text-lg font-medium">No Cancelled Orders</h3>
				<p class="text-sm text-muted-foreground">
					{#if selectedReason !== 'all'}
						Try adjusting your filters
					{:else}
						Cancelled orders will appear here
					{/if}
				</p>
			</div>
		</div>
	{:else}
		<OrderTable orders={filteredOrders} onStatusChange={handleStatusChange} showActions={false} />
	{/if}
</div>
