<script lang="ts">	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { Bike, Info, Loader2, LocateIcon, MapPin, Minus, Plus, Star, Clock } from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { formatCurrency } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import { deliveryAddressModalState } from '$lib/states/modalState.svelte.js';
	import AddAddressModal from '$lib/components/modal/AddAddressModal.svelte';
	import CartItem from '$lib/components/CartItem.svelte';
	import { client } from '$lib/hc.js';
	import PaystackPop from '@paystack/inline-js';
	import { goto } from '$app/navigation';
	import { activeLocation } from '$lib/states/locationState.svelte.js';
	import ProductModal from '$lib/components/modal/ProductModal.svelte';
	import { getShopOpeningInfo } from '$lib/utils/shop.utils'; // Import the new utility function

	let loading = false;
	let couponCode = '';
	let { data } = $props(); // data no longer includes deliveryFee
	let deliveryNotes = $state('');
	let vendorNotes = $state('');
	let deliveryFee = $state(0); // Use $state again for async updates
	let serviceFee = $state(0);
	console.log('🚀 ~ data:', data.cart);
	// Use isOpen from backend data
	const isOpenNow = $derived(data.cart.shop.isOpen);

	// Get information about when the shop will open today
	const openingInfo = $derived(getShopOpeningInfo(data.cart.shop.operatingHours));

	async function checkOut() {
		if (!activeLocation.current.lat || !activeLocation.current.lng) {
			toast.error('Please set your delivery location first.');
			return;
		}

		loading = true;
		try {
			const res = await client.order.create.$post({
				json: {
					deliveryNotes,
					vendorNotes,
					cartId: data.cart.id,
					userLatitude: activeLocation.current.lat,
					userLongitude: activeLocation.current.lng,
					addressName: activeLocation.current.address
				}
			});

			const responseData = await res.json();
			console.log('🚀 ~ checkOut ~ responseData:', responseData);
			const accessCode = responseData?.data?.paymentInfo?.accessCode;
			if (!res.ok || !accessCode) {
				throw new Error(responseData.error || 'Failed to initialize payment.');
			}

			const popup = new PaystackPop();
			popup.resumeTransaction(accessCode, {
				async onSuccess(transaction) {
					console.log('Transaction successful:', transaction);
					const { reference, status, message, trxref } = transaction;
					toast.success('Payment successful!');
					if (status === 'success') {
						console.log(`Order confirmed with reference: ${reference}`);
						await goto(`/checkout/${data.cart.shop.id}/confirmation/${trxref}`);
					}
				},
				onCancel() {
					console.log('Transaction cancelled');
					toast.error('Payment cancelled!');
				}
			});
		} catch (error: any) {
			console.error('Checkout error:', error);
			toast.error(error.message || 'Checkout failed. Please try again.');
		} finally {
			loading = false;
		}
	}

	// Re-introduce the $effect block to fetch the fee via API call
	$effect(() => {
		async function updateDeliveryFee() {
			const userLat = activeLocation.current.lat; // Use .current
			const userLng = activeLocation.current.lng; // Use .current
			const shopLat = data.cart?.shop?.latitude;
			const shopLng = data.cart?.shop?.longitude;

			if (!userLat || !userLng || !shopLat || !shopLng) {
				deliveryFee = 0;
				return;
			}

			try {
				// Call the backend endpoint using Hono client
				const feeRes = await client['delivery-fee'].$get({
					query: {
						userLat: userLat.toString(),
						userLng: userLng.toString(),
						shopLat: shopLat.toString(),
						shopLng: shopLng.toString()
					}
				}); // No need to pass fetch on client-side

				if (!feeRes.ok) {
					throw new Error('Failed to fetch delivery fee from server.');
				}

				const feeData = await feeRes.json();
				deliveryFee = feeData.data.deliveryFee; // Update state
			} catch (error) {
				console.error('Error fetching delivery fee:', error);
				toast.error('Could not calculate delivery fee.');
				deliveryFee = 0; // Reset fee on error
			}
		}
		updateDeliveryFee();
	});

	let total = $derived(data.cart.subtotal + deliveryFee + serviceFee);
</script>

<!-- <DeliveryAddressModal
	onAddressSelect={(e) => {
		deliveryAddressId = e;
	}}
