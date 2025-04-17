<script lang="ts">
	import { cn } from '$lib/utils';
	import { Store, Utensils, Search, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-svelte';
	import { page } from '$app/state';
	import { fly, fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';

	type ShopType = {
		name: string;
		icon?: string;
		count?: number;
	};

	let routes = [
		{
			name: 'stores',
			href: '/explore/stores',
			icon: Store
		}
	];
	let { children, data } = $props();
	let searchTerm = $state('');
	let activeCategory = $state('All');

	// Static shop types for testing

	// Function to get appropriate background color class based on index

	// Function to get appropriate text color class based on index

	// Category icons mapping
	const categoryIcons: Record<string, string> = {
		All: 'storeIcon.png',
		restaurant: 'restaurantIcon.png',
		market: 'localMarketIcon.png'
	};
</script>

<div class="container mx-auto max-w-6xl py-4">
	<!-- Section Header -->
	<div class="mb-4">
		<h2 class="text-2xl font-bold tracking-tight">Explore Categories</h2>
	</div>
	<!-- Desktop: Category Tabs with precisely sized squares -->
	<div class=" bg-background/95 pb-3 pt-1 backdrop-blur-sm">
		<div class="flex w-full space-x-5 px-1">
			<!-- "All" category -->

			<!-- Category buttons -->
			{#each data.shopTypes as { name }, i}
				<button
					class="group flex flex-col items-center"
					onclick={() => goto('/explore/shops?category=' + name)}
				>
					<div
						class={cn(
							'relative mb-2 h-[116px] w-[116px] overflow-hidden rounded-lg shadow-sm transition-transform',
							activeCategory === name
								? 'scale-105 ring-2 ring-primary ring-offset-1'
								: 'ring-1 ring-transparent'
						)}
					>
						<img
							src={`./${categoryIcons[name] || 'storeIcon.png'}`}
							alt={name}
							class="relative z-10 h-full w-full object-cover"
						/>
					</div>
					<span
						class={cn(
							'text-base font-medium capitalize',
							activeCategory === name ? 'text-primary' : 'text-muted-foreground'
						)}>{name}</span
					>
				</button>
			{/each}
		</div>
	</div>

	<!-- Content area - let the child outlets render their content here -->
	<div class="mt-4">
		{@render children?.()}
	</div>
</div>
