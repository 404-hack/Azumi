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
	import { enhance } from '$app/forms';
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
	import * as Dialog from '$lib/components/ui/dialog';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	export let data = {
		inventories: [
			{
				web_id: '1',
				description: 'Test product',
				is_active: true,
				is_digital: false,
				retail_price: 100,
				discount_price: 80,
				stocks: [
					{
						units: 100
					}
				],
				media: ['https://via.placeholder.com/64x64']
			},
			{
				web_id: '2',
				description: 'Test product 2',
				is_active: false,
				is_digital: true,
				retail_price: 200,
				discount_price: 150,
				stocks: [
					{
						units: 200
					}
				],
				media: ['https://via.placeholder.com/64x64']
			}
		]
	};
	export let form = {
		error: null,
		message: null
	};
	let deleteModalState = false;
	$: {
		if (form?.error) {
			toast.error(form.error);
			deleteModalState = false;
		}
		if (form?.message) {
			toast.success(form.message);
			deleteModalState = false;
		}
	}
	let productInventory: any = {};
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
						<Button href="add-inventory" size="sm" class="h-8 gap-1">
							<CirclePlus class="h-3.5 w-3.5" />
							<span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
								Add Product inventories
							</span>
						</Button>
					</div>
				</div>
				<Tabs.Content value="all">
					<Card.Root>
						<Card.Header>
							<Card.Title>Products inventories</Card.Title>
							<Card.Description>Manage your products inventories.</Card.Description>
						</Card.Header>
						<Card.Content>
							{#if data.inventories.length > 0}
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head class="hidden w-[100px] sm:table-cell">
												<span class="sr-only">Image</span>
											</Table.Head>
											<Table.Head>Description</Table.Head>
											<Table.Head>Active</Table.Head>
											<Table.Head>Digital</Table.Head>
											<Table.Head>Retail price</Table.Head>
											<Table.Head>Discount price</Table.Head>
											<Table.Head>units</Table.Head>

											<Table.Head class="ml-auto">
												<span class="sr-only">Actions</span>
											</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each data.inventories as inventory}
											<Table.Row
												onclick={() => {
													goto(`inventories/${inventory.web_id}/edit-inventory`);
												}}
											>
												<Table.Cell class="hidden sm:table-cell">
													<img
														alt="Product example"
														class="aspect-square rounded-md object-cover"
														height="64"
														src={inventory.media[0]}
														width="64"
													/>
												</Table.Cell>
												<Table.Cell class="max-w-[100px] truncate  font-medium"
													>{inventory.description}</Table.Cell
												>

												<Table.Cell class="max-w-[100px] font-medium  capitalize">
													{#if inventory.is_active}
														<Badge class="bg-green-500">
															{inventory.is_active}
														</Badge>
													{:else}
														<Badge variant="secondary">
															{inventory.is_active}
														</Badge>
													{/if}
												</Table.Cell>

												<Table.Cell class="max-w-[100px] font-medium  capitalize">
													{#if inventory.is_digital}
														<Badge class="bg-green-500">
															{inventory.is_digital}
														</Badge>
													{:else}
														<Badge variant="secondary">
															{inventory.is_digital}
														</Badge>
													{/if}
												</Table.Cell>
												<Table.Cell class="max-w-[100px] truncate  font-medium"
													>{inventory.retail_price}</Table.Cell
												>
												<Table.Cell class="max-w-[100px] truncate  font-medium"
													>{inventory.discount_price || 0}</Table.Cell
												>
												<Table.Cell class="max-w-[100px] truncate  font-medium"
													>{inventory.stocks[0].units}</Table.Cell
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

															<DropdownMenu.Item
																onclick={() => {
																	productInventory = inventory;
																	deleteModalState = true;
																}}
																class="text-destructive">Delete</DropdownMenu.Item
															>
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
									<p class="text-center text-sm text-muted-foreground">
										No inventories for this product
									</p>
								</div>
							{/if}
						</Card.Content>
						<Card.Footer></Card.Footer>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</main>
	</div>
</div>
<Dialog.Root bind:open={deleteModalState}>
	<Dialog.Content class="w-full p-5">
		<Dialog.Header class="mt-10">
			<Dialog.Title class="font-display text-lg ">Are you sure absolutely sure?</Dialog.Title>
			<Dialog.Description>
				This action cannot be undone. This will permanently delete this inventory
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="/seller/products/{$page.params.productSlug}/inventories"
			use:enhance
		>
			<input type="text" value={productInventory.web_id} hidden name="webId" />

			<div class="flex items-center justify-between gap-2">
				<Button
					class="w-full "
					onclick={() => {
						deleteModalState = false;
					}}
					variant="secondary"
				>
					Cancel
				</Button>

				<Button class="w-full" variant="destructive" type="submit">Delete</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
