<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { productModalState } from '$lib/states/modalState.svelte';
	import { Minus, Plus, Star } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { blur } from 'svelte/transition';
	import { Separator } from '$lib/components/ui/separator';
	import { Checkbox } from '$lib/components/ui/checkbox';

	const isDesktop = new MediaQuery('(min-width: 768px)');
	let quantity = $state(1);
	let selectedVariants = $state<Record<string, { selected: boolean; quantity: number }>>({});
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { Snippet } from 'svelte';
	import Badge from '../ui/badge/badge.svelte';

	type Props = {
		open?: boolean;
		title: string;
		description?: string;
	};
	let { open = $bindable(), title, description }: Props = $props();
	let activeSnapPoint = $state(148);

	const additionalItems = [
		{ id: '1', name: 'Wasabi', price: 0.5 },
		{ id: '2', name: 'Soy Sauce', price: 0.5 },
		{ id: '3', name: 'Ginger', price: 0.5 },
		{ id: '4', name: 'Extra Chopsticks', price: 0.25 }
	];

	const basePrice = 16.99;

	let getTotalPrice = $derived.by(() => {
		let total = basePrice * quantity;

		// Add price of selected variants
		for (const [id, variant] of Object.entries(selectedVariants)) {
			if (variant.selected) {
				const item = additionalItems.find((i) => i.id === id);
				if (item) {
					total += item.price * variant.quantity;
				}
			}
		}

		return total.toFixed(2);
	});

	function incrementVariantQuantity(id: string) {
		if (selectedVariants[id]) {
			selectedVariants[id].quantity++;
		}
	}

	function decrementVariantQuantity(id: string) {
		if (selectedVariants[id] && selectedVariants[id].quantity > 1) {
			selectedVariants[id].quantity--;
		}
	}
</script>

