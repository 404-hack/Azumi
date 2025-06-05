<script lang="ts">
	import { MapPin, Loader2, Search } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { useLocation } from '$lib/hooks/useLocation.svelte';
	import { formatCoordinates } from '$lib/utils/location';

	const location = useLocation({
		enableHighAccuracy: true,
		timeout: 15000,
		showToasts: true,
		onLocationUpdate: (loc) => {
			console.log('Location updated:', loc);
		},
		onError: (err) => {
			console.error('Location error:', err);
		}
	});

	let searchQuery = $state('');

	async function handleGetCurrentLocation() {
		await location.getCurrentLocation();
	}

	async function handleSearchLocation() {
		if (searchQuery.trim()) {
			await location.searchLocation(searchQuery);
		}
	}

	function handleToggleWatching() {
		if (location.isWatching) {
			location.stopWatching();
		} else {
			location.startWatching();
		}
	}
</script>

<div class="container mx-auto space-y-6 p-6">
	<div class="space-y-2 text-center">
		<h1 class="text-2xl font-bold">🎣 useLocation Hook Demo</h1>
		<p class="text-muted-foreground">Example of using the location hook in a component</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Location Hook Example</CardTitle>
			<CardDescription>Simple component using the useLocation hook</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex gap-2">
				<Button onclick={handleGetCurrentLocation} disabled={location.isLoading} class="flex-1">
					{#if location.isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<MapPin class="mr-2 h-4 w-4" />
					{/if}
					Get Current Location
				</Button>

				<Button
					onclick={handleToggleWatching}
					variant={location.isWatching ? 'destructive' : 'secondary'}
				>
					{location.isWatching ? 'Stop Watching' : 'Start Watching'}
				</Button>
			</div>

			<div class="flex gap-2">
				<Input
					bind:value={searchQuery}
					placeholder="Enter an address to search..."
					class="flex-1"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleSearchLocation();
						}
					}}
				/>
				<Button onclick={handleSearchLocation} disabled={location.isLoading || !searchQuery.trim()}>
					{#if location.isLoading}
						<Loader2 class="h-4 w-4 animate-spin" />
					{:else}
						<Search class="h-4 w-4" />
					{/if}
				</Button>
			</div>

			{#if location.currentLocation}
				<div class="bg-muted space-y-3 rounded-lg p-4">
					<div class="flex items-start justify-between">
						<div class="space-y-1">
							<h3 class="font-medium">{location.currentLocation.name}</h3>
							<p class="text-muted-foreground text-sm">{location.currentLocation.address}</p>
						</div>
						<Button variant="ghost" size="sm" onclick={() => location.clearLocation()}>
							Clear
						</Button>
					</div>

					<div class="flex flex-wrap gap-2">
						<Badge variant="outline" class="font-mono text-xs">
							{formatCoordinates(
								location.currentLocation.coordinates.latitude,
								location.currentLocation.coordinates.longitude
							)}
						</Badge>

						{#if location.currentLocation.source}
							<Badge variant="secondary" class="text-xs">
								{location.currentLocation.source}
							</Badge>
						{/if}

						{#if location.currentLocation.accuracy}
							<Badge variant="outline" class="text-xs">
								{Math.round(location.currentLocation.accuracy)}m accuracy
							</Badge>
						{/if}

						{#if location.isWatching}
							<Badge variant="default" class="animate-pulse text-xs">Tracking</Badge>
						{/if}
					</div>
				</div>
			{/if}

			{#if location.error}
				<div class="bg-destructive/10 border-destructive rounded-lg border p-4">
					<div class="text-destructive flex items-center gap-2 font-medium">
						<MapPin class="h-4 w-4" />
						Location Error
					</div>
					<p class="text-destructive/80 mt-1 text-sm">{location.error.userMessage}</p>
					<p class="text-destructive/60 mt-1 font-mono text-xs">{location.error.code}</p>
				</div>
			{/if}

			<div class="text-muted-foreground space-y-1 text-xs">
				<p><strong>Hook State:</strong></p>
				<ul class="ml-2 list-inside list-disc space-y-1">
					<li>Loading: {location.isLoading ? '✅' : '❌'}</li>
					<li>Watching: {location.isWatching ? '✅' : '❌'}</li>
					<li>Has Location: {location.currentLocation ? '✅' : '❌'}</li>
					<li>Has Error: {location.error ? '✅' : '❌'}</li>
				</ul>
			</div>
		</CardContent>
	</Card>
</div>
