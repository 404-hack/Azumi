<script lang="ts">
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
		RefreshCw
	} from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function getStatusBadgeVariant(status: string) {
		switch (status.toLowerCase()) {
			case 'completed':
			case 'delivered':
				return 'default';
			case 'preparing':
			case 'confirmed':
				return 'secondary';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	}
</script>

<div class="space-y-8">	<!-- Overview Stats -->
	<div class="grid gap-4 md:grid-cols-5">
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Total Revenue</span>
				<div class="flex items-center gap-2">
					<DollarSign class="h-4 w-4 text-green-500" />
					<span class="text-2xl font-bold">{formatCurrency(data.stats.totalRevenue)}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Total Orders</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-blue-500" />
					<span class="text-2xl font-bold">{data.stats.totalOrders}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Total Customers</span>
				<div class="flex items-center gap-2">
					<Users class="h-4 w-4 text-teal-500" />
					<span class="text-2xl font-bold">{data.stats.totalCustomers}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Active Vendors</span>
				<div class="flex items-center gap-2">
					<Store class="h-4 w-4 text-purple-500" />
					<span class="text-2xl font-bold">{data.stats.totalVendors}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Active Riders</span>
				<div class="flex items-center gap-2">
					<Bike class="h-4 w-4 text-orange-500" />
					<span class="text-2xl font-bold">{data.stats.totalRiders}</span>
				</div>
			</div>
		</Card>
	</div>

	<!-- Recent Orders -->
	<Card class="p-6">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold">Recent Orders</h3>
			<Button variant="ghost" size="sm" onclick={invalidateAll}>
				<RefreshCw class="h-4 w-4" />
				Refresh
			</Button>
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
					{#each data.recentOrders as order}
						<Table.Row>
							<Table.Cell class="font-medium">{order.orderCode}</Table.Cell>
							<Table.Cell>{order.customer}</Table.Cell>
							<Table.Cell>{order.vendor}</Table.Cell>
							<Table.Cell>
								<Badge variant={getStatusBadgeVariant(order.status)}>
									{order.status}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right">{formatCurrency(order.total)}</Table.Cell>
							<Table.Cell class="text-muted-foreground text-right">{order.time}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</Card>

	<!-- Performance Overview -->
	<div class="grid gap-6 md:grid-cols-2">
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold">Active Deliveries</h3>
				<Badge variant="outline">{data.stats.activeDeliveries}</Badge>
			</div>
			<div class="mt-4 flex items-center gap-4">
				<div>
					<div class="text-muted-foreground text-sm font-medium">Avg. Delivery Time</div>
					<div class="mt-1 flex items-center gap-2">
						<Clock class="text-muted-foreground h-4 w-4" />
						<span class="text-xl font-semibold">
							{data.stats.averageDeliveryTime} mins
						</span>
					</div>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold">Platform Revenue</h3>
				<Badge variant="outline">{data.stats.platformCommission}%</Badge>
			</div>
			<div class="mt-4 flex items-center gap-4">
				<div>
					<div class="text-muted-foreground text-sm font-medium">Commission Total</div>
					<div class="mt-1 flex items-center gap-2">
						<TrendingUp class="h-4 w-4 text-green-500" />
						<span class="text-xl font-semibold">
							{formatCurrency(data.stats.totalRevenue * (data.stats.platformCommission / 100))}
						</span>
					</div>
				</div>
			</div>
		</Card>
	</div>
</div>
