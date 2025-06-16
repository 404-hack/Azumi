<script lang="ts">
	import OrderCard from './order-card.svelte';
	import OrderTable from './order-table.svelte';
	import { client } from '$lib/hc';

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

	let { searchQuery = '', orders = [] } = $props();
	let isUpdatingStatus = $state(false);

	async function handleStatusChange(orderId: string, newStatus: string) {
		if (isUpdatingStatus) return;

		try {
			isUpdatingStatus = true;
			const response = await client.order[':id'].status.$patch({
				param: { id: orderId },
				json: { status: newStatus as OrderStatus }
			});

			if (!response.ok) {
				const errorData = await response.json();
				const errorMessage =
					'error' in errorData ? errorData.error : 'Failed to update order status';
				throw new Error(errorMessage);
			}

			const orderIndex = orders.findIndex((order) => order.id === orderId);
			if (orderIndex !== -1) {
				orders[orderIndex] = { ...orders[orderIndex], status: newStatus };
			}

			console.log(`Order status updated to ${newStatus}`);
		} catch (error) {
			console.error('Error updating order status:', error);
		} finally {
			isUpdatingStatus = false;
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

<div class="w-full">
	{#if filteredOrders.length === 0}
		<div class="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
			<div class="text-center">
				<h3 class="text-lg font-medium">No New Orders</h3>
				<p class="text-muted-foreground text-sm">New orders will appear here</p>
			</div>
		</div>
	{:else}
		<!-- Mobile: Card Layout (default) -->
		<div class="block lg:hidden">
			<div class="grid gap-4 sm:gap-6">
				{#each filteredOrders as order}
					<OrderCard
						{order}
						onStatusChange={handleStatusChange}
						showBreakdown={true}
						isUpdating={isUpdatingStatus}
					/>
				{/each}
			</div>
		</div>
		<!-- Desktop: Table Layout -->
		<div class="hidden lg:block">
			<OrderTable
				orders={filteredOrders}
				{searchQuery}
				showActions={true}
				onStatusChange={handleStatusChange}
				isUpdating={isUpdatingStatus}
			/>
		</div>
	{/if}
</div>
