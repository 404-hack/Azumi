<script lang="ts">
	import { ArrowLeft, Plus, Search, ChevronDown, X } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import { Select } from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import { Badge } from '$lib/components/ui/badge';
	import * as Accordion from '$lib/components/ui/accordion';
	import { client } from '$lib/hc';
	import { invalidateAll } from '$app/navigation';
	import { Combobox } from '$lib/components/ui/combobox';
	import { slide } from 'svelte/transition';

	export let data;

	let searchQuery = $state('');
	let showSearch = $state(false);
	let selectedOptGroup = $state<string | null>(null);
	let selectedOption = $state<string | null>(null);
	let loadingAdd = $state(false);
	let loadingRemove = $state(false);
	let itemToRemove = $state<string | null>(null);

	const menuItem = data.menuItem;
	const optionGroups = data.optionGroups;
	const options = data.options;
	
	let filteredGroups = $derived(
		optionGroups.filter((group) => {
			if (searchQuery === '') return true;
			return (
				group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				group.options.some((option) => option.name.toLowerCase().includes(searchQuery.toLowerCase()))
			);
		})
	);

	let availableOptionGroups = $derived(
		optionGroups.filter(
			(group) => !menuItem.optionGroups.some((assignedGroup) => assignedGroup.id === group.id)
		)
	);

	let availableOptions = $derived(() => {
		if (!selectedOptGroup) return [];
		
		const group = optionGroups.find((g) => g.id === selectedOptGroup);
		if (!group) return [];
		
		return group.options;
	});

	function toggleSearch() {
		showSearch = !showSearch;
		if (!showSearch) {
			searchQuery = '';
		}
	}

	async function addOptionGroup() {
		if (!selectedOptGroup) return;

		try {
			loadingAdd = true;
			
			const response = await client.menu.menuItem[':menuId'].optionGroup[':optionGroupId'].$post({
				param: {
					menuId: menuItem.id,
					optionGroupId: selectedOptGroup
				}
			});

			if (response.ok) {
				toast.success('Option group added successfully');
				await invalidateAll();
				selectedOptGroup = null;
			} else {
				toast.error('Failed to add option group');
			}
		} catch (error) {
			console.error('Error adding option group:', error);
			toast.error('An error occurred while adding the option group');
		} finally {
			loadingAdd = false;
		}
	}

	async function removeOptionGroup(groupId: string) {
		try {
			loadingRemove = true;
			itemToRemove = groupId;
			
			const response = await client.menu.menuItem[':menuId'].optionGroup[':optionGroupId'].$delete({
				param: {
					menuId: menuItem.id,
					optionGroupId: groupId
				}
			});

			if (response.ok) {
				toast.success('Option group removed successfully');
				await invalidateAll();
			} else {
				toast.error('Failed to remove option group');
			}
		} catch (error) {
			console.error('Error removing option group:', error);
			toast.error('An error occurred while removing the option group');
		} finally {
			loadingRemove = false;
			itemToRemove = null;
		}
	}
</script>

<div class="container max-w-5xl py-10">
	<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" href={`/vendor/menu/meals/${menuItem.id}`} class="h-8 w-8">
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-2xl font-semibold">Manage Menu Item Options</h1>
				<p class="text-sm text-muted-foreground">
					Configure options for <span class="font-medium">{menuItem.name}</span>
				</p>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				class="h-9 w-9 rounded-full"
				aria-label="Search"
				onclick={toggleSearch}
			>
				<Search class="h-4 w-4" />
			</Button>
			<div class="flex gap-2">
				<Select.Root bind:value={selectedOptGroup} onValueChange={() => (selectedOption = null)}>
					<Select.Trigger
						placeholder="Select option group"
						disabled={availableOptionGroups.length === 0}
						class="w-[200px] md:w-[240px]"
					>
						{#if selectedOptGroup}
							{optionGroups.find((g) => g.id === selectedOptGroup)?.name || 'Select option group'}
						{:else}
							Select option group
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#if availableOptionGroups.length === 0}
							<div class="p-2 text-center text-sm text-muted-foreground">
								All option groups are assigned
							</div>
						{:else}
							{#each availableOptionGroups as group}
								<Select.Item value={group.id}>{group.name}</Select.Item>
							{/each}
						{/if}
					</Select.Content>
				</Select.Root>

				<Button
					onclick={addOptionGroup}
					disabled={!selectedOptGroup || loadingAdd}
					variant={selectedOptGroup ? 'default' : 'outline'}
				>
					{#if loadingAdd}
						<span
							class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						/>
					{:else}
						<Plus class="mr-2 h-4 w-4" />
					{/if}
					Add Option Group
				</Button>
			</div>
		</div>
	</div>

	{#if showSearch}
		<div transition:slide={{ duration: 300 }} class="mb-6">
			<Input
				type="search"
				placeholder="Search option groups and options..."
				bind:value={searchQuery}
			/>
		</div>
	{/if}

	{#if menuItem.optionGroups.length === 0}
		<Card.Root>
			<div class="flex flex-col items-center justify-center rounded-md p-8 text-center">
				<div class="mb-4 rounded-full bg-muted p-3">
					<Plus class="h-6 w-6 text-muted-foreground" />
				</div>
				<h3 class="mb-2 text-lg font-medium">No option groups assigned</h3>
				<p class="mb-4 max-w-md text-sm text-muted-foreground">
					Add option groups to this menu item to allow customers to customize their order.
				</p>
				{#if optionGroups.length === 0}
					<Button href="/vendor/menu/option-groups/new">Create Option Group</Button>
				{/if}
			</div>
		</Card.Root>
	{:else}
		<Accordion.Root type="multiple" class="space-y-4">
			{#each filteredGroups as group (group.id)}
				{#if menuItem.optionGroups.some((g) => g.id === group.id)}
					<Accordion.Item value={group.id} class="rounded-lg border bg-card">
						<Accordion.Header class="px-6 py-4">
							<Accordion.Trigger class="group flex w-full items-center justify-between gap-2">
								<div class="flex items-center gap-3">
									<span class="text-lg font-medium">{group.name}</span>
									<Badge variant={group.required ? 'default' : 'outline'}>
										{group.required ? 'Required' : 'Optional'}
									</Badge>
									{#if group.min > 0 || group.max > 0}
										<Badge variant="outline">
											{#if group.min > 0 && group.max > 0}
												Select {group.min === group.max ? `${group.min}` : `${group.min}-${group.max}`}
											{:else if group.min > 0}
												Min: {group.min}
											{:else if group.max > 0}
												Max: {group.max}
											{/if}
										</Badge>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										class="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
										onclick={(e) => {
											e.stopPropagation();
											removeOptionGroup(group.id);
										}}
										disabled={loadingRemove && itemToRemove === group.id}
									>
										{#if loadingRemove && itemToRemove === group.id}
											<span
												class="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
											/>
										{/if}
										Remove
									</Button>
									<ChevronDown
										class="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
									/>
								</div>
							</Accordion.Trigger>
						</Accordion.Header>
						<Accordion.Content class="overflow-hidden px-6 pb-4 pt-0 text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
							<div class="rounded-md border">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Option Name</Table.Head>
											<Table.Head>Description</Table.Head>
											<Table.Head>Price</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each group.options as option}
											<Table.Row>
												<Table.Cell class="font-medium">{option.name}</Table.Cell>
												<Table.Cell>{option.description || 'No description'}</Table.Cell>
												<Table.Cell>
													{#if option.price > 0}
														+₦{option.price.toFixed(2)}
													{:else}
														No extra cost
													{/if}
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				{/if}
			{/each}
		</Accordion.Root>
	{/if}
</div>