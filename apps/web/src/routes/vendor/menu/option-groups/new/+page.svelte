<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, GripVertical, X, Search } from 'lucide-svelte';
	import * as Form from '$lib/components/ui/form';
	import { Switch } from '$lib/components/ui/switch';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import SuperDebug from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createOptionGroupSchema } from '@repo/server/validations';
	import { client } from '$lib/hc.js';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import AddOptionModal from '$lib/components/modal/AddOptionModal.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { addOptionModalState } from '$lib/states/modalState.svelte';
	let { data } = $props();
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
					toast.success('Option group created successfully');
					await invalidateAll();
					goto('/vendor/menu/?tabValue=option-groups');
				}
			}
		}
	});
	const { form: formData, errors: formErrors, enhance } = form;

	// Add state for option filtering
	let searchQuery = $state('');
	
	// Computed property for filtered options
	let filteredOptions = $derived(data.options.filter(option => {
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

<div class="container max-w-2xl py-10">
	<div class="mb-8">
		<h1 class="text-3xl font-bold">Add Option Group</h1>
		<p class="text-muted-foreground">Create a new group of options for your menu items</p>
	</div>
	<form use:enhance class="space-y-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Group Details</Card.Title>
				<Card.Description>Basic information about your option group</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
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

				<div class="space-y-4">
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
				<div class="space-y-4">
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-medium">Available Options</h3>
								<p class="text-sm text-muted-foreground">
									Select the options to include in this group
								</p>
							</div>
							<div class="flex items-center gap-2">
								<Button variant="outline" size="sm" onclick={() => addOptionModalState.setTrue()}>
									<Plus class="mr-2 h-4 w-4" />
									Add Option
								</Button>
								<Badge variant="outline">{data.options.length} options</Badge>
							</div>
						</div>
					</div>

					<!-- Search and filter controls -->
					<div class="flex flex-col sm:flex-row gap-3">
						<div class="relative flex-1">
							<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input 
								type="search"
								placeholder="Search options..." 
								class="pl-9"
								bind:value={searchQuery}
							/>
						</div>
					</div>
					
					<!-- Select all option -->
					{#if filteredOptions.length > 0}
						<div class="flex items-center space-x-2 border-b pb-2">
							<Checkbox 
								id="select-all"
								checked={filteredOptions.every(o => $formData.optionsId.includes(o.id))}
								onCheckedChange={(v) => toggleAllOptions(!!v)}
							/>
							<Label for="select-all" class="text-sm font-medium cursor-pointer">
								{filteredOptions.every(o => $formData.optionsId.includes(o.id)) 
									? "Deselect all" 
									: "Select all displayed options"}
							</Label>
						</div>
					{/if}
					
					<!-- Options grid with results count -->
					<div class="text-sm text-muted-foreground mb-2">
						Showing {filteredOptions.length} of {data.options.length} options
						{#if searchQuery}
							for "{searchQuery}"
						{/if}
					</div>

					<div class="mt-3 grid gap-3 sm:grid-cols-2 max-h-[400px] overflow-y-auto p-1">
						{#each filteredOptions as option}
							{@const checked = $formData.optionsId.includes(option.id)}
							<div
								class="flex items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
							>
								<Checkbox
									id={`option-${option.id}`}
									aria-labelledby={`option-${option.id}-label`}
									{checked}
									onCheckedChange={(v) => {
										if (v) {
											$formData.optionsId = [...$formData.optionsId, option.id];
										} else {
											$formData.optionsId = $formData.optionsId.filter((i) => i !== option.id);
										}
									}}
								/>
								<div class="flex-1">
									<Label
										id={`option-${option.id}-label`}
										for={`option-${option.id}`}
										class="font-medium"
									>
										{option.name}
									</Label>
									{#if option.price > 0}
										<p class="text-sm text-muted-foreground">
											+₦{option.price.toFixed(2)}
										</p>
									{/if}
									
								</div>
							</div>
						{/each}
					</div>

					{#if filteredOptions.length === 0}
						<div class="rounded-md border border-dashed p-4 text-center text-muted-foreground">
							{searchQuery ? `No options matching "${searchQuery}"` : 'No options available. Create options first.'}
						</div>
					{/if}
				</div>

				<AddOptionModal optionGroupId={null} />
			</Card.Content>
			<Card.Footer>
				<div class="flex justify-end gap-4">
					<Button variant="outline" type="button">Cancel</Button>
					<Button type="submit">Create Group</Button>
				</div>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
