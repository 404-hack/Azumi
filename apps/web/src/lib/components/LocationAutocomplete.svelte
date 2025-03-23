<script lang="ts">
	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';

	// Define types for suggestions and other data structures
	type Coordinates = [number, number];
	
	interface Address {
		street?: string;
		house_number?: string;
		neighborhood?: string;
		locality?: string;
		place?: string;
		region?: string;
		country?: string;
		postcode?: string;
		hasStreetLevel?: boolean;
		[key: string]: any; // For other properties from API responses
	}
	
	interface Suggestion {
		id: string;
		text: string;
		coordinates: Coordinates;
		type?: string;
		relevance?: number;
		address?: Address;
		nominatim?: boolean;
		raw?: any;
	}
	
	interface Position {
		coords: {
			latitude: number;
			longitude: number;
			accuracy?: number;
		};
	}
	
	// Create event dispatcher for Svelte 5
	const dispatch = createEventDispatcher<{
		input: { value: string };
		select: { suggestion: Suggestion };
		error: { message: string };
	}>();

	// Define props with $props rune
	let { 
		placeholder = 'Search for a street in Nigeria',
		value = '',
		showCurrentLocationButton = true,
		mapboxToken = 'pk.eyJ1IjoibGF3YWwiLCJhIjoiY204NWlya2s3MTd5ZDJrcXYxMzZ4OHJ3eCJ9.IMuPhjVHygJ_-liPFD5BSA',
		id = '',
		name = '',
		required = false,
		disabled = false,
		autofocus = false,
		streetLevelOnly = true // Only show street-level results by default
	} = $props();

	// Internal state using $state rune
	let inputElement = $state<HTMLInputElement | null>(null);
	let suggestions = $state<Suggestion[]>([]);
	let searchTerm = $state(value);
	let isLoading = $state(false);
	let locationError = $state('');
	let isLocating = $state(false);
	let showSuggestions = $state(false);

	// Set Mapbox token
	mapboxgl.accessToken = mapboxToken;

	// Use $effect for handling value changes
	$effect(() => {
		if (value !== searchTerm) {
			searchTerm = value;
		}
	});

	// Use $effect for propagating search term changes
	$effect(() => {
		if (searchTerm !== value) {
			value = searchTerm;
			dispatch('input', { value: searchTerm });
		}
	});

	// Improved search function with better results and reliability
	async function searchLocations() {
		if (searchTerm.length < 2) {
			suggestions = [];
	// Enhanced Mapbox search function with street-level precision focus
	async function searchMapbox(query: string) {
		}

		isLoading = true;
		suggestions = [];
			const params = new URLSearchParams({
				access_token: mapboxgl.accessToken ?? '',
				country: 'ng',
				proximity: '3.3792,6.5244', // Lagos coordinates for better local results
				types: 'address,street,poi,neighborhood,district', // Prioritize address and street types
				autocomplete: 'true',
				fuzzyMatch: 'true',
				language: 'en',
				limit: '12' // Get more results to ensure street-level coverage
			});
						(t) =>
							t.text === v.text ||
							(t.coordinates[0] === v.coordinates[0] && t.coordinates[1] === v.coordinates[1])
					) === i
			);

			// Filter to only street-level results if that option is enabled
			if (streetLevelOnly) {
				suggestions = suggestions.filter(
					(suggestion) => suggestion.address && suggestion.address.hasStreetLevel
				);
			}
					.map((feature: any) => {
			// Sort by relevance and street-level precision
						const context = feature.context || [];
						const neighborhood = context.find((c: any) => c.id.startsWith('neighborhood'))?.text || '';
						const locality = context.find((c: any) => c.id.startsWith('locality'))?.text || '';
						const place = context.find((c: any) => c.id.startsWith('place'))?.text || '';
						const region = context.find((c: any) => c.id.startsWith('region'))?.text || '';
				return (b.relevance || 0) - (a.relevance || 0);
			});
		} catch (error) {
			console.error('Error in search:', error);
		} finally {
			isLoading = false;
		}
							const streetContext = context.find((c: any) => c.id.startsWith('street'));

	// Enhanced Mapbox search function with street-level precision focus
	async function searchMapbox(query) {
		try {
			// Primary search with Mapbox Geocoding API
			const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;

			const params = new URLSearchParams({
				access_token: mapboxgl.accessToken,
				country: 'ng',
				proximity: '3.3792,6.5244', // Lagos coordinates for better local results
				types: 'address,street,poi,neighborhood,district', // Prioritize address and street types
				autocomplete: 'true',
				fuzzyMatch: 'true',
				language: 'en',
				limit: '12' // Get more results to ensure street-level coverage
			});

			const response = await fetch(`${endpoint}?${params.toString()}`);

			if (!response.ok) {
				throw new Error(`Mapbox search failed with status: ${response.status}`);
			}

			const data = await response.json();

			if (data.features && data.features.length > 0) {
				// Transform Mapbox results to our suggestion format with enhanced street info
				const mapboxSuggestions = data.features
					.map((feature) => {
						// Extract street level information with more precision
						const context = feature.context || [];
						const neighborhood = context.find((c) => c.id.startsWith('neighborhood'))?.text || '';
						const locality = context.find((c) => c.id.startsWith('locality'))?.text || '';
						const place = context.find((c) => c.id.startsWith('place'))?.text || '';
						const region = context.find((c) => c.id.startsWith('region'))?.text || '';

						// Extract street name and house number
						let streetName = feature.text || '';
						let houseNumber = feature.address || '';

						// For POIs, try to extract the street they're on from context
						if (feature.place_type[0] === 'poi') {
							const streetContext = context.find((c) => c.id.startsWith('street'));
							if (streetContext) streetName = streetContext.text;
						}

					.sort((a: any, b: any) => {
						const hasStreetLevel =
							feature.place_type[0] === 'address' ||
							feature.place_type[0] === 'street' ||
							(feature.place_type[0] === 'poi' && streetName);

						// Create a display name with optimized street information
						const streetDisplay = houseNumber ? `${houseNumber} ${streetName}` : streetName;

						// Format the components with street emphasis
						let components = [];

						if (hasStreetLevel) {
							// For street-level results, prioritize the street info
							components = [streetDisplay, neighborhood, locality || place, region, 'Nigeria'];
						} else {
							// For other results, use normal formatting
	async function searchNominatim(query: string) {
						}

						// Remove duplicates and empty values
						const uniqueComponents = [...new Set(components.filter(Boolean))];
				const parts = query.split(',').map((part: string) => part.trim());

						return {
							id: feature.id,
							text: formattedText,
							coordinates: feature.center,
							type: feature.place_type[0] || 'location',
							relevance: feature.relevance * (hasStreetLevel ? 1.2 : 1), // Boost street-level results
							address: {
								street: streetName || '',
								house_number: houseNumber || '',
								neighborhood,
								locality,
								place,
								region,
								country: 'Nigeria',
								hasStreetLevel // Flag for street-level precision
							},
							raw: feature
						};
					})
					// Sort to prioritize street-level results
					.sort((a, b) => {
						// First sort by street-level precision
						if (a.address.hasStreetLevel && !b.address.hasStreetLevel) return -1;
						if (!a.address.hasStreetLevel && b.address.hasStreetLevel) return 1;
						// Then by relevance
						return b.relevance - a.relevance;
					});

				// Add these to our suggestions
				suggestions = [...suggestions, ...mapboxSuggestions];
			}
		} catch (error) {
			console.error('Mapbox search error:', error);
		}
	}

	// Enhanced Nominatim search with street-level focus
	async function searchNominatim(query) {
		try {
					.map((item: any) => {
			const structuredSearch = async () => {
				// Try to parse the query into street and city components
				const parts = query.split(',').map((part) => part.trim());
				let street = parts[0];
				let city = parts.length > 1 ? parts[1] : 'lagos'; // Default to Lagos if no city

				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?` +
						`street=${encodeURIComponent(street)}` +
						`&city=${encodeURIComponent(city)}` +
						`&countrycodes=ng` +
						`&format=json` +
						`&addressdetails=1` +
						`&limit=5`
				);

				if (!response.ok) return null;
				return await response.json();
			};

			// Then do a regular search
			const regularSearch = async () => {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?` +
						`q=${encodeURIComponent(query)}` +
						`&countrycodes=ng` +
						`&format=json` +
						`&addressdetails=1` +
						`&limit=5`
				);

				if (!response.ok) return null;
				return await response.json();
			};

			// Try structured first, fall back to regular
			let data = await structuredSearch();
			if (!data || data.length === 0) {
				data = await regularSearch();
			}

			if (data && data.length > 0) {
				const nominatimSuggestions = data
					.map((item) => {
						// Determine if this has street-level precision
						const hasStreetLevel =
							item.address && (item.address.road || item.address.street || item.address.pedestrian);

						// Create a street display
						let streetDisplay = '';
						if (item.address) {
							const street = item.address.road || item.address.street || item.address.pedestrian;
							const houseNumber = item.address.house_number;
							streetDisplay = houseNumber && street ? `${houseNumber} ${street}` : street;
						}

						return {
							id: `nominatim-${item.place_id}`,
							text:
								hasStreetLevel && streetDisplay
									? item.display_name.replace(streetDisplay, `<strong>${streetDisplay}</strong>`)
									: item.display_name,
							coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
							type: hasStreetLevel ? 'address' : item.type || 'location',
							address: {
								...item.address,
								hasStreetLevel
							},
							relevance: hasStreetLevel ? 1 : 0.7, // Boost street-level results
							nominatim: true
						};
					})
					.sort((a, b) => {
						// Sort by street-level precision first
						if (a.address.hasStreetLevel && !b.address.hasStreetLevel) return -1;
						if (!a.address.hasStreetLevel && b.address.hasStreetLevel) return 1;
						return 0;
					});

				// Add Nominatim results to suggestions
				suggestions = [...suggestions, ...nominatimSuggestions];
			}
		} catch (error) {
			console.error('Nominatim search error:', error);
		}
	}

	// Get user's current location function
	function getUserLocation() {
		if (!navigator.geolocation) {
			locationError = 'Geolocation is not supported by your browser';
			dispatch('error', { message: locationError });
			return;
		}

		isLocating = true;
		locationError = '';

		// First try IP-based geolocation as a fallback
		fetch('https://ipapi.co/json/')
			.then((response) => response.json())
			.then((ipData) => {
				// Store the IP-based location as fallback
				const ipFallbackCoords = [ipData.longitude, ipData.latitude];

				// Now try to get precise browser geolocation
				const options = {
					enableHighAccuracy: true,
					timeout: 7000,
					maximumAge: 0
				};

				// Set a timeout in case the geolocation request hangs
				const timeoutId = setTimeout(() => {
					handleLocationSuccess(
						{
							coords: {
								latitude: ipData.latitude,
								longitude: ipData.longitude,
								accuracy: 5000 // IP geolocation is typically not very accurate
							}
						},
						true
					);
				}, 10000);

				navigator.geolocation.getCurrentPosition(
					(position) => {
						clearTimeout(timeoutId);
	function handleLocationSuccess(position: Position) {
		const { latitude, longitude } = position.coords;

		// Reverse geocode the coordinates to get address
		reverseGeocode(longitude, latitude);
		isLocating = false;
	}
						if (ipFallbackCoords[0] && ipFallbackCoords[1]) {
							handleLocationSuccess(
	function handleLocationError(error: GeolocationPositionError | any) {
									coords: {
										latitude: ipData.latitude,
										longitude: ipData.longitude,
										accuracy: 5000
									}
								},
								true
							);
						} else {
							handleLocationError(error);
						}
					},
					options
				);
			})
			.catch((error) => {
				console.error('Error with IP geolocation:', error);

				// Try browser geolocation without fallback
				const options = {
					enableHighAccuracy: true,
					timeout: 15000,
					maximumAge: 0
				};

				navigator.geolocation.getCurrentPosition(
	async function reverseGeocode(lon: number, lat: number) {
					(error) => handleLocationError(error),
			const params = new URLSearchParams({
				access_token: mapboxgl.accessToken ?? '',
				language: 'en',
				types: 'address,place,neighborhood'
			});
	// Handler for successful location
	function handleLocationSuccess(position, isIpBased = false) {
		const { latitude, longitude } = position.coords;

		// Reverse geocode the coordinates to get address
		reverseGeocode(longitude, latitude);
		isLocating = false;
	}

	// Error handler
	function handleLocationError(error) {
		console.error('Error getting location:', error);

		// Provide more specific error messages
		switch (error.code) {
			case 1: // PERMISSION_DENIED
				locationError =
					'Location permission denied. Please enable location services in your browser and try again.';
				const addressComponents: Record<string, string> = {};
			case 2: // POSITION_UNAVAILABLE
				locationError =
				context.forEach((item: any) => {
				break;
			case 3: // TIMEOUT
				locationError =
					'Location request timed out. Please check your internet connection and try again.';
				break;
			default:
				locationError =
					'Unable to get your location. Please try again or enter your address manually.';
		}

		dispatch('error', { message: locationError });
		isLocating = false;
	}

	// Reverse geocode function using Mapbox
	async function reverseGeocode(lon, lat) {
		try {
			const params = new URLSearchParams({
				access_token: mapboxgl.accessToken,
				language: 'en',
				types: 'address,place,neighborhood'
			});

			const response = await fetch(
				`https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?${params.toString()}`
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			// Check if we got valid results
			if (data.features && data.features.length > 0) {
				// Use the most relevant feature (first one)
				const feature = data.features[0];
				searchTerm = feature.place_name;

				// Extract detailed address components
				const addressComponents = {};
				const context = feature.context || [];

				context.forEach((item) => {
					const id = item.id || '';
					if (id.includes('neighborhood')) addressComponents.neighborhood = item.text;
					if (id.includes('locality')) addressComponents.locality = item.text;
					if (id.includes('place')) addressComponents.place = item.text;
					if (id.includes('postcode')) addressComponents.postcode = item.text;
					if (id.includes('region')) addressComponents.region = item.text;
					if (id.includes('country')) addressComponents.country = item.text;
				});

	let timeout: ReturnType<typeof setTimeout>;
				if (feature.text) addressComponents.street = feature.text;

				// Create a suggestion object for the selected location
				const suggestion = {
					text: feature.place_name,
					coordinates: feature.center,
	function selectSuggestion(suggestion: Suggestion) {
						...addressComponents,
						hasStreetLevel:
							feature.place_type.includes('address') || feature.place_type.includes('street')
					},
					raw: feature
				};

				// Dispatch the selection event
				dispatch('select', { suggestion });
			} else {
				// Fallback to coordinates if reverse geocoding returns no results
				searchTerm = `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
			}
		} catch (error) {
			console.error('Error reverse geocoding with Mapbox:', error);

			// Try fallback service
			try {
				const backupResponse = await fetch(
					`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
				);

				if (backupResponse.ok) {
					const backupData = await backupResponse.json();
					searchTerm = `${backupData.locality || ''}, ${backupData.city || ''}, ${backupData.principalSubdivision || ''}, ${backupData.countryName || ''}`;
				} else {
					searchTerm = `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
				}
			} catch (backupError) {
				// Final fallback to coordinates
				searchTerm = `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
			}
		}
	}

	// Debounce function to limit API calls
	let timeout;
	function handleInput() {
		clearTimeout(timeout);
		timeout = setTimeout(searchLocations, 300);
	}

	// Selection function
	function selectSuggestion(suggestion) {
		searchTerm = suggestion.text.replace(/<\/?strong>/g, ''); // Remove any HTML tags
		suggestions = [];
		showSuggestions = false;

		// Dispatch the selection event
		dispatch('select', { suggestion });
	}

	// Handle blur event
	function handleBlur() {
		// Delay hiding suggestions to allow for clicks
		setTimeout(() => {
			showSuggestions = false;
		}, 200);
	}

	// Handle focus event
	function handleFocus() {
		if (searchTerm.length >= 2) {
			searchLocations();
		}
	}

	onMount(() => {
		// Focus the input field if autofocus is true
		if (autofocus && inputElement) {
			inputElement.focus();
		}
	});
</script>

<div class="location-autocomplete">
	<div class="input-wrapper">
		<input
			bind:this={inputElement}
			bind:value={searchTerm}
			on:input={handleInput}
			on:focus={handleFocus}
			on:blur={handleBlur}
			{placeholder}
			type="text"
			{id}
			{name}
			{required}
			{disabled}
			autocomplete="off"
		/>
		{#if isLoading}
			<div class="loading">
				<div class="spinner"></div>
			</div>
		{/if}
	</div>

	{#if showCurrentLocationButton}
		<button class="location-button" on:click={getUserLocation} disabled={isLocating || disabled}>
			{#if isLocating}
				<div class="spinner-small"></div>
				Finding location...
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<circle cx="12" cy="12" r="3"></circle>
				</svg>
				Use my current location
			{/if}
		</button>
	{/if}

	{#if locationError}
		<div class="error-message">{locationError}</div>
	{/if}

	{#if showSuggestions && suggestions.length > 0}
		<ul class="suggestions">
			{#each suggestions as suggestion}
				<li
					class={suggestion.address && suggestion.address.hasStreetLevel ? 'street-level' : ''}
					on:click={() => selectSuggestion(suggestion)}
				>
					<div class="suggestion-icon">
						{#if suggestion.address && suggestion.address.hasStreetLevel}
							<!-- Street-level icon -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#4285f4"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="3" y1="12" x2="21" y2="12"></line>
								<path d="M8 12v-2a4 4 0 0 1 8 0v2"></path>
							</svg>
						{:else if suggestion.type === 'address'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M18 2h-3a5 5 0 0 0-5 5v14"></path>
								<circle cx="9" cy="18" r="3"></circle>
							</svg>
						{:else if suggestion.type === 'poi'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M3 3h18v18H3z"></path>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<circle cx="12" cy="12" r="7"></circle>
								<polyline points="12 6 12 12 16 14"></polyline>
							</svg>
						{/if}
					</div>
					<div class="suggestion-content">
						<div class="suggestion-main">
							{@html suggestion.text}
							<!-- Use HTML to allow highlighting -->
						</div>
						{#if suggestion.type}
							<div class="suggestion-type">
								{#if suggestion.address && suggestion.address.hasStreetLevel}
									Street Address
								{:else if suggestion.type === 'poi'}
									Point of Interest
								{:else if suggestion.type === 'address'}
									Address
								{:else}
									{suggestion.type}
								{/if}
							</div>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.location-autocomplete {
		position: relative;
		width: 100%;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.input-wrapper {
		position: relative;
	}

	input {
		width: 100%;
		padding: 14px;
		border: 1px solid #ccc;
		border-radius: 8px;
		font-size: 16px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		transition: all 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #4285f4;
		box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2);
	}

	.location-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 12px;
		padding: 12px 16px;
		background-color: #4285f4;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 15px;
		width: 100%;
		transition: background-color 0.2s;
	}

	.location-button:hover {
		background-color: #3367d6;
	}

	.location-button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	.loading {
		position: absolute;
		right: 15px;
		top: 50%;
		transform: translateY(-50%);
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 3px solid rgba(0, 0, 0, 0.1);
		border-top-color: #4285f4;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.spinner-small {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.suggestions {
		position: absolute;
		width: 100%;
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		margin-top: 4px;
		max-height: 350px;
		overflow-y: auto;
		padding: 0;
		list-style: none;
		z-index: 10;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.suggestions li {
		padding: 12px 15px;
		cursor: pointer;
		border-bottom: 1px solid #eee;
		display: flex;
		align-items: flex-start;
		gap: 12px;
		border-left: 3px solid transparent;
	}

	.suggestion-icon {
		color: #666;
		margin-top: 2px;
		flex-shrink: 0;
	}

	.suggestion-content {
		flex: 1;
	}

	.suggestion-main {
		font-size: 15px;
		color: #333;
		line-height: 1.4;
	}

	.suggestion-main :global(strong) {
		font-weight: bold;
		color: #4285f4;
	}

	.suggestion-type {
		font-size: 12px;
		color: #666;
		margin-top: 3px;
	}

	.suggestions li:hover {
		background: #f5f8ff;
	}

	.suggestions li:last-child {
		border-bottom: none;
	}

	.suggestions li.street-level {
		border-left: 3px solid #4285f4;
		background-color: #f8f9ff;
	}

	.suggestions li.street-level:hover {
		background-color: #eef1ff;
	}

	.error-message {
		color: #d32f2f;
		margin-top: 10px;
		font-size: 14px;
		background-color: #fee8e8;
		padding: 10px;
		border-radius: 6px;
	}
</style>
