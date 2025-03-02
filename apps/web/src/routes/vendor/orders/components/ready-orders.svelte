<script lang="ts">
	import OrderTable from './order-table.svelte';
	import type { Order } from '../types';

	const { searchQuery } = $props();

	let orders = $state<Order[]>([
		{
			id: '3',
			orderNumber: 'ORD-003',
			customerName: 'Michael Chen',
			customerPhone: '+234 123 456 7892',
			items: [
				{
					id: '3',
					name: 'Suya Platter',
					quantity: 2,
					price: 18.99,
					options: [{ name: 'Extra Spice Mix', price: 1.99 }]
				},
				{
					id: '4',
					name: 'Chapman',
					quantity: 2,
					price: 4.99
				}
			],
			status: 'ready',
			total: 51.94,
			createdAt: new Date(),
			updatedAt: new Date(),
			estimatedReadyTime: new Date(),
			paymentStatus: 'paid',
			paymentMethod: 'mobile_money',
			deliveryAddress: '789 Victoria Island, Lagos',
			deliveryInstructions: 'Call upon arrival'
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
				<h3 class="text-lg font-medium">No Orders Ready for Pickup</h3>
				<p class="text-sm text-muted-foreground">Orders ready for pickup will appear here</p>
			</div>
		</div>
	{:else}
		<OrderTable orders={filteredOrders} onStatusChange={handleStatusChange} showActions={true} />
	{/if}
</div>
