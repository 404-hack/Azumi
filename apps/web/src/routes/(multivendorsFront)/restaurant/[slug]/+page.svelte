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

	let activeCategory = $state('');
	let searchQuery = $state('');
	let isMoreInfoOpen = $state(false);
	let isFavorited = $state(false);
	let showHeroOverlay = $state(false);

	let { data } = $props();

	// Reactive check for cart items
	const hasCartItems = $derived(data.shopCart && data.shopCart.items.length > 0);

	// Calculate total cart amount
	const cartTotal = $derived(
		data.shopCart?.items.reduce((total, item) => total + item.price * item.quantity, 0) || 0
	);

	// Function to handle cart button click
	function handleCartClick() {
		cartSheetState.setTrue(); // Open the cart sheet
	}

	// Toggle favorite status
	function toggleFavorite() {
		isFavorited = !isFavorited;
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
	} // Check if the restaurant is currently open
	const isOpenNow = $derived.by((): boolean => {
		const now = new Date();
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const today = days[now.getDay()];

		const todayHours = data.restaurant.operatingHours?.find(
			(h) => h.day.toLowerCase() === today.toLowerCase()
		);

		if (
			!todayHours ||
			todayHours.isOpen === false ||
			!todayHours.openTime ||
			!todayHours.closeTime
		) {
			return false;
		}

		// Convert current time to minutes since midnight
		const currentHour = now.getHours();
		const currentMinute = now.getMinutes();
		const currentTimeInMinutes = currentHour * 60 + currentMinute;

		// Convert opening hours to minutes since midnight
		const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
		const openTimeInMinutes = openHour * 60 + openMinute;

		// Convert closing hours to minutes since midnight
		const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);
		const closeTimeInMinutes = closeHour * 60 + closeMinute;

		// Check if current time is between opening and closing
		return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
	});

	// Get information about when the restaurant will open today
	const getOpeningInfo = $derived.by((): { willOpenToday: boolean; opensAt: string | null } => {
		const now = new Date();
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const today = days[now.getDay()];

		const todayHours = data.restaurant.operatingHours?.find(
			(h) => h.day.toLowerCase() === today.toLowerCase()
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
				opensAt: formatTime(todayHours.openTime)
			};
		}

		// Already open or closed for the day
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
<CartSheet shopCart={data.shopCart} />

<!-- Modern Immersive Redesign -->
<div class="relative">
	<!-- Fullwidth Hero Section with Parallax Effect -->
	<section class="relative h-[60vh] w-full overflow-hidden sm:h-[50vh] md:h-[70vh]">
		<!-- Hero Image with Subtle Parallax -->
		<div class="absolute inset-0 z-0">
			<img
				src={data.restaurant.coverImage || '/shop.avif'}
				alt={data.restaurant.name}
				class="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
				loading="eager"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"></div>
			<!-- Restaurant Closed Banner Overlay -->
			{#if !isOpenNow}
				<div class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div
						class="rounded-xl bg-black/70 px-8 py-6 text-center text-white shadow-xl backdrop-blur-md"
					>
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
		</div>

		<!-- Hero Content -->
		<div class="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-8 md:p-12">
			<div in:fly={{ y: 50, duration: 500, delay: 200 }} class="flex items-end gap-4">
				<!-- Restaurant Logo -->
				<div class="relative">
					<div
						class="flex size-24 items-center justify-center overflow-hidden rounded-xl border-4 border-white/90 bg-white shadow-xl md:size-32"
					>
						<img
							src={data.restaurant.logo || '/shop.avif'}
							alt={`${data.restaurant.name} logo`}
							class="h-full w-full rounded-lg object-cover"
						/>
					</div>
				</div>

				<!-- Restaurant Title & Quick Info -->
				<div class="flex-1">
					<h1 class="mb-2 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
						{data.restaurant.name}
					</h1>
					<div class="mb-3 flex flex-wrap items-center gap-3 text-sm text-white/90">
						<div class="flex items-center gap-1">
							<div class="flex">
								{#each Array(5) as _, i}
									<Star
										size={16}
										class="fill-current {i < Math.floor(data.restaurant.totalRatings || 0)
											? 'text-yellow-400'
											: 'text-white/30'}"
										strokeWidth={0}
									/>
								{/each}
							</div>
							<span class="font-medium">{data.restaurant.totalRatings || '0.0'}</span>
						</div>
						<span class="h-1.5 w-1.5 rounded-full bg-white/70"></span>
						<span class="flex items-center gap-1.5">
							<Bike class="size-4" />
							{data.restaurant.deliveryType}
						</span>
						<span class="h-1.5 w-1.5 rounded-full bg-white/70"></span>
						<span class="flex items-center gap-1.5">
							<Clock class="size-4" />
							{getCurrentDayHours()}
						</span>
					</div>
					<!-- Action Buttons & Tags -->
					<div class="flex flex-wrap gap-3">
						<!-- Status Badge - Only shown when actually open -->
						{#if isOpenNow}
							<span
								class="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-xs font-medium text-white"
							>
								Open Now
							</span>
						{/if}

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
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="absolute right-4 top-4 z-20 flex gap-2">
			<button
				on:click={toggleFavorite}
				class="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all hover:bg-black/50"
				aria-label="Favorite"
			>
				<Heart class="size-5" fill={isFavorited ? 'currentColor' : 'none'} />
			</button>
			<button
				on:click={handleShare}
				class="flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all hover:bg-black/50"
				aria-label="Share"
			>
				<Share2 class="size-5" />
			</button>
		</div>
	</section>

	<!-- Main Content Container -->
	<div class="mx-auto max-w-5xl px-3 pb-24 pt-4 sm:px-6 md:pb-32 md:pt-6 lg:px-8">
		<!-- Restaurant Description Card -->
		<div class="mb-6 rounded-xl bg-white p-5 shadow-sm">
			<p class="text-sm leading-relaxed text-gray-700">{data.restaurant.description}</p>

			<!-- Quick Contact Buttons -->
			<div class="mt-4 flex flex-wrap gap-3">
				{#if data.restaurant.phoneNumber}
					<a
						href={`tel:${data.restaurant.phoneNumber}`}
						class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
					>
						<Phone size={16} />
						Call
					</a>
				{/if}
				{#if data.restaurant.latitude && data.restaurant.longitude}
					<a
						href={`https://maps.google.com/?q=${data.restaurant.latitude},${data.restaurant.longitude}`}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
					>
						<MapPin size={16} />
						Directions
					</a>
				{/if}
				{#if data.restaurant.email}
					<a
						href={`mailto:${data.restaurant.email}`}
						class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
					>
						<Mail size={16} />
						Email
					</a>
				{/if}
			</div>
		</div>
		<!-- Category Navigation - Horizontal Scrollable Tabs -->
		<nav
			class="sticky top-0 z-30 -mx-3 mb-6 bg-white/95 px-3 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
			in:slide={{ duration: 300, delay: 100 }}
		>
			<div class="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
				{#each categories as category}
					{#if !searchQuery || hasItemsInCategory(category)}
						<button
							on:click={() => scrollToCategory(category)}
							class="flex-shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all {activeCategory ===
							category
								? 'border-primary/10 bg-primary/10 text-primary shadow-sm'
								: 'border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100'}"
						>
							{category}
						</button>
					{/if}
				{/each}
			</div>
		</nav>

		<!-- Search & Filter Bar -->
		<div class="mb-8">
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
							on:click={clearSearch}
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
							on:click={clearSearch}
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
						<h2 class="text-xl font-semibold text-gray-900">{category}</h2>
						<span class="text-sm text-gray-500">{menuByCategory[category].length} items</span>
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
									on:error={(e) => {
										e.currentTarget.onerror = null;
										e.currentTarget.src = '/shop.avif';
									}}
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
					on:click={() => (isMoreInfoOpen = !isMoreInfoOpen)}
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
									{#if data.restaurant?.minimumOrderAmount}
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
												<circle cx="12" cy="12" r="10"></circle>
												<line x1="12" y1="8" x2="12" y2="12"></line>
												<line x1="12" y1="16" x2="12.01" y2="16"></line>
											</svg>
											<span>Minimum Order: ${data.restaurant.minimumOrderAmount}</span>
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
				on:click={handleCartClick}
				class="group flex items-center gap-3 rounded-full bg-primary px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
					<span class="font-medium">₦{cartTotal.toLocaleString()}</span>
				</div>
			</button>
		</div>
	{/if}
</div>

<ProductModal title="Product Modal" />

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
