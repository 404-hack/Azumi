<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { MapPin, Clock, Calendar, DollarSign, Package, ChevronRight } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	function getStatusBadgeVariant(status: string) {
		switch (status) {
			case 'delivered':
				return 'default';
			case 'cancelled':
				return 'destructive';
			case 'in_progress':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function viewOrderDetails(orderId: string) {
		goto(`/rider/orders/${orderId}`);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Order History</h2>
		<Badge variant="outline" class="flex items-center gap-1">
			<Package class="h-3 w-3" />
			{data.orderHistory.length} orders
		</Badge>
	</div>

	{#if data.orderHistory.length === 0}
		<Card class="flex min-h-[200px] items-center justify-center p-6">
			<div class="text-center">
				<Package class="text-muted-foreground mx-auto h-12 w-12" />
				<h3 class="mt-4 text-lg font-medium">No Order History</h3>
				<p class="text-muted-foreground text-sm">Your completed orders will appear here</p>
			</div>
		</Card>
	{:else}
		<div class="space-y-4">
			{#each data.orderHistory as order (order.id)}
				<Card class="p-6">
					<div class="flex items-start justify-between">
						<div class="flex-1 space-y-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<h3 class="font-semibold">Order #{order.id.slice(-6)}</h3>
									<Badge variant={getStatusBadgeVariant(order.status)}>
										{order.status.replace('_', ' ')}
									</Badge>
								</div>
								<div class="flex items-center gap-2">
									<DollarSign class="h-4 w-4 text-green-500" />
									<span class="font-medium">{formatCurrency(order.deliveryFee)}</span>
								</div>
							</div>

							<div class="grid gap-3 md:grid-cols-2">
								<div class="flex items-start gap-2">
									<MapPin class="text-muted-foreground mt-1 h-4 w-4" />
									<div>
										<div class="text-sm font-medium">Pickup</div>
										<div class="text-muted-foreground text-sm">{order.pickupLocation.address}</div>
									</div>
								</div>
								<div class="flex items-start gap-2">
									<MapPin class="text-muted-foreground mt-1 h-4 w-4" />
									<div>
										<div class="text-sm font-medium">Dropoff</div>
										<div class="text-muted-foreground text-sm">
											{order.deliveryLocation.address}
										</div>
									</div>
								</div>
							</div>
							<div class="text-muted-foreground flex items-center gap-4 text-sm">
								<div class="flex items-center gap-1">
									<Calendar class="h-4 w-4" />
									<span>{formatDate(order.createdAt)}</span>
								</div>
								<div class="flex items-center gap-1">
									<Package class="h-4 w-4" />
									<span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
								</div>
							</div>
						</div>

						<Button variant="ghost" size="sm" onclick={() => viewOrderDetails(order.id)}>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
