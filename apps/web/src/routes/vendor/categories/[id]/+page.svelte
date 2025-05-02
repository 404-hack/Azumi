<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		ArrowLeft,
		Edit,
		Plus,
		ChevronRight,
		ChevronDown,
		ChevronUp,
		MoreVertical,
		ExternalLink
	} from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import { goto } from '$app/navigation';
	import { addCategoryModalState } from '$lib/states/modalState.svelte';
	import AddCategoryModal from '$lib/components/modal/AddCategoryModal.svelte';

	export let data;
	const { category } = data;

	function goBack() {
		goto('/vendor/categories');
	}

	function editCategory() {
		goto(`/vendor/categories/${category.id}/edit`);
	}

	function addMenuItem() {
		goto('/vendor/menu/add-menu', { state: { preSelectedCategory: category.id } });
	}

	// Sort functionality
	let sortField = 'name';
	let sortDirection = 'asc';

	function toggleSort(field: string) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
	}

	$: sortedMenus = category?.menus
		? [...category.menus].sort((a, b) => {
				const modifier = sortDirection === 'asc' ? 1 : -1;
				if (sortField === 'price') {
					return (a.price - b.price) * modifier;
				} else {
					return a[sortField].localeCompare(b[sortField]) * modifier;
				}
			})
		: [];

	// For responsive display
	let isMobileView = false;
	// For window detection during SSR
	let browser = typeof window !== 'undefined';
	let windowWidth = browser ? window.innerWidth : 1024;

	// Toggle between table and card view on mobile
	function toggleMobileView() {
		isMobileView = !isMobileView;
	}

	// Handle window resize
	function handleResize() {
		if (browser) {
			windowWidth = window.innerWidth;
			// Auto-switch to table view on larger screens
			if (windowWidth >= 768) {
				isMobileView = false;
			}
		}
	}

	// Set up resize listener
	import { onMount, onDestroy } from 'svelte';
	import { formatCurrency } from '$lib/utils.js';

	let resizeObserver: any;

	onMount(() => {
		if (browser) {
			windowWidth = window.innerWidth;
			window.addEventListener('resize', handleResize);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', handleResize);
		}
	});
</script>

<AddCategoryModal />

