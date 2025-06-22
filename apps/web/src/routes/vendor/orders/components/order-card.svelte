<script lang="ts">
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Clock, Phone, MapPin, ChevronDown, Receipt } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	interface Order {
		id: string;
		code: string | null;
		createdAt: string;
		customer: {
			id: string;
			name: string;
			phoneNumber: string;
			email: string;
		};
		subtotal: number;
		total: number;
		status: string;
		paymentStatus: string;
		shop?: {
			id: string;
			name: string;
			commission: number;
		};
		items: Array<{
			id: string;
			menuItemName: string;
			quantity: number;
			unitPrice: number;
			totalPrice: number;
		}>;
	}
	let {
		order,
		onStatusChange,
		showBreakdown = false,
		showActions = true,
		compact = false,
		isUpdating = false
	}: {
		order: Order;
		onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
		showBreakdown?: boolean;
		showActions?: boolean;
		compact?: boolean;
		isUpdating?: boolean;
	} = $props();

	const statusFormatting: Record<
		string,
		{ text: string; color: 'default' | 'destructive' | 'outline' | 'secondary' }
	> = {
		PAYMENT_CONFIRMED: { text: 'New Order', color: 'default' },
		CONFIRMED: { text: 'Confirmed', color: 'secondary' },
		PREPARING: { text: 'Preparing', color: 'outline' },
		READY: { text: 'Ready', color: 'outline' },
		CANCELLED: { text: 'Cancelled', color: 'destructive' },
		COMPLETED: { text: 'Completed', color: 'secondary' },
		DELIVERED: { text: 'Delivered', color: 'secondary' }
	};
	const statusActions = {
		PAYMENT_CONFIRMED: [
			{ label: 'Accept Order', action: 'CONFIRMED', variant: 'default' as const, primary: true },
			{ label: 'Reject', action: 'CANCELLED', variant: 'destructive' as const }
		],
		CONFIRMED: [
			{ label: 'Start Preparing', action: 'PREPARING', variant: 'default' as const, primary: true },
			{ label: 'Cancel Order', action: 'CANCELLED', variant: 'destructive' as const }
		],
		PREPARING: [
			{ label: 'Mark Ready', action: 'READY', variant: 'default' as const, primary: true },
			{ label: 'Cancel Order', action: 'CANCELLED', variant: 'destructive' as const }
		],
		READY: [{ label: 'Complete', action: 'COMPLETED', variant: 'default' as const, primary: true }],
		COMPLETED: [],
		DELIVERED: [],
		CANCELLED: []
	} as const;

	let expanded = $state(false);

	function toggleExpansion() {
		expanded = !expanded;
	}

	function callCustomer() {
		if (order.customer?.phoneNumber) {
			window.location.href = `tel:${order.customer.phoneNumber}`;
		}
	}

	function viewDetails() {
		goto(`/vendor/orders/${order.id}`);
	}

	function getTimeAgo(createdAt: string): string {
		const now = new Date();
		const orderTime = new Date(createdAt);
		const diffMs = now.getTime() - orderTime.getTime();
		const diffMins = Math.floor(diffMs / (1000 * 60));

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;

		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;

		return formatDate(createdAt);
	}
</script>

