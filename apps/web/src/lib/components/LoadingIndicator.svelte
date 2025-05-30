<script lang="ts">
	import { navigating } from '$app/stores';
	import { Loader2 } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let showLoading = $state(false);
	let loadingTimeout: NodeJS.Timeout | null = null;

	$effect(() => {
		if ($navigating) {
			if (loadingTimeout) {
				clearTimeout(loadingTimeout);
			}

			loadingTimeout = setTimeout(() => {
				showLoading = true;
			}, 1500);
		} else {
			if (loadingTimeout) {
				clearTimeout(loadingTimeout);
				loadingTimeout = null;
			}
			showLoading = false;
		}
	});

	onMount(() => {
		return () => {
			if (loadingTimeout) {
				clearTimeout(loadingTimeout);
			}
		};
	});
</script>

{#if showLoading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
		<div
			class="flex flex-col items-center gap-3 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
		>
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
			<p class="text-sm text-muted-foreground">Loading...</p>
		</div>
	</div>
{/if}
