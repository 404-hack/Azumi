<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import {
		DollarSign,
		Store,
		Users,
		Bike,
		ShoppingBag,
		Clock,
		TrendingUp,
		ArrowUpRight,
		ArrowDownRight
	} from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';

	// Mock data for demonstration
	const recentOrders = [
		{
			id: 'ORD-001',
			customer: 'John Doe',
			vendor: 'Restaurant ABC',
			total: 45.99,
			status: 'completed',
			time: '10 mins ago'
		},
		{
			id: 'ORD-002',
			customer: 'Jane Smith',
			vendor: 'Restaurant XYZ',
			total: 32.5,
			status: 'preparing',
			time: '15 mins ago'
		}
	];

	const metrics = [
		{
			label: 'Revenue',
			value: 25789.5,
			change: 12.5,
			trend: 'up'
		},
		{
			label: 'Orders',
			value: 1254,
			change: 8.2,
			trend: 'up'
		},
		{
			label: 'Average Order Value',
			value: 42.3,
			change: -2.4,
			trend: 'down'
		}
	];
</script>

<div class="space-y-8">
	<!-- Overview Stats -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Total Revenue</span>
				<div class="flex items-center gap-2">
					<DollarSign class="h-4 w-4 text-green-500" />
					<span class="text-2xl font-bold">{formatCurrency(adminState.stats.totalRevenue)}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Total Orders</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-blue-500" />
					<span class="text-2xl font-bold">{adminState.stats.totalOrders}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Active Vendors</span>
				<div class="flex items-center gap-2">
					<Store class="h-4 w-4 text-purple-500" />
					<span class="text-2xl font-bold">{adminState.stats.totalVendors}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Active Riders</span>
				<div class="flex items-center gap-2">
					<Bike class="h-4 w-4 text-orange-500" />
					<span class="text-2xl font-bold">{adminState.stats.totalRiders}</span>
				</div>
			</div>
		</Card>
	</div>

	<!-- Key Metrics -->

	<!-- Recent Orders -->
	<Card class="p-6">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold">Recent Orders</h3>
			<Button variant="ghost" size="sm">View All</Button>
		</div>
		<div class="mt-6">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Order ID</Table.Head>
						<Table.Head>Customer</Table.Head>
						<Table.Head>Vendor</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">Total</Table.Head>
						<Table.Head class="text-right">Time</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each recentOrders as order}
						<Table.Row>
							<Table.Cell class="font-medium">{order.id}</Table.Cell>
							<Table.Cell>{order.customer}</Table.Cell>
							<Table.Cell>{order.vendor}</Table.Cell>
							<Table.Cell>
								<Badge variant={order.status === 'completed' ? 'success' : 'warning'}>
									{order.status}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right">{formatCurrency(order.total)}</Table.Cell>
							<Table.Cell class="text-right text-muted-foreground">{order.time}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</Card>

	<!-- Performance Overview -->
	<div class="grid gap-6 md:grid-cols-2">
		<!-- Active Deliveries -->
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold">Active Deliveries</h3>
				<Badge variant="outline">{adminState.stats.activeDeliveries}</Badge>
			</div>
			<div class="mt-4 flex items-center gap-4">
				<div>
					<div class="text-sm font-medium text-muted-foreground">Avg. Delivery Time</div>
					<div class="mt-1 flex items-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span class="text-xl font-semibold">
							{adminState.stats.averageDeliveryTime} mins
						</span>
					</div>
				</div>
			</div>
		</Card>

		<!-- Platform Revenue -->
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold">Platform Revenue</h3>
				<Badge variant="outline">{adminState.stats.platformCommission}%</Badge>
			</div>
			<div class="mt-4 flex items-center gap-4">
				<div>
					<div class="text-sm font-medium text-muted-foreground">Commission Today</div>
					<div class="mt-1 flex items-center gap-2">
						<TrendingUp class="h-4 w-4 text-green-500" />
						<span class="text-xl font-semibold">
							{formatCurrency(
								adminState.stats.totalRevenue * (adminState.stats.platformCommission / 100)
							)}
						</span>
					</div>
				</div>
			</div>
		</Card>
	</div>
</div>
