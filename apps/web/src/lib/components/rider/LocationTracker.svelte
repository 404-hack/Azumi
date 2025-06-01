<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { riderDispatchState } from '$lib/states/riderDispatchState.svelte';
	import {
		MapPin,
		Navigation,
		AlertCircle,
		CheckCircle,
		RefreshCw,
		Satellite,
		Shield,
		ExternalLink
	} from 'lucide-svelte';

	let accuracy = $state<number | null>(null);
	let lastUpdate = $state<Date | null>(null);
	let permissionStatus = $state<'granted' | 'denied' | 'prompt' | 'unsupported' | 'checking'>(
		'checking'
	);

	function formatCoordinate(coord: number): string {
		return coord.toFixed(6);
	}

	function formatLastUpdate(): string {
		if (!lastUpdate) return 'Never';

		const now = new Date();
		const diff = now.getTime() - lastUpdate.getTime();
		const seconds = Math.floor(diff / 1000);

		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ago`;
	}
	$effect(() => {
		if (riderDispatchState.currentLocation) {
			lastUpdate = new Date();
		}
	});

	$effect(() => {
		checkLocationPermissions().then((status) => {
			permissionStatus = status;
		});
	});

	function openMaps() {
		if (!riderDispatchState.currentLocation) return;

		const { lat, lng } = riderDispatchState.currentLocation;
		const url = `https://www.google.com/maps?q=${lat},${lng}`;
		window.open(url, '_blank');
	}
	async function checkLocationPermissions(): Promise<
		'granted' | 'denied' | 'prompt' | 'unsupported'
	> {
		if (!navigator.permissions) {
			return 'unsupported';
		}

		try {
			const permission = await navigator.permissions.query({ name: 'geolocation' });
			return permission.state;
		} catch (error) {
			console.error('Failed to check permissions:', error);
			return 'unsupported';
		}
	}

	async function requestLocationPermissionDirectly(): Promise<boolean> {
		return new Promise((resolve) => {
			if (!navigator.geolocation) {
				resolve(false);
				return;
			}

			navigator.geolocation.getCurrentPosition(
				() => resolve(true),
				(error) => {
					console.error('Permission request failed:', error);
					resolve(false);
				},
				{ timeout: 1000, maximumAge: 0 }
			);
		});
	}
	async function requestLocationUpdate() {
		try {
			if (!navigator.geolocation) {
				console.error('Geolocation not supported');
				alert('Geolocation is not supported by your browser.');
				return;
			}

			let permissionState = await checkLocationPermissions();

			if (permissionState === 'denied') {
				alert(
					'Location access is denied. Please enable location permissions in your browser settings:\n\n1. Click the location icon in the address bar\n2. Select "Allow" for location access\n3. Refresh the page'
				);
				return;
			}

			if (permissionState === 'prompt' || permissionState === 'unsupported') {
				const hasPermission = await requestLocationPermissionDirectly();
				if (!hasPermission) {
					alert(
						'Location access is required for this feature. Please:\n\n1. Allow location access when prompted\n2. Or enable it in browser settings\n3. Refresh the page if needed'
					);
					return;
				}
			}
			navigator.geolocation.getCurrentPosition(
				(position) => {
					accuracy = position.coords.accuracy;
					permissionStatus = 'granted';
					console.log('Location updated manually');
				},
				(error) => {
					console.error('Failed to get location:', error);

					checkLocationPermissions().then((status) => {
						permissionStatus = status;
					});

					switch (error.code) {
						case error.PERMISSION_DENIED:
							alert(
								'Location access denied. Please:\n\n1. Click the location icon in your address bar\n2. Select "Allow" for location access\n3. Refresh the page\n\nFor Edge browser:\n1. Go to Settings > Site permissions > Location\n2. Set to "Ask (recommended)" or "Allow"\n3. Refresh this page'
							);
							break;
						case error.POSITION_UNAVAILABLE:
							alert(
								"Location information is unavailable. Please check your device's location settings."
							);
							break;
						case error.TIMEOUT:
							alert('Location request timed out. Please try again.');
							break;
						default:
							alert(
								'An unknown error occurred while retrieving location. Please check your browser settings.'
							);
							break;
					}
				},
				{
					enableHighAccuracy: true,
					timeout: 15000,
					maximumAge: 60000
				}
			);
		} catch (error) {
			console.error('Error requesting location:', error);
			alert(
				'Failed to request location. Please check your browser settings and ensure location services are enabled.'
			);
		}
	}
