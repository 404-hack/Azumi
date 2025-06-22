<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import NumberFlow from '@number-flow/svelte';
	import {
		productModalState,
		type OptionGroup,
		type OptionItem
	} from '$lib/states/modalState.svelte';
	import { Minus, Plus, Star, ChevronDown, ChevronUp } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { blur } from 'svelte/transition';
	import { Separator } from '$lib/components/ui/separator';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { AlertCircle } from 'lucide-svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import Badge from '../ui/badge/badge.svelte';
	import { formatCurrency } from '$lib/utils';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import type { Cart } from '$lib/types/cart';
	import { authClient } from '$lib/auth-client';
	import { loginModalState } from '$lib/states/modalState.svelte';

	const isDesktop = new MediaQuery('(min-width: 768px)');
	let quantity = $state(1);
	let isLoading = $state(false);
	let specialInstructions = $state('');
	let isDescriptionExpanded = $state(false);
	const MAX_DESCRIPTION_LENGTH = 80;

	// Auth session
	const session = authClient.useSession();
	console.log('🚀 ~ session:', $session);

	// Props
	let { cart = null } = $props();

	// For option groups and option selection
	let selectedOptions = $state<Record<string, { id: string; quantity: number }[]>>({});

	// Get product data and edit context from the modal state
	const product = $derived(productModalState.productData);
	const editContext = $derived(productModalState.editContext); // Use editContext instead of editData

	// Remove derived states for old edit mode properties
	// const isEditMode = $derived(productModalState.editMode);
	// const cartItemId = $derived(productModalState.cartItemId);
	// const initialOptions = $derived(productModalState.initialOptions);
	// const initialQuantity = $derived(productModalState.initialQuantity);
	// const initialInstructions = $derived(productModalState.initialInstructions);

	// Remove loadExistingCartState function - no longer needed for this flow
	/*
	function loadExistingCartState() {
		if (!product?.id || !cart?.items) {
			resetModalState();
			return;
		}

		// Find if this product is already in cart
		const existingItem = cart.items.find((item) => item.menuItemId === product.id);

		if (existingItem) {
			// Pre-fill state based on existing item (optional, depends on desired UX)
			// For now, we only load state explicitly in edit mode via loadEditingState
		} else {
			resetModalState();
		}
	}
	*/

	// Function to load state when editing an existing cart item
	function loadEditingState() {
		if (!editContext) {
			// Check editContext
			// Should not happen if called correctly, but good practice
			resetModalState();
			return;
		}

		// Set the initial quantity from editContext
		quantity = editContext.initialQuantity || 1; // Use editContext

		// Set special instructions from editContext
		specialInstructions = editContext.initialSpecialInstructions || ''; // Use editContext

		// Map the initial options from editContext to the format expected by the modal
		const groupedOptions: Record<string, { id: string; quantity: number }[]> = {};

		// Use the updated structure with nested option and optionGroup
		editContext.initialSelectedOptions.forEach((opt) => {
			// Use editContext
			// Ensure optionGroup and option exist and have IDs
			if (!opt.optionGroup?.id || !opt.option?.id) {
				console.warn('Skipping initial option due to missing data:', opt);
				return;
			}

			const groupId = opt.optionGroup.id; // Use nested ID
			if (!groupedOptions[groupId]) {
				groupedOptions[groupId] = [];
			}

			groupedOptions[groupId].push({
				id: opt.option.id, // Use nested ID
				quantity: opt.quantity || 1 // Default quantity to 1 if missing
			});
		});

		selectedOptions = groupedOptions;

		// Remove validation call from here - it might be causing the loop
		// validateAllOptionGroups();
	}

	// Reset the modal state when closing or opening with a new product
	function resetModalState() {
		quantity = 1;
		specialInstructions = ''; // Reset instructions too
		selectedOptions = {};
		optionGroupErrors = {};
	}

	// Consolidated Effect for modal state initialization and reset
	$effect(() => {
		const is_open = productModalState.value;
		const product_id = product?.id; // Track product ID
		const edit_context_id = editContext?.cartItemId; // Track edit context ID

		if (is_open) {
			// Modal is open
			if (product_id) {
				// Product data is available
				if (editContext && edit_context_id === editContext.cartItemId) {
					// Edit mode: Check if edit_context_id matches current context to avoid re-running unnecessarily
					console.log('Effect: Loading editing state for', edit_context_id);
					loadEditingState();
				} else if (!editContext) {
					// Add mode (or product changed without edit context)
					console.log('Effect: Resetting state for new product', product_id);
					resetModalState();
				}
			} else {
				// Product data not yet available while modal is open? Reset maybe?
				console.log('Effect: Modal open but no product data yet.');
				// resetModalState(); // Avoid resetting if product is just loading
			}
		} else {
			// Modal is closed: Reset state
			console.log('Effect: Modal closed, resetting state.');
			resetModalState();
		}
	});

	// Initialize state when product or editContext changes
	$effect(() => {
		if (product) {
			// Reset local state when product changes
			quantity = editContext?.initialQuantity ?? 1;
			specialInstructions = editContext?.initialSpecialInstructions ?? '';
			optionGroupErrors = {}; // Clear errors
			isDescriptionExpanded = false; // Reset description expansion state

			// Initialize selectedOptions from editContext or defaults
			const initialSelections: Record<string, { id: string; quantity: number }[]> = {};
			if (editContext?.initialSelectedOptions) {
				editContext.initialSelectedOptions.forEach((selOpt) => {
					const groupId = selOpt.optionGroup.id; // Use group ID from the selected option context
					if (!initialSelections[groupId]) {
						initialSelections[groupId] = [];
					}
					initialSelections[groupId].push({ id: selOpt.option.id, quantity: selOpt.quantity });
				});
			} else {
				// Set defaults for required single-select groups if not editing
				optionGroups.forEach((group) => {
					if (isRequired(group) && !isMultipleSelect(group) && group.options.length > 0) {
						// Pre-select the first option for required radio groups
						// initialSelections[group.id] = [{ id: group.options[0].id, quantity: 1 }];
						// Optional: Decide if pre-selection is desired UX
					}
				});
			}
			selectedOptions = initialSelections;

			// Don't validate on initial mount
			// validateAllOptionGroups();
		}
	});

	// Use the product price or default to a fallback price
	let basePrice = $derived(product?.price ?? 0); // Default to 0 or handle appropriately
	let productName = $derived(product?.name ?? 'no name');
	// Ensure productDescription uses the description from productData
	let productDescription = $derived(product?.description ?? 'No description available');
	let productImage = $derived(product?.imageUrl ?? '/hero-1.png');
	// Updated to use direct optionGroups array from the mapped data structure
	let optionGroups = $derived(product?.optionGroups ?? []);

	// Derived values for truncated description
	const isDescriptionTruncatable = $derived(productDescription.length > MAX_DESCRIPTION_LENGTH);
	const truncatedDescription = $derived(
		isDescriptionTruncatable && !isDescriptionExpanded
			? productDescription.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
			: productDescription
	);

	// Function to toggle description expansion
	function toggleDescriptionExpansion(): void {
		isDescriptionExpanded = !isDescriptionExpanded;
	}

	// Track validation state for option groups
	let optionGroupErrors = $state<Record<string, string>>({});

	// Helper function to check if an option group is required
	function isRequired(group: OptionGroup): boolean {
		return group.minSelections > 0;
	}

	// Add this helper function near the top of the script section
	function isMultipleSelect(optionGroup: OptionGroup): boolean {
		return optionGroup.maxSelections === null || optionGroup.maxSelections > 1;
	}

	// Add helper function to get total quantity in an option group
	function getTotalGroupQuantity(groupId: string): number {
		if (!selectedOptions[groupId]) return 0;
		return selectedOptions[groupId].reduce((total, selection) => total + selection.quantity, 0);
	}
	// Helper function to validate option group selections
	function validateOptionGroup(group: OptionGroup): string | null {
		const totalSelected = getTotalGroupQuantity(group.id);
		let error: string | null = null;

		if (totalSelected < group.minSelections) {
			error = `Select at least ${group.minSelections}.`;
		} else if (group.maxSelections !== null && totalSelected > group.maxSelections) {
			error = `Select no more than ${group.maxSelections}.`;
		}

		// Return the error instead of setting state here
		// optionGroupErrors = { ...optionGroupErrors, [group.id]: error || '' };
		return error;
	}

	// Function to validate all option groups
	function validateAllOptionGroups(): boolean {
		let allValid = true;
		const currentErrors: Record<string, string> = {}; // Use a temporary object
		for (const group of optionGroups) {
			const error = validateOptionGroup(group);
			if (error) {
				allValid = false;
				currentErrors[group.id] = error; // Collect errors
			}
		}
		// Update the state once at the end
		optionGroupErrors = currentErrors;
		return allValid;
	}

	// Calculate total price including all selected options, packs, etc.
	function calculateNumericTotalPrice(): number {
		let total = basePrice;

		// Add option prices
		for (const groupId in selectedOptions) {
			const group = optionGroups.find((g) => g.id === groupId);
			if (group) {
				for (const selection of selectedOptions[groupId]) {
					const option = group.options.find((o) => o.id === selection.id);
					if (option) {
						total += option.price * selection.quantity;
					}
				}
			}
		}

		// Multiply by quantity
		total *= quantity;

		return total;
	}

	// Derived state for the raw numeric total
	const numericTotalPrice = $derived(calculateNumericTotalPrice());

	// Keep the formatted price derived state for potential other uses (or remove if unused elsewhere)
	const getTotalPrice = $derived(formatCurrency(numericTotalPrice));

	// Simplify canSelectMultiple to derive from price only
	function canSelectMultiple(option: any): boolean {
		// This logic might need adjustment based on specific business rules
		// For now, assume multiple can be selected if price > 0 or if group allows
		return option.price > 0; // Example: Allow multiple only if it adds cost
	} // Add this helper function to determine if an option should be disabled
	function isOptionDisabled(groupId: string, optionId: string, group: OptionGroup): boolean {
		const totalSelected = getTotalGroupQuantity(groupId);
		const isSelected = isOptionSelected(groupId, optionId);

		// For multi-select groups: Disable if max selections reached and this option is not already selected
		if (
			isMultipleSelect(group) &&
			group.maxSelections !== null &&
			totalSelected >= group.maxSelections &&
			!isSelected
		) {
			return true;
		}

		// For single-select (radio) groups: NEVER disable options based on selection
		// This ensures users can always change their selection in radio groups

		// Only disable based on stock for all group types
		const option = group.options.find((o) => o.id === optionId);
		if (option && option.inStock === false) {
			return true;
		}

		return false;
	}
	// Modify toggleOptionSelection to use updateOptionQuantity (removed validation)
	function toggleOptionSelection(groupId: string, optionId: string, group: OptionGroup) {
		const currentQuantity = getOptionQuantity(groupId, optionId);
		const isSelected = currentQuantity > 0;

		if (isSelected) {
			updateOptionQuantity(groupId, optionId, -currentQuantity); // Use update function to set to 0
		} else {
			updateOptionQuantity(groupId, optionId, 1); // Use update function to add 1
		}

		// Clear error for this group if it exists
		if (optionGroupErrors[groupId]) {
			// Check if this selection now satisfies the validation requirement
			const error = validateOptionGroup(group);
			if (!error) {
				// Only clear this specific group's error
				const updatedErrors = { ...optionGroupErrors };
				delete updatedErrors[groupId];
				optionGroupErrors = updatedErrors;
			}
		}
	}

	// Modify updateOptionQuantity (remove validation call)
	function updateOptionQuantity(groupId: string, optionId: string, delta: number) {
		const currentSelections = selectedOptions[groupId] || [];
		const existingIndex = currentSelections.findIndex((sel) => sel.id === optionId);
		const group = optionGroups.find((g) => g.id === groupId); // Get group info

		// Ensure group exists before proceeding
		if (!group) {
			console.error(`Group with ID ${groupId} not found`);
			return;
		}

		// Find the specific option details to check stock if increasing
		const option = group.options.find((o) => o.id === optionId);
		let newSelections = [...currentSelections]; // Clone current selections

		if (existingIndex > -1) {
			// Option exists, update its quantity or remove it
			const currentQuantity = newSelections[existingIndex].quantity;
			const newQuantity = currentQuantity + delta;

			// Check max group selections *before* increasing quantity (only if delta is positive)
			if (
				delta > 0 &&
				group.maxSelections !== null &&
				getTotalGroupQuantity(groupId) >= group.maxSelections
			) {
				toast.error(`You can select a maximum of ${group.maxSelections} options from this group.`);
				return;
			}

			// Check stock before increasing quantity (only if delta is positive)
			if (delta > 0 && option?.inStock === false) {
				toast.error(`${option.name} is out of stock.`);
				return;
			}

			if (newQuantity <= 0) {
				newSelections.splice(existingIndex, 1);
			} else {
				newSelections[existingIndex] = { ...newSelections[existingIndex], quantity: newQuantity };
			}
		} else if (delta > 0) {
			// Option doesn't exist, and we are trying to increment (delta > 0)
			// Add it with quantity 1, checking limits and stock first
			if (group.maxSelections !== null && getTotalGroupQuantity(groupId) >= group.maxSelections) {
				toast.error(`You can select a maximum of ${group.maxSelections} options from this group.`);
				return;
			}
			if (option?.inStock === false) {
				toast.error(`${option.name} is out of stock.`);
				return;
			}
			// Add the new selection
			newSelections.push({ id: optionId, quantity: 1 });
		} else {
			// Option doesn't exist and delta is not positive - do nothing
			return;
		}

		// Update the state
		selectedOptions = { ...selectedOptions, [groupId]: newSelections };

		// Clear error for this group if the change would resolve the validation issue
		if (optionGroupErrors[groupId]) {
			const error = validateOptionGroup(group);
			if (!error) {
				// Only clear this specific group's error
				const updatedErrors = { ...optionGroupErrors };
				delete updatedErrors[groupId];
				optionGroupErrors = updatedErrors;
			}
		}
	}

	function isOptionSelected(groupId: string, optionId: string): boolean {
		return selectedOptions[groupId]?.some((sel) => sel.id === optionId) ?? false;
	}

	// Update getOptionQuantity helper
	function getOptionQuantity(groupId: string, optionId: string): number {
		return selectedOptions[groupId]?.find((sel) => sel.id === optionId)?.quantity ?? 0;
	}

	// Add helper to display remaining selections
	function getRemainingSelections(group: OptionGroup): number | null {
		if (group.maxSelections === null) return null; // Unlimited
		const remaining = group.maxSelections - getTotalGroupQuantity(group.id);
		return Math.max(0, remaining);
	}

	// Helper function to get the selected option ID for a radio group
	function getSelectedRadioValue(groupId: string): string | undefined {
		const selections = selectedOptions[groupId];
		// For radio groups (single select), there should be at most one selection
		return selections?.[0]?.id;
	} // Handle radio button changes for single-select groups (removed validation)
	function handleRadioChange(groupId: string, newOptionId: string | undefined, group: OptionGroup) {
		// Check if the option is already selected (clicked again) to allow deselection
		const currentSelection = selectedOptions[groupId]?.[0]?.id;

		// If clicking same option that's already selected and group isn't required, clear selection
		if (currentSelection === newOptionId && !isRequired(group)) {
			selectedOptions = { ...selectedOptions, [groupId]: [] };
		} else if (newOptionId !== undefined) {
			// If a valid option ID is provided, select it (handles both new selection and changing selection cases)
			selectedOptions = { ...selectedOptions, [groupId]: [{ id: newOptionId, quantity: 1 }] };
		} else if (newOptionId === undefined && !isRequired(group)) {
			// If explicit deselection (undefined) and group isn't required, clear selection
			selectedOptions = { ...selectedOptions, [groupId]: [] };
		}

		// Clear error for this group if it exists and the change resolves the issue
		if (optionGroupErrors[groupId]) {
			const error = validateOptionGroup(group);
			if (!error) {
				// Only clear this specific group's error
				const updatedErrors = { ...optionGroupErrors };
				delete updatedErrors[groupId];
				optionGroupErrors = updatedErrors;
			}
		}
	} // Handle add/update cart - only validate on submission
	async function handleAddToCart() {
		// Check authentication first based on the actual session structure
		if ($session.isPending) {
			// Session is still loading, show a loading toast and don't proceed
			toast.loading('Checking your session...');
			return;
		} else if (!$session.data?.user) {
			// User is not authenticated or doesn't have user data
			productModalState.close();
			loginModalState.open('Sign in to add items to your cart');
			return;
		}

		// Ensure product and product.id are available
		if (!product?.id) {
			toast.error('Product information is missing. Cannot add to cart.');
			return;
		}

		// Clear any previous errors first
		optionGroupErrors = {};

		// Run validation at submission time
		if (!validateAllOptionGroups()) {
			// Show error message or handle invalid state
			toast.error('Please check required options.');

			// Improved scroll to error functionality
			// Wait for the DOM to update with the error
			setTimeout(() => {
				// Find the first group with an error
				const firstErrorGroupId = Object.keys(optionGroupErrors).find(
					(id) => !!optionGroupErrors[id]
				);

				if (firstErrorGroupId) {
					// Try to find and scroll to the group with the error
					const errorGroupElement = document.querySelector(
						`[data-group-id="${firstErrorGroupId}"]`
					);

					if (errorGroupElement) {
						// Scroll the group into view
						errorGroupElement.scrollIntoView({
							behavior: 'smooth',
							block: 'center'
						});
					} else {
						// Fallback to alert element if group can't be found
						const alertElement = document.querySelector('.alert-destructive');
						if (alertElement) {
							alertElement.scrollIntoView({
								behavior: 'smooth',
								block: 'center'
							});
						}
					}
				}
			}, 100);

			return;
		}

		try {
			isLoading = true;

			// Format options array according to the API schema
			const formattedOptions = [];

			for (const [groupId, selections] of Object.entries(selectedOptions)) {
				const group = optionGroups.find((g) => g.id === groupId);
				if (group) {
					for (const selection of selections) {
						const option = group.options.find((opt) => opt.id === selection.id);
						if (option) {
							// Format option according to the API schema
							formattedOptions.push({
								optionGroupId: group.id,
								optionId: option.id,
								quantity: selection.quantity
							});
						}
					}
				}
			}

			// Create request payload according to addCartItemSchema
			const cartData = {
				menuItemId: product.id,
				quantity: quantity,
				specialInstructions: specialInstructions || undefined, // Send undefined if empty
				options: formattedOptions.length > 0 ? formattedOptions : undefined
			};

			let response;

			// Check if editContext exists to determine if it's an edit operation
			if (editContext) {
				// Use editContext
				// Edit Mode: Delete the old item, then add the modified item as new

				// 1. Delete the existing cart item using cartItemId from editContext
				const deleteResponse = await client.cart.items[':itemId'].$delete({
					param: { itemId: editContext.cartItemId } // Use ID from editContext
				});

				if (!deleteResponse.ok) {
					throw new Error(
						`Failed to remove old item before updating. ${
							(await deleteResponse.json())?.message || ''
						}`
					);
				}

				// 2. Add the modified item as a new entry
				response = await client.cart.$post({
					json: cartData
				});
			} else {
				// Add Mode: Add as a new item
				response = await client.cart.$post({
					json: cartData
				});
			}

			await invalidateAll(); // Refresh cart data everywhere

			if (response.ok) {
				productModalState.close();
				toast.success(editContext ? 'Item updated in cart!' : 'Item added to cart!'); // Use editContext
			} else {
				const errorData = await response.json();
				toast.error(
					(errorData as any).message || `Failed to ${editContext ? 'update' : 'add'} item`
				); // Use editContext
			}
		} catch (error) {
			console.error(`Error ${editContext ? 'updating' : 'adding to'} cart:`, error); // Use editContext
			toast.error((error as Error).message || 'Something went wrong. Please try again.');
		} finally {
			isLoading = false;
		}
	}
