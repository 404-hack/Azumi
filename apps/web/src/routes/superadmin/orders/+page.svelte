<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
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
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';
	import type { Order } from '$lib/types/order';

	let searchQuery = $state('');
	let selectedTab = $state('all');
	let selectedDate = $state<string>(new Date().toISOString().split('T')[0]);

	let filteredOrders = $derived(
		adminState.activeOrders.filter((order) => {
			const matchesSearch =
				order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTab = selectedTab === 'all' || order.status === selectedTab;
			const matchesDate = new Date(order.createdAt).toISOString().split('T')[0] === selectedDate;
			return matchesSearch && matchesTab && matchesDate;
		})
	);

	function getOrderStatusBadgeVariant(
		status: Order['status']
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'new':
				return 'default';
			case 'preparing':
				return 'secondary';
			case 'ready':
				return 'default';
			case 'completed':
				return 'outline';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
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
	}

	// Stats for today
	const todayStats = {
		totalOrders: 156,
		totalRevenue: 4589.5,
		averageOrderValue: 29.42,
		completionRate: '94%',
		activeDeliveries: 12,
		averageDeliveryTime: 28 // minutes
	};
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Orders Management</h2>
		<div class="flex items-center gap-4">
			<input type="date" bind:value={selectedDate} class="rounded-md border px-2 py-1 text-sm" />
		</div>
	</div>

	<!-- Stats Overview -->
	<div class="grid gap-4 md:grid-cols-6">
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Total Orders</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-blue-500" />
					<span class="text-2xl font-bold">{todayStats.totalOrders}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Revenue</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-green-500" />
					<span class="text-2xl font-bold">{formatCurrency(todayStats.totalRevenue)}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Avg. Order Value</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-purple-500" />
					<span class="text-2xl font-bold">{formatCurrency(todayStats.averageOrderValue)}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Completion Rate</span>
				<div class="flex items-center gap-2">
					<ShoppingBag class="h-4 w-4 text-yellow-500" />
					<span class="text-2xl font-bold">{todayStats.completionRate}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Active Deliveries</span>
				<div class="flex items-center gap-2">
					<Bike class="h-4 w-4 text-orange-500" />
					<span class="text-2xl font-bold">{todayStats.activeDeliveries}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Avg. Delivery Time</span>
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4 text-red-500" />
					<span class="text-2xl font-bold">{todayStats.averageDeliveryTime}m</span>
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
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
							<Table.Row>
								<Table.Cell>
									<div>
										<div class="font-medium">#{order.orderNumber}</div>
										<div class="text-sm text-muted-foreground">
											{formatTime(order.createdAt)}
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<User class="h-4 w-4 text-muted-foreground" />
										<div>
											<div class="font-medium">{order.customerName}</div>
											<div class="text-sm text-muted-foreground">{order.customerPhone}</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Store class="h-4 w-4 text-muted-foreground" />
										<span>{order.vendorName}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getOrderStatusBadgeVariant(order.status)}>
										{order.status}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									{#if order.deliveryStatus}
										<Badge variant={getDeliveryStatusBadgeVariant(order.deliveryStatus)}>
											{order.deliveryStatus}
										</Badge>
										{#if order.riderName}
											<div class="mt-1 text-sm text-muted-foreground">
												{order.riderName}
											</div>
										{/if}
									{:else}
										<span class="text-sm text-muted-foreground">Not assigned</span>
									{/if}
								</Table.Cell>
								<Table.Cell>
									<div class="font-medium">{formatCurrency(order.total)}</div>
									<div class="text-sm text-muted-foreground">
										{order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="icon">
												<MoreVertical class="h-4 w-4" />
												<span class="sr-only">Actions</span>
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item>View Details</DropdownMenu.Item>
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
