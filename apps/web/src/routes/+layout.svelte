<script lang="ts">
	import '@fontsource-variable/inter';
	import '../app.css';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import SEO from '$lib/components/SEO.svelte';
	import ImpersonationBanner from '$lib/components/impersonation-banner.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	import DeleteConfirmModal from '$lib/components/modal/DeleteConfirmModal.svelte';
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
	import NetworkStatus from '$lib/components/NetworkStatus.svelte';
	let { children, data } = $props();
	beforeNavigate(() => {
		NProgress.start();
	});
	afterNavigate(() => {
		NProgress.done();
	});
	NProgress.configure({
		showSpinner: false,
		minimum: 0.08,
		speed: 400
	});
	const isDesktop = new MediaQuery('(min-width: 768px)');

	onMount(() => {
		// Firebase FCM initialization happens in firebaseConfig.ts
	});
</script>

<div>
	<ImpersonationBanner />
	<SEO
		title="Azumi - Fast & Reliable Food Delivery in Nigeria"
		description="Your go-to food delivery service in Nigeria. Get your favorite meals delivered quickly and reliably from a wide range of restaurants."
		path={$page.url.pathname}
	/>
	{@render children()}
</div>

{#if !isDesktop.current}
	<Toaster richColors closeButton theme="light" position="top-center" />
{:else}
	<Toaster richColors closeButton theme="light" />
{/if}
<DeleteConfirmModal />
<LoadingIndicator />
<NetworkStatus />
<!-- data-vaul-drawer-wrapper -->
