import { registerServiceWorker } from '$lib/pwa/register';
import { preloadEssentialPages } from '$lib/pwa/cache-utils';
import { browser } from '$app/environment';

// Register service worker in client-side only
if (browser) {
	// Delay registration slightly to prioritize app rendering
	setTimeout(() => {
		registerServiceWorker();
		preloadEssentialPages();
	}, 1000);
}
