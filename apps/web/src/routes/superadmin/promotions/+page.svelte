<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { Ticket, Gift, Megaphone, TrendingUp, Users, ShoppingBag } from 'lucide-svelte';
	import { formatCurrency, formatDate } from '$lib/utils';

	// Mock data for promotions overview
	const overview = {
		activeCoupons: 5,
		activeDeals: 3,
		scheduledPromotions: 2,
		totalRedemptions: 1250,
		totalDiscount: 25000,
		averageOrderValue: 2500
	};

	// Mock data for recent promotions
	const recentPromotions = [
		{
			id: 'PROMO-001',
			type: 'coupon',
			name: 'WELCOME50',
			description: 'Welcome offer for new customers',
			startDate: new Date('2024-02-01'),
			endDate: new Date('2024-03-01'),
			status: 'active',
			redemptions: 450,
			totalDiscount: 12500
		},
		{
			id: 'PROMO-002',
			type: 'deal',
			name: 'Weekend Special',
			description: 'Special discounts on weekend orders',
			startDate: new Date('2024-02-10'),
			endDate: new Date('2024-02-11'),
			status: 'upcoming',
			redemptions: 0,
			totalDiscount: 0
		}
	];

	function getPromotionIcon(type: string) {
		switch (type) {
			case 'coupon':
				return Ticket;
			case 'deal':
				return Gift;
			case 'campaign':
				return Megaphone;
			default:
				return Gift;
		}
	}

	function getStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'active':
				return 'default';
			case 'upcoming':
				return 'secondary';
			case 'ended':
				return 'destructive';
			default:
				return 'outline';
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Promotions</h2>
			<p class="text-muted-foreground">Manage all promotional activities</p>
		</div>
		<div class="flex items-center gap-4">
			<Button variant="outline" href="/superadmin/promotions/deals/new">Create Deal</Button>
			<Button href="/superadmin/promotions/coupons/new">Create Coupon</Button>
		</div>
	</div>

	<!-- Overview Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<Card class="p-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
					<Ticket class="h-6 w-6 text-primary" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Active Coupons</div>
					<div class="text-2xl font-bold">{overview.activeCoupons}</div>
				</div>
			</div>
		</Card>

		<Card class="p-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
					<Gift class="h-6 w-6 text-primary" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Active Deals</div>
					<div class="text-2xl font-bold">{overview.activeDeals}</div>
				</div>
			</div>
		</Card>

		<Card class="p-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
					<Megaphone class="h-6 w-6 text-primary" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Scheduled Promotions</div>
					<div class="text-2xl font-bold">{overview.scheduledPromotions}</div>
				</div>
			</div>
		</Card>

		<Card class="p-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
					<Users class="h-6 w-6 text-primary" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Total Redemptions</div>
					<div class="text-2xl font-bold">{overview.totalRedemptions}</div>
				</div>
			</div>
		</Card>

		<Card class="p-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
					<TrendingUp class="h-6 w-6 text-primary" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Total Discount Given</div>
					<div class="text-2xl font-bold">{formatCurrency(overview.totalDiscount)}</div>
				</div>
			</div>
		</Card>

		<Card class="p-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
					<ShoppingBag class="h-6 w-6 text-primary" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Average Order Value</div>
					<div class="text-2xl font-bold">{formatCurrency(overview.averageOrderValue)}</div>
				</div>
			</div>
		</Card>
	</div>

	<!-- Quick Actions -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<Card class="p-6">
			<h3 class="mb-4 font-semibold">Coupons</h3>
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">
					Create and manage discount coupons for specific products or categories.
				</p>
				<div class="flex items-center gap-4">
					<Button variant="outline" href="/superadmin/promotions/coupons">View All</Button>
					<Button href="/superadmin/promotions/coupons/new">Create New</Button>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<h3 class="mb-4 font-semibold">Flash Deals</h3>
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">
					Set up time-limited deals and special offers for specific time periods.
				</p>
				<div class="flex items-center gap-4">
					<Button variant="outline" href="/superadmin/promotions/deals">View All</Button>
					<Button href="/superadmin/promotions/deals/new">Create New</Button>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<h3 class="mb-4 font-semibold">Campaigns</h3>
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">
					Create marketing campaigns and promotional events for special occasions.
				</p>
				<div class="flex items-center gap-4">
					<Button variant="outline" href="/superadmin/promotions/campaigns">View All</Button>
					<Button href="/superadmin/promotions/campaigns/new">Create New</Button>
				</div>
			</div>
		</Card>
	</div>

	<!-- Recent Promotions -->
	<Card class="p-6">
		<h3 class="mb-6 font-semibold">Recent Promotions</h3>
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Type</Table.Head>
						<Table.Head>Period</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Redemptions</Table.Head>
						<Table.Head>Total Discount</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each recentPromotions as promo}
						<Table.Row>
							<Table.Cell>
								<div class="flex items-center gap-2">
									<svelte:component
										this={getPromotionIcon(promo.type)}
										class="h-4 w-4 text-muted-foreground"
									/>
									<div>
										<div class="font-medium">{promo.name}</div>
										<div class="text-sm text-muted-foreground">{promo.description}</div>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell class="capitalize">{promo.type}</Table.Cell>
							<Table.Cell>
								<div>{formatDate(promo.startDate)}</div>
								<div class="text-sm text-muted-foreground">to {formatDate(promo.endDate)}</div>
							</Table.Cell>
							<Table.Cell>
								<Badge variant={getStatusBadgeVariant(promo.status)} class="capitalize">
									{promo.status}
								</Badge>
							</Table.Cell>
							<Table.Cell>{promo.redemptions}</Table.Cell>
							<Table.Cell>{formatCurrency(promo.totalDiscount)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</Card>
</div>
