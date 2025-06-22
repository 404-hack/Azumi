<script lang="ts">
	import { ArrowLeft, Camera, HelpCircle, Loader2, Upload } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import SuperDebug, { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Select from '$lib/components/ui/select';
	import { createMenuSchema } from '@repo/server/validations';
	import AddCategoryModal from '$lib/components/modal/AddCategoryModal.svelte';
	import { toast } from 'svelte-sonner';
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
	import { onDestroy } from 'svelte';

	let fileInput: HTMLInputElement = $state();
	let { data } = $props();

	// State for image preview
	let imagePreview: string | null = $state(null);

	// Cleanup function to prevent memory leaks
	onDestroy(() => {
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
		}
	});

	function getCategoryName(categoryId: string) {
		const category = data.categories.find((cat) => cat.id === categoryId);
		return category?.name || 'Unknown Category';
	}

	function handleImagePick(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			// Check file size (max 5MB)
			const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
			if (file.size > maxSizeInBytes) {
				alert('Image size exceeds the maximum limit of 5MB. Please choose a smaller image.');
				// Reset the file input
				if (fileInput) {
					fileInput.value = '';
				}
				removeImage();
				return;
			}

			// Set the file directly in the form
			$formData.image = file;

			// Create preview URL
			if (imagePreview) {
				URL.revokeObjectURL(imagePreview);
			}
			imagePreview = URL.createObjectURL(file);
		} else {
			// If no file is selected (e.g., user canceled), clean up
			removeImage();
		}
	}

	function removeImage() {
		// Revoke object URL to prevent memory leaks
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
		}

		// Reset the preview
		imagePreview = null;

		// Clear the file input and the form data
		if (fileInput) {
			fileInput.value = '';
			$formData.image = null;
		}
	}

	const form = superForm(defaults(zod(createMenuSchema)), {
		validators: zodClient(createMenuSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const formData = new FormData();

					// Handle image file separately
					if (form.data.image instanceof File) {
						formData.append('image', form.data.image);
					}

					// Add rest of the fields with explicit type conversion
					if (form.data.name) formData.append('name', form.data.name);
					if (form.data.description) formData.append('description', form.data.description);
					if (form.data.price !== undefined) formData.append('price', form.data.price.toString());
					// if (form.data.priceDescription)
					// 	formData.append('priceDescription', form.data.priceDescription);
					if (form.data.inStock !== undefined)
						formData.append('inStock', form.data.inStock.toString());
					if (form.data.categoryId) formData.append('categoryId', form.data.categoryId);

					// Handle optional fields
					if (form.data.packId) formData.append('packId', form.data.packId);

					// Handle array fields
					if (form.data.optionGroupId && Array.isArray(form.data.optionGroupId)) {
						form.data.optionGroupId.forEach((id) => {
							formData.append('optionGroupId[]', id);
						});
					}

					const res = await client.vendor.menu.$post({
						form: form.data
					});

					if (res.ok) {
						const data = await res.json();
						await invalidateAll();
						goto('/vendor/menu/');
						// Show toast here
						toast.success('Menu Item Created', {
							description: 'Your menu item has been created successfully.'
						});
					}
				} catch (error) {
					console.error('Failed to create menu item', error);
				}
			}
		}
	});

	const { form: formData, enhance, delayed, errors } = form;
</script>

<AddCategoryModal
	afterSubmit={(category) => {
		$formData.categoryId = category.id;
	}}
/>
<AddPackModal
	afterSubmit={(pack) => {
		$formData.packId = pack.id;
	}}
/>
<AddOptionGroupModal
	options={data.options}
	afterSubmit={(newGroup) => {
		$formData.optionGroupId = [...($formData.optionGroupId || []), newGroup.id];
	}}
/>

