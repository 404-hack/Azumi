import { getCurrentPositionEnhanced, reverseGeocode, geocodeAddress } from './geolocation';
import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';
import { browser } from '$app/environment';

export interface LocationCoordinates {
	latitude: number;
	longitude: number;
	accuracy?: number;
}

export interface LocationResult {
	name: string;
	address: string;
	coordinates: LocationCoordinates;
	accuracy?: number;
	source?: string;
}

export interface LocationError {
	code: string;
	message: string;
	userMessage: string;
}

export interface LocationOptions {
	enableHighAccuracy?: boolean;
	timeout?: number;
	maximumAge?: number;
	preferredSource?: 'google' | 'openstreetmap' | 'auto';
}

export const DEFAULT_LOCATION_OPTIONS: LocationOptions = {
	enableHighAccuracy: true,
	timeout: 15000,
	maximumAge: 60000,
	preferredSource: 'auto'
};

export function createLocationError(
	code: string,
	message: string,
	userMessage: string
): LocationError {
	return { code, message, userMessage };
}

export const LOCATION_ERRORS = {
	PERMISSION_DENIED: createLocationError(
		'PERMISSION_DENIED',
		'User denied the request for Geolocation',
		'Please enable location permissions in your browser settings and try again.'
	),
	POSITION_UNAVAILABLE: createLocationError(
		'POSITION_UNAVAILABLE',
		'Location information is unavailable',
		'GPS signal unavailable. Please ensure location services are enabled and try outdoors.'
	),
	TIMEOUT: createLocationError(
		'TIMEOUT',
		'The request to get user location timed out',
		'Location request timed out. Please check your internet connection and try again.'
	),
	NOT_SUPPORTED: createLocationError(
		'NOT_SUPPORTED',
		'Geolocation is not supported by this browser',
		'Your browser does not support location services. Please use a modern browser.'
	),
	INVALID_COORDINATES: createLocationError(
		'INVALID_COORDINATES',
		'Invalid coordinates received',
		'Invalid location data received. Please try again.'
	),
	GEOCODING_FAILED: createLocationError(
		'GEOCODING_FAILED',
		'Failed to convert coordinates to address',
		'Unable to get address for this location. Please try again.'
	),
	GEOCODING_NO_RESULTS: createLocationError(
		'GEOCODING_NO_RESULTS',
		'No results found for the given address',
		'No location found for this address. Please check the spelling and try again.'
	)
};

export function validateCoordinates(latitude: number, longitude: number): boolean {
	return (
		typeof latitude === 'number' &&
		typeof longitude === 'number' &&
		!isNaN(latitude) &&
		!isNaN(longitude) &&
		latitude !== 0 &&
		longitude !== 0 &&
		Math.abs(latitude) <= 90 &&
		Math.abs(longitude) <= 180
	);
}

export function isLocationPermissionSupported(): boolean {
	return browser && 'geolocation' in navigator && 'permissions' in navigator;
}

export async function checkLocationPermission(): Promise<
	'granted' | 'denied' | 'prompt' | 'unsupported'
> {
	if (!isLocationPermissionSupported()) {
		return 'unsupported';
	}

	try {
		const permission = await navigator.permissions.query({ name: 'geolocation' });
		return permission.state;
	} catch {
		return 'unsupported';
	}
}

export async function getCurrentLocationWithOptions(
	options: LocationOptions = {}
): Promise<LocationResult> {
	const opts = { ...DEFAULT_LOCATION_OPTIONS, ...options };

	try {
		const position = await getCurrentPositionEnhanced();

		const coordinates: LocationCoordinates = {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude,
			accuracy: position.coords.accuracy
		};

		const apiKey =
			opts.preferredSource === 'google' || opts.preferredSource === 'auto'
				? PUBLIC_GOOGLE_MAP_API_KEY
				: undefined;

		const geocodeResult = await reverseGeocode(coordinates.latitude, coordinates.longitude, apiKey);

		const result: LocationResult = {
			name: geocodeResult.name,
			address: geocodeResult.address,
			coordinates,
			accuracy: position.coords.accuracy,
			source: geocodeResult.details ? 'google' : 'openstreetmap'
		};

		return result;
	} catch (error) {
		const locationError = error instanceof Error ? error : new Error('Unknown location error');

		if (
			locationError.message.includes('Permission denied') ||
			locationError.message.includes('allow location')
		) {
			throw LOCATION_ERRORS.PERMISSION_DENIED;
		} else if (
			locationError.message.includes('unavailable') ||
			locationError.message.includes('GPS')
		) {
			throw LOCATION_ERRORS.POSITION_UNAVAILABLE;
		} else if (locationError.message.includes('timeout')) {
			throw LOCATION_ERRORS.TIMEOUT;
		} else if (locationError.message.includes('not supported')) {
			throw LOCATION_ERRORS.NOT_SUPPORTED;
		} else if (locationError.message.includes('Invalid coordinates')) {
			throw LOCATION_ERRORS.INVALID_COORDINATES;
		} else {
			throw createLocationError(
				'UNKNOWN',
				locationError.message,
				`Location error: ${locationError.message}`
			);
		}
	}
}