</script>

<Dialog.Root
	bind:open={productModalState.value}
	onOpenChange={(open) => !open && productModalState.close()}
>
	<!-- Ensure Dialog.Content is a flex column and set a max height for viewport fitting -->
	<Dialog.Content scrollClass="p-0" class=" w-full overflow-hidden p-0 sm:max-w-[425px]">
		{#if product}
			<!-- Header Part 1: Image (Doesn't shrink) -->
			<div class="relative h-64 w-full flex-shrink-0">
				<img
					src={productImage}
					alt={productName}
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>

			<!-- Revert header section layout/styling -->
			<div class="flex-shrink-0 p-4">
				<Dialog.Title class="text-lg font-semibold capitalize">{productName}</Dialog.Title>
				{#if productDescription}
					<Dialog.Description class="text-muted-foreground mt-1 text-sm">
						{truncatedDescription}
						{#if isDescriptionTruncatable}
							<button
								class="text-primary ml-1 inline-flex items-center text-xs font-medium hover:underline focus:outline-none"
								onclick={toggleDescriptionExpansion}
								type="button"
							>
								{isDescriptionExpanded ? 'See less' : 'See more'}
								{#if isDescriptionExpanded}
									<ChevronUp class="ml-0.5 h-3 w-3" />
								{:else}
									<ChevronDown class="ml-0.5 h-3 w-3" />
								{/if}
							</button>
						{/if}
					</Dialog.Description>
				{/if}
				<div class="mt-2 flex items-center gap-2">
					<p class="text-primary font-semibold">{formatCurrency(basePrice)}</p>
					{#if product.priceDescription}
						<Badge variant="outline">{product.priceDescription}</Badge>
					{/if}
				</div>
			</div>

			<div class="px-4 pb-8 pt-2">
				{#if optionGroups.length > 0}
					<!-- Remove outer grid, add margin between groups -->
					{#each optionGroups as group, i (group.id)}
						<div class="grid gap-2 {i > 0 ? 'mt-10' : ''}" data-group-id={group.id}>
							<!-- Revert option group header styling -->
							<div class="flex items-center justify-between">
								<Label class="font-medium capitalize">{group.name}</Label>
								{#if isRequired(group)}
									<Badge variant="destructive" class="text-xs">Required</Badge>
								{:else}
									<Badge variant="secondary" class="text-xs">Optional</Badge>
								{/if}
							</div>
							<p class="text-muted-foreground text-xs">
								Select {#if group.minSelections > 0}at least {group.minSelections}{/if}
								{#if group.maxSelections && group.maxSelections > 0}
									up to {group.maxSelections}{/if}
								option{#if group.maxSelections !== 1}s{/if}.
								{#if getRemainingSelections(group) !== null}
									<span class="text-primary font-medium">
										({getRemainingSelections(group)} remaining)
									</span>
								{/if}
							</p>
							{#if optionGroupErrors[group.id]}
								<Alert variant="destructive" class="p-2 text-xs">
									<AlertCircle class="h-4 w-4" />
									<AlertDescription>{optionGroupErrors[group.id]}</AlertDescription>
								</Alert>
							{/if}

							{#if isMultipleSelect(group)}
								<!-- Checkbox rendering (Multi-select) -->
								<div class="grid gap-8 pt-4">
									{#each group.options as option (option.id)}
										{@const isSelected = isOptionSelected(group.id, option.id)}
										{@const currentQuantity = getOptionQuantity(group.id, option.id)}
										{@const isDisabled = isOptionDisabled(group.id, option.id, group)}
										{@const canIncrease = !(
											group.maxSelections !== null &&
											getTotalGroupQuantity(group.id) >= group.maxSelections
										)}
										{@const isOutOfStock = option.inStock === false}

										<div class="flex items-center justify-between gap-2">
											<!-- Checkbox, Label, Price -->
											<Label
												for={`option-${group.id}-${option.id}`}
												class="flex flex-1 cursor-pointer items-center gap-2 {isDisabled &&
												!isSelected
													? 'cursor-not-allowed opacity-50'
													: ''}"
											>
												<Checkbox
													id={`option-${group.id}-${option.id}`}
													checked={isSelected}
													onCheckedChange={() => toggleOptionSelection(group.id, option.id, group)}
													disabled={isDisabled && !isSelected}
												/>
												<span class="text-sm">{option.name}</span>
												{#if isOutOfStock}
													<Badge variant="outline" class="text-destructive text-xs"
														>Out of Stock</Badge
													>
												{/if}
											</Label>
											{#if option.price > 0}
												<span class="whitespace-nowrap text-sm font-medium"
													>+{formatCurrency(option.price)}</span
												>
											{/if}

											<!-- Quantity Controls -->
											<!-- Show only if selected AND it has a price > 0 -->
											{#if isSelected && option.price > 0}
												<div class="flex items-center gap-1">
													<Button
														variant="outline"
														size="icon"
														class="size-8"
														onclick={() => updateOptionQuantity(group.id, option.id, -1)}
														disabled={currentQuantity <= 1}
													>
														<Minus class="h-3 w-3" />
													</Button>
													<span class="w-6 text-center text-sm font-medium">{currentQuantity}</span>
													<Button
														variant="outline"
														size="icon"
														class="size-8"
														onclick={() => updateOptionQuantity(group.id, option.id, 1)}
														disabled={!canIncrease || isOutOfStock}
													>
														<Plus class="h-3 w-3" />
													</Button>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<!-- Radio Group rendering (Single-select) -->
								<!-- Replace RadioGroup with custom radio buttons for better control -->
								<div class="grid gap-8 pt-4">
									{#each group.options as option (option.id)}
										{@const isDisabled = isOptionDisabled(group.id, option.id, group)}
										{@const isSelected = isOptionSelected(group.id, option.id)}
										<div class="flex items-center justify-between">
											<!-- Wrap the whole radio button in a clickable area -->
											<div
												class="flex flex-1 cursor-pointer items-center justify-between {isDisabled
													? 'cursor-not-allowed opacity-50'
													: ''}"
												onclick={() => {
													if (isDisabled) return;

													// If already selected and not required, deselect
													if (isSelected && !isRequired(group)) {
														handleRadioChange(group.id, undefined, group);
													}
													// If not selected or if required, select this option
													else if (!isSelected) {
														handleRadioChange(group.id, option.id, group);
													}
												}}
												onkeydown={(e) => {
													// Handle keyboard accessibility
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														if (isDisabled) return;

														if (isSelected && !isRequired(group)) {
															handleRadioChange(group.id, undefined, group);
														} else if (!isSelected) {
															handleRadioChange(group.id, option.id, group);
														}
													}
												}}
												tabindex={isDisabled ? -1 : 0}
												role="button"
												aria-pressed={isSelected}
											>
												<div class="flex items-center gap-2">
													<!-- Custom radio button with visual indicator -->
													<div
														class="border-primary text-primary ring-offset-background flex h-4 w-4 items-center justify-center rounded-full border
														{isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}"
														role="radio"
														aria-checked={isSelected}
													>
														{#if isSelected}
															<div class="bg-primary-foreground h-2 w-2 rounded-full"></div>
														{/if}
													</div>
													<span class="text-sm">{option.name}</span>
												</div>
											</div>
											{#if option.price > 0}
												<span class="text-sm font-medium">+{formatCurrency(option.price)}</span>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
			<!-- Special Instructions -->
			<div class="px-4 pb-4">
				<Label for="special-instructions" class="mb-2 block text-sm font-medium"
					>Special Instructions</Label
				>
				<Input
					id="special-instructions"
					placeholder="Any specific requests? (e.g., extra sauce)"
					bind:value={specialInstructions}
					autofocus={false}
					tabindex={-1}
				/>
			</div>

			<!-- Footer: Quantity and Add to Cart -->
			<Dialog.Footer class="bg-background sticky bottom-0 mt-auto flex-shrink-0 border-t p-4">
				<div class="flex w-full items-center justify-between gap-4">
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							onclick={() => (quantity = Math.max(1, quantity - 1))}
							disabled={quantity <= 1}
						>
							<Minus class="h-4 w-4" />
						</Button>
						<span class="w-8 text-center text-lg font-medium">{quantity}</span>
						<Button variant="outline" size="icon" onclick={() => (quantity += 1)}>
							<Plus class="h-4 w-4" />
						</Button>
					</div>
					<Button class="flex-1" onclick={handleAddToCart} disabled={isLoading}>
						{#if isLoading}
							<svg
								class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							{editContext ? 'Updating...' : 'Adding...'}
						{:else}
							{editContext ? 'Update Item' : 'Add to Cart'} - {getTotalPrice}
						{/if}
					</Button>
				</div>
			</Dialog.Footer>
		{:else}
			<!-- Optional: Show loading or error state if product is null -->
			<div class="flex h-64 items-center justify-center p-4">
				<p class="text-muted-foreground">Loading product details...</p>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