/> -->
<ProductModal />
<button
	onclick={async () => {
		// Call the test workflow function here
		await client.order.test.$post();
	}}
	>this button is to test the test workflow
</button>
<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8">
		<div class="relative h-64 overflow-hidden rounded-lg">
			<img
				src={data.cart.shop.coverImage ||
					'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg'}
				alt={data.cart.shop.name}
				class="absolute inset-0 h-full w-full object-cover"
			/>
			{#if !isOpenNow}
				<div class="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
					<div class="rounded-xl text-center text-white backdrop-blur-md">
						{#if openingInfo.willOpenToday && openingInfo.opensAt}
							<h2 class="mb-2 text-2xl font-bold">Opens Today at {openingInfo.opensAt}</h2>
							<p class="text-white/80">You can still place your order</p>
						{:else}
							<h2 class="mb-2 text-2xl font-bold">Closed Today</h2>
							<p class="text-white/80">Check our operating hours for other days</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
		<h1 class="mt-4 text-3xl font-bold">Check out of {data.cart.shop.name}</h1>

		<!-- Header Information Section -->
		<div class="mt-4 flex flex-wrap items-center gap-3 text-sm">
			<!-- Rating -->
			<div class="flex items-center">
				<Star class="size-4 text-yellow-500" />
				<span class="ml-1">{data.cart.shop.averageRating || '0.0'}</span>
				<!-- TODO: Replace with dynamic rating -->
			</div>

			<!-- Delivery Info -->
			<div class="flex items-center">
				<div class="flex items-center gap-2">
					<Bike class="size-4 text-primary" />
					{#if data.cart.shop.estimatedTime}
						<span>{data.cart.shop.estimatedTime}</span>
					{:else if data.cart.shop.distance !== undefined}
						<span class="text-gray-600">-- min</span>
					{/if}
				</div>
				{#if data.cart.shop.distance !== undefined}
					<div class="mx-2 flex items-center gap-2">
						<MapPin class="size-4 text-primary" />
						<span>{data.cart.shop.distance} km</span>
					</div>
				{/if}
			</div>

			<!-- Opening Status -->
			<div class="flex items-center">
				<Clock class="mr-1 size-4" />
				{#if openingInfo.isOpenNow}
					<div class="flex items-center">
						<span class="text-green-600">Open</span>
						{#if openingInfo.closesAt}
							<span class="ml-1 text-gray-600">until {openingInfo.closesAt}</span>
						{/if}
					</div>
				{:else}
					<div class="flex items-center">
						<span class="text-red-600">Closed</span>
						{#if openingInfo.willOpenToday && openingInfo.opensAt}
							<span class="ml-1 text-gray-600">Opens at {openingInfo.opensAt}</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Shop Address -->
			{#if data.cart.shop.addressName || data.cart.shop.address}
				<div class="flex items-center gap-2">
					<Info class="size-4" />
					<span class="text-gray-600">
						{data.cart.shop.addressName || data.cart.shop.address}
					</span>
				</div>
			{/if}
		</div>

		<!-- Shop Tags -->
		<div class="mt-3 flex flex-wrap gap-2">
			{#each ['Mediterranean', 'Kebab', 'Halal', 'Falafel'] as tag}
				<!-- TODO: Replace with dynamic tags -->
				<Badge variant="outline" class="rounded-full">
					{tag}
				</Badge>
			{/each}
		</div>

		<!-- Additional Information Box -->
		{#if !openingInfo.isOpenNow}
			<div class="mt-4 rounded-md bg-red-50 p-4">
				<div class="flex items-start">
					<Info class="mt-1 size-5 flex-shrink-0 text-red-500" />
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">Shop is currently closed</h3>
						{#if openingInfo.willOpenToday && openingInfo.opensAt}
							<div class="mt-2 text-sm text-red-700">
								The shop will open today at {openingInfo.opensAt}.
							</div>
						{:else}
							<div class="mt-2 text-sm text-red-700">The shop is closed for the day.</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
	<section>
		<h4 class="font-display text-lg font-semibold tracking-wide md:text-2xl lg:text-3xl">
			Where ?
		</h4>
		<AddAddressModal />

		<div class="mt-4">
			<Card.Root>
				<Card.Content>
					<div class="space-y-4 p-4">
						<div class="flex w-full items-center justify-between rounded border p-3 text-left">
							<div class="flex items-center gap-2">
								<MapPin class="size-5 flex-shrink-0" />
								<div>
									<span class="font-medium">
										{activeLocation.current.name || 'Current Location'}
									</span>
									<span class="block text-sm text-muted-foreground">
										{activeLocation.current.address || 'No address set'}
									</span>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => {
									/* Logic to open location change modal */
								}}>Change</Button
							>
						</div>

						{#if activeLocation.current.lat && activeLocation.current.lng}
							<div class="space-y-2">
								<Label for="courier-note">Add note for the courier</Label>
								<Textarea
									id="courier-note"
									placeholder="Enter any special instructions..."
									class="min-h-[100px] w-full resize-none"
									bind:value={deliveryNotes}
								/>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</section>
	<section
		class="m-auto my-0 flex h-full w-full max-w-6xl flex-col gap-5 px-2 py-5 sm:px-4 md:px-10 md:py-20 lg:flex-row lg:justify-between xl:px-0"
	>
		<div class="flex w-full flex-col gap-10 md:gap-10 lg:gap-20">
			<div class="flex h-[auto] w-full flex-col gap-4 py-4 lg:max-w-[600px]">
				<h4 class="font-display text-lg font-semibold tracking-wide md:text-2xl lg:text-3xl">
					Selected items
				</h4>
				<div>
					{#each data.cart.items as item}
						<CartItem
							id={item.id}
							menuItem={item.menuItem}
							availableOptionGroups={item.availableOptionGroups || []}
							quantity={item.quantity}
							selectedOptions={item.selectedOptions || []}
							specialInstructions={item.specialInstructions}
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
					If you have an <span class="font-display font-medium capitalize text-black">Azumi</span> promo
					code, enter it below to claim your benefits.
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
					<div class="mb-4 flex items-start gap-3 rounded-lg bg-green-100/50 p-4 text-foreground">
						<Info class="mt-1 size-5 flex-shrink-0 text-green-500" />
						<div>
							<p class="font-semibold">Delivery includes PIN confirmation</p>
							<p class="text-sm text-muted-foreground">
								This helps ensure that your order is given to the right person
							</p>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<p class="text-lg font-semibold lg:text-2xl">Prices</p>
					</div>
					<ul class="flex flex-col gap-3 border-b pb-5 pt-2">
						<li class="flex items-center justify-between">
							<p class="text-sm font-medium lg:text-base">
								Subtotal ({data.cart.totalItems} items)
							</p>
							<span class="rounded-md px-2 py-1 text-sm font-medium text-primary lg:text-base">
								{formatCurrency(data.cart.subtotal)}
							</span>
						</li>						<li class="flex items-center justify-between">
							<div class="flex items-center gap-1">
								<p class="text-sm font-medium lg:text-base">Service Fee</p>
								<Popover.Root>
									<Popover.Trigger>
										<Button variant="ghost" size="icon-sm" class="h-5 w-5 rounded-full p-0">
											<Info class="h-4 w-4 text-muted-foreground" />
											<span class="sr-only">Service fee information</span>
										</Button>
									</Popover.Trigger>
									<Popover.Content class="w-80 p-4">
										<div class="space-y-2">
											<h4 class="font-medium leading-none">Service Fee</h4>
											<p class="text-sm text-muted-foreground">
												The service fee helps us maintain the platform and provide customer support.
												This fee supports our operations to ensure a reliable and quality experience for all users.
											</p>
										</div>
									</Popover.Content>
								</Popover.Root>
							</div>
							<span class="rounded-md px-2 py-1 text-sm font-medium text-primary lg:text-base">
								<span class="line-through text-muted-foreground">₦500</span>
								<span class="ml-2 text-green-600">{formatCurrency(serviceFee)}</span>
							</span>
						</li>
						<li class="flex items-center justify-between">
							<p class="text-sm font-medium lg:text-base">Delivery Fee</p>
							<span class="rounded-md px-2 py-1 text-sm font-medium text-primary lg:text-base">
								{formatCurrency(deliveryFee)}
							</span>
						</li>
					</ul>
					<div class="flex items-center justify-between">
						<p class="text-sm font-medium lg:text-base">Total</p>
						<span class="rounded-md px-2 py-1 text-sm font-medium text-primary lg:text-base">
							{formatCurrency(total)}
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
