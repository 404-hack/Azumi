<script lang="ts">
	import { cn } from '$lib/utils';
	import { Store, Utensils, Search, ChevronRight, ShoppingBag } from 'lucide-svelte';
	import { page } from '$app/state';
	import { fly, fade } from 'svelte/transition';

	let routes = [
		{
			name: 'stores',
			href: '/explore/stores',
			icon: Store
		}
	];
	let { children, data } = $props();
	let searchTerm = $state('');
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-semibold">Explore Categories</h2>
		<a href="/explore/all" class="flex items-center text-primary hover:underline">
			View all
			<ChevronRight class="ml-1 h-4 w-4" />
		</a>
	</div>

	<!-- Desktop view: grid layout -->
	<div class="hidden md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
		{#each data.shopTypes as { name }, i}
			<a
				href={`/explore/${name.toLowerCase()}s`}
				class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-background to-muted/50 shadow-md transition-all duration-300 hover:shadow-lg"
				in:fly|global={{ y: 20, delay: i * 100, duration: 300 }}
			>
				<div
					class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"
				></div>
				<img
					src={`./restaurantIcon.png`}
					alt={name}
					class="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
				<div class="absolute bottom-0 left-0 right-0 p-4">
					<h3 class="mb-1 text-xl font-bold text-white">{name}</h3>
					<div class="flex items-center text-sm text-white/80">
						<ShoppingBag class="mr-1 h-4 w-4" />
						<span>Explore products</span>
					</div>
				</div>
			</a>
		{/each}
	</div>

	<!-- Mobile view: horizontal scrollable cards -->
	<div class="overflow-x-auto pb-4 md:hidden">
		<div class="flex space-x-4">
			{#each data.shopTypes as { name }, i}
				<a
					href={`/explore/${name.toLowerCase()}`}
					class="group relative min-w-[160px] max-w-[180px] flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-background to-muted/50 shadow-md transition-all duration-300 hover:shadow-lg"
					in:fly|global={{ x: 20, delay: i * 100, duration: 300 }}
				>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"
					></div>
					<img
						src={`./restaurantIcon.png`}
						alt={name}
						class="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
					<div class="absolute bottom-0 left-0 right-0 p-3">
						<h3 class="text-base font-bold text-white">{name}</h3>
						<div class="flex items-center text-xs text-white/80">
							<ShoppingBag class="mr-1 h-3 w-3" />
							<span>Explore</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<div class="mt-10">
		{@render children?.()}
	</div>
</div>
