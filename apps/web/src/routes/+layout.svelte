<script lang="ts">
	import '@fontsource-variable/inter';
	import '../app.css';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';

	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	import DeleteConfirmModal from '$lib/components/modal/DeleteConfirmModal.svelte';
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
	const isDesktop = new MediaQuery('(min-width: 768px)');
</script>

<div>
	{@render children()}
</div>

{#if !isDesktop.current}
	<Toaster richColors closeButton theme="light" position="top-center" />
{:else}
	<Toaster richColors closeButton theme="light" />
{/if}
<DeleteConfirmModal />
<!-- data-vaul-drawer-wrapper -->