{#if isDesktop.current}
	<Dialog.Root bind:open={productModalState.value}>
		<Dialog.Content class=" overflow-hidden p-0 sm:max-w-[425px]  ">
			<ScrollArea class="relative h-full max-h-[90vh] w-full">
				<div class="">
					<img
						src="https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg"
						in:blur={{ duration: 300 }}
						loading="lazy"
						class="h-[350px] w-full object-cover"
						alt=""
					/>
				</div>
				<div class="w-full overflow-auto">
					<div class="grid gap-4 p-4">
						<h1 class=" italian text-2xl font-bold capitalize lg:text-3xl">
							Spicy Tuna Roll Deluxe
						</h1>
						<div class="flex items-center gap-2">
							<p class="text-primary">${basePrice}</p>
							<Badge>popular</Badge>
						</div>
						<p class="mt-2 text-sm text-muted-foreground">
							Fresh sushi-grade tuna mixed with spicy mayo and crispy tempura flakes, wrapped in
							premium nori and sushi rice. Topped with sliced avocado, spicy sauce, and tobiko.
							Served with pickled ginger and wasabi. Contains 8 pieces.
						</p>
					</div>
				</div>
				<Separator />

				<div class="px-4 py-3">
					<h3 class="mb-3 font-medium">Additional Items</h3>
					<p class="mb-4 text-sm text-muted-foreground">Choose optional add-ons</p>
					<div class="space-y-3">
						{#each additionalItems as item (item.id)}
							<div class="flex items-center space-x-2">
								<Checkbox
									checked={selectedVariants[item.id]?.selected || false}
									onCheckedChange={(checked) => {
										selectedVariants[item.id] = {
											selected: checked,
											quantity: checked ? 1 : 0
										};
									}}
									id={item.id}
								/>
								<label for={item.id} class="flex flex-1 items-center justify-between text-sm">
									<span>{item.name}</span>
									<div class="flex items-center gap-2">
										{#if selectedVariants[item.id]?.selected}
											<div class="flex items-center gap-2">
												<button
													class="flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
													disabled={selectedVariants[item.id].quantity <= 1}
													onclick={() => decrementVariantQuantity(item.id)}
												>
													<Minus class="h-3 w-3" />
												</button>
												<span class="w-4 text-center">{selectedVariants[item.id].quantity}</span>
												<button
													onclick={() => incrementVariantQuantity(item.id)}
													class="flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
												>
													<Plus class="h-3 w-3" />
												</button>
											</div>
										{/if}
										<span class="text-muted-foreground">
											+${(item.price * (selectedVariants[item.id]?.quantity || 0)).toFixed(2)}
										</span>
									</div>
								</label>
							</div>
						{/each}
					</div>
				</div>

				<Separator class="mb-32" />

				<div class="fixed bottom-0 z-10 w-full bg-white px-3 py-4">
					<div class="mb-4 flex items-center justify-between">
						<span class="font-medium">Quantity</span>
						<div class="flex items-center gap-4">
							<button
								class="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
								disabled={quantity <= 1}
								onclick={() => quantity--}
							>
								<Minus class="h-4 w-4" />
							</button>
							<span class="w-4 text-center">{quantity}</span>
							<button
								onclick={() => quantity++}
								class="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
							>
								<Plus class="h-4 w-4" />
							</button>
						</div>
					</div>
					<Button class="w-full shadow-lg " size="lg">
						Add to Cart - ${getTotalPrice}
					</Button>
				</div>
			</ScrollArea>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open={productModalState.value}>
		<Drawer.Content
			class="fixed bottom-0 left-0 right-0 flex max-h-[96%] flex-col rounded-t-[10px] bg-white"
		>
			<ScrollArea class="max-h-[90vh] w-full overflow-auto">
				<div class="">
					<img
						src="https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg"
						in:blur={{ duration: 300 }}
						loading="lazy"
						class="h-[350px] w-full object-cover"
						alt=""
					/>
				</div>
				<div class="w-full overflow-auto">
					<div class="grid gap-4 p-4">
						<h1 class=" italian text-2xl font-bold capitalize lg:text-3xl">
							Spicy Tuna Roll Deluxe
						</h1>
						<div class="flex items-center gap-2">
							<p class="text-primary">${basePrice}</p>
							<Badge>popular</Badge>
						</div>
						<p class="mt-2 text-sm text-muted-foreground">
							Fresh sushi-grade tuna mixed with spicy mayo and crispy tempura flakes, wrapped in
							premium nori and sushi rice. Topped with sliced avocado, spicy sauce, and tobiko.
							Served with pickled ginger and wasabi. Contains 8 pieces.
						</p>
					</div>
				</div>
				<Separator />

				<div class="px-4 py-3">
					<h3 class="mb-3 font-medium">Additional Items</h3>
					<p class="mb-4 text-sm text-muted-foreground">Choose optional add-ons</p>
					<div class="space-y-3">
						{#each additionalItems as item (item.id)}
							<div class="flex items-center space-x-2">
								<Checkbox
									checked={selectedVariants[item.id]?.selected || false}
									onCheckedChange={(checked) => {
										selectedVariants[item.id] = {
											selected: checked,
											quantity: checked ? 1 : 0
										};
									}}
									id={item.id}
								/>
								<label for={item.id} class="flex flex-1 items-center justify-between text-sm">
									<span>{item.name}</span>
									<div class="flex items-center gap-2">
										{#if selectedVariants[item.id]?.selected}
											<div class="flex items-center gap-2">
												<button
													class="flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
													disabled={selectedVariants[item.id].quantity <= 1}
													onclick={() => decrementVariantQuantity(item.id)}
												>
													<Minus class="h-3 w-3" />
												</button>
												<span class="w-4 text-center">{selectedVariants[item.id].quantity}</span>
												<button
													onclick={() => incrementVariantQuantity(item.id)}
													class="flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
												>
													<Plus class="h-3 w-3" />
												</button>
											</div>
										{/if}
										<span class="text-muted-foreground">
											+${(item.price * (selectedVariants[item.id]?.quantity || 0)).toFixed(2)}
										</span>
									</div>
								</label>
							</div>
						{/each}
					</div>
				</div>
				<Separator class="mb-32" />

				<div class="fixed bottom-0 z-10 w-full bg-white px-3 py-4">
					<div class="mb-4 flex items-center justify-between">
						<span class="font-medium">Quantity</span>
						<div class="flex items-center gap-4">
							<button
								class="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
								disabled={quantity <= 1}
								onclick={() => quantity--}
							>
								<Minus class="h-4 w-4" />
							</button>
							<span class="w-4 text-center">{quantity}</span>
							<button
								onclick={() => quantity++}
								class="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
							>
								<Plus class="h-4 w-4" />
							</button>
						</div>
					</div>
					<Button class="w-full shadow-lg " size="lg">
						Add to Cart - ${getTotalPrice}
					</Button>
				</div>
			</ScrollArea>
		</Drawer.Content>
	</Drawer.Root>
{/if}

<!-- <ResponsiveDialog title="Product Modal"> -->
<!-- <div class="flex h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[425px]">
		<div class="relative h-[200px]">
			<img

				src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-SSblrrWFVBSKVdSIWT9L0tYXDcyfYf.png"
				alt="Sushi set"
				class="absolute inset-0 h-full w-full object-cover"
			/>
			<Button
				variant="ghost"
				size="icon"
				class="absolute right-2 top-2 z-10"
				aria-label="Close dialog"
			>
				<Minus class="h-5 w-5 text-white" />
			</Button>
		</div>

		<div class="-mt-10 flex-1 overflow-y-auto">
			<div class="relative space-y-6 rounded-t-xl bg-white p-6">
				<div>
					<h2 class="flex items-center gap-1 text-2xl font-semibold">
						<Star class="h-6 w-6 fill-yellow-400 text-yellow-400" />
						Amijami Autumn Set 24 pcs
						<Star class="h-6 w-6 fill-yellow-400 text-yellow-400" />
					</h2>
					<div class="mt-2 flex items-center gap-3">
						<span class="text-xl text-red-500">€{50}</span>
						<span class="text-sm text-muted-foreground line-through">35.50</span>
						<span class="rounded bg-blue-500 px-2 py-0.5 text-sm text-white">Popular</span>
					</div>
				</div>

				<div class="space-y-2">
					<p class="text-sm">
						Volcano maki (salmon, crab meat, unagi sauce, masago sauce, cream cheese, 8 pcs),
					</p>
					<p class="text-sm">
						Philadelphia maki (salmon, avocado, cream cheese, sesame seeds, 8 pcs),
					</p>
					<button class="text-sm text-blue-500">show more</button>
				</div>

				<div>
					<h3 class="mb-3 font-medium">Vali lisandid (tuleb eraldi soetada)</h3>
					<p class="mb-4 text-sm text-muted-foreground">Choose up to 30 additional items</p>
					<div class="space-y-3">
						{#each [{ id: '1', name: 'Wasabi', price: 0.5 }, { id: '2', name: 'Soy Sauce', price: 0.5 }, { id: '3', name: 'Ginger', price: 0.5 }, { id: '4', name: 'Extra Chopsticks', price: 0.25 }] as item (item.id)}
							<div class="flex items-center space-x-2">
								<input
									type="checkbox"
									id={item.id}
									onchange={(e) => {
										const checked = e.currentTarget.checked;
										selectedVariants = {
											...selectedVariants,
											[item.id]: checked
										};
									}}
								/>
								<label for={item.id} class="flex-1 text-sm">
									{item.name}
									<span class="ml-2 text-muted-foreground">+€{item.price.toFixed(2)}</span>
								</label>
							</div>
						{/each}
					</div>
				</div>

				<div>
					<h3 class="mb-3 font-medium">Mitut rulli soovite vegan kreemjuustuga?</h3>
					<p class="text-sm text-muted-foreground">Choose up to 4 additional items</p>
				</div>
			</div>
		</div>

		<div class="border-t bg-white p-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center rounded-lg bg-gray-100">
					<Button
						variant="ghost"
						size="icon"
						class="h-10 w-10 text-blue-500"
						onclick={() => (quantity = Math.max(1, quantity - 1))}
					>
						<Minus class="h-4 w-4" />
					</Button>
					<span class="w-12 text-center">{quantity}</span>
					<Button
						variant="ghost"
						size="icon"
						class="h-10 w-10 text-blue-500"
						onclick={() => quantity++}
					>
						<Plus class="h-4 w-4" />
					</Button>
				</div>
				<Button class="bg-blue-500 px-8 text-white hover:bg-blue-600">
					Add to order
					<span class="ml-2">€{50}</span>
				</Button>
			</div>
		</div>
	</div> -->
<!-- <div class="border-t pt-4">
		<div class="mb-4 flex items-center justify-between">
			<span class="font-medium">Quantity</span>
			<div class="flex items-center gap-4">
				<button
					class="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
					disabled={quantity <= 1}
				>
					<Minus class="h-4 w-4" />
				</button>
				<span class="w-4 text-center">{quantity}</span>
				<button
					onclick={() => quantity++}
					class="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-primary hover:text-primary"
				>
					<Plus class="h-4 w-4" />
				</button>
			</div>
		</div>
		<Button class="w-full" size="lg">
			Add to Cart - ${10}
		</Button>
	</div> -->

<!-- <div class="sticky bottom-0 flex items-center gap-1 bg-background p-4 drop-shadow-md">
		<div
			class="flex items-center gap-4 rounded-lg border border-primary/10 bg-primary/10 p-2 shadow-lg"
		>
			<Button size="icon" variant="outline">
				<Minus />
			</Button>
			<p class="text-xl font-normal text-primary">6</p>
			<Button size="icon" variant="outline">
				<Plus />
			</Button>
		</div>
		<Button type="submit" class="h-full flex-1 justify-between shadow-lg">
			<span class="font-bold capitalize">add to order</span>

			50
		</Button>
	</div> -->
<!-- </ResponsiveDialog> -->
