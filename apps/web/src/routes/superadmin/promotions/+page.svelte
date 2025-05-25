<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import {
		Ticket,
		Gift,
		Megaphone,
		TrendingUp,
		Users,
		ShoppingBag,
		Tag,
		Percent,
		Zap,
		ShoppingCart
	} from 'lucide-svelte';
	import { formatCurrency, formatDate } from '$lib/utils';
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	type PromotionType = 'percentage' | 'fixed' | 'bogo' | 'minimum_spend';
	type PromotionStatus = 'active' | 'upcoming' | 'expired' | 'inactive';

	interface Promotion {
		id: string;
		code: string;
		type: PromotionType;
		value: number;
		isActive: boolean;
		startDate: string;
		endDate: string;
		usageLimit?: number;
		usageCount: number;
		costBearer: string;
		shopId?: string;
		minSpend?: number;
		maxDiscount?: number;
	}

	let { data } = $props();

	let promotions = $state(data.promotions || []);
	let pagination = $state(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
	let overview = $state(
		data.overview || {
			activePromotions: 0,
			upcomingPromotions: 0,
			expiredPromotions: 0,
			totalRedemptions: 0,
			promotionsByType: {
				percentage: [],
				fixed: [],
				bogo: [],
				minimum_spend: []
			}
		}
	);

	// Calculate average discount value (simplified approximation)
	const totalDiscount = $derived(
		promotions.reduce((acc, promo) => {
			if (promo.type === 'fixed') return acc + promo.value * (promo.usageCount || 0);
			if (promo.type === 'percentage')
				return acc + (promo.value / 100) * 1000 * (promo.usageCount || 0); // rough estimate
			return acc;
		}, 0)
	);
	// Average order value - this would ideally come from the backend
	const averageOrderValue = $derived(
		totalDiscount > 0 && overview.totalRedemptions > 0
			? totalDiscount / overview.totalRedemptions
			: 2500 // fallback value
	);

	const getPromotionIcon = (type: PromotionType) => {
		switch (type) {
			case 'percentage':
				return Percent;
			case 'fixed':
				return Tag;
			case 'bogo':
				return Gift;
			case 'minimum_spend':
				return ShoppingCart;
			default:
				return Ticket;
		}
	};
	const getPromotionStatus = (promotion: Promotion): PromotionStatus => {
		const now = new Date();
		const startDate = new Date(promotion.startDate);
		const endDate = new Date(promotion.endDate);

		if (!promotion.isActive) return 'inactive';
		if (now < startDate) return 'upcoming';
		if (now > endDate) return 'expired';
		return 'active';
	};
	const getStatusBadgeVariant = (
		status: PromotionStatus
	): 'default' | 'secondary' | 'destructive' | 'outline' => {
		switch (status) {
			case 'active':
				return 'default';
			case 'upcoming':
				return 'secondary';
			case 'expired':
			case 'inactive':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	// Using state for navigation
	const currentPage = $state(Number(pagination.page));
	const navigateToPage = (pageNum: number) => {
		currentPage = pageNum;
		const url = new URL(window.location.href);
		url.searchParams.set('page', pageNum.toString());
		window.location.href = url.toString();
	};

	// Effect to update data when URL parameters change
	$effect(() => {
		const pageParam = $page.url.searchParams.get('page');
		if (pageParam && Number(pageParam) !== currentPage) {
			currentPage = Number(pageParam);
		}
	});

	// Effect to update state when data changes
	$effect(() => {
		promotions = data.promotions || [];
		pagination = data.pagination || { page: 1, limit: 10, total: 0, pages: 1 };
		overview = data.overview || {
			activePromotions: 0,
			upcomingPromotions: 0,
			expiredPromotions: 0,
			totalRedemptions: 0,
			promotionsByType: {
				percentage: [],
				fixed: [],
				bogo: [],
				minimum_spend: []
			}
		};
	});
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Promotions</h2>
			<p class="text-muted-foreground">Manage all promotional activities across shops</p>
		</div>
		<div class="flex items-center gap-4">
			<Button variant="outline" href="/superadmin/promotions/new">Create Promotion</Button>
		</div>
	</div>

	<!-- Overview Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<Card class="p-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
					<Tag class="h-6 w-6 text-primary" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Active Promotions</div>
					<div class="text-2xl font-bold">{overview.activePromotions}</div>
				</div>
			</div>
		</Card>

		<Card class="p-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
					<Zap class="h-6 w-6 text-primary" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Upcoming Promotions</div>
					<div class="text-2xl font-bold">{overview.upcomingPromotions}</div>
				</div>
			</div>
		</Card>

		<Card class="p-4">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
					<Megaphone class="h-6 w-6 text-primary" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Expired Promotions</div>
					<div class="text-2xl font-bold">{overview.expiredPromotions}</div>
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
					<div class="text-2xl font-bold">{formatCurrency(totalDiscount)}</div>
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
					<div class="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
				</div>
			</div>
		</Card>
	</div>

	<!-- Promotion Types -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card class="p-6">
			<h3 class="mb-4 font-semibold">Percentage Discounts</h3>
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">
					{overview.promotionsByType.percentage.length} active percentage-based promotions
				</p>
				<div class="flex items-center gap-4">
					<Button variant="outline" href="/superadmin/promotions?type=percentage">View All</Button>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<h3 class="mb-4 font-semibold">Fixed Amount Discounts</h3>
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">
					{overview.promotionsByType.fixed.length} active fixed amount promotions
				</p>
				<div class="flex items-center gap-4">
					<Button variant="outline" href="/superadmin/promotions?type=fixed">View All</Button>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<h3 class="mb-4 font-semibold">Buy One Get One</h3>
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">
					{overview.promotionsByType.bogo.length} active BOGO promotions
				</p>
				<div class="flex items-center gap-4">
					<Button variant="outline" href="/superadmin/promotions?type=bogo">View All</Button>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<h3 class="mb-4 font-semibold">Minimum Spend</h3>
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">
					{overview.promotionsByType.minimum_spend.length} active minimum spend promotions
				</p>
				<div class="flex items-center gap-4">
					<Button variant="outline" href="/superadmin/promotions?type=minimum_spend"
						>View All</Button
					>
				</div>
			</div>
		</Card>
	</div>

	<!-- Promotions List -->
	<Card class="p-6">
		<div class="mb-6 flex items-center justify-between">
			<h3 class="font-semibold">All Promotions</h3>
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" href="/superadmin/promotions/new">Add New</Button>
			</div>
		</div>

		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Code & Details</Table.Head>
						<Table.Head>Shop</Table.Head>
						<Table.Head>Type</Table.Head>
						<Table.Head>Value</Table.Head>
						<Table.Head>Period</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Usage</Table.Head>
						<Table.Head>Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each promotions as promo}
						<Table.Row>
							<Table.Cell>
								<div class="flex items-center gap-2">
									<svelte:component
										this={getPromotionIcon(promo.type)}
										class="h-4 w-4 text-muted-foreground"
									/>
									<div>
										<div class="font-medium">{promo.code}</div>
										<div class="text-sm text-muted-foreground">{promo.name}</div>
										{#if promo.description}
											<div class="text-xs text-muted-foreground">{promo.description}</div>
										{/if}
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								{promo.shop?.name || 'N/A'}
							</Table.Cell>
							<Table.Cell class="capitalize">{promo.type}</Table.Cell>
							<Table.Cell>
								{#if promo.type === 'percentage'}
									{promo.value}%
									{#if promo.maxDiscount}
										<div class="text-xs text-muted-foreground">
											Max: {formatCurrency(promo.maxDiscount)}
										</div>
									{/if}
								{:else if promo.type === 'fixed'}
									{formatCurrency(promo.value)}
								{:else if promo.type === 'bogo'}
									Buy {promo.buyQuantity}, Get {promo.getQuantity}
								{:else if promo.type === 'minimum_spend'}
									{formatCurrency(promo.value)} off on {formatCurrency(promo.minOrderValue || 0)}+
								{/if}
							</Table.Cell>
							<Table.Cell>
								<div>{formatDate(promo.startDate)}</div>
								<div class="text-sm text-muted-foreground">to {formatDate(promo.endDate)}</div>
							</Table.Cell>
							<Table.Cell>
								<Badge
									variant={getStatusBadgeVariant(getPromotionStatus(promo))}
									class="capitalize"
								>
									{getPromotionStatus(promo)}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<div>{promo.usageCount || 0} uses</div>
								{#if promo.usageLimit}
									<div class="text-xs text-muted-foreground">
										Limit: {promo.usageLimit}
									</div>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-2">
									<Button size="sm" variant="outline" href={`/superadmin/promotions/${promo.id}`}>
										View
									</Button>
									<Button
										size="sm"
										variant="outline"
										href={`/superadmin/promotions/${promo.id}/edit`}
									>
										Edit
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<!-- Pagination -->
		{#if pagination && pagination.pages > 1}
			<div class="mt-4 flex items-center justify-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={pagination.page <= 1}
					on:click={() => navigateToPage(pagination.page - 1)}
				>
					Previous
				</Button>

				<span class="text-sm">
					Page {pagination.page} of {pagination.pages}
				</span>

				<Button
					variant="outline"
					size="sm"
					disabled={pagination.page >= pagination.pages}
					on:click={() => navigateToPage(pagination.page + 1)}
				>
					Next
				</Button>
			</div>
		{/if}
	</Card>
</div>
