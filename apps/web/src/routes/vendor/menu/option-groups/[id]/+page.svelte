<script lang="ts">
	import { ArrowLeft, Plus, Trash, Search, X } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
	// import { Combobox } from '$lib/components/ui/combobox';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { client } from '$lib/hc';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { updateOptionGroupSchema } from '@repo/server/validations';
	import DeleteConfirmModal from '$lib/components/modal/DeleteConfirmModal.svelte';
	import { deleteModalState, addOptionModalState } from '$lib/states/modalState.svelte';
	import AddOptionModal from '$lib/components/modal/AddOptionModal.svelte';

	let { data } = $props();
	console.log('🚀 ~ data:', data.optionGroup);

	const form = superForm(defaults(data.optionGroup, zod(updateOptionGroupSchema)), {
		validators: zod(updateOptionGroupSchema),
		SPA: true,
		dataType: 'json',
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const res = await client.vendor['option-group'][':id'].$patch({
						param: { id: data.optionGroup.id },
						json: {
							...form.data,
							optionsId: selectedOptions.map((option) => option.id)
						}
					});
					if (res.ok) {
						toast.success('Option group successfully updated');
						goto('/vendor/menu');
					}
				} catch (error) {
					console.error('Failed to update option group', error);
					toast.error('Failed to update option group');
				}
			}
		}
	});
	const { form: formData, enhance, delayed } = form;

	// Initialize selected options from optionsToOptionGroups
	let searchQuery = $state('');
	let selectedOptions = $state(
		data.optionGroup.optionsToOptionGroups
			? data.optionGroup.optionsToOptionGroups.map((item) => item.option)
			: []
	);

	// Filter options that aren't already selected
	let filteredOptions = $derived(
		data.options.filter((option) => {
			const matchesSearch = option.name.toLowerCase().includes(searchQuery.toLowerCase());
			const isNotSelected = !selectedOptions.some((selected) => selected.id === option.id);
			return matchesSearch && isNotSelected;
		})
	);

	// Toggle all filtered options
	function toggleAllOptions(selectAll: boolean) {
		if (selectAll) {
			selectedOptions = [...selectedOptions, ...filteredOptions];
		} else {
			const filteredIds = new Set(filteredOptions.map((o) => o.id));
			selectedOptions = selectedOptions.filter((o) => !filteredIds.has(o.id));
		}
	}

	let isDeleting = $state(false);

	async function handleDelete() {
		try {
			isDeleting = true;
			const res = await client.option.group[':id'].$delete({
				param: { id: data.optionGroup.id }
			});

			if (res.ok) {
				toast.success('Option group deleted successfully');
				await invalidateAll();
				await goto('/vendor/menu?tabValue=option-groups');
			} else {
				toast.error('Failed to delete option group');
			}
		} catch (error) {
			console.error('Error deleting option group:', error);
			toast.error('An error occurred while deleting the option group');
		} finally {
			isDeleting = false;
			deleteModalState.setFalse();
		}
	}
</script>

<div class="container max-w-3xl py-10">
	<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<Button
				variant="ghost"
				size="icon"
				href="/vendor/menu?tabValue=option-groups"
				class="h-8 w-8"
			>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-2xl font-semibold">Edit Option Group</h1>
				<p class="text-sm text-muted-foreground">Update options and settings</p>
			</div>
		</div>
		<div class="flex gap-2">
			<Button variant="destructive" onclick={() => deleteModalState.setTrue()}>
				<Trash class="mr-2 h-4 w-4" />
				Delete
			</Button>
		</div>
	</div>

	<form use:enhance class="space-y-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Group Details</Card.Title>
				<Card.Description>Basic information about this option group</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Group Name</Form.Label>
							<Input
								{...props}
								bind:value={$formData.name}
								placeholder="e.g., Toppings, Sides, Drinks"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>A descriptive name for this group of options</Form.Description>
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
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Options</Card.Title>
				<Card.Description>Manage the options in this group</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-lg font-medium">Available Options</h3>
						<p class="text-sm text-muted-foreground">Select the options to include in this group</p>
					</div>
					<div class="flex items-center gap-2">
						<Button variant="outline" size="sm" onclick={() => addOptionModalState.setTrue()}>
							<Plus class="mr-2 h-4 w-4" />
							Add Option
						</Button>
						<Badge variant="outline">{selectedOptions.length} selected</Badge>
					</div>
				</div>

				<!-- Search and filter controls -->
				<div class="flex flex-col gap-3 sm:flex-row">
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

				<!-- Currently selected options -->
				{#if selectedOptions.length > 0}
					<div class="space-y-2">
						<h4 class="text-sm font-medium">Selected Options</h4>
						<div class="flex flex-wrap gap-2">
							{#each selectedOptions as option}
								<div class="flex items-center rounded-full bg-secondary px-3 py-1 text-sm">
									<span>{option.name}</span>
									{#if option.price > 0}
										<span class="ml-1 text-muted-foreground">+₦{option.price.toFixed(2)}</span>
									{/if}
									<button
										type="button"
										class="ml-1 rounded-full p-0.5 text-secondary-foreground/50 hover:text-secondary-foreground"
										onclick={() =>
											(selectedOptions = selectedOptions.filter((o) => o.id !== option.id))}
									>
										<X class="h-3 w-3" />
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Select all option -->
				{#if filteredOptions.length > 0}
					<div class="flex items-center space-x-2 border-b pb-2">
						<Checkbox
							id="select-all"
							checked={filteredOptions.every((o) => selectedOptions.some((s) => s.id === o.id))}
							onCheckedChange={(v) => toggleAllOptions(!!v)}
						/>
						<Label for="select-all" class="cursor-pointer text-sm font-medium">
							{filteredOptions.every((o) => selectedOptions.some((s) => s.id === o.id))
								? 'Deselect all'
								: 'Select all displayed options'}
						</Label>
					</div>
				{/if}

				<!-- Options grid -->
				<div class="mb-2 text-sm text-muted-foreground">
					Showing {filteredOptions.length} of {data.options.length} available options
					{#if searchQuery}
						for "{searchQuery}"
					{/if}
				</div>

				<div class="grid max-h-[300px] gap-3 overflow-y-auto p-1 sm:grid-cols-2">
					{#each filteredOptions as option}
						<div class="flex items-center space-x-3 rounded-md border p-3">
							<Checkbox
								id={`option-${option.id}`}
								checked={selectedOptions.some((o) => o.id === option.id)}
								onCheckedChange={(v) => {
									if (v) {
										selectedOptions = [...selectedOptions, option];
									} else {
										selectedOptions = selectedOptions.filter((o) => o.id !== option.id);
									}
								}}
							/>
							<div class="flex-1">
								<Label for={`option-${option.id}`} class="font-medium">
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

				{#if filteredOptions.length === 0 && searchQuery}
					<div class="rounded-md border border-dashed p-4 text-center text-muted-foreground">
						No options matching "{searchQuery}"
					</div>
				{/if}

				<AddOptionModal optionGroupId={data.optionGroup.id} />
			</Card.Content>
			<Card.Footer>
				<div class="flex justify-end gap-4">
					<Button variant="outline" type="button" href="/vendor/menu?tabValue=option-groups"
						>Cancel</Button
					>
					<Button type="submit" disabled={$delayed}>
						{$delayed ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</Card.Footer>
		</Card.Root>
	</form>
</div>

<DeleteConfirmModal
	itemName={data.optionGroup.name}
	loading={isDeleting}
	handleConfirm={handleDelete}
/>
