<script lang="ts">
	import { ArrowLeft, Camera, HelpCircle, Loader2, Upload } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import SuperDebug, { defaults, filesProxy, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Select from '$lib/components/ui/select';
	import { createMenuSchema } from '@repo/server/validations';
	import AddCategoryModal from '$lib/components/modal/AddCategoryModal.svelte';
	import {
		addCategoryModalState,
		addOptionGroupModalState,
		addPackModalState
	} from '$lib/states/modalState.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import AddPackModal from '$lib/components/modal/AddPackModal.svelte';
	import AddOptionGroupModal from '$lib/components/modal/AddOptionGroupModal.svelte';
	import { client } from '$lib/hc';
	import { goto, invalidateAll } from '$app/navigation';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	let imagePreview: string | null = $state(null);
	let fileInput: HTMLInputElement;
	let { data } = $props();

	function getCategoryName(categoryId: string) {
		const category = data.categories.find((cat) => cat.id === categoryId);
		return category?.name || 'Unknown Category';
	}

	function handleImagePick(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			// Create preview URL
			imagePreview = URL.createObjectURL(file);
			$formData.image = file;
			// Clean up the old preview URL when component unmounts
			return () => {
				if (imagePreview) {
					URL.revokeObjectURL(imagePreview);
				}
			};
		}
	}

	function removeImage() {
		imagePreview = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	const form = superForm(defaults(zod(createMenuSchema)), {
		validators: zodClient(createMenuSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const res = await client.vendor.menu.create.$post({
						json: {
							...form.data
						}
					});
					if (res.ok) {
						const data = await res.json();
						await invalidateAll();
						goto('/vendor/menu/');
					}
				} catch (error) {
					console.error('Failed to create menu item', error);
				}
			}
		}
	});
	const { form: formData, enhance, delayed } = form;
</script>

<AddCategoryModal />
<AddPackModal />
<AddOptionGroupModal />

