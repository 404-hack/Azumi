<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import {
		Star,
		MapPin,
		TrendingUp,
		ThumbsUp,
		ShoppingBag,
		ChevronRight,
		Bike,
		CircleDollarSign
	} from 'lucide-svelte';

	// Sample data for demonstration - in a real app would come from an API or store
	type ExploreItem = {
		id: string;
		name: string;
		image: string;
		category: string;
		rating: number;
		location: string;
		deliveryTime: string; // e.g., '20-30 min'
		deliveryRange: string; // e.g., '5 km'
		deliveryPrice: number; // e.g., 3.50
		isPopular?: boolean;
		isTrending?: boolean;
	};

	// Example explore items
	const exploreItems: ExploreItem[] = $state([
		{
			id: '1',
			name: 'Fresh Local Fruits',
			image: './shop.avif',
			category: 'Groceries',
			rating: 4.8,
			location: 'Lagos',
			deliveryTime: '25-35 min',
			deliveryRange: '3 km',
			deliveryPrice: 2.5,
			isPopular: true
		},
		{
			id: '2',
			name: 'Handcrafted Jewelry',
			image: './restaurantIcon.png',
			category: 'Accessories',
			rating: 4.6,
			location: 'Accra',
			deliveryTime: '40-50 min',
			deliveryRange: '8 km',
			deliveryPrice: 5.0,
			isTrending: true
		},
		{
			id: '3',
			name: 'Traditional Clothing',
			image: './storeIcon.png',
			category: 'Fashion',
			rating: 4.9,
			location: 'Nairobi',
			deliveryTime: '30-40 min',
			deliveryRange: '5 km',
			deliveryPrice: 4.0,
			isPopular: true,
			isTrending: true
		},
		{
			id: '4',
			name: 'Organic Spices',
			image: './localMarketIcon.png',
			category: 'Groceries',
			rating: 4.7,
			location: 'Dakar',
			deliveryTime: '20-30 min',
			deliveryRange: '4 km',
			deliveryPrice: 3.0,
			isPopular: true
		},
		{
			id: '5',
			name: 'Handmade Baskets',
			image: './shop.avif',
			category: 'Home Decor',
			rating: 4.5,
			location: 'Cape Town',
			deliveryTime: '45-60 min',
			deliveryRange: '10 km',
			deliveryPrice: 6.5,
			isTrending: true
		},
		{
			id: '6',
			name: 'African Art',
			image: './restaurantIcon.png',
			category: 'Art',
			rating: 4.9,
			location: 'Marrakech',
			deliveryTime: '35-45 min',
			deliveryRange: '6 km',
			deliveryPrice: 4.5,
			isTrending: true
		}
	]);

	const filters = $state([
		{ name: 'All', active: true },
		{ name: 'Popular', active: false },
		{ name: 'Trending', active: false },
		{ name: 'New Arrivals', active: false }
	]);

	function setFilter(selectedFilter: string) {
		filters.forEach((filter) => {
			filter.active = filter.name === selectedFilter;
		});
	}
	// Get filtered items based on current filter
	const filteredItems = $derived(
		filters.find((f) => f.active)?.name === 'All'
			? exploreItems
			: filters.find((f) => f.active)?.name === 'Popular'
				? exploreItems.filter((item) => item.isPopular)
				: filters.find((f) => f.active)?.name === 'Trending'
					? exploreItems.filter((item) => item.isTrending)
					: exploreItems
	);
</script>

