<script lang="ts">
	import {
		ShoppingBasket,
		Minus,
		Plus,
		X,
		ChevronDown,
		ChevronUp,
		Trash2,
		PlusCircle
	} from 'lucide-svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { cartsSheetStore } from '$lib/states/modalState.svelte';
	import { Button } from '$lib/components/ui/button';
	import { formatCurrency } from '$lib/utils';
	import * as Sheet from '$lib/components/ui/sheet';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { client } from '$lib/hc';

	// Types for carts data from the server
	type MenuItemOption = {
		id: string;
		cartItemId: string;
		optionGroupId: string;
		optionId: string;
		price: number;
		quantity: number;
	};

	type MenuItem = {
		id: string;
		categoryId: string;
		description: string;
		image: string | null;
		inStock: boolean;
		name: string;
		price: number;
		priceDescription: string;
	};

	type CartItem = {
		id: string;
		cartId: string;
		menuItemId: string;
		menuItem: MenuItem;
		quantity: number;
		specialInstructions: string | null;
		totalPrice: number;
		options: MenuItemOption[];
	};

	type Shop = {
		id: string;
		name: string;
		logo: string | null;
		slug: string;
	};

	type Cart = {
		id: string;
		customerId: string;
		shopId: string;
		status: string;
		items: CartItem[];
		shop: Shop;
		createdAt: string;
		updatedAt: string;
		subtotal: number;
		totalItems: number;
	};

	// Get carts directly from page data
	let carts = $derived<Cart[]>(page.data.carts || []);

	// Track the expansion state of shop sections
	let expandedRestaurants = $state<Record<string, boolean>>({});

	// Initialize expanded state for all restaurants
	$effect(() => {
		if (carts.length > 0) {
			carts.forEach((cart) => {
				expandedRestaurants[cart.id] = true;
			});
		}
	});

	// Track loading states with individual boolean flags
	let updatingItems = $state<Record<string, boolean>>({});
	let removingItems = $state<Record<string, boolean>>({});
	let clearingCarts = $state<Record<string, boolean>>({});

	// Store pending updates for optimistic UI
	let pendingUpdates = $state<Record<string, number>>({});

	// Derived values
	let hasItems = $derived(carts.length > 0 && carts.some((cart) => cart.items.length > 0));

	// Helper functions for checking loading states
	function isUpdating(itemId: string): boolean {
		return !!updatingItems[itemId];
	}

	function isRemoving(itemId: string): boolean {
		return !!removingItems[itemId];
	}

	function isClearing(cartId: string): boolean {
		return !!clearingCarts[cartId];
	}

	// Toggle expansion state for a shop section
	function toggleRestaurantExpanded(cartId: string): void {
		expandedRestaurants[cartId] = !expandedRestaurants[cartId];
	}

	// Get display quantity - showing either the actual quantity or pending update
	function getDisplayQuantity(itemId: string, currentQuantity: number): number {
		return pendingUpdates[itemId] !== undefined ? pendingUpdates[itemId] : currentQuantity;
	}

	// Calculate cart subtotal for a shop
	function getCartSubtotal(cart: Cart): number {
		return cart.subtotal || cart.items.reduce((total, item) => total + item.totalPrice, 0);
	}

	// Get cart total across all restaurants
	function getCartTotal(): number {
		return carts.reduce((total, cart) => total + getCartSubtotal(cart), 0);
	}

	/**
	 * Update item quantity without optimistic updates to avoid UI issues
	 */
	async function updateQuantity(
		cartId: string,
		itemId: string,
		change: number,
		currentQuantity: number
	): Promise<void> {
		// Calculate new quantity (minimum 1) based on actual current quantity, not display quantity
		const newQuantity = Math.max(1, currentQuantity + change);

		// Don't make API call if quantity didn't change
		if (newQuantity === currentQuantity) return;

		// If new quantity becomes 0, redirect to remove item
		if (newQuantity === 0) {
			return removeItem(cartId, itemId);
		}

		// If already updating, don't start another update
		if (isUpdating(itemId)) {
			console.log('Already updating item:', itemId);
			return;
		}

		// Set loading state before try block to ensure it's set
		updatingItems[itemId] = true;

		try {
			// Call the API to update quantity
			const response = await client.cart.items[':itemId'].$patch({
				param: { itemId },
				json: { quantity: newQuantity }
			});

			if (!response.ok) {
				throw new Error(`Failed to update item quantity: ${response.statusText}`);
			}

			// Refresh data after successful update
			await invalidateAll();

			// Find item name for the toast message
			const cart = carts.find((c) => c.id === cartId);
			const item = cart?.items.find((i) => i.id === itemId);
			const itemName = item?.menuItem.name || 'Item';

			toast(currentQuantity < newQuantity ? 'Item added' : 'Item quantity updated', {
				description: `${itemName} quantity ${
					currentQuantity < newQuantity ? 'increased' : 'decreased'
				} to ${newQuantity}`
			});
		} catch (error) {
			console.error('Error updating cart item quantity:', error);
			toast.error('Failed to update quantity', {
				description: 'Please try again later'
			});
		} finally {
			// Always clear loading state to ensure it's removed after operation
			console.log('Clearing loading state for item:', itemId);
			updatingItems[itemId] = false;
		}
	}

	/**
	 * Increment item quantity
	 */
	function incrementQuantity(cartId: string, itemId: string, currentQuantity: number): void {
		// Prevent multiple clicks while loading
		if (isUpdating(itemId)) {
			console.log('Skipping increment - already updating:', itemId);
			return;
		}
		updateQuantity(cartId, itemId, 1, currentQuantity);
	}

	/**
	 * Decrement item quantity
	 */
	function decrementQuantity(cartId: string, itemId: string, currentQuantity: number): void {
		// Prevent multiple clicks while loading
		if (isUpdating(itemId)) {
			console.log('Skipping decrement - already updating:', itemId);
			return;
		}
		updateQuantity(cartId, itemId, -1, currentQuantity);
	}

	/**
	 * Remove item from cart
	 */
	async function removeItem(cartId: string, itemId: string): Promise<void> {
		// Find the current item for notification
		const cart = carts.find((c) => c.id === cartId);
		const item = cart?.items.find((i) => i.id === itemId);
		if (!item) return;

		const itemName = item.menuItem.name;

		// If already removing, don't start another removal
		if (isRemoving(itemId)) return;

		try {
			// Set loading state
			removingItems[itemId] = true;

			// Call the API to remove item
			// The backend will automatically delete empty carts
			const response = await client.cart.items[':itemId'].$delete({
				param: { itemId }
			});

			if (!response.ok) {
				throw new Error(`Failed to remove item: ${response.statusText}`);
			}

			// Refresh data after successful deletion
			await invalidateAll();

			toast.success('Item removed', {
				description: `${itemName} has been removed from your cart`
			});
		} catch (error) {
			console.error('Error removing cart item:', error);
			toast.error('Failed to remove item', {
				description: 'Please try again later'
			});
		} finally {
			// Always clear loading state to ensure it's removed after operation
			removingItems[itemId] = false;
		}
	}

	/**
	 * Clear entire cart for a shop
	 */
	async function clearCart(cartId: string): Promise<void> {
		// Find shop for notification
		const cart = carts.find((c) => c.id === cartId);
		if (!cart) return;

		const restaurantName = cart.shop.name;

		// If already clearing, don't start another clear operation
		if (isClearing(cartId)) return;

		try {
			// Set loading state
			clearingCarts[cartId] = true;

			// Call the API to clear cart
			const response = await client.cart[':cartId'].$delete({
				param: { cartId }
			});

			if (!response.ok) {
				throw new Error(`Failed to clear cart: ${response.statusText}`);
			}

			// Refresh data after successful deletion
			await invalidateAll();

			toast('Cart cleared', {
				description: `All items from ${restaurantName} have been removed`
			});
		} catch (error) {
			console.error('Error clearing cart:', error);
			toast.error('Failed to clear cart', {
				description: 'Please try again later'
			});
		} finally {
			// Always clear loading state to ensure it's removed after operation
			clearingCarts[cartId] = false;
		}
	}

	/**
	 * Format options for display
	 */
	function formatOptions(options: MenuItemOption[]): string {
		if (!options || options.length === 0) return '';
		return options.map((option) => `+${option.quantity} option`).join(', ');
	}

	/**
	 * Proceed to checkout for a specific shop
	 */
	function checkoutShop(shopId: string): void {
		goto(`/checkout?shopId=${shopId}`);
		cartsSheetStore.setFalse();
	}

	/**
	 * Navigate to shop page to add more items
	 */
	function addMoreItems(slug: string): void {
		goto(`/restaurant/${slug}`);
		cartsSheetStore.setFalse();
	}

	/**
	 * Get image URL with fallback
	 */
	function getImageUrl(url: string | null): string {
		return url || 'https://placehold.co/400x300?text=No+Image';
	}
