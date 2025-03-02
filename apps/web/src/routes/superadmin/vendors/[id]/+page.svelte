<script lang="ts">
	import { page } from '$app/stores';
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		Store,
		MapPin,
		Phone,
		Mail,
		Clock,
		Star,
		ShoppingBag,
		DollarSign,
		AlertTriangle
	} from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';

	// Get vendor ID from URL params
	const vendorId = $page.params.id;

	// Mock vendor data (in real app, fetch from adminState or API)
	const vendor = {
		id: vendorId,
		name: 'Restaurant ABC',
		description: 'Authentic African cuisine with a modern twist',
		email: 'contact@restaurantabc.com',
		phone: '+234 123 456 7890',
		address: '123 Main St, Lagos',
		category: 'Restaurant',
		rating: 4.5,
		totalOrders: 1250,
		totalRevenue: 45890.5,
		isActive: true,
		joinedDate: new Date('2023-01-01'),
		lastActive: new Date(),
		operatingHours: {
			monday: { open: '09:00', close: '22:00' },
			tuesday: { open: '09:00', close: '22:00' },
			wednesday: { open: '09:00', close: '22:00' },
			thursday: { open: '09:00', close: '22:00' },
			friday: { open: '09:00', close: '23:00' },
			saturday: { open: '10:00', close: '23:00' },
			sunday: { open: '10:00', close: '22:00' }
		},
		bankInfo: {
			bankName: 'First Bank',
			accountNumber: '****1234',
			accountName: 'Restaurant ABC Ltd'
		},
		documents: [
			{
				type: 'Business Registration',
				status: 'verified',
				expiryDate: new Date('2025-01-01')
			},
			{
				type: 'Food Safety Certificate',
				status: 'verified',
				expiryDate: new Date('2024-12-31')
			}
		]
	};

	// Mock recent orders
	const recentOrders = [
		{
			id: 'ORD-001',
			customerName: 'John Doe',
			total: 45.99,
			status: 'completed',
			createdAt: new Date('2024-02-01T10:00:00')
		},
		{
			id: 'ORD-002',
			customerName: 'Jane Smith',
			total: 32.5,
			status: 'preparing',
			createdAt: new Date('2024-02-01T11:00:00')
		}
	];

	let selectedTab = $state('overview');

	function getDocumentStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'verified':
				return 'default';
			case 'pending':
				return 'secondary';
			case 'expired':
				return 'destructive';
			default:
				return 'outline';
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Vendor Profile</h2>
			<p class="text-muted-foreground">Manage vendor information and performance</p>
		</div>
		<div class="flex items-center gap-4">
			<Button variant="outline" onclick={() => history.back()}>Back</Button>
			{#if vendor.isActive}
				<Button variant="destructive">Suspend Vendor</Button>
			{:else}
				<Button variant="default">Activate Vendor</Button>
			{/if}
		</div>
	</div>

	<!-- Vendor Overview -->
	<div class="grid gap-6 md:grid-cols-[300px_1fr]">
		<Card class="p-6">
			<div class="space-y-6">
				<div class="flex flex-col items-center space-y-4">
					<div class="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
						<Store class="h-10 w-10 text-primary" />
					</div>
					<div class="text-center">
						<h3 class="font-semibold">{vendor.name}</h3>
						<p class="text-sm text-muted-foreground">{vendor.category}</p>
					</div>
					<Badge variant={vendor.isActive ? 'default' : 'secondary'}>
						{vendor.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</div>

				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<MapPin class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{vendor.address}</span>
					</div>
					<div class="flex items-center gap-2">
						<Phone class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{vendor.phone}</span>
					</div>
					<div class="flex items-center gap-2">
						<Mail class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{vendor.email}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">Joined {formatDate(vendor.joinedDate)}</span>
					</div>
				</div>

				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Rating</span>
						<div class="flex items-center gap-1">
							<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
							<span class="font-medium">{vendor.rating.toFixed(1)}</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Total Orders</span>
						<span class="font-medium">{vendor.totalOrders}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Total Revenue</span>
						<span class="font-medium">{formatCurrency(vendor.totalRevenue)}</span>
					</div>
				</div>
			</div>
		</Card>

		<div class="space-y-6">
			<Tabs.Root value={selectedTab} onValueChange={(v) => (selectedTab = v)}>
				<Tabs.List>
					<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
					<Tabs.Trigger value="orders">Orders</Tabs.Trigger>
					<Tabs.Trigger value="documents">Documents</Tabs.Trigger>
					<Tabs.Trigger value="banking">Banking</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>

			{#if selectedTab === 'overview'}
				<div class="grid gap-6">
					<!-- Operating Hours -->
					<Card class="p-6">
						<h3 class="mb-4 font-semibold">Operating Hours</h3>
						<div class="grid gap-2">
							{#each Object.entries(vendor.operatingHours) as [day, hours]}
								<div class="flex items-center justify-between">
									<span class="capitalize">{day}</span>
									<span class="text-sm">
										{hours.open} - {hours.close}
									</span>
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
										<Table.Head>Customer</Table.Head>
										<Table.Head>Status</Table.Head>
										<Table.Head>Time</Table.Head>
										<Table.Head class="text-right">Total</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each recentOrders as order}
										<Table.Row>
											<Table.Cell class="font-medium">{order.id}</Table.Cell>
											<Table.Cell>{order.customerName}</Table.Cell>
											<Table.Cell>
												<Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
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
			{:else if selectedTab === 'documents'}
				<Card class="p-6">
					<h3 class="mb-4 font-semibold">Business Documents</h3>
					<div class="space-y-4">
						{#each vendor.documents as doc}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div>
									<div class="font-medium">{doc.type}</div>
									<div class="text-sm text-muted-foreground">
										Expires: {formatDate(doc.expiryDate)}
									</div>
								</div>
								<Badge variant={getDocumentStatusBadgeVariant(doc.status)}>
									{doc.status}
								</Badge>
							</div>
						{/each}
					</div>
				</Card>
			{:else if selectedTab === 'banking'}
				<Card class="p-6">
					<h3 class="mb-4 font-semibold">Banking Information</h3>
					<div class="space-y-4">
						<div class="rounded-lg border p-4">
							<div class="mb-4 grid gap-2">
								<div>
									<div class="text-sm text-muted-foreground">Bank Name</div>
									<div class="font-medium">{vendor.bankInfo.bankName}</div>
								</div>
								<div>
									<div class="text-sm text-muted-foreground">Account Number</div>
									<div class="font-medium">{vendor.bankInfo.accountNumber}</div>
								</div>
								<div>
									<div class="text-sm text-muted-foreground">Account Name</div>
									<div class="font-medium">{vendor.bankInfo.accountName}</div>
								</div>
							</div>
							<Button variant="outline" class="w-full">Update Banking Information</Button>
						</div>
					</div>
				</Card>
			{/if}
		</div>
	</div>
</div>
