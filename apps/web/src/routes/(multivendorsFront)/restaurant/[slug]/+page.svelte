<script lang="ts">
	import { client } from '$lib/hc';
	import MenuItemCard from '$lib/components/MenuItemCard.svelte';
	import ProductModal from '$lib/components/modal/ProductModal.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import Ticket from '$lib/components/Ticket.svelte';
	import { Bike, Search, MapPin, Clock, Info, ShoppingCart } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { page } from '$app/state';
	let activeCategory = $state('');
	let searchQuery = $state('');
	let isMoreInfoOpen = $state(false);

	let { data } = $props();

	// Reactive check for cart items
	const hasCartItems = $derived(data.shopCart && data.shopCart.items.length > 0);

	// Function to handle cart button click
	function handleCartClick() {
		console.log('Cart Items:', data.shopCart);
		// TODO: Implement navigation or modal display for the cart
	}

	// Effect to check for cart items for this restaurant on load
	

	// Extract menu categories and their items from API data
	const categories = $derived(
		data.restaurant.menuCategories?.map((category) => category.name) || []
	);

	// Get all menu items from all categories
	const allMenuItems = $derived(
		data.restaurant.menuCategories?.flatMap(
			(category) =>
				category.menus?.map((menu) => ({
					...menu,
					category: category.name
				})) || []
		) || []
	);

	// Filter menu items based on search query
	const filteredMenu = $derived(
		searchQuery
			? allMenuItems.filter(
					(item) =>
						item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.category?.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: allMenuItems
	);

	// Group menu items by category
	const menuByCategory = $derived(
		categories.reduce(
			(acc, category) => {
				acc[category] = filteredMenu.filter((item) => item.category === category);
				return acc;
			},
			{} as Record<string, typeof allMenuItems>
		)
	);

	// Check if category has any items after filtering
	const hasItemsInCategory = $derived((category: string) => menuByCategory[category]?.length > 0);

	// Smooth scroll to category section
	function scrollToCategory(category: string) {
		activeCategory = category;
		const element = document.getElementById(`category-${category}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// Update active category on scroll
	function handleScroll() {
		const sections = categories.map((category) => ({
			category,
			element: document.getElementById(`category-${category}`)
		}));

		const activeSection = sections.find(({ element }) => {
			if (!element) return false;
			const rect = element.getBoundingClientRect();
			return rect.top <= 200 && rect.bottom >= 200;
		});

		if (activeSection) {
			activeCategory = activeSection.category;
		}
	}

	// Clear search
	function clearSearch() {
		searchQuery = '';
	}

	// Format time from 24hr to 12hr format
	function formatTime(time: string): string {
		if (!time) return '';
		const [hour, minute] = time.split(':').map(Number);
		const period = hour >= 12 ? 'PM' : 'AM';
		const formattedHour = hour % 12 || 12;
		return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
	}

	// Get current day's operating hours
	const getCurrentDayHours = (): string => {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const today = days[new Date().getDay()];

		const todayHours = data.restaurant.operatingHours?.find(
			(h) => h.day.toLowerCase() === today.toLowerCase()
		);

		if (todayHours) {
			if (
				todayHours.isOpen === false ||
				todayHours.openTime === todayHours.closeTime ||
				!todayHours.openTime ||
				!todayHours.closeTime
			) {
				return 'Closed';
			}
			return `${formatTime(todayHours.openTime)}–${formatTime(todayHours.closeTime)}`;
		}
		return 'Closed';
	};
</script>

<svelte:window on:scroll={handleScroll} />

<!-- Modern Mobile-First Redesign -->
<div class="mx-auto max-w-4xl container px-2 sm:px-4 py-4 md:py-8 pb-24"> <!-- Added padding-bottom -->
	<!-- Restaurant Header -->
	<div class="relative mb-6 md:mb-10">
		<div class="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-md md:aspect-[4/1]">
			<img
				src={data.restaurant.coverImage || '/shop.avif'}
				alt={data.restaurant.name}
				class="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
				loading="eager"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
		</div>
		<!-- Floating Logo -->
		<div class="absolute left-4 -bottom-10 z-20 size-20 md:size-28 rounded-2xl border-4 border-white bg-white shadow-lg flex items-center justify-center">
			<img
				src={data.restaurant.logo || '/shop.avif'}
				alt={`${data.restaurant.name} logo`}
				class="h-16 w-16 md:h-24 md:w-24 object-cover rounded-xl"
			/>
		</div>
	</div>
	<!-- Restaurant Info Card -->
	<div class="bg-white rounded-2xl shadow p-4 pt-12 -mt-10 mb-4 md:mb-8 relative">
		<h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{data.restaurant.name}</h1>
		<p class="text-gray-600 text-sm mb-2 line-clamp-2">{data.restaurant.description}</p>
		<div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
			<span class="flex items-center gap-1"><span class="text-yellow-500">★</span>{data.restaurant.totalRatings || 0}</span>
			<span>•</span>
			<span class="flex items-center gap-1"><Bike class="size-4" />{data.restaurant.deliveryType}</span>
			<span>•</span>
			<span>Open until {getCurrentDayHours()}</span>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if data.restaurant.tags}
				{#each data.restaurant.tags as tag}
					<Badge>{tag}</Badge>
				{/each}
			{:else}
				<span class="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">{data.restaurant.shopType}</span>
			{/if}
		</div>
	</div>

	<!-- Sticky Category Nav (bottom on mobile, top on desktop) -->
	<nav class="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-md flex md:static md:shadow-none md:border-none md:bg-transparent md:mb-4 overflow-x-auto px-2 py-2 md:py-0 gap-2 md:gap-4 md:justify-start md:rounded-xl md:max-w-4xl md:mx-auto">
		{#each categories as category}
			{#if !searchQuery || hasItemsInCategory(category)}
				<button
					onclick={() => scrollToCategory(category)}
					class="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-200 {activeCategory === category ? 'bg-primary text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					{category}
				</button>
			{/if}
		{/each}
	</nav>

	<!-- Floating Search Bar -->
	<div class="sticky top-2 z-20 flex justify-center mb-4">
		<div class="relative w-full max-w-md">
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search menu..."
				class="w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
			/>
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<Search class="size-4 text-gray-400" />
			</div>
			{#if searchQuery}
				<button
					onclick={clearSearch}
					class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
				>
					✕
				</button>
			{/if}
		</div>
	</div>

	<!-- Menu Content -->
	{#if searchQuery}
		<!-- Search Results View -->
		<div class="py-4 md:py-8">
			{#if searchQuery && filteredMenu.length > 0}
				<div class="mb-6">
					<h2 class="text-xl font-semibold text-gray-900">Results for "{searchQuery}"</h2>
					<p class="mt-1 text-sm text-gray-600">Found {filteredMenu.length} items</p>
				</div>
				{#each categories as category}
					{#if hasItemsInCategory(category)}
						<div class="mb-8">
							<div class="mb-2 flex items-center justify-between">
								<h3 class="text-base font-medium text-gray-900">{category}</h3>
								<span class="text-xs text-gray-500">{menuByCategory[category].length} items</span>
							</div>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
								{#each menuByCategory[category] as item (item.id)}
									<ProductCard {...item} />
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			{:else}
				<div class="py-12 text-center">
					<p class="text-lg text-gray-600">No menu items found matching "{searchQuery}"</p>
					<button onclick={clearSearch} class="mt-4 text-sm text-primary hover:text-primary/80">Clear search</button>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Regular Menu View -->
		{#each categories as category}
			<div id="category-{category}" class="scroll-mt-28 py-6 md:py-10">
				<h2 class="mb-3 text-xl font-semibold">{category}</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
					{#each menuByCategory[category] as item (item.id)}
						<ProductCard {...item} />
					{/each}
				</div>
			</div>
		{/each}
	{/if}

	<!-- Store Information -->
	<div class="mt-12 border-t border-gray-100 pt-8">
		<div class="grid gap-8 md:grid-cols-2">
			<!-- Address and Map -->
			<div>
				<h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
					<MapPin class="size-5" />
					Location & Contact
				</h2>
				<div class="space-y-1">
					<p class="font-medium">{data.restaurant.address}</p>
					<p class="text-gray-600">Phone: {data.restaurant.phoneNumber}</p>
					{#if data.restaurant.longitude}
						<a
							href="https://maps.google.com/?q={data.restaurant.latitude},{data.restaurant.longitude}"
							target="_blank"
							rel="noopener noreferrer"
							class="mt-1 inline-flex items-center text-sm text-primary hover:text-primary/80"
						>
							See on map
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
						</a>
					{/if}
				</div>
			</div>
			<!-- Opening Hours -->
			<div>
				<h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
					<Clock class="size-5" />
					Operating Hours
				</h2>
				<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
					{#if data.restaurant.operatingHours && data.restaurant.operatingHours.length > 0}
						{#each data.restaurant.operatingHours.sort((a, b) => {
							const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
							return days.indexOf(a.day) - days.indexOf(b.day);
						}) as hour}
							<div class="font-medium">{hour.day}</div>
							<div class="text-gray-600">{!hour.isOpen || hour.openTime === hour.closeTime || !hour.openTime || !hour.closeTime ? 'Closed' : `${formatTime(hour.openTime)}–${formatTime(hour.closeTime)}`}</div>
						{/each}
						{#each ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as day}
							{#if !data.restaurant.operatingHours.some((h) => h.day === day)}
								<div class="font-medium">{day}</div>
								<div class="text-gray-600">Closed</div>
							{/if}
						{/each}
					{:else}
						<div class="col-span-2 text-gray-600">No operating hours available</div>
					{/if}
				</div>
			</div>
		</div>
		<!-- More Info Accordion -->
		<div class="mt-8">
			<button
				onclick={() => (isMoreInfoOpen = !isMoreInfoOpen)}
				class="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left hover:bg-gray-50 transition-colors"
			>
				<span class="flex items-center gap-2 text-base font-medium">
					<Info class="size-5" />
					More information
				</span>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transform transition-transform duration-200" class:rotate-180={isMoreInfoOpen}><polyline points="6 9 12 15 18 9" /></svg>
			</button>
			{#if isMoreInfoOpen}
				<div class="mt-4 space-y-4 rounded-xl border border-gray-100 p-4 bg-white shadow-sm transition-all duration-300">
					<div>
						<h3 class="font-medium">About Us</h3>
						<p class="mt-1 text-sm text-gray-600">{data.restaurant?.description}</p>
					</div>
					<div>
						<h3 class="font-medium">Delivery Information</h3>
						<ul class="mt-1 space-y-1 text-sm text-gray-600">
							<li>• Delivery Type: {data.restaurant?.deliveryType}</li>
							{#if data.restaurant?.minimumOrderAmount}
								<li>• Minimum Order: ${data.restaurant.minimumOrderAmount}</li>
							{/if}
						</ul>
					</div>
					<div>
						<h3 class="font-medium">Contact</h3>
						<ul class="mt-1 space-y-1 text-sm text-gray-600">
							<li>• Phone: {data.restaurant?.phoneNumber}</li>
							<li>• Email: {data.restaurant?.email}</li>
							{#if data.restaurant?.website}
								<li>• Website: <a href={data.restaurant.website} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">{data.restaurant.website}</a></li>
							{/if}
						</ul>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Floating Cart Button -->
	{#if hasCartItems}
		<button
			onclick={handleCartClick}
			class="fixed bottom-20 right-4 z-40 flex items-center justify-center rounded-lg bg-primary p-3 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:bottom-6 md:right-6"
			aria-label="View Cart"
		>
			<ShoppingCart class="size-6" />
			<span class="ml-2 text-sm font-medium">View Cart ({data.shopCart.items.length})</span>
		</button>
	{/if}
</div>
<ProductModal title="Product Modal" />
