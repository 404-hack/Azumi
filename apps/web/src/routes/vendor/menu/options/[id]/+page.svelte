<script lang="ts">
	import { ArrowLeft, Loader2, Trash } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { client } from '$lib/hc';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { updateOptionSchema } from '@repo/server/validations';
	import DeleteConfirmModal from '$lib/components/modal/DeleteConfirmModal.svelte';
	import { deleteModalState } from '$lib/states/modalState.svelte';
	import { Switch } from '$lib/components/ui/switch';

	let { data } = $props();
	$inspect(data.option);

	const form = superForm(defaults({ ...data.option }, zod(updateOptionSchema)), {
		validators: zod(updateOptionSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const res = await client.vendor.option[':id'].$patch({
						param: { id: data.option.id },
						json: {
							...form.data
						}
					});
					if (res.ok) {
						toast.success('Option successfully updated');
					}
				} catch (error) {
					toast.error('Failed to update option');
				}
			}
		},
		resetForm: false
	});
	const { form: formData, enhance, delayed } = form;

	let isDeleting = $state(false);

	async function handleDelete() {
		try {
			isDeleting = true;
			const res = await client.option[':id'].$delete({
				param: { id: data.option.id }
			});

			if (res.ok) {
				toast.success('Option deleted successfully');
				await invalidateAll();
				await goto('/vendor/menu?tabValue=options');
			} else {
				toast.error('Failed to delete option');
			}
		} catch (error) {
			console.error('Error deleting option:', error);
			toast.error('An error occurred while deleting the option');
		} finally {
			isDeleting = false;
			deleteModalState.setFalse();
		}
	}
</script>

<div class=" max-w-3xl py-10">
	<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<!-- <Button variant="ghost" size="icon" href="/vendor/menu?tabValue=options" class="h-8 w-8">
				<ArrowLeft class="h-4 w-4" />
			</Button> -->
			<div>
				<h1 class="text-2xl font-semibold">Edit Option</h1>
				<p class="text-sm text-muted-foreground">Update option details</p>
			</div>
		</div>
		<div class="flex gap-2">
			<Button variant="destructive" onclick={() => deleteModalState.setTrue()}>
				<Trash class="mr-2 h-4 w-4" />
				Delete
			</Button>
		</div>
	</div>

	<form use:enhance class="space-y-8">
		<Card.Root class="border-none  sm:border">
			<Card.Header class="px-0 sm:p-6">
				<Card.Title>Option Details</Card.Title>
				<Card.Description>Basic information about this option</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6 px-0 sm:p-6">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Option Name</Form.Label>
							<Input
								{...props}
								bind:value={$formData.name}
								placeholder="e.g., Extra Cheese, No Onions"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>A clear name for this option</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="price">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Additional Price</Form.Label>
							<div class="relative">
								<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
								<Input
									{...props}
									type="number"
									min="0"
									step="0.01"
									class="pl-8"
									placeholder="0.00"
									bind:value={$formData.price}
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.Description>Extra cost for this option (if any)</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="inStock">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center justify-between">
								<div>
									<Form.Label>Mark as in stock</Form.Label>
									<Form.Description>Make this option available for selection</Form.Description>
								</div>
								<Switch {...props} bind:checked={$formData.inStock} />
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
			<Card.Footer>
				<div class="flex justify-end gap-4">
					<Button variant="outline" type="button" href="/vendor/menu?tabValue=options">
						Cancel
					</Button>
					<Button type="submit" disabled={$delayed}>
						{#if $delayed}
							<Loader2 />
						{/if}
						Save Changes
					</Button>
				</div>
			</Card.Footer>
		</Card.Root>
	</form>
</div>

<DeleteConfirmModal itemName={data.option.name} loading={isDeleting} handleConfirm={handleDelete} />
