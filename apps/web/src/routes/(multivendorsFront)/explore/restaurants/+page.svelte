<script lang="ts">
	import RestaurantCard2 from '$lib/components/RestaurantCard2.svelte';
	import { Button } from '$lib/components/ui/button';
	import SearchBar2 from '$lib/components/SearchBar2.svelte';
</script>

<div class=" mb-8 flex items-center justify-between">
	<h1 class="font-display text-xl font-semibold capitalize sm:text-3xl md:text-4xl">
		restaurants near me
	</h1>
	<!-- <FilterModal /> -->
</div>
<!-- <Category /> -->
<div class="">
	<div class="flex items-center justify-between py-2">
		<h2 class="font-display my-10 text-xl font-medium capitalize md:text-2xl">all Restaurants</h2>
		<div>
			<SearchBar2 />
		</div>
	</div>
	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
		<RestaurantCard2 slug={'token'} name={'code'} />
		<RestaurantCard2 slug={'token'} name={'code'} />
		<RestaurantCard2 slug={'token'} name={'code'} />
		<RestaurantCard2 slug={'token'} name={'code'} />
	</div>
</div>
