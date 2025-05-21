<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { networkStatus } from '$lib/stores/network';

	let wasOnline = true;

	onMount(() => {
		// Set initial online status
		wasOnline = $networkStatus;
		// Subscribe to networkStatus changes
		const unsubscribe = networkStatus.subscribe((online) => {
			// Only show toast when status changes
			if (wasOnline !== online) {
				if (online) {
					toast.success('You are back online!', {
						description: 'Your app is now fully functional.',
						duration: 3000
					});
				} else {
					toast.error('You are offline', {
						description: 'Some features may be limited until you reconnect.',
						duration: 5000
					});
				}

				wasOnline = online;
			}
		});

		return unsubscribe;
	});
</script>