<div class="mx-auto w-full max-w-screen-xl px-3 py-4 sm:px-4 sm:py-6">
	<!-- Breadcrumb and header -->
	<div class="mb-4 sm:mb-6">
		<div class="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
			<button class="transition-colors hover:text-foreground" on:click={goBack}>Categories</button>
			<ChevronRight class="h-4 w-4" />
			<span class="truncate font-medium text-foreground">{category?.name}</span>
		</div>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-2">
				<h1 class="text-lg font-semibold tracking-tight sm:text-xl">{category?.name}</h1>
				<Badge
					variant={category?.published ? 'default' : 'secondary'}
					class="rounded-md px-2 py-0.5 text-xs"
				>
					{category?.published ? 'Published' : 'Draft'}
				</Badge>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" size="sm" on:click={editCategory} class="text-xs sm:text-sm">
					<Edit class="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
					<span class="hidden sm:inline">Edit Details</span>
					<span class="sm:hidden">Edit</span>
				</Button>
			</div>
		</div>
	</div>
	<!-- Category Info Section -->
	<div class="mb-4 rounded-md border border-border bg-background sm:mb-6">
		<div class="border-b border-border p-3 sm:p-4">
			<h2 class="text-sm font-medium">Category Info</h2>
		</div>
		<div
			class="xs:grid-cols-2 grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-2 md:grid-cols-4 md:divide-y-0"
		>
			<div class="p-3 sm:p-4">
				<p class="mb-1 text-xs font-medium text-muted-foreground">ID</p>
				<p class="truncate font-mono text-xs sm:text-sm">{category.id}</p>
			</div>
			<div class="p-3 sm:p-4">
				<p class="mb-1 text-xs font-medium text-muted-foreground">Status</p>
				<Badge
					variant={category.published ? 'default' : 'secondary'}
					class="mt-1 rounded-md text-xs"
				>
					{category.published ? 'Published' : 'Draft'}
				</Badge>
			</div>
			<div class="p-3 sm:p-4">
				<p class="mb-1 text-xs font-medium text-muted-foreground">Created</p>
				<p class="text-xs sm:text-sm">{new Date(category.createdAt).toLocaleDateString()}</p>
			</div>
			<div class="p-3 sm:p-4">
				<p class="mb-1 text-xs font-medium text-muted-foreground">Updated</p>
				<p class="text-xs sm:text-sm">{new Date(category.updatedAt).toLocaleDateString()}</p>
			</div>
		</div>
	</div>
	<!-- Menu Items Section -->
	<div class="rounded-md border border-border">
		<div
			class="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 sm:p-4"
		>
			<h2 class="font-medium">Menu Items</h2>
			<div class="flex items-center gap-2">
				<div class="hidden sm:block md:hidden lg:hidden">
					<Button variant="outline" size="sm" class="h-8 px-2" on:click={toggleMobileView}>
						{#if isMobileView}
							<span class="text-xs">Table View</span>
						{:else}
							<span class="text-xs">Grid View</span>
						{/if}
					</Button>
				</div>
			</div>
		</div>
		{#if category?.menus && category.menus.length > 0}
			<!-- Mobile Card View (toggle between table and card view) -->
			{#if isMobileView && browser && windowWidth < 768}
				<div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:hidden">
					{#each sortedMenus as item}
						<div class="rounded-md border border-border bg-card p-3">
							<div class="flex items-start gap-3">
								<div
									class="flex h-14 w-14 items-center justify-center overflow-hidden rounded bg-muted"
								>
									{#if item.image}
										<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
									{:else}
										<div class="text-xs text-muted-foreground">No img</div>
									{/if}
								</div>
								<div class="flex-1">
									<p class="font-medium">{item.name}</p>
									<p class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
										{item.description || 'No description'}
									</p>
									<div class="mt-2 flex items-center justify-between">
										<div class="flex flex-wrap items-center gap-2">
											<span class="text-sm font-medium">{formatCurrency(item.price)}</span>
											<Badge
												variant={item.inStock ? 'outline' : 'destructive'}
												class="rounded-md px-1.5 py-0.5 text-[10px]"
											>
												{item.inStock ? 'In Stock' : 'Out of Stock'}
											</Badge>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Table View (default and desktop) -->
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b border-border bg-muted/30">
								<th
									class="w-12 px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3"
								></th>
								<th
									class="cursor-pointer px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3"
									on:click={() => toggleSort('name')}
								>
									<div class="flex items-center gap-1">
										Name
										{#if sortField === 'name'}
											{#if sortDirection === 'asc'}
												<ChevronUp class="h-3 w-3" />
											{:else}
												<ChevronDown class="h-3 w-3" />
											{/if}
										{/if}
									</div>
								</th>
								<th
									class="cursor-pointer px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3"
									on:click={() => toggleSort('price')}
								>
									<div class="flex items-center gap-1">
										Price
										{#if sortField === 'price'}
											{#if sortDirection === 'asc'}
												<ChevronUp class="h-3 w-3" />
											{:else}
												<ChevronDown class="h-3 w-3" />
											{/if}
										{/if}
									</div>
								</th>
								<th
									class="hidden px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell sm:px-4 sm:py-3"
									>Stock</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each sortedMenus as item}
								<tr class="transition-colors hover:bg-muted/20">
									<td class="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3">
										<div
											class="flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-muted sm:h-10 sm:w-10"
										>
											{#if item.image}
												<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
											{:else}
												<div class="text-xs text-muted-foreground">No img</div>
											{/if}
										</div>
									</td>
									<td class="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3">
										<div>
											<p class="text-xs font-medium sm:text-sm">{item.name}</p>
											<p
												class="hidden max-w-[150px] truncate text-xs text-muted-foreground sm:block sm:max-w-xs"
											>
												{item.description || 'No description'}
											</p>
										</div>
									</td>
									<td class="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3">
										<span class="text-xs font-medium sm:text-sm">{formatCurrency(item.price)}</span>
									</td>
									<td class="hidden whitespace-nowrap px-2 py-2 sm:table-cell sm:px-4 sm:py-3">
										<Badge
											variant={item.inStock ? 'outline' : 'destructive'}
											class="rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:py-0.5 sm:text-xs"
										>
											{item.inStock ? 'In Stock' : 'Out of Stock'}
										</Badge>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{:else}
			<div class="flex flex-col items-center justify-center p-4 py-8 text-center sm:p-8 sm:py-12">
				<div class="mb-4 rounded-full bg-muted/30 p-3">
					<Plus class="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
				</div>
				<h3 class="text-sm font-medium sm:text-base">No menu items</h3>
				<p class="mb-4 mt-1 max-w-xs text-xs text-muted-foreground sm:mb-6 sm:max-w-sm sm:text-sm">
					This category doesn't have any menu items yet.
				</p>
			</div>
		{/if}
	</div>
</div>
