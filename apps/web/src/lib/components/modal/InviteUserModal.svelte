<script lang="ts">
	import { inviteUserModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { Loader2, UserPlus } from 'lucide-svelte';
	import { client } from '$lib/hc';
	import { authClient } from '$lib/auth-client';

	// Form validation schema
	const inviteUserSchema = z.object({
		email: z.string().email('Please enter a valid email address'),
		role: z
			.enum(['admin', 'staff', 'manager'], {
				required_error: 'Please select a role'
			})
			.default('staff')
	});

	// Initialize the form
	const form = superForm(defaults(zod(inviteUserSchema)), {
		validators: zod(inviteUserSchema),
		validationMethod: 'oninput',
		SPA: true,
		resetForm: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					// Replace with your actual API endpoint
					await authClient.organization.inviteMember(
						{
							email: form.data.email,
							role: form.data.role //this can also be an array for multiple roles (e.g. ["admin", "sale"])
						},
						{
							onSuccess: async () => {
								toast.success('User invitation sent successfully');
								inviteUserModalState.setFalse();
							},
							onError: async ({ error }) => {
								toast.error(error.message || 'Failed to send invitation');
							}
						}
					);
				} catch (error) {
					console.error('Error sending invitation:', error);
					toast.error('Failed to send invitation');
				}
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title="Invite User" bind:open={inviteUserModalState.value}>
	<form method="POST" use:enhance class="space-y-6">
		<div class="space-y-4">
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Email Address</Form.Label>
						<Input
							{...props}
							bind:value={$formData.email}
							placeholder="colleague@example.com"
							type="email"
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>The email address of the person you want to invite</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="role">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Role</Form.Label>
						<select
							{...props}
							bind:value={$formData.role}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="" disabled selected>Select a role</option>
							<option value="admin">Administrator</option>
							<option value="manager">Manager</option>
							<option value="staff">Staff</option>
						</select>
					{/snippet}
				</Form.Control>
				<Form.Description>What permissions should this person have</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="flex flex-col gap-4">
			<Button type="submit" class="w-full" disabled={$delayed}>
				{#if $delayed}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Sending Invitation
				{:else}
					<UserPlus class="mr-2 h-4 w-4" />
					Send Invitation
				{/if}
			</Button>
			<Button
				type="button"
				variant="outline"
				class="w-full"
				onclick={() => (inviteUserModalState.value = false)}
			>
				Cancel
			</Button>
		</div>
	</form>
</ResponsiveDialog>
