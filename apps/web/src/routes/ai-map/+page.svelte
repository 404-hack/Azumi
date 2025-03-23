<script lang="ts">
	import { onMount } from 'svelte';
	import { SearchBoxCore, SearchSession } from '@mapbox/search-js-core';
	let searchInput: HTMLInputElement;
	let suggestions: any[] = [];
	let coordinates: { lng: number; lat: number } | null = null;
	let selectedAddress: any = null;
	let isLoading = false;

	let search: any;
	let session: any;

	onMount(() => {
		// Initialize the core search service
		search = new SearchBoxCore({
			accessToken:
				'pk.eyJ1IjoibGF3YWwiLCJhIjoiY204NWlya2s3MTd5ZDJrcXYxMzZ4OHJ3eCJ9.IMuPhjVHygJ_-liPFD5BSA'
		});

		// Create a search session
		session = new SearchSession(search);
	});

	// Function to fetch suggestions as user types
	async function handleInput() {
		if (!searchInput.value || searchInput.value.length < 3) {
			suggestions = [];
			return;
		}

		isLoading = true;

		try {
			const response = await session.suggest(searchInput.value, {
				types: ['address'] // Adding parameter to specify the type of suggestions
			});

			suggestions = response.suggestions;
			console.log('Suggestions:', suggestions);
		} catch (error) {
			console.error('Error fetching suggestions:', error);
			suggestions = [];
		} finally {
			isLoading = false;
		}
	}

	// Function to handle when a suggestion is selected
	async function selectSuggestion(suggestion: any) {
		try {
			const result = await session.retrieve(suggestion);
			selectedAddress = result.features[0];
			coordinates = {
				lng: selectedAddress.geometry.coordinates[0],
				lat: selectedAddress.geometry.coordinates[1]
			};

			console.log('Selected address:', selectedAddress);
			suggestions = []; // Clear suggestions after selection
		} catch (error) {
			console.error('Error retrieving address details:', error);
		}
	}
</script>

<div class="address-search">
	<div class="search-container">
		<input
			type="text"
			bind:this={searchInput}
			on:input={handleInput}
			placeholder="Start typing your address"
			class="search-input"
		/>

		{#if isLoading}
			<div class="loading-indicator">Loading...</div>
		{/if}

		{#if suggestions.length > 0}
			<ul class="suggestions-list">
				{#each suggestions as suggestion}
					<li class="suggestion-item" on:click={() => selectSuggestion(suggestion)}>
						{suggestion.full_address || suggestion.name}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if selectedAddress}
		<div class="selected-address">
			<h3>Selected Address:</h3>
			<p>{selectedAddress.place_name}</p>

			{#if coordinates}
				<p>Coordinates: {coordinates.lng.toFixed(6)}, {coordinates.lat.toFixed(6)}</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.address-search {
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
	}

	.search-container {
		position: relative;
	}

	.search-input {
		width: 100%;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 16px;
	}

	.suggestions-list {
		position: absolute;
		width: 100%;
		max-height: 300px;
		overflow-y: auto;
		background: white;
		border: 1px solid #ccc;
		border-top: none;
		border-radius: 0 0 4px 4px;
		z-index: 10;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.suggestion-item {
		padding: 10px;
		cursor: pointer;
		border-bottom: 1px solid #eee;
	}

	.suggestion-item:hover {
		background-color: #f5f5f5;
	}

	.loading-indicator {
		position: absolute;
		right: 10px;
		top: 10px;
	}

	.selected-address {
		margin-top: 20px;
		padding: 15px;
		background-color: #f9f9f9;
		border-radius: 4px;
		border: 1px solid #eee;
	}
</style>
