<!-- <script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Loader2 } from 'lucide-svelte';
	import { Input } from '../ui/input';
	import { zod } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { profileSetupModalState } from '$lib/states/modalState.svelte';

	type Props = {
		title?: string;
		description?: string;
	};

	const profileSetupSchema = z.object({
		firstName: z.string().min(1, 'First name is required'),
		lastName: z.string().min(1, 'Last name is required'),
		email: z.string().email('Please enter a valid email address')
	});
	let { title, description }: Props = $props();

	const form = superForm(defaults(zod(profileSetupSchema)), {
		validators: zod(profileSetupSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const { firstName, lastName, email } = form.data;
					const fullName = `${firstName} ${lastName}`.trim();

					// Update user profile with name
					await authClient.updateUser({
						name: fullName
					});

					// Update user email
					await authClient.changeEmail(
						{
							newEmail: email
						},
						{
							onSuccess: () => {
								profileSetupModalState.setFalse();
								toast.success('Profile updated successfully!');
							},
							onError: (error) => {
								toast.error('Email already exists try another one'); 
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
	bind:open={profileSetupModalState.value}
	interactOutsideBehavior="ignore"
	title={title || 'Complete your profile'}
	description={description || 'Please provide your name and email to complete your registration.'}
>
	<form method="POST" class="space-y-4" use:enhance>
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

		<div class="mt-6 flex flex-col gap-3">
			<Form.Button disabled={$delayed} class="w-full">
				{#if $delayed}
					<Loader2 class="h-6 w-6 animate-spin" />
				{:else}
					Complete Registration
				{/if}
			</Form.Button>

			<button
				type="button"
				onclick={() => {
					profileSetupModalState.setFalse();
					toast.info('You can complete your profile later in your account settings.');
					
				}}
				class="text-sm text-muted-foreground hover:text-primary hover:underline"
			>
				Skip for now
			</button>
		</div>
	</form>
</ResponsiveDialog> -->

<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Loader2 } from 'lucide-svelte';
	import { Input } from '../ui/input';
	import { zod } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { profileSetupModalState } from '$lib/states/modalState.svelte';
	import { tick } from 'svelte';

	type Props = {
		title?: string;
		description?: string;
	};

	const profileSetupSchema = z.object({
		firstName: z.string().min(1, 'First name is required'),
		lastName: z.string().min(1, 'Last name is required'),
		email: z.string().email('Please enter a valid email address')
	});

	let { title, description }: Props = $props();
	let isSubmitting = $state(false);

	const form = superForm(defaults(zod(profileSetupSchema)), {
		validators: zod(profileSetupSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid && !isSubmitting) {
				profileSetupModalState.setFalse();
				try {
					isSubmitting = true;
					const { firstName, lastName, email } = form.data;
					const fullName = `${firstName} ${lastName}`.trim();

					// Close modal FIRST

					// Wait a tick to ensure modal closing animation starts
					await tick();

					// Then perform async operations
					await authClient.updateUser({
						name: fullName
					});

					// Update user email
					await authClient.changeEmail(
						{
							newEmail: email
						},
						{
							onSuccess: () => {
								setTimeout(() => {
									toast.success('Profile updated successfully!');
								}, 100);
							},
							onError: (error) => {
								toast.error('Email already exists try another one');
							}
						}
					);
				} catch (error) {
					console.error('Unexpected error:', error);
					toast.error('An unexpected error occurred');
				} finally {
					isSubmitting = false;
				}
			}
		}
	});

	const { form: formData, enhance, delayed } = form;

	async function handleSkip() {
		// Close modal FIRST
		profileSetupModalState.setFalse();

		// Wait a tick to ensure DOM updates
		await tick();

		// Show toast with delay after modal is closed
		setTimeout(() => {
			toast.info('You can complete your profile later in your account settings.');
		}, 100);
	}
</script>

<ResponsiveDialog
	bind:open={profileSetupModalState.value}
	interactOutsideBehavior="ignore"
	title={title || 'Complete your profile'}
	description={description || 'Please provide your name and email to complete your registration.'}
>
	<form method="POST" class="space-y-4" use:enhance>
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

		<div class="mt-6 flex flex-col gap-3">
			<Form.Button disabled={$delayed || isSubmitting} class="w-full">
				{#if $delayed || isSubmitting}
					<Loader2 class="h-6 w-6 animate-spin" />
				{:else}
					Complete Registration
				{/if}
			</Form.Button>

			<button
				type="button"
				onclick={handleSkip}
				class="text-sm text-muted-foreground hover:text-primary hover:underline"
			>
				Skip for now
			</button>
		</div>
	</form>
</ResponsiveDialog>
