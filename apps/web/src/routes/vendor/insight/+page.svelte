<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';

	// Sample data (replace with real data from your backend)
	const todayStats = {
		totalRevenue: 158750,
		totalOrders: 45,
		popularItems: [
			{ name: 'Jollof Rice', quantity: 28 },
			{ name: 'Suya Platter', quantity: 22 },
			{ name: 'Pounded Yam & Egusi', quantity: 18 }
		],
		orderStatus: {
			new: 5,
			preparing: 6,
			ready: 4,
			completed: 32,
			cancelled: 3
		}
	};

	let selectedDate = new Date().toISOString().split('T')[0];
</script>

<div class="space-y-6">
	<!-- Header with Date Selector -->
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold">Daily Summary</h2>
		<div class="flex items-center gap-2">
			<Calendar class="h-4 w-4 text-muted-foreground" />
			<input
				type="date"
				bind:value={selectedDate}
				class="rounded-md border px-3 py-1 text-sm"
				max={new Date().toISOString().split('T')[0]}
			/>
		</div>
	</div>

	<!-- Main Stats -->
	<div class="grid gap-4 md:grid-cols-2">
		<!-- Revenue Card -->
		<Card class="p-4">
			<h3 class="text-sm font-medium text-muted-foreground">Today's Revenue</h3>
			<div class="mt-2">
				<span class="text-2xl font-bold">₦{formatCurrency(todayStats.totalRevenue)}</span>
			</div>
		</Card>

		<!-- Orders Card -->
		<Card class="p-4">
			<h3 class="text-sm font-medium text-muted-foreground">Total Orders</h3>
			<div class="mt-2">
				<span class="text-2xl font-bold">{todayStats.totalOrders}</span>
			</div>
		</Card>
	</div>

	<!-- Order Status Overview -->
	<Card class="p-4">
		<h3 class="mb-4 font-medium">Order Status</h3>
		<div class="grid grid-cols-3 gap-4 md:grid-cols-5">
			<div class="text-center">
				<div class="text-2xl font-bold text-blue-600">{todayStats.orderStatus.new}</div>
				<div class="text-sm text-muted-foreground">New</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold text-yellow-600">{todayStats.orderStatus.preparing}</div>
				<div class="text-sm text-muted-foreground">Preparing</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold text-green-600">{todayStats.orderStatus.ready}</div>
				<div class="text-sm text-muted-foreground">Ready</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold text-slate-600">{todayStats.orderStatus.completed}</div>
				<div class="text-sm text-muted-foreground">Completed</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold text-red-600">{todayStats.orderStatus.cancelled}</div>
				<div class="text-sm text-muted-foreground">Cancelled</div>
			</div>
		</div>
	</Card>

	<!-- Popular Items -->
	<Card class="p-4">
		<h3 class="mb-4 font-medium">Most Ordered Items</h3>
		<div class="space-y-3">
			{#each todayStats.popularItems as item}
				<div class="flex items-center justify-between rounded-lg bg-muted/50 p-2">
					<span class="font-medium">{item.name}</span>
					<span class="text-muted-foreground">{item.quantity} orders</span>
				</div>
			{/each}
		</div>
	</Card>
</div>
