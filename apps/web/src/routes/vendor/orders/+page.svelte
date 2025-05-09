<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { Search } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import NewOrders from './components/new-orders.svelte';
	import PreparingOrders from './components/preparing-orders.svelte';
	import ReadyOrders from './components/ready-orders.svelte';
	import CompletedOrders from './components/completed-orders.svelte';
	import CancelledOrders from './components/cancelled-orders.svelte';
	let searchQuery = $state('');
	let { data } = $props();

	let newOrders = $derived(data.newOrder || []);
</script>

<div class="container space-y-6 py-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-semibold">Orders</h1>
		<div class="relative w-64">
			<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input placeholder="Search orders..." class="pl-8" bind:value={searchQuery} />
		</div>
	</div>

	<Tabs.Root value="new" class="space-y-6">
		<Tabs.List class="w-full">
			<Tabs.Trigger value="new">New Orders</Tabs.Trigger>
			<Tabs.Trigger value="ready">Ready</Tabs.Trigger>
			<Tabs.Trigger value="completed">Completed</Tabs.Trigger>
			<Tabs.Trigger value="cancelled">Cancelled</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="new">
			<NewOrders {searchQuery} orders={newOrders} />
		</Tabs.Content>

		<Tabs.Content value="preparing">
			<PreparingOrders {searchQuery} />
		</Tabs.Content>

		<Tabs.Content value="ready">
			<ReadyOrders {searchQuery} />
		</Tabs.Content>

		<Tabs.Content value="completed">
			<CompletedOrders {searchQuery} />
		</Tabs.Content>

		<Tabs.Content value="cancelled">
			<CancelledOrders {searchQuery} />
		</Tabs.Content>
	</Tabs.Root>
</div>
