<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import * as Form from '$lib/components/ui/form';
	import { Loader, ArrowLeft } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { updateMenuCategorySchema } from '@repo/server/validations';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';

	export let data;

	// Get the category data from the page data
	const { category } = data;

	// Setup the form
	const form = superForm(defaults({ ...category }, zod(updateMenuCategorySchema)), {
		validators: zod(updateMenuCategorySchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const res = await client.vendor.menu.category[':id'].$put({
						param: { id: category.id },
						json: {
							name: form.data.name,
							published: form.data.published
						}
					});

					const responseData = await res.json();

					if (res.ok) {
						toast.success('Category updated successfully');
						goto(`/vendor/categories/${category.id}`);
					} else {
						toast.error(responseData.message || 'Failed to update category');
					}
				} catch (error) {
					console.error('Error updating category:', error);
					toast.error('An error occurred while updating the category');
				}
			}
		}
	});

	const { form: formData, enhance, delayed } = form;

	// Function to go back to the category detail page
	function goBack() {
		goto(`/vendor/categories/${category.id}`);
	}
</script>

<div class="container mx-auto space-y-6 p-4">
	<!-- Header with back button -->
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="icon" onclick={goBack}>
			<ArrowLeft class="h-5 w-5" />
		</Button>
		<h1 class="text-2xl font-bold">Edit Category</h1>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Edit {category.name}</Card.Title>
			<Card.Description>Update your category details below</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-6">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Category name</Form.Label>
							<Input class="w-full" {...props} bind:value={$formData.name} />
						{/snippet}
					</Form.Control>
					<Form.Description
						>The name of your category as it will appear to customers</Form.Description
					>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="published">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center justify-between">
								<div>
									<Form.Label>Publish Category</Form.Label>
									<Form.Description
										>When enabled, this category will be visible to customers</Form.Description
									>
								</div>
								<Switch {...props} bind:checked={$formData.published} />
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="flex items-center gap-2">
					<Button type="button" variant="outline" onclick={goBack}>Cancel</Button>
					<Button type="submit" class="shadow-md">
						{#if $delayed}
							<Loader class="mr-2 h-4 w-4 animate-spin" />
							Saving...
						{:else}
							Save Changes
						{/if}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
