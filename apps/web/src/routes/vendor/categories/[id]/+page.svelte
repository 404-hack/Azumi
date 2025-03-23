<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Edit, Plus, ChevronRight, ChevronDown, ChevronUp } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
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

	function toggleSort(field) {
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
	let showDetailsSidebar = true;
</script>

<AddCategoryModal />

<div class="mx-auto max-w-screen-xl px-4 py-6">
	<!-- Breadcrumb and header -->
	<div class="mb-6">
		<div class="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
			<button class="transition-colors hover:text-foreground" on:click={goBack}>Categories</button>
			<ChevronRight class="h-4 w-4" />
			<span class="truncate font-medium text-foreground">{category?.name}</span>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<h1 class="text-xl font-semibold tracking-tight">{category?.name}</h1>
				<Badge
					variant={category?.published ? 'default' : 'secondary'}
					class="rounded-md px-2 py-0.5 text-xs"
				>
					{category?.published ? 'Published' : 'Draft'}
				</Badge>
			</div>
			<div class="flex gap-3">
				<Button variant="outline" size="sm" on:click={editCategory}>
					<Edit class="mr-2 h-4 w-4" />
					Edit Details
				</Button>
				<Button size="sm" on:click={addMenuItem}>
					<Plus class="mr-2 h-4 w-4" />
					Add Item
				</Button>
			</div>
		</div>
	</div>

	<!-- Category Info Section (horizontal layout) -->
	<div class="mb-6 rounded-md border border-border bg-background">
		<div class="border-b border-border p-4">
			<h2 class="text-sm font-medium">Category Info</h2>
		</div>
		<div class="grid grid-cols-1 divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
			<div class="p-4">
				<p class="mb-1 text-xs font-medium text-muted-foreground">ID</p>
				<p class="truncate font-mono text-sm">{category.id}</p>
			</div>
			<div class="p-4">
				<p class="mb-1 text-xs font-medium text-muted-foreground">Status</p>
				<Badge
					variant={category.published ? 'default' : 'secondary'}
					class="mt-1 rounded-md text-xs"
				>
					{category.published ? 'Published' : 'Draft'}
				</Badge>
			</div>
			<div class="p-4">
				<p class="mb-1 text-xs font-medium text-muted-foreground">Created</p>
				<p class="text-sm">{new Date(category.createdAt).toLocaleDateString()}</p>
			</div>
			<div class="p-4">
				<p class="mb-1 text-xs font-medium text-muted-foreground">Updated</p>
				<p class="text-sm">{new Date(category.updatedAt).toLocaleDateString()}</p>
			</div>
		</div>
	</div>

	<!-- Menu Items Section -->
	<div class="rounded-md border border-border">
		<div class="flex items-center justify-between border-b border-border p-4">
			<h2 class="font-medium">Menu Items</h2>
			<Button variant="outline" size="sm" class="h-8 px-3" on:click={addMenuItem}>
				<Plus class="mr-2 h-3.5 w-3.5" />
				Add Item
			</Button>
		</div>

		{#if category?.menus && category.menus.length > 0}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-border bg-muted/30">
							<th
								class="w-12 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
							></th>
							<th
								class="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
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
								class="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
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
								class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
								>Stock</th
							>
							<th
								class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"
								>Actions</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each sortedMenus as item}
							<tr class="transition-colors hover:bg-muted/20">
								<td class="whitespace-nowrap px-4 py-3">
									<div
										class="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-muted"
									>
										{#if item.image}
											<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
										{:else}
											<div class="text-xs text-muted-foreground">No img</div>
										{/if}
									</div>
								</td>
								<td class="whitespace-nowrap px-4 py-3">
									<div>
										<p class="text-sm font-medium">{item.name}</p>
										<p class="max-w-xs truncate text-xs text-muted-foreground">
											{item.description || 'No description'}
										</p>
									</div>
								</td>
								<td class="whitespace-nowrap px-4 py-3">
									<span class="font-medium">${item.price.toFixed(2)}</span>
								</td>
								<td class="whitespace-nowrap px-4 py-3">
									<Badge
										variant={item.inStock ? 'outline' : 'destructive'}
										class="rounded-md px-2 py-0.5 text-xs font-medium"
									>
										{item.inStock ? 'In Stock' : 'Out of Stock'}
									</Badge>
								</td>
								<td class="whitespace-nowrap px-4 py-3 text-right">
									<div class="flex justify-end gap-2">
										<Button
											variant="ghost"
											size="sm"
											class="h-7 px-2 text-xs"
											on:click={() => goto(`/vendor/menu/${item.id}`)}
										>
											View
										</Button>
										<Button
											variant="outline"
											size="sm"
											class="h-7 px-2 text-xs"
											on:click={() => goto(`/vendor/menu/${item.id}/edit`)}
										>
											Edit
										</Button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center p-8 py-12 text-center">
				<div class="mb-4 rounded-full bg-muted/30 p-3">
					<Plus class="h-5 w-5 text-muted-foreground" />
				</div>
				<h3 class="text-base font-medium">No menu items</h3>
				<p class="mb-6 mt-1 max-w-sm text-sm text-muted-foreground">
					This category doesn't have any menu items yet. Add your first item to get started.
				</p>
				<Button on:click={addMenuItem}>
					<Plus class="mr-2 h-4 w-4" />
					Add First Menu Item
				</Button>
			</div>
		{/if}
	</div>
</div>
