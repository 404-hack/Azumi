<script lang="ts">
	import { addPackSchema } from '$lib/formSchema';
	import { addPackModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import Button from '../ui/button/button.svelte';
	import Input from '../ui/input/input.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Loader } from 'lucide-svelte';

	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import type { TPack } from '@repo/server/types';

	type Props = {
		afterSubmit?: (pack: TPack) => void
	};

	let { afterSubmit }: Props = $props();

	const form = superForm(defaults(zod(addPackSchema)), {
		validators: zodClient(addPackSchema),
		validationMethod: 'oninput',
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const res = await client.vendor.pack.create.$post({
						json: {
							...form.data
						}
					});
					if (res.ok) {
						const data = await res.json();
						toast.success('Food pack successfully created');
						await invalidateAll();
						addPackModalState.setFalse();
						if (afterSubmit) {
							afterSubmit(data.data);
						}
					} else {
						toast.error('Failed to create food pack');
					}
				} catch (error) {
					console.error('Failed to create food pack', error);
					toast.error('Failed to create food pack');
				}
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog title="Add Pack" bind:open={addPackModalState.value}>
	<form use:enhance class="grid items-start gap-4">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Pack Name</Form.Label>
					<Input 
						class="w-full md:max-w-sm" 
						{...props} 
						bind:value={$formData.name}
						placeholder="e.g., Family Feast, Date Night Special" 
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="description">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Description</Form.Label>
					<Textarea
						{...props}
						bind:value={$formData.description}
						placeholder="Describe what's included in this pack and who it's perfect for"
						class="min-h-[120px]"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="price">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Price</Form.Label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
						<Input 
							class="w-full md:max-w-sm pl-8" 
							type="number" 
							min="0"
							step="0.01"
							placeholder="0.00"
							{...props} 
							bind:value={$formData.price} 
						/>
					</div>
				{/snippet}
			</Form.Control>
			<Form.Description>
				The total price of the pack (should usually offer savings compared to buying items separately)
			</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex justify-end gap-3 pt-2">
			<Button variant="outline" type="button" onclick={() => addPackModalState.value = false}>
				Cancel
			</Button>
			<Button class="shadow-md" type="submit">
				{#if $delayed}
					<Loader class="mr-2 animate-spin" />
				{/if}
				Create Pack
			</Button>
		</div>
	</form>
</ResponsiveDialog>
