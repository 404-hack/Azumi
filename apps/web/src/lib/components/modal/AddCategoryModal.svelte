<script lang="ts">
	import { createMenuCategorySchema } from '@repo/server/validations';
	import { addCategoryModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import Button from '../ui/button/button.svelte';
	import Input from '../ui/input/input.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Switch } from '$lib/components/ui/switch';

	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { Loader } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import type { TMenuCategory } from '@repo/server/types';

	type Props = {
		afterSubmit?: (category: TMenuCategory) => void
	};

	let { afterSubmit }: Props = $props();

	const form = superForm(defaults(zod(createMenuCategorySchema)), {
		validators: zodClient(createMenuCategorySchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					console.log('Submitting category form:', form.data);
					const res = await client.vendor.menu.category.create.$post({
						json: {
							name: form.data.name,
							published: form.data.published
						}
					});
					const data = await res.json();
					console.log('Category submission response:', data);

					if (res.ok) {
						toast.success(data.message || 'Category created successfully');
						await invalidateAll(); // Refresh the data
						addCategoryModalState.setFalse();
						if (afterSubmit) {
							afterSubmit(data.data);
						}
					} else {
						toast.error(data.message || 'Failed to create category');
					}
				} catch (error) {
					console.error('Error creating category:', error);
					toast.error('An error occurred while creating the category');
				}
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title="Add Category" bind:open={addCategoryModalState.value}>
	<form method="POST" use:enhance class="grid items-start gap-4">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Category name</Form.Label>
					<Input class="w-full md:max-w-sm" {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="published">
			<Form.Control>
				{#snippet children({ props })}
					<div class="flex items-center justify-between">
						<Form.Label>Publish Now</Form.Label>
						<Switch {...props} bind:checked={$formData.published} />
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Button class="shadow-md" type="submit">
			{#if $delayed}
				<Loader class="mr-2 animate-spin" />
			{:else}
				Save changes
			{/if}
		</Button>
	</form>
</ResponsiveDialog>
