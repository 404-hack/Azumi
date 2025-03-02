<script lang="ts">
	import OrderTable from './order-table.svelte';
	import type { Order } from '../types';

	const { searchQuery } = $props();

	let orders = $state<Order[]>([
		{
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
					options: [
						{ name: 'Extra Spicy', price: 0 },
						{ name: 'Extra Chicken', price: 5.99 }
					],
					specialInstructions: 'Make it very spicy please'
				}
			],
			status: 'new',
			total: 37.97,
			createdAt: new Date(),
			updatedAt: new Date(),
			paymentStatus: 'paid',
			paymentMethod: 'card',
			deliveryAddress: '123 Main St, Lagos',
			deliveryInstructions: 'Call when you arrive'
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
				<h3 class="text-lg font-medium">No New Orders</h3>
				<p class="text-sm text-muted-foreground">New orders will appear here</p>
			</div>
		</div>
	{:else}
		<OrderTable orders={filteredOrders} onStatusChange={handleStatusChange} showActions={true} />
	{/if}
</div>
