<script lang="ts">
	import OrderTable from './order-table.svelte';

	let { searchQuery = '', orders = [] } = $props();

	async function handleStatusChange(orderId: string, newStatus: string) {
		try {
			const response = await fetch(`/api/vendor/orders/${orderId}/status`, {
				method: 'PATCH',
				body: JSON.stringify({ status: newStatus }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) throw new Error('Failed to update order status');
		} catch (error) {
			console.error('Error updating order status:', error);
		}
	}
	let filteredOrders = $derived(
		orders.filter((order) => {
			if (!searchQuery) return true;
			const searchLower = searchQuery.toLowerCase();
			return (
				order.code?.toLowerCase().includes(searchLower) ||
				order.customer?.name?.toLowerCase().includes(searchLower) ||
				order.customer?.phoneNumber?.includes(searchLower)
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
		<OrderTable
			orders={filteredOrders}
			{searchQuery}
			showActions={true}
			onStatusChange={handleStatusChange}
		/>
	{/if}
</div>
