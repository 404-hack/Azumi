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
	const form = superForm(defaults(zod(createMenuCategorySchema)), {
		validators: zodClient(createMenuCategorySchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				const res = await client.vendor.menu.category.create.$post({
					json: {
						name: form.data.name,
						published: form.data.published
					}
				});
				const data = await res.json();
				if (res.ok) {
					toast.success(data.message);
					addCategoryModalState.setFalse();
				} else {
					toast.error(data.message);
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
