<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	let { children, data } = $props();
	$inspect(data);
</script>

<Header />
<main>
	{@render children()}
</main>
<Footer />
