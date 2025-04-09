<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Plus,
		Search,
		ChevronUp,
		ChevronDown,
		GripVertical,
		MoreVertical,
		Pencil,
		Power,
		Trash
	} from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import AddOptionModal from '$lib/components/modal/AddOptionModal.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';
	import { MediaQuery } from 'svelte/reactivity';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import type { TOption, TOptionGroupWithOptions } from '@repo/server/types';
	import { addOptionModalState, deleteModalState } from '$lib/states/modalState.svelte';
	import DeleteConfirmModal from '$lib/components/modal/DeleteConfirmModal.svelte';
	import { client } from '$lib/hc';
	const isDesktop = new MediaQuery('(min-width: 768px)');
	type Props = {
		optionGroups: TOptionGroupWithOptions[];
	};

	let { optionGroups }: Props = $props();

	// Track the current option group ID for the modal
	let currentOptionGroupId = $state<string | null>(null);

	let deleteDialogOpen = $state(false);
	let editDialogOpen = $state(false);
	let editingOption: {
		groupId: string;
		option: { id: string; name: string; price: number; available: boolean };
	} | null = $state(null);

	// Function to open the add option modal with the current group ID
	function openAddOptionModal(groupId: string) {
		currentOptionGroupId = groupId;
		addOptionModalState.setTrue();
	}

	let deletingId: string | null = $state(null);
	let optionToDelete: TOption | null = $state(null);

	const deleteOption = async (id: string) => {
		try {
			deletingId = id;
			await client.option.vendor[':id'].$delete({
				param: { id }
			});
			toast.success(`${optionToDelete?.name} was successfully deleted`);

			// You might want to refresh the options list or emit an event here
		} finally {
			deletingId = null;
			invalidateAll();
			deleteModalState.setFalse();
		}
	};

	const handleDeleteClick = (option: TOption) => {
		optionToDelete = option;
		deleteModalState.setTrue();
	};

	const handleConfirmDelete = () => {
		if (optionToDelete) {
			deleteOption(optionToDelete.id);
		}
	};
</script>