export async function getLocationFromAddress(
	address: string,
	options: LocationOptions = {}
): Promise<LocationResult | null> {
	const opts = { ...DEFAULT_LOCATION_OPTIONS, ...options };

	try {
		const apiKey =
			opts.preferredSource === 'google' || opts.preferredSource === 'auto'
				? PUBLIC_GOOGLE_MAP_API_KEY
				: undefined;

		const geocodeResult = await geocodeAddress(address, apiKey);

		if (!geocodeResult) {
			return null;
		}

		return {
			name: address,
			address: geocodeResult.formatted_address,
			coordinates: {
				latitude: geocodeResult.latitude,
				longitude: geocodeResult.longitude
			},
			source: geocodeResult.place_id ? 'google' : 'openstreetmap'
		};
	} catch (error) {
		console.error('Error in getLocationFromAddress:', error);
		return null;
	}
}

export async function getAddressFromCoordinates(
	latitude: number,
	longitude: number,
	options: LocationOptions = {}
): Promise<{ name: string; address: string; source?: string } | null> {
	const opts = { ...DEFAULT_LOCATION_OPTIONS, ...options };

	try {
		if (!validateCoordinates(latitude, longitude)) {
			throw new Error('Invalid coordinates provided');
		}

		const apiKey =
			opts.preferredSource === 'google' || opts.preferredSource === 'auto'
				? PUBLIC_GOOGLE_MAP_API_KEY
				: undefined;

		const result = await reverseGeocode(latitude, longitude, apiKey);

		return {
			name: result.name,
			address: result.address,
			source: result.details ? 'google' : 'openstreetmap'
		};
	} catch (error) {
		console.error('Error in getAddressFromCoordinates:', error);
		return null;
	}
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371; // Radius of the Earth in kilometers
	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * (Math.PI / 180)) *
			Math.cos(lat2 * (Math.PI / 180)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // Distance in kilometers
}

export function formatDistance(distanceKm: number): string {
	if (distanceKm < 1) {
		return `${Math.round(distanceKm * 1000)}m`;
	} else if (distanceKm < 10) {
		return `${distanceKm.toFixed(1)}km`;
	} else {
		return `${Math.round(distanceKm)}km`;
	}
}

export function formatAccuracy(accuracy: number): string {
	if (accuracy < 1000) {
		return `${Math.round(accuracy)}m`;
	} else {
		return `${(accuracy / 1000).toFixed(1)}km`;
	}
}

export function getAccuracyLevel(accuracy: number): 'high' | 'medium' | 'low' {
	if (accuracy <= 10) return 'high';
	if (accuracy <= 100) return 'medium';
	return 'low';
}

export function getLocationAccuracyMessage(accuracy: number): string {
	if (accuracy <= 5) {
		return `🎯 Excellent accuracy: ${Math.round(accuracy)}m - Perfect for delivery!`;
	} else if (accuracy <= 10) {
		return `✅ High accuracy: ${Math.round(accuracy)}m - Great location precision`;
	} else if (accuracy <= 25) {
		return `👍 Good accuracy: ${Math.round(accuracy)}m - Suitable for most purposes`;
	} else if (accuracy <= 50) {
		return `⚠️ Moderate accuracy: ${Math.round(accuracy)}m - Consider moving to open area`;
	} else if (accuracy <= 100) {
		return `🔄 Low accuracy: ${Math.round(accuracy)}m - Try moving outdoors for better signal`;
	} else {
		return `📍 Very low accuracy: ${Math.round(accuracy)}m - GPS signal is weak, consider moving to open area`;
	}
}

