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
		User,
		ShoppingBag,
		MoreVertical,
		Calendar,
		DollarSign,
		MapPin,
		AlertTriangle
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatCurrency, formatDate } from '$lib/utils';

	let searchQuery = $state('');
	let selectedTab = $state('all');

	// Mock data for disputes
	const activeDisputes = [
		{
			id: 'DSP-001',
			customer: {
				name: 'John Doe',
				email: 'john@example.com'
			},
			orderId: 'ORD-001',
			vendor: 'Restaurant ABC',
			reason: 'Wrong order delivered',
			status: 'pending',
			createdAt: new Date('2024-02-01')
		},
		{
			id: 'DSP-002',
			customer: {
				name: 'Jane Smith',
				email: 'jane@example.com'
			},
			orderId: 'ORD-002',
			vendor: 'Restaurant XYZ',
			reason: 'Order not delivered',
			status: 'investigating',
			createdAt: new Date('2024-02-02')
		}
	];

	let filteredCustomers = $derived(
		adminState.customers.filter((customer) => {
			const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTab =
				selectedTab === 'all' ||
				(selectedTab === 'active' &&
					customer.lastOrder &&
					new Date(customer.lastOrder).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000);
			return matchesSearch && matchesTab;
		})
	);

	function handleDisputeAction(disputeId: string, resolution: string) {
		adminState.handleCustomerDispute(disputeId, resolution);
	}

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
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Customers Management</h2>
		<Button href="/superadmin/customers/new">Add New Customer</Button>
	</div>

	<!-- Active Disputes -->
	{#if activeDisputes.length > 0}
		<Card class="p-6">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-5 w-5 text-red-500" />
					<h3 class="font-semibold">Active Disputes</h3>
				</div>
				<Badge variant="destructive">{activeDisputes.length} active</Badge>
			</div>
			<div class="overflow-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Dispute ID</Table.Head>
							<Table.Head>Customer</Table.Head>
							<Table.Head>Order ID</Table.Head>
							<Table.Head>Vendor</Table.Head>
							<Table.Head>Reason</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Created</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each activeDisputes as dispute}
							<Table.Row>
								<Table.Cell class="font-medium">{dispute.id}</Table.Cell>
								<Table.Cell>{dispute.customer.name}</Table.Cell>
								<Table.Cell>{dispute.orderId}</Table.Cell>
								<Table.Cell>{dispute.vendor}</Table.Cell>
								<Table.Cell>{dispute.reason}</Table.Cell>
								<Table.Cell>
									<Badge variant={getDisputeStatusBadgeVariant(dispute.status)}>
										{dispute.status}
									</Badge>
								</Table.Cell>
								<Table.Cell>{formatDate(dispute.createdAt)}</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button variant="outline" size="sm" href="/superadmin/disputes/{dispute.id}">
											View Details
										</Button>
										<Button size="sm" onclick={() => handleDisputeAction(dispute.id, 'resolve')}>
											Resolve
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card>
	{/if}

	<!-- Customers List -->
	<Card class="p-6">
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Tabs.Root value={selectedTab} class="w-[400px]" onValueChange={(v) => (selectedTab = v)}>
					<Tabs.List>
						<Tabs.Trigger value="all">All Customers</Tabs.Trigger>
						<Tabs.Trigger value="active">Active</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
				<div class="relative">
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search customers..." class="pl-8" bind:value={searchQuery} />
				</div>
			</div>

			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Customer</Table.Head>
							<Table.Head>Total Orders</Table.Head>
							<Table.Head>Total Spent</Table.Head>
							<Table.Head>Location</Table.Head>
							<Table.Head>Joined</Table.Head>
							<Table.Head>Last Order</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredCustomers as customer}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<div class="h-8 w-8 overflow-hidden rounded-full bg-muted">
											<img
												src="https://api.dicebear.com/7.x/avataaars/svg?seed={customer.name}"
												alt="{customer.name}'s avatar"
												class="h-full w-full"
											/>
										</div>
										<div>
											<div class="font-medium">{customer.name}</div>
											<div class="text-sm text-muted-foreground">ID: {customer.id}</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<ShoppingBag class="h-4 w-4 text-muted-foreground" />
										<span>{customer.totalOrders}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<DollarSign class="h-4 w-4 text-muted-foreground" />
										<span>{formatCurrency(customer.totalSpent)}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										<MapPin class="h-4 w-4 text-muted-foreground" />
										<span>Lagos</span>
									</div>
								</Table.Cell>
								<Table.Cell>{formatDate(customer.joinedDate)}</Table.Cell>
								<Table.Cell>{formatDate(customer.lastOrder)}</Table.Cell>
								<Table.Cell class="text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="icon">
												<MoreVertical class="h-4 w-4" />
												<span class="sr-only">Actions</span>
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item href="/superadmin/customers/{customer.id}">
												View Profile
											</DropdownMenu.Item>
											<DropdownMenu.Item href="/superadmin/customers/{customer.id}/orders">
												Order History
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<DropdownMenu.Item
												class="text-red-600"
												onclick={() => handleDisputeAction(customer.id, 'block')}
											>
												Block Customer
											</DropdownMenu.Item>
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
