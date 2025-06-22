<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import { Search, Ticket, Calendar, MoreVertical } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatCurrency, formatDate } from '$lib/utils';
	import { page } from '$app/stores';
	import { client } from '$lib/hc';
	import { goto } from '$app/navigation';
	
	let searchQuery = $state('');
	let selectedTab = $state('all');
	let coupons = $state([]);
	let pagination = $state({ page: 1, limit: 10, total: 0, pages: 1 });
	
	// Function to handle pagination navigation
	function navigateToPage(pageNum) {
		const url = new URL(window.location.href);
		url.searchParams.set('page', pageNum.toString());
		goto(url.toString());
	}
	
	// Initialize data from load function
	$effect(() => {
		if ($page.data.coupons) {
			coupons = $page.data.coupons;
		}
		
		if ($page.data.pagination) {
			pagination = $page.data.pagination;
		}
	});
	
	// Filter coupons based on search and tab selection
	let filteredCoupons = $derived(
		coupons.filter((coupon) => {
			const matchesSearch = searchQuery === '' || 
				(coupon.code && coupon.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(coupon.description && coupon.description.toLowerCase().includes(searchQuery.toLowerCase()));
			
			const now = new Date();
			const startDate = new Date(coupon.startDate);
			const endDate = new Date(coupon.endDate);
			
			const matchesTab =
				selectedTab === 'all' ||
				(selectedTab === 'active' && startDate <= now && endDate > now) ||
				(selectedTab === 'expired' && endDate < now) ||
				(selectedTab === 'upcoming' && startDate > now);
			return matchesSearch && matchesTab;
		})
	);

	function getStatusBadgeVariant(
		coupon: (typeof coupons)[0]
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		const now = new Date();
		if (new Date(coupon.endDate) < now) return 'destructive';
		if (new Date(coupon.startDate) > now) return 'secondary';
		if (coupon.status === 'active') return 'default';
		return 'outline';
	}

	function getStatusLabel(coupon: (typeof coupons)[0]): string {
		const now = new Date();
		if (new Date(coupon.endDate) < now) return 'Expired';		if (new Date(coupon.startDate) > now) return 'Upcoming';
		if (coupon.status === 'active') return 'Active';
		return 'Inactive';
	}
	
	async function handleCouponAction(couponId: string, action: 'deactivate' | 'delete') {
		try {
			if (action === 'delete') {
				if (!confirm('Are you sure you want to delete this coupon?')) {
					return;
				}
				
				const res = await client.admin.promotions.coupons[couponId].$delete();
				
				if (res.ok) {
					// Remove the coupon from the list
					coupons = coupons.filter(c => c.id !== couponId);
				} else {
					alert('Failed to delete coupon');
				}			} else if (action === 'deactivate') {
				const res = await client.admin.promotions.coupons[couponId].$patch({
					json: {
						status: 'inactive'
					}
				});
				
				if (res.ok) {
					// Update the coupon status
					coupons = coupons.map(c => 
						c.id === couponId 
							? { ...c, status: 'inactive' } 
							: c
					);
				} else {
					alert('Failed to deactivate coupon');
				}
			}
		} catch (error) {
			console.error(`Error during ${action} action:`, error);
			alert(`Failed to ${action} coupon`);
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Coupons Management</h2>
			<p class="text-muted-foreground">Manage promotional codes and discounts</p>
		</div>
		<Button href="/superadmin/promotions/coupons/new">Create New Coupon</Button>
	</div>

	<!-- Coupons List -->
	<Card class="p-6">
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Tabs.Root
					value={selectedTab}
					class="w-[400px]"
					onValueChange={(v: string) => (selectedTab = v)}
				>
					<Tabs.List>
						<Tabs.Trigger value="all">All Coupons</Tabs.Trigger>
						<Tabs.Trigger value="active">Active</Tabs.Trigger>
						<Tabs.Trigger value="upcoming">Upcoming</Tabs.Trigger>
						<Tabs.Trigger value="expired">Expired</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
				<div class="relative">
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search coupons..." class="pl-8" bind:value={searchQuery} />
				</div>
			</div>

			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Code</Table.Head>
							<Table.Head>Discount</Table.Head>
							<Table.Head>Usage</Table.Head>
							<Table.Head>Min Order</Table.Head>
							<Table.Head>Valid Period</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredCoupons as coupon}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Ticket class="h-4 w-4 text-muted-foreground" />
										<div>
											<div class="font-medium">{coupon.code}</div>
											<div class="text-sm text-muted-foreground">{coupon.description}</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if coupon.type === 'percentage'}
										{coupon.value}% off
										{#if coupon.maxDiscount}
											<div class="text-sm text-muted-foreground">
												Max {formatCurrency(coupon.maxDiscount)}
											</div>
										{/if}
									{:else}
										{formatCurrency(coupon.value)} off
									{/if}
								</Table.Cell>
								<Table.Cell>
									<div class="font-medium">{coupon.usedCount} / {coupon.usageLimit}</div>
									<div class="text-sm text-muted-foreground">
										{((coupon.usedCount / coupon.usageLimit) * 100).toFixed(1)}% used
									</div>
								</Table.Cell>
								<Table.Cell>{formatCurrency(coupon.minOrderValue)}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Calendar class="h-4 w-4 text-muted-foreground" />
										<div>
											<div>{formatDate(coupon.startDate)}</div>
											<div class="text-sm text-muted-foreground">
												to {formatDate(coupon.endDate)}
											</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getStatusBadgeVariant(coupon)}>
										{getStatusLabel(coupon)}
									</Badge>
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
											<DropdownMenu.Item href="/superadmin/promotions/coupons/{coupon.id}">
												View Details
											</DropdownMenu.Item>
											<DropdownMenu.Item href="/superadmin/promotions/coupons/{coupon.id}/edit">
												Edit Coupon
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											{#if coupon.status === 'active'}
												<DropdownMenu.Item
													class="text-red-600"
													onclick={() => handleCouponAction(coupon.id, 'deactivate')}
												>
													Deactivate
												</DropdownMenu.Item>
											{/if}
											<DropdownMenu.Item
												class="text-red-600"
												onclick={() => handleCouponAction(coupon.id, 'delete')}
											>
												Delete
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						{/each}					</Table.Body>
				</Table.Root>
			</div>
			
			{#if pagination.pages > 1}
				<div class="mt-6 flex justify-center">
					<div class="flex items-center gap-2">
						<Button 
							variant="outline" 
							size="sm"
							disabled={pagination.page <= 1}
							onclick={() => navigateToPage(pagination.page - 1)}
						>
							Previous
						</Button>
						
						{#each Array.from({ length: pagination.pages }, (_, i) => i + 1) as pageNum}
							<Button 
								variant={pagination.page === pageNum ? 'default' : 'outline'} 
								size="sm"
								onclick={() => navigateToPage(pageNum)}
							>
								{pageNum}
							</Button>
						{/each}
						
						<Button 
							variant="outline" 
							size="sm"
							disabled={pagination.page >= pagination.pages}
							onclick={() => navigateToPage(pagination.page + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</Card>
</div>
