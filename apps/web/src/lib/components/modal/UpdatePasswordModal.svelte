<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants } from '../ui/button';
	import Input from '../ui/input/input.svelte';
	import { page } from '$app/stores';
	import * as Form from '$lib/components/ui/form';
	import { updatePasswordSchema } from '$lib/formSchema';
	import { Loader2 } from 'lucide-svelte';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { toast } from 'svelte-sonner';
	import { zod } from 'sveltekit-superforms/adapters';
	import { updatePasswordModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { authClient } from '$lib/auth-client';
	let modalState = false;
	const form = superForm(defaults(zod(updatePasswordSchema)), {
		validators: zod(updatePasswordSchema),
		SPA: true,

		resetForm: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				await authClient.changePassword(
					{
						currentPassword: form.data.currentPassword,
						newPassword: form.data.newPassword,

					},
					{
						
						onSuccess: () => {
							console.log('🚀 ~ onSuccess:');
							toast.success('Password updated successfully 😁');
							updatePasswordModalState.setFalse();
						},
						onError: (error) => {
							toast.error(error.error?.message + ' 😥');
							console.log('🚀 ~ onError:', error);
						}
					}
				)
				toast.success('Password updated successfully');
				updatePasswordModalState.setFalse();
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title="Change Password" bind:open={updatePasswordModalState.value}>
	<form method="post" use:enhance>
		<Form.Field {form} name="currentPassword">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Current Password</Form.Label>
					<Input type="password" {...props} bind:value={$formData.currentPassword} />
				{/snippet}
			</Form.Control>
			<Form.Description>Your current password</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="newPassword">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>New Password</Form.Label>
					<Input type="password" {...props} bind:value={$formData.newPassword} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

	

		<Form.Field {form} name="confirmNewPassword">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Confirm New Password</Form.Label>
					<Input type="password" {...props} bind:value={$formData.confirmNewPassword} />
				{/snippet}
			</Form.Control>
			<Form.Description>Confirm your new password</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Button class="mt-2 w-full"
			>{#if $delayed}
				<Loader2 class="size-6 animate-spin " />
			{:else}
				Change Password
			{/if}</Form.Button
		>
	</form>
</ResponsiveDialog>
