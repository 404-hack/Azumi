<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Eye, MoreVertical, Phone } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { formatTime, formatCurrency } from '$lib/utils';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';

	let { searchQuery, orders = [] } = $props();

	let filteredOrders = $derived(
		orders.filter((order) => {
			if (!searchQuery) return true;
			const searchLower = searchQuery.toLowerCase();
			return (
				order.code?.toLowerCase().includes(searchLower) ||
				false ||
				order.customer.name.toLowerCase().includes(searchLower) ||
				order.contactPhone.includes(searchLower)
			);
		})
	);
	const statusFormatting: Record<string, { text: string; color: string }> = {
		PAYMENT_CONFIRMED: { text: 'New Order', color: 'default' },
		ACCEPTED: { text: 'Accepted', color: 'secondary' },
		PREPARING: { text: 'Preparing', color: 'warning' },
		READY: { text: 'Ready for Pickup', color: 'warning' },
		CANCELLED: { text: 'Cancelled', color: 'destructive' },
		COMPLETED: { text: 'Completed', color: 'success' },
		DELIVERED: { text: 'Delivered', color: 'success' }
	};
	const paymentStatusColors: Record<string, string> = {
		pending: 'default',
		paid: 'success',
		failed: 'destructive',
		refunded: 'secondary'
	};

	const statusActions = {
		pending: [
			{ label: 'Accept Order', action: 'accepted', customClass: 'text-green-600' },
			{ label: 'Cancel Order', action: 'cancelled', customClass: 'text-red-600' }
		],
		accepted: [
			{ label: 'Start Preparing', action: 'preparing', customClass: 'text-yellow-600' },
			{ label: 'Cancel Order', action: 'cancelled', customClass: 'text-red-600' }
		],
		preparing: [
			{ label: 'Mark as Ready', action: 'ready', customClass: 'text-green-600' },
			{ label: 'Cancel Order', action: 'cancelled', customClass: 'text-red-600' }
		],
		ready: [{ label: 'Mark as Completed', action: 'completed', customClass: 'text-green-600' }]
	} as const;

	async function handleStatusChange(orderId: string, newStatus: string) {
		try {
			const response = await fetch(`/api/vendor/orders/${orderId}/status`, {
				method: 'PATCH',
				body: JSON.stringify({ status: newStatus }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) throw new Error('Failed to update order status');
			// The page data will automatically refresh via SvelteKit's invalidation
		} catch (error) {
			console.error('Error updating order status:', error);
			// TODO: Show error toast
		}
	}

	function viewOrderDetails(orderId: string) {
		goto(`/vendor/orders/${orderId}`);
	}

	function callCustomer(phone: string) {
		window.location.href = `tel:${phone}`;
	}
</script>

<div class="space-y-6">
	{#if filteredOrders.length === 0}
		<div class="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
			<div class="text-center">
				<h3 class="text-lg font-medium">No New Orders</h3>
				<p class="text-sm text-muted-foreground">New orders will appear here</p>
			</div>
		</div>
	{:else}
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
							</Table.Cell>
							<Table.Cell>
								<div class="flex flex-col">
									<span class="font-medium">{order.customer.name}</span>
									<span class="text-xs text-muted-foreground">{order.contactPhone}</span>
								</div>
							</Table.Cell>
							<Table.Cell class="text-right font-medium"
								>{formatCurrency(order.subtotal)}</Table.Cell
							>
							<Table.Cell>
								<div class="flex gap-2">
									<Badge variant={statusFormatting[order.status]?.color || 'default'}>
										{statusFormatting[order.status]?.text || order.status}
									</Badge>
								</div>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8"
										onclick={() => callCustomer(order.contactPhone)}
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
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
