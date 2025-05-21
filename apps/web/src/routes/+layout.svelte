<script lang="ts">
	import '@fontsource-variable/inter';
	import '../app.css';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import SEO from '$lib/components/SEO.svelte';
	import ImpersonationBanner from '$lib/components/impersonation-banner.svelte';
	import { registerServiceWorker } from '$lib/pwa/register';
	import { preloadEssentialPages } from '$lib/pwa/cache-utils';

	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	import DeleteConfirmModal from '$lib/components/modal/DeleteConfirmModal.svelte';
	import InstallPrompt from '$lib/components/pwa/InstallPrompt.svelte';
	import OfflineNotification from '$lib/components/pwa/OfflineNotification.svelte';
	import UpdateNotification from '$lib/components/pwa/UpdateNotification.svelte';
	import NotificationPrompt from '$lib/components/pwa/NotificationPrompt.svelte';
	import LoadingIndicator from '$lib/components/pwa/LoadingIndicator.svelte';
	import { networkStatus } from '$lib/stores/network';
	let { children, data } = $props();
	beforeNavigate(() => {
		NProgress.start();
	});
	afterNavigate(() => {
		NProgress.done();
	});
	NProgress.configure({
		showSpinner: false,
		// Make NProgress a bit more noticeable when offline to better indicate loading state
		minimum: $networkStatus ? 0.08 : 0.2,
		speed: $networkStatus ? 400 : 200
	});
	const isDesktop = new MediaQuery('(min-width: 768px)');

	onMount(() => {
		registerServiceWorker();
		// Preload essential pages for offline access
		preloadEssentialPages();
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

<InstallPrompt />
<OfflineNotification />
<UpdateNotification />
<NotificationPrompt />
<LoadingIndicator />

{#if !isDesktop.current}
	<Toaster richColors closeButton theme="light" position="top-center" />
{:else}
	<Toaster richColors closeButton theme="light" />
{/if}
<DeleteConfirmModal />
<!-- data-vaul-drawer-wrapper -->
