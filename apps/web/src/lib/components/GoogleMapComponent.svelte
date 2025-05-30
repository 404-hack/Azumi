<script lang="ts">
	import { browser } from '$app/environment';
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	interface UserLocation {
		latitude: number;
		longitude: number;
	}

	interface Shop {
		name: string;
		slug: string;
		latitude?: number;
		longitude?: number;
		address?: string;
		averageRating?: number;
		coverImage?: string;
	}

	interface Props {
		shops?: Shop[];
		userLocation?: UserLocation | null;
		onShopClick?: (shop: Shop) => void;
	}

	let { shops = [], userLocation = null, onShopClick = () => {} }: Props = $props();

	let mapContainerElement: HTMLDivElement | undefined = $state();
	let map: google.maps.Map | undefined = $state();
	let mapIsLoading = $state(true);
	let mapLoadError = $state<string | null>(null);
	let mapReady = $state(false);
	let service: google.maps.places.PlacesService | undefined = $state();
	let googleApiScriptLoaded = $state(false);
	let markers: google.maps.marker.AdvancedMarkerElement[] = $state([]);
	let userMarker: google.maps.Marker | undefined = $state();
	let activeInfoWindow: google.maps.InfoWindow | undefined = $state();

	const apiKey = PUBLIC_GOOGLE_MAP_API_KEY;
	const callbackName = `initMap_${Math.random().toString(36).substring(7)}`;

	console.log('GoogleMapComponent: Initializing. API Key defined?', !!apiKey);

	function loadGoogleMapsScript() {
		console.log('GoogleMapComponent: loadGoogleMapsScript called');
		if (
			typeof google !== 'undefined' &&
			typeof google.maps !== 'undefined' &&
			typeof google.maps.marker !== 'undefined'
		) {
			console.log('GoogleMapComponent: Google Maps API (including marker library) already loaded.');
			googleApiScriptLoaded = true;
			return;
		}

		if ((window as any).googleMapsScriptLoading) {
			console.log('GoogleMapComponent: Google Maps script already loading.');
			return;
		}

		(window as any).googleMapsScriptLoading = true;
		console.log('GoogleMapComponent: Preparing to load Google Maps script.');

		(window as any)[callbackName] = () => {
			console.log('GoogleMapComponent: Google Maps API script loaded, callback executed.');
			delete (window as any)[callbackName];
			delete (window as any).googleMapsScriptLoading;
			googleApiScriptLoaded = true;
		};

		const script = document.createElement('script');
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&loading=async&libraries=marker,places`;
		script.async = true;
		script.defer = true;
		script.onerror = () => {
			console.error('GoogleMapComponent: Failed to load Google Maps script.');
			delete (window as any)[callbackName];
			delete (window as any).googleMapsScriptLoading;
			mapLoadError = 'Failed to load the Google Maps script. Check network and API key.';
			mapIsLoading = false;
			mapReady = false;
			googleApiScriptLoaded = false;
		};
		document.head.appendChild(script);
		console.log('GoogleMapComponent: Google Maps script appended to head.');

		setTimeout(() => {
			if ((window as any).googleMapsScriptLoading) {
				console.warn('GoogleMapComponent: Google Maps API loading timeout (15s).');
				if (
					!(window as any)[callbackName] &&
					!(typeof google !== 'undefined' && typeof google.maps !== 'undefined')
				) {
					mapLoadError =
						'Google Maps API loading timed out. Check API key, network, and console for errors from Google.';
					mapIsLoading = false;
					delete (window as any)[callbackName];
					delete (window as any).googleMapsScriptLoading;
				}
			}
		}, 15000);
	}

	onMount(() => {
		console.log('GoogleMapComponent: onMount triggered.');
		if (browser) {
			if (!apiKey) {
				console.error('GoogleMapComponent: API Key is missing. Map will not load.');
				mapLoadError =
					'Google Maps API Key is missing. Please configure it in your environment variables.';
				mapIsLoading = false;
				return;
			}
			loadGoogleMapsScript();
		}

		const handleMapShopClick = (event: CustomEvent) => {
			if (event.detail && event.detail.slug) {
				const shop = shops.find((s) => s.slug === event.detail.slug);
				if (shop) onShopClick(shop);
			}
		};

		document.addEventListener('googleMapShopClick', handleMapShopClick as EventListener);

		return () => {
			console.log('GoogleMapComponent: Component unmounting.');
			const scriptElement = document.querySelector(
				`script[src*="maps.googleapis.com/maps/api/js"]`
			);
			if (scriptElement && scriptElement.parentElement && (window as any)[callbackName]) {
				console.log(`GoogleMapComponent: Cleaning up global callback ${callbackName}`);
				delete (window as any)[callbackName];
			}
			if ((window as any).googleMapsScriptLoading) {
				delete (window as any).googleMapsScriptLoading;
			}
			document.removeEventListener('googleMapShopClick', handleMapShopClick as EventListener);
			markers.forEach((marker) => (marker.map = null));
			if (userMarker) userMarker.setMap(null);
			if (activeInfoWindow) activeInfoWindow.close();
		};
	});

	$effect(() => {
		console.log(
			`GoogleMapComponent: $effect triggered. googleApiScriptLoaded: ${googleApiScriptLoaded}, mapContainerElement: ${!!mapContainerElement}, mapReady: ${mapReady}, mapIsLoading: ${mapIsLoading}`
		);
		if (googleApiScriptLoaded && mapContainerElement && !mapReady && mapIsLoading) {
			console.log(
				'GoogleMapComponent: API script loaded and container element ready. Initializing map.'
			);
			try {
				const initialCenter = userLocation
					? { lat: userLocation.latitude, lng: userLocation.longitude }
					: shops.length > 0 && shops[0].latitude && shops[0].longitude
						? { lat: shops[0].latitude, lng: shops[0].longitude }
						: { lat: 6.5244, lng: 3.3792 }; // Default to Lagos, Nigeria

				map = new google.maps.Map(mapContainerElement, {
					center: initialCenter,
					zoom: userLocation || shops.length > 0 ? 12 : 10,
					mapId: 'AFRICAN_MARKET_MAP_ID' // Re-enable if you have a Map ID for cloud styling
				});
				service = new google.maps.places.PlacesService(map);
				mapIsLoading = false;
				mapReady = true;
				mapLoadError = null;
				markersNeedUpdate = true;
				console.log('GoogleMapComponent: Map initialized successfully via $effect.');
			} catch (e: any) {
				console.error('GoogleMapComponent: Error initializing map in $effect:', e);
				mapLoadError = `Error initializing map: ${e.message}`;
				mapIsLoading = false;
				mapReady = false;
			}
		} else if (googleApiScriptLoaded && !mapContainerElement && mapIsLoading && !mapLoadError) {
			console.error(
				'GoogleMapComponent: $effect - API script loaded, but mapContainerElement is NOT defined. This is unexpected.'
			);
			mapLoadError =
				'Map container element (mapContainerElement) was not available for map initialization.';
			mapIsLoading = false;
		}
	});
	let markersNeedUpdate = $state(false);
	let lastShopsHash = $state('');
	let lastUserLocationHash = $state('');

	function generateShopsHash(shops: Shop[]): string {
		return shops.map((shop) => `${shop.slug}-${shop.latitude}-${shop.longitude}`).join(',');
	}

	function generateUserLocationHash(userLocation: UserLocation | null): string {
		return userLocation ? `${userLocation.latitude}-${userLocation.longitude}` : '';
	}

	$effect(() => {
		const currentShopsHash = generateShopsHash(shops);
		const currentUserLocationHash = generateUserLocationHash(userLocation);

		if (currentShopsHash !== lastShopsHash || currentUserLocationHash !== lastUserLocationHash) {
			lastShopsHash = currentShopsHash;
			lastUserLocationHash = currentUserLocationHash;
			markersNeedUpdate = true;
		}
	});

	$effect(() => {
		if (mapReady && map && google.maps.marker && markersNeedUpdate) {
			console.log(
				'GoogleMapComponent: $effect - Map ready, processing shops and user location for markers.'
			);
			markersNeedUpdate = false;

			markers.forEach((marker) => (marker.map = null));
			markers = [];

			if (shops && shops.length > 0) {
				console.log(`GoogleMapComponent: Adding ${shops.length} shop markers.`);
				const bounds = new google.maps.LatLngBounds();
				shops.forEach((shop) => {
					if (shop.latitude && shop.longitude) {
						const position = { lat: shop.latitude, lng: shop.longitude };
						const markerContent = document.createElement('div');
						markerContent.style.backgroundColor = 'white';
						markerContent.style.padding = '5px';
						markerContent.style.borderRadius = '8px';
						markerContent.style.boxShadow = '0 2px 7px 1px rgba(0,0,0,0.15)';
						markerContent.style.textAlign = 'center';
						markerContent.style.minWidth = '100px';
						markerContent.style.maxWidth = '150px';
						markerContent.style.cursor = 'pointer';
						markerContent.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

						markerContent.addEventListener('click', (e) => {
							e.stopPropagation();
							goto(`/restaurant/${shop.slug}`);
						});

						markerContent.addEventListener('mouseenter', () => {
							markerContent.style.transform = 'scale(1.05)';
							markerContent.style.boxShadow = '0 4px 12px 2px rgba(0,0,0,0.2)';
						});

						markerContent.addEventListener('mouseleave', () => {
							markerContent.style.transform = 'scale(1)';
							markerContent.style.boxShadow = '0 2px 7px 1px rgba(0,0,0,0.15)';
						});

						const img = document.createElement('img');
						img.src = shop.coverImage || 'https://via.placeholder.com/100x50?text=No+Image';
						img.style.width = '100%';
						img.style.height = '50px';
						img.style.objectFit = 'cover';
						img.style.borderRadius = '4px 4px 0 0';

						const nameElement = document.createElement('p');
						nameElement.textContent = shop.name;
						nameElement.style.fontSize = '12px';
						nameElement.style.fontWeight = 'bold';
						nameElement.style.margin = '5px 0 2px 0';
						nameElement.style.whiteSpace = 'nowrap';
						nameElement.style.overflow = 'hidden';
						nameElement.style.textOverflow = 'ellipsis';
						nameElement.style.color = '#333';

						markerContent.appendChild(img);
						markerContent.appendChild(nameElement);

						const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
							position,
							map,
							title: shop.name,
							content: markerContent
						});
						advancedMarker.addListener('click', (e) => {
							if (
								e.domEvent &&
								e.domEvent.target &&
								(e.domEvent.target === markerContent || markerContent.contains(e.domEvent.target))
							) {
								return;
							}

							if (activeInfoWindow) {
								activeInfoWindow.close();
							}
							const infoWindowContent = `
							<div style="font-family: sans-serif; color: #333; max-width: 250px;">
								<h3 style="margin-top: 0; margin-bottom: 8px; font-size: 16px;">${shop.name}</h3>
								<p style="margin-bottom: 5px; font-size: 12px;">${shop.address || 'Address not available'}</p>
									${shop.averageRating ? `<p style="margin-bottom: 8px; font-size: 12px;">Rating: ${shop.averageRating.toFixed(1)} ★</p>` : ''}
								<button onclick="window.location.href='/restaurant/${shop.slug}'" 
									style="padding: 6px 12px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; width: 100%; box-sizing: border-box;">
									View Details
								</button>
							</div>`;
							activeInfoWindow = new google.maps.InfoWindow({
								content: infoWindowContent
							});
							activeInfoWindow.open(map, advancedMarker);
						});
						markers.push(advancedMarker);
						bounds.extend(position);
					}
				});
				if (markers.length > 0 && !userLocation) {
					map.fitBounds(bounds);
				}
			}

			if (userMarker) {
				userMarker.setMap(null);
				userMarker = undefined;
			}

			if (userLocation && userLocation.latitude && userLocation.longitude) {
				console.log('GoogleMapComponent: Adding user location marker.');
				const userPosition = { lat: userLocation.latitude, lng: userLocation.longitude };
				userMarker = new google.maps.Marker({
					position: userPosition,
					map,
					title: 'Your Location',
					icon: {
						path: google.maps.SymbolPath.CIRCLE,
						scale: 7,
						fillColor: '#4285F4',
						fillOpacity: 1,
						strokeWeight: 2,
						strokeColor: 'white'
					}
				});
				if (markers.length === 0) {
					map.setCenter(userPosition);
					map.setZoom(15);
				}
			}
		}
	});
</script>

<div class="relative h-full w-full">
	{#if mapIsLoading}
		<div class="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/50">
			<p>Loading Map...</p>
		</div>
	{/if}
	{#if mapLoadError && !mapIsLoading}
		<div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-100/50 p-4">
			<p class="font-semibold text-red-700">Map Error</p>
			<p class="mt-1 text-sm text-red-600">{mapLoadError}</p>
		</div>
	{/if}
	<div
		class="map-container"
		bind:this={mapContainerElement}
		style="width: 100%; height: 100%;"
	></div>
</div>

<style>
	.map-container {
		opacity: 1;
		transition: opacity 0.5s ease-in-out;
	}
</style>
