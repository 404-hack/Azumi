<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import InventoryImage from '$lib/components/InventoryImage.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { inventorySchema } from '$lib/formSchema';
	import SuperDebug, { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Loader2 } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	export let data;
	let productAttributes: { name: string; description: string; id: string }[] = []; // Array to store attributes
	const form = superForm(defaults(zod(inventorySchema)), {
		// validators: zod(inventorySchema),
		dataType: 'json',

		onUpdated: ({ form: { message, valid } }) => {
			if (message) {
				if (message.type === 'error') {
					toast.error(message.text);
				}
			}
		}
	});
	const { form: formData, enhance, delayed, errors } = form;
	$: selectedProductType = {
		label: data.productTypes.results.find((pt) => pt.id === $formData.productType)?.name,
		value: $formData.productType
	};
	let previousProductType: number | null = $formData.productType;

	const getProductAttribute = async (productTypeId: number) => {
		if (productTypeId && productTypeId !== previousProductType) {
			const res = await fetch(`lawal/product_types/${productTypeId}/attributes`);
			const newAttributes = await res.json();
			$formData.attributes = newAttributes;
			previousProductType = productTypeId;
		}
	};

	$: if ($formData.productType && $formData.productType !== previousProductType) {
		getProductAttribute($formData.productType);
	}
</script>

<SuperDebug data={$formData} />

<div class="flex min-h-screen w-full flex-col bg-muted/40">
	<div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
		<div class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
			<form
				use:enhance
				enctype="multipart/form-data"
				method="POST"
				class="mx-auto grid w-full max-w-5xl flex-1 auto-rows-max gap-4"
				action="/seller/products/{$page.params.productSlug}/add-inventory"
			>
				<div class="flex items-center gap-4">
					<Button variant="outline" href="/seller/products" size="icon" class="h-7 w-7">
						<ChevronLeft class="h-4 w-4" />
						<span class="sr-only">Back</span>
					</Button>
					<h1
						class="font-display flex-1 shrink-0 whitespace-nowrap text-xl font-semibold capitalize tracking-tight sm:grow-0"
					>
						{data.inventory.product.name}
					</h1>
					<div class="hidden items-center gap-2 md:ml-auto md:flex">
						<Form.Button size="sm">
							{#if $delayed}
								<Loader2 class="size-4 animate-spin" />
							{:else}
								Create Inventory
							{/if}
						</Form.Button>
					</div>
				</div>
				<div class="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
					<div class="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
						<Card.Root>
							<Card.Header>
								<Card.Title>Inventory Details</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="grid gap-6">
									<Form.Field {form} name="description">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label
													>Description <span class="font-bold text-red-500">*</span></Form.Label
												>
												<Textarea {...props} bind:value={$formData.description} class="min-h-32" />
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="retail_price">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label
													>Retail Price <span class="font-bold text-red-500">*</span></Form.Label
												>
												<Input {...props} type="number" bind:value={$formData.retail_price} />
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="discount_price">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label>Discount Price</Form.Label>

												<Input {...props} type="number" bind:value={$formData.discount_price} />
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="unit">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label
													>Unit in stock <span class="font-bold text-red-500">*</span></Form.Label
												>
												<Input {...props} type="number" bind:value={$formData.unit} />
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field
										{form}
										name="is_digital"
										class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
									>
										<Form.Control>
											{#snippet children({ props })}
												<Checkbox {...props} bind:checked={$formData.is_digital} />
												<Form.Label>Digital?</Form.Label>
												<input name={props.name} value={$formData.is_digital} hidden />
											{/snippet}
										</Form.Control>
									</Form.Field>
									<Form.Field
										{form}
										name="is_active"
										class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
									>
										<Form.Control>
											{#snippet children({ props })}
												<Checkbox {...props} bind:checked={$formData.is_active} />
												<Form.Label>Active</Form.Label>
												<input name={props.name} value={$formData.is_active} hidden />
											{/snippet}
										</Form.Control>
									</Form.Field>
								</div>
							</Card.Content>
						</Card.Root>
						<Card.Root>
							<Card.Header>
								<Card.Title>Product Type <span class="font-bold text-red-500">*</span></Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="grid gap-6 sm:grid-cols-3">
									<div class="grid gap-3">
										<Form.Field {form} name="productType">
											<Form.Control>
												<Select.Root>
													<Select.Trigger id="category" aria-label="Select category">
														Select product type
													</Select.Trigger>
													<Select.Content>
														{#each [{ id: 1, name: 'Physical' }, { id: 2, name: 'Digital' }, { id: 3, name: 'Service' }] as productType}
															<Select.Item value={String(productType.id)} label={productType.name}>
																{productType.name}
															</Select.Item>
														{/each}
													</Select.Content>
												</Select.Root>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									</div>
								</div>
							</Card.Content>
						</Card.Root>

						{#if $formData.attributes.length > 0}
							<div transition:fly>
								<Card.Root>
									<Card.Header>
										<Card.Title>Attributes</Card.Title>
									</Card.Header>
									<Card.Content>
										<Table.Root>
											<Table.Header>
												<Table.Row>
													<Table.Head class="w-[150px]">Name</Table.Head>
													<Table.Head>Value</Table.Head>
												</Table.Row>
											</Table.Header>
											<Table.Body>
												{#each $formData.attributes as attribute, i}
													<Table.Row class="w-full">
														<Table.Cell class="font-semibold capitalize"
															>{attribute.name}</Table.Cell
														>
														<Table.Cell class="w-full">
															<Label class="sr-only">Value</Label>
															<Input
																class="w-full"
																bind:value={$formData.attributes[i].attribute_value}
															/>
															{#if $errors.attributes}
																{#if $errors.attributes[i].attribute_value}
																	<p class="font-semibold text-destructive">
																		{$errors.attributes[i].attribute_value}
																	</p>
																{/if}
															{/if}
														</Table.Cell>
													</Table.Row>
												{/each}
											</Table.Body>
										</Table.Root>
									</Card.Content>
								</Card.Root>
							</div>
						{/if}
					</div>
					<div class="grid auto-rows-max items-start gap-4 lg:gap-8">
						<InventoryImage form={formData} />
						{#if $errors.media?._errors}
							<p class="font-medium text-destructive">
								{$errors.media._errors[0]}
							</p>
						{/if}
					</div>
					<div class="flex items-center justify-center gap-2 md:hidden">
						<Button variant="outline" href="/seller/products" size="sm">Discard</Button>
						<Button size="sm" type="submit">Create inventory</Button>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>
