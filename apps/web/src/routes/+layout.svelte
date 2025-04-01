<script lang="ts">
	import '@fontsource-variable/inter';
	import '../app.css';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	let { children, data } = $props();
</script>
pla for keeps
<div>
	{@render children()}
</div>
<Toaster richColors closeButton />
<!-- data-vaul-drawer-wrapper -->
