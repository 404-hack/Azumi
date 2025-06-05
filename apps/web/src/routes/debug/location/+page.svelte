<!-- Debug Location Test Page -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { getCurrentPosition, reverseGeocode, geocodeAddress } from '$lib/utils/geolocation';
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';
	import { toast } from 'svelte-sonner';

	let isTestingGPS = $state(false);
	let gpsResult = $state('');
	let testCoords = $state({ lat: 6.5568768, lng: 3.3390592 });
	let reverseResult = $state('');
	let testAddress = $state('Victoria Island, Lagos, Nigeria');
	let forwardResult = $state('');

	async function testGPS() {
		isTestingGPS = true;
		gpsResult = '🔄 Getting GPS location...';

		try {
			const position = await getCurrentPosition();

			if (!position || !position.coords) {
				throw new Error('No position data received');
			}

			const { latitude, longitude, accuracy } = position.coords;

			gpsResult = `✅ GPS Success!\nLatitude: ${latitude}\nLongitude: ${longitude}\nAccuracy: ±${Math.round(accuracy)}m`;

			testCoords.lat = latitude;
			testCoords.lng = longitude;

			toast.success('GPS location obtained successfully!');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			gpsResult = `❌ GPS Failed: ${errorMessage}`;
			toast.error(`GPS Error: ${errorMessage}`);
			console.error('GPS Error:', error);
		} finally {
			isTestingGPS = false;
		}
	}

	async function testReverseGeocode() {
		if (!testCoords.lat || !testCoords.lng) {
			toast.error('Please enter valid coordinates');
			return;
		}

		reverseResult = '🔄 Converting coordinates to address...';

		try {
			const result = await reverseGeocode(
				testCoords.lat,
				testCoords.lng,
				PUBLIC_GOOGLE_MAP_API_KEY
			);

			reverseResult = `✅ Address Found!\nName: ${result.name}\nAddress: ${result.address}`;
			toast.success('Address found successfully!');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			reverseResult = `❌ Reverse Geocoding Failed: ${errorMessage}`;
			toast.error(`Reverse Geocoding Error: ${errorMessage}`);
			console.error('Reverse Geocoding Error:', error);
		}
	}

	async function testForwardGeocode() {
		if (!testAddress.trim()) {
			toast.error('Please enter an address');
			return;
		}

		forwardResult = '🔄 Converting address to coordinates...';

		try {
			const result = await geocodeAddress(testAddress, PUBLIC_GOOGLE_MAP_API_KEY);

			if (result) {
				forwardResult = `✅ Coordinates Found!\nLatitude: ${result.latitude}\nLongitude: ${result.longitude}\nFormatted: ${result.formatted_address}`;
				toast.success('Coordinates found successfully!');
			} else {
				forwardResult = '❌ No results found for this address';
				toast.error('No results found for this address');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			forwardResult = `❌ Forward Geocoding Failed: ${errorMessage}`;
			toast.error(`Forward Geocoding Error: ${errorMessage}`);
			console.error('Forward Geocoding Error:', error);
		}
	}

	onMount(() => {
		console.log('Location Debug Page Loaded');
		console.log('Google API Key available:', !!PUBLIC_GOOGLE_MAP_API_KEY);
	});
</script>

<svelte:head>
	<title>🧭 Location Debug - Azumi</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="mx-auto max-w-4xl px-4">
		<div class="mb-6 rounded-lg bg-white p-6 shadow-lg">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">🧭 Location Debug Tool</h1>
			<p class="text-gray-600">Test GPS and geocoding functionality with Google APIs</p>

			{#if PUBLIC_GOOGLE_MAP_API_KEY}
				<div class="mt-4 rounded-md border border-green-400 bg-green-100 p-3">
					<p class="text-green-700">✅ Google API Key is configured</p>
				</div>
			{:else}
				<div class="mt-4 rounded-md border border-yellow-400 bg-yellow-100 p-3">
					<p class="text-yellow-700">
						⚠️ Google API Key not found - will fallback to OpenStreetMap
					</p>
				</div>
			{/if}
		</div>

		<!-- GPS Test -->
		<div class="mb-6 rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">📍 GPS Location Test</h2>
			<p class="mb-4 text-gray-600">Test your device's GPS functionality</p>

			<button
				onclick={testGPS}
				disabled={isTestingGPS}
				class="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-blue-300"
			>
				{isTestingGPS ? '🔄 Getting Location...' : '📍 Get My Location'}
			</button>

			{#if gpsResult}
				<div class="mt-4 rounded-md bg-gray-100 p-4">
					<pre class="whitespace-pre-wrap text-sm text-gray-800">{gpsResult}</pre>
				</div>
			{/if}
		</div>

		<!-- Reverse Geocoding Test -->
		<div class="mb-6 rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">🏠 Reverse Geocoding Test</h2>
			<p class="mb-4 text-gray-600">Convert coordinates to human-readable address</p>

			<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">Latitude</label>
					<input
						type="number"
						bind:value={testCoords.lat}
						step="any"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="e.g., 6.5568768"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">Longitude</label>
					<input
						type="number"
						bind:value={testCoords.lng}
						step="any"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="e.g., 3.3390592"
					/>
				</div>
			</div>

			<button
				onclick={testReverseGeocode}
				class="rounded-lg bg-green-500 px-6 py-2 font-medium text-white transition-colors hover:bg-green-600"
			>
				🔄 Convert to Address
			</button>

			{#if reverseResult}
				<div class="mt-4 rounded-md bg-gray-100 p-4">
					<pre class="whitespace-pre-wrap text-sm text-gray-800">{reverseResult}</pre>
				</div>
			{/if}
		</div>

		<!-- Forward Geocoding Test -->
		<div class="mb-6 rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">🌍 Forward Geocoding Test</h2>
			<p class="mb-4 text-gray-600">Convert address to coordinates</p>

			<div class="mb-4">
				<label class="mb-1 block text-sm font-medium text-gray-700">Address</label>
				<input
					type="text"
					bind:value={testAddress}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="e.g., Victoria Island, Lagos, Nigeria"
				/>
			</div>

			<button
				onclick={testForwardGeocode}
				class="rounded-lg bg-purple-500 px-6 py-2 font-medium text-white transition-colors hover:bg-purple-600"
			>
				🔄 Convert to Coordinates
			</button>

			{#if forwardResult}
				<div class="mt-4 rounded-md bg-gray-100 p-4">
					<pre class="whitespace-pre-wrap text-sm text-gray-800">{forwardResult}</pre>
				</div>
			{/if}
		</div>

		<!-- Instructions -->
		<div class="rounded-lg bg-blue-50 p-6">
			<h3 class="mb-3 text-lg font-semibold text-blue-900">🔧 Troubleshooting Tips</h3>
			<ul class="list-inside list-disc space-y-2 text-blue-800">
				<li><strong>GPS Permission:</strong> Make sure you allow location access when prompted</li>
				<li><strong>GPS Signal:</strong> For better accuracy, test outdoors with clear sky view</li>
				<li><strong>HTTPS Required:</strong> GPS only works on HTTPS connections</li>
				<li><strong>Browser Support:</strong> Ensure your browser supports geolocation</li>
				<li>
					<strong>Mobile vs Desktop:</strong> Mobile devices typically have better GPS accuracy
				</li>
			</ul>
		</div>
	</div>
</div>
