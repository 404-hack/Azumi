import {
	getCurrentLocationWithOptions,
	getLocationFromAddress,
	createLocationWatcher,
	type LocationResult,
	type LocationError,
	type LocationOptions
} from '$lib/utils/location';
import { toast } from 'svelte-sonner';

interface UseLocationOptions extends LocationOptions {
	showToasts?: boolean;
	onLocationUpdate?: (location: LocationResult) => void;
	onError?: (error: LocationError) => void;
}

export function useLocation(options: UseLocationOptions = {}) {
	let isLoading = $state(false);
	let currentLocation = $state<LocationResult | null>(null);
	let error = $state<LocationError | null>(null);
	let isWatching = $state(false);

	const { showToasts = true, onLocationUpdate, onError, ...locationOptions } = options;

	const watcher = createLocationWatcher(
		(location) => {
			currentLocation = location;
			if (showToasts) {
				toast.success(`Location updated: ${location.name}`);
			}
			onLocationUpdate?.(location);
		},
		(err) => {
			error = err;
			if (showToasts) {
				toast.error(err.userMessage);
			}
			onError?.(err);
		},
		locationOptions
	);

	async function getCurrentLocation() {
		try {
			isLoading = true;
			error = null;

			const location = await getCurrentLocationWithOptions(locationOptions);
			currentLocation = location;

			if (showToasts) {
				toast.success(`Location found: ${location.name}`);
			}

			return location;
		} catch (err) {
			const locationError = err as LocationError;
			error = locationError;

			if (showToasts) {
				toast.error(locationError.userMessage);
			}

			onError?.(locationError);
			throw locationError;
		} finally {
			isLoading = false;
		}
	}

	async function searchLocation(address: string) {
		try {
			isLoading = true;
			error = null;

			const location = await getLocationFromAddress(address, locationOptions);

			if (location) {
				currentLocation = location;

				if (showToasts) {
					toast.success(`Location found: ${location.name}`);
				}

				return location;
			} else {
				const err: LocationError = {
					code: 'NO_RESULTS',
					message: 'No location found for address',
					userMessage:
						'No location found for this address. Please check the spelling and try again.'
				};

				error = err;

				if (showToasts) {
					toast.error(err.userMessage);
				}

				onError?.(err);
				return null;
			}
		} catch (err) {
			const locationError = err as LocationError;
			error = locationError;

			if (showToasts) {
				toast.error(locationError.userMessage);
			}

			onError?.(locationError);
			throw locationError;
		} finally {
			isLoading = false;
		}
	}

	function startWatching() {
		if (!isWatching) {
			watcher.start();
			isWatching = true;

			if (showToasts) {
				toast.info('Location tracking started');
			}
		}
	}

	function stopWatching() {
		if (isWatching) {
			watcher.stop();
			isWatching = false;

			if (showToasts) {
				toast.info('Location tracking stopped');
			}
		}
	}

	function clearLocation() {
		currentLocation = null;
		error = null;
	}

	function setLocation(location: LocationResult) {
		currentLocation = location;
		error = null;
	}

	return {
		get isLoading() {
			return isLoading;
		},
		get currentLocation() {
			return currentLocation;
		},
		get error() {
			return error;
		},
		get isWatching() {
			return isWatching;
		},
		getCurrentLocation,
		searchLocation,
		startWatching,
		stopWatching,
		clearLocation,
		setLocation
	};
}
