<script lang="ts">
	import File from 'lucide-svelte/icons/file';
	import Home from 'lucide-svelte/icons/home';
	import LineChart from 'lucide-svelte/icons/line-chart';
	import ListFilter from 'lucide-svelte/icons/list-filter';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Package from 'lucide-svelte/icons/package';
	import Package2 from 'lucide-svelte/icons/package-2';
	import PanelLeft from 'lucide-svelte/icons/panel-left';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import Search from 'lucide-svelte/icons/search';
	import Settings from 'lucide-svelte/icons/settings';
	import ShoppingCart from 'lucide-svelte/icons/shopping-cart';
	import UsersRound from 'lucide-svelte/icons/users-round';

	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { CookingPot } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	const products = [
		{ name: 'Product 1', description: 'This is a product', slug: 'product-1' },
		{ name: 'Product 2', description: 'This is a product', slug: 'product-2' },
		{ name: 'Product 3', description: 'This is a product', slug: 'product-3' },
		{ name: 'Product 4', description: 'This is a product', slug: 'product-4' },
		{ name: 'Product 5', description: 'This is a product', slug: 'product-5' },
		{ name: 'Product 6', description: 'This is a product', slug: 'product-6' },
		{ name: 'Product 7', description: 'This is a product', slug: 'product-7' },
		{ name: 'Product 8', description: 'This is a product', slug: 'product-8' },
		{ name: 'Product 9', description: 'This is a product', slug: 'product-9' },
		{ name: 'Product 10', description: 'This is a product', slug: 'product-10' }
	];
</script>

<div class="flex min-h-screen w-full flex-col bg-muted/40">
	<div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
		<header
			class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6"
		>
			<div class="relative ml-auto flex-1 md:grow-0">
				<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search..."
					class="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
				/>
			</div>
		</header>
		<main class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
			<Tabs.Root value="all">
				<div class="flex items-center">
					<Tabs.List>
						<Tabs.Trigger value="all">All</Tabs.Trigger>
					</Tabs.List>
					<div class="ml-auto flex items-center gap-2">
						<Button href="/seller/products/add" size="sm" class="h-8 gap-1">
							<CirclePlus class="h-3.5 w-3.5" />
							<span class="sr-only sm:not-sr-only sm:whitespace-nowrap"> Add Product </span>
						</Button>
					</div>
				</div>
				<Tabs.Content value="all">
					<Card.Root>
						<Card.Header>
							<Card.Title>Products</Card.Title>
							<Card.Description>Manage your products.</Card.Description>
						</Card.Header>
						<Card.Content>
							{#if products.length > 0}
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Name</Table.Head>
											<Table.Head>Description</Table.Head>

											<Table.Head class="ml-auto">
												<span class="sr-only">Actions</span>
											</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each products as product}
											<Table.Row>
												<Table.Cell
													class="font-medium hover:cursor-pointer hover:text-primary"
													on:click={() => {
														goto(`/seller/products/${product.slug}/inventories`);
													}}>{product.name}</Table.Cell
												>
												<Table.Cell class="max-w-[100px] truncate  font-medium"
													>{product.description}</Table.Cell
												>

												<Table.Cell class="ml-auto text-right ">
													<DropdownMenu.Root>
														<DropdownMenu.Trigger>
															<Button aria-haspopup="true" size="icon" variant="ghost">
																<Ellipsis class="h-4 w-4" />
																<span class="sr-only">Toggle menu</span>
															</Button>
														</DropdownMenu.Trigger>
														<DropdownMenu.Content align="end">
															<DropdownMenu.Label>Actions</DropdownMenu.Label>
															<DropdownMenu.Item>Edit</DropdownMenu.Item>
															<DropdownMenu.Item>Add inventory</DropdownMenu.Item>
															<DropdownMenu.Item class="text-destructive">Delete</DropdownMenu.Item>
														</DropdownMenu.Content>
													</DropdownMenu.Root>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							{:else}
								<div class=" mx-auto flex size-32 flex-col items-center justify-center gap-3">
									<CookingPot class="size-5  " />
									<p class="text-center text-sm text-muted-foreground">No Products</p>
								</div>
							{/if}
						</Card.Content>
						<Card.Footer>
							<!-- <div class="text-xs text-muted-foreground">
								Showing <strong>1-10</strong> of <strong>32</strong> products
							</div> -->
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</main>
	</div>
</div>