<Card.Root class="w-full transition-all duration-200 hover:shadow-md">
	<Card.Header class="px-3 pb-2 pt-3">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1">
				<Card.Title class="truncate text-sm font-semibold sm:text-base">
					#{order.code || order.id.slice(-6)}
				</Card.Title>
				<Card.Description class="text-muted-foreground text-xs">
					{getTimeAgo(order.createdAt)} • {formatTime(order.createdAt)}
				</Card.Description>
			</div>
			<div class="flex flex-col items-end gap-1">
				<Badge
					variant={statusFormatting[order.status]?.color || 'default'}
					class="whitespace-nowrap text-xs"
				>
					{statusFormatting[order.status]?.text || order.status}
				</Badge>
				<div class="text-right">
					<div class="text-base font-bold text-green-600 sm:text-lg">
						{formatCurrency(((order.subtotal || 0) * (100 - (order.shop?.commission || 0))) / 100)}
					</div>
					<div class="text-muted-foreground text-xs">Your earnings</div>
					{#if showBreakdown}
						<Button
							variant="ghost"
							size="sm"
							onclick={toggleExpansion}
							class="text-muted-foreground hover:text-foreground -mr-1 h-5 p-1 text-xs"
						>
							<Receipt class="mr-1 h-3 w-3" />
							Breakdown
							<ChevronDown
								class="ml-1 h-3 w-3 transition-transform {expanded ? 'rotate-180' : ''}"
							/>
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</Card.Header>
	<Card.Content class="space-y-3 px-3 pb-2 pt-0">
		<div class="flex items-center justify-between">
			<div class="min-w-0 flex-1">
				<div class="truncate text-sm font-medium">
					{order.customer?.name || 'Unknown Customer'}
				</div>
				<div class="text-muted-foreground text-xs">
					{order.customer?.phoneNumber || 'No phone'}
				</div>
			</div>
			<Button
				variant="outline"
				size="sm"
				onclick={callCustomer}
				class="h-7 w-7 shrink-0 p-0 sm:h-8 sm:w-auto sm:px-2"
				disabled={!order.customer?.phoneNumber}
			>
				<Phone class="h-3 w-3 sm:h-4 sm:w-4" />
				<span class="ml-1 hidden text-xs sm:inline">Call</span>
			</Button>
		</div>
		<div class="space-y-1">
			<div class="text-muted-foreground text-xs font-medium">
				Items ({order.items?.length || 0})
			</div>
			{#if !compact}
				<div class="space-y-1">
					{#each (order.items || []).slice(0, 2) as item}
						<div class="flex justify-between text-xs">
							<span class="flex-1 truncate">
								{item.quantity}x {item.menuItemName}
							</span>
							<span class="ml-2 shrink-0 font-medium">
								{formatCurrency(item.totalPrice)}
							</span>
						</div>
					{/each}
					{#if (order.items?.length || 0) > 2}
						<div class="text-muted-foreground text-xs">
							+{(order.items?.length || 0) - 2} more items
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-muted-foreground text-xs">
					{#if order.items && order.items.length > 0}
						{order.items[0].menuItemName}
						{#if order.items.length > 1}
							+{order.items.length - 1} more
						{/if}
					{:else}
						No items
					{/if}
				</div>
			{/if}
		</div>

		{#if expanded && showBreakdown}
			<div class="bg-muted/30 space-y-2 rounded-lg p-3">
				<div class="text-sm font-medium">Price Breakdown</div>
				<div class="space-y-1">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Order Value</span>
						<span>{formatCurrency(order.subtotal || 0)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">
							Platform Commission ({order.shop?.commission || 0}%)
						</span>
						<span class="text-red-600">
							-{formatCurrency(((order.subtotal || 0) * (order.shop?.commission || 0)) / 100)}
						</span>
					</div>
					<hr class="my-2" />
					<div class="flex justify-between text-sm font-medium text-green-600">
						<span>Your Earnings</span>
						<span>
							{formatCurrency(
								((order.subtotal || 0) * (100 - (order.shop?.commission || 0))) / 100
							)}
						</span>
					</div>
				</div>
			</div>
		{/if}
	</Card.Content>
	{#if showActions && statusActions[order.status as keyof typeof statusActions]?.length > 0}
		<Card.Footer class="px-3 pb-3 pt-2">
			<div class="flex w-full flex-col gap-2">
				<!-- View Details -->
				<Button variant="outline" onclick={viewDetails} class="min-h-[36px] w-full" size="sm">
					View Details
				</Button>

				<!-- Accept/Reject Actions -->
				<div class="flex gap-2">
					{#each statusActions[order.status as keyof typeof statusActions] || [] as action}
						<Button
							variant={action.variant}
							onclick={() => onStatusChange?.(order.id, action.action)}
							class="min-h-[40px] flex-1 font-medium"
							size="sm"
							disabled={isUpdating}
						>
							{action.label}
						</Button>
					{/each}
				</div>
			</div>
		</Card.Footer>
	{:else if showActions}
		<Card.Footer class="px-3 pb-3 pt-2">
			<Button
				variant="outline"
				onclick={viewDetails}
				class="min-h-[40px] w-full sm:min-h-[36px]"
				size="sm"
			>
				View Details
			</Button>
		</Card.Footer>
	{/if}
</Card.Root>
