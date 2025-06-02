<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	onMount(() => {
		const orderId = $page.params.id;
		toast.info('Order acceptance is now handled via real-time notifications');
		goto('/rider/deliveries', { replaceState: true });
	});
</script>

<div class="flex items-center justify-center min-h-screen">
	<div class="text-center">
		<h1 class="text-2xl font-bold mb-4">Redirecting...</h1>
		<p class="text-muted-foreground">Order acceptance is now handled via real-time notifications</p>
	</div>
</div>
