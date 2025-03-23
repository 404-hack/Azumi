<script lang="ts">
	// import DeliveryTypeModal from '$lib/components/modals/DeliveryTypeModal.svelte';
	// import PaymentMethodModal from '$lib/components/modals/PaymentMethodModal.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import {
		Bike,
		ChevronLeft,
		ChevronRight,
		CreditCard,
		Loader2,
		LocateIcon,
		MapPin,
		Minus,
		Plus
	} from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	// import GuestContact from './components/GuestContact.svelte';
	// import GuestShippingInformation from './components/GuestShippingInformation.svelte';
	import { formatCurrency } from '$lib/utils';
	// import OrderList from '$lib/components/OrderList.svelte';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		addAddressModalState,
		deliveryAddressModalState
	} from '$lib/states/modalState.svelte.js';
	import AddAddressModal from '$lib/components/modal/AddAddressModal.svelte';
	import DeliveryAddressModal from '$lib/components/modal/DeliveryAddressModal.svelte';
	import CartItem from '$lib/components/CartItem.svelte';

	let loading = false;
	let shippingMethodId = 'standard-shipping';
	let couponCode = '';
	let { data } = $props();
	let deliveryAddressId = $state(data.defaultAddress.id);
	let deliveryNotes = $state('');
	let vendorNotes = $state('');
	console.log('🚀 ~ data:', data.cart);

	// let contactForm: GuestContact;
	// let shippingForm: GuestShippingInformation;

	const shippingMethods = [
		{
			id: 'standard-shipping',
			name: 'Standard Shipping',
			price: 5.99
		},
		{
			id: 'express-shipping',
			name: 'Express Shipping',
			price: 12.99
		}
	];

	const mockOrder = {
		lines: [
			{
				id: 1,
				name: 'Kebab Wrap',
				quantity: 2,
				price: 8.99
			},
			{
				id: 2,
				name: 'Falafel Plate',
				quantity: 1,
				price: 12.99
			}
		],
		subTotalWithTax: 30.97,
		currencyCode: 'EUR'
	};

	async function checkOut() {
		loading = true;
		await new Promise((resolve) => setTimeout(resolve, 1500));
		loading = false;
		toast.success('Order placed successfully!');
	}
</script>

<DeliveryAddressModal
	onAddressSelect={(e) => {
		deliveryAddressId = e;
	}}
