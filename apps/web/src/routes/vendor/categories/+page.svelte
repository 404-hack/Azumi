<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import AddCategoryModal from '$lib/components/modal/AddCategoryModal.svelte';
	import { addCategoryModalState } from '$lib/states/modalState.svelte';
	import { Search, Edit, Trash, Plus, ArrowRight, FilterX } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';
	import { client } from '$lib/hc';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	// Local state management
	let searchQuery = $state('');
	let categories = $derived(data.categories);

	// Filter categories based on search query
	let filteredCategories = $derived(
		categories.filter((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	// Function to handle category deletion
	async function deleteCategory(categoryId: string) {
		try {
			const res = await client.vendor.menu.category[':id'].$delete({
				param: { id: categoryId }
			});

			if (res.ok) {
				toast.success('Category deleted successfully');
				await invalidateAll();
				// Update the categories list by removing the deleted category
			} else {
				toast.error('Failed to delete category');
			}
		} catch (error) {
			console.error('Error deleting category:', error);
			toast.error('An error occurred while deleting the category');
		}
	}

	// Function to view a category and its menu items
	function viewCategory(categoryId: string) {
		goto(`/vendor/categories/${categoryId}`);
	}

	// Function to edit a category
	function editCategory(categoryId: string) {
		goto(`/vendor/categories/${categoryId}/edit`);
	}

	// Clear search query
	function clearSearch() {
		searchQuery = '';
	}
</script>

<AddCategoryModal />

<div class="container mx-auto space-y-6 p-4">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<h1 class="text-3xl font-bold">Menu Categories</h1>
		<Button onclick={() => addCategoryModalState.setTrue()}>
			<Plus class="mr-2 h-4 w-4" />
			Add Category
		</Button>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Your Categories</Card.Title>
			<Card.Description>
				Manage your menu categories. Organize your menu items by categories for better customer
				experience.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				<!-- Search and Filter -->
				<div class="relative">
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search categories..."
						class="pl-8"
						bind:value={searchQuery}
					/>
					{#if searchQuery}
						<Button
							variant="ghost"
							size="sm"
							class="absolute right-0 top-0 h-full px-3"
							onclick={clearSearch}
						>
							<FilterX class="h-4 w-4" />
						</Button>
					{/if}
				</div>

				{#if filteredCategories.length === 0}
					<div
						class="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-6 text-center"
					>
						<div
							class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center"
						>
							{#if searchQuery}
								<p class="mt-2 text-sm text-muted-foreground">
									No categories found matching your search query. Try a different search or clear
									filters.
								</p>
								<Button variant="ghost" onclick={clearSearch} class="mt-4">Clear Search</Button>
							{:else}
								<p class="mt-2 text-sm text-muted-foreground">
									You haven't created any menu categories yet. Create your first category to
									organize your menu.
								</p>
								<Button onclick={() => addCategoryModalState.setTrue()} class="mt-4">
									<Plus class="mr-2 h-4 w-4" />
									Create First Category
								</Button>
							{/if}
						</div>
					</div>
				{:else}
					<!-- Categories Table -->
					<div class="rounded-md border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Name</Table.Head>
									<Table.Head>Status</Table.Head>
									<Table.Head>Menu Items</Table.Head>
									<Table.Head class="text-right">Actions</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each filteredCategories as category}
									<Table.Row>
										<Table.Cell class="font-medium">{category.name}</Table.Cell>
										<Table.Cell>
											<Badge variant={category.published ? 'default' : 'secondary'}>
												{category.published ? 'Published' : 'Draft'}
											</Badge>
										</Table.Cell>
										<Table.Cell>
											{category.menuCount || 0} items
										</Table.Cell>
										<Table.Cell class="text-right">
											<ResponsiveDropdown>
												{#snippet trigger()}
													<Button variant="ghost" size="icon">
														<span class="sr-only">Open menu</span>
														<svg
															width="15"
															height="15"
															viewBox="0 0 15 15"
															fill="none"
															xmlns="http://www.w3.org/2000/svg"
															class="h-4 w-4"
														>
															<path
																d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
																fill="currentColor"
																fill-rule="evenodd"
																clip-rule="evenodd"
															></path>
														</svg>
													</Button>
												{/snippet}
												{#snippet children()}
													<button
														class="dropdown-menu-item"
														onclick={() => viewCategory(category.id)}
													>
														<ArrowRight class="mr-2 h-4 w-4" />
														View Items
													</button>
													<button
														class="dropdown-menu-item"
														onclick={() => editCategory(category.id)}
													>
														<Edit class="mr-2 h-4 w-4" />
														Edit Category
													</button>
													<div class="dropdown-menu-separator" />
													<button
														class="dropdown-menu-item text-destructive"
														onclick={() => deleteCategory(category.id)}
													>
														<Trash class="mr-2 h-4 w-4" />
														Delete Category
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
		</Card.Content>
	</Card.Root>
</div>
