<script lang="ts">
	import PlacesInput from '$lib/components/PlacesInput.svelte';

	// Define interface for place data
	interface Place {
		name: string;
		address: string;
		lat: number;
		lng: number;
	}

	// API key for Google Maps
	const API_KEY = 'AIzaSyAMRJRN4_FxUnfexQrDDFfeic88ecNdGx8';

	// State to store the selected place
	let selectedPlace = $state<Place | null>(null);
	let locations = $state<Place[]>([]);

	// Handler for place selection
	function handlePlaceSelect(place: Place) {
		selectedPlace = place;
	}

	// Function to add current place to the locations list
	function addLocation() {
		if (selectedPlace) {
			locations = [...locations, selectedPlace];
			selectedPlace = null;
		}
	}

	// Function to remove a location from the list
	function removeLocation(index: number) {
		locations = locations.filter((_, i) => i !== index);
	}
</script>

<svelte:head>
	<title>Location Example - African Market</title>
</svelte:head>

<div class="container">
	<h1>Location Selection Example</h1>

	<div class="input-section">
		<h2>Select a Location</h2>
		<PlacesInput
			apiKey={API_KEY}
			placeholder="Search for any location"
			onSelect={handlePlaceSelect}
		/>

		{#if selectedPlace}
			<div class="selected-place">
				<h3>Selected Location</h3>
				<p><strong>{selectedPlace.name}</strong></p>
				<p>{selectedPlace.address}</p>
				<p>Latitude: {selectedPlace.lat.toFixed(6)}</p>
				<p>Longitude: {selectedPlace.lng.toFixed(6)}</p>
				<button class="add-button" onclick={addLocation}>Add to My Locations</button>
			</div>
		{/if}
	</div>

	<div class="locations-section">
		<h2>My Locations</h2>
		{#if locations.length === 0}
			<p class="empty-message">No locations added yet. Search and add locations above.</p>
		{:else}
			<ul class="locations-list">
				{#each locations as location, i}
					<li class="location-item">
						<div class="location-details">
							<h3>{location.name}</h3>
							<p>{location.address}</p>
							<p class="coordinates">
								{location.lat.toFixed(6)}, {location.lng.toFixed(6)}
							</p>
						</div>
						<button class="remove-button" onclick={() => removeLocation(i)}>Remove</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	h1 {
		margin-bottom: 2rem;
		font-size: 1.8rem;
	}

	h2 {
		margin-bottom: 1rem;
		font-size: 1.5rem;
	}

	.input-section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background-color: #f9f9f9;
		border-radius: 8px;
	}

	.selected-place {
		margin-top: 1.5rem;
		padding: 1rem;
		background-color: #fff;
		border: 1px solid #eee;
		border-radius: 6px;
	}

	.selected-place p {
		margin: 0.25rem 0;
	}

	.add-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background-color: #4a8;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.add-button:hover {
		background-color: #3a7;
	}

	.locations-section {
		padding: 1.5rem;
		background-color: #f9f9f9;
		border-radius: 8px;
	}

	.empty-message {
		color: #777;
		font-style: italic;
	}

	.locations-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.location-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		margin-bottom: 1rem;
		background-color: white;
		border: 1px solid #eee;
		border-radius: 6px;
	}

	.location-details h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
	}

	.location-details p {
		margin: 0.25rem 0;
	}

	.coordinates {
		font-size: 0.85rem;
		color: #666;
	}

	.remove-button {
		padding: 0.5rem 1rem;
		background-color: #e55;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.remove-button:hover {
		background-color: #d44;
	}
</style>
