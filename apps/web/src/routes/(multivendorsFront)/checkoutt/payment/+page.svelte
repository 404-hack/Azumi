<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { formatCurrency } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
</script>

<Breadcrumb.Root class="mx-auto my-10 w-fit">
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link>Shipping</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			<Breadcrumb.Link>Payment</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			<Breadcrumb.Page>Confirmation</Breadcrumb.Page>
		</Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>
<div class="grid grid-cols-1 gap-5 px-5 md:grid-cols-2">
	<div class="grid place-items-center">
		<div class="space-y-3 text-center">
			<p>This is a dummy payment for demonstration purposes only</p>
			<div class="flex flex-col gap-5">
				<Button>Credit Card</Button>
				<Button>PayPal</Button>
				<Button>Apple Pay</Button>
			</div>
		</div>
	</div>

	<div class="px-10">
		<h1 class="text-xl font-semibold capitalize">Order Summary</h1>
		<div class="space-y-3 divide-y">
			<div
				class="flex justify-between gap-5 rounded-lg px-1 py-3 transition-colors hover:bg-slate-50"
			>
				<img src="/food1.jpg" class="h-24 w-36 rounded-md object-cover" alt="Food item 1" />
				<div class="flex-1 space-y-3">
					<p class="font-semibold capitalize">Delicious Meal 1</p>
					<p class="text-sm text-primary">{formatCurrency(15.99)}</p>
				</div>
				<button class="h-10 w-10 rounded-md border-2 border-border">2</button>
			</div>

			<div
				class="flex justify-between gap-5 rounded-lg px-1 py-3 transition-colors hover:bg-slate-50"
			>
				<img src="/food2.jpg" class="h-24 w-36 rounded-md object-cover" alt="Food item 2" />
				<div class="flex-1 space-y-3">
					<p class="font-semibold capitalize">Delicious Meal 2</p>
					<p class="text-sm text-primary">{formatCurrency(12.99)}</p>
				</div>
				<button class="h-10 w-10 rounded-md border-2 border-border">1</button>
			</div>

			<div class="space-y-5 py-5">
				<div class="flex items-center justify-between">
					<p>Subtotal</p>
					<p>{formatCurrency(44.97)}</p>
				</div>
				<div class="flex items-center justify-between">
					<p>Shipping</p>
					<p>{formatCurrency(5.0)}</p>
				</div>
			</div>
			<div class="flex items-center justify-between">
				<p class="py-5 font-semibold">Total</p>
				<p>{formatCurrency(49.97)}</p>
			</div>
		</div>
	</div>
</div>
