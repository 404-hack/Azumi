<!-- <script lang="ts">
	import { ArrowLeft, Trash } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import { Select } from '$lib/components/ui/select';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { client } from '$lib/hc';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { updateMenuSchema } from '@repo/server/validations';
	import { deleteModalState } from '$lib/states/modalState.svelte';

	export let data;

	const form = superForm(data.menuItem, {
		validators: zod(updateMenuSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const res = await client.menu[':id'].$patch({
						param: { id: data.menuItem.id },
						json: {
							...form.data
						}
					});
					if (res.ok) {
						toast.success('Menu item successfully updated');
						await invalidateAll();
					}
				} catch (error) {
					console.error('Failed to update menu item', error);
					toast.error('Failed to update menu item');
				}
			}
		}
	});
	const { form: formData, enhance, delayed } = form;

	let isDeleting = $state(false);

	async function handleDelete() {
		try {
			isDeleting = true;
			const res = await client.menu[':id'].$delete({
				param: { id: data.menuItem.id }
			});

			if (res.ok) {
				toast.success('Menu item deleted successfully');
				await invalidateAll();
				await goto('/vendor/menu?tabValue=menu-items');
			} else {
				toast.error('Failed to delete menu item');
			}
		} catch (error) {
			console.error('Error deleting menu item:', error);
			toast.error('An error occurred while deleting the menu item');
		} finally {
			isDeleting = false;
			deleteModalState.setFalse();
		}
	}
</script>

<div class="container max-w-3xl py-10">
	<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" href="/vendor/menu?tabValue=menu-items" class="h-8 w-8">
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-2xl font-semibold">Edit Menu Item</h1>
				<p class="text-sm text-muted-foreground">Update your menu item details</p>
			</div>
		</div>
		<div class="flex gap-2">
			<Button href={`/vendor/menu/meals/${data.menuItem.id}/options`} variant="outline">
				Manage Options
			</Button>
			<Button variant="destructive" onclick={() => deleteModalState.setTrue()}>
				<Trash class="mr-2 h-4 w-4" />
				Delete
			</Button>
		</div>
	</div>

	<form use:enhance class="space-y-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Item Details</Card.Title>
				<Card.Description>Basic information about your menu item</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Item Name</Form.Label>
							<Input
								{...props}
								bind:value={$formData.name}
								placeholder="e.g., Jollof Rice, Chicken Suya"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>A descriptive name for the menu item</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="description">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Description</Form.Label>
							<Textarea
								{...props}
								bind:value={$formData.description}
								placeholder="Describe your menu item, including key ingredients and flavors"
								class="min-h-[120px]"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>
						A short description that helps customers understand what they're ordering
					</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="price">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Price</Form.Label>
							<div class="relative">
								<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
								<Input
									{...props}
									type="number"
									min="0"
									step="0.01"
									class="pl-8"
									placeholder="0.00"
									bind:value={$formData.price}
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.Description>The price of the menu item in Naira</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="categoryId">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Category</Form.Label>
							<Select.Root
								bind:value={$formData.categoryId}
								items={data.categories.map((category) => ({
									value: category.id,
									label: category.name
								}))}
							>
								<Select.Trigger {...props} placeholder="Select a category" />
								<Select.Content>
									{#each data.categories as category}
										<Select.Item value={category.id}>{category.name}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.Description>The category this menu item belongs to</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="image">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Image URL</Form.Label>
							<Input
								{...props}
								bind:value={$formData.image}
								placeholder="Enter URL for the menu item image"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>
						A URL to an image of this menu item (optional but recommended)
					</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
			<Card.Footer>
				<div class="flex justify-end gap-4">
					<Button variant="outline" type="button" href="/vendor/menu?tabValue=menu-items">
						Cancel
					</Button>
					<Button type="submit" disabled={$delayed}>
						{#if $delayed}
							<span
								class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
							/>
						{/if}
						Save Changes
					</Button>
				</div>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
-->

