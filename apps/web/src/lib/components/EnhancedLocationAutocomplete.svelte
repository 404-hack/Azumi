<script lang="ts">
	import { Search, MapPin, Loader2, X } from 'lucide-svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		getLocationFromAddress,
		getCurrentLocationWithOptions,
		type LocationResult,
		type LocationOptions,
		NIGERIA_BOUNDS,
		isLocationInNigeria,
		type LocationError,
		getLocationAccuracyMessage
	} from '$lib/utils/location';
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	interface AutocompleteResult {
		description: string;
		place_id: string;
		structured_formatting?: {
			main_text: string;
			secondary_text: string;
		};
		types: string[];
	}

	interface Props {
		onLocationSelect: (location: LocationResult) => void;
		onError?: (error: LocationError) => void;
		locationOptions?: LocationOptions;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		maxResults?: number;
		restrictToNigeria?: boolean;
		showRecentSearches?: boolean;
		showCurrentLocationButton?: boolean;
	}

	let {
		onLocationSelect,
		onError,
		locationOptions = {},
		placeholder = 'Search for an address...',
		disabled = false,
		class: className = '',
		maxResults = 5,
		restrictToNigeria = true,
		showRecentSearches = true,
		showCurrentLocationButton = true
	}: Props = $props();

	let searchQuery = $state('');
	let isSearching = $state(false);
	let isGettingLocation = $state(false);
	let showSuggestions = $state(false);
	let suggestions = $state<AutocompleteResult[]>([]);
	let recentSearches = $state<LocationResult[]>([]);
	let autocompleteService: google.maps.places.AutocompleteService | null = null;
	let placesService: google.maps.places.PlacesService | null = null;
	let searchTimeout: number | null = null;

	let inputElement: HTMLInputElement;

	onMount(() => {
		if (browser && PUBLIC_GOOGLE_MAP_API_KEY) {
			initializeGooglePlaces();
		}
		loadRecentSearches();
	});

	function initializeGooglePlaces() {
		if (typeof google !== 'undefined' && google.maps) {
			autocompleteService = new google.maps.places.AutocompleteService();

			const dummyDiv = document.createElement('div');
			const map = new google.maps.Map(dummyDiv);
			placesService = new google.maps.places.PlacesService(map);
		} else {
			loadGoogleMapsAPI();
		}
	}

	function loadGoogleMapsAPI() {
		if (document.querySelector('script[src*="maps.googleapis.com"]')) {
			return;
		}

		const script = document.createElement('script');
		script.src = `https://maps.googleapis.com/maps/api/js?key=${PUBLIC_GOOGLE_MAP_API_KEY}&libraries=places&callback=initializeGooglePlacesCallback`;
		script.async = true;
		document.head.appendChild(script);

		// @ts-ignore
		window.initializeGooglePlacesCallback = () => {
			initializeGooglePlaces();
		};
	}

	function loadRecentSearches() {
		if (browser && showRecentSearches) {
			try {
				const stored = localStorage.getItem('recentLocationSearches');
				if (stored) {
					recentSearches = JSON.parse(stored);
				}
			} catch (error) {
				console.warn('Failed to load recent searches:', error);
			}
		}
	}

	function saveRecentSearch(location: LocationResult) {
		if (!showRecentSearches || !browser) return;

		try {
			const filtered = recentSearches.filter(
				(item) =>
					item.coordinates.latitude !== location.coordinates.latitude ||
					item.coordinates.longitude !== location.coordinates.longitude
			);

			const updated = [location, ...filtered].slice(0, 5);
			recentSearches = updated;

			localStorage.setItem('recentLocationSearches', JSON.stringify(updated));
		} catch (error) {
			console.warn('Failed to save recent search:', error);
		}
	}

	async function performGoogleAutocomplete(query: string) {
		if (!autocompleteService || !query.trim()) {
			suggestions = [];
			return;
		}

		const request: google.maps.places.AutocompletionRequest = {
			input: query,
			types: ['establishment', 'geocode'],
			fields: ['place_id', 'name', 'formatted_address', 'geometry']
		};

		if (restrictToNigeria) {
			request.componentRestrictions = { country: 'ng' };
			request.location = new google.maps.LatLng(9.082, 8.6753);
			request.radius = 1000000;
		}

		return new Promise<AutocompleteResult[]>((resolve) => {
			autocompleteService!.getPlacePredictions(request, (predictions, status) => {
				if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
					resolve(predictions.slice(0, maxResults));
				} else {
					resolve([]);
				}
			});
		});
	}

	async function getPlaceDetails(placeId: string): Promise<LocationResult | null> {
		if (!placesService) return null;

		return new Promise((resolve) => {
			placesService!.getDetails(
				{
					placeId,
					fields: ['name', 'formatted_address', 'geometry', 'place_id']
				},
				(place, status) => {
					if (status === google.maps.places.PlacesServiceStatus.OK && place) {
						const location = place.geometry?.location;
						if (location) {
							const lat = location.lat();
							const lng = location.lng();

							if (restrictToNigeria && !isLocationInNigeria(lat, lng)) {
								resolve(null);
								return;
							}

							resolve({
								name: place.name || place.formatted_address || 'Unknown location',
								address: place.formatted_address || '',
								coordinates: {
									latitude: lat,
									longitude: lng
								},
								source: 'google_places'
							});
						}
					}
					resolve(null);
				}
			);
		});
	}

	async function handleSearch(query: string) {
		if (!query.trim()) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		isSearching = true;
		showSuggestions = true;

		try {
			if (autocompleteService) {
				suggestions = await performGoogleAutocomplete(query);
			} else {
				suggestions = [];
			}
		} catch (error) {
			console.error('Search error:', error);
			suggestions = [];
		} finally {
			isSearching = false;
		}
	}

	function handleInputChange() {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		searchTimeout = setTimeout(() => {
			handleSearch(searchQuery);
		}, 300);
	}

	async function selectSuggestion(suggestion: AutocompleteResult) {
		isSearching = true;
		showSuggestions = false;
		searchQuery = suggestion.description;

		try {
			const location = await getPlaceDetails(suggestion.place_id);

			if (location) {
				saveRecentSearch(location);
				onLocationSelect(location);
			} else {
				const fallbackLocation = await getLocationFromAddress(
					suggestion.description,
					locationOptions
				);
				if (fallbackLocation) {
					saveRecentSearch(fallbackLocation);
					onLocationSelect(fallbackLocation);
				} else {
					throw new Error('Failed to get location details');
				}
			}
		} catch (error) {
			console.error('Error selecting suggestion:', error);
			if (onError) {
				onError({
					code: 'SELECTION_FAILED',
					message: 'Failed to select location',
					userMessage: 'Failed to select location. Please try again.'
				});
			}
		} finally {
			isSearching = false;
		}
	}

	function selectRecentSearch(location: LocationResult) {
		showSuggestions = false;
		searchQuery = location.name;
		onLocationSelect(location);
	}

	async function handleCurrentLocation() {
		if (disabled) return;

		try {
			isGettingLocation = true;

			const result = await getCurrentLocationWithOptions(locationOptions);

			if (result.accuracy) {
				const accuracyMessage = getLocationAccuracyMessage(result.accuracy);
				toast.info(accuracyMessage);
			}

			searchQuery = result.name;
			saveRecentSearch(result);
			onLocationSelect(result);
		} catch (error) {
			console.error('Location error:', error);

			const locationError = error as LocationError;
			toast.error(locationError.userMessage);

			if (onError) {
				onError(locationError);
			}
		} finally {
			isGettingLocation = false;
		}
	}

	function clearSearch() {
		searchQuery = '';
		suggestions = [];
		showSuggestions = false;
		inputElement?.focus();
	}

	function handleInputFocus() {
		if (searchQuery.trim() || recentSearches.length > 0) {
			showSuggestions = true;
		}
	}

	function handleInputBlur() {
		setTimeout(() => {
			showSuggestions = false;
		}, 200);
	}
