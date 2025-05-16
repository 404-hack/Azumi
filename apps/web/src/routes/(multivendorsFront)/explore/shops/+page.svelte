<script lang="ts">
	import RestaurantCard2 from '$lib/components/RestaurantCard2.svelte';
	import { Button } from '$lib/components/ui/button';
	import { fade, fly } from 'svelte/transition';
	import { Star, MapPin, Search, Clock } from 'lucide-svelte';
	import FilterModal from '$lib/components/modal/FilterModal.svelte';
	import SEO from '$lib/components/SEO.svelte';

	// Get data from load function
	let { data } = $props();

	let searchTerm = $state('');

	// Prepare structured data for restaurant listings
	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		itemListElement: data.shops.map((shop, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'Restaurant',
				name: shop.name,
				description: shop.description,
				image: shop.coverImage,
				url: `https://azumi.com.ng/restaurant/${shop.slug}`,
				aggregateRating: shop.averageRating
					? {
							'@type': 'AggregateRating',
							ratingValue: shop.averageRating,
							reviewCount: shop.totalRatings || 0
						}
					: undefined,
				address: {
					'@type': 'PostalAddress',
					addressLocality: 'Lagos',
					addressCountry: 'NG'
				},
				priceRange: '₦₦',
				deliveryTimeMinutes: shop.estimatedTime
			}
		}))
	};
</script>

<SEO
	title="Restaurants Near Me | Food Delivery in Nigeria - Azumi"
	description="Discover and order from the best restaurants near you in Nigeria. Fast delivery, great variety of cuisines, and excellent service with Azumi food delivery."
	keywords="restaurants near me, food delivery Nigeria, best restaurants Nigeria, online food ordering, African cuisine, fast food delivery"
	ogType="website"
	path="/explore/shops"
	jsonLd={structuredData}
/>

<div in:fade={{ duration: 300 }} class="mx-auto py-6">
	<!-- Header with simple search -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="mb-2 text-xl font-semibold md:text-3xl">Restaurants Near me</h1>
			<!-- <p class="mb-6 text-muted-foreground">Explore our selection of restaurants</p> -->
		</div>
		<!-- No initialFilters prop needed - FilterModal gets all data from URL params -->
		<FilterModal />
	</div>

	<!-- Restaurant grid - clean and simple -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.shops as { name, description, coverImage, averageRating, deliveryFee, estimatedTime, distance, slug }, i}
			<RestaurantCard2
				{name}
				{description}
				image={coverImage}
				rating={averageRating}
				{i}
				deliveryTime={estimatedTime}
				deliveryRange={distance}
				deliveryPrice={deliveryFee}
				{slug}
			/>
		{/each}
	</div>

	<!-- Simple message when no results -->
	{#if data.shops.length === 0}
		<div class="py-8 text-center">
			<p class="text-muted-foreground">No restaurants found. Try adjusting your filters.</p>
		</div>
	{/if}
</div>
