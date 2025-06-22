<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select';
	import { ArrowLeft, Loader2 } from 'lucide-svelte';
	import { createPromotionSchema } from '$lib/formSchema';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

	let shops = $state([]);
	let loadingShops = $state(false);
	let selectedShops = $state<string[]>([]);

	// Form initialization
	const form = superForm(defaults(zod(createPromotionSchema)), {
		validators: zod(createPromotionSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (!form.valid) return;

			// Check shop selection based on appliesToAllShops
			if (!$formData.appliesToAllShops && (!selectedShops || selectedShops.length === 0)) {
				toast.error('Please select at least one shop');
				return;
			}

			try {
				const formattedData = {
					...form.data,
					shopIds: $formData.appliesToAllShops ? [] : selectedShops,
					value: Number(form.data.value),
					minOrderValue: form.data.minOrderValue ? Number(form.data.minOrderValue) : undefined,
					maxDiscount: form.data.maxDiscount ? Number(form.data.maxDiscount) : undefined,
					usageLimit: form.data.usageLimit ? Number(form.data.usageLimit) : undefined,
					buyQuantity: form.data.buyQuantity ? Number(form.data.buyQuantity) : undefined,
					getQuantity: form.data.getQuantity ? Number(form.data.getQuantity) : undefined,
					creatorType: 'superAdmin'
				};
				
				const response = await client.admin.promotions.$post({
					json: formattedData
				});

				const result = await response.json();
				if (result.success) {
					toast.success('Coupon created successfully');
					await invalidateAll();
					goto('/superadmin/promotions');
				} else {
					toast.error(result.message || 'Failed to create coupon');
				}
			} catch (error) {
				console.error('Error creating coupon:', error);
				toast.error('Failed to create coupon');
			}
		}
	});

	const { form: formData, errors: formErrors, enhance, delayed } = form;

	async function loadShops() {
		loadingShops = true;
		try {
			const response = await client.admin.vendors.$get({
				query: { status: 'APPROVED' }
			});
			const result = await response.json();
			if (result.success) {
				shops = result.data;
			}
		} catch (error) {
			console.error('Error loading shops:', error);
			toast.error('Failed to load shops');
		} finally {
			loadingShops = false;
		}
	}

	function handleShopSelection(shopId: string) {
		const index = selectedShops.indexOf(shopId);
		if (index > -1) {
			selectedShops = selectedShops.filter(id => id !== shopId);
		} else {
			selectedShops = [...selectedShops, shopId];
		}
	}

	function handleAppliesAllShopsChange(value: boolean) {
		$formData.appliesToAllShops = value;
		if (value) {
			// If applies to all shops, clear the selection but keep the data
			selectedShops = [];
		}
	}

	$effect(() => {
		loadShops();
	});

	$effect(() => {
		// Keep form data in sync with selectedShops
		$formData.shopIds = selectedShops;
	});

	function formatDateTimeLocal(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	function getCurrentDateTime(): string {
		return formatDateTimeLocal(new Date());
	}

	function getTomorrowDateTime(): string {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return formatDateTimeLocal(tomorrow);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Create New Coupon</h2>
			<p class="text-muted-foreground">Set up a new promotional code</p>
		</div>
		<Button variant="outline" onclick={() => history.back()}>
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back
		</Button>
	</div>
	<form  use:enhance class="space-y-6">		<!-- Shop Selection -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Shop Selection</h3>
			
			<div class="mb-4">
				<Form.Field {form} name="appliesToAllShops">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center gap-2">
								<Checkbox 
									id="appliesToAllShops" 
									checked={$formData.appliesToAllShops} 
									onCheckedChange={(checked) => handleAppliesAllShopsChange(!!checked)} 
								/>
								<Label 
									for="appliesToAllShops" 
									class="cursor-pointer text-sm font-medium"
								>
									Apply to all shops on the platform
								</Label>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<p class="text-xs text-muted-foreground mt-1">
					When enabled, this promotion will be valid across all shops on the platform
				</p>
			</div>
			
			{#if !$formData.appliesToAllShops}
				<div class="space-y-2">
					<Label class="text-sm font-medium">Select Shops *</Label>
					{#if loadingShops}
						<div class="text-sm">Loading shops...</div>
					{:else if shops.length === 0}
						<div class="text-sm">No approved shops found</div>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
							{#each shops as shop}
								<div class="flex items-center gap-2 p-2 hover:bg-muted rounded">
									<Checkbox 
										id={`shop-${shop.id}`}
										checked={selectedShops.includes(shop.id)}
										onCheckedChange={() => handleShopSelection(shop.id)}
									/>
									<Label for={`shop-${shop.id}`} class="cursor-pointer text-sm">
										{shop.name}
									</Label>
								</div>
							{/each}
						</div>
						<div class="text-xs mt-1">
							{selectedShops.length} shop{selectedShops.length !== 1 ? 's' : ''} selected
						</div>
					{/if}
				</div>
			{/if}
		</Card>

		<!-- Basic Information -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Basic Information</h3>
			<div class="grid gap-6">
				<div class="grid gap-4 sm:grid-cols-2">
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Promotion Name *</Form.Label>
								<Input {...props} bind:value={$formData.name} placeholder="e.g. Welcome Discount" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="code">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Coupon Code *</Form.Label>
								<Input {...props} bind:value={$formData.code} placeholder="e.g. WELCOME50" class="uppercase" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<Form.Field {form} name="type">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Discount Type *</Form.Label>					<Select.Root bind:value={$formData.type}>
						<Select.Trigger class="w-full">
							{#if $formData.type}
								{$formData.type === 'percentage' ? 'Percentage Discount' :
								 $formData.type === 'fixed' ? 'Fixed Amount' :
								 $formData.type === 'bogo' ? 'Buy One Get One' :
								 $formData.type === 'minimum_spend' ? 'Minimum Spend Discount' :
								 'Select discount type'}
							{:else}
								Select discount type
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="percentage">Percentage Discount</Select.Item>
							<Select.Item value="fixed">Fixed Amount</Select.Item>
							<Select.Item value="bogo">Buy One Get One</Select.Item>
							<Select.Item value="minimum_spend">Minimum Spend Discount</Select.Item>
						</Select.Content>
					</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="costBearer">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Cost Bearer *</Form.Label>					<Select.Root bind:value={$formData.costBearer}>
						<Select.Trigger class="w-full">
							{#if $formData.costBearer}
								{$formData.costBearer === 'VENDOR' ? 'Vendor' :
								 $formData.costBearer === 'PLATFORM' ? 'Platform' :
								 $formData.costBearer === 'SHARED' ? 'Shared' :
								 'Who bears the cost?'}
							{:else}
								Who bears the cost?
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="VENDOR">Vendor</Select.Item>
							<Select.Item value="PLATFORM">Platform</Select.Item>
							<Select.Item value="SHARED">Shared</Select.Item>
						</Select.Content>
					</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<Form.Field {form} name="value">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Discount Value *</Form.Label>
								<Input
									{...props}
									type="number"
									step="0.01"
									min="0"
									bind:value={$formData.value}
									placeholder={$formData.type === 'percentage' ? 'Enter percentage (e.g. 10)' : 'Enter amount'}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					{#if $formData.type === 'percentage'}
						<Form.Field {form} name="maxDiscount">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Maximum Discount Amount</Form.Label>
									<Input
										{...props}
										type="number"
										step="0.01"
										min="0"
										bind:value={$formData.maxDiscount}
										placeholder="Enter max discount amount"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{/if}
				</div>

				{#if $formData.type === 'bogo'}
					<div class="grid gap-4 sm:grid-cols-2">
						<Form.Field {form} name="buyQuantity">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Buy Quantity *</Form.Label>
									<Input
										{...props}
										type="number"
										min="1"
										bind:value={$formData.buyQuantity}
										placeholder="Number of items to buy"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="getQuantity">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Get Quantity *</Form.Label>
									<Input
										{...props}
										type="number"
										min="1"
										bind:value={$formData.getQuantity}
										placeholder="Number of items to get free"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				{/if}

				<Form.Field {form} name="description">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Description</Form.Label>
							<Textarea
								{...props}
								bind:value={$formData.description}
								placeholder="Enter promotion description"
								rows={3}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		</Card>

		<!-- Usage Rules -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Usage Rules</h3>
			<div class="grid gap-6">
				<div class="grid gap-4 sm:grid-cols-2">
					<Form.Field {form} name="minOrderValue">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Minimum Order Value</Form.Label>
								<Input
									{...props}
									type="number"
									step="0.01"
									min="0"
									bind:value={$formData.minOrderValue}
									placeholder="Enter minimum order value"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="usageLimit">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Usage Limit</Form.Label>
								<Input
									{...props}
									type="number"
									min="1"
									bind:value={$formData.usageLimit}
									placeholder="Total usage limit (leave empty for unlimited)"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<Form.Field {form} name="startDate">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Start Date *</Form.Label>
								<Input
									{...props}
									type="datetime-local"
									bind:value={$formData.startDate}
									min={getCurrentDateTime()}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="endDate">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>End Date *</Form.Label>
								<Input
									{...props}
									type="datetime-local"
									bind:value={$formData.endDate}
									min={$formData.startDate || getTomorrowDateTime()}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>				<div class="flex flex-col gap-4">
					<Form.Field {form} name="isActive">
						<Form.Control>
							{#snippet children({ props })}
								<div class="flex items-center gap-2">
									<Checkbox
										id="isActive"
										checked={$formData.isActive}
										onCheckedChange={(checked) => $formData.isActive = !!checked}
									/>
									<Label for="isActive" class="cursor-pointer text-sm font-medium">
										Enable promotion
									</Label>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
						<p class="text-xs text-muted-foreground mt-1">
							Even within the date range, a promotion must be enabled to be usable. 
							This allows you to pause promotions temporarily without changing dates.
						</p>
					</Form.Field>
					
					<Form.Field {form} name="isFirstOrderOnly">
						<Form.Control>
							{#snippet children({ props })}
								<div class="flex items-center gap-2">
									<Checkbox
										id="isFirstOrderOnly"
										checked={$formData.isFirstOrderOnly}
										onCheckedChange={(checked) => $formData.isFirstOrderOnly = !!checked}
									/>
									<Label for="isFirstOrderOnly" class="cursor-pointer text-sm font-medium">
										First order only
									</Label>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					{#if $formData.isFirstOrderOnly}
						<div class="pl-6 text-xs text-muted-foreground">
							{#if $formData.appliesToAllShops}
								This promotion will only apply to the customer's first order on the platform
							{:else}
								This promotion will only apply to the customer's first order at the selected shop(s)
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</Card>
		<div class="flex justify-end gap-4">
			<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
			<Form.Button type="submit" disabled={$delayed || (!$formData.appliesToAllShops && selectedShops.length === 0)}>
				{#if $delayed}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Create Coupon
			</Form.Button>
		</div>
	</form>
</div>
