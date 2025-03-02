<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import {
		TrendingUp,
		Users,
		ShoppingBag,
		Clock,
		ArrowUpRight,
		ArrowDownRight,
		Utensils
	} from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';

	// Sample data (replace with real data from your backend)
	const todayStats = {
		totalOrders: 45,
		totalRevenue: 158750,
		averageOrderValue: 3527.78,
		newCustomers: 12,
		preparationTime: 22, // minutes
		topSellingItems: [
			{ name: 'Jollof Rice', quantity: 28, revenue: 41972 },
			{ name: 'Suya Platter', quantity: 22, revenue: 35200 },
			{ name: 'Pounded Yam & Egusi', quantity: 18, revenue: 32400 }
		],
		ordersByStatus: [
			{ status: 'completed', count: 32 },
			{ status: 'cancelled', count: 3 },
			{ status: 'preparing', count: 6 },
			{ status: 'ready', count: 4 }
		],
		peakHours: [
			{ hour: '12:00', orders: 8 },
			{ hour: '13:00', orders: 12 },
			{ hour: '14:00', orders: 15 },
			{ hour: '15:00', orders: 10 }
		]
	};

	const comparisonStats = {
		revenue: { percentage: 12.5, increased: true },
		orders: { percentage: 8.2, increased: true },
		avgOrderValue: { percentage: 4.3, increased: true },
		preparationTime: { percentage: 5.1, increased: false }
	};
</script>

<div class="space-y-8">
	<div>
		<h2 class="text-3xl font-bold tracking-tight">Insights</h2>
		<p class="text-muted-foreground">Your restaurant's performance metrics and analytics.</p>
	</div>

	<!-- Key Metrics -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<!-- Revenue Card -->
		<Card class="p-6">
			<div class="flex items-center gap-2">
				<TrendingUp class="h-4 w-4 text-muted-foreground" />
				<span class="text-sm font-medium">Total Revenue</span>
				{#if comparisonStats.revenue.increased}
					<span class="ml-auto flex items-center text-sm text-green-600">
						<ArrowUpRight class="h-4 w-4" />
						{comparisonStats.revenue.percentage}%
					</span>
				{:else}
					<span class="ml-auto flex items-center text-sm text-red-600">
						<ArrowDownRight class="h-4 w-4" />
						{comparisonStats.revenue.percentage}%
					</span>
				{/if}
			</div>
			<div class="mt-2">
				<span class="text-2xl font-bold">{formatCurrency(todayStats.totalRevenue)}</span>
				<p class="text-xs text-muted-foreground">+₦{formatCurrency(2150)} from yesterday</p>
			</div>
		</Card>

		<!-- Orders Card -->
		<Card class="p-6">
			<div class="flex items-center gap-2">
				<ShoppingBag class="h-4 w-4 text-muted-foreground" />
				<span class="text-sm font-medium">Total Orders</span>
				{#if comparisonStats.orders.increased}
					<span class="ml-auto flex items-center text-sm text-green-600">
						<ArrowUpRight class="h-4 w-4" />
						{comparisonStats.orders.percentage}%
					</span>
				{:else}
					<span class="ml-auto flex items-center text-sm text-red-600">
						<ArrowDownRight class="h-4 w-4" />
						{comparisonStats.orders.percentage}%
					</span>
				{/if}
			</div>
			<div class="mt-2">
				<span class="text-2xl font-bold">{todayStats.totalOrders}</span>
				<p class="text-xs text-muted-foreground">+5 from yesterday</p>
			</div>
		</Card>

		<!-- Average Order Value -->
		<Card class="p-6">
			<div class="flex items-center gap-2">
				<Users class="h-4 w-4 text-muted-foreground" />
				<span class="text-sm font-medium">Avg. Order Value</span>
				{#if comparisonStats.avgOrderValue.increased}
					<span class="ml-auto flex items-center text-sm text-green-600">
						<ArrowUpRight class="h-4 w-4" />
						{comparisonStats.avgOrderValue.percentage}%
					</span>
				{:else}
					<span class="ml-auto flex items-center text-sm text-red-600">
						<ArrowDownRight class="h-4 w-4" />
						{comparisonStats.avgOrderValue.percentage}%
					</span>
				{/if}
			</div>
			<div class="mt-2">
				<span class="text-2xl font-bold">{formatCurrency(todayStats.averageOrderValue)}</span>
				<p class="text-xs text-muted-foreground">+₦{formatCurrency(125)} from yesterday</p>
			</div>
		</Card>

		<!-- Preparation Time -->
		<Card class="p-6">
			<div class="flex items-center gap-2">
				<Clock class="h-4 w-4 text-muted-foreground" />
				<span class="text-sm font-medium">Avg. Prep Time</span>
				{#if comparisonStats.preparationTime.increased}
					<span class="ml-auto flex items-center text-sm text-red-600">
						<ArrowUpRight class="h-4 w-4" />
						{comparisonStats.preparationTime.percentage}%
					</span>
				{:else}
					<span class="ml-auto flex items-center text-sm text-green-600">
						<ArrowDownRight class="h-4 w-4" />
						{comparisonStats.preparationTime.percentage}%
					</span>
				{/if}
			</div>
			<div class="mt-2">
				<span class="text-2xl font-bold">{todayStats.preparationTime} mins</span>
				<p class="text-xs text-muted-foreground">-2 mins from yesterday</p>
			</div>
		</Card>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<!-- Top Selling Items -->
		<Card class="col-span-4 p-6">
			<h3 class="flex items-center gap-2 font-semibold">
				<Utensils class="h-4 w-4" />
				Top Selling Items
			</h3>
			<div class="mt-4">
				<div class="space-y-4">
					{#each todayStats.topSellingItems as item}
						<div class="flex items-center">
							<div class="flex-1">
								<div class="font-medium">{item.name}</div>
								<div class="text-sm text-muted-foreground">{item.quantity} orders</div>
							</div>
							<div class="text-right">
								<div class="font-medium">{formatCurrency(item.revenue)}</div>
								<div class="text-sm text-muted-foreground">Revenue</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</Card>

		<!-- Order Status Distribution -->
		<Card class="col-span-3 p-6">
			<h3 class="flex items-center gap-2 font-semibold">
				<ShoppingBag class="h-4 w-4" />
				Order Status
			</h3>
			<div class="mt-4 space-y-4">
				{#each todayStats.ordersByStatus as status}
					<div class="flex items-center justify-between">
						<span class="capitalize">{status.status}</span>
						<div class="flex items-center gap-2">
							<div class="h-2 w-24 overflow-hidden rounded-full bg-secondary">
								<div
									class="h-full bg-primary"
									style="width: {(status.count / todayStats.totalOrders) * 100}%"
								/>
							</div>
							<span class="text-sm">{status.count}</span>
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Peak Hours -->
		<Card class="col-span-7 p-6">
			<h3 class="flex items-center gap-2 font-semibold">
				<Clock class="h-4 w-4" />
				Peak Hours
			</h3>
			<div class="mt-4">
				<div class="flex h-40 items-end gap-2">
					{#each todayStats.peakHours as hour}
						<div class="flex flex-1 flex-col items-center gap-2">
							<div
								class="w-full rounded-sm bg-primary"
								style="height: {(hour.orders /
									Math.max(...todayStats.peakHours.map((h) => h.orders))) *
									100}%"
							/>
							<span class="text-xs text-muted-foreground">{hour.hour}</span>
						</div>
					{/each}
				</div>
			</div>
		</Card>
	</div>
</div>
