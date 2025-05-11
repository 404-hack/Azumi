<!-- NearbyShopFinder.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { getContext } from 'svelte';

	// State management with Svelte 5's reactivity
	let latitude: number | null = null;
	let longitude: number | null = null;
	let isLocating = false;
	let locationError: string | null = null;
	let distance = 10;
	let shops: any[] = [];
	let loading = false;
	let selectedShopType: string | null = null;
	let shopTypes: { id: string; name: string }[] = [];

	// Fetch shop types on mount
	onMount(async () => {
		try {
			const response = await fetch('/api/shops/shopTypes');
			const data = await response.json();
			shopTypes = data.data || [];
		} catch (error) {
			console.error('Failed to load shop types:', error);
		}

		// Try to get user's location automatically if they allow it
		getUserLocation();
	});

	// Get user's current location
	function getUserLocation() {
		if (!navigator.geolocation) {
			locationError = 'Geolocation is not supported by your browser';
			return;
		}

		isLocating = true;
		locationError = null;

		navigator.geolocation.getCurrentPosition(
			(position) => {
				latitude = position.coords.latitude;
				longitude = position.coords.longitude;
				isLocating = false;
			},
			(error) => {
				isLocating = false;
				switch (error.code) {
					case error.PERMISSION_DENIED:
						locationError = 'Location permission denied. Please enter your location manually.';
						break;
					case error.POSITION_UNAVAILABLE:
						locationError = 'Location information is unavailable. Please enter manually.';
						break;
					case error.TIMEOUT:
						locationError =
							'Request to get location timed out. Please try again or enter manually.';
						break;
					default:
						locationError = 'An unknown error occurred. Please enter your location manually.';
						break;
				}
			},
			{ enableHighAccuracy: true }
		);
	}

	// Find nearby shops based on location and filters
	async function findNearbyShops() {
		if (!latitude || !longitude) {
			locationError = 'Please provide your location first';
			return;
		}

		loading = true;
		shops = [];

		try {
			// Build query parameters
			const params = new URLSearchParams({
				latitude: latitude.toString(),
				longitude: longitude.toString(),
				distance: distance.toString()
			});

			if (selectedShopType) {
				params.append('shopType', selectedShopType);
			}

			const response = await fetch(`/api/shops/nearby?${params.toString()}`);
			const result = await response.json();

			if (result?.data?.shops) {
				shops = result.data.shops;
			}
		} catch (error) {
			console.error('Error fetching nearby shops:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="nearby-shop-finder">
	<h2>Find Shops Near You</h2>

	<div class="location-section">
		<h3>Your Location</h3>

		{#if isLocating}
			<p>Detecting your location...</p>
		{:else}
			<div class="location-form">
				<div class="form-group">
					<label for="latitude">Latitude:</label>
					<input
						type="number"
						id="latitude"
						bind:value={latitude}
						min="-90"
						max="90"
						step="0.0001"
						placeholder="e.g. 6.5244"
					/>
				</div>

				<div class="form-group">
					<label for="longitude">Longitude:</label>
					<input
						type="number"
						id="longitude"
						bind:value={longitude}
						min="-180"
						max="180"
						step="0.0001"
						placeholder="e.g. 3.3792"
					/>
				</div>

				<button type="button" class="location-btn" on:click={getUserLocation} disabled={isLocating}>
					Use My Current Location
				</button>
			</div>

			{#if locationError}
				<p class="error-message">{locationError}</p>
			{/if}
		{/if}
	</div>

	<div class="filters-section">
		<h3>Filters</h3>

		<div class="filter-group">
			<label for="distance">Search Distance (km):</label>
			<input type="range" id="distance" bind:value={distance} min="1" max="50" step="1" />
			<span>{distance} km</span>
		</div>

		<div class="filter-group">
			<label for="shopType">Shop Type:</label>
			<select id="shopType" bind:value={selectedShopType}>
				<option value="">All Types</option>
				{#each shopTypes as type}
					<option value={type.id}>{type.name}</option>
				{/each}
			</select>
		</div>

		<button
			type="button"
			class="search-btn"
			on:click={findNearbyShops}
			disabled={loading || !latitude || !longitude}
		>
			{loading ? 'Searching...' : 'Find Nearby Shops'}
		</button>
	</div>

	<div class="results-section">
		{#if loading}
			<p>Searching for shops near you...</p>
		{:else if shops.length > 0}
			<h3>Shops Near You ({shops.length})</h3>
			<div class="shop-list">
				{#each shops as shop}
					<div class="shop-card">
						<div class="shop-image">
							{#if shop.logo}
								<img src={shop.logo} alt={shop.name} />
							{:else}
								<div class="placeholder-image">{shop.name[0]}</div>
							{/if}
						</div>

						<div class="shop-info">
							<h4>{shop.name}</h4>
							<p class="distance">{shop.distance} km away</p>
							{#if shop.address}
								<p class="address">{shop.address}</p>
							{/if}
							{#if shop.averageRating}
								<div class="rating">
									<span class="stars">{'★'.repeat(Math.round(shop.averageRating))}</span>
									<span class="count">({shop.totalRatings} ratings)</span>
								</div>
							{/if}
							<a href={`/shops/${shop.slug}`} class="view-btn">View Shop</a>
						</div>
					</div>
				{/each}
			</div>
		{:else if latitude && longitude && !loading}
			<p>No shops found within {distance} km. Try increasing your search distance.</p>
		{/if}
	</div>
</div>

<style>
	.nearby-shop-finder {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	.location-section,
	.filters-section,
	.results-section {
		margin-bottom: 2rem;
	}

	.location-form {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		flex: 1;
		min-width: 200px;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	input,
	select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.location-btn,
	.search-btn {
		padding: 0.5rem 1rem;
		background-color: #4a5568;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.search-btn {
		background-color: #4299e1;
		width: 100%;
		padding: 0.75rem;
		margin-top: 1rem;
	}

	.location-btn:hover,
	.search-btn:hover {
		background-color: #2d3748;
	}

	.search-btn:hover {
		background-color: #3182ce;
	}

	.location-btn:disabled,
	.search-btn:disabled {
		background-color: #cbd5e0;
		cursor: not-allowed;
	}

	.error-message {
		color: #e53e3e;
		margin-top: 0.5rem;
	}

	.filter-group {
		margin-bottom: 1rem;
	}

	.shop-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.shop-card {
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		overflow: hidden;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.shop-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	.shop-image {
		height: 160px;
		background-color: #f7fafc;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.shop-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder-image {
		width: 60px;
		height: 60px;
		background-color: #4299e1;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		font-weight: bold;
		border-radius: 50%;
	}

	.shop-info {
		padding: 1rem;
	}

	.shop-info h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
	}

	.distance {
		color: #4a5568;
		font-weight: 500;
		margin: 0.25rem 0;
	}

	.address {
		color: #718096;
		font-size: 0.9rem;
		margin: 0.25rem 0;
	}

	.rating {
		display: flex;
		align-items: center;
		margin: 0.5rem 0;
	}

	.stars {
		color: #f6e05e;
	}

	.count {
		color: #718096;
		font-size: 0.8rem;
		margin-left: 0.5rem;
	}

	.view-btn {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: #4299e1;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.view-btn:hover {
		background-color: #3182ce;
	}
</style>
