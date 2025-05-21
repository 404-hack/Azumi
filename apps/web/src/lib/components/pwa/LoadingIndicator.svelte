<script lang="ts">
	import { networkStatus } from '$lib/stores/network';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';

	let showIndicator = false;
	let loadTimer: ReturnType<typeof setTimeout> | null = null;
	const LOADING_DELAY = 3000; // Only show full-screen indicator after 3 seconds

	$: {
		if ($navigating) {
			// Start timer when navigation begins
			if (!loadTimer) {
				loadTimer = setTimeout(() => {
					showIndicator = true;
				}, LOADING_DELAY);
			}
		} else {
			// Clear timer and hide when navigation completes
			if (loadTimer) {
				clearTimeout(loadTimer);
				loadTimer = null;
			}
			showIndicator = false;
		}
	}

	onMount(() => {
		return () => {
			// Clean up timer if component is destroyed
			if (loadTimer) {
				clearTimeout(loadTimer);
			}
		};
	});
</script>

{#if (showIndicator && $navigating) || ($navigating && !$networkStatus)}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
		<div class="flex flex-col items-center space-y-4 rounded-lg bg-white p-6 shadow-lg">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500"
			></div>
			<p class="text-sm font-medium text-gray-700">Loading...</p>
			{#if !$networkStatus}
				<p class="text-xs text-orange-600">You appear to be offline. Loading from cache...</p>
			{/if}
		</div>
	</div>
{/if}
