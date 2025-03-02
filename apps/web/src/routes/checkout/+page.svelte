<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Clock, Loader2, MapPin, Plus, Trash2 } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { form } = $props();

	// Mock data - in real app, this would come from your cart store
	let cart = $state({
		items: [
			{
				id: '1',
				name: 'Jollof Rice',
				price: 15.99,
				quantity: 2,
				image: '/placeholder.svg',
				options: [{ name: 'Extra Spicy', price: 1.0 }]
			},
			{
				id: '2',
				name: 'Chicken Suya',
				price: 12.99,
				quantity: 1,
				image: '/placeholder.svg'
			}
		],
		subtotal: 44.97,
		deliveryFee: 5.0,
		platformFee: 2.5,
		tax: 3.5,
		total: 55.97
	});

	let deliveryAddress = $state({
		name: '',
		street: '',
		city: '',
		state: '',
		zipCode: '',
		phone: '',
		instructions: ''
	});

	let paymentMethod = $state('card');
	let isSubmitting = $state(false);

	function handleQuantityChange(itemId: string, change: number) {
		cart.items = cart.items.map((item) => {
			if (item.id === itemId) {
				const newQuantity = Math.max(1, item.quantity + change);
				return { ...item, quantity: newQuantity };
			}
			return item;
		});
		updateTotals();
	}

	function handleRemoveItem(itemId: string) {
		cart.items = cart.items.filter((item) => item.id !== itemId);
		updateTotals();
	}

	function updateTotals() {
		cart.subtotal = cart.items.reduce((total, item) => {
			const itemTotal = item.price * item.quantity;
			const optionsTotal = item.options?.reduce((sum, opt) => sum + opt.price, 0) || 0;
			return total + itemTotal + optionsTotal * item.quantity;
		}, 0);
		cart.total = cart.subtotal + cart.deliveryFee + cart.platformFee + cart.tax;
	}

	$effect(() => {
		if (form?.error) {
			toast.error(form.error);
		}
	});
</script>

