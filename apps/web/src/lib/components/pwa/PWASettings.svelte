<script lang="ts">
	import { onMount } from 'svelte';
	import { clearAllCaches, getStorageEstimate } from '$lib/pwa/cache-utils';
	import { unregisterServiceWorker } from '$lib/pwa/register';
	import { toast } from 'svelte-sonner';

	let isSupported = false;
	let installPromptEvent: BeforeInstallPromptEvent | null = null;
	let isInstalled = false;
	let storageUsage: number | null = null;

	onMount(async () => {
		isSupported = 'serviceWorker' in navigator;
		isInstalled = window.matchMedia('(display-mode: standalone)').matches;
		storageUsage = await getStorageEstimate();

		window.addEventListener('beforeinstallprompt', (e) => {
			// Prevent the default behavior
			e.preventDefault();
			// Store the event for later use
			installPromptEvent = e as BeforeInstallPromptEvent;
		});
	});

	async function handleInstall() {
		if (!installPromptEvent) {
			toast.error('Installation prompt not available');
			return;
		}

		// Show the install prompt
		installPromptEvent.prompt();

		// Wait for the user to respond to the prompt
		const { outcome } = await installPromptEvent.userChoice;

		if (outcome === 'accepted') {
			toast.success('App installed successfully!');
			isInstalled = true;
		} else {
			toast.error('App installation was declined');
		}

		// Clear the prompt
		installPromptEvent = null;
	}

	async function handleClearCache() {
		const success = await clearAllCaches();
		if (success) {
			toast.success('Cache cleared successfully');
			storageUsage = await getStorageEstimate();
		} else {
			toast.error('Failed to clear cache');
		}
	}

	async function handleUninstall() {
		const success = await unregisterServiceWorker();
		if (success) {
			toast.success('Service worker unregistered. Refresh the page to complete uninstallation.');
		} else {
			toast.error('Failed to unregister service worker');
		}
	}
</script>

<div class="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-lg">
	<h2 class="mb-4 text-xl font-bold text-gray-900">PWA Settings</h2>

	{#if !isSupported}
		<p class="text-red-500">Progressive Web App features are not supported in your browser.</p>
	{:else}
		<div class="mb-6 space-y-4">
			<div class="flex items-center justify-between rounded-md bg-gray-50 p-3">
				<div>
					<h3 class="font-medium text-gray-900">App Status</h3>
					<p class="text-sm text-gray-600">
						{#if isInstalled}
							App is installed and running in standalone mode
						{:else}
							App is running in browser mode
						{/if}
					</p>
				</div>
				{#if !isInstalled && installPromptEvent}
					<button
						on:click={handleInstall}
						class="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
					>
						Install App
					</button>
				{/if}
			</div>

			<div class="flex items-center justify-between rounded-md bg-gray-50 p-3">
				<div>
					<h3 class="font-medium text-gray-900">Storage Usage</h3>
					<p class="text-sm text-gray-600">
						{#if storageUsage !== null}
							App is using approximately {storageUsage} MB of storage
						{:else}
							Storage usage information is not available
						{/if}
					</p>
				</div>
				<button
					on:click={handleClearCache}
					class="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Clear Cache
				</button>
			</div>

			<div class="flex items-center justify-between rounded-md bg-gray-50 p-3">
				<div>
					<h3 class="font-medium text-gray-900">Uninstall App</h3>
					<p class="text-sm text-gray-600">
						This will remove the service worker and clear cached data
					</p>
				</div>
				<button
					on:click={handleUninstall}
					class="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
				>
					Uninstall
				</button>
			</div>
		</div>

		<div class="mt-6 rounded-md bg-blue-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 text-blue-600"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-blue-700">
						<strong>About PWA:</strong> Progressive Web Apps combine the best of web and mobile apps.
						They're reliable (work offline), fast, and engaging.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
