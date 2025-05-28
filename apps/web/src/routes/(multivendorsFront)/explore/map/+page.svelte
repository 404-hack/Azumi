<script lang="ts">
	import GoogleMapComponent from '$lib/components/GoogleMapComponent.svelte';
	import FilterModal from '$lib/components/modal/FilterModal.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Map, List, Filter, Search } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();

	let selectedShop = $state(null);
	let showShopDetails = $state(false);

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
				geo: {
					'@type': 'GeoCoordinates',
					latitude: shop.latitude,
					longitude: shop.longitude
				},
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
				}
			}
		}))
	};

	function handleShopClick(shop) {
		selectedShop = shop;
		showShopDetails = true;
	}

	function goToListView() {
		const currentParams = new URLSearchParams(page.url.search);
		goto(`/explore/shops?${currentParams.toString()}`);
	}
</script>

<SEO
	title="Shop Map View | Interactive Map - Azumi"
	description="Explore shops near you on an interactive map. See locations, ratings, and get directions to your favorite stores and restaurants in Nigeria."
	keywords="shop map, interactive map Nigeria, restaurant locations, store finder, map view"
	ogType="website"
	path="/explore/map"
	jsonLd={structuredData}
/>

<div in:fade={{ duration: 300 }} class="mx-auto py-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="mb-2 text-xl font-semibold md:text-3xl">
				{data.category === 'restaurant' ? 'Restaurants' : 'Shops'} Near You - Map View
			</h1>
			<p class="text-muted-foreground">
				Explore {data.shops.length} {data.category === 'restaurant' ? 'restaurants' : 'shops'} on the map
			</p>
		</div>
		
		<div class="flex items-center gap-2">
			<FilterModal />
			<Button variant="outline" onclick={goToListView} class="flex items-center gap-2">
				<List class="h-4 w-4" />
				List View
			</Button>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2">
			<GoogleMapComponent 
				shops={data.shops} 
				userLocation={data.userLocation} 
				onShopClick={handleShopClick}
			/>
		</div>

		<div class="space-y-4">
			<div class="rounded-lg border bg-card p-4">
				<h3 class="mb-3 font-semibold">Quick Stats</h3>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p class="text-muted-foreground">Total Shops</p>
						<p class="text-lg font-semibold">{data.shops.length}</p>
					</div>
					<div>
						<p class="text-muted-foreground">Open Now</p>
						<p class="text-lg font-semibold text-green-600">
							{data.shops.filter(shop => shop.isOpen).length}
						</p>
					</div>
				</div>
			</div>

			<div class="max-h-96 space-y-2 overflow-y-auto rounded-lg border bg-card p-4">
				<h3 class="mb-3 font-semibold">Nearby Shops</h3>
				{#each data.shops.slice(0, 10) as shop}
					<div class="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
						<div class="flex-1">
							<h4 class="font-medium">{shop.name}</h4>
							<div class="flex items-center gap-2 text-sm text-muted-foreground">
								<span>{shop.distance?.toFixed(1)} km</span>
								{#if shop.averageRating}
									<span>★ {shop.averageRating.toFixed(1)}</span>
								{/if}
								{#if shop.isOpen !== undefined}
									<span class={shop.isOpen ? 'text-green-600' : 'text-red-600'}>
										{shop.isOpen ? 'Open' : 'Closed'}
									</span>
								{/if}
							</div>
						</div>
						<Button 
							variant="ghost" 
							size="sm"
							onclick={() => goto(`/restaurant/${shop.slug}`)}
						>
							View
						</Button>
					</div>
				{/each}
			</div>
		</div>
	</div>

	{#if data.shops.length === 0}
		<div class="py-12 text-center">
			<Map class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
			<h3 class="mb-2 text-lg font-semibold">No shops found in this area</h3>
			<p class="text-muted-foreground mb-4">Try adjusting your filters or expanding your search area.</p>
			<Button onclick={() => goto('/explore/shops')}>
				Browse All Shops
			</Button>
		</div>
	{/if}
</div>