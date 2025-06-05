<script lang="ts">
	import { Loader2, MapPin, AlertCircle, CheckCircle } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';
	import {
		getCurrentLocationWithOptions,
		getLocationFromAddress,
		type LocationResult,
		type LocationError,
		type LocationOptions,
		getLocationAccuracyMessage,
		LOCATION_ERRORS
	} from '$lib/utils/location';
	import PlacesInput from '$lib/components/ui/places-input/places-input.svelte';
	import type { Place } from '$lib/types/places';

	interface Props {
		onLocationSelect: (location: LocationResult) => void;
		onError?: (error: LocationError) => void;
		locationOptions?: LocationOptions;
		showPlacesInput?: boolean;
		showCurrentLocationButton?: boolean;
		currentLocationButtonText?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		onLocationSelect,
		onError,
		locationOptions = {},
		showPlacesInput = true,
		showCurrentLocationButton = true,
		currentLocationButtonText = 'Use Current Location',
		placeholder = 'Search for an address...',
		disabled = false,
		class: className = ''
	}: Props = $props();

	let isGettingLocation = $state(false);
	let currentAccuracy = $state<number | null>(null);

	async function handleCurrentLocation() {
		if (disabled) return;

		try {
			isGettingLocation = true;
			currentAccuracy = null;

			console.log('🌍 Starting location detection...');

			const result = await getCurrentLocationWithOptions(locationOptions);

			console.log('📍 Location result:', result);

			if (result.accuracy) {
				currentAccuracy = result.accuracy;
				const accuracyMessage = getLocationAccuracyMessage(result.accuracy);
				toast.info(accuracyMessage);
			}

			toast.success(`Location found: ${result.name}`);
			onLocationSelect(result);
		} catch (error) {
			console.error('❌ Location error:', error);

			const locationError = error as LocationError;
			toast.error(locationError.userMessage);

			if (onError) {
				onError(locationError);
			}
		} finally {
			isGettingLocation = false;
		}
	}

	async function handlePlaceSelect(place: Place) {
		if (disabled) return;

		try {
			console.log('🏠 Place selected:', place);

			const result: LocationResult = {
				name: place.name,
				address: place.address,
				coordinates: {
					latitude: place.lat,
					longitude: place.lng
				},
				source: 'places'
			};

			toast.success(`Location selected: ${result.name}`);
			onLocationSelect(result);
		} catch (error) {
			console.error('❌ Place selection error:', error);

			const locationError: LocationError = {
				code: 'PLACE_SELECTION_FAILED',
				message: 'Failed to select place',
				userMessage: 'Failed to select location. Please try again.'
			};

			toast.error(locationError.userMessage);

			if (onError) {
				onError(locationError);
			}
		}
	}

	async function handleAddressSearch(address: string) {
		if (disabled || !address.trim()) return;

		try {
			console.log('🔍 Searching address:', address);

			const result = await getLocationFromAddress(address, locationOptions);

			if (result) {
				toast.success(`Location found: ${result.name}`);
				onLocationSelect(result);
			} else {
				const locationError = LOCATION_ERRORS.GEOCODING_NO_RESULTS;
				toast.error(locationError.userMessage);

				if (onError) {
					onError(locationError);
				}
			}
		} catch (error) {
			console.error('❌ Address search error:', error);

			const locationError = LOCATION_ERRORS.GEOCODING_FAILED;
			toast.error(locationError.userMessage);

			if (onError) {
				onError(locationError);
			}
		}
	}
</script>

<div class="space-y-3 {className}">
	{#if showPlacesInput}
		<div class="relative">
			<PlacesInput onPlaceSelect={handlePlaceSelect} {placeholder} {disabled} />
		</div>
	{/if}

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
				{currentLocationButtonText}
			{/if}
		</Button>
	{/if}

	{#if currentAccuracy !== null}
		<div class="text-muted-foreground flex items-center gap-2 text-sm">
			{#if currentAccuracy <= 10}
				<CheckCircle class="h-4 w-4 text-green-500" />
				<span class="text-green-600">High accuracy: {Math.round(currentAccuracy)}m</span>
			{:else if currentAccuracy <= 100}
				<CheckCircle class="h-4 w-4 text-yellow-500" />
				<span class="text-yellow-600">Good accuracy: {Math.round(currentAccuracy)}m</span>
			{:else}
				<AlertCircle class="h-4 w-4 text-orange-500" />
				<span class="text-orange-600">Low accuracy: {Math.round(currentAccuracy)}m</span>
			{/if}
		</div>
	{/if}
</div>
