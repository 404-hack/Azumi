<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { productSchema } from '$lib/formSchema';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/components/ui/form';
	import { Loader2, Plus } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import AddProductCategory from './component/AddProductCategory.svelte';

	let { data } = $props();
	let productCategoryForm = {
		name: ''
	};

	const form = superForm(defaults(zod(productSchema)), {
		validators: zodClient(productSchema)
	});

	const { form: formData, enhance, delayed } = form;

	const dummyProductCategories = [
		{
			id: 1,
			name: 'Electronics'
		},
		{
			id: 2,
			name: 'Fashion'
		},
		{
			id: 3,
			name: 'Home & Living'
		},
		{
			id: 4,
			name: 'Toys & Games'
		}
	];
</script>

<div class="flex min-h-screen w-full items-center justify-center bg-muted/40">
	<form
		method="POST"
		action="/seller/products/add?/createProduct"
		use:enhance
		class="my-10 w-full max-w-xl"
	>
		<Card.Root>
			<Card.Header>
				<Card.Title>Product Details</Card.Title>
			</Card.Header>
			<Card.Content>
				<div>
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<div>
									<Form.Label>Name</Form.Label>
									<Input class="w-full" {...props} bind:value={$formData.name} />
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="description">
						<Form.Control>
							{#snippet children({ props })}
								<div>
									<Form.Label>Description</Form.Label>
									<Textarea class="w-full" {...props} bind:value={$formData.description} />
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<div class="flex items-center gap-3">
						{#if dummyProductCategories.length > 0}
							<Form.Field {form} name="category">
								<Form.Control>
									{#snippet children({ props })}
										<div>
											<Form.Label>category</Form.Label>
											<Select.Root>
												<Select.Trigger>Select a category</Select.Trigger>
												<Select.Content>
													{#each dummyProductCategories as category}
														<Select.Item value={String(category.id)} label={category.name} />
													{/each}
												</Select.Content>
											</Select.Root>
											<input hidden bind:value={$formData.category} name={attrs.name} />
										</div>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						{:else}
							<div class="grid gap-2">
								<Label>Category</Label>
								<p class="text-muted-foreground">
									you currently don't have any category, click on the plus button on the right to
									add one
								</p>
							</div>
						{/if}
						<AddProductCategory {productCategoryForm} />
					</div>
				</div>
			</Card.Content>
			<Card.Footer>
				<Form.Button class="mt-2 w-full"
					>{#if $delayed}
						<Loader2 class="size-6 animate-spin " />
					{:else}
						create
					{/if}</Form.Button
				>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
