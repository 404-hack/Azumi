<script lang="ts">
	import { createOptionGroupSchema } from '@repo/server/validations';
	import { client } from '$lib/hc.js';
	import { addOptionGroupModalState, addOptionModalState, type OptionsToOptionGroups } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Plus, X, Search } from 'lucide-svelte';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import AddOptionModal from './AddOptionModal.svelte';
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import type { TOptionGroup } from '@repo/server/types';
	type Props = {
		options: Array<{ id: string; name: string; price: number }>,
		afterSubmit?: (optionGroup: TOptionGroup) => void
	};

	let { options = [], afterSubmit }: Props = $props();

	// Form initialization
	const form = superForm(defaults(zod(createOptionGroupSchema)), {
		validators: zod(createOptionGroupSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				const res = await client.vendor['option-group'].$post({
					json: {
						...form.data
					}
				});
				if (res.ok) {
					const optionGroup = await res.json();
					toast.success('Option group created successfully');
					await invalidateAll();
					addOptionGroupModalState.value = false;
					if (afterSubmit) {
						afterSubmit(optionGroup.data);
					}
				}
			}
		}
	});
	const { form: formData, errors: formErrors, enhance } = form;

	// Add state for option filtering
	let searchQuery = $state('');
	
	// Computed property for filtered options
	let filteredOptions = $derived(options.filter(option => {
		const matchesSearch = option.name.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesSearch;
	}));
	
	// Function to toggle all options
	function toggleAllOptions(selectAll: boolean) {
		if (selectAll) {
			$formData.optionsId = [...new Set([...$formData.optionsId, ...filteredOptions.map(o => o.id)])];
		} else {
			$formData.optionsId = $formData.optionsId.filter(id => 
				!filteredOptions.some(o => o.id === id)
			);
		}
	}
</script>

<ResponsiveDialog title="Add Option Group" bind:open={addOptionGroupModalState.value}>
	<form use:enhance class="space-y-4 ">
		<div class="space-y-4">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Group Name</Form.Label>
						<Input
							{...props}
							bind:value={$formData.name}
							placeholder="e.g., Size, Toppings, Spice Level"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="grid gap-4 sm:grid-cols-2">
				<Form.Field {form} name="minSelections">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Minimum Selections</Form.Label>
							<Input {...props} type="number" min="0" bind:value={$formData.minSelections} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="maxSelections">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Maximum Selections</Form.Label>
							<Input {...props} type="number" min="1" bind:value={$formData.maxSelections} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		</div>

		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-medium">Available Options</h3>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" type="button" onclick={() => addOptionModalState.setTrue()}>
						<Plus class="mr-2 h-3 w-3" />
						Add Option
					</Button>
					<Badge variant="outline">{options.length} options</Badge>
				</div>
			</div>

			<!-- Search and filter controls -->
			<div class="relative">
				<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input 
					type="search"
					placeholder="Search options..." 
					class="pl-9"
					bind:value={searchQuery}
				/>
			</div>
			
			<!-- Select all option -->
			{#if filteredOptions.length > 0}
				<div class="flex items-center space-x-2 border-b pb-2">
					<Checkbox 
						id="select-all"
						checked={filteredOptions.every(o => $formData.optionsId.includes(o.id))}
						onCheckedChange={(v) => toggleAllOptions(!!v)}
					/>
					<Label for="select-all" class="text-sm cursor-pointer">
						{filteredOptions.every(o => $formData.optionsId.includes(o.id)) 
							? "Deselect all" 
							: "Select all displayed"}
					</Label>
				</div>
			{/if}
			
			<!-- Options list with results count -->
			<div class="text-xs text-muted-foreground">
				Showing {filteredOptions.length} of {options.length} options
				{#if searchQuery}
					for "{searchQuery}"
				{/if}
			</div>
			
			<ScrollArea class="h-[150px] w-full  rounded-md border p-1">
				<div class='h-full' >

					{#if filteredOptions.length === 0}
					<div class="rounded-md border-dashed p-4 text-center text-sm text-muted-foreground">
						{searchQuery ? `No options matching "${searchQuery}"` : 'No options available. Create options first.'}
					</div>
				{:else}
					<div class="space-y-2">
						{#each filteredOptions as option}
							{@const checked = $formData.optionsId.includes(option.id)}
							<div class="flex items-center space-x-3 rounded-md p-1 transition-colors hover:bg-muted/50">
								<Checkbox
								id={`modal-option-${option.id}`}
									aria-labelledby={`modal-option-${option.id}-label`}
									{checked}
									onCheckedChange={(v) => {
										if (v) {
											$formData.optionsId = [...$formData.optionsId, option.id];
										} else {
											$formData.optionsId = $formData.optionsId.filter((i) => i !== option.id);
										}
									}}
								/>
								<div class="flex-1 flex gap-1 items-center">
									<Label
										id={`modal-option-${option.id}-label`}
										for={`modal-option-${option.id}`}
										class="text-xs capitalize font-medium"
									>
										{option.name}
									</Label>
									{#if option.price > 0}
										<p class="text-xs text-muted-foreground">
											+₦{option.price.toFixed(2)}
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
					{/if}
				</div>
			</ScrollArea>
		</div>

		<div class="flex justify-end gap-3 pt-2">
			<Button 
				variant="outline" 
				type="button" 
				onclick={() => addOptionGroupModalState.value = false}
			>
				Cancel
			</Button>
			<Button type="submit">Create Group</Button>
		</div>
	</form>
	
	<AddOptionModal optionGroupId={null} />
</ResponsiveDialog>
