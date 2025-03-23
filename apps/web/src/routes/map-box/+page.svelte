<script lang="ts">
	import { usePlacesAutocomplete } from '$lib/actions/places-autocomplete';

	// Define Place interface
	interface Place {
		name: string;
		address: string;
		lat: number;
		lng: number;
	}

	// Store selected location
	let selectedPlace = $state<Place | null>(null);
	let API_KEY = 'AIzaSyAMRJRN4_FxUnfexQrDDFfeic88ecNdGx8';

	// Handler for place selection
	function handlePlaceSelect(place: Place | null) {
		if (place) {
			selectedPlace = place;
		}
	}
</script>

<svelte:head>
	<title>Location Autocomplete - African Market</title>
</svelte:head>

<div class="container">
	<div class="search-container">
		<h1>Location Search</h1>
		<div class="input-wrapper">
			<input
				type="text"
				placeholder="Search for a location"
				class="search-input"
				use:usePlacesAutocomplete={{
					apiKey: API_KEY,
					onPlaceSelect: handlePlaceSelect
				}}
			/>
		</div>

		{#if selectedPlace}
			<div class="selected-place">
				<h3>{selectedPlace.name}</h3>
				<p>{selectedPlace.address}</p>
				<p>Coordinates: {selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
	}

	.search-container {
		width: 100%;
	}

	.input-wrapper {
		display: flex;
		margin-bottom: 1rem;
	}

	.search-input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 16px;
	}

	.selected-place {
		background-color: #f9f9f9;
		padding: 1rem;
		border-radius: 4px;
		margin-top: 1rem;
	}

	h1 {
		margin-bottom: 1rem;
	}

	h3 {
		margin: 0 0 0.5rem 0;
	}

	p {
		margin: 0.25rem 0;
	}
</style>
