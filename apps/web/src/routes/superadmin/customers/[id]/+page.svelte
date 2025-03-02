<script lang="ts">
	import { page } from '$app/stores';
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		User,
		MapPin,
		Phone,
		Mail,
		Clock,
		ShoppingBag,
		DollarSign,
		AlertTriangle,
		Calendar
	} from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';

	// Get customer ID from URL params
	const customerId = $page.params.id;

	// Mock customer data (in real app, fetch from adminState or API)
	const customer = {
		id: customerId,
		name: 'John Doe',
		email: 'john@example.com',
		phone: '+234 123 456 7890',
		address: '123 Main St, Lagos',
		totalOrders: 45,
		totalSpent: 1890.5,
		joinedDate: new Date('2023-01-01'),
		lastOrder: new Date('2024-02-01'),
		status: 'active',
		preferences: {
			notifications: {
				email: true,
				sms: true,
				push: false
			},
			dietary: ['Halal', 'No Pork'],
			favoriteVendors: [
				{
					id: 'VEN-001',
					name: 'Restaurant ABC',
					orders: 15
				},
				{
					id: 'VEN-002',
					name: 'Restaurant XYZ',
					orders: 10
				}
			]
		}
	};

	// Mock order history
	const orderHistory = [
		{
			id: 'ORD-001',
			vendorName: 'Restaurant ABC',
			items: [
				{ name: 'Jollof Rice', quantity: 2, price: 15.99 },
				{ name: 'Chicken Suya', quantity: 1, price: 12.99 }
			],
			total: 45.97,
			status: 'completed',
			createdAt: new Date('2024-02-01T10:00:00'),
			deliveryStatus: 'delivered'
		},
		{
			id: 'ORD-002',
			vendorName: 'Restaurant XYZ',
			items: [
				{ name: 'Egusi Soup', quantity: 1, price: 18.99 },
				{ name: 'Pounded Yam', quantity: 2, price: 8.99 }
			],
			total: 36.97,
			status: 'completed',
			createdAt: new Date('2024-01-30T15:00:00'),
			deliveryStatus: 'delivered'
		}
	];

	// Mock disputes
	const disputes = [
		{
			id: 'DSP-001',
			orderId: 'ORD-003',
			reason: 'Wrong order delivered',
			status: 'resolved',
			createdAt: new Date('2024-01-15'),
			resolution: 'Refund issued'
		}
	];

	let selectedTab = $state('overview');

	function getDisputeStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'pending':
				return 'destructive';
			case 'investigating':
				return 'secondary';
			case 'resolved':
				return 'default';
			default:
				return 'outline';
		}
	}

	function getOrderStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'completed':
				return 'default';
			case 'preparing':
				return 'secondary';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Customer Profile</h2>
			<p class="text-muted-foreground">View customer information and order history</p>
		</div>
		<div class="flex items-center gap-4">
			<Button variant="outline" onclick={() => history.back()}>Back</Button>
			{#if customer.status === 'active'}
				<Button variant="destructive">Block Customer</Button>
			{:else}
				<Button variant="default">Unblock Customer</Button>
			{/if}
		</div>
	</div>

	<!-- Customer Overview -->
	<div class="grid gap-6 md:grid-cols-[300px_1fr]">
		<Card class="p-6">
			<div class="space-y-6">
				<div class="flex flex-col items-center space-y-4">
					<div class="h-20 w-20 overflow-hidden rounded-full bg-muted">
						<img
							src="https://api.dicebear.com/7.x/avataaars/svg?seed={customer.name}"
							alt="{customer.name}'s avatar"
							class="h-full w-full"
						/>
					</div>
					<div class="text-center">
						<h3 class="font-semibold">{customer.name}</h3>
						<p class="text-sm text-muted-foreground">Customer ID: {customer.id}</p>
					</div>
					<Badge variant={customer.status === 'active' ? 'default' : 'destructive'}>
						{customer.status}
					</Badge>
				</div>

				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<MapPin class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{customer.address}</span>
					</div>
					<div class="flex items-center gap-2">
						<Phone class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{customer.phone}</span>
					</div>
					<div class="flex items-center gap-2">
						<Mail class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{customer.email}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">Joined {formatDate(customer.joinedDate)}</span>
					</div>
				</div>

				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Total Orders</span>
						<span class="font-medium">{customer.totalOrders}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Total Spent</span>
						<span class="font-medium">{formatCurrency(customer.totalSpent)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Last Order</span>
						<span class="font-medium">{formatDate(customer.lastOrder)}</span>
					</div>
				</div>
			</div>
		</Card>

		<div class="space-y-6">
			<Tabs.Root value={selectedTab} onValueChange={(v) => (selectedTab = v)}>
				<Tabs.List>
					<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
					<Tabs.Trigger value="orders">Order History</Tabs.Trigger>
					<Tabs.Trigger value="disputes">Disputes</Tabs.Trigger>
					<Tabs.Trigger value="preferences">Preferences</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>

			{#if selectedTab === 'overview'}
				<div class="grid gap-6">
					<!-- Favorite Vendors -->
					<Card class="p-6">
						<h3 class="mb-4 font-semibold">Favorite Vendors</h3>
						<div class="space-y-4">
							{#each customer.preferences.favoriteVendors as vendor}
								<div class="flex items-center justify-between rounded-lg border p-4">
									<div class="flex items-center gap-4">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
										>
											<Store class="h-6 w-6 text-primary" />
										</div>
										<div>
											<div class="font-medium">{vendor.name}</div>
											<div class="text-sm text-muted-foreground">{vendor.orders} orders</div>
										</div>
									</div>
									<Button variant="ghost" size="sm">View Vendor</Button>
								</div>
							{/each}
						</div>
					</Card>

					<!-- Recent Orders -->
					<Card class="p-6">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="font-semibold">Recent Orders</h3>
							<Button variant="ghost" size="sm">View All</Button>
						</div>
						<div class="rounded-lg border">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Order ID</Table.Head>
										<Table.Head>Vendor</Table.Head>
										<Table.Head>Status</Table.Head>
										<Table.Head>Date</Table.Head>
										<Table.Head class="text-right">Total</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each orderHistory as order}
										<Table.Row>
											<Table.Cell class="font-medium">{order.id}</Table.Cell>
											<Table.Cell>{order.vendorName}</Table.Cell>
											<Table.Cell>
												<Badge variant={getOrderStatusBadgeVariant(order.status)}>
													{order.status}
												</Badge>
											</Table.Cell>
											<Table.Cell>{formatTime(order.createdAt)}</Table.Cell>
											<Table.Cell class="text-right">{formatCurrency(order.total)}</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					</Card>
				</div>
			{:else if selectedTab === 'disputes'}
				<Card class="p-6">
					<h3 class="mb-4 font-semibold">Dispute History</h3>
					{#if disputes.length > 0}
						<div class="space-y-4">
							{#each disputes as dispute}
								<div class="flex items-center justify-between rounded-lg border p-4">
									<div>
										<div class="font-medium">Order {dispute.orderId}</div>
										<div class="text-sm text-muted-foreground">
											{dispute.reason}
											<br />
											{dispute.resolution}
										</div>
									</div>
									<div class="flex flex-col items-end gap-2">
										<Badge variant={getDisputeStatusBadgeVariant(dispute.status)}>
											{dispute.status}
										</Badge>
										<div class="text-sm text-muted-foreground">
											{formatDate(dispute.createdAt)}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="flex items-center justify-center rounded-lg border p-8 text-center">
							<div class="space-y-2">
								<AlertTriangle class="mx-auto h-8 w-8 text-muted-foreground" />
								<h4 class="font-medium">No Disputes</h4>
								<p class="text-sm text-muted-foreground">This customer has no dispute history.</p>
							</div>
						</div>
					{/if}
				</Card>
			{:else if selectedTab === 'preferences'}
				<Card class="p-6">
					<h3 class="mb-4 font-semibold">Customer Preferences</h3>
					<div class="space-y-6">
						<!-- Notification Preferences -->
						<div>
							<h4 class="mb-2 text-sm font-medium">Notification Preferences</h4>
							<div class="space-y-2">
								{#each Object.entries(customer.preferences.notifications) as [type, enabled]}
									<div class="flex items-center justify-between rounded-lg border p-3">
										<span class="capitalize">{type}</span>
										<Badge variant={enabled ? 'default' : 'secondary'}>
											{enabled ? 'Enabled' : 'Disabled'}
										</Badge>
									</div>
								{/each}
							</div>
						</div>

						<!-- Dietary Preferences -->
						<div>
							<h4 class="mb-2 text-sm font-medium">Dietary Preferences</h4>
							<div class="flex flex-wrap gap-2">
								{#each customer.preferences.dietary as preference}
									<Badge variant="secondary">{preference}</Badge>
								{/each}
							</div>
						</div>
					</div>
				</Card>
			{/if}
		</div>
	</div>
</div>
