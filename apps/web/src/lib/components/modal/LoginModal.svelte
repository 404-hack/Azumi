<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { loginSchema } from '$lib/formSchema';
	import { Loader2 } from 'lucide-svelte';
	import { Input } from '../ui/input';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { authClient } from '$lib/auth-client';

	import {
		loginModalState,
		verifyOtpModalState,
		profileSetupModalState
	} from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { toast } from 'svelte-sonner';
	import VerifyOtpModal from './VerifyOtpModal.svelte';
	let phoneNumber = $state('');

	const form = superForm(defaults(zod(loginSchema)), {
		SPA: true,
		validators: zod(loginSchema),
		onUpdate: async ({ form }) => {
			if (form.valid) {
				phoneNumber = form.data.phoneNumber;
				await authClient.phoneNumber.sendOtp(
					{
						phoneNumber: form.data.phoneNumber
					},
					{
						async onSuccess() {
							// toast.success('OTP code sent successfully');
							loginModalState.setFalse();
							setTimeout(() => {
								verifyOtpModalState.setTrue();
							}, 100);
						},
						onError(ctx) {
							toast.error(ctx.error.message || 'Failed to send OTP code');
						}
					}
				);
			}
		},
		resetForm: false
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog
	title={loginModalState.title || 'Continue with phone number'}
	description="Enter your phone number to sign in or create an account."
	bind:open={loginModalState.value}
>
	<form method="post" class="p-1" use:enhance>
		<Form.Field {form} name="phoneNumber">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Phone number</Form.Label>
					<Input {...props} bind:value={$formData.phoneNumber} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<!-- <button
			onclick={() => {
				loginModalState.setFalse();
				registerModalState.setTrue(); // Line added to open the registration modal
			}}
			class="block text-sm text-primary"
		>
			or create an account
		</button> -->
		<!-- <button
			onclick={() => {
				loginModalState.setFalse();
				requestPasswordResetModalState.setTrue();
				console.log('i was triggered');
			}}
			class="text-sm text-primary"
			type="button">Forgot Your password?</button
		> -->
		<Form.Button class="mt-2 w-full" type="submit"
			>{#if $delayed}
				<Loader2 class="size-6 animate-spin " />
			{:else}
				Continue
			{/if}</Form.Button
		>
	</form>
</ResponsiveDialog>

<VerifyOtpModal title="Verify your phone number" {phoneNumber} />
