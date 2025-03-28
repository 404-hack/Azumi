<script lang="ts">
	import { CheckCircle2 } from 'lucide-svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Confetti } from 'svelte-confetti';
</script>

<div
	style="
 position: fixed;
 top: -50px;
 left: 0;
 height: 100vh;
 width: 100vw;
 display: flex;
 justify-content: center;
 overflow: hidden;
 pointer-events: none;"
>
	<Confetti
		x={[-5, 5]}
		y={[0, 0.1]}
		delay={[500, 2000]}
		duration={5000}
		amount={200}
		fallDistance="100vh"
	/>
	<!-- love of confetti -->
</div>
<Breadcrumb.Root class="mx-auto my-10 w-fit">
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href="./">Shipping</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			<Breadcrumb.Link href="/components">Payment</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			<Breadcrumb.Page>Confirmation</Breadcrumb.Page>
		</Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>
<div class="mx-auto max-w-4xl px-3">
	<h1 class="flex items-center gap-5 text-center text-4xl font-bold capitalize">
		<CheckCircle2 class="size-16 text-green-500" />
		Order summary
	</h1>
	<p class="mb-10 mt-5 text-2xl">
		Your order has been received! <span class="font-medium">ORD123456</span>
	</p>
	<div class="space-y-3 divide-y">
		<div
			class="flex justify-between gap-5 rounded-lg px-1 py-3 transition-colors hover:bg-slate-50"
		>
			<img src="/product1.jpg" class="h-24 w-36 rounded-md object-cover" alt="Product 1" />
			<div class="flex-1 space-y-3">
				<p class="font-semibold capitalize">Sample Product 1</p>
				<p class="text-xs text-muted-foreground">SKU-001</p>
				<p class="text-sm text-primary">$99.99</p>
			</div>
			<button class="h-10 w-10 rounded-md border-2 border-border"> 2 </button>
		</div>
		<div
			class="flex justify-between gap-5 rounded-lg px-1 py-3 transition-colors hover:bg-slate-50"
		>
			<img src="/product2.jpg" class="h-24 w-36 rounded-md object-cover" alt="Product 2" />
			<div class="flex-1 space-y-3">
				<p class="font-semibold capitalize">Sample Product 2</p>
				<p class="text-xs text-muted-foreground">SKU-002</p>
				<p class="text-sm text-primary">$149.99</p>
			</div>
			<button class="h-10 w-10 rounded-md border-2 border-border"> 1 </button>
		</div>
		<div class="space-y-5 py-5">
			<div class="flex items-center justify-between">
				<p>Subtotal</p>
				<p>$349.97</p>
			</div>
			<div class="flex items-center justify-between">
				<p>Shipping</p>
				<p>$10.00</p>
			</div>
		</div>
		<div class="flex items-center justify-between">
			<p class="py-5 font-semibold">Total</p>
			<p>$359.97</p>
		</div>
	</div>
</div>
