import { writable } from 'svelte/store';

function createNetworkStore() {
	const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
	const { subscribe, set } = writable(isOnline);

	if (typeof window !== 'undefined') {
		// Update the store when online status changes
		window.addEventListener('online', () => set(true));
		window.addEventListener('offline', () => set(false));
	}

	return {
		subscribe,
		reset: () => set(true)
	};
}

export const networkStatus = createNetworkStore();
