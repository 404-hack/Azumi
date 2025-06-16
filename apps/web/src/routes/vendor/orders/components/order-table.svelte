<script lang="ts">
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';
	import { Eye, Phone, MoreVertical, ChevronDown, Receipt } from 'lucide-svelte';
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
		searchQuery = '',
		orders = [],
		showActions = true,
		onStatusChange,
		isUpdating = false
	}: {
		searchQuery: string;
		orders: Order[];
		showActions?: boolean;
		onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
		isUpdating?: boolean;
	} = $props();
	const statusFormatting: Record<
		string,
		{ text: string; color: 'default' | 'destructive' | 'outline' | 'secondary' }
	> = {
		PAYMENT_CONFIRMED: { text: 'New Order', color: 'default' },
		CONFIRMED: { text: 'Confirmed', color: 'secondary' },
		ACCEPTED: { text: 'Accepted', color: 'secondary' },
		PREPARING: { text: 'Preparing', color: 'outline' },
		READY: { text: 'Ready for Pickup', color: 'outline' },
		CANCELLED: { text: 'Cancelled', color: 'destructive' },
		COMPLETED: { text: 'Completed', color: 'secondary' },
		DELIVERED: { text: 'Delivered', color: 'secondary' }
	};

	const statusActions = {
		PAYMENT_CONFIRMED: [
			{ label: 'Accept Order', action: 'CONFIRMED', customClass: 'text-green-600' },
			{ label: 'Cancel Order', action: 'CANCELLED', customClass: 'text-red-600' }
		],
		CONFIRMED: [
			{ label: 'Start Preparing', action: 'PREPARING', customClass: 'text-yellow-600' },
			{ label: 'Cancel Order', action: 'CANCELLED', customClass: 'text-red-600' }
		],
		PREPARING: [
			{ label: 'Mark as Ready', action: 'READY', customClass: 'text-green-600' },
			{ label: 'Cancel Order', action: 'CANCELLED', customClass: 'text-red-600' }
		],
		READY: [{ label: 'Mark as Completed', action: 'COMPLETED', customClass: 'text-green-600' }]
	} as const;
	let filteredOrders = $derived(
		orders.filter((order) => {
			if (!searchQuery) return true;
			const searchLower = searchQuery.toLowerCase();
			return (
				order.code?.toLowerCase().includes(searchLower) ||
				order.customer?.name?.toLowerCase().includes(searchLower) ||
				order.customer?.phoneNumber?.includes(searchLower)
			);
		})
	);

	async function handleStatusChange(orderId: string, newStatus: string) {
		if (onStatusChange) {
			await onStatusChange(orderId, newStatus);
		}
	}

	function viewOrderDetails(orderId: string) {
		goto(`/vendor/orders/${orderId}`);
	}
	function callCustomer(phone: string) {
		window.location.href = `tel:${phone}`;
	}

	let expandedOrders = $state(new Set<string>());

	function toggleOrderExpansion(orderId: string) {
		if (expandedOrders.has(orderId)) {
			expandedOrders.delete(orderId);
		} else {
			expandedOrders.add(orderId);
		}
		expandedOrders = new Set(expandedOrders);
	}
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-[100px]">Order #</Table.Head>
				<Table.Head>Time</Table.Head>
				<Table.Head>Customer</Table.Head>
				<Table.Head class="text-right">Order Value</Table.Head>
				<Table.Head>Status</Table.Head>
				<Table.Head class="w-[100px] text-right">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each filteredOrders as order}
				<Table.Row>
					<Table.Cell class="font-medium">#{order.code || order.id}</Table.Cell>
					<Table.Cell class="text-muted-foreground">
						{formatTime(order.createdAt)}
						<span class="text-muted-foreground text-xs">{formatDate(order.createdAt)}</span>
					</Table.Cell>
					<Table.Cell>
						<div class="flex flex-col">
							<span class="font-medium">{order.customer?.name || 'Unknown Customer'}</span>
							<span class="text-muted-foreground text-xs"
								>{order.customer?.phoneNumber || 'No phone'}</span
							>
						</div>
					</Table.Cell>
					<Table.Cell class="text-right">
						<div class="flex flex-col items-end">
							<span class="font-medium">{formatCurrency(order.subtotal)}</span>
							<Button
								variant="outline"
								size="sm"
								class="text-muted-foreground hover:text-foreground h-6 p-1 text-xs"
								onclick={() => toggleOrderExpansion(order.id)}
							>
								<Receipt class="mr-1 h-3 w-3" />
								Breakdown
								<ChevronDown
									class="ml-1 h-3 w-3 transition-transform {expandedOrders.has(order.id)
										? 'rotate-180'
										: ''}"
								/>
							</Button>
						</div>
					</Table.Cell>
					<Table.Cell>
						<div class="flex gap-2">
							<Badge variant={statusFormatting[order.status]?.color || 'default'}>
								{statusFormatting[order.status]?.text || order.status}
							</Badge>
						</div>
					</Table.Cell>
					{#if showActions}
						<Table.Cell class="text-right">
							<div class="flex justify-end gap-2">
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8"
									onclick={() => callCustomer(order.customer?.phoneNumber || '')}
								>
									<Phone class="h-4 w-4" />
									<span class="sr-only">Call customer</span>
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8"
									onclick={() => viewOrderDetails(order.id)}
								>
									<Eye class="h-4 w-4" />
									<span class="sr-only">View details</span>
								</Button>
								{#if statusActions[order.status as keyof typeof statusActions]}
									<ResponsiveDropdown>
										{#snippet trigger()}
											<Button variant="ghost" size="icon" class="h-8 w-8">
												<MoreVertical class="h-4 w-4" />
												<span class="sr-only">Open menu</span>
											</Button>
										{/snippet}
										{#snippet children()}
											<DropdownMenu.Group>
												{#each statusActions[order.status as keyof typeof statusActions] || [] as action}
													<DropdownMenu.Item
														onclick={() => handleStatusChange(order.id, action.action)}
														class={action.customClass}
														disabled={isUpdating}
													>
														{action.label}
													</DropdownMenu.Item>
												{/each}
											</DropdownMenu.Group>
										{/snippet}
									</ResponsiveDropdown>
								{/if}
							</div>
						</Table.Cell>
					{:else}
						<Table.Cell class="text-right">
							<div class="flex justify-end gap-2">
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8"
									onclick={() => callCustomer(order.customer?.phoneNumber || '')}
								>
									<Phone class="h-4 w-4" />
									<span class="sr-only">Call customer</span>
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8"
									onclick={() => viewOrderDetails(order.id)}
								>
									<Eye class="h-4 w-4" />
									<span class="sr-only">View details</span>
								</Button>
							</div>
						</Table.Cell>
					{/if}
				</Table.Row>
				{#if expandedOrders.has(order.id)}
					<Table.Row class="bg-muted/30 border-none">
						<Table.Cell colspan={6} class="p-0">
							<div class="p-4">
								<div class="max-w-md">
									<h4 class="mb-3 flex items-center gap-2 text-sm font-medium">
										<Receipt class="text-muted-foreground h-4 w-4" />
										Price Breakdown
									</h4>
									<div class="space-y-2">
										<div class="flex justify-between text-sm">
											<span class="text-muted-foreground">Order Value</span>
											<span>{formatCurrency(order.subtotal || 0)}</span>
										</div>
										<div class="flex justify-between text-sm">
											<span class="text-muted-foreground"
												>Platform Commission ({order.shop?.commission || 10}%)</span
											>
											<span class="text-red-600">
												-{formatCurrency(
													((order.subtotal || 0) * (order.shop?.commission || 10)) / 100
												)}
											</span>
										</div>
										<hr class="my-2" />
										<div class="flex justify-between text-sm font-medium text-green-600">
											<span>Your Earnings</span>
											<span>
												{formatCurrency(
													((order.subtotal || 0) * (100 - (order.shop?.commission || 10))) / 100
												)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</Table.Cell>
					</Table.Row>
				{/if}
			{/each}
		</Table.Body>
	</Table.Root>
</div>
