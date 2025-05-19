<script lang="ts">
	import { Bike, Check } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
</script>

<svelte:head>
	<title>Application Received - Azumi Rider</title>
	<meta
		name="description"
		content="Your application to become an Azumi rider has been received."
	/>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-24 text-center">
	<div class="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
		<Check class="h-10 w-10 text-primary" />
	</div>
	
	<h1 class="font-display text-4xl font-bold tracking-tight md:text-5xl">Application Received!</h1>
	
	<p class="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
		Thanks for applying to join the Azumi rider network. We'll review your application and
		get back to you within 1-2 business days.
	</p>
	
	<div class="mt-10 flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
		<Button variant="outline" href="/">Return to Home</Button>
		<Button href="/support/rider-faq">Rider FAQ</Button>
	</div>
</div>
