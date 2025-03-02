<script lang="ts">
	import OrderTable from './order-table.svelte';
	import type { Order } from '../types';

	const { searchQuery } = $props();

	let orders = $state<Order[]>([
		{
			id: '2',
			orderNumber: 'ORD-002',
			customerName: 'Sarah Johnson',
			customerPhone: '+234 123 456 7891',
			items: [
				{
					id: '2',
					name: 'Egusi Soup with Pounded Yam',
					quantity: 1,
					price: 25.99,
					options: [{ name: 'Extra Meat', price: 7.99 }],
					specialInstructions: 'Extra pepper please'
				}
			],
			status: 'preparing',
			total: 33.98,
			createdAt: new Date(),
			updatedAt: new Date(),
			estimatedReadyTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
			paymentStatus: 'paid',
			paymentMethod: 'card',
			deliveryAddress: '456 Park Ave, Lagos',
			deliveryInstructions: 'Building with blue gate'
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
	{#if filteredOrders.length === 0}
		<div class="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
			<div class="text-center">
				<h3 class="text-lg font-medium">No Orders in Preparation</h3>
				<p class="text-sm text-muted-foreground">Orders being prepared will appear here</p>
			</div>
		</div>
	{:else}
		<OrderTable orders={filteredOrders} onStatusChange={handleStatusChange} showActions={true} />
	{/if}
</div>
