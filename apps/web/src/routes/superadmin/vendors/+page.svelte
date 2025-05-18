<script lang="ts">
	import { page } from '$app/state';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import { Search, Store, Star, MoreVertical } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatCurrency, formatDate } from '$lib/utils';
	import SEO from '$lib/components/SEO.svelte';
	import { goto } from '$app/navigation';
	import { client } from '$lib/hc';
	import { invalidateAll } from '$app/navigation';

	let searchQuery = $state('');
	let selectedTab = $state('all');
	let { data } = $props();
	let vendors = $derived(data.vendors);

	let pendingVendors = $derived(vendors.filter((vendor) => vendor && vendor.status === 'PENDING'));

	let filteredVendors = $derived(
		vendors.filter((vendor) => {
			if (!vendor) return false;
			const matchesSearch = vendor.name?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTab = selectedTab === 'all' || selectedTab === vendor.status;
			return matchesSearch && matchesTab;
		})
	);
	console.log('🚀 ~ filteredVendors:', filteredVendors);

	async function handleSearch() {
		await goto(
			`?${new URLSearchParams({
				...Object.fromEntries(page.url.searchParams),
				search: searchQuery,
				page: '1'
			}).toString()}`
		);
	}

	async function handleTabChange(tab: string) {
		selectedTab = tab;
		await goto(
			`?${new URLSearchParams({
				...Object.fromEntries(page.url.searchParams),
				status: tab === 'all' ? '' : tab,
				page: '1'
			}).toString()}`
		);
	}

	async function handleVendorAction(
		vendorId: string,
		action: 'suspend' | 'activate' 
		// vendorName is no longer needed as we removed the modal that used it
	) {
		try {
			if (action === 'suspend' || action === 'activate') {
				await client.admin.vendors[':id'].status.$patch({
					param: {
						id: vendorId
					},
					json: {
						status: action === 'suspend' ? 'SUSPENDED' : 'APPROVED',
						active: action === 'activate'
					}
				});
				await invalidateAll();
			} 
		} catch (error) {
			console.error(`Failed to ${action} vendor:`, error);
		}
	}

	async function handleApproveReject(vendorId: string, action: 'approve' | 'reject') {
		try {
			await client.admin.vendors[':id'].status.$patch({
				param: {
					id: vendorId
				},
				json: {
					status: action === 'approve' ? 'APPROVED' : 'REJECTED',
					active: action === 'approve' // Set active to true when approving
				}
			});
			await invalidateAll();
		} catch (error) {
			console.error(`Failed to ${action} vendor:`, error);
		}
	}

	function getStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' {
		switch (status) {
			case 'APPROVED':
				return 'default';
			case 'PENDING':
				return 'warning';
			case 'REJECTED':
				return 'destructive';
			case 'SUSPENDED':
				return 'secondary';
			case 'DRAFT':
				return 'outline';
			default:
				return 'outline';
		}
	}
</script>

<SEO
	title="Manage Vendors | Azumi Admin Dashboard"
	description="Administrative dashboard for managing food vendors, restaurants, and delivery partners on the Azumi platform."
/>


<div class="container mx-auto space-y-6 p-4">
	<div class="space-y-8">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-bold">Vendors Management</h2>
			<Button>Add New Vendor</Button>
		</div>

		<!-- {#if pendingVendors.length > 0}
			<Card class="p-6">
				<div class="space-y-4">
					<h3 class="text-xl font-semibold text-yellow-600">Pending Applications</h3>
					<div class="rounded-md border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Vendor</Table.Head>
									<Table.Head>Email</Table.Head>
									<Table.Head>Applied On</Table.Head>
									<Table.Head class="text-right">Actions</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each pendingVendors as vendor}
									<Table.Row>
										<Table.Cell>
											<div class="flex items-center gap-2">
												<Store class="h-4 w-4 text-muted-foreground" />
												<div class="font-medium">{vendor.name}</div>
											</div>
										</Table.Cell>
										<Table.Cell>{vendor.email}</Table.Cell>
										<Table.Cell>{formatDate(vendor.createdAt)}</Table.Cell>
										<Table.Cell class="text-right">
											<div class="flex items-center justify-end gap-2">
												<Button
													variant="outline"
													size="sm"
													class="text-red-600"
													onclick={() => handleApproveReject(vendor.id, 'reject')}
												>
													Reject
												</Button>
												<Button size="sm" onclick={() => handleApproveReject(vendor.id, 'approve')}>
													Approve
												</Button>
											</div>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</div>
			</Card>
		{/if} -->

		<!-- Vendors List -->
		<Card class="p-6">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Tabs.Root value={selectedTab} class="w-[500px]" onValueChange={handleTabChange}>
						<Tabs.List>
							<Tabs.Trigger value="all">All Vendors</Tabs.Trigger>
							<Tabs.Trigger value="APPROVED">Approved</Tabs.Trigger>
							<Tabs.Trigger value="PENDING">Pending Review</Tabs.Trigger>
							<Tabs.Trigger value="SUSPENDED">Suspended</Tabs.Trigger>
							<Tabs.Trigger value="REJECTED">Rejected</Tabs.Trigger>
						</Tabs.List>
					</Tabs.Root>
					<div class="relative">
						<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search vendors..."
							class="pl-8"
							bind:value={searchQuery}
							oninput={() => handleSearch()}
						/>
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
													{vendor.email}
												</div>
											</div>
										</div>
									</Table.Cell>
									<Table.Cell>{vendor.totalRatings || 0}</Table.Cell>
									<Table.Cell>{formatCurrency(vendor.commission || 0)}</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-1">
											<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
											<span>{(vendor.averageRating || 0).toFixed(1)}</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<Badge variant={getStatusBadgeVariant(vendor.status)}>
											{vendor.status}
										</Badge>
									</Table.Cell>
									<Table.Cell>{formatDate(vendor.createdAt)}</Table.Cell>
									<Table.Cell class="text-right">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger>
												<Button variant="ghost" size="icon">
													<MoreVertical class="h-4 w-4" />
													<span class="sr-only">Actions</span>
												</Button>
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="end">
												{#if vendor.status === 'PENDING'}
													<DropdownMenu.Item
														onclick={() => handleApproveReject(vendor.id, 'approve')}
													>
														Approve Application
													</DropdownMenu.Item>
													<DropdownMenu.Item
														class="text-red-600"
														onclick={() => handleApproveReject(vendor.id, 'reject')}
													>
														Reject Application
													</DropdownMenu.Item>
												{:else if vendor.status === 'APPROVED'}
													<DropdownMenu.Item
														onclick={() => handleVendorAction(vendor.id, 'suspend')}
													>
														Suspend Vendor
													</DropdownMenu.Item>
												{:else if vendor.status === 'SUSPENDED' || vendor.status === 'REJECTED'}
													<DropdownMenu.Item
														onclick={() => handleVendorAction(vendor.id, 'activate')}
													>
														Reactivate Vendor
													</DropdownMenu.Item>
												{/if}
												<DropdownMenu.Item>
													<a href="/superadmin/vendors/{vendor.id}">View Profile</a>
												</DropdownMenu.Item>
												<DropdownMenu.Item>
													<a href="/superadmin/vendors/{vendor.id}/edit">Edit Details</a>
												</DropdownMenu.Item>
												<DropdownMenu.Separator />
												<!-- Removed the conditional DropdownMenu.Item for modal-based suspension -->
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
</div>
