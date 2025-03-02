<script lang="ts">
	import RestaurantCard from './RestaurantCard.svelte';
	import { Loader2 } from 'lucide-svelte';

	const restaurants = [
		{
			id: '1',
			name: 'Burger Palace',
			image:
				'https://images.unsplash.com/photo-1586816001966-79b736744398?q=80&w=3270&auto=format&fit=crop',
			rating: 4.5,
			deliveryTime: '15-25 min',
			tags: ['Burgers', 'American', 'Fast Food']
		},
		{
			id: '2',
			name: 'Sushi Haven',
			image:
				'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=3270&auto=format&fit=crop',
			rating: 4.7,
			deliveryTime: '20-30 min',
			tags: ['Sushi', 'Japanese', 'Healthy']
		},
		{
			id: '3',
			name: 'Pizza Paradise',
			image:
				'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=3270&auto=format&fit=crop',
			rating: 4.3,
			deliveryTime: '25-35 min',
			tags: ['Pizza', 'Italian', 'Vegetarian']
		},
		{
			id: '4',
			name: 'Taco Town',
			image:
				'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=3270&auto=format&fit=crop',
			rating: 4.6,
			deliveryTime: '15-25 min',
			tags: ['Mexican', 'Tacos', 'Spicy']
		},
		{
			id: '5',
			name: 'Green Leaf Vegan',
			image:
				'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=3270&auto=format&fit=crop',
			rating: 4.4,
			deliveryTime: '20-30 min',
			tags: ['Vegan', 'Healthy', 'Vegetarian']
		}
	];

	interface RestaurantListProps {
		searchTerm: string;
		category: string;
	}

	let { searchTerm, category }: RestaurantListProps = $props();

	let filteredRestaurants = $derived(
		restaurants.filter((restaurant) => {
			const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = category === 'All' || restaurant.tags.includes(category);
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
					href={`/restaurant/${restaurant.id}`}
					class="outline-none focus-visible:ring-2 focus-visible:ring-primary"
				>
					<RestaurantCard {...restaurant} />
				</a>
			{/each}
		</div>
	{/if}
</section>
