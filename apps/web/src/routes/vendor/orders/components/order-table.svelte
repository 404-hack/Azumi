<script lang="ts">
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';
	import { Eye, Phone, MoreVertical } from 'lucide-svelte';
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
		onStatusChange
	}: {
		searchQuery: string;
		orders: Order[];
		showActions?: boolean;
		onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
	} = $props();

	const statusFormatting: Record<string, { text: string; color: string }> = {
		PAYMENT_CONFIRMED: { text: 'New Order', color: 'default' },
		CONFIRMED: { text: 'Confirmed', color: 'secondary' },
		ACCEPTED: { text: 'Accepted', color: 'secondary' },
		PREPARING: { text: 'Preparing', color: 'warning' },
		READY: { text: 'Ready for Pickup', color: 'warning' },
		CANCELLED: { text: 'Cancelled', color: 'destructive' },
		COMPLETED: { text: 'Completed', color: 'success' },
		DELIVERED: { text: 'Delivered', color: 'success' }
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
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-[100px]">Order #</Table.Head>
				<Table.Head>Time</Table.Head>
				<Table.Head>Customer</Table.Head>
				<Table.Head class="text-right">Total</Table.Head>
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
						<span class="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
					</Table.Cell>
					<Table.Cell>
						<div class="flex flex-col">
							<span class="font-medium">{order.customer?.name || 'Unknown Customer'}</span>
							<span class="text-xs text-muted-foreground"
								>{order.customer?.phoneNumber || 'No phone'}</span
							>
						</div>
					</Table.Cell>
					<Table.Cell class="text-right font-medium">{formatCurrency(order.total)}</Table.Cell>
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
			{/each}
		</Table.Body>
	</Table.Root>
</div>
