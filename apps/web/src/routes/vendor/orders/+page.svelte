<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { Search } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import NewOrders from './components/new-orders.svelte';
	import PreparingOrders from './components/preparing-orders.svelte';
	import ReadyOrders from './components/ready-orders.svelte';
	import CompletedOrders from './components/completed-orders.svelte';
	import CancelledOrders from './components/cancelled-orders.svelte';

	let searchQuery = $state('');
	let { data } = $props();

	let currentStatus = $derived(data.currentStatus || 'new');
	let orders = $derived(data.orders || []);

	function handleTabChange(value: string) {
		const url = new URL($page.url);
		url.searchParams.set('status', value);
		goto(url.toString());
	}
</script>

<div class="container space-y-6 py-6">
	<div class="flex flex-wrap items-center justify-between">
		<h1 class="text-3xl font-semibold">Orders</h1>
		<div class="relative w-64">
			<Search class="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
			<Input placeholder="Search orders..." class="pl-8" bind:value={searchQuery} />
		</div>
	</div>
	<Tabs.Root value={currentStatus} class="space-y-6" onValueChange={handleTabChange}>
		<Tabs.List class="grid h-full grid-cols-2 gap-4 sm:grid-cols-5">
			<Tabs.Trigger value="new">New Orders</Tabs.Trigger>
			<Tabs.Trigger value="confirmed">Confirmed</Tabs.Trigger>
			<Tabs.Trigger value="ready">Ready</Tabs.Trigger>
			<Tabs.Trigger value="completed">Completed</Tabs.Trigger>
			<Tabs.Trigger value="cancelled">Cancelled</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="new">
			<NewOrders {searchQuery} {orders} />
		</Tabs.Content>

		<Tabs.Content value="confirmed">
			<PreparingOrders {searchQuery} {orders} />
		</Tabs.Content>

		<Tabs.Content value="ready">
			<ReadyOrders {searchQuery} {orders} />
		</Tabs.Content>

		<Tabs.Content value="completed">
			<CompletedOrders {searchQuery} {orders} />
		</Tabs.Content>

		<Tabs.Content value="cancelled">
			<CancelledOrders {searchQuery} {orders} />
		</Tabs.Content>
	</Tabs.Root>
</div>
