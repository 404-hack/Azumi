<script lang="ts">
	import { onMount } from 'svelte';

	let deferredPrompt: any = null;
	let isVisible = false;
	let isInstalled = false;

	onMount(() => {
		// Check if the app is already installed
		if (window.matchMedia('(display-mode: standalone)').matches) {
			isInstalled = true;
			return;
		}

		// Listen for the beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e) => {
			// Prevent the default behavior
			e.preventDefault();
			// Store the event for later use
			deferredPrompt = e;
			// Show the install button
			isVisible = true;
		});

		// Listen for app installed event
		window.addEventListener('appinstalled', () => {
			isInstalled = true;
			isVisible = false;
			deferredPrompt = null;
		});
	});

	const handleInstall = async () => {
		if (!deferredPrompt) return;

		// Show the install prompt
		deferredPrompt.prompt();

		// Wait for the user to respond to the prompt
		const { outcome } = await deferredPrompt.userChoice;

		// We no longer need the prompt, clear it
		deferredPrompt = null;

		// Hide the install button if the user installed the app
		if (outcome === 'accepted') {
			isVisible = false;
		}
	};

	const dismissPrompt = () => {
		isVisible = false;
	};
</script>

{#if isVisible && !isInstalled}
	<div class="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
		<div
			class="mx-auto max-w-md rounded-lg bg-white p-4 shadow-lg md:flex md:items-center md:justify-between"
		>
			<div class="mb-3 md:mb-0 md:mr-4">
				<h3 class="text-base font-semibold text-gray-900">Install Azumi</h3>
				<p class="text-sm text-gray-600">Get the full app experience</p>
			</div>
			<div class="flex">
				<button
					on:click={dismissPrompt}
					class="mr-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Not now
				</button>
				<button
					on:click={handleInstall}
					class="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
				>
					Install
				</button>
			</div>
		</div>
	</div>
{/if}
