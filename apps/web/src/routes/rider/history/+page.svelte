<script lang="ts">
	import { riderState } from '$lib/states/riderState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import { Calendar } from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';

	let selectedDate = $state<string>(new Date().toISOString().split('T')[0]);
	let selectedStatus = $state<string>('all');

	const statusColors = {
		completed: 'success',
		cancelled: 'destructive'
	} as const;

	let filteredDeliveries = $derived(
		riderState.deliveryHistory.filter((delivery) => {
			const matchesDate =
				new Date(delivery.completedAt || delivery.cancelledAt!).toISOString().split('T')[0] ===
				selectedDate;
			const matchesStatus = selectedStatus === 'all' || delivery.status === selectedStatus;
			return matchesDate && matchesStatus;
		})
	);

	let totalEarnings = $derived(
		filteredDeliveries
			.filter((d) => d.status === 'completed')
			.reduce((sum, d) => sum + d.deliveryFee, 0)
	);
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Delivery History</h2>
		<div class="flex items-center gap-4">
			<!-- Date Selector -->
			<div class="flex items-center gap-2">
				<Calendar class="h-4 w-4" />
				<input type="date" bind:value={selectedDate} class="rounded-md border px-2 py-1 text-sm" />
			</div>

			<!-- Status Filter -->
			<Select.Root bind:value={selectedStatus}>
				<Select.Trigger class="w-[150px]">
					<span class="capitalize">{selectedStatus === 'all' ? 'All Status' : selectedStatus}</span>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all">All Status</Select.Item>
					<Select.Item value="completed">Completed</Select.Item>
					<Select.Item value="cancelled">Cancelled</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<!-- Summary Card -->
	<Card class="p-6">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">Summary</h3>
				<p class="text-sm text-muted-foreground">
					{formatDate(new Date(selectedDate))}
				</p>
			</div>
			<div>
				<div class="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
				<p class="text-right text-sm text-muted-foreground">Total Earnings</p>
			</div>
		</div>
	</Card>

	<!-- Deliveries Table -->
	{#if filteredDeliveries.length === 0}
		<Card class="flex min-h-[200px] items-center justify-center p-6">
			<div class="text-center">
				<h3 class="text-lg font-medium">No Deliveries Found</h3>
				<p class="text-sm text-muted-foreground">Try selecting a different date or status</p>
			</div>
		</Card>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Order ID</Table.Head>
						<Table.Head>Time</Table.Head>
						<Table.Head>Pickup</Table.Head>
						<Table.Head>Dropoff</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">Earnings</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredDeliveries as delivery}
						<Table.Row>
							<Table.Cell class="font-medium">
								{delivery.order.orderNumber}
							</Table.Cell>
							<Table.Cell>
								{formatTime(delivery.completedAt || delivery.cancelledAt!)}
							</Table.Cell>
							<Table.Cell class="max-w-[200px] truncate">
								{delivery.pickupLocation.address}
							</Table.Cell>
							<Table.Cell class="max-w-[200px] truncate">
								{delivery.dropoffLocation.address}
							</Table.Cell>
							<Table.Cell>
								<Badge variant={statusColors[delivery.status as keyof typeof statusColors]}>
									{delivery.status}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right">
								{delivery.status === 'completed' ? formatCurrency(delivery.deliveryFee) : '-'}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
