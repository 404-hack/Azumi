<script>
	import { CircleCheck, ArrowRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="container mx-auto max-w-3xl px-4 py-12">
	<div class="mb-12 text-center">
		<div class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
			<CircleCheck class="size-12 text-primary" />
		</div>
		<h1 class="font-display text-4xl font-bold tracking-tight">Welcome to Azumi!</h1>
		<p class="mt-3 text-lg text-muted-foreground">
			Your vendor account has been created. We'll reach out within 24-48 hours to help you get
			started.
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
				<h2 class="font-display text-2xl font-bold">Store Profile</h2>
				<p class="mt-2 text-muted-foreground">
					Add your store name, contact details, address, and description.
				</p>
			</div>

			<div class="relative pl-16">
				<div
					class="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow"
				>
					<span class="font-display text-xl font-bold">2</span>
				</div>
				<h2 class="font-display text-2xl font-bold">Menu</h2>
				<p class="mt-2 text-muted-foreground">
					Add at least one menu item to showcase your offerings.
				</p>
			</div>

			<div class="relative pl-16">
				<div
					class="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow"
				>
					<span class="font-display text-xl font-bold">3</span>
				</div>
				<h2 class="font-display text-2xl font-bold">Business Hours</h2>
				<p class="mt-2 text-muted-foreground">Set your operating hours for customer orders.</p>
			</div>

			<div class="relative pl-16">
				<div
					class="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow"
				>
					<span class="font-display text-xl font-bold">4</span>
				</div>
				<h2 class="font-display text-2xl font-bold">Payments</h2>
				<p class="mt-2 text-muted-foreground">
					Set up your payment method to receive customer payments.
				</p>
			</div>

			<div class="relative pl-16">
				<div
					class="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow"
				>
					<span class="font-display text-xl font-bold">5</span>
				</div>
				<h2 class="font-display text-2xl font-bold">Terms</h2>
				<p class="mt-2 text-muted-foreground">Review and accept our platform's terms of service.</p>
			</div>

			<div class="relative pl-16">
				<div
					class="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
				>
					<span class="font-display text-xl font-bold text-primary">✓</span>
				</div>
				<h2 class="font-display text-2xl font-bold">Activation</h2>
				<p class="mt-2 text-muted-foreground">
					After completing these steps, you can request store activation. We'll review and activate
					your store within 24 hours.
				</p>
			</div>
		</div>
	</div>

	<div class="mt-12 text-center">
		<Button href="/vendor/profile" variant="outline" size="lg">
			Start Setup
			<ArrowRight class="ml-2 size-4" />
		</Button>
	</div>
</div>