export function getLocationAccuracyColor(accuracy: number): string {
	if (accuracy <= 10) return 'text-green-600';
	if (accuracy <= 25) return 'text-blue-600';
	if (accuracy <= 50) return 'text-yellow-600';
	if (accuracy <= 100) return 'text-orange-600';
	return 'text-red-600';
}

export function getLocationAccuracyIcon(accuracy: number): string {
	if (accuracy <= 10) return '🎯';
	if (accuracy <= 25) return '✅';
	if (accuracy <= 50) return '👍';
	if (accuracy <= 100) return '⚠️';
	return '📍';
}

export interface LocationWatcher {
	start: () => void;
	stop: () => void;
	isWatching: boolean;
}

export function createLocationWatcher(
	onLocationUpdate: (result: LocationResult) => void,
	onError: (error: LocationError) => void,
	options: LocationOptions = {}
): LocationWatcher {
	const opts = { ...DEFAULT_LOCATION_OPTIONS, ...options };
	let watchId: number | null = null;
	let isWatching = false;

	const start = () => {
		if (isWatching || !browser || !navigator.geolocation) {
			return;
		}

		const positionOptions: PositionOptions = {
			enableHighAccuracy: opts.enableHighAccuracy,
			timeout: opts.timeout,
			maximumAge: opts.maximumAge
		};

		watchId = navigator.geolocation.watchPosition(
			async (position) => {
				try {
					const coordinates: LocationCoordinates = {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						accuracy: position.coords.accuracy
					};

					const apiKey =
						opts.preferredSource === 'google' || opts.preferredSource === 'auto'
							? PUBLIC_GOOGLE_MAP_API_KEY
							: undefined;

					const geocodeResult = await reverseGeocode(
						coordinates.latitude,
						coordinates.longitude,
						apiKey
					);

					const result: LocationResult = {
						name: geocodeResult.name,
						address: geocodeResult.address,
						coordinates,
						accuracy: position.coords.accuracy,
						source: geocodeResult.details ? 'google' : 'openstreetmap'
					};

					onLocationUpdate(result);
				} catch (error) {
					const locationError =
						error instanceof Error ? error : new Error('Unknown geocoding error');
					onError(
						createLocationError(
							'GEOCODING_FAILED',
							locationError.message,
							'Failed to get address for location'
						)
					);
				}
			},
			(error) => {
				switch (error.code) {
					case error.PERMISSION_DENIED:
						onError(LOCATION_ERRORS.PERMISSION_DENIED);
						break;
					case error.POSITION_UNAVAILABLE:
						onError(LOCATION_ERRORS.POSITION_UNAVAILABLE);
						break;
					case error.TIMEOUT:
						onError(LOCATION_ERRORS.TIMEOUT);
						break;
					default:
						onError(
							createLocationError('UNKNOWN', error.message, `Location error: ${error.message}`)
						);
				}
			},
			positionOptions
		);

		isWatching = true;
	};

	const stop = () => {
		if (watchId !== null && browser && navigator.geolocation) {
			navigator.geolocation.clearWatch(watchId);
			watchId = null;
			isWatching = false;
		}
	};

	return {
		start,
		stop,
		get isWatching() {
			return isWatching;
		}
	};
}

export interface LocationBounds {
	north: number;
	south: number;
	east: number;
	west: number;
}

export function isLocationWithinBounds(
	latitude: number,
	longitude: number,
	bounds: LocationBounds
): boolean {
	return (
		latitude >= bounds.south &&
		latitude <= bounds.north &&
		longitude >= bounds.west &&
		longitude <= bounds.east
	);
}

export const NIGERIA_BOUNDS: LocationBounds = {
	north: 13.9,
	south: 4.0,
	east: 14.7,
	west: 2.7
};

export function isLocationInNigeria(latitude: number, longitude: number): boolean {
	return isLocationWithinBounds(latitude, longitude, NIGERIA_BOUNDS);
}

export function formatCoordinates(
	latitude: number,
	longitude: number,
	precision: number = 6
): string {
	return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
}

export function parseCoordinates(coordinateString: string): LocationCoordinates | null {
	try {
		const parts = coordinateString.split(',').map((part) => parseFloat(part.trim()));
		if (parts.length === 2 && validateCoordinates(parts[0], parts[1])) {
			return {
				latitude: parts[0],
				longitude: parts[1]
			};
		}
		return null;
	} catch {
		return null;
	}
}

export type { LocationResult as LocationData, LocationCoordinates as Coordinates };