<div>
	<!-- Filter tabs -->
	<div class="mb-6 border-b">
		<div class="scrollbar-hide flex overflow-x-auto">
			{#each filters as filter}
				<button
					class="whitespace-nowrap border-b-2 px-4 py-2 transition-all {filter.active
						? 'border-primary font-medium text-primary'
						: 'border-transparent hover:border-primary/30 hover:text-primary'}"
					onclick={() => setFilter(filter.name)}
				>
					{filter.name}
				</button>
			{/each}
		</div>
	</div>

	<!-- Featured section with larger cards -->
	<div class="mb-10" in:fade={{ duration: 300 }}>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-xl font-medium">Featured Restaurants</h3>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredItems.slice(0, 3) as item, i (item.id)}
				<div
					class="overflow-hidden rounded-xl bg-card shadow-md transition-all duration-300 hover:shadow-lg"
					in:fly|global={{ y: 20, delay: i * 75, duration: 250 }}
				>
					<div class="relative h-48">
						<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
						{#if item.isPopular}
							<div
								class="absolute left-3 top-3 flex items-center rounded-md bg-yellow-500/90 px-2 py-1 text-xs text-white"
							>
								<ThumbsUp class="mr-1 h-3 w-3" />
								Popular
							</div>
						{/if}
						{#if item.isTrending}
							<div
								class="absolute right-3 top-3 flex items-center rounded-md bg-blue-500/90 px-2 py-1 text-xs text-white"
							>
								<TrendingUp class="mr-1 h-3 w-3" />
								Trending
							</div>
						{/if}
					</div>
					<div class="p-4">
						<div class="mb-2 flex items-center text-xs text-muted-foreground">
							<span class="rounded-full bg-primary/10 px-2 py-1 text-primary">{item.category}</span>
						</div>

						<h3 class="mb-1 text-lg font-medium">{item.name}</h3>

						<!-- Add Delivery Info -->
						<div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
							<span class="flex items-center">
								<Bike class="mr-1 h-3 w-3" />
								{item.deliveryTime}
							</span>
							<span class="text-gray-400">•</span>
							<span class="flex items-center">
								<MapPin class="mr-1 h-3 w-3" />
								{item.deliveryRange}
							</span>
							<span class="text-gray-400">•</span>
							<span class="flex items-center">
								<CircleDollarSign class="mr-1 h-3 w-3" />${item.deliveryPrice.toFixed(2)} Delivery
							</span>
						</div>

						<div class="mt-3 flex items-center justify-between">
							<div class="flex items-center text-amber-500">
								<Star class="h-4 w-4 fill-current" />
								<span class="ml-1 text-sm">{item.rating}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Discover markets section -->
	<div class="mb-10">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-xl font-medium">Popular Markets</h3>
		</div>

		<div class="scrollbar-hide flex gap-4 overflow-x-auto pb-4">
			{#each filteredItems.slice(0, 6) as item, i (item.id)}
				<div
					class="min-w-[180px] max-w-[200px] flex-shrink-0 overflow-hidden rounded-lg bg-card shadow-sm transition-all duration-300 hover:shadow-md"
					in:fly|global={{ x: 20, delay: i * 50, duration: 200 }}
				>
					<img src={item.image} alt={item.name} class="h-24 w-full object-cover" />
					<div class="p-3">
						<h4 class="line-clamp-1 text-sm font-medium">{item.name}</h4>
						<div class="mt-2 flex items-center justify-between text-xs">
							<span class="text-muted-foreground">{item.category}</span>
							<div class="flex items-center text-amber-500">
								<Star class="h-3 w-3 fill-current" />
								<span class="ml-1">{item.rating}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Additional products grid -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-xl font-medium">More to Explore</h3>
		</div>

		<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
			{#each filteredItems as item, i (item.id)}
				<div
					class="overflow-hidden rounded-lg bg-card shadow-sm transition-all duration-300 hover:shadow-md"
					in:fly|global={{ y: 15, delay: i * 50, duration: 200 }}
				>
					<img src={item.image} alt={item.name} class="h-32 w-full object-cover" />
					<div class="p-3">
						<h4 class="line-clamp-1 text-sm font-medium">{item.name}</h4>
						<div class="mt-1 flex items-center justify-between text-xs">
							<span class="text-muted-foreground">{item.category}</span>
							<div class="flex items-center text-amber-500">
								<Star class="h-3 w-3 fill-current" />
								<span class="ml-1">{item.rating}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
