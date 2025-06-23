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
	class="from-background via-background to-muted/30 text-foreground min-h-screen bg-gradient-to-b"
>
	<!-- Hero Section -->
	<div class="relative isolate overflow-hidden pt-14">
		<!-- Background Image and Darker Overlay -->
		<img
			src="/hero-2.avif"
			alt="Diverse food options background"
			class="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
		/>
		<div class="absolute inset-0 -z-10 bg-black/10" aria-hidden="true" />

		<!-- Content -->
		<div class="mx-auto max-w-3xl px-4 py-20 lg:py-28">
			<div class="text-center">
				<h1
					class="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl"
				>
					Meals in minutes
				</h1>
				<p class="mt-6 text-lg leading-8 text-gray-200 drop-shadow">
					Discover local restaurants, markets, and shops near you. Enter your address to begin.
				</p>

				<div class="mx-auto mt-10 max-w-xl">
					<form
						onsubmit={(e) => {
							e.preventDefault();
						}}
						class="focus-within:ring-primary focus-within:ring-offset-background/50 flex items-center gap-2 rounded-2xl bg-white/90 p-2 shadow-xl backdrop-blur-sm focus-within:ring-2 focus-within:ring-offset-2"
					>
						<MapPin class="text-muted-foreground ml-2 h-5 w-5 flex-shrink-0" />
						<PlacesInput
							class="text-foreground placeholder:text-muted-foreground/80 h-12 flex-1 border-none bg-transparent text-base outline-none"
							placeholder="Enter delivery address"
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
							class="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary flex-shrink-0 rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
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
	<div class="from-muted/30 via-background to-background bg-gradient-to-b py-20 sm:py-28">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl lg:text-center">
				<h2 class="text-primary text-base font-semibold leading-7">Simple Steps</h2>
				<p class="text-foreground mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
					Everything you need, just a few clicks away
				</p>
				<p class="text-muted-foreground mt-6 text-lg leading-8">
					Follow these easy steps to get started with finding local vendors and getting deliveries.
				</p>
			</div>
			<div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
				<dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
					<!-- Step 1 -->
					<div
						class="bg-card hover:shadow-primary/20 flex flex-col rounded-lg p-6 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl"
					>
						<dt class="text-foreground flex items-center gap-x-3 text-base font-semibold leading-7">
							<div
								class="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg"
							>
								<Search class="h-6 w-6" aria-hidden="true" />
							</div>
							Find Vendors Nearby
						</dt>
						<dd class="text-muted-foreground mt-4 flex flex-auto flex-col text-base leading-7">
							<p class="flex-auto">
								Enter your address above to discover a wide variety of restaurants, local markets,
								and shops available in your area.
							</p>
						</dd>
					</div>

					<!-- Step 2 -->
					<div
						class="bg-card hover:shadow-primary/20 flex flex-col rounded-lg p-6 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl"
					>
						<dt class="text-foreground flex items-center gap-x-3 text-base font-semibold leading-7">
							<div
								class="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg"
							>
								<ShoppingBag class="h-6 w-6" aria-hidden="true" />
							</div>
							Browse & Order
						</dt>
						<dd class="text-muted-foreground mt-4 flex flex-auto flex-col text-base leading-7">
							<p class="flex-auto">
								Explore menus and product lists. Add items to your cart and proceed to checkout
								securely when you're ready.
							</p>
						</dd>
					</div>

					<!-- Step 3 -->
					<div
						class="bg-card hover:shadow-primary/20 flex flex-col rounded-lg p-6 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl"
					>
						<dt class="text-foreground flex items-center gap-x-3 text-base font-semibold leading-7">
							<div
								class="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg"
							>
								<Bike class="h-6 w-6" aria-hidden="true" />
							</div>
							Fast Delivery
						</dt>
						<dd class="text-muted-foreground mt-4 flex flex-auto flex-col text-base leading-7">
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
