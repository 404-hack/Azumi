<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import {
		Search,
		ShoppingBag,
		Store,
		User,
		Bike,
		MoreVertical,
		Clock,
		MapPin,
		AlertCircle
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatCurrency, formatDate, formatDateTime, formatTime } from '$lib/utils';
	interface Props {
		data: {
			orders: any[];
		};
	}
	let { data }: Props = $props();
	let searchQuery = $state('');
	let selectedTab = $state('all');
	let selectedDate = $state<string>('');

	let filteredOrders = $derived(
		data.orders.filter((order) => {
			const matchesSearch =
				!searchQuery ||
				order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesTab = selectedTab === 'all' || order.status === selectedTab;

			const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
			const matchesDate = !selectedDate || orderDate === selectedDate;

			return matchesSearch && matchesTab && matchesDate;
		})
	);
	function getOrderStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status.toUpperCase()) {
			case 'PAYMENT_CONFIRMED':
				return 'default'; // Blue
			case 'PREPARING':
				return 'secondary'; // Gray
			case 'READY':
				return 'outline'; // Green outline
			case 'RIDER_ASSIGNED':
				return 'default'; // Blue
			case 'PICKED_UP':
				return 'secondary'; // Orange
			case 'DELIVERED':
			case 'COMPLETED':
				return 'outline'; // Green
			case 'CANCELLED':
				return 'destructive'; // Red
			default:
				return 'outline';
		}
	}

	function getOrderStatusColor(status: string): string {
		switch (status.toUpperCase()) {
			case 'PAYMENT_CONFIRMED':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'PREPARING':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'READY':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'RIDER_ASSIGNED':
				return 'bg-indigo-100 text-indigo-800 border-indigo-200';
			case 'PICKED_UP':
				return 'bg-orange-100 text-orange-800 border-orange-200';
			case 'DELIVERED':
			case 'COMPLETED':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200';
			case 'CANCELLED':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function getDeliveryStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'pending':
				return 'outline';
			case 'assigned':
				return 'secondary';
			case 'picked_up':
				return 'default';
			case 'delivered':
				return 'default';
			case 'failed':
				return 'destructive';
			default:
				return 'outline';
		}
	} // Calculate real stats from order data
	const calculatedStats = $derived.by(() => {
		// Use all orders if no date filter is selected, otherwise filter by selected date
		const ordersToAnalyze = selectedDate
			? (data.orders || []).filter((order) => {
					const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
					return orderDate === selectedDate;
				})
			: data.orders || [];
		const totalOrders = ordersToAnalyze.length;
		const nonCanceledOrders = ordersToAnalyze.filter((order) => order.status !== 'CANCELLED');
		const totalRevenue = nonCanceledOrders.reduce((sum, order) => {
			const orderTotal = Number(order.total) || 0;
			return sum + orderTotal;
		}, 0);
		const averageOrderValue =
			nonCanceledOrders.length > 0 ? totalRevenue / nonCanceledOrders.length : 0;

		// Count completed orders (using the actual status from your data)
		const completedOrders = ordersToAnalyze.filter(
			(order) => order.status === 'COMPLETED' || order.status === 'DELIVERED'
		).length;
		const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

		// Count active deliveries (orders in progress)
		const activeDeliveries = ordersToAnalyze.filter((order) =>
			['PAYMENT_CONFIRMED', 'PREPARING', 'READY', 'RIDER_ASSIGNED', 'PICKED_UP'].includes(
				order.status
			)
		).length;

		// Calculate average delivery time for completed orders
		const completedOrdersWithTimes = ordersToAnalyze.filter(
			(order) =>
				(order.status === 'COMPLETED' || order.status === 'DELIVERED') &&
				order.createdAt &&
				order.deliveredAt
		);

		const totalDeliveryTime = completedOrdersWithTimes.reduce((sum, order) => {
			const created = new Date(order.createdAt);
			const delivered = new Date(order.deliveredAt);
			const timeDiff = delivered.getTime() - created.getTime();
			return sum + (timeDiff > 0 ? timeDiff : 0);
		}, 0);

		const averageDeliveryTime =
			completedOrdersWithTimes.length > 0
				? Math.round(totalDeliveryTime / completedOrdersWithTimes.length / (1000 * 60)) // Convert to minutes
				: 0;

		return {
			totalOrders,
			totalRevenue,
			averageOrderValue,
			completionRate: `${completionRate}%`,
			activeDeliveries,
			averageDeliveryTime
		};
	});

	// Remove the hardcoded todayStats
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold">Orders Management</h2>
			<p class="text-muted-foreground text-sm">
				{selectedDate ? `Statistics for ${selectedDate}` : 'All-time statistics'}
			</p>
		</div>
		<div class="flex items-center gap-4">
			<Button
				variant="outline"
				onclick={() => (selectedDate = '')}
				class={!selectedDate ? 'bg-primary text-primary-foreground' : ''}
			>
				All Dates
			</Button>
			<input
				type="date"
				bind:value={selectedDate}
				class="rounded-md border px-2 py-1 text-sm"
				placeholder="Filter by date"
			/>
		</div>
	</div>
	<!-- Stats Overview -->
	<div class="grid gap-4 md:grid-cols-6">
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Total Orders</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-blue-500" />
					<span class="text-2xl font-bold">{calculatedStats.totalOrders}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Revenue</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-green-500" />
					<span class="text-2xl font-bold">{formatCurrency(calculatedStats.totalRevenue)}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Avg. Order Value</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-purple-500" />
					<span class="text-2xl font-bold">{formatCurrency(calculatedStats.averageOrderValue)}</span
					>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Completion Rate</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-yellow-500" />
					<span class="text-2xl font-bold">{calculatedStats.completionRate}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Active Deliveries</span>
				<div class="flex items-center gap-2">
					<Bike class="h-4 w-4 text-orange-500" />
					<span class="text-2xl font-bold">{calculatedStats.activeDeliveries}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm font-medium">Avg. Delivery Time</span>
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4 text-red-500" />
					<span class="text-2xl font-bold">{calculatedStats.averageDeliveryTime}m</span>
				</div>
			</div>
		</Card>
	</div>

	<!-- Orders List -->
	<Card class="p-6">
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Tabs.Root value={selectedTab} class="w-[400px]" onValueChange={(v) => (selectedTab = v)}>
					<Tabs.List>
						<Tabs.Trigger value="all">All Orders</Tabs.Trigger>
						<Tabs.Trigger value="new">New</Tabs.Trigger>
						<Tabs.Trigger value="preparing">Preparing</Tabs.Trigger>
						<Tabs.Trigger value="ready">Ready</Tabs.Trigger>
						<Tabs.Trigger value="completed">Completed</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
				<div class="relative">
					<Search class="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
					<Input placeholder="Search orders..." class="pl-8" bind:value={searchQuery} />
				</div>
			</div>

			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Order Info</Table.Head>
							<Table.Head>Customer</Table.Head>
							<Table.Head>Vendor</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Delivery</Table.Head>
							<Table.Head>Total</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredOrders as order}
							<Table.Row
								class="hover:bg-muted/50 cursor-pointer"
								onclick={() => goto(`/superadmin/orders/${order.id}`)}
							>
								<Table.Cell>
									<div>
										<div class="font-medium">#{order.orderNumber}</div>
										<div class="text-muted-foreground text-sm">
											{formatDateTime(order.createdAt)}
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<User class="text-muted-foreground h-4 w-4" />
										<div>
											<div class="font-medium">{order.customer?.name || 'Unknown Customer'}</div>
											<div class="text-muted-foreground text-sm">
												{order.customer?.phoneNumber || order.customer?.email || 'No contact'}
											</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Store class="text-muted-foreground h-4 w-4" />
										<span>{order.shop?.name || 'Unknown Vendor'}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div
										class="focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 {getOrderStatusColor(
											order.status
										)}"
									>
										{order.status}
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if order.deliveryStatus}
										<Badge variant={getDeliveryStatusBadgeVariant(order.deliveryStatus)}>
											{order.deliveryStatus}
										</Badge>
										{#if order.riderName}
											<div class="text-muted-foreground mt-1 text-sm">
												{order.riderName}
											</div>
										{/if}
									{:else}
										<span class="text-muted-foreground text-sm">Not assigned</span>
									{/if}
								</Table.Cell>
								<Table.Cell>
									<div class="font-medium">{formatCurrency(order.total)}</div>
									<div class="text-muted-foreground text-sm">
										{order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="icon" onclick={(e) => e.stopPropagation()}>
												<MoreVertical class="h-4 w-4" />
												<span class="sr-only">Actions</span>
											</Button>
										</DropdownMenu.Trigger><DropdownMenu.Content align="end">
											<DropdownMenu.Item onclick={() => goto(`/superadmin/orders/${order.id}`)}
												>View Details</DropdownMenu.Item
											>
											<DropdownMenu.Item>Contact Customer</DropdownMenu.Item>
											<DropdownMenu.Item>Contact Vendor</DropdownMenu.Item>
											{#if order.riderName}
												<DropdownMenu.Item>Contact Rider</DropdownMenu.Item>
											{/if}
											<DropdownMenu.Separator />
											<DropdownMenu.Item class="text-red-600">Cancel Order</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	</Card>
</div>
