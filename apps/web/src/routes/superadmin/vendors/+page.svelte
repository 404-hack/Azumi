<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import { Search, Store, Star, MoreVertical, AlertCircle } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatCurrency, formatDate } from '$lib/utils';

	let searchQuery = $state('');
	let selectedTab = $state('all');

	// Mock data for pending applications
	const pendingApplications = [
		{
			id: 'APP-001',
			businessName: 'Tasty Kitchen',
			ownerName: 'Michael Brown',
			location: 'Lagos',
			type: 'Restaurant',
			appliedDate: new Date('2024-02-01'),
			status: 'pending'
		},
		{
			id: 'APP-002',
			businessName: 'Sweet Delights',
			ownerName: 'Sarah Wilson',
			location: 'Abuja',
			type: 'Bakery',
			appliedDate: new Date('2024-02-02'),
			status: 'pending'
		}
	];

	let filteredVendors = $derived(
		adminState.vendors.filter((vendor) => {
			const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTab =
				selectedTab === 'all' ||
				(selectedTab === 'active' && vendor.isActive) ||
				(selectedTab === 'inactive' && !vendor.isActive);
			return matchesSearch && matchesTab;
		})
	);

	function handleVendorAction(vendorId: string, action: 'suspend' | 'activate' | 'delete') {
		if (action === 'suspend') {
			adminState.suspendVendor(vendorId);
		}
		// Implement other actions
	}

	function handleApplicationAction(applicationId: string, approved: boolean) {
		adminState.reviewVendorApplication(applicationId, approved);
	}

	function getStatusBadgeVariant(
		isActive: boolean
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		return isActive ? 'default' : 'secondary';
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Vendors Management</h2>
		<Button>Add New Vendor</Button>
	</div>

	<!-- Pending Applications -->
	{#if pendingApplications.length > 0}
		<Card class="p-6">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<AlertCircle class="h-5 w-5 text-yellow-500" />
					<h3 class="font-semibold">Pending Applications</h3>
				</div>
				<Badge variant="outline">{pendingApplications.length} new</Badge>
			</div>
			<div class="overflow-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Business Name</Table.Head>
							<Table.Head>Owner</Table.Head>
							<Table.Head>Location</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Applied Date</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each pendingApplications as application}
							<Table.Row>
								<Table.Cell class="font-medium">{application.businessName}</Table.Cell>
								<Table.Cell>{application.ownerName}</Table.Cell>
								<Table.Cell>{application.location}</Table.Cell>
								<Table.Cell>{application.type}</Table.Cell>
								<Table.Cell>{formatDate(application.appliedDate)}</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											onclick={() => handleApplicationAction(application.id, false)}
										>
											Reject
										</Button>
										<Button size="sm" onclick={() => handleApplicationAction(application.id, true)}>
											Approve
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

	<!-- Vendors List -->
	<Card class="p-6">
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Tabs.Root value={selectedTab} class="w-[400px]" onValueChange={(v) => (selectedTab = v)}>
					<Tabs.List>
						<Tabs.Trigger value="all">All Vendors</Tabs.Trigger>
						<Tabs.Trigger value="active">Active</Tabs.Trigger>
						<Tabs.Trigger value="inactive">Inactive</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
				<div class="relative">
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search vendors..." class="pl-8" bind:value={searchQuery} />
				</div>
			</div>

			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Vendor</Table.Head>
							<Table.Head>Orders</Table.Head>
							<Table.Head>Revenue</Table.Head>
							<Table.Head>Rating</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Joined</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredVendors as vendor}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Store class="h-4 w-4 text-muted-foreground" />
										<div>
											<div class="font-medium">{vendor.name}</div>
											<div class="text-sm text-muted-foreground">
												Last active {formatDate(vendor.lastActive)}
											</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>{vendor.totalOrders}</Table.Cell>
								<Table.Cell>{formatCurrency(vendor.totalRevenue)}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
										<span>{vendor.rating.toFixed(1)}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getStatusBadgeVariant(vendor.isActive)}>
										{vendor.isActive ? 'Active' : 'Inactive'}
									</Badge>
								</Table.Cell>
								<Table.Cell>{formatDate(vendor.joinedDate)}</Table.Cell>
								<Table.Cell class="text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="icon">
												<MoreVertical class="h-4 w-4" />
												<span class="sr-only">Actions</span>
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item
												onclick={() =>
													handleVendorAction(vendor.id, vendor.isActive ? 'suspend' : 'activate')}
											>
												{vendor.isActive ? 'Suspend' : 'Activate'}
											</DropdownMenu.Item>
											<DropdownMenu.Item>View Profile</DropdownMenu.Item>
											<DropdownMenu.Item>Edit Details</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<DropdownMenu.Item
												class="text-red-600"
												onclick={() => handleVendorAction(vendor.id, 'delete')}
											>
												Delete
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
