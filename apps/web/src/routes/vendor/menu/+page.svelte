<script lang="ts">
	import { Search } from 'lucide-svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import Meals from './components/meals.svelte';
	import OptionGroup from './components/option-groups.svelte';
	import OptionItems from './components/option-items.svelte';
	import FoodPacks from './components/food-packs.svelte';
	import { slide } from 'svelte/transition';
	import { queryParam, ssp } from 'sveltekit-search-params';
	import AddOptionModal from '$lib/components/modal/AddOptionModal.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	let { data } = $props();
	let menuData = $derived(data.menuCategoryWithItems);
	let showSearch = $state(false);
	let tabValue = queryParam('tabValue', {
		defaultValue: 'meals'
	});

	function toggleSearch() {
		showSearch = !showSearch;
	}
	const formattedOptions = $derived.by(() =>
		data.options.map((option) => ({
			...option,
			createdAt: option.createdAt ? new Date(option.createdAt) : null,
			updatedAt: option.updatedAt ? new Date(option.updatedAt) : null
		}))
	);
</script>

<div class="my-5 flex items-center justify-between gap-4">
	<h1 class="text-3xl font-semibold capitalize md:text-4xl">Menu</h1>

	<div class="flex items-center gap-2">
		{#if showSearch}
			<div transition:slide={{ duration: 300 }} class="w-[200px] md:w-[300px]">
				<Input type="search" placeholder="Search menu..." />
			</div>
		{/if}
		<button onclick={toggleSearch} class="hover:text-primary">
			<Search />
		</button>
	</div>
</div>

<Tabs.Root
	value={$tabValue}
	onValueChange={(v) => {
		$tabValue = v;
	}}
	class="space-y-4"
>
	<ScrollArea orientation="horizontal" class="w-full min-w-[300px] ">
		<Tabs.List class="">
			<Tabs.Trigger class="" value="meals">Meals</Tabs.Trigger>
			<Tabs.Trigger class="" value="option-items">Option Items</Tabs.Trigger>
			<Tabs.Trigger class="" value="option-groups">Option Groups</Tabs.Trigger>
			<Tabs.Trigger class="" value="food-packs">Food Packs</Tabs.Trigger>
		</Tabs.List>
	</ScrollArea>

	<Tabs.Content value="meals">
		<Meals menuCategoryWithItems={menuData} />
	</Tabs.Content>
	<Tabs.Content value="option-items">
		<OptionItems options={formattedOptions} />
	</Tabs.Content>
	<Tabs.Content value="option-groups">
		<OptionGroup optionGroups={data.optionGroups} />
	</Tabs.Content>
	<Tabs.Content value="food-packs">
		<FoodPacks />
	</Tabs.Content>
</Tabs.Root>
