<script lang="ts">
	import OrderTable from './order-table.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Calendar } from 'lucide-svelte';

	let { searchQuery = '', orders = [] } = $props();

	let selectedDate = $state<string>(new Date().toISOString().split('T')[0]);
	let selectedTimeRange = $state<string>('all');

	const timeRanges = [
		{ value: 'all', label: 'All Time' },
		{ value: 'today', label: 'Today' },
		{ value: 'yesterday', label: 'Yesterday' },
		{ value: 'this-week', label: 'This Week' },
		{ value: 'this-month', label: 'This Month' }
	];

	function isInTimeRange(date: Date, range: string): boolean {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const thisWeek = new Date(today);
		thisWeek.setDate(thisWeek.getDate() - today.getDay());
		const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

		switch (range) {
			case 'today':
				return date >= today;
			case 'yesterday':
				return date >= yesterday && date < today;
			case 'this-week':
				return date >= thisWeek;
			case 'this-month':
				return date >= thisMonth;
			default:
				return true;
		}
	}
	let filteredOrders = $derived(
		orders.filter((order) => {
			if (!searchQuery) return true;
			const searchLower = searchQuery.toLowerCase();
			const matchesSearch =
				order.code?.toLowerCase().includes(searchLower) ||
				order.customer?.name?.toLowerCase().includes(searchLower) ||
				order.customer?.phoneNumber?.includes(searchLower);

			const orderDate = new Date(order.createdAt);
			const matchesDate = !selectedDate || orderDate.toISOString().split('T')[0] === selectedDate;

			const matchesTimeRange = isInTimeRange(orderDate, selectedTimeRange);

			return matchesSearch && matchesDate && matchesTimeRange;
		})
	);
	let totalRevenue = $derived(filteredOrders.reduce((sum, order) => sum + order.total, 0));

	let averageOrderValue = $derived(
		filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0
	);
</script>

<div class="space-y-6">
	<div class="flex flex-wrap gap-4">
		<div class="flex items-center gap-2">
			<Calendar class="h-4 w-4 text-muted-foreground" />
			<input type="date" bind:value={selectedDate} class="rounded-md border px-3 py-2 text-sm" />
		</div>
		<Select.Root bind:value={selectedTimeRange}>
			<Select.Trigger class="w-[180px]">
				{timeRanges.find((r) => r.value === selectedTimeRange)?.label || 'Select time range'}
			</Select.Trigger>
			<Select.Content>
				{#each timeRanges as range}
					<Select.Item value={range.value}>{range.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		<div class="rounded-lg border p-4">
			<h3 class="text-sm font-medium text-muted-foreground">Total Revenue</h3>
			<p class="mt-2 text-2xl font-bold">₦{totalRevenue.toFixed(2)}</p>
		</div>
		<div class="rounded-lg border p-4">
			<h3 class="text-sm font-medium text-muted-foreground">Average Order Value</h3>
			<p class="mt-2 text-2xl font-bold">₦{averageOrderValue.toFixed(2)}</p>
		</div>
	</div>

	{#if filteredOrders.length === 0}
		<div class="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
			<div class="text-center">
				<h3 class="text-lg font-medium">No Completed Orders</h3>
				<p class="text-sm text-muted-foreground">
					{#if selectedDate || selectedTimeRange !== 'all'}
						Try adjusting your filters
					{:else}
						Completed orders will appear here
					{/if}
				</p>
			</div>
		</div>
	{:else}
		<OrderTable orders={filteredOrders} {searchQuery} showActions={false} />
	{/if}
</div>
