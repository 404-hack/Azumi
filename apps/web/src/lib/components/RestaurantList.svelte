<script lang="ts">
	import type { TShop } from '@repo/server/types';
	import RestaurantCard from './RestaurantCard.svelte';
	import { Loader2 } from 'lucide-svelte';

	interface RestaurantListProps {
		searchTerm: string;
		category: string;
		restaurants: TShop[];
	}

	let { searchTerm, category, restaurants }: RestaurantListProps = $props();

	let filteredRestaurants = $derived(
		restaurants.filter((restaurant) => {
			const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = category === 'All' || restaurant?.tags?.includes(category); // Added optional chaining for safety
			return matchesSearch && matchesCategory;
		})
	);
</script>

<section class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold tracking-tight">Popular Restaurants</h2>
			<p class="text-sm text-muted-foreground">Discover the best local restaurants in your area</p>
		</div>
	</div>

	{#if filteredRestaurants.length === 0}
		<div
			class="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed"
		>
			{#if searchTerm || category !== 'All'}
				<p class="text-center text-muted-foreground">
					No restaurants found matching your criteria. Try adjusting your filters.
				</p>
			{:else}
				<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredRestaurants as restaurant (restaurant.id)}
				<a
					href={`/restaurant/${restaurant.slug}`}
					class="outline-none focus-visible:ring-2 focus-visible:ring-primary"
				>
					<RestaurantCard
						image="https://images.unsplash.com/photo-1586816001966-79b736744398?q=80&w=3270&auto=format&fit=crop"
						name={restaurant.name}
						rating={restaurant.averageRating}
						deliveryTime={restaurant.estimatedDeliveryTime}
						tags={restaurant.tags || []}
					/>
				</a>
			{/each}
		</div>
	{/if}
</section>
