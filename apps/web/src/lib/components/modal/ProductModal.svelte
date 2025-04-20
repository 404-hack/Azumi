<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import {
		productModalState,
		type MenuItemOptionGroup,
		type OptionGroup
	} from '$lib/states/modalState.svelte';
	import { Minus, Plus, Star } from 'lucide-svelte';
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

	const isDesktop = new MediaQuery('(min-width: 768px)');
	let quantity = $state(1);
	let isLoading = $state(false);

	// For option groups and option selection
	let selectedOptions = $state<Record<string, { id: string; quantity: number }[]>>({});

	// Get product data from the modal state
	const product = $derived(productModalState.productData);

	// Use the product price or default to a fallback price
	let basePrice = $derived(product?.price ?? 16.99);
	let productName = $derived(product?.name ?? 'Product');
	let productDescription = $derived(product?.description ?? 'No description available');
	let productImage = $derived(
		product?.image ??
			'/hero-1.png'
	);
	let optionGroups = $derived(product?.menuItemOptionGroups ?? []);

	// Track validation state for option groups
	let optionGroupErrors = $state<Record<string, string>>({});

	// Helper function to check if an option group is required
	function isRequired(group: MenuItemOptionGroup): boolean {
		return group.optionGroup.minSelections > 0;
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
	function validateOptionGroup(group: MenuItemOptionGroup): string | null {
		const selection = selectedOptions[group.optionGroup.id];
		const totalQuantity = getTotalGroupQuantity(group.optionGroup.id);

		if (isMultipleSelect(group.optionGroup)) {
			if (group.optionGroup.minSelections > 0 && totalQuantity < group.optionGroup.minSelections) {
				return `Please select at least ${group.optionGroup.minSelections} total item${group.optionGroup.minSelections > 1 ? 's' : ''}`;
			}
			if (
				group.optionGroup.maxSelections !== null &&
				totalQuantity > group.optionGroup.maxSelections
			) {
				return `Please select no more than ${group.optionGroup.maxSelections} total items`;
			}
		} else if (
			!isMultipleSelect(group.optionGroup) &&
			group.optionGroup.minSelections > 0 &&
			!selection
		) {
			return 'Please select an option';
		}

		return null;
	}

	// Function to validate all option groups
	function validateAllOptionGroups(): boolean {
		let isValid = true;
		optionGroupErrors = {};

		if (!product?.menuItemOptionGroups) return true;

		product.menuItemOptionGroups.forEach((group) => {
			const error = validateOptionGroup(group);
			if (error) {
				optionGroupErrors[group.optionGroup.id] = error;
				isValid = false;
			}
		});

		return isValid;
	}

	// Calculate total price including all selected options, packs, etc.
	function calculateTotalPrice(): string {
		let total = basePrice * quantity;

		// Add price of selected option groups
		if (optionGroups.length > 0) {
			for (const { optionGroup } of optionGroups) {
				const selections = selectedOptions[optionGroup.id] || [];

				for (const selection of selections) {
					const option = optionGroup.optionsToOptionGroups.find(
						(og) => og.option.id === selection.id
					)?.option;
					if (option) {
						total += option.price * selection.quantity * quantity;
					}
				}
			}
		}

		// Return the formatted price using the formatCurrency utility
		return formatCurrency(total);
	}

	// Use derived to recompute the total price whenever dependencies change
	const getTotalPrice = $derived(calculateTotalPrice());

	// Simplify canSelectMultiple to derive from price only
	function canSelectMultiple(option: any): boolean {
		return option.price > 0;
	}

	// Modify toggleOptionSelection to properly handle selection states
	function toggleOptionSelection(groupId: string, optionId: string, group: OptionGroup) {
		if (isMultipleSelect(group)) {
			if (!Array.isArray(selectedOptions[groupId])) {
				selectedOptions[groupId] = [];
			}

			const selections = selectedOptions[groupId];
			const existingSelection = selections.find((s) => s.id === optionId);
			const currentTotal = getTotalGroupQuantity(groupId);

			const option = group.optionsToOptionGroups.find((og) => og.option.id === optionId)?.option;
			if (!option) return;

			// If unchecking (removing selection)
			if (existingSelection) {
				// Remove option entirely
				selectedOptions[groupId] = selections.filter((s) => s.id !== optionId);

				if (selectedOptions[groupId].length === 0 && group.minSelections > 0) {
					optionGroupErrors[groupId] =
						`Please select at least ${group.minSelections} item${group.minSelections > 1 ? 's' : ''}`;
				} else {
					delete optionGroupErrors[groupId];
				}
				return;
			}

			// If adding new selection
			if (group.maxSelections !== null && currentTotal + 1 > group.maxSelections) {
				optionGroupErrors[groupId] =
					`You can only select up to ${group.maxSelections} total items in this group`;
				return;
			}

			// Add new selection with quantity 1
			selectedOptions[groupId] = [...selections, { id: optionId, quantity: 1 }];
			delete optionGroupErrors[groupId];
		} else {
			// For radio buttons (single selection)
			const currentSelection = selectedOptions[groupId]?.[0];

			// If clicking the same option and it's not required (minSelections = 0), deselect it
			if (currentSelection?.id === optionId && group.minSelections === 0) {
				selectedOptions[groupId] = [];
				delete optionGroupErrors[groupId];
				return;
			}

			// Otherwise select the new option
			selectedOptions[groupId] = [{ id: optionId, quantity: 1 }];
			delete optionGroupErrors[groupId];
		}
	}

	// Modify updateOptionQuantity to properly handle zero quantity
	function updateOptionQuantity(groupId: string, optionId: string, delta: number) {
		if (!selectedOptions[groupId]) return;

		const group = optionGroups.find((g) => g.optionGroup.id === groupId)?.optionGroup;
		if (!group) return;

		const selections = selectedOptions[groupId];
		const optionIndex = selections.findIndex((s) => s.id === optionId);

		if (optionIndex === -1) return;

		const option = group.optionsToOptionGroups.find((og) => og.option.id === optionId)?.option;
		if (!option) return;

		// Don't allow quantity changes for free options
		if (option.price === 0) {
			optionGroupErrors[groupId] = 'Free options can only be selected once';
			return;
		}

		const currentQuantity = selections[optionIndex].quantity;
		const newQuantity = currentQuantity + delta;
		const currentTotal = getTotalGroupQuantity(groupId);
		const newTotal = currentTotal + delta;

		// If reducing to zero or below, remove the option completely (deselect checkbox)
		if (newQuantity <= 0) {
			const newSelections = selections.filter((s) => s.id !== optionId);
			selectedOptions[groupId] = newSelections;

			// Check minimum selections after removal
			if (newSelections.length === 0 && group.minSelections > 0) {
				optionGroupErrors[groupId] =
					`Please select at least ${group.minSelections} item${group.minSelections > 1 ? 's' : ''}`;
			} else {
				delete optionGroupErrors[groupId];
			}
			return;
		}

		// Check if new total would exceed group maximum
		if (group.maxSelections !== null && newTotal > group.maxSelections) {
			optionGroupErrors[groupId] =
				`You can only select up to ${group.maxSelections} total items in this group`;
			return;
		}

		// Update the quantity
		selections[optionIndex].quantity = newQuantity;
		selectedOptions[groupId] = [...selections];
		delete optionGroupErrors[groupId];
	}

	function isOptionSelected(groupId: string, optionId: string): boolean {
		return selectedOptions[groupId]?.some((s) => s.id === optionId) ?? false;
	}

	// Update getOptionQuantity helper
	function getOptionQuantity(groupId: string, optionId: string): number {
		return selectedOptions[groupId]?.find((s) => s.id === optionId)?.quantity ?? 0;
	}

	// Add helper to display remaining selections
	function getRemainingSelections(group: OptionGroup): number | null {
		if (group.maxSelections === null) return null;
		const totalSelected = getTotalGroupQuantity(group.id);
		return Math.max(0, group.maxSelections - totalSelected);
	}

	// Add to cart handler
	async function handleAddToCart() {
		if (!validateAllOptionGroups()) {
			// Show error message or handle invalid state
			return;
		}

		try {
			isLoading = true;

			// Format options array according to the API schema
			const formattedOptions = [];

			for (const [groupId, selections] of Object.entries(selectedOptions)) {
				for (const selection of selections) {
					formattedOptions.push({
						optionId: selection.id,
						optionGroupId: groupId,
						quantity: selection.quantity
					});
				}
			}

			// Create request payload according to addCartItemSchema
			const cartData = {
				menuItemId: product?.id,
				quantity: quantity,
				specialInstructions: '',
				options: formattedOptions.length > 0 ? formattedOptions : undefined
			};

			// Make the API request using the Hono client
			const response = await client.cart.$post({
				json: cartData
			});
			await invalidateAll();

			if (response.ok) {
				// Close the modal
				productModalState.value = false;
				toast.success('Item added to cart!');
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || 'Failed to add item to cart');
			}
		} catch (error) {
			console.error('Error adding to cart:', error);
			toast.error('Something went wrong. Please try again.');
		} finally {
			isLoading = false;
		}
	}