</script>

<Sheet.Root bind:open={cartsSheetStore.value}>
	<Sheet.Content class="w-full overflow-y-auto rounded-s-lg p-4 pt-10 sm:max-w-lg">
		<Sheet.Header>
			<Sheet.Title class="mb-5 text-3xl font-bold">Your Cart</Sheet.Title>
		</Sheet.Header>

		<Tabs.Root value="shoppingCart" class="w-full">
			<Tabs.List class="mb-4 grid w-full grid-cols-1">
				<Tabs.Trigger value="shoppingCart">Shopping Cart</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="shoppingCart">
				{#if hasItems}
					<div class="flex flex-col gap-5">
						<!-- Shop Cards -->
						{#each carts as cart (cart.id)}
							<div class="rounded-lg border shadow">
								<Collapsible.Root
									open={expandedRestaurants[cart.id] ?? true}
									onOpenChange={(open) => (expandedRestaurants[cart.id] = open)}
								>
									<div class="border-b p-4">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-3">
												<img
													src={getImageUrl(cart.shop.logo)}
													alt={cart.shop.name}
													class="h-14 w-14 rounded-lg object-cover shadow"
												/>
												<div>
													<h3 class="font-medium">{cart.shop.name}</h3>
												</div>
											</div>
											<div class="flex items-center gap-2">
												<span class="font-medium">{formatCurrency(getCartSubtotal(cart))}</span>
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8 text-red-500"
													aria-label="Clear cart"
													disabled={isClearing(cart.id)}
													onclick={() => clearCart(cart.id)}
												>
													{#if isClearing(cart.id)}
														<span class="inline-block animate-spin">⟳</span>
													{:else}
														<Trash2 class="size-4" />
													{/if}
												</Button>
												<Collapsible.Trigger>
													<Button
														variant="ghost"
														size="icon"
														class="h-8 w-8"
														aria-label={expandedRestaurants[cart.id]
															? 'Hide details'
															: 'Show details'}
													>
														{#if expandedRestaurants[cart.id]}
															<ChevronUp class="size-4" />
														{:else}
															<ChevronDown class="size-4" />
														{/if}
													</Button>
												</Collapsible.Trigger>
											</div>
										</div>
									</div>

									<Collapsible.Content>
										<div class="divide-y p-2">
											{#each cart.items as item (item.id)}
												<div class="flex items-center justify-between py-3">
													<div class="flex items-center gap-3">
														<img
															src={getImageUrl(item.menuItem.image)}
															alt={item.menuItem.name}
															class="size-12 rounded-md object-cover shadow-sm"
														/>
														<div>
															<p class="text-sm font-medium">{item.menuItem.name}</p>
															<p class="text-xs text-gray-600">
																{formatCurrency(item.menuItem.price)}
															</p>
															{#if item.options && item.options.length > 0}
																<p class="text-xs text-gray-500">{formatOptions(item.options)}</p>
															{/if}
															<p class="text-xs font-medium text-gray-700">
																Subtotal: {formatCurrency(item.totalPrice)}
															</p>
														</div>
													</div>

													<div class="flex items-center gap-2">
														<div class="flex items-center rounded-md border">
															<button
																class="p-1"
																disabled={isUpdating(item.id) ||
																	getDisplayQuantity(item.id, item.quantity) <= 1}
																onclick={() => decrementQuantity(cart.id, item.id, item.quantity)}
																aria-label="Decrease quantity"
															>
																<Minus
																	class={isUpdating(item.id) ? 'size-4 opacity-50' : 'size-4'}
																/>
															</button>
															<span class="px-2 text-sm">
																{#if isUpdating(item.id)}
																	<span class="inline-block w-4 animate-pulse text-center">...</span
																	>
																{:else}
																	{getDisplayQuantity(item.id, item.quantity)}
																{/if}
															</span>
															<button
																class="p-1"
																disabled={isUpdating(item.id)}
																onclick={() => incrementQuantity(cart.id, item.id, item.quantity)}
																aria-label="Increase quantity"
															>
																<Plus
																	class={isUpdating(item.id) ? 'size-4 opacity-50' : 'size-4'}
																/>
															</button>
														</div>
														<button
															class="ml-1 p-1 text-gray-500 hover:text-red-500"
															disabled={isRemoving(item.id)}
															onclick={() => removeItem(cart.id, item.id)}
															aria-label="Remove item"
														>
															{#if isRemoving(item.id)}
																<span class="inline-block h-4 w-4 animate-spin">⟳</span>
															{:else}
																<X class="size-4" />
															{/if}
														</button>
													</div>
												</div>
											{/each}

											<div class="flex justify-between py-4">
												<Button
													variant="outline"
													class="flex items-center gap-1"
													onclick={() => addMoreItems(cart.shop.slug)}
												>
													<PlusCircle class="size-4" />
													Add more items
												</Button>

												<Button variant="default" onclick={() => checkoutShop(cart.shopId)}>
													Checkout ({formatCurrency(getCartSubtotal(cart))})
												</Button>
											</div>
										</div>
									</Collapsible.Content>
								</Collapsible.Root>
							</div>
						{/each}

						<!-- Cart Summary -->
						<div class="mt-4 rounded-lg border p-4 shadow">
							<h3 class="mb-3 font-medium">Order Summary</h3>
							<div class="flex justify-between pt-2 text-base font-medium">
								<span>Total</span>
								<span>{formatCurrency(getCartTotal())}</span>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-10 text-center">
						<ShoppingBasket class="mb-3 size-12 text-gray-400" />
						<h3 class="mb-1 text-lg font-medium">Your cart is empty</h3>
						<p class="mb-4 text-sm text-gray-500">Add items from a shop to get started</p>
						<Button variant="default" onclick={() => goto('/restaurants')}
							>Browse restaurants</Button
						>
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</Sheet.Content>
</Sheet.Root>
