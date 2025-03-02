<script lang="ts">
	import Button from '../ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants } from '../ui/button';
	import Input from '../ui/input/input.svelte';
	import { page } from '$app/stores';
	import * as Form from '$lib/components/ui/form';
	import { Loader2 } from 'lucide-svelte';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { updateNumberSchema } from '$lib/formSchema';
	import { toast } from 'svelte-sonner';
	import { updateNumberModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';

	const form = superForm(defaults(zod(updateNumberSchema)), {
		validators: zod(updateNumberSchema),
		SPA: true,
		resetForm: true
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title="Update Number" bind:open={updateNumberModalState.value}>
	<form method="POST" use:enhance>
		<Form.Field {form} name="number">
			<Form.Control>
				{#snippet children({ props })}
					<div class="space-y-2">
						<Form.Label>Phone Number</Form.Label>
						<Input {...props} bind:value={$formData.number} placeholder="Enter your phone number" />
					</div>
				{/snippet}
			</Form.Control>
			<Form.Description>your phone number</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Button class="mt-2 w-full"
			>{#if $delayed}
				<Loader2 class="size-6 animate-spin " />
			{:else}
				Update phone number
			{/if}</Form.Button
		>
	</form>
</ResponsiveDialog>
