<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	import {
		Search,
		Image as ImageIcon,
		MoreVertical,
		Clock,
		Star,
		Pencil,
		Settings,
		BarChart2,
		Trash,
		Plus
	} from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Select from '$lib/components/ui/select';
	import type { TMenuCategoryWithItems } from '@repo/server/types';
	import { goto } from '$app/navigation';
	import { deleteModalState } from '$lib/states/modalState.svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { client } from '$lib/hc';
	import { formatCurrency } from '$lib/utils';

	// Enhanced meal type for food delivery platform
	type Props = {
		menuCategoryWithItems: TMenuCategoryWithItems[];
	};
	let selectedCategory = $state('all');
	let searchQuery = $state('');

	let activeCategory = $state('');
	let { menuCategoryWithItems }: Props = $props();
	async function deleteMenuItem(id: string, name: string) {
		deleteModalState.openDelete({
			itemName: name,
			loading: false,
			handleConfirm: async () => {
				try {
					// Set loading state
					deleteModalState.setLoading(true);

					// Call API to delete the menu item
					const res = await client.vendor.menu[':id'].$delete({
						param: { id }
					});

					if (res.ok) {
						toast.success('Menu item deleted successfully');
						await invalidateAll();
						deleteModalState.close();
					} else {
						toast.error('Failed to delete menu item');
						deleteModalState.setLoading(false);
					}
				} catch (error) {
					console.error('Error deleting menu item:', error);
					toast.error('Something went wrong while deleting the menu item');
					deleteModalState.setLoading(false);
				}
			}
		});
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold tracking-tight">Menu Items</h2>
		<Button href="/vendor/menu/add-menu" class="h-9 px-3 sm:px-4">
			<Plus class="h-4 w-4 sm:mr-2" />
			<span class="hidden sm:inline">Add Menu Item</span>
		</Button>
	</div>

	{#if !menuCategoryWithItems.length}
		<div
			class="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center"
		>
			<div class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
				<ImageIcon class="h-10 w-10 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-semibold">No menu items</h3>
				<p class="mb-4 mt-2 text-sm text-muted-foreground">
					You haven't added any menu items yet. Start by adding your first dish.
				</p>
				<Button href="/vendor/menu/add-menu">
					<Plus class="mr-2 h-4 w-4" />
					Add Menu Item
				</Button>
			</div>
		</div>
	{:else}
		<!-- Category Navigation -->
		<div
			class="category-nav sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div class=" -mx-2 flex w-[300px] snap-x snap-mandatory gap-2 whitespace-nowrap px-2">
				{#each menuCategoryWithItems as category, i}
					<button
						type="button"
						class="inline-flex shrink-0 snap-start items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						{category.name}
					</button>
				{/each}
			</div>
		</div>

		<!-- Table view (hidden on mobile) -->
		<div class="hidden space-y-6 md:block">
			{#each menuCategoryWithItems as category, i}
				<details class="group rounded-lg border" open={i === 0}>
					<summary
						class="flex cursor-pointer items-center justify-between px-4 py-3 font-medium hover:bg-muted/50"
					>
						<h3 class="text-lg">{category.name}</h3>
						<svg
							class="h-5 w-5 transition-transform group-open:rotate-180"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<path
								fill="none"
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="m6 9 6 6 6-6"
							/>
						</svg>
					</summary>
					<div class="px-4 pb-4">
						{#if category.menus.length === 0}
							<div
								class="flex h-[200px] items-center justify-center rounded-md border border-dashed"
							>
								<p class="text-sm text-muted-foreground">No items in this category</p>
							</div>
						{:else}
							<div class="rounded-md border">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Item</Table.Head>
											<Table.Head>Price</Table.Head>
											<Table.Head>Status</Table.Head>
											<Table.Head class="text-right">Actions</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each category.menus as meal}											<Table.Row 
												class="cursor-pointer hover:bg-muted/50 transition-colors group"
												onclick={() => goto(`/vendor/menu/${meal.id}/edit`)}
											>
												<Table.Cell>
													<div class="flex items-center gap-3">
														<div
															class="flex h-12 w-12 items-center justify-center rounded-md bg-muted"
														>
															{#if meal.imageUrl}
																<img
																	src={meal.imageUrl}
																	alt={meal.name}
																	class="h-full w-full rounded-md object-cover"
																/>
															{:else}
																<ImageIcon class="h-6 w-6 text-muted-foreground" />
															{/if}
														</div>
														<div>
															<p class="font-medium">{meal.name}</p>
															<p
																class="w-full max-w-[200px] truncate text-sm text-muted-foreground"
															>
																{meal.description}
															</p>
														</div>
													</div>
												</Table.Cell>
												<Table.Cell>{formatCurrency(meal.price)}</Table.Cell>
												<Table.Cell>
													<Badge variant={meal.inStock === true ? 'default' : 'destructive'}>
														{meal.inStock ? 'In Stock' : 'Out of Stock'}
													</Badge>
												</Table.Cell>
												<Table.Cell class="text-right">
													<Button
														variant="ghost"
														size="sm"
														class="text-destructive"
														onclick={(e) => {
															e.stopPropagation();
															deleteMenuItem(meal.id, meal.name);
														}}
													>
														<Trash class="h-4 w-4" />
													</Button>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						{/if}
					</div>
				</details>
			{/each}
		</div>

		<!-- Card view (visible only on mobile) -->
		<div class="space-y-6 md:hidden">
			{#each menuCategoryWithItems as category}
				<details class="group rounded-lg border" open={category === menuCategoryWithItems[0]}>
					<summary
						class="flex cursor-pointer items-center justify-between px-4 py-3 font-medium hover:bg-muted/50"
					>
						<h3 class="text-lg">{category.name}</h3>
						<svg
							class="h-5 w-5 transition-transform group-open:rotate-180"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<path
								fill="none"
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="m6 9 6 6 6-6"
							/>
						</svg>
					</summary>
					<div class="px-4 pb-4">
						{#if category.menus.length === 0}
							<div
								class="flex h-[200px] items-center justify-center rounded-md border border-dashed"
							>
								<p class="text-sm text-muted-foreground">No items in this category</p>
							</div>
						{:else}
							<div class="grid grid-cols-1 gap-4">
								{#each category.menus as meal}									<button 
										class="rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
										onclick={() => goto(`/vendor/menu/${meal.id}/edit`)}
									>
										<div class="group flex items-center justify-between">
											<div class="flex items-center gap-3">
												<div class="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
													{#if meal.imageUrl}
														<img
															src={meal.imageUrl}
															alt={meal.name}
															class="h-full w-full rounded-md object-cover"
														/>
													{:else}
														<ImageIcon class="h-8 w-8 text-muted-foreground" />
													{/if}
												</div>
												<div>
													<h3 class="font-medium">{meal.name}</h3>
													<Badge variant={meal.inStock === true ? 'default' : 'destructive'}>
														{meal.inStock ? 'In Stock' : 'Out of Stock'}
													</Badge>
												</div>
											</div>
											<div class="flex flex-col items-end gap-2">
												<span class="text-lg font-semibold">{formatCurrency(meal.price)}</span>
												<div class="flex gap-2">
													<Button
														variant="ghost"
														size="sm"
														class="text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
														onclick={(e) => {
															e.stopPropagation();
															deleteMenuItem(meal.id, meal.name);
														}}
													>
														<Trash class="h-4 w-4" />
													</Button>
												</div>
											</div>
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</details>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Hide scrollbar but keep functionality */
	.scrollbar-none {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
</style>
