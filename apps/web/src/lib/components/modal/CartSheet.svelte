<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import { ShoppingBag, ShoppingCart } from 'lucide-svelte';
	import { cart } from '$lib/store/cartStore.svelte';
	import CartItem from '../CartItem.svelte';
	import { formatCurrency } from '$lib/utils';
</script>

<!-- Cart Trigger Button -->

<!-- Cart Sheet -->
<Sheet.Root open={cart.isOpen} onOpenChange={() => cart.toggleCart()}>
	<Sheet.Trigger>
		<Button variant="outline" size="icon" onclick={cart.toggleCart} class="relative">
			<ShoppingCart class="h-5 w-5" />
			<span
				class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
			>
				3
			</span>
		</Button>
	</Sheet.Trigger>
	<Sheet.Content class="w-full sm:max-w-lg">
		<Sheet.Header>
			<Sheet.Title class="flex items-center gap-2">
				<ShoppingBag class="h-5 w-5" />
				Your Orders
			</Sheet.Title>
			<Sheet.Description>Review your items before checking out</Sheet.Description>
		</Sheet.Header>

		<div class="mt-8 flex-1 overflow-y-auto">
			<CartItem id="1" name="Spicy Tuna Roll" price={12.99} quantity={2} />
			<CartItem id="2" name="California Roll" price={9.99} quantity={1} />
			<CartItem id="3" name="Dragon Roll" price={14.99} quantity={1} />
		</div>

		<div class="border-t pt-4">
			<div class="flex items-center justify-between py-4">
				<span class="text-lg font-medium">Total</span>
				<span class="text-lg font-bold">{formatCurrency(50.96)}</span>
			</div>

			<Sheet.Close>
				<Button class="w-full" href="/checkout">Proceed to Checkout</Button>
			</Sheet.Close>
		</div>
	</Sheet.Content>
</Sheet.Root>
