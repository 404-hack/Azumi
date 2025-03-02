<script lang="ts">
	import Button from '../ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants } from '../ui/button';
	import Input from '../ui/input/input.svelte';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';

	import { Loader2 } from 'lucide-svelte';
	import * as Form from '$lib/components/ui/form';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/stores';
	import { updateNameSchema } from '$lib/formSchema';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { updateNameModalState } from '$lib/states/modalState.svelte';
	import { authClient } from '$lib/auth-client';

	const form = superForm(defaults(zod(updateNameSchema)), {
		validators: zod(updateNameSchema),
		SPA: true,
		resetForm: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				authClient.updateUser(
					{
						name: `${form.data.firstName} ${form.data.lastName}`
					},
					{
						onSuccess: () => {
							toast.success('Name updated successfully');
							updateNameModalState.setFalse();
						},
						onError: (error) => {
							toast.error(error.error.message);
						}
					}
				);
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title="Update Name" bind:open={updateNameModalState.value}>
	<form class="mt-5 flex flex-col gap-5" use:enhance>
		<div class="grid grid-cols-2 items-center gap-3">
			<Form.Field {form} name="firstName">
				<Form.Control>
					{#snippet children({ props })}
						<div class="space-y-2">
							<Form.Label>First name</Form.Label>
							<Input
								{...props}
								bind:value={$formData.firstName}
								placeholder="Enter your first name"
							/>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="lastName">
				<Form.Control>
					{#snippet children({ props })}
						<div class="space-y-2">
							<Form.Label>Last name</Form.Label>
							<Input
								{...props}
								bind:value={$formData.lastName}
								placeholder="Enter your last name"
							/>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-3">
			<Button type="submit" class="h-12 w-full font-medium">
				{#if $delayed}
					<Loader2 class="size-6 animate-spin " />
				{:else}
					Save
				{/if}
			</Button>
		</div>
	</form>
</ResponsiveDialog>
