<script lang="ts">
	import { client } from '$lib/hc';
	import MenuItemCard from '$lib/components/MenuItemCard.svelte';
	import ProductModal from '$lib/components/modal/ProductModal.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import Ticket from '$lib/components/Ticket.svelte';
	import {
		Bike,
		Search,
		MapPin,
		Clock,
		Info,
		ShoppingCart,
		Heart,
		Star,
		Share2,
		Phone,
		Mail
	} from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { page } from '$app/state';
	import CartSheet from '$lib/components/modal/CartSheet.svelte';
	import { cartSheetState } from '$lib/states/modalState.svelte.js';
	import { fly, fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { formatCurrency, formatTime } from '$lib/utils.js';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	let activeCategory = $state('');
	let searchQuery = $state('');
	let isMoreInfoOpen = $state(false);
	let isFavorited = $derived(data.isFavorite);
	let showHeroOverlay = $state(false);

	// Toggle favorite function
	async function toggleFavorite() {
		try {
			const res = await client.favorite.toggle[':shopId'].$post({
				param: { shopId: data.restaurant.id }
			});
			if (res.ok) {
				toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');

				isFavorited = !isFavorited; // Toggle isFavorited after successful removal
			} else {
				toast.error('Failed to remove from favorites');
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
			toast.error('Error updating favorites');
		}
	}

	// Use isOpen from backend data
	const isOpenNow = $derived(data.restaurant.isOpen);

	// Reactive check for cart items
	const hasCartItems = $derived(data.shopCart && data.shopCart.items.length > 0);

	// Calculate total cart amount

	// Function to handle cart button click
	function handleCartClick() {
		cartSheetState.setTrue(); // Open the cart sheet
	}

	// Handle share click
	function handleShare() {
		if (navigator.share) {
			navigator
				.share({
					title: data.restaurant.name,
					text: `Check out ${data.restaurant.name} on African Market`,
					url: window.location.href
				})
				.catch((err) => console.error('Share failed:', err));
		} else {
			navigator.clipboard
				.writeText(window.location.href)
				.then(() => alert('Link copied to clipboard!'))
				.catch((err) => console.error('Copy failed:', err));
		}
	}

	// Get information about when the restaurant will open today (simplified using backend data)
	const getOpeningInfo = $derived.by((): { willOpenToday: boolean; opensAt: string | null } => {
		// If already open, no need to show opening info
		if (isOpenNow) {
			return { willOpenToday: false, opensAt: null };
		}

		const now = new Date();
		const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
		const today = days[now.getDay()];

		const todayHours = data.restaurant.operatingHours?.find(
			(h) => h.day.toUpperCase() === today.toUpperCase()
		);

		// If no hours for today or explicitly closed
		if (
			!todayHours ||
			todayHours.isOpen === false ||
			!todayHours.openTime ||
			!todayHours.closeTime
		) {
			return { willOpenToday: false, opensAt: null };
		}

		// Convert current time to minutes since midnight
		const currentHour = now.getHours();
		const currentMinute = now.getMinutes();
		const currentTimeInMinutes = currentHour * 60 + currentMinute;

		// Convert opening hours to minutes since midnight
		const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
		const openTimeInMinutes = openHour * 60 + openMinute;

		// If not yet open today
		if (currentTimeInMinutes < openTimeInMinutes) {
			return {
				willOpenToday: true,
				opensAt: formatTime(todayHours.openTime) // Use imported formatTime
			};
		}

		// Already closed for the day (or was never open)
		return { willOpenToday: false, opensAt: null };
	});

	// Get current day's operating hours
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
</script>

<svelte:window on:scroll={handleScroll} />
<CartSheet shopCart={data.shopCart} />

<!-- Modern Immersive Redesign -->
<main class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-4">
	<div class="">
		<div class="relative h-64 overflow-hidden rounded-lg">
			<img src="/shop.avif" alt="Kebab Royal" class="absolute inset-0 h-full w-full object-cover" />
			<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"></div>
			<!-- Restaurant Closed Banner Overlay -->
			{#if !isOpenNow}
				<!-- Use isOpenNow derived from backend -->
				<div class="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
					<div class=" rounded-xl text-center text-white backdrop-blur-md">
						{#if getOpeningInfo.willOpenToday}
							<h2 class="mb-2 text-2xl font-bold">Opens Today at {getOpeningInfo.opensAt}</h2>
							<p class="text-white/80">Come back later</p>
						{:else}
							<h2 class="mb-2 text-2xl font-bold">Closed Today</h2>
							<p class="text-white/80">Check our operating hours for other days</p>
						{/if}
					</div>
				</div>
			{/if}
			<!-- Action Buttons -->
			<div class="absolute right-4 top-4 z-20 flex gap-2">
				<button
					class="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all hover:bg-black/50"
					aria-label="Favorite"
					onclick={toggleFavorite}
				>
					<Heart class="size-5" fill={isFavorited ? 'currentColor' : 'none'} />
				</button>
				<button
					onclick={handleShare}
					class="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all hover:bg-black/50"
					aria-label="Share"
				>
					<Share2 class="size-5" />
				</button>
			</div>
		</div>
		<h1 class="mt-4 text-3xl font-bold">{data.restaurant.name}</h1>
		<p class="text-sm leading-relaxed text-gray-700">{data.restaurant.description}</p>

		<div class="mt-4 flex items-center text-xs">
			<div class="flex items-center gap-1">
				<div class="flex">
					{#each Array(5) as _, i}
						<Star
							size={16}
							class="fill-current stroke-black text-white/30 {i <
							Math.floor(data.restaurant.totalRatings || 0)
								? 'text-yellow-400'
								: 'text-white/30'}"
							strokeWidth={1}
						/>
					{/each}
				</div>
				<span class="font-medium">{data.restaurant.totalRatings || '0.0'}</span>
			</div>
			<span class="mx-2">•</span>
			{#if data.restaurant.estimatedTime}
				<div class="flex items-center gap-1">
					<Bike class="size-4" />
					<span>{data.restaurant.estimatedTime}</span>
				</div>
			{/if}
			<span class="mx-2">•</span>
			{#if isOpenNow}
				<Badge>Open Now</Badge>
			{/if}
		</div>

		<!-- <div class="mt-2 flex flex-wrap gap-2">
			{#each ['Mediterranean', 'Kebab', 'Halal', 'Falafel'] as tag}
				<Badge variant="secondary">
					{tag}
				</Badge>
			{/each}
		</div> -->
		<span class="flex items-center gap-1.5">
			{data.restaurant.deliveryType}
		</span>

		{#if data.restaurant.tags && data.restaurant.tags.length > 0}
			{#each data.restaurant.tags.slice(0, 2) as tag}
				<Badge variant="secondary" class="bg-white/20 hover:bg-white/30">{tag}</Badge>
			{/each}
			{#if data.restaurant.tags.length > 2}
				<Badge variant="secondary" class="bg-white/20 hover:bg-white/30"
					>+{data.restaurant.tags.length - 2} more</Badge
				>
			{/if}
		{:else}
			<span
				class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30"
			>
				{data.restaurant.shopType}
			</span>
		{/if}
	</div>

	<!-- Main Content Container -->
	<div class="  pb-24 sm:px-6">
		<!-- Category Navigation - Horizontal Scrollable Tabs -->
		<nav
			class="sticky top-0 z-30 -mx-3 mb-6 bg-white/95 px-3 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
			in:slide={{ duration: 300, delay: 100 }}
		>
			<div class="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
				{#each categories as category}
					{#if !searchQuery || hasItemsInCategory(category)}
						<Badge
							onclick={() => scrollToCategory(category)}
							variant={activeCategory === category ? 'default' : 'secondary'}
						>
							{category}
						</Badge>
					{/if}
				{/each}
			</div>
		</nav>

		<!-- Search & Filter Bar -->
		<div class="mb-3">
			<div class="relative flex items-center gap-2">
				<div class="relative flex-1">
					<input
						type="search"
						bind:value={searchQuery}
						placeholder="Search menu items..."
						class="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm placeholder-gray-500 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
					/>
					<Search class="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
					{#if searchQuery}
						<button
							onclick={clearSearch}
							class="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-gray-200 p-1 text-gray-500 hover:bg-gray-300"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
							</svg>
						</button>
					{/if}
				</div>
			</div>
		</div>
		<!-- Menu Content -->
		{#if searchQuery}
			<!-- Search Results View -->
			<div class="pb-8">
				{#if searchQuery && filteredMenu.length > 0}
					<div class="mb-6" in:fade={{ duration: 300 }}>
						<h2 class="text-lg font-medium text-gray-900">Results for "{searchQuery}"</h2>
						<p class="text-sm text-gray-500">Found {filteredMenu.length} items</p>
					</div>
					{#each categories as category}
						{#if hasItemsInCategory(category)}
							<div class="mb-10" in:fade={{ duration: 300, delay: 100 }}>
								<div class="mb-3 flex items-center justify-between">
									<h3 class="font-medium text-gray-900">{category}</h3>
									<span class="text-xs text-gray-500">{menuByCategory[category].length} items</span>
								</div>
								<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
									{#each menuByCategory[category] as item (item.id)}
										<div in:fade={{ duration: 300 }}>
											<ProductCard {...item} />
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				{:else}
					<div
						class="flex flex-col items-center justify-center py-16 text-center"
						in:fade={{ duration: 300 }}
					>
						<div class="mb-4 rounded-full bg-gray-100 p-4">
							<Search class="size-8 text-gray-400" />
						</div>
						<h3 class="mb-2 text-lg font-medium text-gray-900">No results found</h3>
						<p class="mb-4 text-gray-500">No menu items found matching "{searchQuery}"</p>
						<button
							onclick={clearSearch}
							class="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
						>
							Clear search
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Regular Menu View -->
			{#each categories as category}
				<div id="category-{category}" class="mb-12 scroll-mt-32">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold capitalize text-gray-900">{category}</h2>
						<!-- <span class="text-sm text-gray-500">{menuByCategory[category].length} items</span> -->
					</div>
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each menuByCategory[category] as item, index (item.id)}
							<div in:fade={{ duration: 300, delay: 50 * index }}>
								<ProductCard {...item} />
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
		<!-- Restaurant Information Section -->
		<section class="mt-16 rounded-xl bg-gray-50 p-6">
			<h2 class="mb-6 text-center text-2xl font-bold text-gray-900">Restaurant Information</h2>

			<div class="grid gap-8 md:grid-cols-2">
				<!-- Location & Hours Card -->
				<div class="overflow-hidden rounded-xl bg-white shadow-sm">
					<!-- Map & Address Section -->
					<div class="relative overflow-hidden">
						{#if data.restaurant.latitude && data.restaurant.longitude}
							<div class="aspect-[16/9] w-full">
								<img
									src={`https://maps.googleapis.com/maps/api/staticmap?center=${data.restaurant.latitude},${data.restaurant.longitude}&zoom=15&size=600x300&markers=color:red%7C${data.restaurant.latitude},${data.restaurant.longitude}&key=YOUR_API_KEY`}
									alt="Restaurant location map"
									class="h-full w-full object-cover"
								/>
							</div>
							<a
								href={`https://maps.google.com/?q=${data.restaurant.latitude},${data.restaurant.longitude}`}
								target="_blank"
								rel="noopener noreferrer"
								class="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-lg transition-transform hover:scale-105"
							>
								Get Directions
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
								>
									<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
									<polyline points="15 3 21 3 21 9" />
									<line x1="10" y1="14" x2="21" y2="3" />
								</svg>
							</a>
						{:else}
							<div class="flex aspect-[16/9] w-full items-center justify-center bg-gray-100">
								<MapPin class="size-10 text-gray-400" />
							</div>
						{/if}
					</div>

					<!-- Address Info -->
					<div class="p-4">
						<h3 class="mb-3 flex items-center gap-2 font-medium text-gray-900">
							<MapPin class="size-5 text-primary" />
							Address
						</h3>
						<p class="mb-3 text-gray-700">{data.restaurant.address || 'Address not available'}</p>

						{#if data.restaurant.phoneNumber}
							<div class="mb-3 flex items-center gap-2 text-gray-700">
								<Phone class="size-4 text-gray-500" />
								<a
									href={`tel:${data.restaurant.phoneNumber}`}
									class="hover:text-primary hover:underline"
								>
									{data.restaurant.phoneNumber}
								</a>
							</div>
						{/if}

						{#if data.restaurant.email}
							<div class="flex items-center gap-2 text-gray-700">
								<Mail class="size-4 text-gray-500" />
								<a
									href={`mailto:${data.restaurant.email}`}
									class="hover:text-primary hover:underline"
								>
									{data.restaurant.email}
								</a>
							</div>
						{/if}
					</div>
				</div>

				<!-- Operating Hours Card -->
				<div class="overflow-hidden rounded-xl bg-white shadow-sm">
					<div class="bg-primary/10 p-4">
						<h3 class="flex items-center gap-2 font-medium text-primary">
							<Clock class="size-5" />
							Operating Hours
						</h3>
					</div>

					<div class="divide-y divide-gray-100">
						{#if data.restaurant.operatingHours && data.restaurant.operatingHours.length > 0}
							{#each data.restaurant.operatingHours.sort((a, b) => {
								const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
								return days.indexOf(a.day) - days.indexOf(b.day);
							}) as hour}
								<div
									class="flex items-center justify-between p-4 {hour.day ===
									new Date().toLocaleDateString('en-US', { weekday: 'long' })
										? 'bg-primary/5'
										: ''}"
								>
									<div class="flex items-center gap-2">
										<span
											class="font-medium {hour.day ===
											new Date().toLocaleDateString('en-US', { weekday: 'long' })
												? 'text-primary'
												: 'text-gray-900'}"
										>
											{hour.day}
										</span>
										{#if hour.day === new Date().toLocaleDateString('en-US', { weekday: 'long' })}
											<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
												>Today</span
											>
										{/if}
									</div>
									<div class="text-right text-gray-700">
										{!hour.isOpen ||
										hour.openTime === hour.closeTime ||
										!hour.openTime ||
										!hour.closeTime
											? 'Closed'
											: `${formatTime(hour.openTime)}–${formatTime(hour.closeTime)}`}
									</div>
								</div>
							{/each}
							{#each ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as day}
								{#if !data.restaurant.operatingHours.some((h) => h.day === day)}
									<div
										class="flex items-center justify-between p-4 {day ===
										new Date().toLocaleDateString('en-US', { weekday: 'long' })
											? 'bg-primary/5'
											: ''}"
									>
										<div class="flex items-center gap-2">
											<span
												class="font-medium {day ===
												new Date().toLocaleDateString('en-US', { weekday: 'long' })
													? 'text-primary'
													: 'text-gray-900'}"
											>
												{day}
											</span>
											{#if day === new Date().toLocaleDateString('en-US', { weekday: 'long' })}
												<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
													>Today</span
												>
											{/if}
										</div>
										<div class="text-right text-gray-700">Closed</div>
									</div>
								{/if}
							{/each}
						{:else}
							<div class="p-4 text-center text-gray-500">No operating hours available</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Additional Information Accordion -->
			<div class="mt-8">
				<button
					onclick={() => (isMoreInfoOpen = !isMoreInfoOpen)}
					class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
				>
					<span class="flex items-center gap-2 font-medium text-gray-900">
						<Info class="size-5 text-primary" />
						Additional Information
					</span>
					<div
						class="flex size-6 items-center justify-center rounded-full bg-gray-100 text-gray-500"
						class:rotate-180={isMoreInfoOpen}
						style="transition: transform 0.3s ease"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</div>
				</button>

				{#if isMoreInfoOpen}
					<div
						class="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
						in:slide={{ duration: 300 }}
					>
						<div class="grid gap-6 p-5 md:grid-cols-2">
							<div>
								<h3 class="mb-2 font-medium text-gray-900">About Us</h3>
								<p class="text-sm leading-relaxed text-gray-600">
									{data.restaurant?.description || 'No description available'}
								</p>
							</div>

							<div>
								<h3 class="mb-2 font-medium text-gray-900">Delivery Information</h3>
								<ul class="space-y-2 text-sm text-gray-600">
									<li class="flex items-start gap-2">
										<Bike class="mt-0.5 size-4 text-gray-400" />
										<span>Delivery Type: {data.restaurant?.deliveryType || 'Not specified'}</span>
									</li>
									{#if data.restaurant.deliveryFee}
										<li class="flex items-start gap-2">
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
												class="mt-0.5 text-gray-400"
											>
												<line x1="12" y1="1" x2="12" y2="23"></line>
												<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
											</svg>
											<span>Delivery Fee: {formatCurrency(data.restaurant.deliveryFee)}</span>
										</li>
									{/if}
									{#if data.restaurant.estimatedTime}
										<li class="flex items-start gap-2">
											<Clock class="mt-0.5 size-4 text-gray-400" />
											<span>Delivery Time: {data.restaurant.estimatedTime} </span>
										</li>
									{/if}
									{#if data.restaurant.distance}
										<li class="flex items-start gap-2">
											<MapPin class="mt-0.5 size-4 text-gray-400" />
											<span>Distance: {data.restaurant.distance} km</span>
										</li>
									{/if}
								</ul>
							</div>

							<div class="md:col-span-2">
								<h3 class="mb-2 font-medium text-gray-900">Contact</h3>
								<div class="grid gap-3 sm:grid-cols-2">
									<div class="flex items-center gap-2 text-sm text-gray-600">
										<Phone class="size-4 text-gray-400" />
										<span>{data.restaurant?.phoneNumber || 'Not available'}</span>
									</div>

									<div class="flex items-center gap-2 text-sm text-gray-600">
										<Mail class="size-4 text-gray-400" />
										<span>{data.restaurant?.email || 'Not available'}</span>
									</div>

									{#if data.restaurant?.website}
										<div class="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
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
												class="text-gray-400"
											>
												<circle cx="12" cy="12" r="10"></circle>
												<line x1="2" y1="12" x2="22" y2="12"></line>
												<path
													d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
												></path>
											</svg>
											<a
												href={data.restaurant.website}
												target="_blank"
												rel="noopener noreferrer"
												class="text-primary hover:underline"
											>
												{data.restaurant.website}
											</a>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</section>
	</div>
	<!-- Floating Cart Button -->
	{#if hasCartItems}
		<div class="fixed bottom-8 right-8 z-40">
			<button
				onclick={handleCartClick}
				class="group flex w-full items-center gap-3 rounded-md bg-primary px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
				in:fly={{ y: 50, duration: 300 }}
			>
				<div class="relative flex items-center">
					<ShoppingCart class="size-6" />
					<span
						class="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary"
					>
						{data.shopCart.items.length}
					</span>
				</div>
				<div class="flex flex-col items-start">
					<span class="text-xs font-medium text-white/80">Your order</span>
					<span class="font-medium">{formatCurrency(data.shopCart.subtotal)}</span>
				</div>
			</button>
		</div>
	{/if}
</main>

<ProductModal cart={data.shopCart} />

<!-- Add some stylistic elements -->
<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.hide-scrollbar {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
