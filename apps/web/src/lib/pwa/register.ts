export const registerServiceWorker = () => {
	if ('serviceWorker' in navigator) {
		// Wait for the page to load to ensure other resources don't compete with service worker registration
		window.addEventListener('load', () => {
			// Use a try-catch block to handle potential errors
			try {
				// Use the service worker from the static folder instead
				navigator.serviceWorker
					.register('/service-worker.js', { scope: '/' })
					.then((registration) => {
						console.log('SW registered with scope:', registration.scope);

						// Handle updates
						registration.onupdatefound = () => {
							const installingWorker = registration.installing;
							if (installingWorker) {
								installingWorker.onstatechange = () => {
									if (installingWorker.state === 'installed') {
										if (navigator.serviceWorker.controller) {
											// New content is available, refresh is needed
											console.log('New content is available; please refresh.');
										} else {
											// Content is cached for offline use
											console.log('Content is cached for offline use.');
										}
									}
								};
							}
						};
					})
					.catch((error) => {
						console.error('Error during service worker registration:', error);
					});
			} catch (error) {
				console.error('Exception during service worker registration:', error);
			}
		});
	}
};

export const unregisterServiceWorker = async () => {
	if ('serviceWorker' in navigator) {
		const registration = await navigator.serviceWorker.ready;
		return registration.unregister();
	}
	return false;
};
