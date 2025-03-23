<script lang="ts">
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';
	import { usePlacesAutocomplete } from '$lib/actions/places-autocomplete';
	import Input from '$lib/components/ui/input/input.svelte';
	interface Place {
		name: string;
		address: string;
		lat: number;
		lng: number;
	}

	// Define props with Svelte 5 runes
	let {
		apiKey,
		placeholder = 'Search for a location',
		onSelect = undefined,
		className = ''
	} = $props<{
		apiKey: string;
		placeholder?: string;
		onSelect?: (place: Place) => void;
		className?: string;
	}>();

	// Local state for the selected place
	let selectedPlace = $state<Place | null>(null);

	// Handle when a place is selected
	function handlePlaceSelect(place: Place | null) {
		if (place) {
			selectedPlace = place;
			if (onSelect) onSelect(place);
		}
	}
</script>

<div class="places-input-container">
	<input
		type="text"
		{placeholder}
		class="places-input {className}"
		use:usePlacesAutocomplete={{
			apiKey: PUBLIC_GOOGLE_MAP_API_KEY,
			onPlaceSelect: handlePlaceSelect
		}}
	/>

	{#if selectedPlace && !onSelect}
		<div class="place-details">
			<p class="place-name">{selectedPlace.name}</p>
			<p class="place-address">{selectedPlace.address}</p>
			<p class="place-coords">{selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}</p>
		</div>
	{/if}
</div>

<style>
	.places-input-container {
		margin-bottom: 1rem;
		width: 100%;
	}

	.places-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	.place-details {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background-color: #f9f9f9;
		border-radius: 4px;
	}

	.place-name {
		font-weight: bold;
		margin-bottom: 0.25rem;
	}

	.place-address,
	.place-coords {
		font-size: 0.9rem;
		margin: 0.25rem 0;
	}
</style>
