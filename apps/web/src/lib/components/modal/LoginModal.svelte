<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { loginSchema } from '$lib/formSchema';
	import { Loader2 } from 'lucide-svelte';
	import { Input } from '../ui/input';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { authClient } from '$lib/auth-client';

	import {
		loginModalState,
		registerModalState,
		requestPasswordResetModalState
	} from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { toast } from 'svelte-sonner';
	type Props = {
		title?: string;
	};
	let { title }: Props = $props();
	const form = superForm(defaults(zod(loginSchema)), {
		SPA: true,
		validators: zod(loginSchema),
		onUpdate: async ({ form }) => {
			if (form.valid) {
				await authClient.signIn.email(
					{
						email: form.data.email,
						password: form.data.password
					},
					{
						onSuccess: async (data) => {
							console.log('Login successful:', data);
							loginModalState.setFalse();
							toast.success('Login successful');
						},
						onError: (error) => {
							console.error('Login error:', error);
							toast.error('Login failed. Please check your credentials.');
						}
					}
				);
			}
		},
		resetForm: false
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title={title || 'Login to your account'} bind:open={loginModalState.value}>
	<form method="post" class="p-1" use:enhance>
		<Form.Field {form} name="email">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Email</Form.Label>
					<Input {...props} bind:value={$formData.email} />
				{/snippet}
			</Form.Control>
			<Form.Description>This is your email.</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="password">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Password</Form.Label>
					<Input {...props} bind:value={$formData.password} type="password" />
				{/snippet}
			</Form.Control>
			<Form.Description>Input your password here</Form.Description>
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
		<button
			onclick={() => {
				loginModalState.setFalse();
				requestPasswordResetModalState.setTrue();
				console.log('i was triggered');
			}}
			class="text-sm text-primary"
			type="button">Forgot Your password?</button
		>

		<Form.Button class="mt-2 w-full" type="submit"
			>{#if $delayed}
				<Loader2 class="size-6 animate-spin " />
			{:else}
				Login
			{/if}</Form.Button
		>
	</form>
</ResponsiveDialog>