</script>

<Card class="p-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="rounded-full bg-blue-100 p-2">
				{#if riderDispatchState.isLocationTracking}
					<Satellite class="h-4 w-4 text-blue-600" />
				{:else}
					<MapPin class="h-4 w-4 text-gray-400" />
				{/if}
			</div>
			<div>
				<h3 class="font-medium">Location Tracking</h3>
				<p class="text-sm text-muted-foreground">
					{riderDispatchState.isLocationTracking ? 'Active tracking' : 'Location tracking disabled'}
				</p>
				{#if permissionStatus !== 'checking'}
					<div class="mt-1 flex items-center gap-1">
						<Shield class="h-3 w-3" />
						<span
							class="text-xs {permissionStatus === 'granted'
								? 'text-green-600'
								: permissionStatus === 'denied'
									? 'text-red-600'
									: permissionStatus === 'prompt'
										? 'text-yellow-600'
										: 'text-gray-600'}"
						>
							{permissionStatus === 'granted'
								? 'Permission granted'
								: permissionStatus === 'denied'
									? 'Permission denied'
									: permissionStatus === 'prompt'
										? 'Permission required'
										: 'Not supported'}
						</span>
					</div>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-2">
			{#if riderDispatchState.isLocationTracking}
				<Badge variant="outline" class="border-green-500 text-green-600">
					<CheckCircle class="mr-1 h-3 w-3" />
					Active
				</Badge>
			{:else}
				<Badge variant="outline" class="border-red-500 text-red-600">
					<AlertCircle class="mr-1 h-3 w-3" />
					Inactive
				</Badge>
			{/if}
		</div>
	</div>

	{#if riderDispatchState.currentLocation}
		<div class="mt-4 space-y-3">
			<div class="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 p-3">
				<div>
					<p class="text-xs text-muted-foreground">Latitude</p>
					<p class="font-mono text-sm">
						{formatCoordinate(riderDispatchState.currentLocation.lat)}
					</p>
				</div>
				<div>
					<p class="text-xs text-muted-foreground">Longitude</p>
					<p class="font-mono text-sm">
						{formatCoordinate(riderDispatchState.currentLocation.lng)}
					</p>
				</div>
			</div>

			<div class="flex items-center justify-between text-sm">
				<span class="text-muted-foreground">
					Last updated: {formatLastUpdate()}
				</span>
				{#if accuracy}
					<span class="text-muted-foreground">
						Accuracy: ±{accuracy.toFixed(0)}m
					</span>
				{/if}
			</div>

			<div class="flex gap-2">
				<Button variant="outline" size="sm" onclick={requestLocationUpdate} class="gap-2">
					<RefreshCw class="h-4 w-4" />
					Update Location
				</Button>

				<Button variant="outline" size="sm" onclick={openMaps} class="gap-2">
					<Navigation class="h-4 w-4" />
					View on Map
				</Button>
			</div>
		</div>
	{:else}
		<div class="mt-4 text-center">
			<AlertCircle class="mx-auto h-8 w-8 text-yellow-500" />
			<p class="mt-2 text-sm text-muted-foreground">
				Location not available. Please enable location services.
			</p>
			{#if permissionStatus === 'denied'}
				<div class="mt-3 rounded-lg bg-red-50 p-3 text-left">
					<h4 class="text-sm font-medium text-red-800">Location Permission Denied</h4>
					<p class="mt-1 text-xs text-red-700">To enable location access in Microsoft Edge:</p>
					<ol class="mt-2 list-inside list-decimal space-y-1 text-xs text-red-700">
						<li>Click the location icon in the address bar</li>
						<li>Select "Allow" for location access</li>
						<li>Refresh the page</li>
					</ol>
					<p class="mt-2 text-xs text-red-700">
						Or go to Edge Settings → Site permissions → Location → Set to "Ask (recommended)"
					</p>
				</div>
			{/if}
			<Button variant="outline" size="sm" onclick={requestLocationUpdate} class="mt-2 gap-2">
				<RefreshCw class="h-4 w-4" />
				Try Again
			</Button>
		</div>
	{/if}
</Card>
