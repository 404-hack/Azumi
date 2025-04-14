<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Loader2 } from 'lucide-svelte';
	import Input from '../ui/input/input.svelte';
	import { zod } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { registerSchema } from '$lib/formSchema';
	import { loginModalState, registerModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { authClient } from '$lib/auth-client';

	type Props = {
		title?: string;
	};
	let { title }: Props = $props();

	const form = superForm(defaults(zod(registerSchema)), {
		validators: zod(registerSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				const { confirmPassword, email, firstName, lastName, password } = form.data;
				
				
				const  response = await authClient.signUp.email({
					email,
					password,
					name: `${firstName} ${lastName}`,
					tokens: 0, // Required property
					credits: 0  // Required property
				},{
					onSuccess: () => {
						registerModalState.setFalse();
						loginModalState.setTrue(); // Un-commented line to open the login modal
					},
					onError: (error) => {
						console.error('Error during registration:', error);
						// Handle error (e.g., show a toast notification)
					}
				});
				
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
	<form method="POST" use:enhance>
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
		<Form.Field {form} name="password">
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
		</Form.Field>

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
