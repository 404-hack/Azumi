<script lang="ts">
	import RestaurantCard2 from '$lib/components/RestaurantCard2.svelte';
	import { Button } from '$lib/components/ui/button';
	import { fade, fly } from 'svelte/transition';
	import { Star, MapPin, Search, Clock } from 'lucide-svelte';

	// Sample restaurant data (in a real app, this would come from an API)
	const restaurants = $state([
		{
			id: '1',
			name: 'Mama Africa Kitchen',
			slug: 'mama-africa',
			image: '/restaurantIcon.png',
			cuisine: 'Traditional',
			rating: 4.8,
			location: 'Lagos'
		},
		{
			id: '2',
			name: 'Spice Haven',
			slug: 'spice-haven',
			image: './storeIcon.png',
			cuisine: 'West African',
			rating: 4.6,
			location: 'Accra'
		},
		{
			id: '3',
			name: 'The Jollof Spot',
			slug: 'jollof-spot',
			image: './localMarketIcon.png',
			cuisine: 'Nigerian',
			rating: 4.9,
			location: 'Port Harcourt'
		},
		{
			id: '4',
			name: 'Safari Grill',
			slug: 'safari-grill',
			image: './shop.avif',
			cuisine: 'East African',
			rating: 4.7,
			location: 'Nairobi'
		}
	]);

	let searchTerm = $state('');

	// Simple search function
	const filteredRestaurants = $derived(
		searchTerm
			? restaurants.filter(
					(r) =>
						r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
						r.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
						r.location.toLowerCase().includes(searchTerm.toLowerCase())
				)
			: restaurants
	);
</script>

<div in:fade={{ duration: 300 }} class="container mx-auto py-6">
	<!-- Header with simple search -->
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-semibold">Restaurants</h1>
		<p class="mb-6 text-muted-foreground">Explore our selection of restaurants</p>

		<div class="max-w-md">
			<div class="flex items-center rounded-md border bg-background px-3 py-2 shadow-sm">
				<Search class="mr-2 h-4 w-4 text-muted-foreground" />
				<input
					type="text"
					placeholder="Search restaurants or cuisines..."
					class="flex-1 border-none bg-transparent focus:outline-none"
					bind:value={searchTerm}
				/>
			</div>
		</div>
	</div>

	<!-- Restaurant grid - clean and simple -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each filteredRestaurants as restaurant, i}
			<RestaurantCard2 />
			<!-- <div
				class="overflow-hidden rounded-lg bg-card shadow-sm transition-all duration-200 hover:shadow-md"
				in:fly|global={{ y: 20, delay: i * 50, duration: 200 }}
			>
				<img src={restaurant.image} alt={restaurant.name} class="h-48 w-full object-cover" />
				<div class="p-4">
					<h3 class="text-lg font-medium">{restaurant.name}</h3>
					<p class="mb-3 text-sm text-muted-foreground">{restaurant.cuisine}</p>

					<div class="flex items-center justify-between">
						<div class="flex items-center text-sm">
							<MapPin class="mr-1 h-3 w-3 text-muted-foreground" />
							<span class="text-muted-foreground">{restaurant.location}</span>
						</div>
						<div class="flex items-center">
							<Star class="mr-1 h-4 w-4 fill-amber-500 text-amber-500" />
							<span class="font-medium">{restaurant.rating}</span>
						</div>
					</div>

					<Button class="mt-4 w-full" variant="outline">View Restaurant</Button>
				</div>
			</div> -->
		{/each}
	</div>

	<!-- Simple message when no results -->
	{#if filteredRestaurants.length === 0}
		<div class="py-8 text-center">
			<p class="text-muted-foreground">No restaurants found. Try a different search.</p>
		</div>
	{/if}
</div>
