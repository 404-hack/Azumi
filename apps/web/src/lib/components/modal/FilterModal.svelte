<script lang="ts">
	import Button from '../ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { SlidersHorizontal, Star, Truck, Tag, Clock } from 'lucide-svelte';
	import * as Checkbox from '$lib/components/ui/checkbox';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Slider } from '$lib/components/ui/slider';

	// Type definitions
	type FilterOption = {
		id: string;
		name: string;
	};

	// Static filter data
	const categorizedFacets = {
		category: {
			name: 'Category',
			options: [
				{ id: 'groceries', name: 'Groceries' },
				{ id: 'electronics', name: 'Electronics' },
				{ id: 'clothing', name: 'Clothing' },
				{ id: 'shoes', name: 'Shoes' },
				{ id: 'furniture', name: 'Furniture' }
			]
		},
		discount: {
			name: 'Discount',
			options: [
				{ id: 'any-discount', name: 'Any Discount' },
				{ id: 'discount-10', name: '10% Off' },
				{ id: 'discount-20', name: '20% Off' },
				{ id: 'discount-30', name: '30% Off' },
				{ id: 'discount-50', name: '50% Off' }
			]
		},
		rating: {
			name: 'Rating',
			options: [
				{ id: 'rating-5', name: '5 Stars' },
				{ id: 'rating-4', name: '4+ Stars' },
				{ id: 'rating-3', name: '3+ Stars' },
				{ id: 'rating-2', name: '2+ Stars' }
			]
		},
		availability: {
			name: 'Availability',
			options: [
				{ id: 'in-stock', name: 'In Stock' },
				{ id: 'out-of-stock', name: 'Out of Stock' }
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

	// State using Svelte 5 $state rune
	let deliveryTimeValue = $state([30]);
	let openNow = $state(false);
	let deliveryOption = $state('any');
	let selectedFilters = $state<string[]>([]);
	let activeSort = $state('recommended');

	// Props
	let { open = false } = $props();

	// Functions
	function toggleFilter(id: string) {
		if (selectedFilters.includes(id)) {
			selectedFilters = selectedFilters.filter((item) => item !== id);
		} else {
			selectedFilters = [...selectedFilters, id];
		}
	}

	function selectSort(name: string) {
		activeSort = name;
	}

	function applyFilters() {
		// Apply filters logic would go here
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class=" w-full overflow-y-auto">
		<Dialog.Header class="p-5">
			<Dialog.Title class=" text-3xl">Filter</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-8">
			{#each Object.entries(categorizedFacets) as [key, category]}
				<div>
					<h2 class="font-display mb-3 text-xl font-semibold capitalize">{category.name}</h2>
					<div class="flex flex-wrap items-center gap-2">
						{#each category.options as option}
							<Button
								variant={selectedFilters.includes(option.id) ? 'default' : 'outline'}
								onclick={() => toggleFilter(option.id)}
								class="rounded-3xl capitalize hover:border-primary"
							>
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
						<Checkbox.Root
							id="open-now"
							checked={openNow}
							onCheckedChange={(c) => (openNow = !!c)}
						/>
						<label for="open-now" class="flex items-center gap-2 text-sm font-medium leading-none">
							<Clock class="h-4 w-4" /> Open Now
						</label>
					</div>
				</div>
			</div>

			<div>
				<h2 class="font-display mb-3 text-xl font-semibold capitalize">Delivery Time</h2>
				<div class="space-y-4">
					<Slider
						class="relative flex w-full touch-none select-none items-center"
						value={deliveryTimeValue}
						max={120}
						min={10}
						step={5}
						onValueChange={(v) => (deliveryTimeValue = v)}
						type="multiple"
					/>
					<div class="flex justify-between">
						<span class="text-sm">10 min</span>
						<span class="font-medium">Within {deliveryTimeValue[0]} min</span>
						<span class="text-sm">120 min</span>
					</div>
				</div>
			</div>

			<div>
				<h2 class="font-display mb-3 text-xl font-semibold capitalize">Delivery Options</h2>
				<RadioGroup.Root value={deliveryOption} onValueChange={(v) => (deliveryOption = v)}>
					<div class="flex flex-col space-y-2">
						<div class="flex items-center space-x-2">
							<RadioGroup.Item value="any" id="any-delivery" />
							<label for="any-delivery" class="text-sm font-medium leading-none">
								Any Delivery
							</label>
						</div>
						<div class="flex items-center space-x-2">
							<RadioGroup.Item value="free" id="free-delivery" />
							<label
								for="free-delivery"
								class="flex items-center gap-2 text-sm font-medium leading-none"
							>
								<Truck class="h-4 w-4" /> Free Delivery
							</label>
						</div>
						<div class="flex items-center space-x-2">
							<RadioGroup.Item value="express" id="express-delivery" />
							<label for="express-delivery" class="text-sm font-medium leading-none">
								Express Delivery
							</label>
						</div>
					</div>
				</RadioGroup.Root>
			</div>

			<div>
				<h2 class="font-display mb-3 text-xl font-semibold capitalize">Sort by</h2>
				<div class="flex flex-wrap items-center gap-2">
					{#each sortOptions as name}
						<Button
							variant={activeSort === name ? 'default' : 'outline'}
							onclick={() => selectSort(name)}
							class="rounded-3xl capitalize hover:border-primary"
						>
							{name}
						</Button>
					{/each}
				</div>
			</div>
		</div>

		<div class="sticky bottom-0 flex space-x-2 bg-background p-3">
			<Button onclick={() => (open = false)} class="w-1/2 shadow-md" size="lg" variant="outline">
				Cancel
			</Button>
			<Button onclick={applyFilters} class="w-1/2 shadow-md" size="lg">Apply Filters</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<Button variant="link" size="icon" onclick={() => (open = true)} class="group">
	<SlidersHorizontal
		class=" size-20 rounded-full bg-primary/20  transition-colors group-hover:bg-primary/30"
	/>
</Button>
