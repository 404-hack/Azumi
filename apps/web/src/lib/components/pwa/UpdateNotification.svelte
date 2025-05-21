<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let newServiceWorker: ServiceWorker | null = null;

	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				// Controller changed, which means the SW has been updated
				// and the page needs reloading to show new content
				window.location.reload();
			});

			navigator.serviceWorker.ready
				.then((registration) => {
					// Check for updates every 15 minutes
					setInterval(
						() => {
							registration.update();
						},
						15 * 60 * 1000
					);

					// Watch for new service worker installation
					registration.addEventListener('updatefound', () => {
						newServiceWorker = registration.installing;

						if (newServiceWorker) {
							newServiceWorker.addEventListener('statechange', () => {
								if (newServiceWorker?.state === 'installed' && navigator.serviceWorker.controller) {
									// New service worker is installed and ready to take over
									showUpdateToast();
								}
							});
						}
					});
				})
				.catch((error) => {
					console.error('Error during service worker registration:', error);
				});
		}
	});

	const showUpdateToast = () => {
		toast('Update available!', {
			description: 'A new version of Azumi is available.',
			action: {
				label: 'Update Now',
				onClick: () => {
					// This will trigger page reload and new service worker activation
					if (newServiceWorker) {
						newServiceWorker.postMessage({ type: 'SKIP_WAITING' });
					}
				}
			},
			duration: Infinity,
			position: 'top-center'
		});
	};
</script>
