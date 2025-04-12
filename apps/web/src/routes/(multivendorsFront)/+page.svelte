<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { MapPin, ArrowRight } from 'lucide-svelte';
	import RestaurantList from '$lib/components/RestaurantList.svelte';
	import PlacesInput from '$lib/components/ui/places-input/places-input.svelte';
	import { activeLocation } from '$lib/states/locationState.svelte';
	import Simulation from '$lib/components/Simulation.svelte';
</script>

<div class="min-h-screen bg-background">
	<!-- Hero Section -->
	<div class="relative">
		<div class="absolute inset-0 overflow-hidden">
			<img src="/hero-1.png" alt="Food banner" class="h-full w-full object-cover object-top" />
			<div class="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />
		</div>

		<div class="relative mx-auto max-w-7xl px-4 py-52 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class=" font-bold tracking-tight text-foreground sm:text-xl md:text-5xl">
					Discover restaurants and more near you.
				</h1>

				<!-- Search Section -->
				<div class="mx-auto mt-10 max-w-md">
					<div
						class="relative flex items-center gap-2 rounded-lg bg-white px-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
					>
						<MapPin class="h-5 w-5 text-muted-foreground" />
						<!-- <input
							type="text"
							placeholder="Enter your delivery address"
							class="h-14 flex-1 border-none outline-none"
						/> -->
						<PlacesInput
							class="h-14 flex-1 border-none outline-none"
							placeholder="Enter your delivery address"
							onPlaceSelect={(p) => {
								activeLocation.current = {
									name: p.name,
									address: p.address,
									lat: p.lat,
									lng: p.lng
								};
							}}
						/>
						<Button size="icon" class="shadow-md">
							<ArrowRight class="size-5" />
						</Button>
					</div>
					<!-- <PlacesInput
						class="h-14 flex-1 border-none outline-none"
						placeholder="Enter your delivery address"
					/> -->
				</div>
			</div>
		</div>
	</div>
</div>
<Simulation />