</script>

<div class="space-y-2 {className}">
	<div class="relative">
		<Search class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
		<Input
			bind:this={inputElement}
			bind:value={searchQuery}
			oninput={handleInputChange}
			onfocus={handleInputFocus}
			onblur={handleInputBlur}
			{placeholder}
			{disabled}
			class="pl-10 {searchQuery ? 'pr-10' : ''}"
		/>
		{#if searchQuery}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onclick={clearSearch}
				class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
			>
				<X class="h-4 w-4" />
			</Button>
		{/if}
		{#if isSearching}
			<Loader2 class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
		{/if}
	</div>

	{#if showCurrentLocationButton}
		<Button
			type="button"
			variant="outline"
			onclick={handleCurrentLocation}
			class="w-full"
			{disabled}
		>
			{#if isGettingLocation}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Getting location...
			{:else}
				<MapPin class="text-primary mr-2 h-4 w-4" />
				Use Current Location
			{/if}
		</Button>
	{/if}

	{#if showSuggestions}
		<div class="bg-background absolute top-full z-50 mt-1 w-full rounded-md border shadow-lg">
			<ScrollArea class="max-h-64">
				<div class="p-1">
					{#if suggestions.length > 0}
						<div class="space-y-1">
							{#each suggestions as suggestion}
								<button
									type="button"
									onclick={() => selectSuggestion(suggestion)}
									class="hover:bg-muted focus:bg-muted flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm focus:outline-none"
								>
									<MapPin class="text-muted-foreground h-4 w-4 flex-shrink-0" />
									<div class="flex-1 overflow-hidden">
										{#if suggestion.structured_formatting}
											<div class="truncate font-medium">
												{suggestion.structured_formatting.main_text}
											</div>
											<div class="text-muted-foreground truncate text-xs">
												{suggestion.structured_formatting.secondary_text}
											</div>
										{:else}
											<div class="truncate">{suggestion.description}</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{:else if !searchQuery.trim() && recentSearches.length > 0}
						<div class="space-y-1">
							<div class="text-muted-foreground px-3 py-2 text-xs font-medium">Recent searches</div>
							{#each recentSearches as recent}
								<button
									type="button"
									onclick={() => selectRecentSearch(recent)}
									class="hover:bg-muted focus:bg-muted flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm focus:outline-none"
								>
									<MapPin class="text-muted-foreground h-4 w-4 flex-shrink-0" />
									<div class="flex-1 overflow-hidden">
										<div class="truncate font-medium">{recent.name}</div>
										<div class="text-muted-foreground truncate text-xs">{recent.address}</div>
									</div>
								</button>
							{/each}
						</div>
					{:else if searchQuery.trim() && !isSearching}
						<div class="text-muted-foreground px-3 py-2 text-sm">
							No locations found for "{searchQuery}"
						</div>
					{/if}
				</div>
			</ScrollArea>
		</div>
	{/if}
</div>
