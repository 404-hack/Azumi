<script lang="ts">
	import MenuItemCard from '$lib/components/MenuItemCard.svelte';
	import ProductModal from '$lib/components/modal/ProductModal.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import Ticket from '$lib/components/Ticket.svelte';
	import { Bike, Search, MapPin, Clock, Info } from 'lucide-svelte';

	let activeCategory = $state('');
	let searchQuery = $state('');
	let isMoreInfoOpen = $state(false);

	// This would typically come from a database or API
	const restaurant = {
		id: '1',
		name: 'Burger Palace',
		image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
		rating: 4.5,
		deliveryTime: '15-25 min',
		tags: ['Burgers', 'American', 'Fast Food'],
		description: 'Home of the juiciest burgers in town!',
		menu: [
			// Burgers
			{
				id: '1',
				name: 'Classic Burger',
				price: 9.99,
				description: '100% beef patty with lettuce, tomato, and our secret sauce',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Burgers'
			},
			{
				id: '2',
				name: 'Cheeseburger',
				price: 10.99,
				description: 'Classic burger topped with melted cheddar cheese',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Burgers'
			},
			{
				id: '3',
				name: 'Bacon Deluxe',
				price: 12.99,
				description: 'Burger with crispy bacon, cheddar, and BBQ sauce',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Burgers'
			},
			{
				id: '4',
				name: 'Mushroom Swiss',
				price: 11.99,
				description: 'Burger with sautéed mushrooms and Swiss cheese',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Burgers'
			},
			// Vegetarian
			{
				id: '5',
				name: 'Veggie Burger',
				price: 8.99,
				description: 'Plant-based patty with avocado and sprouts',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Vegetarian'
			},
			{
				id: '6',
				name: 'Garden Salad',
				price: 7.99,
				description: 'Fresh mixed greens with seasonal vegetables',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Vegetarian'
			},
			{
				id: '7',
				name: 'Grilled Portobello',
				price: 9.99,
				description: 'Marinated portobello mushroom with roasted vegetables',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Vegetarian'
			},
			// Sides
			{
				id: '8',
				name: 'French Fries',
				price: 3.99,
				description: 'Crispy golden fries',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Sides'
			},
			{
				id: '9',
				name: 'Onion Rings',
				price: 4.99,
				description: 'Crispy battered onion rings',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Sides'
			},
			{
				id: '10',
				name: 'Sweet Potato Fries',
				price: 4.99,
				description: 'Crispy sweet potato fries with seasoning',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Sides'
			},
			// Beverages
			{
				id: '11',
				name: 'Soft Drinks',
				price: 2.99,
				description: 'Various sodas and soft drinks',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Beverages'
			},
			{
				id: '12',
				name: 'Milkshake',
				price: 5.99,
				description: 'Creamy milkshake in various flavors',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Beverages'
			},
			{
				id: '13',
				name: 'Fresh Lemonade',
				price: 3.99,
				description: 'Homemade fresh lemonade',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Beverages'
			},
			// Desserts
			{
				id: '14',
				name: 'Ice Cream Sundae',
				price: 6.99,
				description: 'Vanilla ice cream with toppings and whipped cream',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Desserts'
			},
			{
				id: '15',
				name: 'Chocolate Brownie',
				price: 5.99,
				description: 'Warm chocolate brownie with vanilla ice cream',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Desserts'
			},
			// Combos
			{
				id: '16',
				name: 'Family Feast',
				price: 29.99,
				description: '4 burgers, 2 large fries, and 4 drinks',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Combos'
			},
			{
				id: '17',
				name: 'Burger Combo',
				price: 13.99,
				description: 'Burger, fries, and drink',
				image: 'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg',
				category: 'Combos'
			}
		]
	};

	let { data } = $props();

	// Get unique categories
	const categories = $derived([...new Set(restaurant.menu.map((item) => item.category))]);

	// Filter menu items based on search query
	const filteredMenu = $derived(
		searchQuery
			? restaurant.menu.filter(
					(item) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.category.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: restaurant.menu
	);

	// Group menu items by category
	const menuByCategory = $derived(
		categories.reduce(
			(acc, category) => {
				acc[category] = filteredMenu.filter((item) => item.category === category);
				return acc;
			},
			{} as Record<string, typeof restaurant.menu>
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

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8">
		<div class="relative h-64 overflow-hidden rounded-lg">
			<img
				src={restaurant.image || '/placeholder.svg'}
				alt={restaurant.name}
				class="absolute inset-0 h-full w-full object-cover"
			/>
		</div>
		<h1 class="mt-4 text-3xl font-bold">{restaurant.name}</h1>
		<p class="mt-2 text-gray-600">{restaurant.description}</p>
		<div class="mt-4 flex items-center text-xs">
			<span class="text-yellow-500">★</span>
			<span class="ml-1">{restaurant.rating}</span>
			<span class="mx-2">•</span>
			<div class="flex items-center gap-1">
				<Bike class="size-4" />
				<span>{restaurant.deliveryTime}</span>
			</div>
			<span class="mx-2">•</span>
			<span> Open until 21:30 </span>
		</div>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each restaurant.tags as tag, index}
				<span class="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
					{tag}
				</span>
			{/each}
		</div>
	</div>
	<Ticket />

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
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
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
			<!-- <form
				class="flex w-full items-center justify-between rounded-3xl bg-muted px-3.5 focus-within:ring-2 focus-within:ring-primary"
			>
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Search menu..."
					class="h-11 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
					name=""
					id=""
				/>
				<Search class="text-muted-foreground" />
			</form> -->
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
					<p class="font-medium">Ravi 13</p>
					<p class="text-gray-600">10138 Tallinn</p>
					<a
						href="https://maps.google.com/?q=Ravi+13,+10138+Tallinn"
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
				</div>
			</div>

			<!-- Opening Hours -->
			<div>
				<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
					<Clock class="size-5" />
					Delivery Times
				</h2>
				<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
					<div class="font-medium">Monday</div>
					<div class="text-gray-600">11:00–21:30</div>
					<div class="font-medium">Tuesday</div>
					<div class="text-gray-600">11:00–21:30</div>
					<div class="font-medium">Wednesday</div>
					<div class="text-gray-600">11:00–21:30</div>
					<div class="font-medium">Thursday</div>
					<div class="text-gray-600">11:00–21:30</div>
					<div class="font-medium">Friday</div>
					<div class="text-gray-600">11:00–21:30</div>
					<div class="font-medium">Saturday</div>
					<div class="text-gray-600">11:00–21:30</div>
					<div class="font-medium">Sunday</div>
					<div class="text-gray-600">11:00–21:30</div>
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
							We are a family-owned restaurant committed to serving the best burgers in Tallinn
							since 2010. Our ingredients are locally sourced, and our recipes are crafted with
							care.
						</p>
					</div>
					<div>
						<h3 class="font-medium">Delivery Information</h3>
						<ul class="mt-1 space-y-1 text-sm text-gray-600">
							<li>• Free delivery for orders over €30</li>
							<li>• Average delivery time: 30-45 minutes</li>
							<li>• Delivery radius: 5km from restaurant</li>
						</ul>
					</div>
					<div>
						<h3 class="font-medium">Payment Methods</h3>
						<ul class="mt-1 space-y-1 text-sm text-gray-600">
							<li>• Credit/Debit Cards</li>
							<li>• Cash on Delivery</li>
							<li>• Mobile Payment</li>
						</ul>
					</div>
					<div>
						<h3 class="font-medium">Contact</h3>
						<ul class="mt-1 space-y-1 text-sm text-gray-600">
							<li>• Phone: +372 123 4567</li>
							<li>• Email: info@burgerpalace.ee</li>
						</ul>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
<ProductModal title="Product Modal" />
