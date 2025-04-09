<script lang="ts">
	import '@fontsource-variable/inter';
	import '../app.css';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	let { children, data } = $props();
	beforeNavigate(() => {
		NProgress.start();
	});
	afterNavigate(() => {
		NProgress.done();
	});
	NProgress.configure({
		showSpinner: false
	});
</script>

<div>
	{@render children()}
</div>
<Toaster richColors closeButton theme="light" />
<!-- data-vaul-drawer-wrapper -->