<div class="min-h-screen bg-muted/40 py-8">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Checkout Form -->
			<div class="space-y-6">
				<form
					method="POST"
					class="space-y-6"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result }) => {
							isSubmitting = false;
							if (result.type === 'success' && result.data?.orderId) {
								toast.success('Order placed successfully!');
								goto(`/order/${result.data.orderId}`);
							}
						};
					}}
				>
					<Card class="p-6">
						<h2 class="mb-4 text-2xl font-semibold">Delivery Address</h2>
						<div class="grid gap-4">
							<div class="grid gap-2">
								<Label for="name">Full Name</Label>
								<Input id="name" bind:value={deliveryAddress.name} required />
							</div>
							<div class="grid gap-2">
								<Label for="street">Street Address</Label>
								<Input id="street" bind:value={deliveryAddress.street} required />
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="grid gap-2">
									<Label for="city">City</Label>
									<Input id="city" bind:value={deliveryAddress.city} required />
								</div>
								<div class="grid gap-2">
									<Label for="state">State</Label>
									<Input id="state" bind:value={deliveryAddress.state} required />
								</div>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="grid gap-2">
									<Label for="zipCode">ZIP Code</Label>
									<Input id="zipCode" bind:value={deliveryAddress.zipCode} required />
								</div>
								<div class="grid gap-2">
									<Label for="phone">Phone Number</Label>
									<Input id="phone" bind:value={deliveryAddress.phone} required />
								</div>
							</div>
							<div class="grid gap-2">
								<Label for="instructions">Delivery Instructions (Optional)</Label>
								<Textarea
									id="instructions"
									bind:value={deliveryAddress.instructions}
									placeholder="E.g., Ring the doorbell, call upon arrival, etc."
								/>
							</div>
						</div>
					</Card>

					<Card class="p-6">
						<h2 class="mb-4 text-2xl font-semibold">Payment Method</h2>
						<RadioGroup.Root bind:value={paymentMethod}>
							<div class="flex items-center space-x-2">
								<RadioGroup.Item value="card" id="card" />
								<Label for="card">Card Payment</Label>
							</div>
							<div class="flex items-center space-x-2">
								<RadioGroup.Item value="mobile_money" id="mobile_money" />
								<Label for="mobile_money">Mobile Money</Label>
							</div>
							<div class="flex items-center space-x-2">
								<RadioGroup.Item value="cash" id="cash" />
								<Label for="cash">Cash on Delivery</Label>
							</div>
						</RadioGroup.Root>
					</Card>

					<input type="hidden" name="deliveryAddress" value={JSON.stringify(deliveryAddress)} />
					<input type="hidden" name="paymentMethod" value={paymentMethod} />
					<input
						type="hidden"
						name="items"
						value={JSON.stringify(
							cart.items.map((item) => ({
								id: item.id,
								quantity: item.quantity,
								options: item.options
							}))
						)}
					/>
					<input type="hidden" name="subtotal" value={cart.subtotal} />
					<input type="hidden" name="deliveryFee" value={cart.deliveryFee} />
					<input type="hidden" name="platformFee" value={cart.platformFee} />
					<input type="hidden" name="tax" value={cart.tax} />
					<input type="hidden" name="total" value={cart.total} />

					<Button class="w-full" size="lg" type="submit" disabled={isSubmitting}>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Processing...
						{:else}
							Place Order
						{/if}
					</Button>
				</form>
			</div>

			<!-- Order Summary -->
			<div class="space-y-6">
				<Card class="p-6">
					<h2 class="mb-4 text-2xl font-semibold">Order Summary</h2>
					<div class="space-y-4">
						{#each cart.items as item}
							<div class="flex items-start gap-4">
								<img src={item.image} alt={item.name} class="h-16 w-16 rounded-lg object-cover" />
								<div class="flex-1">
									<h3 class="font-medium">{item.name}</h3>
									{#if item.options}
										<div class="mt-1 text-sm text-muted-foreground">
											{#each item.options as option}
												<div>{option.name} (+{formatCurrency(option.price)})</div>
											{/each}
										</div>
									{/if}
									<div class="mt-2 flex items-center gap-2">
										<Button
											variant="outline"
											size="icon"
											class="h-8 w-8"
											on:click={() => handleQuantityChange(item.id, -1)}
										>
											-
										</Button>
										<span class="w-8 text-center">{item.quantity}</span>
										<Button
											variant="outline"
											size="icon"
											class="h-8 w-8"
											on:click={() => handleQuantityChange(item.id, 1)}
										>
											+
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="ml-2 h-8 w-8 text-destructive"
											on:click={() => handleRemoveItem(item.id)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</div>
								<div class="text-right">
									<div class="font-medium">{formatCurrency(item.price * item.quantity)}</div>
									<div class="text-sm text-muted-foreground">
										{formatCurrency(item.price)} each
									</div>
								</div>
							</div>
							<Separator class="my-4" />
						{/each}

						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Subtotal</span>
								<span>{formatCurrency(cart.subtotal)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Delivery Fee</span>
								<span>{formatCurrency(cart.deliveryFee)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Platform Fee</span>
								<span>{formatCurrency(cart.platformFee)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Tax</span>
								<span>{formatCurrency(cart.tax)}</span>
							</div>
							<Separator />
							<div class="flex justify-between font-medium">
								<span>Total</span>
								<span>{formatCurrency(cart.total)}</span>
							</div>
						</div>

						<div class="mt-4 space-y-2 rounded-lg bg-muted p-4">
							<div class="flex items-center gap-2 text-sm">
								<Clock class="h-4 w-4 text-muted-foreground" />
								<span>Estimated delivery time: 30-45 minutes</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<MapPin class="h-4 w-4 text-muted-foreground" />
								<span>Delivery to your location available</span>
							</div>
						</div>
					</div>
				</Card>

				<div class="text-center text-sm text-muted-foreground">
					By placing your order, you agree to our Terms of Service and Privacy Policy
				</div>
			</div>
		</div>
	</div>
</div>
