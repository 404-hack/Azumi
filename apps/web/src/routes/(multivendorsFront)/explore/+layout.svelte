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
	let activeCategory = $derived(page.url.searchParams.get('category') || 'All');
	
	function selectCategory(name: string) {
		goto('/explore/shops?category=' + name);
	}

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
		<h2 class="text-2xl font-semibold tracking-tight">Explore Categories</h2>
	</div>
	<!-- Desktop: Category Tabs with precisely sized squares -->
	<div class=" bg-background/95 pb-3 pt-1 backdrop-blur-sm">
		<div class="flex w-full space-x-5 px-1">
			<!-- "All" category -->

			<!-- Category buttons -->
			{#each data.shopTypes as { name }, i}
				<button
					class="group flex flex-col items-center"
					onclick={() => selectCategory(name)}
				>					<div
						class={cn(
							'relative mb-2 h-[116px] w-[116px] overflow-hidden rounded-lg shadow-sm transition-all duration-200',
							activeCategory === name
								? 'scale-105 ring-[3px] ring-primary ring-offset-2 ring-offset-background shadow-md'
								: 'hover:scale-105 ring-1 ring-muted hover:ring-primary/50'
						)}
					>
						<img
							src={`./${categoryIcons[name] || 'storeIcon.png'}`}
							alt={name}
							class={cn(
								"relative z-10 h-full w-full object-cover transition-all",
								activeCategory === name ? "brightness-105" : "group-hover:brightness-102"
							)}
						/>
						{#if activeCategory === name}
							<div class="absolute inset-0 bg-primary/10 z-20"></div>
							<div class="absolute bottom-0 left-0 right-0 h-1 bg-primary z-30"></div>
						{/if}
					</div>
					<span
						class={cn(
							'text-base font-medium capitalize transition-colors duration-200',
							activeCategory === name ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'
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
