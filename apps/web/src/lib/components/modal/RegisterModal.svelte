<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Loader2 } from 'lucide-svelte';
	import Input from '../ui/input/input.svelte';
	import { zod } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { registerSchema } from '$lib/formSchema';
	import {
		loginModalState,
		registerModalState,
		verifyOtpModalState
	} from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import VerifyOtpModal from './VerifyOtpModal.svelte';

	type Props = {
		title?: string;
	};

	let { title }: Props = $props();
	let registrationData = $state<{
		email: string;
		firstName: string;
		lastName: string;
		phoneNumber: string;
	} | null>(null);

	const form = superForm(defaults(zod(registerSchema)), {
		validators: zod(registerSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				const { email, firstName, lastName, phoneNumber } = form.data;
				try {
					registrationData = {
						email,
						firstName,
						lastName,
						phoneNumber
					};
					await authClient.phoneNumber.sendOtp(
						{
							phoneNumber: phoneNumber
						},
						{
							async onSuccess() {
								registerModalState.setFalse();
								verifyOtpModalState.setTrue();
								toast.success('OTP code sent successfully');
							},
							onError(ctx) {
								console.error('Failed to send OTP:', ctx.error);
								toast.error(ctx.error.message || 'Failed to send OTP code');
							}
						}
					);
				} catch (error) {
					console.error('Unexpected error:', error);
					toast.error('An unexpected error occurred');
				}
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog
	bind:open={registerModalState.value}
	title={title || 'Create an account'}
	description="Please fill in the form below to create an account."
>
	<form method="POST" class="" use:enhance>
		<div class="grid grid-cols-2 items-center gap-4">
			<Form.Field {form} name="firstName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>First Name</Form.Label>
						<Input {...props} bind:value={$formData.firstName} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="lastName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Last Name</Form.Label>
						<Input {...props} bind:value={$formData.lastName} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<Form.Field {form} name="email">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Email</Form.Label>
					<Input {...props} bind:value={$formData.email} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="phoneNumber">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Phone number</Form.Label>
					<Input {...props} bind:value={$formData.phoneNumber} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<!-- <Form.Field {form} name="password">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Password</Form.Label>
					<Input {...props} type="password" bind:value={$formData.password} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="confirmPassword">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Confirm password</Form.Label>
					<Input {...props} type="password" bind:value={$formData.confirmPassword} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field> -->

		<!-- <p class="text-sm text-muted-foreground">
			Already have an account? <button
				class="inline-block cursor-pointer text-primary hover:text-primary/80"
				onclick={() => {
					registerModalState.setFalse();
					loginModalState.setTrue();
				}}>Log in below</button
			> .
		</p> -->
		<!-- Added line for clarity -->
		<Form.Button disabled={$delayed} class="mt-2 w-full">
			{#if $delayed}
				<Loader2 class="h-6 w-6 animate-spin " />
			{:else}
				Register
			{/if}
		</Form.Button>
	</form>
</ResponsiveDialog>
<VerifyOtpModal
	title="Verify your phone number"
	phoneNumber={registrationData?.phoneNumber}
	email={registrationData?.email}
	firstName={registrationData?.firstName}
	lastName={registrationData?.lastName}
/>
