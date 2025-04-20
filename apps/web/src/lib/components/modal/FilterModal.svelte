<script lang="ts">
	import Button from '../ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { SlidersHorizontal, Star, Truck, Tag, Clock } from 'lucide-svelte';
	import * as Checkbox from '$lib/components/ui/checkbox';
	import { Slider } from '$lib/components/ui/slider';
	import { formatCurrency } from '$lib/utils';
	import { queryParam, ssp } from 'sveltekit-search-params';

	// Define default constants
	const DEFAULT_MIN_FEE = 300;
	const DEFAULT_MAX_FEE = 3000;

	type FilterOption = {
		id: string;
		name: string;
		value: number | null;
	};

	const categorizedFacets = {
		discount: {
			name: 'Discount',
			options: [
				{ id: 'any-discount', name: 'Any Discount', value: null },
				{ id: 'discount-10', name: '10% Off', value: 10 },
				{ id: 'discount-20', name: '20% Off', value: 20 },
				{ id: 'discount-30', name: '30% Off', value: 30 },
				{ id: 'discount-50', name: '50% Off', value: 50 }
			]
		},
		rating: {
			name: 'Rating',
			options: [
				{ id: 'rating-5', name: '5 Stars', value: 5 },
				{ id: 'rating-4', name: '4+ Stars', value: 4 },
				{ id: 'rating-3', name: '3+ Stars', value: 3 },
				{ id: 'rating-2', name: '2+ Stars', value: 2 }
			]
		}
	};

	const sortOptions = [
		'recommended',
		'newest',
		'price: low to high',
		'price: high to low',
		'rating: high to low'
	];

	// Setup URL search parameters with simplified approach
	const openNowParam = queryParam('openNow', ssp.boolean(false));
	const feeRangeMinParam = queryParam('feeMin', ssp.number(DEFAULT_MIN_FEE));
	const feeRangeMaxParam = queryParam('feeMax', ssp.number(DEFAULT_MAX_FEE));

	// Single rating parameter (stores the minimum rating as a number)
	const ratingParam = queryParam('rating', ssp.number());

	// Discount parameters (stores just the discount value or "any" for any discount)
	const discountParam = queryParam('discount', ssp.string());

	// Sort parameter
	const sortParam = queryParam('sort', ssp.string('recommended'));

	// Create local state variables from URL parameters
	let openNow = $state($openNowParam);
	let deliveryFeeRange = $state<[number, number]>([$feeRangeMinParam, $feeRangeMaxParam]);
	let selectedRating = $state<number | null>($ratingParam || null);
	let selectedDiscount = $state<string | null>($discountParam || null);
	let activeSort = $state($sortParam);
	let selectedSort = $state($sortParam); // Temporary sort state in modal

	// Sync from URL params
	function syncStateFromUrl(): void {
		openNow = $openNowParam;
		deliveryFeeRange = [$feeRangeMinParam, $feeRangeMaxParam];
		selectedRating = $ratingParam || null;
		selectedDiscount = $discountParam || null;
		selectedSort = $sortParam;
		activeSort = $sortParam;
	}

	let { open = false } = $props();

	// Watch for open changes to sync from URL when opening modal
	$effect(() => {
		if (open) {
			syncStateFromUrl();
		}
	});

	// Use $derived for reactive check against defaults
	const isDeliveryFeeRangeActive = $derived(
		deliveryFeeRange[0] !== DEFAULT_MIN_FEE || deliveryFeeRange[1] !== DEFAULT_MAX_FEE
	);

	// Helper to check if a rating option is selected
	function isRatingSelected(value: number | null): boolean {
		return selectedRating === value;
	}

	// Helper to check if a discount option is selected
	function isDiscountSelected(id: string, value: number | null): boolean {
		if (id === 'any-discount') return selectedDiscount === 'any';
		if (value !== null) return selectedDiscount === value.toString();
		return false;
	}

	// Count of applied filters for the badge
	const appliedFilterCount = $derived(
		1 + // For sort
			(selectedRating !== null ? 1 : 0) +
			(selectedDiscount !== null ? 1 : 0) +
			(openNow ? 1 : 0) +
			(isDeliveryFeeRangeActive ? 1 : 0)
	);

	// Handle rating selection - only one can be selected at a time
	function toggleRating(value: number | null): void {
		// If already selected, deselect it
		if (selectedRating === value) {
			selectedRating = null;
		} else {
			// Otherwise select this one
			selectedRating = value;
		}
	}

	// Handle discount selection - only one can be selected at a time
	function toggleDiscount(id: string, value: number | null): void {
		const discountValue = id === 'any-discount' ? 'any' : value?.toString() || null;

		// If already selected, deselect it
		if (
			(id === 'any-discount' && selectedDiscount === 'any') ||
			(value !== null && selectedDiscount === value.toString())
		) {
			selectedDiscount = null;
		} else {
			// Otherwise select this one
			selectedDiscount = discountValue;
		}
	}

	// Handle filter toggling based on category
	function toggleFilter(id: string, key: string, value: number | null): void {
		if (key === 'rating') {
			toggleRating(value);
		} else if (key === 'discount') {
			toggleDiscount(id, value);
		}
	}

	function selectSort(name: string): void {
		selectedSort = name; // Update temporary state
	}

	function resetFilters(): void {
		// Reset all filter states
		openNow = false;
		deliveryFeeRange = [DEFAULT_MIN_FEE, DEFAULT_MAX_FEE];
		selectedRating = null;
		selectedDiscount = null;
		selectedSort = 'recommended';
	}

	function applyFilters(): void {
		// Update all URL parameters at once when applying filters
		$openNowParam = openNow;
		$feeRangeMinParam = deliveryFeeRange[0];
		$feeRangeMaxParam = deliveryFeeRange[1];

		// Update simplified filter parameters
		$ratingParam = selectedRating;
		$discountParam = selectedDiscount;

		$sortParam = selectedSort;
		activeSort = selectedSort;

		console.log('Applying filters:', {
			openNow,
			deliveryFeeRange,
			rating: selectedRating,
			discount: selectedDiscount,
			activeSort,
			isDeliveryFeeRangeActive
		});

		open = false;
	}

	// Handle slider value changes - only updates local state
	function handleSliderChange(value: number[]): void {
		deliveryFeeRange = value as [number, number];
	}

	// Handle checkbox changes - only updates local state
	function handleOpenNowChange(checked: boolean): void {
		openNow = !!checked;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="  w-full  ">
		<Dialog.Header class="sticky top-0 z-10 bg-background p-5">
			<Dialog.Title class=" text-3xl">Filter</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-8">
			{#each Object.entries(categorizedFacets) as [key, category]}
				<div>
					<h2 class="font-display mb-3 text-xl font-semibold capitalize">{category.name}</h2>
					<div class="flex flex-wrap items-center gap-2">
						{#each category.options as option}
							<Button
								variant={key === 'rating'
									? isRatingSelected(option.value)
										? 'default'
										: 'outline'
									: isDiscountSelected(option.id, option.value)
										? 'default'
										: 'outline'}
								onclick={() => toggleFilter(option.id, key, option.value)}
								class="rounded-3xl capitalize hover:border-primary"
							>
								{#if category.name === 'Rating'}
									<Star class="mr-1 h-4 w-4" />
								{/if}
								{#if category.name === 'Discount'}
									<Tag class="mr-1 h-4 w-4" />
								{/if}
								{option.name}
							</Button>
						{/each}
					</div>
				</div>
			{/each}

			<div>
				<h2 class="font-display mb-3 text-xl font-semibold capitalize">Opening Status</h2>
				<div class="flex items-center gap-2">
					<div class="flex items-center space-x-2">
						<Checkbox.Root id="open-now" checked={openNow} onCheckedChange={handleOpenNowChange} />
						<label for="open-now" class="flex items-center gap-2 text-sm font-medium leading-none">
							<Clock class="h-4 w-4" /> Open Now
						</label>
					</div>
				</div>
			</div>

			<div>
				<h2 class="font-display mb-3 text-xl font-semibold capitalize">Delivery Fee</h2>
				<div class="space-y-4">
					<Slider
						class="relative flex w-full touch-none select-none items-center"
						value={deliveryFeeRange}
						onValueChange={handleSliderChange}
						min={DEFAULT_MIN_FEE}
						max={DEFAULT_MAX_FEE}
						step={100}
						type="multiple"
					/>
					<div class="flex justify-between">
						<span class="text-sm">{formatCurrency(DEFAULT_MIN_FEE)}</span>
						<span class="font-medium">
							{formatCurrency(deliveryFeeRange[0])} - {formatCurrency(deliveryFeeRange[1])}
						</span>
						<span class="text-sm">{formatCurrency(DEFAULT_MAX_FEE)}</span>
					</div>
				</div>
			</div>

			<div>
				<h2 class="font-display mb-3 text-xl font-semibold capitalize">Sort by</h2>
				<div class="flex flex-wrap items-center gap-2">
					{#each sortOptions as name}
						<Button
							variant={selectedSort === name ? 'default' : 'outline'}
							onclick={() => selectSort(name)}
							class="rounded-3xl capitalize hover:border-primary"
						>
							{name}
						</Button>
					{/each}
				</div>
			</div>
		</div>

		<div class="sticky bottom-0 grid grid-cols-2 gap-2 bg-background p-3">
			<Button onclick={resetFilters} class="w-full shadow-md" size="lg" variant="outline">
				Reset
			</Button>
			<Button onclick={applyFilters} class="w-full shadow-md" size="lg">Apply Filters</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<Button variant="link" onclick={() => (open = true)} class="group relative">
	{#if appliedFilterCount > 1}
		<span
			class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
		>
			{appliedFilterCount}
		</span>
	{/if}
	<span class="hidden md:inline-flex">
		sorted by <span class="font-semibold">{activeSort}</span>
	</span>
	<div
		class="flex items-center justify-center rounded-full bg-primary/20 p-3 group-hover:bg-primary/30"
	>
		<SlidersHorizontal class=" h-4 w-4 transition-colors " />
	</div>
</Button>
