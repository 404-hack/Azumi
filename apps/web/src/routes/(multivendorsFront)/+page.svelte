<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import {
		MapPin,
		ArrowRight,
		Search,
		ShoppingBag,
		Bike,
		Clock,
		Star,
		Shield,
		Zap,
		Users,
		Heart,
		Smartphone,
		Truck
	} from 'lucide-svelte';

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

<div class="min-h-screen bg-white">
	<!-- Hero Section with Enhanced Design -->
	<div
		class="relative isolate overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-orange-100"
	>
		<!-- Background Pattern -->
		<div class="absolute inset-0 -z-10 opacity-20">
			<svg class="h-full w-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<pattern
						id="hero-pattern"
						x="0"
						y="0"
						width="40"
						height="40"
						patternUnits="userSpaceOnUse"
					>
						<circle cx="20" cy="20" r="1.5" fill="#ff6b35" opacity="0.3" />
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill="url(#hero-pattern)" />
			</svg>
		</div>

		<!-- Hero Content -->
		<div class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
			<div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
				<!-- Left Column - Text Content -->
				<div class="text-left lg:pr-8">
					<!-- Promotional Banner -->
					<div
						class="mb-6 inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2 text-sm font-medium text-white shadow-lg"
					>
						<Zap class="mr-2 h-4 w-4" />
						₦0 delivery fee on first order
					</div>

					<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
						Everything you
						<span class="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
							crave, delivered.
						</span>
					</h1>

					<p class="mt-6 max-w-xl text-lg leading-8 text-gray-600">
						Your favorite local restaurants and groceries delivered in minutes. Quality food from
						Nigeria's best vendors, right to your doorstep.
					</p>

					<!-- Location Search -->
					<div class="mt-8 max-w-md">
						<form
							onsubmit={(e) => {
								e.preventDefault();
							}}
							class="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500 sm:flex-row sm:items-center sm:gap-2 sm:p-2"
						>
							<div class="flex flex-1 items-center">
								<MapPin class="ml-2 h-5 w-5 flex-shrink-0 text-gray-400 sm:ml-3" />
								<PlacesInput
									class="h-10 flex-1 border-none bg-transparent text-base outline-none placeholder:text-gray-500 sm:h-12"
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
							</div>
							<Button
								type="submit"
								class="h-10 w-full flex-shrink-0 rounded-xl px-4 text-sm font-medium shadow-lg transition-all duration-200  sm:h-12 sm:w-auto sm:px-6 sm:text-base"
								aria-label="Find food near you"
							>
								<span class="sm:hidden">Find Food</span>
								<span class="hidden sm:inline">Find Food</span>
								<ArrowRight class="ml-2 h-4 w-4" />
							</Button>
						</form>

						<p class="mt-3 text-sm text-gray-500">
							Sign up to get the best deals and free delivery
						</p>
					</div>
				</div>

				<!-- Right Column - Hero Image -->
				<div class="relative lg:pl-8">
					<div class="relative">
						<img
							src="/image.png"
							alt="Delicious food delivery"
							class="h-[500px] w-full rounded-3xl object-cover shadow-2xl"
						/>
						<!-- Floating Elements -->
						<div
							class="absolute -left-4 -top-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl"
						>
							<div class="flex items-center space-x-2">
								<div class="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
								<span class="text-sm font-medium text-gray-900">Available Now</span>
							</div>
						</div>

						<div
							class="absolute -bottom-4 -right-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl"
						>
							<div class="flex items-center space-x-2">
								<Clock class="h-4 w-4 text-orange-500" />
								<span class="text-sm font-medium text-gray-900">15-30 min</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Service Categories Section - Beautiful Image Cards -->
	<div class="bg-background py-24">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
					Explore categories
				</h2>
				<p class="mx-auto max-w-2xl text-xl text-muted-foreground">
					Discover everything you need, delivered fresh to your doorstep
				</p>
			</div>

			<!-- Category Cards Grid -->
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				<!-- Restaurant Card -->
				<div
					class="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
				>
					<!-- Background Image -->
					<div class="relative h-80 overflow-hidden rounded-3xl">
						<img
							src="/image.png"
							alt="Restaurants"
							class="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
						/>
						<!-- Overlay Gradient -->
						<div
							class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
						></div>

						<!-- Content Overlay -->
						<div class="absolute inset-0 flex flex-col justify-end p-8">
							<div
								class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm"
							>
								<img src="/restaurantIcon.png" alt="Restaurant" class="h-7 w-7" />
							</div>
							<h3 class="mb-3 text-2xl font-bold text-white">Restaurants</h3>
							<p class="mb-4 leading-relaxed text-white/90">
								Order from your favorite local restaurants and chains
							</p>
							<div
								class="flex items-center font-semibold text-white transition-all duration-300 group-hover:translate-x-2"
							>
								<span>Order food</span>
								<ArrowRight class="ml-2 h-5 w-5" />
							</div>
						</div>
					</div>
				</div>

				<!-- Grocery Card -->
				<div
					class="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
				>
					<!-- Background Image -->
					<div class="relative h-80 overflow-hidden rounded-3xl">
						<img
							src="/groCover.jpg"
							alt="Groceries"
							class="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
						/>
						<!-- Overlay Gradient -->
						<div
							class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
						></div>

						<!-- Content Overlay -->
						<div class="absolute inset-0 flex flex-col justify-end p-8">
							<div
								class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm"
							>
								<ShoppingBag class="h-7 w-7 text-green-600" />
							</div>
							<h3 class="mb-3 text-2xl font-bold text-white">Groceries</h3>
							<p class="mb-4 leading-relaxed text-white/90">
								Fresh produce and daily essentials delivered quickly
							</p>
							<div
								class="flex items-center font-semibold text-white transition-all duration-300 group-hover:translate-x-2"
							>
								<span>Shop now</span>
								<ArrowRight class="ml-2 h-5 w-5" />
							</div>
						</div>
					</div>
				</div>

				<!-- Market Card -->
				<div
					class="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
				>
					<!-- Background Image -->
					<div class="relative h-80 overflow-hidden rounded-3xl">
						<img
							src="/marketCover.jpg"
							alt="Local Markets"
							class="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
						/>
						<!-- Overlay Gradient -->
						<div
							class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
						></div>

						<!-- Content Overlay -->
						<div class="absolute inset-0 flex flex-col justify-end p-8">
							<div
								class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm"
							>
								<img src="/localMarketIcon.png" alt="Market" class="h-7 w-7" />
							</div>
							<h3 class="mb-3 text-2xl font-bold text-white">Local Markets</h3>
							<p class="mb-4 leading-relaxed text-white/90">
								Authentic local ingredients and specialty items
							</p>
							<div
								class="flex items-center font-semibold text-white transition-all duration-300 group-hover:translate-x-2"
							>
								<span>Explore</span>
								<ArrowRight class="ml-2 h-5 w-5" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="bg-primary py-20">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
				<!-- Left - Content -->
				<div class="text-primary-foreground">
					<h2 class="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">Mobile App Coming Soon</h2>
					<p class="mb-8 text-xl leading-relaxed text-primary-foreground/90">
						We're working hard to bring you the best food delivery experience on mobile. Our app
						will feature seamless ordering, real-time tracking, and exclusive deals.
					</p>

					<!-- Coming Soon Badge -->
					<div
						class="mb-8 inline-flex items-center rounded-full bg-primary-foreground/20 px-6 py-3 backdrop-blur-sm"
					>
						<Zap class="mr-3 h-5 w-5 text-primary-foreground" />
						<span class="font-semibold text-primary-foreground"
							>Launching Soon on iOS & Android</span
						>
					</div>

					<!-- Email Signup -->
					<div class="max-w-md">
						<p class="mb-4 text-primary-foreground/90">Be the first to know when we launch:</p>
						<div class="flex gap-3">
							<input
								type="email"
								placeholder="Enter your email"
								class="flex-1 rounded-xl border-0 bg-primary-foreground/20 px-4 py-3 text-primary-foreground backdrop-blur-sm placeholder:text-primary-foreground/60 focus:bg-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
							/>
							<Button
								class="rounded-xl bg-background px-6 py-3 font-semibold text-foreground hover:bg-muted"
							>
								Notify Me
							</Button>
						</div>
					</div>
				</div>

				<!-- Right - Phone mockup -->
				<div class="relative">
					<div class="relative mx-auto w-80">
						<div class="relative z-10 overflow-hidden rounded-[2.5rem] bg-card shadow-2xl">
							<img
								src="/hero-2.avif"
								alt="Azumi mobile app"
								class="h-[600px] w-full object-cover"
							/>
						</div>
						<!-- Floating decoration -->
						<div
							class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/20"
						></div>
						<div
							class="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary-foreground/10"
						></div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Join Network Section - Enhanced Design -->
	<div class="bg-muted/20 py-24">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mb-20 text-center">
				<div class="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2">
					<span class="text-sm font-semibold text-primary">🚀 JOIN THE NETWORK</span>
				</div>
				<h2 class="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
					Grow with <span
						class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
						>Azumi</span
					>
				</h2>
				<p class="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground">
					Join thousands of restaurants, riders, and team members who are building Nigeria's most
					trusted food delivery platform
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
				<!-- Restaurant Owners Card -->
				<div
					class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
				>
					<div class="relative z-10">
						<!-- Icon -->
						<div
							class="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg transition-all duration-300 group-hover:rotate-6 group-hover:scale-110"
						>
							<img
								src="/restaurantIcon.png"
								alt="Restaurant"
								class="h-10 w-10 brightness-0 invert filter"
							/>
						</div>

						<!-- Content -->
						<div class="mb-8">
							<h3 class="mb-4 text-2xl font-bold text-card-foreground">Restaurant Owners</h3>
							<p class="mb-6 leading-relaxed text-muted-foreground">
								Turn your kitchen into a profitable business. Reach hundreds of hungry customers in
								Epe and beyond with zero upfront costs.
							</p>
							<div class="space-y-2 text-sm">
								<div class="flex items-center text-muted-foreground">
									<div class="mr-3 h-1.5 w-1.5 rounded-full bg-primary"></div>
									<span>Zero commission for first month</span>
								</div>
								<div class="flex items-center text-muted-foreground">
									<div class="mr-3 h-1.5 w-1.5 rounded-full bg-primary"></div>
									<span>Free marketing support</span>
								</div>
								<div class="flex items-center text-muted-foreground">
									<div class="mr-3 h-1.5 w-1.5 rounded-full bg-primary"></div>
									<span>Real-time order management</span>
								</div>
							</div>
						</div>

						<!-- CTA -->
						<Button
							class="group/btn w-full rounded-xl bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg"
						>
							<span>Start Selling Today</span>
							<ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
						</Button>
					</div>

					<!-- Decorative Elements -->
					<div
						class="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/10 transition-all duration-500 group-hover:scale-125"
					></div>
					<div class="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary/5"></div>
				</div>

				<!-- Delivery Riders Card -->
				<div
					class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary/10 via-secondary/15 to-secondary/10 p-8 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
				>
					<div class="relative z-10">
						<!-- Icon -->
						<div
							class="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary shadow-lg transition-all duration-300 group-hover:rotate-6 group-hover:scale-110"
						>
							<Bike class="h-10 w-10 text-secondary-foreground" />
						</div>

						<!-- Content -->
						<div class="mb-8">
							<h3 class="mb-4 text-2xl font-bold text-card-foreground">Delivery Riders</h3>
							<p class="mb-6 leading-relaxed text-muted-foreground">
								Earn money on your schedule. Join our fleet of professional riders and deliver
								happiness while building your financial future.
							</p>
							<div class="space-y-2 text-sm">
								<div class="flex items-center text-muted-foreground">
									<div class="mr-3 h-1.5 w-1.5 rounded-full bg-secondary"></div>
									<span>Flexible working hours</span>
								</div>
								<div class="flex items-center text-muted-foreground">
									<div class="mr-3 h-1.5 w-1.5 rounded-full bg-secondary"></div>
									<span>Weekly payments + tips</span>
								</div>
								<div class="flex items-center text-muted-foreground">
									<div class="mr-3 h-1.5 w-1.5 rounded-full bg-secondary"></div>
									<span>Insurance coverage included</span>
								</div>
							</div>
						</div>

						<!-- CTA -->
						<Button
							class="group/btn w-full rounded-xl bg-secondary text-secondary-foreground transition-all duration-300 hover:bg-secondary/90 hover:shadow-lg"
						>
							<span>Become a Rider</span>
							<ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
						</Button>
					</div>

					<!-- Decorative Elements -->
					<div
						class="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-secondary/10 transition-all duration-500 group-hover:scale-125"
					></div>
					<div class="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-secondary/5"></div>
				</div>

				<!-- Team Members Card -->
				<div
					class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/10 via-accent/15 to-accent/10 p-8 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
				>
					<div class="relative z-10">
						<!-- Icon -->
						<div
							class="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent shadow-lg transition-all duration-300 group-hover:rotate-6 group-hover:scale-110"
						>
							<Users class="h-10 w-10 text-accent-foreground" />
						</div>

						<!-- Content -->
						<div class="mb-8">
							<h3 class="mb-4 text-2xl font-bold text-card-foreground">Join Our Team</h3>
							<p class="mb-6 leading-relaxed text-muted-foreground">
								Be part of something bigger. Help us revolutionize food delivery in Nigeria with
								cutting-edge technology and innovative solutions.
							</p>
							<div class="space-y-2 text-sm">
								<div class="flex items-center text-muted-foreground">
									<div class="mr-3 h-1.5 w-1.5 rounded-full bg-accent"></div>
									<span>Remote-first culture</span>
								</div>
								<div class="flex items-center text-muted-foreground">
									<div class="mr-3 h-1.5 w-1.5 rounded-full bg-accent"></div>
									<span>Competitive salary + equity</span>
								</div>
								<div class="flex items-center text-muted-foreground">
									<div class="mr-3 h-1.5 w-1.5 rounded-full bg-accent"></div>
									<span>Professional development</span>
								</div>
							</div>
						</div>

						<!-- CTA -->
						<Button
							class="group/btn w-full rounded-xl bg-accent text-accent-foreground transition-all duration-300 hover:bg-accent/90 hover:shadow-lg"
						>
							<span>View Open Roles</span>
							<ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
						</Button>
					</div>

					<!-- Decorative Elements -->
					<div
						class="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-accent/10 transition-all duration-500 group-hover:scale-125"
					></div>
					<div class="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-accent/5"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Interactive Map Section -->
	<div class="bg-background py-20">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
					Now serving Epe, Lagos
				</h2>
				<p class="mx-auto max-w-2xl text-xl text-muted-foreground">
					Discover amazing restaurants and local vendors in your area
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<!-- Google Map -->
				<div class="relative h-96 overflow-hidden rounded-3xl bg-muted/30">
					<iframe
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126234.01944446626!2d3.5835!3d6.5833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bc0f3b9b4a5e3%3A0x9bbb7a8f8f8f8f8f!2sEpe%2C%20Lagos%2C%20Nigeria!5e0!3m2!1sen!2s!4v1640000000000!5m2!1sen!2s"
						width="100%"
						height="100%"
						style="border:0;"
						allowfullscreen=""
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						title="Epe Lagos Map"
						class="rounded-3xl"
					></iframe>
					<!-- Overlay for better visual -->
					<div
						class="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent"
					></div>
				</div>

				<!-- Service Area Info -->
				<div class="space-y-6">
					<div>
						<h3 class="mb-4 text-2xl font-bold text-foreground">Currently Available in Epe</h3>
						<p class="mb-6 text-muted-foreground">
							We're excited to serve the vibrant community of Epe, Lagos with fast, reliable food
							delivery from local restaurants and vendors.
						</p>
					</div>

					<!-- Service Coverage -->
					<div class="rounded-xl border border-border bg-card p-6">
						<div class="mb-4 flex items-center space-x-3">
							<div class="h-3 w-3 animate-pulse rounded-full bg-primary"></div>
							<span class="font-semibold text-card-foreground">Epe, Lagos State</span>
						</div>
						<div class="space-y-3 text-sm text-muted-foreground">
							<div class="flex items-center space-x-2">
								<Clock class="h-4 w-4 text-primary" />
								<span>Delivery time: 15-45 minutes</span>
							</div>
							<div class="flex items-center space-x-2">
								<MapPin class="h-4 w-4 text-primary" />
								<span>Coverage: All major areas in Epe</span>
							</div>
							<div class="flex items-center space-x-2">
								<Users class="h-4 w-4 text-primary" />
								<span>Growing network of local restaurants</span>
							</div>
						</div>
					</div>

					<!-- CTA Button -->
					<Button
						class="w-full rounded-xl bg-primary py-3 text-primary-foreground hover:bg-primary/90"
					>
						<MapPin class="mr-2 h-4 w-4" />
						Find Restaurants in Epe
					</Button>

					<!-- Expansion Notice -->
					<div class="rounded-xl bg-muted/50 p-4 text-center">
						<p class="text-sm text-muted-foreground">
							🚀 <strong>Coming Soon:</strong> We're expanding to more areas in Lagos State
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- <div class="bg-primary py-20">
		<div class="mx-auto max-w-4xl px-6 text-center lg:px-8">
			<h2 class="mb-6 text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
				Place your order in seconds
			</h2>
			<p class="mb-8 text-xl text-primary-foreground/90">
				Get ₦300 off your first order when you use this promo code!
			</p>

			
			<div class="mb-8 inline-flex items-center rounded-full bg-primary-foreground px-6 py-3">
				<span class="font-mono text-lg font-bold text-primary">AZUMI300</span>
			</div>

			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<Button
					class="flex items-center space-x-2 rounded-xl bg-background px-8 py-4 text-lg font-semibold text-foreground hover:bg-muted"
				>
					<svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"
						/>
					</svg>
					<span>Download Android App</span>
				</Button>
				<Button
					class="flex items-center space-x-2 rounded-xl bg-background px-8 py-4 text-lg font-semibold text-foreground hover:bg-muted"
				>
					<svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
						/>
					</svg>
					<span>Download iOS App</span>
				</Button>
			</div>
		</div>
	</div> -->
</div>
