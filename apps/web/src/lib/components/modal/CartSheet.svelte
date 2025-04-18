<script lang="ts">
	import type { Cart } from '$lib/types/cart';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import { ShoppingBag, ShoppingCart } from 'lucide-svelte';
	import { cart } from '$lib/store/cartStore.svelte';
	import CartItem from '../CartItem.svelte';
	import { formatCurrency } from '$lib/utils';
	import { cartSheetState } from '$lib/states/modalState.svelte';

	let { shopCart } = $props<{ shopCart: Cart }>();

	// Derive cart item count from shopCart
	const cartItemCount = $derived(shopCart?.totalItems || 0);

	// Optimistic updates tracking
	let optimisticTotals = $state({
		items: shopCart?.totalItems || 0,
		subtotal: shopCart?.subtotal || 0
	});

	// Use optimisticTotals.items instead of cartItemCount for real-time updates
	const displayItemCount = $derived(optimisticTotals.items);

	function handleQuantityChange(itemId: string, newQuantity: number, price: number) {
		const item = shopCart?.items.find((i) => i.id === itemId);
		if (!item) return;

		const diff = newQuantity - item.quantity;
		optimisticTotals.items += diff;
		optimisticTotals.subtotal += diff * price;
	}

	function handleItemRemove(itemId: string) {
		const item = shopCart?.items.find((i) => i.id === itemId);
		if (!item) return;

		optimisticTotals.items -= item.quantity;
		optimisticTotals.subtotal -= item.totalPrice;
	}
</script>

<Sheet.Root bind:open={cartSheetState.value}>
	<Sheet.Content class="w-full overflow-y-auto rounded-s-lg p-4 pt-10 sm:max-w-lg">
		<Sheet.Header>
			<Sheet.Title class="flex items-center gap-2">
				<ShoppingBag class="h-5 w-5" />
				Your Orders
			</Sheet.Title>
			<Sheet.Description>Review your items before checking out</Sheet.Description>
		</Sheet.Header>

		<div class="mt-8 flex-1 overflow-y-auto">
			{#if shopCart?.items?.length > 0}
				<div class="space-y-4">
					{#each shopCart.items as item (item.id)}
						<CartItem
							id={item.id}
							cartId={shopCart.id}
							name={item.menuItem.name}
							price={item.menuItem.price}
							quantity={item.quantity}
							image={item.menuItem.image}
							specialInstructions={item.specialInstructions}
							onQuantityChange={(newQty) =>
								handleQuantityChange(item.id, newQty, item.menuItem.price)}
							onRemove={() => handleItemRemove(item.id)}
						/>
					{/each}
				</div>

				<div class="mt-6 border-t pt-4">
					<div class="flex items-center justify-between py-4">
						<span class="text-lg font-medium">Total</span>
						<span class="text-lg font-bold">
							{formatCurrency(optimisticTotals.subtotal)}
						</span>
					</div>

					<Sheet.Close>
						<Button class="w-full" href="/checkout">Proceed to Checkout</Button>
					</Sheet.Close>
				</div>
			{:else}
				<div class="py-8 text-center text-gray-500">
					<ShoppingCart class="mx-auto mb-4 h-12 w-12 opacity-50" />
					<p>Your cart is empty</p>
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
