<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { MapPin, ArrowRight, Search, ShoppingBag, Bike } from 'lucide-svelte';
	import RestaurantList from '$lib/components/RestaurantList.svelte';
	import PlacesInput from '$lib/components/ui/places-input/places-input.svelte';
	import { activeLocation } from '$lib/states/locationState.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import SEO from '$lib/components/SEO.svelte';
	import { siteConfig } from '$lib/config/site.js';

	let { data } = $props();

	// function searchLocation() {
	// 	if (
	// 		activeLocation.current.address &&
	// 		activeLocation.current.lat &&
	// 		activeLocation.current.lng
	// 	) {
	// 		goto('/explore');
	// 	} else {
	// 		toast.error('Please select a valid address from the suggestions.');
	// 	}
	// }

	// $effect(() => {
	// 	if (activeLocation.current.address) {
	// 		goto('/explore');
	// 	}
	// });

	// Prepare structured data for organization
	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: siteConfig.twitterUrl,
		url: siteConfig.url,
		logo: siteConfig.logo,
		description: siteConfig.description,
		address: {
			'@type': 'PostalAddress',
			addressCountry: 'NG',
			addressLocality: 'Lagos'
		},
		contactPoint: {
			'@type': 'ContactPoint',
			telephone: siteConfig.number,
			contactType: 'customer service',
			areaServed: 'NG',
			availableLanguage: ['en']
		},
		sameAs: [
			'https://facebook.com/azuminigeria',
			'https://twitter.com/azuminigeria',
			'https://instagram.com/azuminigeria'
		]
	};
</script>

<SEO
	title={siteConfig.title}
	description={siteConfig.description}
	keywords={siteConfig.keywords}
	ogType="website"
	path="/"
	jsonLd={structuredData}
/>

<div
	class="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground"
>
	<!-- Hero Section -->
	<div class="relative isolate overflow-hidden pt-14">
		<!-- Background Image and Darker Overlay -->
		<img
			src="/hero-1.jpeg"
			alt="Diverse food options background"
			class="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
		/>
		<div class="absolute inset-0 -z-10 bg-black/10" aria-hidden="true" />

		<!-- Content -->
		<div class="mx-auto max-w-3xl px-4 py-24 lg:py-32">
			<div class="text-center">
				<h1
					class="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl"
				>
					Your City's Flavors, Delivered.
				</h1>
				<p class="mt-6 text-lg leading-8 text-gray-200 drop-shadow">
					Discover local restaurants, markets, and shops near you. Enter your address to begin.
				</p>

				<div class="mx-auto mt-10 max-w-xl">
					<form
						onsubmit={(e) => {
							e.preventDefault();
						}}
						class="flex items-center gap-2 rounded-full bg-white/90 p-2 shadow-xl backdrop-blur-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background/50"
					>
						<MapPin class="ml-2 h-5 w-5 flex-shrink-0 text-muted-foreground" />
						<PlacesInput
							class="h-12 flex-1 border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/80"
							placeholder="Enter delivery address or zip code"
							onPlaceSelect={(p) => {
								activeLocation.current = {
									name: p.name,
									address: p.address,
									lat: p.lat,
									lng: p.lng
								};
								goto('/explore');
							}}
						/>
						<Button
							type="submit"
							size="icon"
							class="flex-shrink-0 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
							aria-label="Search for locations"
						>
							<ArrowRight class="size-5" />
						</Button>
					</form>
				</div>
			</div>
		</div>
	</div>

	<!-- How It Works Section -->
	<div class="bg-gradient-to-b from-muted/30 via-background to-background py-20 sm:py-28">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl lg:text-center">
				<h2 class="text-base font-semibold leading-7 text-primary">Simple Steps</h2>
				<p class="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					Everything you need, just a few clicks away
				</p>
				<p class="mt-6 text-lg leading-8 text-muted-foreground">
					Follow these easy steps to get started with finding local vendors and getting deliveries.
				</p>
			</div>
			<div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
				<dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
					<!-- Step 1 -->
					<div
						class="flex flex-col rounded-lg bg-card p-6 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
					>
						<dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
							>
								<Search class="h-6 w-6" aria-hidden="true" />
							</div>
							Find Vendors Nearby
						</dt>
						<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
							<p class="flex-auto">
								Enter your address or zip code above to discover a wide variety of restaurants,
								local markets, and shops available in your area.
							</p>
						</dd>
					</div>

					<!-- Step 2 -->
					<div
						class="flex flex-col rounded-lg bg-card p-6 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
					>
						<dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
							>
								<ShoppingBag class="h-6 w-6" aria-hidden="true" />
							</div>
							Browse & Order
						</dt>
						<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
							<p class="flex-auto">
								Explore menus and product lists. Add items to your cart and proceed to checkout
								securely when you're ready.
							</p>
						</dd>
					</div>

					<!-- Step 3 -->
					<div
						class="flex flex-col rounded-lg bg-card p-6 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
					>
						<dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
							>
								<Bike class="h-6 w-6" aria-hidden="true" />
							</div>
							Fast Delivery
						</dt>
						<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
							<p class="flex-auto">
								Sit back and relax! Your order will be prepared and delivered straight to your
								doorstep quickly and efficiently.
							</p>
						</dd>
					</div>
				</dl>
			</div>
		</div>
	</div>
</div>
