<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import { addOptionModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { createOptionSchema } from '@repo/server/validations';
	import { zod } from 'sveltekit-superforms/adapters';
	import { client } from '$lib/hc';
	import { goto, invalidateAll } from '$app/navigation';
	import { Loader2 } from 'lucide-svelte';

	// Add property to track the option group ID
	type Props = {
		optionGroupId: string | null;
	};
	let { optionGroupId }: Props = $props();

	// Initialize superForm with the option schema
	const form = superForm(defaults(zod(createOptionSchema)), {
		validators: zod(createOptionSchema),
		SPA: true,
		resetForm: true,

		onUpdate: async ({ form }) => {
			if (form.valid) {
				// Create the option
				const res = await client.vendor.option.create.$post({
					json: {
						...form.data
					}
				});

				if (res.ok) {
					const data = await res.json();
					const optionId = data.data.id;

					// If this was triggered from an option group, add the option to that group
					if (optionGroupId) {
						console.log('🚀 ~ onUpdate: ~ optionGroupId:', optionGroupId);
						try {
							// Add the option to the specified group
							await client.vendor['option-group'][':optionGroupId'].option[':optionId'].add.$post({
								param: {
									optionGroupId,
									optionId
								}
							});
						} catch (error) {
							console.error('Failed to add option to group:', error);
						}
					}

					addOptionModalState.setFalse();

					// await invalidateAll();
				}
				// return { success: true };
			}
		}
	});
	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title="Add New Option" bind:open={addOptionModalState.value}>
	<form method="POST" use:enhance class="space-y-6">
		<div class="space-y-6">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Option Name</Form.Label>
						<Input
							{...props}
							bind:value={$formData.name}
							placeholder="e.g., Extra Cheese, Large Size"
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>The name of your option as it will appear to customers</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="price">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Additional Price</Form.Label>
						<div class="relative">
							<span class="absolute left-3 top-2.5 text-muted-foreground">₦</span>
							<Input
								{...props}
								type="number"
								min="0"
								step="0.01"
								class="pl-7"
								placeholder="0.00"
								bind:value={$formData.price}
							/>
						</div>
					{/snippet}
				</Form.Control>
				<Form.Description
					>Extra cost when this option is selected (0 for no additional cost)</Form.Description
				>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="inStock">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-center justify-between">
							<div>
								<Form.Label>Mark as in stock</Form.Label>
								<Form.Description>Make this option available for selection</Form.Description>
							</div>
							<Switch {...props} bind:checked={$formData.inStock} />
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="flex flex-col gap-4">
			<Button type="submit" class="w-full">
				{#if $delayed}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Add Option
			</Button>
			<Button
				type="button"
				variant="outline"
				class="w-full"
				onclick={() => (addOptionModalState.value = false)}
			>
				Cancel
			</Button>
		</div>
	</form>
</ResponsiveDialog>