<div class="space-y-6 pb-6">
	<div
		class="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<div class="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">Option Groups</h2>
				<p class="text-sm text-muted-foreground">
					Manage additional options and variations for your menu items.
				</p>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" href="/vendor/menu/options/new" class="flex-1 md:flex-none">
					<Plus class="mr-2 h-4 w-4" />
					Add New Option
				</Button>
				<Button href="/vendor/menu/option-groups/new" class="flex-1 md:flex-none">
					<Plus class="mr-2 h-4 w-4" />
					Add Option Group
				</Button>
			</div>
		</div>
	</div>

	{#if optionGroups.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center"
		>
			<div class="mb-4 rounded-full bg-muted p-3">
				<Plus class="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 class="mb-2 text-lg font-medium">No option groups yet</h3>
			<p class="mb-4 max-w-sm text-sm text-muted-foreground">
				Create your first option group to add variations like sizes, toppings, or add-ons to your
				menu items.
			</p>
			<a href="/vendor/menu/option-groups/new" class={buttonVariants({ size: 'sm' })}>
				<Plus class="mr-2 h-4 w-4" />
				Add Option Group
			</a>
		</div>
	{:else}
		<div class="rounded-md border">
			{#each optionGroups as group}
				<Collapsible.Root class="border-b last:border-0">
					<div class="flex items-center gap-2 p-4">
						<GripVertical class="h-4 w-4 text-muted-foreground" />
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<span class="font-medium">{group.name}</span>
								{#if group.minSelections > 0}
									<Badge variant="default">Required</Badge>
								{/if}
							</div>
							<p class="text-sm text-muted-foreground">
								{group.minSelections} - {group.maxSelections} selections allowed
							</p>
						</div>
						<div class="flex items-center gap-2">
							<Button variant="outline" href={`/vendor/menu/option-groups/${group.id}`} size="sm">Edit Group</Button>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Button
										variant="ghost"
										size="icon"
										class="h-9 w-9 p-0 transition-transform data-[state=open]:rotate-180"
										{...props}
									>
										<ChevronDown class="h-4 w-4" />
										<span class="sr-only">Toggle menu</span>
									</Button>
								{/snippet}
							</Collapsible.Trigger>
						</div>
					</div>
					<Collapsible.Content
						class="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
					>
						<div class="border-t">
							<div class="flex justify-end p-2">
								<Button variant="outline" size="sm" onclick={() => openAddOptionModal(group.id)}>
									<Plus class="mr-2 h-4 w-4" />
									Add Option
								</Button>
							</div>
							{#if group.optionsToOptionGroups.length === 0}
								<div class="flex flex-col items-center justify-center p-8 text-center">
									<p class="mb-2 text-sm text-muted-foreground">No options in this group yet</p>
									<Button
										variant="outline"
										onclick={() => {
											openAddOptionModal(group.id);
										}}
										size="sm"
									>
										<Plus class="mr-2 h-4 w-4" />
										Add Option
									</Button>
								</div>
							{:else if isDesktop.current}
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head class="w-[40px]" />
											<Table.Head>Name</Table.Head>
											<Table.Head>Price</Table.Head>
											<Table.Head>Status</Table.Head>
											<Table.Head class="text-right">Actions</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each group.optionsToOptionGroups as { option }}
											<Table.Row>
												<Table.Cell>
													<GripVertical class="h-4 w-4 text-muted-foreground" />
												</Table.Cell>
												<Table.Cell class="font-medium">{option.name}</Table.Cell>
												<Table.Cell>
													{#if option.price > 0}
														+${option.price}
													{:else}
														--
													{/if}
												</Table.Cell>
												<Table.Cell>
													<Badge
														variant={option.inStock ? 'default' : 'destructive'}
														class="w-[90px] justify-center"
													>
														{option.inStock ? 'Available' : 'Unavailable'}
													</Badge>
												</Table.Cell>
												<Table.Cell class="text-right">
													<ResponsiveDropdown>
														{#snippet trigger()}
															<Button variant="ghost" size="icon">
																<MoreVertical class="h-4 w-4" />
																<span class="sr-only">Open menu</span>
															</Button>
														{/snippet}
														{#snippet children()}
															<button class="dropdown-menu-item">
																<Pencil class="mr-2 h-4 w-4" />
																Edit Option
															</button>
															<button class="dropdown-menu-item">
																<Power class="mr-2 h-4 w-4" />
																Toggle Availability
															</button>
															<div class="dropdown-menu-separator" />
															<button
																onclick={() => handleDeleteClick(option)}
																class="dropdown-menu-item text-destructive"
															>
																<Trash class="mr-2 h-4 w-4" />
																Delete Option
															</button>
														{/snippet}
													</ResponsiveDropdown>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							{:else}
								<div class="divide-y">
									{#each group.optionsToOptionGroups as { option }}
										<div class="flex items-center gap-4 p-4">
											<div class="flex-1 space-y-1">
												<div class="flex items-center gap-2">
													<span class="font-medium">{option.name}</span>
													{#if option.price > 0}
														<span class="text-sm text-muted-foreground">+${option.price}</span>
													{/if}
												</div>
												<Badge
													variant={option.inStock ? 'default' : 'destructive'}
													class="w-[90px] justify-center"
												>
													{option.inStock ? 'Available' : 'Unavailable'}
												</Badge>
											</div>
											<ResponsiveDropdown>
												{#snippet trigger()}
													<Button variant="ghost" size="icon">
														<MoreVertical class="h-4 w-4" />
														<span class="sr-only">Open menu</span>
													</Button>
												{/snippet}
												{#snippet children()}
													<button class="dropdown-menu-item">
														<Pencil class="mr-2 h-4 w-4" />
														Edit Option
													</button>
													<button class="dropdown-menu-item">
														<Power class="mr-2 h-4 w-4" />
														Toggle Availability
													</button>
													<div class="dropdown-menu-separator" />
													<button class="dropdown-menu-item text-destructive">
														<Trash class="mr-2 h-4 w-4" />
														Delete Option
													</button>
												{/snippet}
											</ResponsiveDropdown>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			{/each}
		</div>
	{/if}
</div>

<!-- Add the option modal with the current group ID -->
<AddOptionModal optionGroupId={currentOptionGroupId} />
<DeleteConfirmModal
	itemName={optionToDelete?.name}
	loading={!!deletingId}
	handleConfirm={handleConfirmDelete}
/>

<style>
	@keyframes collapsible-down {
		from {
			height: 0;
		}
		to {
			height: var(--radix-collapsible-content-height);
		}
	}

	@keyframes collapsible-up {
		from {
			height: var(--radix-collapsible-content-height);
		}
		to {
			height: 0;
		}
	}

	:global(.animate-collapsible-down) {
		animation: collapsible-down 0.2s ease-out;
	}

	:global(.animate-collapsible-up) {
		animation: collapsible-up 0.2s ease-out;
	}
</style>
