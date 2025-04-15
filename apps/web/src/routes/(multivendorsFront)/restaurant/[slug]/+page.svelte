<script lang="ts">
	import MenuItemCard from '$lib/components/MenuItemCard.svelte';
	import ProductModal from '$lib/components/modal/ProductModal.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import Ticket from '$lib/components/Ticket.svelte';
	import { Bike, Search, MapPin, Clock, Info } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { page } from '$app/state';
	let activeCategory = $state('');
	let searchQuery = $state('');
	let isMoreInfoOpen = $state(false);

	let { data } = $props();
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

<div class="mx-auto max-w-7xl container py-8 sm:px-6 lg:px-8">
	<div class="mb-8">
		<div class="relative mb-4 overflow-hidden">
			<!-- Cover Image with smaller aspect ratio -->
			<div class="relative aspect-[16/6] w-full overflow-hidden rounded-lg md:aspect-[4/1]">
				<img
					src={data.restaurant.coverImage || '/shop.avif'}
					alt={data.restaurant.name}
					class="h-full w-full object-cover object-center"
					loading="eager"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
				></div>
			</div>

			<!-- Restaurant Info -->
			<div class="relative px-3 sm:px-4">
				<div class="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
					<!-- Logo -->
					<div
						class="z-10 -mt-12 size-20 overflow-hidden rounded-lg border-2 border-white bg-white shadow-lg sm:size-24 md:-mt-14"
					>
						<img
							src={data.restaurant.logo || '/shop.avif'}
							alt={`${data.restaurant.name} logo`}
							class="h-full w-full object-cover"
						/>
					</div>

					<!-- Restaurant Details -->
					<div class="flex-1 pb-1">
						<h1
							class="text-xl font-bold capitalize tracking-tight text-gray-900 sm:text-2xl md:text-3xl"
						>
							{data.restaurant.name}
						</h1>
						<p class="mt-1 line-clamp-2 text-sm text-gray-600">
							{data.restaurant.description}
						</p>
					</div>
				</div>
			</div>
		</div>
		<div class="mt-4 flex items-center text-xs">
			<span class="text-yellow-500">★</span>
			<span class="ml-1">{data.restaurant.totalRatings || 0}</span>
			<span class="mx-2">•</span>
			<div class="flex items-center gap-1">
				<Bike class="size-4" />
				<span>{data.restaurant.deliveryType}</span>
			</div>
			<span class="mx-2">•</span>
			<span> Open until {getCurrentDayHours()} </span>
		</div>
		<div class="mt-2 flex flex-wrap gap-2">
			{#if data.restaurant.tags}
				{#each data.restaurant.tags as tag, index}
					<Badge>
						{tag}
					</Badge>
				{/each}
			{:else}
				<span class="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
					{data.restaurant.shopType}
				</span>
			{/if}
		</div>
	</div>
	<!-- <Ticket /> -->

	<!-- Category Navigation and Search -->
	<div
		class="sticky top-0 z-10 -mx-4 bg-white px-4 py-4 shadow-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
	>
		<div class="flex items-center justify-between gap-4">
			<!-- Categories -->
			<div class="flex flex-1 gap-4 overflow-x-auto">
				{#each categories as category}
					{#if !searchQuery || hasItemsInCategory(category)}
						<button
							onclick={() => scrollToCategory(category)}
							class="whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium transition-colors {activeCategory ===
							category
								? 'bg-primary text-primary-foreground'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}</a>"
						>
							{category}
						</button>
					{/if}
				{/each}
			</div>

			<!-- Search Bar -->
			<div class="relative flex w-full max-w-xs items-center">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<Search class="size-4 text-gray-400" />
				</div>
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Search menu..."
					class="w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
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
	</div>

	<!-- Menu Content -->
	{#if searchQuery}
		<!-- Search Results View -->
		<div class="py-8">
			<!-- Searching State -->
			{#if searchQuery && filteredMenu.length > 0}
				<div class="mb-8">
					<h2 class="text-2xl font-semibold text-gray-900">Results for "{searchQuery}"</h2>
					<p class="mt-2 text-sm text-gray-600">Found {filteredMenu.length} items</p>
				</div>

				<!-- Categorized Results -->
				{#each categories as category}
					{#if hasItemsInCategory(category)}
						<div class="mb-12">
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-lg font-medium text-gray-900">{category}</h3>
								<span class="text-sm text-gray-500">{menuByCategory[category].length} items</span>
							</div>
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{#each menuByCategory[category] as item (item.id)}
									<ProductCard {...item} />
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			{:else if searchQuery}
				<!-- No Results State -->
				<div class="py-12 text-center">
					<p class="text-lg text-gray-600">No menu items found matching "{searchQuery}"</p>
					<button onclick={clearSearch} class="mt-4 text-sm text-primary hover:text-primary/80">
						Clear search
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Regular Menu View -->
		{#each categories as category}
			<div id="category-{category}" class="scroll-mt-24 py-8">
				<h2 class="mb-4 text-2xl font-semibold">{category}</h2>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each menuByCategory[category] as item (item.id)}
						<ProductCard {...item} />
					{/each}
				</div>
			</div>
		{/each}
	{/if}

	<!-- Store Information -->
	<div class="mt-16 border-t border-gray-200 pt-8">
		<div class="grid gap-8 md:grid-cols-2">
			<!-- Address and Map -->
			<div>
				<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
					<MapPin class="size-5" />
					Location & Contact
				</h2>
				<div class="space-y-2">
					<p class="font-medium">{data.restaurant.address}</p>
					<p class="text-gray-600">Phone: {data.restaurant.phoneNumber}</p>
					{#if data.restaurant.longitude}
						<a
							href="https://maps.google.com/?q={data.restaurant.latitude},{data.restaurant.longitude}"
							target="_blank"
							rel="noopener noreferrer"
							class="mt-2 inline-flex items-center text-sm text-primary hover:text-primary/80"
						>
							See on map
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="ml-1"
							>
								<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
								<polyline points="15 3 21 3 21 9" />
								<line x1="10" y1="14" x2="21" y2="3" />
							</svg>
						</a>
					{/if}
				</div>
			</div>

			<!-- Opening Hours -->
			<div>
				<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
					<Clock class="size-5" />
					Operating Hours
				</h2>
				<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
					{#if data.restaurant.operatingHours && data.restaurant.operatingHours.length > 0}
						{#each data.restaurant.operatingHours.sort((a, b) => {
							const days = ['Monday', 'Tuesday', 'Wednesday', 'Thur</div>sday', 'Friday', 'Saturday', 'Sunday'];
							return days.indexOf(a.day) - days.indexOf(b.day);
						}) as hour}
							<div class="font-medium">{hour.day}</div>
							<div class="text-gray-600">
								{#if !hour.isOpen || hour.openTime === hour.closeTime || !hour.openTime || !hour.closeTime}
									Closed
								{:else}
									{formatTime(hour.openTime)}–{formatTime(hour.closeTime)}
								{/if}
							</div>
						{/each}

						<!-- Check for missing days and show them as closed -->
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

		<!-- Additional Information -->
		<div class="mt-8">
			<button
				onclick={() => (isMoreInfoOpen = !isMoreInfoOpen)}
				class="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50"
			>
				<span class="flex items-center gap-2 text-lg font-medium">
					<Info class="size-5" />
					More information
				</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="transform transition-transform duration-200"
					class:rotate-180={isMoreInfoOpen}
				>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>
			{#if isMoreInfoOpen}
				<div class="mt-4 space-y-4 rounded-lg border border-gray-200 p-4">
					<div>
						<h3 class="font-medium">About Us</h3>
						<p class="mt-1 text-sm text-gray-600">
							{data.restaurant.description}
						</p>
					</div>
					<div>
						<h3 class="font-medium">Delivery Information</h3>
						<ul class="mt-1 space-y-1 text-sm text-gray-600">
							<li>• Delivery Type: {data.restaurant.deliveryType}</li>
							{#if data.restaurant?.minimumOrderAmount }
								<li>• Minimum Order: ${data.restaurant.minimumOrderAmount}</li>
							{/if}
						</ul>
					</div>
					<div>
						<h3 class="font-medium">Contact</h3>
						<ul class="mt-1 space-y-1 text-sm text-gray-600">
							<li>• Phone: {data.restaurant.phoneNumber}</li>
							<li>• Email: {data.restaurant.email}</li>
							{#if data.restaurant.website}
								<li>
									• Website: <a
										href={data.restaurant.website}
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary hover:underline">{data.restaurant.website}</a
									>
								</li>
							{/if}
						</ul>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
<ProductModal title="Product Modal" />