<div class="min-h-screen">
	<div class="sticky top-0 z-10 border-b bg-white shadow-sm">
		<div class=" mx-auto">
			<div class="flex h-16 items-center gap-4">
				<Button variant="ghost" size="icon" class="shrink-0" onclick={() => history.back()}>
					<ArrowLeft class="h-5 w-5" />
				</Button>
				<h1 class="text-xl font-semibold">Add New Menu Item</h1>
			</div>
		</div>
	</div>

	<form use:enhance enctype="multipart/form-data" class=" mx-auto max-w-4xl py-8">
		<div class="grid gap-8">
			<!-- Basic Details -->
			<Card.Root class="border-none  sm:border">
				<Card.Header class="px-0 sm:p-6">
					<Card.Title>Basic Details</Card.Title>
					<Card.Description>Enter the basic information about your menu item</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6 px-0 sm:p-6">
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
			<Card.Root class="border-none sm:border">
				<Card.Header class="px-0 sm:p-6">
					<Card.Title>Item Image</Card.Title>
					<Card.Description>Upload a photo of your menu item</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6 px-0 sm:p-6">
					<Form.Field {form} name="image">
						<Form.Control>
							{#snippet children({ props })}
								<div class="flex flex-col items-center gap-6">
									{#if imagePreview}
										<div class="group relative">
											<img
												src={imagePreview}
												alt="Menu item preview"
												class="h-64 w-full rounded-lg object-cover shadow-md sm:w-96"
											/>
											<div
												class="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100"
											>
												<Button
													variant="destructive"
													size="icon"
													onclick={removeImage}
													type="button"
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
												</Button>
											</div>
										</div>
									{:else}
										<div class="flex w-full justify-center">
											<label
												for="dropzone-file"
												class="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors duration-200 hover:bg-gray-100 sm:w-96"
											>
												<div class="flex flex-col items-center justify-center pb-6 pt-5">
													<Camera class="mb-3 h-10 w-10 text-gray-400" />
													<p class="mb-2 text-sm text-gray-500">
														<span class="font-semibold">Click to upload</span>
														or drag and drop
													</p>
													<p class="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5MB)</p>
												</div>
												<input
													id="dropzone-file"
													bind:this={fileInput}
													type="file"
													class="hidden"
													name="image"
													accept="image/png, image/jpeg, image/webp"
													onchange={(event) => handleImagePick(event)}
													{...props}
												/>
											</label>
										</div>
									{/if}

									<div class="mt-2 flex flex-col items-center gap-2">
										<Button
											variant="outline"
											type="button"
											class="relative"
											onclick={(e) => {
												e.preventDefault();
												fileInput.click();
											}}
										>
											<Upload class="mr-2 h-4 w-4" />
											{imagePreview ? 'Change Image' : 'Choose Image'}
										</Button>
										<p class="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5MB)</p>
									</div>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</Card.Content>
			</Card.Root>

			<!-- Additional Options -->
			<Card.Root class="border-none sm:border">
				<Card.Header class="px-0 sm:p-6">
					<Card.Title>Additional Options</Card.Title>
					<Card.Description>Configure additional settings for this menu item</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6 px-0 sm:p-6">
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
												onclick={() => addOptionGroupModalState.setTrue()}
												class="text-primary h-auto p-0">+ Quick Add Group</Button
											>
										</div>
									</div>
								{/snippet}
							</Form.Control>

							<Form.FieldErrors />
						</Form.Field>
						<Form.Field {form} name="packId">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Pack Options <Badge variant="outline">Optional</Badge></Form.Label>
									<div class="space-y-2">
										<Select.Root type="single" bind:value={$formData.packId}>
											<Select.Trigger class="capitalize">
												{$formData.packId
													? data.packs.find((pack) => pack.id === $formData.packId)?.name ||
														'Unknown'
													: 'Select pack'}
											</Select.Trigger>
											<Select.Content>
												{#each data.packs as { name, id }}
													<Select.Item value={id}>{name}</Select.Item>
												{/each}
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
