<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Loader2 } from 'lucide-svelte';
	import Input from '../ui/input/input.svelte';
	import { zod } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { registerSchema } from '$lib/formSchema';
	import { registerModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { authClient } from '$lib/auth-client';
	const form = superForm(defaults(zod(registerSchema)), {
		validators: zod(registerSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				const { confirmPassword, email, firstName, lastName, password } = form.data;
				// try {
				// 	await fetch(`${PUBLIC_API_BASE_URL}/auth/register`, {
				// 		method: 'POST',
				// 		body: JSON.stringify({ confirmPassword, email, firstName, lastName, password }),
				// 		headers: {
				// 			'Content-Type': 'application/json'
				// 		}
				// 	});
				// } catch {}
				await fetch(`${PUBLIC_API_BASE_URL}/user/login`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				});
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog
	bind:open={registerModalState.value}
	title="Create an account"
	description="Enter your email and password to log in. Click login when you're ready."
>
	<form method="POST" use:enhance>
		<div class="grid grid-cols-2 items-center gap-4">
			<Form.Field {form} name="firstName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>first Name</Form.Label>
						<Input {...props} bind:value={$formData.firstName} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="lastName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>last name</Form.Label>
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
			<Form.Description>This is your email address</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="password">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Password</Form.Label>
					<Input {...props} type="password" bind:value={$formData.password} />
				{/snippet}
			</Form.Control>
			<Form.Description>Add your password</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="confirmPassword">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Confirm password</Form.Label>
					<Input {...props} type="password" bind:value={$formData.confirmPassword} />
				{/snippet}
			</Form.Control>
			<Form.Description>confirm your password</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button disabled={$delayed} class="mt-2 w-full">
			{#if $delayed}
				<Loader2 class="h-6 w-6 animate-spin " />
			{:else}
				Register
			{/if}
		</Form.Button>
	</form>
</ResponsiveDialog>
