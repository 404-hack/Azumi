<script lang="ts">
	import { onMount } from 'svelte';
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
	import {
		MapPin,
		Navigation,
		Search,
		Clock,
		CheckCircle,
		AlertCircle,
		XCircle
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import EnhancedLocationAutocomplete from '$lib/components/EnhancedLocationAutocomplete.svelte';
	import {
		getCurrentLocationWithOptions,
		getLocationFromAddress,
		getAddressFromCoordinates,
		calculateDistance,
		formatDistance,
		formatCoordinates,
		parseCoordinates,
		validateCoordinates,
		checkLocationPermission,
		isLocationInNigeria,
		createLocationWatcher,
		type LocationResult,
		type LocationError,
		type LocationCoordinates,
		NIGERIA_BOUNDS
	} from '$lib/utils/location';

	let currentLocation = $state<LocationResult | null>(null);
	let searchedLocation = $state<LocationResult | null>(null);
	let permissionStatus = $state<string>('unknown');
	let watcherActive = $state(false);
	let watchedLocations = $state<LocationResult[]>([]);
	let testCoordinates = $state('6.5568768, 3.3390592');
	let testAddress = $state('Lagos Island, Lagos, Nigeria');
	let coordinateResults = $state<{ name: string; address: string } | null>(null);
	let addressResults = $state<LocationResult | null>(null);

	const locationWatcher = createLocationWatcher(
		(location) => {
			watchedLocations = [location, ...watchedLocations.slice(0, 4)];
			toast.success(`Location updated: ${location.name}`);
		},
		(error) => {
			toast.error(error.userMessage);
		},
		{
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 5000
		}
	);

	onMount(async () => {
		try {
			permissionStatus = await checkLocationPermission();
		} catch (error) {
			console.error('Permission check failed:', error);
		}
	});

	function handleLocationSelect(location: LocationResult) {
		currentLocation = location;
		toast.success(`Location selected: ${location.name}`);
	}

	function handleLocationError(error: LocationError) {
		toast.error(error.userMessage);
	}

	function handleSearchLocationSelect(location: LocationResult) {
		searchedLocation = location;
		toast.success(`Search result: ${location.name}`);
	}

	async function testCoordinateToAddress() {
		try {
			const coords = parseCoordinates(testCoordinates);
			if (!coords) {
				throw new Error('Invalid coordinate format. Use: latitude, longitude');
			}

			const result = await getAddressFromCoordinates(coords.latitude, coords.longitude);

			if (result) {
				coordinateResults = result;
				toast.success('Address found successfully');
			} else {
				throw new Error('No address found for coordinates');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to get address';
			toast.error(message);
			coordinateResults = null;
		}
	}

	async function testAddressToCoordinates() {
		try {
			const result = await getLocationFromAddress(testAddress);
			if (result) {
				addressResults = result;
				toast.success('Coordinates found successfully');
			} else {
				throw new Error('No coordinates found for address');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to get coordinates';
			toast.error(message);
			addressResults = null;
		}
	}

	function toggleLocationWatcher() {
		if (watcherActive) {
			locationWatcher.stop();
			watcherActive = false;
			toast.info('Location tracking stopped');
		} else {
			locationWatcher.start();
			watcherActive = true;
			toast.info('Location tracking started');
		}
	}

	function getPermissionBadgeVariant(status: string) {
		switch (status) {
			case 'granted':
				return 'default';
			case 'denied':
				return 'destructive';
			case 'prompt':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function getPermissionIcon(status: string) {
		switch (status) {
			case 'granted':
				return CheckCircle;
			case 'denied':
				return XCircle;
			case 'prompt':
				return AlertCircle;
			default:
				return AlertCircle;
		}
	}

	const distance = $derived(
		currentLocation && searchedLocation
			? calculateDistance(
					currentLocation.coordinates.latitude,
					currentLocation.coordinates.longitude,
					searchedLocation.coordinates.latitude,
					searchedLocation.coordinates.longitude
				)
			: null
	);
</script>

<div class="container mx-auto space-y-8 p-6">
	<div class="space-y-2 text-center">
		<h1 class="text-3xl font-bold">🗺️ Location Utilities Demo</h1>
		<p class="text-muted-foreground">Comprehensive testing of reusable location functionality</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Navigation class="h-5 w-5" />
					Location Picker
				</CardTitle>
				<CardDescription>Smart location selection with GPS and search capabilities</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<LocationPicker
					onLocationSelect={handleLocationSelect}
					onError={handleLocationError}
					class="w-full"
				/>

				{#if currentLocation}
					<div class="bg-muted space-y-2 rounded-lg p-3">
						<div class="font-medium">{currentLocation.name}</div>
						<div class="text-muted-foreground text-sm">{currentLocation.address}</div>
						<div class="flex items-center gap-2 text-xs">
							<Badge variant="outline">
								{formatCoordinates(
									currentLocation.coordinates.latitude,
									currentLocation.coordinates.longitude
								)}
							</Badge>
							{#if currentLocation.source}
								<Badge variant="secondary">{currentLocation.source}</Badge>
							{/if}
							{#if currentLocation.accuracy}
								<Badge variant="outline">{Math.round(currentLocation.accuracy)}m accuracy</Badge>
							{/if}
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Search class="h-5 w-5" />
					Enhanced Autocomplete
				</CardTitle>
				<CardDescription>Google Places integration with recent searches</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<EnhancedLocationAutocomplete
					onLocationSelect={handleSearchLocationSelect}
					onError={handleLocationError}
					maxResults={5}
					restrictToNigeria={true}
					showRecentSearches={true}
					class="w-full"
				/>

				{#if searchedLocation}
					<div class="bg-muted space-y-2 rounded-lg p-3">
						<div class="font-medium">{searchedLocation.name}</div>
						<div class="text-muted-foreground text-sm">{searchedLocation.address}</div>
						<div class="flex items-center gap-2 text-xs">
							<Badge variant="outline">
								{formatCoordinates(
									searchedLocation.coordinates.latitude,
									searchedLocation.coordinates.longitude
								)}
							</Badge>
							{#if searchedLocation.source}
								<Badge variant="secondary">{searchedLocation.source}</Badge>
							{/if}
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>System Information</CardTitle>
			<CardDescription>Location permissions and capabilities</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex items-center gap-3">
				<span class="text-sm font-medium">Location Permission:</span>
				<Badge
					variant={getPermissionBadgeVariant(permissionStatus)}
					class="flex items-center gap-1"
				>
					<svelte:component this={getPermissionIcon(permissionStatus)} class="h-3 w-3" />
					{permissionStatus}
				</Badge>
			</div>

			<div class="flex items-center gap-3">
				<span class="text-sm font-medium">Nigeria Bounds:</span>
				<Badge variant="outline" class="font-mono text-xs">
					{NIGERIA_BOUNDS.north}°N, {NIGERIA_BOUNDS.south}°S, {NIGERIA_BOUNDS.east}°E, {NIGERIA_BOUNDS.west}°W
				</Badge>
			</div>

			{#if distance !== null}
				<div class="flex items-center gap-3">
					<span class="text-sm font-medium">Distance Between Locations:</span>
					<Badge variant="default" class="font-mono">
						{formatDistance(distance)}
					</Badge>
				</div>
			{/if}
		</CardContent>
	</Card>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Coordinates to Address</CardTitle>
				<CardDescription>Test reverse geocoding functionality</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex gap-2">
					<Input bind:value={testCoordinates} placeholder="6.5568768, 3.3390592" class="flex-1" />
					<Button onclick={testCoordinateToAddress}>Convert</Button>
				</div>

				{#if coordinateResults}
					<div class="bg-muted space-y-2 rounded-lg p-3">
						<div class="font-medium">{coordinateResults.name}</div>
						<div class="text-muted-foreground text-sm">{coordinateResults.address}</div>
						{#if coordinateResults.source}
							<Badge variant="secondary" class="text-xs">{coordinateResults.source}</Badge>
						{/if}
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Address to Coordinates</CardTitle>
				<CardDescription>Test forward geocoding functionality</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex gap-2">
					<Input
						bind:value={testAddress}
						placeholder="Lagos Island, Lagos, Nigeria"
						class="flex-1"
					/>
					<Button onclick={testAddressToCoordinates}>Convert</Button>
				</div>

				{#if addressResults}
					<div class="bg-muted space-y-2 rounded-lg p-3">
						<div class="font-medium">{addressResults.name}</div>
						<div class="text-muted-foreground text-sm">{addressResults.address}</div>
						<div class="flex items-center gap-2 text-xs">
							<Badge variant="outline" class="font-mono">
								{formatCoordinates(
									addressResults.coordinates.latitude,
									addressResults.coordinates.longitude
								)}
							</Badge>
							{#if addressResults.source}
								<Badge variant="secondary">{addressResults.source}</Badge>
							{/if}
							<Badge
								variant={isLocationInNigeria(
									addressResults.coordinates.latitude,
									addressResults.coordinates.longitude
								)
									? 'default'
									: 'destructive'}
							>
								{isLocationInNigeria(
									addressResults.coordinates.latitude,
									addressResults.coordinates.longitude
								)
									? 'In Nigeria'
									: 'Outside Nigeria'}
							</Badge>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Clock class="h-5 w-5" />
				Location Watcher
			</CardTitle>
			<CardDescription>Continuous location tracking (for testing purposes)</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<Button
				onclick={toggleLocationWatcher}
				variant={watcherActive ? 'destructive' : 'default'}
				class="w-full"
			>
				{watcherActive ? 'Stop Tracking' : 'Start Tracking'}
			</Button>

			{#if watchedLocations.length > 0}
				<div class="space-y-2">
					<h4 class="text-sm font-medium">Recent Location Updates</h4>
					{#each watchedLocations as location, index}
						<div class="flex items-center gap-3 rounded border p-2">
							<Badge variant="outline" class="text-xs">#{index + 1}</Badge>
							<div class="flex-1">
								<div class="text-sm font-medium">{location.name}</div>
								<div class="text-muted-foreground text-xs">{location.address}</div>
							</div>
							{#if location.accuracy}
								<Badge variant="secondary" class="text-xs">
									{Math.round(location.accuracy)}m
								</Badge>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
