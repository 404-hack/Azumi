<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Minus, Plus, Trash2 } from 'lucide-svelte';
	import { client } from '$lib/hc';
	import { formatCurrency } from '$lib/utils';
	import { crossfade, scale, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import ProductModal from './modal/ProductModal.svelte';
	import { productModalState, cartSheetState } from '$lib/states/modalState.svelte';
	// Import the necessary types from the refactored modalState
	import type {
		ProductDataForModal,
		CartItemEditContext,
		SelectedCartOption,
		MenuItem, // Assuming MenuItem is defined in modalState or imported elsewhere
		OptionGroup // Assuming OptionGroup is defined in modalState or imported elsewhere
	} from '$lib/states/modalState.svelte.ts';

	// Define CartItemProps based on the data received
	// Ensure it includes all necessary fields for both product display and edit context
	interface CartItemProps {
		id: string; // Cart item ID
		cartId?: string;
		menuItem: MenuItem; // The full menu item details, including available option groups
		// Add availableOptionGroups prop
		availableOptionGroups: OptionGroup[];
		quantity: number;
		specialInstructions?: string;
		selectedOptions: SelectedCartOption[]; // Use the specific type for selected options from cart
		// Add other props passed to CartItem if any (like onQuantityChange, onRemove)
		onQuantityChange?: (newQuantity: number) => void;
		onRemove?: () => void;
	}

	// Destructure props, using menuItem for product details
	let {
		id, // Cart item ID
		cartId,
		menuItem, // Contains name, price, image, description, optionGroups etc.
		// Destructure availableOptionGroups
		availableOptionGroups,
		quantity: initialQuantity,
		specialInstructions = '',
		selectedOptions = [], // Use the correct name and type
		onQuantityChange,
		onRemove
	}: CartItemProps = $props();

	// Add console log to check received selectedOptions
	console.log(`CartItem [${id}] received selectedOptions:`, selectedOptions);

	// Simplified state using a single status variable
	let optimisticQuantity = $derived(initialQuantity);
	let status = $state<'idle' | 'updating' | 'removing'>('idle'); // 'idle', 'updating', 'removing'
	let updateTimeout: NodeJS.Timeout;

	function openProductModal(e?: Event) {
		e?.stopPropagation();
		// Close the current sheet if open
		if (cartSheetState.value) {
			cartSheetState.setFalse();
		}

		// Prepare product data for the modal using the menuItem prop
		// AND the availableOptionGroups prop
		const productDataForModal: ProductDataForModal = {
			...menuItem, // Spread the base menuItem details
			// Explicitly add the available option groups
			optionGroups: availableOptionGroups
		};

		// Prepare edit context for the modal
		const editContextForModal: CartItemEditContext = {
			cartItemId: id, // The ID of the cart item itself
			initialQuantity: optimisticQuantity,
			initialSpecialInstructions: specialInstructions,
			initialSelectedOptions: selectedOptions // Pass the selected options directly
		};
		setTimeout(() => {
			// Call the new openModal method with both product data and edit context
			productModalState.openModal(productDataForModal, editContextForModal);
		}, 0); // Delay in milliseconds (e.g., 150ms)
	}

	// Calculate total price including options
	const totalOptionPrice = $derived(
		selectedOptions.reduce((total, opt) => total + opt.option.price * opt.quantity, 0)
	);

	// Use menuItem.price as the base price
	const totalPrice = $derived((menuItem.price + totalOptionPrice) * optimisticQuantity);

	// Debounced update function
	async function debouncedUpdate(newQuantity: number) {
		clearTimeout(updateTimeout);

		// Prevent updates if not idle or quantity is invalid
		if (status !== 'idle' || newQuantity < 1) {
			return; // Don't proceed if busy or quantity is zero/negative
		}

		const originalQuantity = optimisticQuantity;
		optimisticQuantity = newQuantity; // Optimistic UI update

		updateTimeout = setTimeout(async () => {
			// Set status to prevent concurrent operations during the actual network request
			status = 'updating';
			try {
				const response = await client.cart.items[':itemId'].$patch({
					param: { itemId: id },
					json: { quantity: newQuantity }
				});

				if (!response.ok) throw new Error('Failed to update quantity');

				onQuantityChange?.(newQuantity);
				await invalidateAll(); // Refresh data
				// Successful update, status reset in finally
			} catch (error) {
				console.error('Error updating quantity:', error);
				optimisticQuantity = originalQuantity; // Revert optimistic update on failure
				toast.error('Failed to update quantity');
				// Status reset in finally
			} finally {
				status = 'idle'; // Reset status after operation completes or fails
			}
		}, 500); // 500ms debounce
	}

	async function handleRemove() {
		if (status !== 'idle') return; // Don't remove if already busy

		// Set status to prevent concurrent operations
		status = 'removing';
		try {
			const response = await client.cart.items[':itemId'].$delete({
				param: { itemId: id }
			});

			if (!response.ok) throw new Error('Failed to remove item');

			onRemove?.(); // Notify parent
			await invalidateAll(); // Refresh data (might cause this component to unmount)
			toast.success('Item removed from cart');
			// If invalidateAll causes unmount, status reset might not run, which is okay.
		} catch (error) {
			console.error('Error removing item:', error);
			toast.error('Failed to remove item');
			status = 'idle'; // Reset status on error
		} finally {
			// Ensure status resets ONLY if it's still 'removing'
			// (covers cases where invalidateAll didn't unmount)
			if (status === 'removing') {
				status = 'idle';
			}
		}
	}

	// Animation setup
	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicOut,
		fallback: (node) => scale(node, { start: 0.95, opacity: 0, duration: 150 })
	});
