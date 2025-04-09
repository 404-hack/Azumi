<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { MapPin, ArrowRight } from 'lucide-svelte';
	import RestaurantList from '$lib/components/RestaurantList.svelte';
	import PlacesInput from '$lib/components/ui/places-input/places-input.svelte';

	const categories = [
		{ name: 'All', icon: '🌟' },
		{ name: 'Fast Food', icon: '🍔' },
		{ name: 'Pizza', icon: '🍕' },
		{ name: 'Sushi', icon: '🍱' },
		{ name: 'Italian', icon: '🍝' },
		{ name: 'Mexican', icon: '🌮' },
		{ name: 'Vegetarian', icon: '🥗' }
	];

	let selectedCategory = $state('All');
</script>

<div class="min-h-screen bg-background">
	<!-- Hero Section -->
	<div class="relative">
		<div class="absolute inset-0 overflow-hidden">
			<img src="/hero-1.png" alt="Food banner" class="h-full w-full object-cover object-top" />
			<div class="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />
		</div>

		<div class="relative mx-auto max-w-7xl px-4 py-52 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class=" font-bold tracking-tight text-foreground sm:text-xl md:text-5xl">
					Discover restaurants and more near you.
				</h1>

				<!-- Search Section -->
				<div class="mx-auto mt-10 max-w-md">
					<div
						class="relative flex items-center gap-2 rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
					>
						<MapPin class="h-5 w-5 text-muted-foreground" />
						<input
							type="text"
							placeholder="Enter your delivery address"
							class="h-14 flex-1 border-none outline-none"
						/>
						<Button size="icon" class="shadow-md">
							<ArrowRight class="size-5" />
						</Button>
					</div>
				</div>
				<PlacesInput />
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Categories -->
		<div class="mb-12">
			<h2 class="mb-6 text-2xl font-semibold tracking-tight">Popular Categories</h2>
			<div class="flex flex-wrap gap-4">
				{#each categories as { name, icon }}
					<Button
						variant={selectedCategory === name ? 'default' : 'outline'}
						class="flex items-center gap-2 rounded-full px-6"
						onclick={() => (selectedCategory = name)}
					>
						<span class="text-xl">{icon}</span>
						<span>{name}</span>
					</Button>
				{/each}
			</div>
		</div>

		<!-- Restaurant List -->
		<!-- <RestaurantList {searchTerm} restaurants={data.restaurants} category={selectedCategory} /> -->
	</div>
</div>
