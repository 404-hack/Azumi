<script lang="ts">
	import Input from '../ui/input/input.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Loader2 } from 'lucide-svelte';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { updateEmailSchema } from '$lib/formSchema';
	import { updateEmailModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	const form = superForm(defaults(zod(updateEmailSchema)), {
		validators: zod(updateEmailSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				const res = await authClient.changeEmail(
					{
						newEmail: form.data.email,

						callbackURL: '/dashboard' //to redirect after verification,
					},
					{
						onSuccess: () => {
							updateEmailModalState.setFalse();
							toast.success('Email updated successfully');
						},
						onError: (error) => {
							console.log('🚀 ~ onUpdate: ~ error:', error);
						}
					}
				);
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title="Change Email" bind:open={updateEmailModalState.value}>
	<form method="post" use:enhance>
		<Form.Field {form} name="email">
			<Form.Control>
				{#snippet children({ props })}
					<div class="space-y-2">
						<Form.Label>Email</Form.Label>
						<Input {...props} bind:value={$formData.email} placeholder="Enter your new email" />
					</div>
				{/snippet}
			</Form.Control>
			<Form.Description>This is your new email.</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button class="mt-2 w-full shadow-md"
			>{#if $delayed}
				<Loader2 class="size-6 animate-spin " />
			{:else}
				Update Email
			{/if}</Form.Button
		>
	</form>
</ResponsiveDialog>
