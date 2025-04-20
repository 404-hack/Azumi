<script lang="ts">
	import RestaurantCard2 from '$lib/components/RestaurantCard2.svelte';
	import { Button } from '$lib/components/ui/button';
	import { fade, fly } from 'svelte/transition';
	import { Star, MapPin, Search, Clock } from 'lucide-svelte';
	import FilterModal from '$lib/components/modal/FilterModal.svelte';

	// Get data from load function
	let { data } = $props();

	let searchTerm = $state('');
</script>

<div in:fade={{ duration: 300 }} class=" mx-auto py-6">
	<!-- Header with simple search -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="mb-2 text-3xl font-semibold">Restaurants Near me</h1>
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
