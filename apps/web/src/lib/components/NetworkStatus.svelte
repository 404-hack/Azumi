<script lang="ts">
	import { onMount } from 'svelte';
	import { Wifi, WifiOff } from 'lucide-svelte';

	let isOnline = $state(true);
	let showIndicator = $state(false);
	let hideTimeout: NodeJS.Timeout | null = null;

	function updateOnlineStatus() {
		const wasOnline = isOnline;
		isOnline = navigator.onLine;

		if (wasOnline !== isOnline) {
			showIndicator = true;

			if (hideTimeout) {
				clearTimeout(hideTimeout);
			}

			hideTimeout = setTimeout(
				() => {
					showIndicator = false;
				},
				isOnline ? 3000 : 0
			);
		}
	}

	onMount(() => {
		isOnline = navigator.onLine;

		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
			if (hideTimeout) {
				clearTimeout(hideTimeout);
			}
		};
	});
</script>

{#if showIndicator || !isOnline}
	<div
		class="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-lg transition-all duration-300 {isOnline
			? 'bg-green-500 text-white'
			: 'bg-red-500 text-white'}"
	>
		{#if isOnline}
			<Wifi class="h-4 w-4" />
			<span>Back online</span>
		{:else}
			<WifiOff class="h-4 w-4" />
			<span>No internet connection</span>
		{/if}
	</div>
{/if}
