<script lang="ts">
	import { Plus, MoreVertical, Pencil, Trash, Search } from 'lucide-svelte';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { client } from '$lib/hc';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import { onMount } from 'svelte';
	import DeleteConfirmModal from '$lib/components/modal/DeleteConfirmModal.svelte';
	import { deleteModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import { slide } from 'svelte/transition';
	import type { TFoodPack } from '@repo/server/types';

	let foodPacks: TFoodPack[] = $state([]);
	let isLoading = $state(true);
	let showSearch = $state(false);
	let searchQuery = $state('');
	let packToDelete: TFoodPack | null = $state(null);
	let deletingId: string | null = $state(null);

	// Filter packs based on search query
	let filtered = $derived(
		foodPacks.filter(
			(pack) =>
				pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				pack.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function toggleSearch() {
		showSearch = !showSearch;
		if (!showSearch) {
			searchQuery = '';
		}
	}

	const handleDeleteClick = (pack: TFoodPack) => {
		packToDelete = pack;
		deleteModalState.setTrue();
	};

	const handleConfirmDelete = async () => {
		if (packToDelete) {
			try {
				deletingId = packToDelete.id;
				const res = await client.vendor.pack[':id'].$delete({
					param: { id: packToDelete.id }
				});

				if (res.ok) {
					toast.success(`${packToDelete.name} was successfully deleted`);
					await fetchFoodPacks();
				} else {
					toast.error('Failed to delete pack');
				}
			} catch (error) {
				console.error('Error deleting pack:', error);
				toast.error('An error occurred while deleting the pack');
			} finally {
				deletingId = null;
				deleteModalState.setFalse();
			}
		}
	};

	async function fetchFoodPacks() {
		try {
			isLoading = true;

			const response = await client.vendor.packs.$get();
			console.log('🚀 ~ fetchFoodPacks ~ response:', response);

			if (response.ok) {
				const data = await response.json();
				console.log('🚀 ~ fetchFoodPacks ~ data:', data);
				foodPacks = data.data;
			}
		} catch (error) {
			console.error('Failed to fetch food packs:', error);
			toast.error('Failed to load food packs');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchFoodPacks();
	});
</script>

<div class="space-y-6">
	<div
		class="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<div class="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">Food Packs</h2>
				<p class="text-sm text-muted-foreground">
					Create special bundles of menu items for customers to purchase together
				</p>
			</div>
			<div class="flex items-center gap-2">
				{#if showSearch}
					<div transition:slide={{ duration: 300 }} class="w-[200px] md:w-[300px]">
						<Input type="search" placeholder="Search packs..." bind:value={searchQuery} />
					</div>
				{/if}
				<button onclick={toggleSearch} class="hover:text-primary">
					<Search class="h-4 w-4" />
				</button>
				<Button href="/vendor/menu/add-pack" class="flex-1 md:flex-none">
					<Plus class="mr-2 h-4 w-4" />
					Add Food Pack
				</Button>
			</div>
		</div>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-10">
			<div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
		</div>
	{:else if foodPacks.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center"
		>
			<div class="mb-4 rounded-full bg-muted p-3">
				<Plus class="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 class="mb-2 text-lg font-medium">No food packs yet</h3>
			<p class="mb-4 max-w-sm text-sm text-muted-foreground">
				Create your first food pack to offer bundles or special deals to your customers.
			</p>
			<a href="/vendor/menu/add-pack" class={buttonVariants({ size: 'sm' })}>
				<Plus class="mr-2 h-4 w-4" />
				Add Food Pack
			</a>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head class="hidden md:table-cell">Description</Table.Head>
						<Table.Head>Price</Table.Head>
						<Table.Head class="hidden md:table-cell">Menu Items</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filtered as pack (pack.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{pack.name}</Table.Cell>
							<Table.Cell class="hidden max-w-xs truncate md:table-cell">
								{pack.description}
							</Table.Cell>
							<Table.Cell>₦{pack.price.toFixed(2)}</Table.Cell>
							<!-- <Table.Cell class="hidden md:table-cell">
								<Badge variant="outline">
									{pack.menus?.length || 0} items
								</Badge>
							</Table.Cell> -->
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end">
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
												onclick={() => goto(`/vendor/menu/edit-pack/${pack.id}`)}
											>
												<Pencil class="mr-2 h-4 w-4" />
												Edit Pack
											</button>
											<div class="dropdown-menu-separator" />
											<button
												class="dropdown-menu-item text-destructive"
												onclick={() => handleDeleteClick(pack)}
											>
												<Trash class="mr-2 h-4 w-4" />
												Delete Pack
											</button>
										{/snippet}
									</ResponsiveDropdown>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<DeleteConfirmModal
	itemName={packToDelete?.name}
	loading={!!deletingId}
	handleConfirm={handleConfirmDelete}
/>
