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
	import { goto, invalidateAll } from '$app/navigation';

	type Props = {
		options: TOption[];
	};
	let { options }: Props = $props();
	console.log('🚀 ~ options:', options);

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

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold">Option Items</h2>
		{#if options.length > 0}
			<Button href="/vendor/menu/options/new">
				<Plus class="mr-2 h-4 w-4" />
				Add Option Item
			</Button>
		{/if}
	</div>

	{#if options.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center"
		>
			<div class="mb-4 rounded-full bg-muted p-3">
				<Plus class="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 class="mb-2 text-lg font-medium">No options yet</h3>
			<p class="mb-4 max-w-sm text-sm text-muted-foreground">
				create your first option item to get started.
			</p>
			<Button href="/vendor/menu/options/new">
				<Plus class="mr-2 h-4 w-4" />
				Add Option
			</Button>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Price</Table.Head>
						<Table.Head>status</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each options as item (item.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{item.name}</Table.Cell>
							<Table.Cell>${item.price}</Table.Cell>
							<Table.Cell>
								<Badge variant={item.inStock ? 'default' : 'destructive'}>

									{item.inStock ? 'available' : 'unavailable'}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button
										variant="outline"
										onclick={() => {
											goto(`/vendor/menu/options/${item.id}`);
										}}
										size="sm">Edit</Button
									>
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