</script>

<div class="overflow-hidden border-b p-4" in:receive={{ key: id }} out:send={{ key: id }}>
	<div class="relative flex flex-col gap-4 sm:flex-row">
		<div class="relative">
			<img
				src={menuItem.image || 'https://placehold.co/400x300?text=No+Image'}
				alt={menuItem.name}
				transition:fade={{ duration: 200 }}
				class="h-16 w-16 rounded-lg object-cover object-center"
			/>
		</div>
		<!-- Only make the content area clickable, not the entire item -->
		<div class="min-w-0 flex-1">
			<div class="flex items-start justify-between">
				<h3 class="truncate text-base font-medium">{menuItem.name}</h3>
				<!-- Use menuItem.name -->
				<p class="text-sm font-medium">{formatCurrency(totalPrice)}</p>
			</div>
			<p class="text-sm text-gray-600">{formatCurrency(menuItem.price)} × {optimisticQuantity}</p>
			<!-- Use menuItem.price -->
		</div>
		<!-- Simplified controls container -->
		<div class="flex items-center gap-2">
			<!-- Always visible quantity controls -->
			<div class="flex h-8 items-center rounded-md border bg-background">
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 rounded-r-none border-r"
					disabled={status !== 'idle' || optimisticQuantity <= 1}
					onclick={() => debouncedUpdate(optimisticQuantity - 1)}
				>
					<Minus class="h-3.5 w-3.5" />
				</Button>

				<span class="grid h-8 w-10 place-items-center border-r text-sm font-medium">
					{optimisticQuantity}
				</span>

				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 rounded-l-none"
					disabled={status !== 'idle'}
					onclick={() => debouncedUpdate(optimisticQuantity + 1)}
				>
					<Plus class="h-3.5 w-3.5" />
				</Button>
			</div>

			<Button
				variant="destructive"
				size="icon"
				class="ml-auto h-8 w-8"
				disabled={status !== 'idle'}
				onclick={handleRemove}
			>
				<Trash2 class="h-3.5 w-3.5" />
			</Button>
		</div>
	</div>
	<!-- Show selected options with improved styling -->
	{#if selectedOptions?.length > 0}
		<!-- Use selectedOptions -->
		<div class="mt-2 rounded-md bg-gray-50 p-2">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium text-gray-700">Selected Options:</p>
				<!-- Removed Edit Options button from here -->
			</div>
			<div class="mt-1 space-y-1.5">
				{#each selectedOptions as { option, optionGroup, quantity }}
					<!-- Use selectedOptions -->
					<div class="flex items-center justify-between text-xs">
						<div class="flex items-center gap-1">
							{#if optionGroup?.name}<span class="text-primary-600 font-medium"
									>{optionGroup.name}:</span
								>{/if}
							<span class="text-gray-700">{option.name}</span>
							{#if quantity > 1}
								<span class="text-gray-500">× {quantity}</span>
							{/if}
						</div>
						{#if option.price > 0}
							<span class="font-medium text-gray-700">
								+{formatCurrency(option.price * quantity)}
								<!-- Show total price for this option -->
							</span>
						{/if}
					</div>
				{/each}
			</div>
			<!-- Moved Edit Options button here -->
			<button
				class="mt-2 w-full rounded bg-primary/10 px-3 py-1.5 text-center text-xs font-medium text-primary hover:bg-primary/20"
				onclick={openProductModal}
			>
				Edit Options
			</button>
		</div>
	{/if}

	{#if specialInstructions}
		<div class="mt-2 rounded-md bg-amber-50 p-2 text-xs">
			<div class="flex items-center justify-between">
				<p class="font-medium text-amber-700">Notes:</p>
				<!-- Removed Edit Notes button from here -->
			</div>
			<p class="mt-1 text-amber-800">{specialInstructions}</p>
			<!-- Moved Edit Notes button here -->
			<button
				class="mt-2 w-full rounded bg-amber-100 px-3 py-1.5 text-center text-xs font-medium text-amber-700 hover:bg-amber-200"
				onclick={openProductModal}
			>
				Edit Notes
			</button>
		</div>
	{/if}
</div>
<!-- <ProductModal /> -->