<div class="min-h-screen bg-gray-50">
	<div class="sticky top-0 z-10 border-b bg-white shadow-sm">
		<div class="container mx-auto">
			<div class="flex h-16 items-center gap-4 px-4">
				<Button variant="ghost" size="icon" class="shrink-0">
					<ArrowLeft class="h-5 w-5" />
				</Button>
				<h1 class="text-xl font-semibold">Add New Menu Item</h1>
			</div>
		</div>
	</div>

	<form use:enhance enctype="multipart/form-data" class="container mx-auto max-w-4xl py-8">
		<div class="grid gap-8 px-4">
			<!-- Basic Details -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Basic Details</Card.Title>
					<Card.Description>Enter the basic information about your menu item</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Item Name</Form.Label>
								<Input {...props} bind:value={$formData.name} placeholder="Enter item name" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="categoryId">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Category</Form.Label>
								<div class="space-y-2">
									<Select.Root type="single" bind:value={$formData.categoryId}>
										<Select.Trigger class="w-full">
											{$formData.categoryId
												? getCategoryName($formData.categoryId)
												: 'Select category'}
										</Select.Trigger>
										<Select.Content>
											{#each data.categories as category}
												<Select.Item value={category.id}>{category.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
									<Button
										variant="link"
										class="h-auto p-0"
										onclick={() => addCategoryModalState.setTrue()}
									>
										+ Add new category
									</Button>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<div class="grid gap-6 sm:grid-cols-2">
						<Form.Field {form} name="price">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Price</Form.Label>
									<div class="relative">
										<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
										<Input
											type="number"
											min="0"
											step="0.01"
											class="pl-8"
											placeholder="0.00"
											{...props}
											bind:value={$formData.price}
										/>
									</div>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="priceDescription">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Price Description</Form.Label>
									<Input
										{...props}
										bind:value={$formData.priceDescription}
										placeholder="e.g. per plate"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>

					<Form.Field {form} name="description">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Description</Form.Label>
								<Textarea
									{...props}
									bind:value={$formData.description}
									placeholder="Describe your menu item"
									class="min-h-[120px]"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</Card.Content>
			</Card.Root>

			<!-- Image Upload Section -->
			<!-- <Card.Root>
				<Card.Header>
					<Card.Title>Item Image</Card.Title>
					<Card.Description>Upload a photo of your menu item</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex flex-col items-center gap-6">
						{#if imagePreview}
							<div class="relative">
								<img
									src={imagePreview}
									alt="Preview"
									class="h-64 w-64 rounded-lg object-cover shadow-md"
								/>
								<button
									type="button"
									class="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
									onclick={removeImage}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>
							</div>
						{:else}
							<label
								class="flex h-64 w-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
							>
								<div class="flex flex-col items-center justify-center pb-6 pt-5">
									<svg
										class="mb-4 h-8 w-8 text-gray-500"
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 20 16"
									>
										<path
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
										/>
									</svg>
									<p class="mb-2 text-sm text-gray-500">
										<span class="font-semibold">Click to upload</span>
										or drag and drop
									</p>
									<p class="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 2MB)</p>
								</div>
								<input
									bind:this={fileInput}
									type="file"
									class="hidden"
									accept="image/png, image/jpeg, image/webp"
									onchange={handleImagePick}
								/>
							</label>
						{/if}
					</div>
					<div class="text-center">
						<Button variant="outline" class="relative">
							<Upload class="mr-2 h-4 w-4" />
							Choose Image
						</Button>
						<p class="mt-2 text-sm text-gray-500">JPG or PNG, max 1MB</p>
					</div>
				</Card.Content>
			</Card.Root> -->

			<!-- Additional Options -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Additional Options</Card.Title>
					<Card.Description>Configure additional settings for this menu item</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					<Form.Field {form} name="inStock" class="mb-1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Availability</Form.Label>
								<p class="text-sm text-gray-500">Mark this item as available in stock</p>

								<Switch {...props} bind:checked={$formData.inStock} />
							{/snippet}
						</Form.Control>
					</Form.Field>

					<div class="grid gap-6 sm:grid-cols-2">
						<!-- <Form.Field {form} name="packId">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Pack Options <Badge variant="outline">Optional</Badge></Form.Label>
									<div class="space-y-2">
										<Select.Root bind:value={$formData.packId}>
											<Select.Trigger>Select pack option</Select.Trigger>
											<Select.Content>
												<Select.Item value="small">Small Pack</Select.Item>
												<Select.Item value="medium">Medium Pack</Select.Item>
												<Select.Item value="large">Large Pack</Select.Item>
											</Select.Content>
										</Select.Root>
										<Button
											variant="link"
											class="h-auto p-0"
											onclick={() => addPackModalState.setTrue()}
										>
											+ Add new pack option
										</Button>
									</div>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field> -->

						<Form.Field {form} name="optionGroupId">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Option Group <Badge variant="outline">Optional</Badge></Form.Label>
									<div class="space-y-2">
										<Select.Root type="multiple" bind:value={$formData.optionGroupId}>
											<Select.Trigger class="h-12">
												{#if $formData.optionGroupId && $formData.optionGroupId.length > 0}
													<div class="flex flex-wrap gap-1">
														{#each $formData.optionGroupId as groupId}
															<Badge variant="secondary" class="mr-1">
																{data.optionGroups.find((group) => group.id === groupId)?.name ||
																	'Unknown'}
															</Badge>
														{/each}
													</div>
												{:else}
													Select Group
												{/if}
											</Select.Trigger>
											<Select.Content>
												{#each data.optionGroups as { name, id }}
													<Select.Item value={id}>{name}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
										<div class="flex gap-2">
											<Button
												variant="link"
												href="/vendor/menu/add-option-group"
												class="h-auto p-0 text-primary">+ Create New Option Group</Button
											>
											<Button
												variant="link"
												onclick={() => {
													addOptionGroupModalState.setTrue();
												}}
												class="h-auto p-0 text-primary">+ Quick Add Group</Button
											>
										</div>
									</div>
								{/snippet}
							</Form.Control>
							<Form.Description>
								Add option groups to allow customers to customize their order. Quick Add for simple
								groups, Create New for detailed options.
							</Form.Description>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</Card.Content>
			</Card.Root>

			<div class="flex justify-end gap-4">
				<!-- <Button variant="outline" size="lg">Save as Draft</Button> -->
				<Form.Button size="lg" class="min-w-[150px]">
					{#if $delayed}
						<Loader2 class="mr-2 animate-spin" />
					{/if}
					Publish Item
				</Form.Button>
			</div>
		</div>
	</form>
</div>
