<script lang="ts">
	import { addPackSchema } from '$lib/formSchema';
	import { addPackModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import Button from '../ui/button/button.svelte';
	import Input from '../ui/input/input.svelte';
	import * as Form from '$lib/components/ui/form';

	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	const form = superForm(defaults(zod(addPackSchema)), {
		validators: zodClient(addPackSchema),
		validationMethod: 'oninput'
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title="Add Pack" bind:open={addPackModalState.value}>
	<form method="POST" action="?/test" use:enhance class="grid items-start gap-4">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Pack name</Form.Label>
					<Input class="w-full md:max-w-sm" {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="description">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Pack description</Form.Label>
					<Input class="w-full md:max-w-sm" {...props} bind:value={$formData.description} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="price">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Price</Form.Label>
					<Input class="w-full md:max-w-sm" type="number" {...props} bind:value={$formData.price} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Button class="shadow-md" type="submit">Add Pack</Button>
	</form>
</ResponsiveDialog>
