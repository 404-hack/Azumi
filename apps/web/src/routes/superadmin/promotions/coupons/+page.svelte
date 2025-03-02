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

	let searchQuery = $state('');
	let selectedTab = $state('all');

	// Mock data for coupons
	const coupons = [
		{
			id: 'COUP-001',
			code: 'WELCOME50',
			type: 'percentage',
			value: 50,
			minOrderValue: 1000,
			maxDiscount: 500,
			usageLimit: 1000,
			usedCount: 450,
			startDate: new Date('2024-02-01'),
			endDate: new Date('2024-03-01'),
			status: 'active',
			description: 'Welcome offer for new customers'
		},
		{
			id: 'COUP-002',
			code: 'FLAT100',
			type: 'fixed',
			value: 100,
			minOrderValue: 500,
			maxDiscount: 100,
			usageLimit: 500,
			usedCount: 200,
			startDate: new Date('2024-02-01'),
			endDate: new Date('2024-02-15'),
			status: 'active',
			description: 'Flat discount on all orders'
		}
	];

	let filteredCoupons = $derived(
		coupons.filter((coupon) => {
			const matchesSearch =
				coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
				coupon.description.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTab =
				selectedTab === 'all' ||
				(selectedTab === 'active' && coupon.status === 'active') ||
				(selectedTab === 'expired' && new Date(coupon.endDate) < new Date()) ||
				(selectedTab === 'upcoming' && new Date(coupon.startDate) > new Date());
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
		if (new Date(coupon.endDate) < now) return 'Expired';
		if (new Date(coupon.startDate) > now) return 'Upcoming';
		if (coupon.status === 'active') return 'Active';
		return 'Inactive';
	}

	function handleCouponAction(couponId: string, action: 'deactivate' | 'delete') {
		// In real app, call adminState.handleCouponAction
		console.log(`Coupon action: ${action} for ${couponId}`);
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
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	</Card>
</div>
