<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Search, MapPin, Loader2, Navigation } from 'lucide-svelte';
	import RestaurantList from '$lib/components/RestaurantList.svelte';
	import { onMount } from 'svelte';
	import { client } from '$lib/hc';
	import type { TShop } from '@repo/server/types';

	const categories = [
		{ name: 'All', icon: '🌟' },
		{ name: 'Fast Food', icon: '🍔' },
		{ name: 'Pizza', icon: '🍕' },
		{ name: 'Sushi', icon: '🍱' },
		{ name: 'Italian', icon: '🍝' },
		{ name: 'Mexican', icon: '🌮' },
		{ name: 'Vegetarian', icon: '🥗' }
	];

	let searchTerm = $state('');
	let selectedCategory = $state('All');
	let location = $state('Enter your delivery address');

	// New location-related states
	let userCoordinates = $state<{ lat: number; lng: number } | null>(null);
	let isLocating = $state(false);
	let locationError = $state<string | null>(null);
	let shops = $state<TShop[]>([]);
	let isLoading = $state(false);
	let userLocation = $state<{ latitude: number; longitude: number } | null>(null); // New state for user location

	async function detectLocation() {
		if (!navigator.geolocation) {
			locationError = 'Geolocation is not supported by your browser';
			return;
		}

		isLocating = true;
		locationError = null;

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0
				});
			});

			const { latitude: lat, longitude: lng } = position.coords;
			userCoordinates = { lat, lng };

			// Store for future use
			localStorage.setItem('userLat', lat.toString());
			localStorage.setItem('userLng', lng.toString());

			// Update displayed location (you could use a reverse geocoding API here)
			location = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

			// Fetch nearby shops
			await fetchNearbyShops();
		} catch (error: any) {
			console.error('Error getting location', error);
			locationError = error.message || 'Unable to get your location';
		} finally {
			isLocating = false;
		}
	}

	// Fetch nearby shops using coordinates

	// Load saved location on mount
	let { data } = $props();
</script>

<!-- Updated location input with button -->
<div class="relative flex-1">
	<MapPin class="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
	<Input
		type="text"
		placeholder="Enter your delivery address"
		class="pl-10"
		bind:value={location}
	/>
	<Button
		variant="ghost"
		size="icon"
		class="absolute right-1 top-1"
		onclick={detectLocation}
		disabled={isLocating}
	>
		{#if isLocating}
			<Loader2 class="h-4 w-4 animate-spin" />
		{:else}
			<Navigation class="h-4 w-4" />
		{/if}
	</Button>
</div>

<div class="min-h-screen bg-background">
	<!-- Hero Section -->
	<div class="relative">
		<div class="absolute inset-0 overflow-hidden">
			<img src="/food-banner.jpg" alt="Food banner" class="h-full w-full object-cover opacity-50" />
			<div class="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
		</div>

		<div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
					Discover African Cuisine
				</h1>
				<p class="mx-auto mt-4 max-w-2xl text-xl text-muted-foreground">
					Order your favorite African dishes from local restaurants and get them delivered to your
					doorstep
				</p>

				<!-- Search Section -->
				<div class="mx-auto mt-10 max-w-2xl">
					<div class="flex flex-col gap-4 rounded-lg bg-card p-4 shadow-lg sm:flex-row">
						<div class="relative flex-1">
							<MapPin class="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Enter your delivery address"
								class="pl-10"
								bind:value={location}
							/>
						</div>
						<div class="relative flex-1">
							<Search class="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search restaurants or dishes"
								class="pl-10"
								bind:value={searchTerm}
							/>
						</div>
					</div>
				</div>
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
		<RestaurantList {searchTerm} restaurants={data.restaurants} category={selectedCategory} />
	</div>
</div>

<style>
	:global(.dark) {
		--banner-opacity: 0.3;
	}
</style>
