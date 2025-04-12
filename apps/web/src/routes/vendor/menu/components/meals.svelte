<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Plus,
		Search,
		Image as ImageIcon,
		MoreVertical,
		Clock,
		Star,
		Pencil,
		Settings,
		BarChart2,
		Trash
	} from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Select from '$lib/components/ui/select';
	import type { TMenuCategoryWithItems } from '@repo/server/types';
	import { goto } from '$app/navigation';

	// Enhanced meal type for food delivery platform
	type Props = {
		menuCategoryWithItems: TMenuCategoryWithItems[];
	};

	let selectedCategory = $state('all');
	let searchQuery = $state('');

	let activeCategory = $state('');
	let { menuCategoryWithItems }: Props = $props();
	console.log('🚀 ~ menuCategoryWithItems:', menuCategoryWithItems);
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
			<div class="scrollbar-none -mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2">
				{#each menuCategoryWithItems as category}
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
										{#each category.menus as meal}
											<Table.Row>
												<Table.Cell>
													<div class="flex items-center gap-3">
														<div
															class="flex h-12 w-12 items-center justify-center rounded-md bg-muted"
														>
															{#if meal.image}
																<img
																	src={meal.image}
																	alt={meal.name}
																	class="h-full w-full rounded-md object-cover"
																/>
															{:else}
																<ImageIcon class="h-6 w-6 text-muted-foreground" />
															{/if}
														</div>
														<div>
															<p class="font-medium">{meal.name}</p>
															<p class="text-sm text-muted-foreground">{meal.description}</p>
														</div>
													</div>
												</Table.Cell>
												<Table.Cell>${meal.price}</Table.Cell>
												<Table.Cell>
													<Badge variant={meal.inStock === true ? 'default' : 'destructive'}>
														{meal.inStock}
													</Badge>
												</Table.Cell>
												<Table.Cell class="text-right">
													<ResponsiveDropdown>
														{#snippet trigger()}
															<Button variant="ghost" size="icon">
																<MoreVertical class="h-4 w-4" />
																<span class="sr-only">Open menu</span>
															</Button>
														{/snippet}
														{#snippet children()}
															<button
																class="dropdown-menu-item"
																onclick={() => {
																	goto(`/vendor/menu/${meal.id}/`);
																}}
															>
																<Pencil class="mr-2 h-4 w-4" />
																Edit Item
															</button>
															<button class="dropdown-menu-item">
																<Settings class="mr-2 h-4 w-4" />
																Manage Options
															</button>
															<button class="dropdown-menu-item">
																<BarChart2 class="mr-2 h-4 w-4" />
																View Analytics
															</button>
															<div class="dropdown-menu-separator" />
															<button class="dropdown-menu-item text-destructive">
																<Trash class="mr-2 h-4 w-4" />
																Delete Item
															</button>
														{/snippet}
													</ResponsiveDropdown>
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
	{/if}

	<!-- Card view (visible only on mobile) -->
	<!-- <div class="md:hidden">
		{#each uniqueCategories as category}
			<div id={getCategoryId(category)} class="mb-6">
				<h3 class="mb-4 text-lg font-medium">{category}</h3>
				<div class="grid grid-cols-1 gap-4">
					{#each groupedMeals[category] as meal}
						<div class="rounded-lg border p-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
										{#if meal.image}
											<img
												src={meal.image}
												alt={meal.name}
												class="h-full w-full rounded-md object-cover"
											/>
										{:else}
											<ImageIcon class="h-8 w-8 text-muted-foreground" />
										{/if}
									</div>
									<div>
										<h3 class="font-medium">{meal.name}</h3>
										<Badge variant={meal.status === 'available' ? 'default' : 'destructive'}>
											{meal.status}
										</Badge>
									</div>
								</div>
								<div class="flex flex-col items-end gap-2">
									<span class="text-lg font-semibold">${meal.price}</span>
									<ResponsiveDropdown>
										{#snippet trigger()}
											<Button variant="ghost" size="icon">
												<MoreVertical class="h-4 w-4" />
												<span class="sr-only">Open menu</span>
											</Button>
										{/snippet}
										{#snippet children()}
											<button class="dropdown-menu-item" on:click={() => {}}>
												<Pencil class="mr-2 h-4 w-4" />
												Edit Item
											</button>
											<button class="dropdown-menu-item" on:click={() => {}}>
												<Settings class="mr-2 h-4 w-4" />
												Manage Options
											</button>
											<button class="dropdown-menu-item" on:click={() => {}}>
												<BarChart2 class="mr-2 h-4 w-4" />
												View Analytics
											</button>
											<div class="dropdown-menu-separator" />
											<button class="dropdown-menu-item text-destructive" on:click={() => {}}>
												<Trash class="mr-2 h-4 w-4" />
												Delete Item
											</button>
										{/snippet}
									</ResponsiveDropdown>
								</div>
							</div>

							<details class="mt-4">
								<summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
									Show more details
								</summary>
								<div class="mt-4 space-y-4">
									<p class="text-sm text-muted-foreground">{meal.description}</p>

									<div class="grid grid-cols-2 gap-4 text-sm">
										<div class="flex items-center gap-1">
											<Clock class="h-4 w-4 text-muted-foreground" />
											<span>{meal.prepTime}min</span>
										</div>
										<div class="flex items-center gap-1">
											<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
											<span>{meal.rating}</span>
											<span class="text-muted-foreground">({meal.ordersCount})</span>
										</div>
									</div>
								</div>
							</details>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div> -->
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