/>
<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8">
		<div class="relative h-64 overflow-hidden rounded-lg">
			<img
				src="https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg"
				alt="Kebab Royal"
				class="absolute inset-0 h-full w-full object-cover"
			/>
		</div>
		<h1 class="mt-4 text-3xl font-bold">Check out of {data.cart.shop.name}</h1>
		<p class="mt-2 text-gray-600">
			{data.cart.shop.description}
		</p>
		<div class="mt-4 flex items-center text-xs">
			<span class="text-yellow-500">★</span>
			<span class="ml-1">4.8</span>
			<span class="mx-2">•</span>
			<div class="flex items-center gap-1">
				<Bike class="size-4" />
				<span>25-35 min</span>
			</div>
			<span class="mx-2">•</span>
			<span> Open until 21:30 </span>
		</div>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each ['Mediterranean', 'Kebab', 'Halal', 'Falafel'] as tag}
				<span class="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
					{tag}
				</span>
			{/each}
		</div>
	</div>
	<section>
		<h4 class="font-display text-lg font-semibold tracking-wide md:text-2xl lg:text-3xl">
			Where ?
		</h4>
		<AddAddressModal />

		<div class="mt-4">
			<Card.Root>
				<Card.Content>
					<div class="space-y-4">
						<button
							onclick={() => {
								deliveryAddressModalState.setTrue();
							}}
							class="flex items-center justify-between"
						>
							<div class="flex items-center gap-2">
								<MapPin class="size-5" />
								<span>Other</span>
								<span class="text-sm text-muted-foreground">{data.defaultAddress.address}</span>
							</div>
							<ChevronRight class="size-5" />
						</button>

						<div class="space-y-2">
							<Label for="courier-note">Add note for the courier</Label>
							<Textarea
								id="courier-note"
								placeholder="Enter any special instructions..."
								class="min-h-[100px] w-full resize-none"
								bind:value={deliveryNotes}
							/>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</section>
	<section
		class="m-auto my-0 flex h-full w-full max-w-6xl flex-col gap-5 px-2 py-5 sm:px-4 md:px-10 md:py-20 lg:flex-row lg:justify-between xl:px-0"
	>
		<div class="flex w-full flex-col gap-10 md:gap-10 lg:gap-20">
			<RadioGroup.Root bind:value={shippingMethodId} class="gap-5 md:gap-10">
				{#each shippingMethods as method}
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value={method.id} id={method.id} />
						<Label for={method.id}>
							{method.name}
							<span class="text-muted-foreground">{formatCurrency(method.price)}</span>
						</Label>
					</div>
				{/each}
			</RadioGroup.Root>

			<div class="flex h-[auto] w-full flex-col gap-4 py-4 lg:max-w-[600px]">
				<h4 class="font-display text-lg font-semibold tracking-wide md:text-2xl lg:text-3xl">
					Selected items
				</h4>
				<div>
					{#each data.cart.items as item}
						<CartItem
							image="/shop.avif"
							id={item.menuItemId}
							name={item.menuItem.name}
							price={item.menuItem.price}
							quantity={item.quantity}
						/>
					{/each}
				</div>

				<div class="mt-4 space-y-2">
					<Label for="vendor-note">Instructions for the vendor</Label>
					<Textarea
						id="vendor-note"
						placeholder="Special preparation requests, allergies, preferences..."
						class="min-h-[100px] w-full resize-none border-2"
						bind:value={vendorNotes}
					/>
				</div>

				<div>
					<Button variant="secondary" href="/restaurant/{data.cart.shop.slug}"
						>Add more items</Button
					>
				</div>
			</div>

			<div>
				<h4 class="font-display text-lg font-semibold tracking-wide md:text-2xl lg:text-3xl">
					Promo code
				</h4>
				<p class="mb-2 mt-4 text-sm text-muted-foreground md:mb-4 md:mt-8">
					If you have an <span class="font-display font-medium capitalize text-black"
						>african market online</span
					> promo code, enter it below to claim your benefits.
				</p>
				<form
					class="flex w-full items-center rounded-md border-2 bg-white px-3 text-foreground focus-within:ring-2 focus-within:ring-primary md:max-w-lg"
				>
					<input
						type="text"
						bind:value={couponCode}
						name="myInput"
						required
						minlength="3"
						placeholder="Enter Promo Code"
						class="h-14 w-full flex-1 outline-none"
					/>
					<Button type="submit">Submit</Button>
				</form>
			</div>
		</div>

		<div class="relative z-10 mb-5 w-full lg:mt-[-7.5rem] lg:max-w-[400px]">
			<div class="left-0 top-[1rem] flex w-full flex-col lg:sticky">
				<div
					class="flex flex-col gap-4 rounded border border-[#2021251f] bg-card p-3 lg:p-[1.5rem] lg:shadow-lg"
				>
					<div class="flex items-center justify-between">
						<p class="text-lg font-semibold lg:text-2xl">Prices in EUR, incl. taxes</p>
					</div>
					<ul class="flex flex-col gap-3 border-b pb-5 pt-2">
						<li class="flex items-center justify-between">
							<p class="text-sm font-medium lg:text-base">
								Item subtotal ({data.cart.totalItems} items)
							</p>
							<span class="rounded-md px-2 py-1 text-sm font-medium text-primary lg:text-base">
								{formatCurrency(data.cart.subtotal)}
							</span>
						</li>
						<li class="flex items-center justify-between">
							<p class="text-sm font-medium lg:text-base">
								Delivery ({shippingMethods.find((m) => m.id === shippingMethodId)?.name})
							</p>
							<span class="rounded-md px-2 py-1 text-sm font-medium text-primary lg:text-base">
								{formatCurrency(
									shippingMethods.find((m) => m.id === shippingMethodId)?.price || 0,
									mockOrder.currencyCode
								)}
							</span>
						</li>
					</ul>
					<div class="flex items-center justify-between">
						<p class="text-sm font-medium lg:text-base">Total</p>
						<span class="rounded-md px-2 py-1 text-sm font-medium text-primary lg:text-base">
							{formatCurrency(
								mockOrder.subTotalWithTax +
									(shippingMethods.find((m) => m.id === shippingMethodId)?.price || 0),
								mockOrder.currencyCode
							)}
						</span>
					</div>
					<Button onclick={checkOut} class="w-full">
						{#if loading}
							<Loader2 class="h-6 w-6 animate-spin " />
						{:else}
							Proceed To Make Payment
						{/if}
					</Button>
				</div>
			</div>
		</div>
	</section>
</main>
