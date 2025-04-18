<script lang="ts">
	import { fly } from 'svelte/transition';
	import { ThumbsUp, TrendingUp, Bike, MapPin, CircleDollarSign, Star } from 'lucide-svelte';

	// Define the type for the props, including the index 'i' for the transition
	type ExploreItem = {
		image: string | null;
		name: string;
		isPopular?: boolean;
		isTrending?: boolean;
		description: string | null;
		deliveryTime: string;
		deliveryRange: number;
		deliveryPrice: number;
		rating: number | null;
		i: number; // Index for transition delay
		slug: string | null; // Add slug for restaurant link
	};

	// Define and destructure props using Svelte 5 $props rune
	let {
		image,
		name,
		isPopular,
		isTrending,
		description,
		deliveryTime,
		deliveryRange,
		deliveryPrice,
		rating,
		i,
		slug
	}: ExploreItem = $props();
</script>

<a
	href="/restaurant/{slug}"
	class="overflow-hidden rounded-xl bg-card shadow-md transition-all duration-300 hover:shadow-lg"
	in:fly|global={{ y: 20, delay: i * 75, duration: 250 }}
>
	<div class="relative h-48">
		{#if image}
			<img src={image} alt={name} class="h-full w-full object-cover" />
		{:else}
			<div class="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
				<span class="text-4xl font-bold">{name.charAt(0)}</span>
			</div>
		{/if}
		{#if isPopular}
			<div
				class="absolute left-3 top-3 flex items-center rounded-md bg-yellow-500/90 px-2 py-1 text-xs text-white"
			>
				<ThumbsUp class="mr-1 h-3 w-3" />
				Popular
			</div>
		{/if}
		{#if isTrending}
			<div
				class="absolute right-3 top-3 flex items-center rounded-md bg-blue-500/90 px-2 py-1 text-xs text-white"
			>
				<TrendingUp class="mr-1 h-3 w-3" />
				Trending
			</div>
		{/if}
	</div>
	<div class="p-4">
		<h3 class="mb-1 text-lg font-medium">{name}</h3>
		<p class="mb-2 line-clamp-1 text-sm text-muted-foreground">{description}</p>

		<div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
			<span class="flex items-center">
				<Bike class="mr-1 h-3 w-3" />
				{deliveryTime}
			</span>
			<span class="text-gray-400">•</span>
			<span class="flex items-center">
				<MapPin class="mr-1 h-3 w-3" />
				{deliveryRange}KM
			</span>
			<span class="text-gray-400">•</span>
			<span class="flex items-center">
				<CircleDollarSign class="mr-1 h-3 w-3" />${deliveryPrice.toFixed(2)} Delivery
			</span>
		</div>

		<div class="flex items-center text-amber-500">
			<Star class="h-4 w-4 fill-current" />
			<span class="ml-1 text-sm">{rating}</span>
		</div>
	</div>
</a>
