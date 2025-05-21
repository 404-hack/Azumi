/**
 * Utility functions for managing app cache and offline data
 */

/**
 * Preloads essential pages to ensure they're available offline
 */
export const preloadEssentialPages = async () => {
	if (!('caches' in window)) {
		return;
	}

	const pagesToCache = ['/', '/restaurants', '/offline'];

	try {
		for (const page of pagesToCache) {
			await fetch(page, { method: 'GET', credentials: 'same-origin' });
		}
		console.log('Essential pages preloaded for offline use');
	} catch (error) {
		console.error('Failed to preload pages:', error);
	}
};

/**
 * Clears all app caches - useful for troubleshooting or for privacy cleanup
 */
export const clearAllCaches = async () => {
	if (!('caches' in window)) {
		return false;
	}

	try {
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map((name) => caches.delete(name)));
		return true;
	} catch (error) {
		console.error('Failed to clear caches:', error);
		return false;
	}
};

/**
 * Estimates the amount of storage being used by the app
 * @returns Storage estimate in MB or null if not supported
 */
export const getStorageEstimate = async (): Promise<number | null> => {
	if (!('navigator' in window) || !('storage' in navigator) || !('estimate' in navigator.storage)) {
		return null;
	}

	try {
		const estimate = await navigator.storage.estimate();
		if (estimate.usage) {
			// Convert bytes to MB
			return Math.round(estimate.usage / (1024 * 1024));
		}
		return null;
	} catch {
		return null;
	}
};
