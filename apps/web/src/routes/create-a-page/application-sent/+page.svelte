<script>
	import { CircleCheck, ArrowRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="container mx-auto max-w-3xl px-4 py-12">
	<div class="mb-12 text-center">
		<div class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
			<CircleCheck class="size-12 text-primary" />
		</div>
		<h1 class="font-display text-4xl font-bold tracking-tight">Application Submitted!</h1>
		<p class="mt-3 text-lg text-muted-foreground">
			Thank you for choosing to partner with African Market Online. We're excited to have you join
			our marketplace!
		</p>
	</div>

	<div class="relative mx-auto max-w-2xl">
		<div class="absolute left-8 top-0 h-full w-px bg-border" />

		<div class="space-y-8">
			<div class="relative pl-16">
				<div
					class="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow"
				>
					<span class="font-display text-xl font-bold">1</span>
				</div>
				<h2 class="font-display text-2xl font-bold">Initial Contact</h2>
				<p class="mt-2 text-muted-foreground">
					Our dedicated sales team will reach out to you within the next 24-48 hours to discuss your
					application and answer any questions.
				</p>
			</div>

			<div class="relative pl-16">
				<div
					class="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow"
				>
					<span class="font-display text-xl font-bold">2</span>
				</div>
				<h2 class="font-display text-2xl font-bold">Partnership Agreement</h2>
				<p class="mt-2 text-muted-foreground">
					We'll work together to create a tailored partnership agreement that meets your business
					needs and ensures mutual success.
				</p>
			</div>

			<div class="relative pl-16">
				<div
					class="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow"
				>
					<span class="font-display text-xl font-bold">3</span>
				</div>
				<h2 class="font-display text-2xl font-bold">Store Setup</h2>
				<p class="mt-2 text-muted-foreground">
					Our team will guide you through setting up your digital storefront, including product
					listings, pricing, and operations training.
				</p>
			</div>

			<div class="relative pl-16">
				<div
					class="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
				>
					<span class="font-display text-xl font-bold text-primary">✓</span>
				</div>
				<h2 class="font-display text-2xl font-bold">Launch Your Store</h2>
				<p class="mt-2 text-muted-foreground">
					Once everything is set up, you'll be ready to start selling to customers across Africa.
					Our support team will be there every step of the way.
				</p>
			</div>
		</div>
	</div>

	<div class="mt-12 text-center">
		<Button href='/vendor/orders' variant="outline" size="lg">
			Go to your dashboard
			<ArrowRight class="ml-2 size-4" />
		</Button>
	</div>
</div>
