<script lang="ts">
	import { deleteModalState } from '$lib/states/modalState.svelte';
	import { AlertTriangle, Loader2, Trash2 } from 'lucide-svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import Button from '../ui/button/button.svelte';
</script>

<ResponsiveDialog
	title="Delete {deleteModalState.itemName || 'Item'}"
	description=""
	bind:open={deleteModalState.value}
>
	<div class="flex flex-col items-center gap-4 py-3">
		<!-- Warning icon -->
		<div class="flex justify-center py-2">
			<div class="rounded-full bg-destructive/10 p-3">
				<AlertTriangle class="h-10 w-10 text-destructive" strokeWidth={1.5} />
			</div>
		</div>

		<p class="text-center text-base text-foreground/80">
			Are you sure you want to delete {deleteModalState.itemName || 'this item'}? This action cannot be undone.
		</p>

		<div class="flex w-full justify-end gap-3 pt-4">
			<Button variant="outline" class="h-9 px-4" onclick={() => deleteModalState.close()}>
				Cancel
			</Button>
			<Button
				variant="destructive"
				type="button"
				class="h-9 bg-destructive px-4 hover:bg-destructive/90"
				onclick={() => deleteModalState.handleConfirm?.()}
				disabled={deleteModalState.loading}
			>
				{#if deleteModalState.loading}
					<Loader2 class="mr-2 size-4 animate-spin" />
					Deleting...
				{:else}
					Delete
				{/if}
			</Button>
		</div>
	</div>
</ResponsiveDialog>