</script>

<Dialog.Root bind:open={productModalState.value}>
	<Dialog.Content scrollClass='p-0' class=" p-0 w-full overflow-hidden  sm:max-w-[425px]">
		<div class="">
			<img
				src={productImage}
				in:blur={{ duration: 300 }}
				loading="lazy"
				class="h-[350px] w-full object-cover"
				alt={productName}
			/>
		</div>
		<div class="w-full overflow-auto">
			<div class="grid gap-4 p-4">
				<h1 class="italian text-2xl font-bold capitalize lg:text-3xl">
					{productName}
				</h1>
				<div class="flex items-center gap-2">
					<p class="text-primary">{formatCurrency(basePrice)}</p>
					<!-- <Badge>popular</Badge> -->
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					{productDescription}
				</p>
			</div>
		</div>

		{#if optionGroups && optionGroups.length > 0}
			<Separator />
			{#each optionGroups as { optionGroup }}
				<div class="px-4 py-3">
					<div class="flex items-center justify-between">
						<h3 class="mb-3 font-medium">{optionGroup.name}</h3>
						<div class="flex items-center gap-2">
							{#if isRequired({ optionGroup })}
								<span class="text-sm text-destructive">Required</span>
							{/if}
							{#if optionGroup.maxSelections !== null}
								<span class="text-sm text-muted-foreground">
									{getRemainingSelections(optionGroup)} remaining
								</span>
							{/if}
						</div>
					</div>
					<p class="mb-4 text-sm text-muted-foreground">
						{#if isMultipleSelect(optionGroup)}
							{#if optionGroup.maxSelections === null}
								Choose {optionGroup.minSelections} or more options
							{:else}
								Choose {optionGroup.minSelections} to {optionGroup.maxSelections} options
							{/if}
						{:else}
							Choose one option
						{/if}
					</p>

					{#if optionGroupErrors[optionGroup.id]}
						<Alert variant="destructive" class="mb-4">
							<AlertCircle class="h-4 w-4" />
							<AlertDescription>
								{optionGroupErrors[optionGroup.id]}
							</AlertDescription>
						</Alert>
					{/if}

					{#if isMultipleSelect(optionGroup)}
						<div class="space-y-3">
							{#each optionGroup.optionsToOptionGroups as { option }}
								{#if option.inStock !== false}
									<div class="flex items-center space-x-2">
										<Checkbox
											checked={isOptionSelected(optionGroup.id, option.id)}
											onCheckedChange={() => {
												toggleOptionSelection(optionGroup.id, option.id, optionGroup);
											}}
											id={`${optionGroup.id}-${option.id}`}
										/>
										<label
											for={`${optionGroup.id}-${option.id}`}
											class="flex flex-1 items-center justify-between text-sm"
										>
											<span>{option.name}</span>
											<div class="flex items-center gap-2">
												{#if isOptionSelected(optionGroup.id, option.id) && canSelectMultiple(option)}
													<div class="flex items-center gap-2">
														<button
															type="button"
															class="flex h-6 w-6 items-center justify-center rounded-full border text-sm"
															onclick={(e) => {
																e.stopPropagation();
																const currentQty = getOptionQuantity(optionGroup.id, option.id);
																if (currentQty <= 1) {
																	// If at 1, toggling will remove the option
																	toggleOptionSelection(optionGroup.id, option.id, optionGroup);
																} else {
																	// Otherwise just decrease quantity
																	updateOptionQuantity(optionGroup.id, option.id, -1);
																}
															}}
														>
															<Minus class="h-3 w-3" />
														</button>
														<span class="w-4 text-center">
															{getOptionQuantity(optionGroup.id, option.id)}
														</span>
														<button
															type="button"
															class="flex h-6 w-6 items-center justify-center rounded-full border text-sm"
															onclick={() => updateOptionQuantity(optionGroup.id, option.id, 1)}
														>
															<Plus class="h-3 w-3" />
														</button>
													</div>
												{/if}
												<span class="text-muted-foreground">
													{option.price > 0 ? `+${formatCurrency(option.price)}` : 'Included'}
												</span>
											</div>
										</label>
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						<RadioGroup
							value={selectedOptions[optionGroup.id]?.[0]?.id ?? ''}
							class="space-y-3"
							onValueChange={(value) => {
								// If clicking the currently selected radio and group is not required, deselect it
								if (
									selectedOptions[optionGroup.id]?.[0]?.id === value &&
									optionGroup.minSelections === 0
								) {
									selectedOptions[optionGroup.id] = [];
								} else {
									// Normal case: Switch to new selection
									selectedOptions[optionGroup.id] = [{ id: value, quantity: 1 }];
								}
							}}
						>
							{#each optionGroup.optionsToOptionGroups as { option }}
								{#if option.inStock !== false}
									<div class="flex items-center space-x-2">
										<RadioGroupItem value={option.id} id={`${optionGroup.id}-${option.id}`} />
										<label
											for={`${optionGroup.id}-${option.id}`}
											class="flex flex-1 items-center justify-between text-sm"
											onclick={(e) => {
												// If this is already selected and not required, prevent default and deselect
												if (
													selectedOptions[optionGroup.id]?.[0]?.id === option.id &&
													optionGroup.minSelections === 0
												) {
													e.preventDefault();
													e.stopPropagation();
													selectedOptions[optionGroup.id] = [];
												}
											}}
										>
											<span>{option.name}</span>
											<span class="text-muted-foreground">
												{option.price > 0 ? `+${formatCurrency(option.price)}` : 'Included'}
											</span>
										</label>
									</div>
								{/if}
							{/each}
						</RadioGroup>
					{/if}
				</div>
				<Separator />
			{/each}
		{/if}

		<Separator  />

		<div class="sticky bottom-0 z-10 w-full bg-white px-3 py-4">
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
			<Button
				class="w-full shadow-lg"
				size="lg"
				onclick={handleAddToCart}
				disabled={Object.keys(optionGroupErrors).length > 0 || isLoading}
			>
				{isLoading ? 'Adding to Cart...' : `Add to Cart - ${getTotalPrice}`}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
