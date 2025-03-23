<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { TOption } from '@repo/server/types';
	import { deleteModalState } from '$lib/states/modalState.svelte';
	import DeleteConfirmModal from '$lib/components/modal/DeleteConfirmModal.svelte';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		options: TOption[];
	};
	let { options }: Props = $props();

	// Add loading state
	let deletingId: string | null = $state(null);
	let optionToDelete: TOption | null = $state(null);

	const deleteOption = async (id: string) => {
		try {
			deletingId = id;
			await client.option.vendor[':id'].$delete({
				param: { id }
			});
			toast.success(`${optionToDelete?.name} was successfully deleted`);

			// You might want to refresh the options list or emit an event here
		} finally {
			deletingId = null;
			invalidateAll();
			deleteModalState.setFalse();
		}
	};

	const handleDeleteClick = (option: TOption) => {
		optionToDelete = option;
		deleteModalState.setTrue();
	};

	const handleConfirmDelete = () => {
		if (optionToDelete) {
			deleteOption(optionToDelete.id);
		}
	};
	const load = async () => {
		await invalidateAll();
	};
</script>

<button onclick={() => load()}>load it</button>
<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold">Option Items</h2>
		<Button href="/vendor/menu/add-option">
			<Plus class="mr-2 h-4 w-4" />
			Add Option Item
		</Button>
	</div>

	{#if options.length === 0}
		<div class="rounded-md border p-8 text-center">
			<p class="text-gray-500">
				No option items found. Create your first option item to get started.
			</p>
			<div class="mt-4">
				<Button href="/vendor/menu/add-option">
					<Plus class="mr-2 h-4 w-4" />
					Add Option Item
				</Button>
			</div>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Price</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each options as item (item.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{item.name}</Table.Cell>
							<Table.Cell>${item.price}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button variant="outline" size="sm">Edit</Button>
									<Button variant="destructive" size="sm" onclick={() => handleDeleteClick(item)}>
										Delete
									</Button>
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
	itemName={optionToDelete?.name}
	loading={!!deletingId}
	handleConfirm={handleConfirmDelete}
/>
